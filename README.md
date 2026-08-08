# SPECTRA — Radio Frequency Allocation Explorer

An interactive, zoomable atlas of the radio spectrum (3 kHz – 300 GHz), modeled on the
NTIA *United States Frequency Allocations* wall chart. Single self-contained HTML page,
no dependencies, no network calls.

- **293 allocation bands** with stacked co-allocated ITU services (CAPITALS = primary,
  lowercase = secondary), nicknames, and educational notes.
- **Five regulators**: FCC (default), Ofcom (UK), MIC (Japan), ACMA (Australia),
  ISED (Canada). Non-US tables are patch-sets over the FCC base; bands that differ
  are dash-marked and show an FCC comparison in their detail card.
- Log-scale zoom/pan (wheel, pinch, drag, keyboard), minimap, landmark pins,
  jump chips, text + frequency search, service-family highlighting, ITU/IEEE band
  rulers, wavelength ruler, ISM and passive-quiet-band overlays.
- Light and dark themes; colorblind-validated service palette.

## Build

```
./build.sh          # concatenates src/ into index.html
```

`src/part1.html` — markup + CSS · `src/data.js` — FCC base table ·
`src/data2.js` — authority patch-sets, landmarks, rulers · `src/app.js` — engine.

## Deploy

Copy `index.html` anywhere a web server can see it. It is fully static.

*Educational model — simplified from the official tables (47 CFR §2.106, Ofcom FAT,
MIC plans, ACMA table, ISED CTFA). Not for engineering or licensing decisions.*
