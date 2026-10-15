# Asset sources — v12

No paid API, API key, Cesium/Google Photorealistic Tiles, or photographic HERO background is used.

## Same-origin core

The city, Fuller dome, six-floor laboratory and interaction props are bundled as GLB under `assets/architecture/`. Portfolio thumbnails are bundled under `assets/previews/` and are mapped only onto physical guestbook / display / laptop / workbook surfaces.

## Free PBR enhancement layer

Runtime refinement uses the public `Gunratna/Gunratna.github.io` mirror through jsDelivr. The repository documents its `public/lab/` assets as CC0 1.0 from Poly Haven.

- Mid Century Lounge Chair — Poly Haven CC0
- Metal Office Desk — Poly Haven CC0
- Wooden Bookshelf Worn — Poly Haven CC0
- Brown Photostudio 02 HDRI — Poly Haven CC0
- PBR material sets: `wood_table_001`, `fabric_leather_02`, `painted_plaster_wall`, `metal_plate`

The enhancement layer is non-blocking. If a free remote enhancement is unavailable, the bundled core scene still functions.

## Three.js

- Three.js 0.186.1 via jsDelivr import map
- `GLTFLoader`
- `RGBELoader`
