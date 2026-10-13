# V1-29 approved visual assets

This directory localizes the visual inputs used by the approved Next.js V1-29 shell. The mini program must reference these files directly; they are not redraws or character placeholders.

- `v1-29/ichi-camera-cutout.png`: the approved transparent camera artwork used by the import hero.
- `v1-29/ichi-avatar.png`: the approved replacement avatar served by `/api/v1-29-avatar` in the web baseline.
- `v1-29/ichi-mascot-large-watermark.png`: a deterministic white watermark derivative of the approved large-prize mascot. The original white four-point star eye pixels are transparent cutouts; the source mascot remains unchanged.
- `v1-29/map-placeholder.svg`: the source map placeholder localized from the approved page shell.
- `icons/*.svg`: the exact Phosphor icon variants named by the source HTML and its V1-29 bridge (`bold` or `fill` as used there), with only the resolved source color baked into each local file.
- `icons/magnifying-glass-gray.svg`: the Phosphor Icons Regular `magnifying-glass` path copied from the official Phosphor icon catalog for the V2 map search leading icon; Phosphor is MIT-licensed. The path is unchanged and only the resolved ICHI muted color is baked into the local asset.
- `icons/file-text-gray.svg`: the Phosphor Icons Bold `file-text` path used beside the marker card's "详情信息" action; Phosphor is MIT-licensed and the local file only bakes the resolved dark source color.
- `fonts/Montserrat-latin-400-900.woff2`: the Montserrat Latin variable font declared by the source page, localized for the mini-program package. Chinese glyphs continue through the same system fallback chain as the web page.

The bridge changes `ph-user-astronaut` to `ph-user-circle` and `ph-cloud` to `ph-gear-six`; the mini program therefore uses the resolved `user-circle` and `gear-six` assets rather than the stale classes in the original HTML.

- `icons/current-location.svg` and `.png`: local centered blue/white circle for the checked private current-position binding; source SVG and 3× antialiased transparent PNG use the same geometry, with the native anchor at the center.

- `icons/official-network.svg`: ICHI Phase3 official network source globe, used in the existing contributor display slot for `NETWORK_SOURCE / OFFICIAL_CURATED`; it has no player identity or avatar backing.
