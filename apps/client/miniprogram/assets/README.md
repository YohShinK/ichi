# V1-29 approved visual assets

This directory localizes the visual inputs used by the approved Next.js V1-29 shell. The mini program must reference these files directly; they are not redraws or character placeholders.

- `v1-29/ichi-camera-cutout.png`: the approved transparent camera artwork used by the import hero.
- `v1-29/ichi-avatar.png`: the approved replacement avatar served by `/api/v1-29-avatar` in the web baseline.
- `v1-29/map-placeholder.svg`: the source map placeholder localized from the approved page shell.
- `icons/*.svg`: the exact Phosphor icon variants named by the source HTML and its V1-29 bridge (`bold` or `fill` as used there), with only the resolved source color baked into each local file.
- `fonts/Montserrat-latin-400-900.woff2`: the Montserrat Latin variable font declared by the source page, localized for the mini-program package. Chinese glyphs continue through the same system fallback chain as the web page.

The bridge changes `ph-user-astronaut` to `ph-user-circle` and `ph-cloud` to `ph-gear-six`; the mini program therefore uses the resolved `user-circle` and `gear-six` assets rather than the stale classes in the original HTML.
