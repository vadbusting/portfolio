# QA REPORT — v12 focus/depth/entrance pass

## Static and structural checks

- PASS — `hero-v12.js` syntax (`node --check`)
- PASS — `start-3002.command` shell syntax
- PASS — missing local HTML references: 0
- PASS — no `3dassets.dev` dependency
- PASS — no `3D ASSET INCOMPLETE` dead-end
- PASS — index points only to `hero-v12.css` / `hero-v12.js`
- PASS — obsolete v11 JS/CSS and GLB backup files removed

## Original detail-page integrity

SHA-256 byte comparison with the original `portfolio-main.zip`:

- `about.html` — MATCH — `4d264e6b30b4e0e8fa018327f9225f4c88b598a6a1857ebaeda9b993b8b9fad1`
- `presentation.html` — MATCH — `1bb180c3aad1d70398b01a271a35a9eb9d0bce8cb45c8d38ec683c33fec7ea78`
- `lp.html` — MATCH — `1e455c643367a9aa61748bfac0ff272a146fc062abd373f332664739b107c307`
- `works.html` — MATCH — `2d123d38a5cbcc8ec2ba768511bae8e9e458b5814022ee60fc8ed098351519b3`
- `other.html` — MATCH — `f7661090a893365cb98bde8fc7c759054c6d3123e17c73c9c43417c143b9b6bd`
- `script.js` — MATCH — `dec271a5bf8f5d0c28c8f22ec1325e024882bb786406a836f100da6546af248c`
- `style.css` — MATCH — `c033f5807df187c35de47bbd3af969b8808f0a2522cc021f443ddaac5971c244`

## Thumbnail depth and focus

- Preview planes use normal `depthTest=true` and `depthWrite=true`.
- `renderOrder` forcing and negative polygon offset were removed.
- Preview planes use `FrontSide`, preventing back-side bleed-through.
- All six source image aspect ratios are matched by the physical screen/book plane.
- At a final stop, camera distance is solved from FOV + viewport aspect ratio so the limiting edge reaches about 72% of half-viewport; the entire thumbnail therefore remains visible instead of being cropped.
- The thumbnail remains in the 3D depth graph; furniture/doors in front can occlude it normally instead of the image appearing on top of them.

## Dome entrance

Triangle inspection of the bundled `dome.glb` confirms the low front-centre opening contains no shell/frame triangles in the entrance aperture. A full-scale vestibule and two sliding glass doors occupy that opening. The first camera path crosses the threshold before focusing on the reception guestbook.

## Camera geometry inspection

VTK off-screen renders were used to inspect the bundled room/interactions GLBs from the PRESENTATION, LP, WEB, DIRECTION and OTHER target cameras. The work object is centred in the view at each target. WEB no longer has the previous chair/desk obstruction on its direct sight line.

## Pacing

- Scroll track: `10500dvh`
- Each stage: 30% stationary hold → 40% travel/elevator motion → 30% stationary hold
- Up-scroll runs the same path in reverse.

## Colour direction

The HERO tint/material palette is restricted to walnut, dark brown, ivory/off-white, charcoal, aluminium and warm neutral stone. Previous blue/yellow/green accent-block styling is not used.

## Runtime limitation

This execution container cannot resolve external CDN DNS, so the final browser frame with the optional Poly Haven/jsDelivr PBR enhancement cannot be screen-captured here. Core GLB geometry, camera paths, viewport-fit math, local references and source-page integrity were checked. Final Three.js visual quality still has to be judged in the user's normal Chrome on port 3002.
