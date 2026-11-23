import { readFile, writeFile, access, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = dirname(fileURLToPath(import.meta.url));
const sites = JSON.parse(await readFile(join(root, 'gallery-inventory.json'), 'utf8'));
const environmentCount = Math.max(...sites.map(site => (site.backends || []).length));
assert(sites.every(site => (site.backends || []).length === environmentCount), 'Each site must provide the same number of backend origins so environment pairs stay aligned.');
const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const seen = new Set();
async function validate(nodes, site) {
   for (const node of nodes) {
      assert(node.title);
      if (node.path) {
         assert(!node.path.includes('..') && node.path.endsWith('.html'));
         const key = `${site.folder}/${node.path}`;
         assert(!seen.has(key), `Duplicate gallery: ${key}`);
         seen.add(key);
         await access(join(root, '..', key));
      }
      await validate(node.children || [], site);
   }
}
for (const site of sites) await validate(site.children, site);
async function checkCoverage(directory, folder, prefix = '') {
   for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = prefix + entry.name;
      if (entry.isDirectory()) await checkCoverage(join(directory, entry.name), folder, path + '/');
      else if (entry.name.endsWith('.html')) {
         const html = await readFile(join(directory, entry.name), 'utf8');
         if (/class="gallery(?:[" -])/.test(html)) assert(seen.has(`${folder}/${path}`), `Missing gallery: ${folder}/${path}`);
      }
   }
}
for (const site of sites) await checkCoverage(join(root, '..', site.folder), site.folder);

function treeBehavior() {
   const parameters = new URLSearchParams(location.search);
   const embedded = parameters.get('overlay') === '1' && window.parent !== window;
   const sites = JSON.parse(document.getElementById('sites').textContent);
   const home = document.body.dataset.site;
   const homeSite = sites.find(site => site.folder === home);
   const environment = homeSite.bases.findIndex(base => location.href.startsWith(base));
   const normalize = path => decodeURI(path).replace(/(^|\/)index(?:\.html)?$/, '$1').replace(/\.html$/, '').replace(/\/$/, '');
   const localBase = site => new URL(`/${site.folder}/`, location.origin);
   const baseFor = site => new URL(environment === -1 ? localBase(site) : site.bases[environment]);
   let current;
   for (const link of document.querySelectorAll('a[data-path]')) {
      const site = sites.find(site => site.folder === link.dataset.site);
      link.href = new URL(link.dataset.path, baseFor(site)).href;
      if (embedded) link.target = '_parent';
      if (site.folder === home && normalize(link.dataset.path) === normalize(parameters.get('current') || '')) {
         current = link;
         link.setAttribute('aria-current', 'page');
         const label = document.createElement('span');
         label.className = 'here';
         label.textContent = ' — You are here';
         link.append(label);
      }
   }
   const branches = Array.from(document.querySelectorAll('details'));
   document.getElementById('expand').onclick = () => branches.forEach(branch => { branch.open = true; });
   document.getElementById('collapse').onclick = () => branches.forEach(branch => { branch.open = false; });
   const close = document.getElementById('close');
   close.hidden = !embedded;
   const dismiss = () => window.parent.postMessage('close-gallery-tree', location.origin);
   close.onclick = dismiss;
   document.addEventListener('keydown', event => {
      if (embedded && event.key === 'Escape') {
         event.preventDefault();
         dismiss();
      }
   });
   requestAnimationFrame(() => {
      current?.scrollIntoView({ block: 'center' });
      if (embedded) close.focus({ preventScroll: true });
   });
}
function render(nodes, site, currentSite) {
   return '<ul>' + nodes.map(node => {
      const label = node.path ? `<a data-site="${site.folder}" data-path="${escape(node.path)}" href="${escape(site.folder === currentSite ? node.path : site.origin + node.path)}">${escape(node.title)}</a>` : escape(node.title);
      return `<li>${node.children ? `<details open><summary>${label}</summary>${render(node.children, site, currentSite)}</details>` : label}</li>`;
   }).join('\n') + '</ul>';
}
const style = `*{box-sizing:border-box}body{margin:0;background:#EFEFEF;color:#292721;font:16px/1.5 Arial,sans-serif}header{position:sticky;top:0;z-index:1;background:#EFEFEF;border-bottom:1px solid #ccc;padding:1rem 1.25rem}h1{font-size:1.4rem;margin:0 2rem .5rem 0}p{margin:.4rem 0}button{font:inherit;cursor:pointer;padding:.35rem .65rem}#expand,#collapse{height:1.72rem;line-height:1;padding:0 .65rem}#close{position:absolute;right:.75rem;top:.65rem;font-size:1.5rem;line-height:1}nav{padding:.75rem 1.25rem 2rem}ul{list-style:none;margin:.25rem 0;padding-left:1.25rem;border-left:1px solid #d6d1c5}nav>ul{padding:0;border:0}li{margin:.3rem 0}summary{cursor:pointer}a{color:#245784;text-decoration:underline;padding:.15rem .2rem;overflow-wrap:anywhere}a:hover{background:#e7edf1}a[aria-current]{background:#ffe39a;color:#292721;font-weight:bold;border-radius:3px}.here{font-size:.85em;white-space:nowrap}a:focus-visible,button:focus-visible,summary:focus-visible{outline:3px solid #245784;outline-offset:2px}@media(max-width:500px){header,nav{padding-left:.75rem;padding-right:.75rem}ul{padding-left:.85rem}li{margin:.55rem 0}.here{white-space:normal}}`;
for (const site of sites) {
   const html = `<!doctype html>
<!-- Generated file. Do not edit labels here.
     Edit title values in jimandlaurie.co.nf/gallery-inventory.json,
     then run from that folder: node build-gallery-tree.mjs -->
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Tree View of Galleries</title>
<style>${style}</style>
</head>
<body data-site="${site.folder}">
<header><h1>Tree view of galleries</h1><button id="close" type="button" aria-label="Close tree view" hidden>&times;</button><button id="expand" type="button">Expand all</button> <button id="collapse" type="button">Collapse all</button></header>
<nav aria-label="All galleries"><ul>${sites.map(branch => `<li><details open><summary>${escape(branch.title)}</summary>${render(branch.children, branch, site.folder)}</details></li>`).join('\n')}</ul></nav>
<script type="application/json" id="sites">${JSON.stringify(sites.map(({ folder, origin, backends = [] }) => ({ folder, bases: [origin, ...backends] })))}</script>
<script>(${treeBehavior.toString()})();</script>
</body>
</html>
`;
   const destination = join(root, '..', site.folder);
   await writeFile(join(destination, 'tree.html'), html);
   if (destination !== root) await writeFile(join(destination, 'tree-overlay.js'), await readFile(join(root, 'tree-overlay.js')));
}
console.log(`Validated ${seen.size} gallery/group pages; generated both tree pages and synchronized overlay script.`);
