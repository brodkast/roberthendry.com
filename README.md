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

## Isometric figures

Each case study has one original isometric figure, drawn on the [hairline](https://github.com/lucasmarkes/hairline) kernel (MIT, `vendor/hairline-kernel.js`). All twelve are defined in `iso-figures.js`, keyed by page name. A slot is `<div data-iso="radial">`: the top graphic of each case-study page, and a chip on each card in `index.html`. Colours are the `--hairline-*` properties in the `hl-css` style block of each page.
