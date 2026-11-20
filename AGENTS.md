# Gallery navigation

- The local folders `jimandlaurie.co.nf` and sibling `jimandlaurie.50webs` deploy to `https://jljcd.com/` and `https://newsletters.jljcd.com/` respectively.
- `gallery-inventory.json` in this folder is the authoritative inventory for both gallery trees. Keep individual images out of it.
- Run `node build-gallery-tree.mjs` from this folder after changing the inventory, tree generator, or `tree-overlay.js`. This validates gallery coverage and paths, generates both root-level `tree.html` pages, and copies the overlay script to the sibling site. Do not edit generated copies independently.
- Run `node verify-gallery-tree.mjs` for local/public link resolution, current-page highlighting, tree controls, close messaging, and copy synchronization checks. These are simulated DOM tests, not browser layout/focus tests.
- Modern galleries load the root overlay script through `pbase/pbase-gallery.js` or the sibling site's `gallery.js`. Older galleries in `our-boys` load it directly.
- Gallery navigation must work both on public domains and under localhost sibling-folder URLs. All tree branches start expanded.
- Node.js is available; the `python` command currently points to the Windows Store alias rather than an installed interpreter. These site folders are not a Git repository.
