import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { runInNewContext } from 'node:vm';
import assert from 'node:assert/strict';

const root = dirname(fileURLToPath(import.meta.url));
const sites = JSON.parse(await readFile(join(root, 'gallery-inventory.json'), 'utf8'));
const flatten = nodes => nodes.flatMap(node => [node, ...flatten(node.children || [])]);
const pages = sites.flatMap(site => flatten(site.children).filter(node => node.path));
const descriptors = sites.map(site => ({ folder: site.folder, bases: [site.origin, ...(site.backends || [])] }));
const environmentCount = Math.max(...descriptors.map(site => site.bases.length));
const environments = [
   ...Array.from({ length: environmentCount }, (_, index) => ({
      name: index === 0 ? 'canonical' : `backend ${index}`,
      baseFor: site => site.bases[index]
   })),
   {
      name: 'localhost',
      baseFor: site => `https://localhost/${site.folder}/`
   }
];
let cases = 0;
for (const site of sites) {
   const html = await readFile(join(root, '..', site.folder, 'tree.html'), 'utf8');
   const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
   assert.equal((html.match(/data-path=/g) || []).length, pages.length);
   assert(!/<details(?! open)/.test(html));
   const data = html.match(/id="sites">(.*?)<\/script>/)[1];
   for (const environment of environments) {
      for (const page of flatten(site.children).filter(node => node.path)) {
         const base = environment.baseFor(descriptors.find(descriptor => descriptor.folder === site.folder));
         const location = new URL(`tree.html?overlay=1&current=${encodeURIComponent(page.path.replace(/\.html$/, ''))}`, base);
         const links = sites.flatMap(branch => flatten(branch.children).filter(node => node.path).map(node => ({
            dataset: { site: branch.folder, path: node.path },
            setAttribute(name, value) { this[name] = value; },
            append(label) { this.label = label; },
            scrollIntoView() { this.scrolled = true; }
         })));
         const controls = Object.fromEntries(['close', 'expand', 'collapse'].map(id => [id, { focus() {} }]));
         const branches = [{ open: true }, { open: true }];
         const handlers = {};
         let dismissed = false;
         const document = {
            body: { dataset: { site: site.folder } },
            getElementById: id => id === 'sites' ? { textContent: data } : controls[id],
            querySelectorAll: selector => selector === 'details' ? branches : links,
            createElement: () => ({}),
            addEventListener: (event, handler) => { handlers[event] = handler; }
         };
         const parent = { postMessage(message, origin) { assert.equal(message, 'close-gallery-tree'); assert.equal(origin, location.origin); dismissed = true; } };
         runInNewContext(script, { document, location, URL, URLSearchParams, window: { parent }, requestAnimationFrame: callback => callback() });
         const current = links.filter(link => link['aria-current'] === 'page');
         assert.equal(current.length, 1, `${environment.name}: current page missing for ${page.path}`);
         assert.equal(current[0].dataset.path, page.path);
         assert(current[0].scrolled);
         assert.equal(current[0].label.textContent, ' — You are here');
         for (const link of links) {
            const targetSite = descriptors.find(descriptor => descriptor.folder === link.dataset.site);
            const expectedBase = environment.baseFor(targetSite);
            assert.equal(link.href, new URL(link.dataset.path, expectedBase).href, `${environment.name}: bad URL for ${link.dataset.site}/${link.dataset.path}`);
            assert.equal(link.target, '_parent');
         }
         controls.collapse.onclick();
         assert(branches.every(branch => !branch.open));
         controls.expand.onclick();
         assert(branches.every(branch => branch.open));
         controls.close.onclick();
         assert(dismissed);
         dismissed = false;
         handlers.keydown({ key: 'Escape', preventDefault() {} });
         assert(dismissed);
         cases++;
      }
   }
}
assert.equal(await readFile(join(root, 'tree-overlay.js'), 'utf8'), await readFile(join(root, '..', sites[1].folder, 'tree-overlay.js'), 'utf8'));
console.log(`Passed ${cases} current-page cases across canonical, backend, and localhost environments; verified URLs, controls, close behavior, and script synchronization.`);
