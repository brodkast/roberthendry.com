# roberthendry.com

Oscar Hendry's UX portfolio. Served by GitHub Pages at https://roberthendry.com (oscarhendry.com forwards here).

## Publishing

Push to `main` and `.github/workflows/deploy-pages.yml` publishes the repo to roberthendry.com, usually within a minute.

- A file's path in the repo is its path on the site (`radial.html` → `roberthendry.com/radial.html`).
- To update a page, overwrite the file at its existing path. Git history keeps earlier versions.
- Deleting a file from the repo removes it from the site on the same push.
- Changes only to `.github/` or this README do not deploy.
- To redeploy without changes, run the workflow from the Actions tab.
- To roll back, `git revert` the commit and push.

`CNAME` holds the custom domain; leave it in place.

## Hairline figures

Each case study has one isometric line figure from [hairline](https://github.com/lucasmarkes/hairline) (MIT, `vendor/hairline.js`): a chip on its card in `index.html` and a figure in its page hero. A slot is `<div data-hl="vault">`, where the value is a hairline figure name; `hairline-site.js` mounts it when it scrolls into view. Colours are the `--hairline-*` properties in the `hl-css` style block of each page.
