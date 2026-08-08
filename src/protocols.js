/* ── SPECTRA protocol encyclopedia ────────────────────────────────────────────
   Parameterized canvas generators + a protocol registry. Each protocol card is
   pure data; the ~9 generators below draw every visual from typed specs.
   Uses COLORS (theme tokens) from app.js at call time. */

/* ── canvas helper ── */
function mkviz(parent, caption, w, h){
  const fig = document.createElement("figure");
  fig.className = "viz";
  const cv = document.createElement("canvas");
  const dpr = window.devicePixelRatio || 1;
  cv.width = w * dpr; cv.height = h * dpr;
  cv.style.width = w + "px"; cv.style.height = h + "px";
  fig.appendChild(cv);
  if (caption){
    const fc = document.createElement("figcaption");
    fc.textContent = caption;
    fig.appendChild(fc);
  }
  parent.appendChild(fig);
  const ctx = cv.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}
function lcg(seed){ let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

/* ── generator: channel plan ──
   spec: {lo, hi, unit, rows:[{name, color, shape:'lobe'|'rect', chans:[{f, bw, label, hl}]}]} */
function vizChannels(parent, spec, caption){
  const rowH = 50, axisH = 18;
  const { ctx, w, h } = mkviz(parent, caption, 300, spec.rows.length * rowH + axisH);
  const X = f => (f - spec.lo) / (spec.hi - spec.lo) * (w - 8) + 4;
  spec.rows.forEach((row, ri) => {
    const yTop = ri * rowH, y1 = (ri + 1) * rowH - 4;
    const apex = rowH - 31;                       // name (top 11px) / labels / lobes zones
    ctx.fillStyle = COLORS.muted;
    ctx.font = "600 9px system-ui"; ctx.textAlign = "left"; ctx.textBaseline = "top";
    ctx.fillText(row.name.toUpperCase(), 4, yTop + 1);
    for (const ch of row.chans){
      const x0 = X(ch.f - ch.bw / 2), x1 = X(ch.f + ch.bw / 2), cx = X(ch.f);
      ctx.fillStyle = ch.hl ? COLORS.accent : row.color;
      ctx.globalAlpha = row.shape === "lobe" ? .4 : .75;
      if (row.shape === "lobe"){
        ctx.beginPath();
        ctx.moveTo(x0, y1);
        ctx.quadraticCurveTo(cx, y1 - apex * 2, x1, y1);
        ctx.fill();
      } else {
        ctx.fillRect(x0, y1 - apex - 4, x1 - x0 - 1, apex + 4);
      }
      ctx.globalAlpha = 1;
      if (ch.label){
        ctx.fillStyle = ch.hl ? COLORS.accent : COLORS.ink;
        ctx.font = (ch.hl ? "700 " : "400 ") + "8.5px ui-monospace,Menlo,monospace";
        ctx.textAlign = "center"; ctx.textBaseline = "bottom";
        ctx.fillText(ch.label, cx, y1 - apex - 6);
      }
    }
  });
  const ay = h - axisH + 3;
  ctx.strokeStyle = COLORS.line;
  ctx.beginPath(); ctx.moveTo(4, ay); ctx.lineTo(w - 4, ay); ctx.stroke();
  ctx.fillStyle = COLORS.muted;
  ctx.font = "8.5px ui-monospace,Menlo,monospace";
  ctx.textAlign = "left"; ctx.textBaseline = "top";
  ctx.fillText(spec.loLbl || fmtFreq(spec.lo), 4, ay + 3);
  ctx.textAlign = "right";
  ctx.fillText(spec.hiLbl || fmtFreq(spec.hi), w - 4, ay + 3);
}

/* ── generator: time-domain waveform ── */
function vizWave(parent, type, caption){
  const { ctx, w, h } = mkviz(parent, caption, 300, 74);
  const mid = h / 2, A = h * .36;
  ctx.strokeStyle = COLORS.line;
  ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(w, mid); ctx.stroke();
  ctx.strokeStyle = COLORS.accent; ctx.lineWidth = 1.4;
  ctx.beginPath();
  let phase = 0;
  const bits = [1,0,1,1,0,1,0,0];
  for (let x = 0; x <= w; x++){
    const t = x / w;
    let y;
    if (type === "am"){
      const env = .55 + .45 * Math.sin(t * Math.PI * 4);
      y = mid - Math.sin(t * Math.PI * 60) * A * env;
    } else if (type === "fm"){
      phase += (30 + 24 * Math.sin(t * Math.PI * 4)) * Math.PI / w * 2;
      y = mid - Math.sin(phase) * A;
    } else if (type === "fsk"){
      const bit = bits[Math.floor(t * 8) % 8];
      phase += (bit ? 52 : 22) * Math.PI / w * 2;
      y = mid - Math.sin(phase) * A;
    } else if (type === "psk"){
      const bit = bits[Math.floor(t * 8) % 8];
      y = mid - Math.sin(t * Math.PI * 56 + (bit ? Math.PI : 0)) * A;
    } else if (type === "chirp"){
      const ct = (t * 4) % 1;
      phase += (8 + ct * 64) * Math.PI / w * 2;
      y = mid - Math.sin(phase) * A;
    } else { /* pulse */
      const on = (t * 5) % 1 < .18;
      y = mid - (on ? Math.sin(t * Math.PI * 120) * A : 0);
    }
    x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();
  if (type === "am"){
    ctx.strokeStyle = COLORS.muted; ctx.setLineDash([3,3]); ctx.beginPath();
    for (let x = 0; x <= w; x++){
      const env = .55 + .45 * Math.sin(x / w * Math.PI * 4);
      const y = mid - A * env;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke(); ctx.setLineDash([]);
  }
  if (type === "fsk" || type === "psk"){
    ctx.fillStyle = COLORS.muted; ctx.font = "8.5px ui-monospace,monospace";
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    bits.forEach((b, i) => ctx.fillText(String(b), (i + .5) / 8 * w, 2));
  }
  if (type === "pulse"){
    ctx.fillStyle = COLORS.muted; ctx.font = "8.5px system-ui";
    ctx.textAlign = "left"; ctx.textBaseline = "top";
    ctx.fillText("pulse", 4, 2);
    ctx.fillText("← listen for echo →", w * .25, 2);
  }
}

/* ── generator: constellation ── */
function vizConst(parent, m, caption){
  const { ctx, w, h } = mkviz(parent, caption, 130, 130);
  const cx = w / 2, cy = h / 2;
  ctx.strokeStyle = COLORS.line;
  ctx.beginPath(); ctx.moveTo(cx, 6); ctx.lineTo(cx, h - 6); ctx.moveTo(6, cy); ctx.lineTo(w - 6, cy); ctx.stroke();
  ctx.fillStyle = COLORS.muted; ctx.font = "8.5px system-ui";
  ctx.textAlign = "left"; ctx.textBaseline = "top"; ctx.fillText("Q", cx + 4, 4);
  ctx.textAlign = "right"; ctx.fillText("I", w - 4, cy + 3);
  ctx.fillStyle = COLORS.accent;
  if (m === 8){
    for (let i = 0; i < 8; i++){
      const a = i / 8 * Math.PI * 2;
      ctx.beginPath(); ctx.arc(cx + Math.cos(a) * 40, cy + Math.sin(a) * 40, 3, 0, 7); ctx.fill();
    }
  } else {
    const n = Math.round(Math.sqrt(m)), gap = 92 / (n - 1), r = m > 64 ? 1.4 : 3;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++){
      ctx.beginPath();
      ctx.arc(cx - 46 + i * gap, cy - 46 + j * gap, r, 0, 7);
      ctx.fill();
    }
  }
}

/* ── generator: OFDM subcarrier comb ── */
function vizOFDM(parent, n, caption){
  const { ctx, w, h } = mkviz(parent, caption, 300, 66);
  const base = h - 14, sw = (w - 16) / n;
  for (let i = 0; i < n; i++){
    const cx = 8 + (i + .5) * sw;
    ctx.strokeStyle = i === Math.floor(n / 2) ? COLORS.accent : COLORS.muted;
    ctx.lineWidth = i === Math.floor(n / 2) ? 1.6 : 1;
    ctx.beginPath();
    for (let x = -sw * 1.6; x <= sw * 1.6; x += 1){
      const u = x / sw * Math.PI;
      const v = u === 0 ? 1 : Math.abs(Math.sin(u) / u);
      const y = base - v * (h - 26);
      x === -sw * 1.6 ? ctx.moveTo(cx + x, y) : ctx.lineTo(cx + x, y);
    }
    ctx.stroke();
  }
  ctx.strokeStyle = COLORS.line;
  ctx.beginPath(); ctx.moveTo(4, base); ctx.lineTo(w - 4, base); ctx.stroke();
  ctx.fillStyle = COLORS.muted; ctx.font = "8.5px system-ui";
  ctx.textAlign = "center"; ctx.textBaseline = "top";
  ctx.fillText("orthogonal subcarriers — each peak lands on its neighbors’ nulls", w / 2, base + 3);
}

/* ── generator: frequency-hop map ── */
function vizHop(parent, caption){
  const { ctx, w, h } = mkviz(parent, caption, 300, 96);
  const cols = 16, rows = 6, cw = (w - 8) / cols, chh = (h - 18) / rows;
  ctx.strokeStyle = COLORS.line;
  for (let i = 0; i <= cols; i++){ ctx.beginPath(); ctx.moveTo(4 + i * cw, 2); ctx.lineTo(4 + i * cw, h - 16); ctx.stroke(); }
  const rnd = lcg(7);
  let px = 0, py = 0;
  ctx.lineWidth = 1.2;
  for (let t = 0; t < cols; t++){
    const f = Math.floor(rnd() * rows);
    const x = 4 + (t + .5) * cw, y = 2 + (f + .5) * chh;
    if (t){ ctx.strokeStyle = COLORS.muted; ctx.globalAlpha = .6;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke(); ctx.globalAlpha = 1; }
    ctx.fillStyle = COLORS.accent;
    ctx.fillRect(x - cw * .34, y - 3, cw * .68, 6);
    px = x; py = y;
  }
  ctx.fillStyle = COLORS.muted; ctx.font = "8.5px system-ui";
  ctx.textAlign = "center"; ctx.textBaseline = "top";
  ctx.fillText("time → a new channel every packet", w / 2, h - 13);
}

/* ── generator: simulated SDR waterfall (deliberately instrument-dark in both themes) ── */
function vizWaterfall(parent, kind, caption){
  const { ctx, w, h } = mkviz(parent, caption, 300, 110);
  ctx.fillStyle = "#0b1016"; ctx.fillRect(0, 0, w, h);
  const rnd = lcg(kind.length * 977 + 13);
  for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2){
    const v = rnd();
    if (v > .82){ ctx.fillStyle = "rgba(70,110,140," + (v - .8) + ")"; ctx.fillRect(x, y, 2, 2); }
  }
  const sig = (x, y, wd, ht, a) => { ctx.fillStyle = "rgba(232,161,61," + a + ")"; ctx.fillRect(x, y, wd, ht); };
  if (kind === "ft8"){
    for (let s = 0; s < 7; s++){
      const x0 = 18 + rnd() * (w - 40);
      for (let seq = 0; seq < 2; seq++){
        const yTop = seq * 55 + (s % 2 ? 0 : 27);
        for (let y = yTop; y < yTop + 26 && y < h; y += 2)
          sig(x0 + Math.floor(rnd() * 4) * 1.5, y, 2, 2, .85);
      }
    }
  } else if (kind === "fm"){
    for (let y = 0; y < h; y++) sig(w/2 - 26 + rnd() * 6, y, 46 + rnd() * 8, 1, .5);
    for (let y = 0; y < h; y++){ sig(52, y, 3, 1, .5); sig(230, y, 3, 1, .45); }
  } else if (kind === "lora"){
    for (let c = 0; c < 5; c++){
      const x0 = 30 + c * 50, yStart = rnd() * 60;
      for (let i = 0; i < 40; i++){
        const y = yStart + i, x = x0 + (i * 1.1) % 34;
        if (y < h) sig(x, y, 2.5, 1.5, .9);
      }
    }
  } else if (kind === "bursts"){
    for (let i = 0; i < 26; i++) sig(20 + rnd() * (w - 60), rnd() * h, 26 + rnd() * 30, 2, .85);
  } else if (kind === "oven"){
    for (let y = 0; y < h; y++) sig(120 + Math.sin(y * .12) * 30 + rnd() * 20, y, 34, 1, .35);
    for (let y = 0; y < h; y++) sig(30, y, 40, 1, .45);
    for (let i = 0; i < 40; i++) sig(rnd() * w, rnd() * h, 3, 2, .8);
  } else if (kind === "radar"){
    for (let y = 4; y < h; y += 14) sig(10, y, w - 20, 2, .8);
  } else if (kind === "tdma"){
    for (let y = 0; y < h; y += 5){
      const slot = Math.floor(y / 5) % 8;
      sig(30 + slot * 30, y, 24, 4, .8);
    }
  } else if (kind === "carriers"){
    [40, 95, 150, 205, 258].forEach(x => { for (let y = 0; y < h; y++) if (rnd() > .1) sig(x, y, 2.5, 1, .8); });
  }
  ctx.fillStyle = "rgba(200,210,220,.75)"; ctx.font = "8.5px ui-monospace,monospace";
  ctx.textAlign = "left"; ctx.textBaseline = "top";
  ctx.fillText("freq →", 4, 3);
  ctx.save(); ctx.translate(8, h - 4); ctx.rotate(-Math.PI / 2);
  ctx.fillText("time →", 14, -4); ctx.restore();
}

/* ── generator: frame anatomy ── */
function vizFrame(parent, fields, caption){
  const { ctx, w, h } = mkviz(parent, caption, 300, 58);
  const total = fields.reduce((s, f) => s + f.n, 0);
  let x = 2;
  const famC = [COLORS.fam.mob, COLORS.fam.aero, COLORS.fam.sat, COLORS.fam.nav, COLORS.fam.sci, COLORS.fam.bc];
  const lastEnd = { top: -1e9, bottom: -1e9 };
  ctx.font = "8.5px ui-monospace,monospace";
  fields.forEach((f, i) => {
    const fw = f.n / total * (w - 4);
    ctx.fillStyle = famC[i % famC.length];
    ctx.globalAlpha = .8;
    ctx.fillRect(x, 16, fw - 1, 20);
    ctx.globalAlpha = 1;
    const row = i % 2 ? "top" : "bottom";
    const tw = ctx.measureText(f.l).width;
    const lx = Math.min(Math.max(x + fw / 2, tw / 2 + 2), w - tw / 2 - 2);
    if (lx - tw / 2 > lastEnd[row] + 5){
      ctx.fillStyle = COLORS.ink;
      ctx.textAlign = "center";
      ctx.textBaseline = row === "top" ? "bottom" : "top";
      ctx.fillText(f.l, lx, row === "top" ? 14 : 39);
      lastEnd[row] = lx + tw / 2;
    }
    if (fw > 26){
      ctx.fillStyle = "rgba(255,255,255,.9)";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(String(f.n), x + fw / 2, 26);
    }
    x += fw;
  });
  ctx.fillStyle = COLORS.muted; ctx.font = "8.5px system-ui";
  ctx.textAlign = "right"; ctx.textBaseline = "bottom";
  ctx.fillText(total + " " + (fields[0].u || "bits"), w - 2, h - 1);
}

/* ── generator: baseband spectrum (labeled humps) ──
   segs: [{x0,x1, label, hl}] in kHz-ish units across [lo,hi] */
function vizBaseband(parent, spec, caption){
  const { ctx, w, h } = mkviz(parent, caption, 300, 84);
  const base = h - 16;
  const X = u => (u - spec.lo) / (spec.hi - spec.lo) * (w - 12) + 6;
  ctx.strokeStyle = COLORS.line;
  ctx.beginPath(); ctx.moveTo(4, base); ctx.lineTo(w - 4, base); ctx.stroke();
  for (const s of spec.segs){
    const x0 = X(s.x0), x1 = X(s.x1), cx = (x0 + x1) / 2, ht = (s.h || 1) * (h - 34);
    ctx.fillStyle = s.hl ? COLORS.accent : COLORS.fam.mob;
    ctx.globalAlpha = .55;
    ctx.beginPath();
    ctx.moveTo(x0, base);
    ctx.quadraticCurveTo(cx, base - ht * 1.9, x1, base);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = s.hl ? COLORS.accent : COLORS.ink;
    ctx.font = "8.5px system-ui"; ctx.textAlign = "center"; ctx.textBaseline = "bottom";
    ctx.fillText(s.label, cx, base - ht - 2);
  }
  ctx.fillStyle = COLORS.muted; ctx.font = "8.5px ui-monospace,monospace";
  ctx.textAlign = "left"; ctx.textBaseline = "top"; ctx.fillText(spec.loLbl, 4, base + 3);
  ctx.textAlign = "right"; ctx.fillText(spec.hiLbl, w - 4, base + 3);
}

/* ── generator: duplex diagram ── */
function vizDuplex(parent, spec, caption){
  const { ctx, w, h } = mkviz(parent, caption, 300, 60);
  ctx.font = "9px system-ui"; ctx.textBaseline = "middle";
  if (spec.mode === "fdd"){
    const seg = (x0, x1, label, up) => {
      ctx.fillStyle = up ? COLORS.fam.mob : COLORS.fam.sat; ctx.globalAlpha = .75;
      ctx.fillRect(x0, 18, x1 - x0, 24); ctx.globalAlpha = 1;
      ctx.fillStyle = "rgba(255,255,255,.92)"; ctx.textAlign = "center";
      ctx.fillText((up ? "▲ " : "▼ ") + label, (x0 + x1) / 2, 30);
    };
    seg(10, 120, "uplink " + spec.ul, true);
    seg(180, 290, "downlink " + spec.dl, false);
    ctx.fillStyle = COLORS.muted; ctx.textAlign = "center";
    ctx.fillText("duplex gap", 150, 30);
    ctx.fillText("phone transmits low, tower transmits high — " + spec.note, w / 2, 52);
  } else {
    for (let i = 0; i < 10; i++){
      const up = i % 3 !== 0;
      ctx.fillStyle = up ? COLORS.fam.mob : COLORS.fam.sat; ctx.globalAlpha = .75;
      ctx.fillRect(10 + i * 28, 18, 25, 24); ctx.globalAlpha = 1;
      ctx.fillStyle = "rgba(255,255,255,.92)"; ctx.textAlign = "center";
      ctx.fillText(up ? "▼" : "▲", 10 + i * 28 + 12, 30);
    }
    ctx.fillStyle = COLORS.muted; ctx.textAlign = "center";
    ctx.fillText("one frequency, shared in time — the split flexes with traffic", w / 2, 52);
  }
}

/* ── generator: dipole-to-scale ── */
function vizDipole(parent, fc, caption){
  const { ctx, w, h } = mkviz(parent, caption, 300, 96);
  const L = C_LIGHT / fc / 2;                       // half-wave dipole, metres
  const human = 1.75;
  const maxM = Math.max(L, human) * 1.12;
  const px = (h - 26) / maxM;
  const base = h - 14;
  /* human silhouette at left */
  const hx = 60, hh = human * px;
  ctx.strokeStyle = COLORS.muted; ctx.lineWidth = Math.max(1.2, hh * .05);
  ctx.beginPath(); ctx.arc(hx, base - hh + hh * .09, hh * .09, 0, 7); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(hx, base - hh * .8); ctx.lineTo(hx, base - hh * .35);
  ctx.moveTo(hx - hh * .14, base - hh * .62); ctx.lineTo(hx + hh * .14, base - hh * .62);
  ctx.moveTo(hx, base - hh * .35); ctx.lineTo(hx - hh * .1, base);
  ctx.moveTo(hx, base - hh * .35); ctx.lineTo(hx + hh * .1, base);
  ctx.stroke();
  ctx.lineWidth = 1;
  /* antenna */
  const ax = 190, ah = L * px;
  ctx.strokeStyle = COLORS.accent; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(ax, base); ctx.lineTo(ax, base - ah); ctx.stroke();
  ctx.lineWidth = 1;
  ctx.strokeStyle = COLORS.line;
  ctx.beginPath(); ctx.moveTo(20, base); ctx.lineTo(w - 20, base); ctx.stroke();
  ctx.fillStyle = COLORS.muted; ctx.font = "8.5px system-ui";
  ctx.textAlign = "center"; ctx.textBaseline = "top";
  ctx.fillText("you (1.75 m)", hx, base + 3);
  ctx.fillStyle = COLORS.accent;
  const Ltxt = L >= 1000 ? (L/1000).toPrecision(3) + " km" : L >= 1 ? L.toPrecision(3) + " m" :
               L >= .01 ? (L*100).toPrecision(3) + " cm" : (L*1000).toPrecision(3) + " mm";
  ctx.fillText("λ/2 antenna: " + Ltxt, ax, base + 3);
}

/* ── physics profile by frequency ── */
function physProfile(fc){
  const d = Math.log10(fc);
  if (d < 4.48) return { prop:"Guided between Earth and ionosphere — signals bend around the entire planet, and even reach submarines under the sea.", pen:[3,3,3,3] };
  if (d < 5.48) return { prop:"Ground wave hugs the terrain for hundreds of kilometres, day and night, rain or shine.", pen:[3,3,3,1] };
  if (d < 6.48) return { prop:"Ground wave by day. At night the ionosphere’s D-layer fades and skywave carries signals across continents.", pen:[3,3,3,0] };
  if (d < 7.48) return { prop:"Skywave: signals bounce off the ionosphere and return thousands of km away. Which bands work changes with the hour and the sunspot cycle.", pen:[2,2,3,0] };
  if (d < 8.48) return { prop:"Mostly line of sight, stretched by the radio horizon — plus surprise summer skips off sporadic-E clouds.", pen:[2,2,3,0] };
  if (d < 9.48) return { prop:"Line of sight with useful diffraction — the mobile-radio sweet spot: good building penetration, modest antennas.", pen:[2,1,3,0] };
  if (d < 10.48) return { prop:"Strict line of sight; rain fade grows with frequency. Gain antennas (dishes, panels) become the norm.", pen:[1,1,1,0] };
  return { prop:"Millimetre waves: blocked by a hand, a leaf, a pane of coated glass. Oxygen itself absorbs strongly near 60 GHz — huge bandwidth, tiny cells.", pen:[0,0,0,0] };
}

/* ── protocol registry ── */
const PROTO = {
am_bc:{ name:"AM broadcasting", sub:"DSB amplitude modulation", year:1920,
  mod:["AM","10 kHz raster"], stats:{ rate:"~4.5 kHz audio", range:"100 km day · 1000+ km night", power:"250 W – 50 kW" },
  blurb:"The original broadcast mode: the audio simply rides on the carrier’s amplitude, so any tuned circuit and a diode can hear it — which is why crystal radios work. The price is noise: every lightning bolt within a thousand km plays through the speaker.",
  viz:[["wave","am","Amplitude modulation — audio shapes the carrier envelope"],
       ["waterfall","carriers","Waterfall: steady carriers every 10 kHz down the dial"]] },
ft8:{ name:"FT8", sub:"WSJT-X digital weak-signal mode", year:2017,
  mod:["8-GFSK","50 Hz wide","15 s cycles"], stats:{ rate:"~45 bit/s", range:"worldwide on 5 W", power:"1–100 W" },
  blurb:"The mode that ate ham radio: 15-second transmit/receive cycles, 77-bit messages, and forward error correction that digs signals out 24 dB below the noise you can hear. A whole contact fits in four exchanges of callsigns, grid squares, and signal reports.",
  viz:[["waterfall","ft8","Waterfall: 50 Hz FT8 “staircases” alternating in 15 s slots"],
       ["frame",[{n:29,l:"call 1"},{n:29,l:"call 2"},{n:15,l:"grid/rpt"},{n:14,l:"CRC"},{n:83,l:"FEC parity"}],"The 174-bit FT8 codeword — more error correction than message"]] },
cb:{ name:"Citizens Band", sub:"AM/SSB voice, 40 channels", year:1958,
  mod:["AM","SSB","4 W"], stats:{ rate:"voice", range:"5–30 km (more on skip)", power:"4 W AM · 12 W SSB" },
  blurb:"No licence, no test, no callsign — just key up. Channel 9 is reserved for emergencies, channel 19 is the highway channel. During sunspot peaks the band opens up and truckers hear Australia, which is technically illegal to answer and universally answered.",
  viz:[["channels",{lo:26.955e6,hi:27.425e6,rows:[{name:"40 channels · 10 kHz",color:null,shape:"rect",chans:"CB"}]},"The 40-channel plan — note the gaps left by old RC-channel history"],
       ["wave","am","AM voice — same physics as the broadcast band"]] },
wfm:{ name:"FM broadcasting", sub:"Wideband FM + subcarriers", year:1961,
  mod:["WBFM","±75 kHz dev","19 kHz pilot"], stats:{ rate:"15 kHz audio + data", range:"~100 km line of sight", power:"100 W – 100 kW ERP" },
  blurb:"Armstrong’s noise-proof invention, plus seventy years of stowaways: a 19 kHz pilot tone unlocks stereo, RDS at 57 kHz names the song on your dash, and HD Radio hides digital sidebands just outside the analog channel.",
  viz:[["baseband",{lo:0,hi:100,loLbl:"0 kHz",hiLbl:"100 kHz",segs:[{x0:0,x1:15,label:"mono L+R",h:1},{x0:18,x1:20,label:"pilot",hl:1,h:.55},{x0:23,x1:53,label:"stereo L−R",h:.8},{x0:55,x1:59,label:"RDS",hl:1,h:.45},{x0:62,x1:97,label:"HD/SCA",h:.35}]},"What’s inside one FM station, before it modulates the carrier"],
       ["waterfall","fm","Waterfall: one wide FM signal with pilot and RDS lines"]] },
airband:{ name:"VHF airband voice", sub:"AM, 25 → 8.33 kHz channels", year:1947,
  mod:["AM","8.33 kHz raster"], stats:{ rate:"voice", range:"~370 km at altitude", power:"5–25 W" },
  blurb:"Deliberately still AM: two stations transmitting at once produce an audible heterodyne squeal instead of silent capture, so a blocked call gets noticed. Europe split the classic 25 kHz channels three ways (8.33 kHz) when callsigns ran out of room.",
  viz:[["channels",{lo:118e6,hi:118.1e6,loLbl:"118.000",hiLbl:"118.100 MHz",rows:[{name:"25 kHz legacy",color:null,shape:"rect",chans:"AIR25"},{name:"8.33 kHz split",color:null,shape:"rect",chans:"AIR833"}]},"One 25 kHz channel becomes three 8.33 kHz channels"],
       ["wave","am","AM voice — a stuck mic can’t fully silence the channel"]] },
marine:{ name:"Marine VHF & DSC", sub:"FM voice + digital calling", year:1972,
  mod:["FM","DSC on Ch 70"], stats:{ rate:"voice · 1.2 kb/s DSC", range:"~40 km ship-to-shore", power:"1 / 25 W" },
  blurb:"Simplex and duplex FM channels with names every sailor memorizes: 16 for distress and calling, 13 for bridge-to-bridge, 70 reserved for Digital Selective Calling — a data burst that can shout MAYDAY with your position while you work the pumps.",
  viz:[["channels",{lo:156e6,hi:157.45e6,rows:[{name:"working channels",color:null,shape:"rect",chans:"MARINE"}]},"Channel 16 (156.800) and DSC 70 (156.525) highlighted"],
       ["wave","fm","Narrowband FM voice"]] },
ais:{ name:"AIS", sub:"Automatic Identification System", year:2002,
  mod:["GMSK","9.6 kb/s","SOTDMA"], stats:{ rate:"9.6 kb/s", range:"~74 km", power:"2 / 12.5 W" },
  blurb:"Every large vessel broadcasts who it is, where it is, and where it’s pointed, twice per channel, self-organizing into time slots with no master station. Coastal receivers and satellites feed the tracking maps; SAR aircraft carry receivers too.",
  viz:[["frame",[{n:24,l:"ramp/sync"},{n:8,l:"flag"},{n:168,l:"position report"},{n:16,l:"CRC"},{n:8,l:"flag"}],"One 26.7 ms AIS burst — 168 data bits well escorted"],
       ["waterfall","bursts","Waterfall: position bursts from every ship in range"]] },
adsb:{ name:"ADS-B (1090ES)", sub:"Mode S extended squitter", year:2002,
  mod:["PPM","1 Mb/s"], stats:{ rate:"1 Mb/s bursts", range:"250+ km", power:"75–500 W pulses" },
  blurb:"Twice a second, every airliner shouts its GPS position in a 120 µs pulse-position burst on 1090 MHz. No handshake, no encryption — which is why a $30 dongle and a coat-hanger antenna feed the flight-tracking sites you already use.",
  viz:[["frame",[{n:8,l:"preamble",u:"µs·bits"},{n:5,l:"DF17"},{n:3,l:"CA"},{n:24,l:"ICAO addr"},{n:56,l:"position/velocity"},{n:24,l:"parity"}],"The 112-bit extended squitter"],
       ["waterfall","bursts","Waterfall: squitters from every aircraft in view"]] },
gps:{ name:"GPS / GNSS", sub:"CDMA spread-spectrum ranging", year:1978,
  mod:["BPSK/BOC","CDMA","50 bit/s nav"], stats:{ rate:"50 bit/s (!)", range:"20,180 km orbit", power:"~ −128 dBm received" },
  blurb:"Every satellite transmits on the same frequency, distinguished only by its 1023-chip spreading code — the signal arrives buried below the thermal noise floor and is dug out by correlation. Your position is just four (or more) measured time-of-flights, solved simultaneously.",
  viz:[["baseband",{lo:-12,hi:12,loLbl:"−12 MHz",hiLbl:"+12 MHz",segs:[{x0:-1.2,x1:1.2,label:"C/A code",hl:1,h:1},{x0:-11,x1:-2,label:"P(Y)",h:.4},{x0:2,x1:11,label:"P(Y)",h:.4}]},"Civil C/A lobe vs the wide military P(Y) code around L1"],
       ["frame",[{n:30,l:"telemetry"},{n:30,l:"handover"},{n:240,l:"ephemeris & clock"}],"One 6-second nav subframe at 50 bit/s — the full almanac takes 12.5 min"]] },
lte:{ name:"LTE / 5G NR", sub:"OFDMA cellular", year:2009,
  mod:["OFDMA","QPSK→256-QAM","FDD/TDD"], stats:{ rate:"up to ~2 Gb/s", range:"1–15 km per cell", power:"23 dBm handset" },
  blurb:"The air interface is a time-frequency grid: 15 kHz subcarriers in 1 ms slices, scheduled per-user every millisecond. Your phone reports channel quality and the tower picks a modulation to match — crawl at QPSK by the elevator, sprint at 256-QAM by the window.",
  viz:[["ofdm",12,"OFDM: the subcarrier comb (LTE packs 1200 into 20 MHz)"],
       ["const",64,"64-QAM — 6 bits per symbol"],
       ["duplex",{mode:"fdd",ul:"", dl:"",note:"FDD keeps them from shouting over each other"},"Frequency-division duplex band pair"]] },
wifi24:{ name:"Wi-Fi (2.4 GHz)", sub:"802.11b/g/n/ax", year:1999,
  mod:["DSSS→OFDM","CSMA/CA","20/40 MHz"], stats:{ rate:"1 Mb/s → 574 Mb/s", range:"~50 m indoors", power:"≤ 100 mW EIRP" },
  blurb:"Listen-before-talk etiquette in an unlicensed junkyard: fourteen overlapping 22 MHz channels of which only 1, 6, and 11 coexist cleanly. Everything else — Bluetooth, ZigBee, your microwave — shares the same air, which is why the standard is mostly retry logic.",
  viz:[["channels",{lo:2400e6,hi:2495e6,loLbl:"2400",hiLbl:"2495 MHz",rows:[{name:"Wi-Fi 22 MHz lobes",color:null,shape:"lobe",chans:"WIFI"},{name:"ZigBee ch 11–26",color:null,shape:"rect",chans:"ZIGBEE"}]},"Channels 1 / 6 / 11 (highlighted) are the only clean trio"],
       ["waterfall","oven","Waterfall: a Wi-Fi block, Bluetooth pinpricks — and a microwave oven smearing"]] },
bt:{ name:"Bluetooth", sub:"FHSS personal-area radio", year:1999,
  mod:["GFSK","1600 hops/s","79 ch"], stats:{ rate:"1–3 Mb/s (LE: 2)", range:"10–100 m", power:"1–100 mW" },
  blurb:"Named for a Viking king who united Denmark; the radio unites peripherals by refusing to stay still — 1600 frequency hops per second across 79 channels, with an adaptive map that blacklists whatever Wi-Fi is squatting on this minute.",
  viz:[["hop","Adaptive frequency hopping across the 2.4 GHz band"],
       ["wave","fsk","GFSK — data as small frequency shifts"]] },
lora:{ name:"LoRa / LPWAN", sub:"Chirp spread spectrum", year:2015,
  mod:["CSS chirps","125 kHz","ALOHA"], stats:{ rate:"0.3–27 kb/s", range:"2–15 km (LoS 100+)", power:"≤ 25–500 mW" },
  blurb:"Data rides on frequency chirps that sweep the channel; receivers de-chirp and find the breakpoints, pulling packets from 20 dB below the noise. A soil sensor on a coin cell can whisper to a gateway across a valley a few times an hour for a decade.",
  viz:[["wave","chirp","Chirp spread spectrum — each symbol is a swept tone"],
       ["waterfall","lora","Waterfall: LoRa chirps look like diagonal rain"]] },
wifi6e:{ name:"Wi-Fi 5/6/6E/7", sub:"802.11ac/ax/be", year:2013,
  mod:["OFDMA","up to 4096-QAM","160/320 MHz"], stats:{ rate:"up to 23 Gb/s", range:"~30 m indoors", power:"LPI / AFC rules" },
  blurb:"Above 5 GHz Wi-Fi grows up: 160-and-320 MHz channels, OFDMA scheduling borrowed from cellular, and 4096-QAM so dense it only decodes across a quiet room. The DFS blocks still defer to weather radar — your router literally listens for storms.",
  viz:[["channels",{lo:5150e6,hi:5895e6,loLbl:"5150",hiLbl:"5895 MHz",rows:[{name:"80 MHz channels",color:null,shape:"rect",chans:"UNII"}]},"U-NII blocks — amber channels must vacate for radar (DFS)"],
       ["const",256,"256-QAM — 8 bits/symbol; Wi-Fi 7 quadruples this again"]] },
radar:{ name:"Pulse-Doppler radar", sub:"Primary surveillance & weather", year:1940,
  mod:["Pulsed","MHz-wide chirps"], stats:{ rate:"—", range:"250–450 km", power:"up to 750 kW peak" },
  blurb:"Shout, then listen: a microsecond megawatt pulse, then a millisecond of silence measuring echoes. Doppler shift separates a drifting raindrop from a speeding aircraft; NEXRAD’s dual polarization even tells rain from hail from tornado debris.",
  viz:[["wave","pulse","Pulse train — range from echo delay, velocity from Doppler shift"],
       ["waterfall","radar","Waterfall: the sweep paints the whole band every rotation"]] },
dvbs:{ name:"DVB-S2 / DTH TV", sub:"Satellite broadcast", year:2005,
  mod:["8PSK","~30 Msym/s","LDPC FEC"], stats:{ rate:"~45 Mb/s per transponder", range:"35,786 km, one hop", power:"~120 W per transponder" },
  blurb:"A geostationary transponder is a bent pipe in the sky: uplinked from one big dish, rebroadcast at your whole continent. 8PSK keeps the amplitude constant so the satellite’s amplifier can run flat out; monster LDPC codes handle the rain.",
  viz:[["const",8,"8PSK — constant envelope, phase carries the bits"],
       ["duplex",{mode:"fdd",ul:"17 GHz",dl:"12 GHz",note:"one hop spans 72,000 km"},"Uplink high, downlink low — same idea as your phone"]] },
nr_mmw:{ name:"5G mmWave", sub:"NR FR2, beamforming", year:2019,
  mod:["OFDM 120 kHz SCS","beam-steered"], stats:{ rate:"1–3 Gb/s real-world", range:"100–500 m", power:"beamformed panels" },
  blurb:"At 28 GHz an antenna element is 5 mm, so a phone fits arrays that aim the beam — and must, because the link dies behind your hand. Cells shrink to street corners; capacity, not coverage, is the point.",
  viz:[["ofdm",16,"Wider subcarriers (120 kHz) tame mmWave phase noise"],
       ["wave","psk","Same OFDM mathematics, ten times the bandwidth"]] },
};

/* channel-plan tables (kept out of PROTO for readability) */
const CHAN_TABLES = {
  CB:   [0,10,20,40,50,60,80,90,100,120,130,140,160,170,180,200,210,220,230,250,
         260,270,280,300,310,320,330,340,350,360,370,380,390,400,410,420,430,440,450,460]
        .map((off,i)=>({f:(26965+off)*1e3,bw:10e3,label:(i===8||i===18)?String(i+1):"",hl:i===8||i===18})),
  AIR25:[{f:118.025e6,bw:25e3,label:"25"},{f:118.05e6,bw:25e3,label:""},{f:118.075e6,bw:25e3,label:""}],
  AIR833:Array.from({length:9},(_,i)=>({f:118.00417e6+i*8.33e3,bw:8.33e3,label:i===0?"8.33":""})),
  MARINE:[{f:156.05e6,bw:25e3,label:"1"},{f:156.3e6,bw:25e3,label:"6"},{f:156.525e6,bw:25e3,label:"70",hl:1},{f:156.65e6,bw:25e3,label:"13"},{f:156.8e6,bw:25e3,label:"16",hl:1},{f:157.1e6,bw:25e3,label:"22"}],
  WIFI: Array.from({length:13},(_,i)=>({f:2412e6+i*5e6,bw:22e6,label:String(i+1),hl:i===0||i===5||i===10})),
  ZIGBEE:Array.from({length:16},(_,i)=>({f:2405e6+i*5e6,bw:2e6,label:i===0?"11":i===15?"26":""})),
  UNII:[{f:5210e6,bw:80e6,label:"U-NII-1"},{f:5290e6,bw:80e6,label:"2A·DFS",hl:1},{f:5530e6,bw:80e6,label:"2C·DFS",hl:1},{f:5610e6,bw:80e6,label:"2C·DFS",hl:1},{f:5775e6,bw:80e6,label:"U-NII-3"}],
};

/* ── encyclopedia entries: band-range → protocols + extras ──
   cond: {ism:true} band must carry ISM flag; {fam:"mob"} band must include family. */
const ENC = [
{ lo:525e3, hi:1705e3, protos:["am_bc"],
  hist:[[1906,"Fessenden’s Christmas Eve broadcast — voice and violin instead of Morse"],[1920,"KDKA Pittsburgh: first commercial licensed broadcaster"],[1938,"“War of the Worlds” shows the medium’s power"]],
  listen:{label:"Listen live — U. Twente WebSDR (0–29 MHz)",url:"http://websdr.ewi.utwente.nl:8901/"} },
{ lo:14e6, hi:14.35e6, protos:["ft8"],
  hist:[[1924,"Hams reach the antipodes on shortwave — colonial cable companies panic"],[1947,"SSB replaces AM as the DX weapon"],[2017,"FT8 released; within two years it carries most HF contacts"]],
  listen:{label:"Listen live — U. Twente WebSDR",url:"http://websdr.ewi.utwente.nl:8901/"} },
{ lo:26.9e6, hi:27.41e6, protos:["cb"],
  hist:[[1958,"FCC creates Class D CB from a failed RC band"],[1976,"Peak CB craze: 'Convoy' hits #1; licences abandoned"],[1977,"Channels expand 23 → 40"]],
  listen:{label:"Listen live — U. Twente WebSDR",url:"http://websdr.ewi.utwente.nl:8901/"} },
{ lo:76e6, hi:108e6, protos:["wfm"],
  hist:[[1933,"Armstrong patents wideband FM; RCA fights it for a decade"],[1961,"FCC approves the pilot-tone stereo system still used today"],[1998,"RDS reaches most car dashboards"]] },
{ lo:108e6, hi:137e6, protos:["airband"],
  hist:[[1947,"ICAO standardizes VHF AM worldwide"],[1979,"121.5 MHz ELT monitoring goes satellite (COSPAS-SARSAT)"],[2018,"Europe completes 8.33 kHz channel split"]],
  listen:{label:"Listen live — LiveATC.net",url:"https://www.liveatc.net/"} },
{ lo:156e6, hi:162.05e6, protos:["marine","ais"],
  hist:[[1999,"GMDSS fully replaces the Morse radio officer"],[2002,"AIS carriage becomes mandatory for large vessels"],[2008,"Satellites start hearing AIS from orbit"]],
  listen:{label:"See it live — MarineTraffic (AIS map)",url:"https://www.marinetraffic.com/"} },
{ lo:960e6, hi:1215e6, protos:["adsb"],
  hist:[[1953,"DME standardized — still interrogating today"],[2002,"1090ES extended squitter defined"],[2020,"ADS-B Out mandated in US controlled airspace"]],
  listen:{label:"See it live — ADSB Exchange",url:"https://globe.adsbexchange.com/"} },
{ lo:1559e6, hi:1610e6, protos:["gps"],
  hist:[[1983,"KAL 007 shootdown; Reagan promises GPS to civilians"],[2000,"Selective Availability switched off — accuracy jumps 10×"],[2016,"Galileo goes live; four constellations share L1"]] },
{ lo:1710e6, hi:2200e6, protos:["lte"], cond:{fam:"mob"},
  hist:[[1991,"First GSM call (Finland)"],[2009,"First LTE networks (Stockholm/Oslo)"],[2019,"5G NR non-standalone launches worldwide"]] },
{ lo:614e6, hi:900e6, protos:["lte"], cond:{fam:"mob", notIsm:true},
  hist:[[1983,"AMPS launches in Chicago — the brick phone era"],[2009,"Analog TV shutdown frees the 700 MHz band"],[2017,"600 MHz incentive auction moves broadcasters again"]] },
{ lo:862e6, hi:930e6, protos:["lora"], cond:{ism:true},
  hist:[[1985,"FCC Part 15 legalizes spread-spectrum in ISM bands"],[2015,"LoRaWAN spec v1.0 published"],[2020,"Amazon Sidewalk turns doorbells into a public LPWAN"]] },
{ lo:2400e6, hi:2483.5e6, protos:["wifi24","bt"],
  hist:[[1947,"ISM bands created for machines, not comms"],[1997,"802.11 ratified at 2 Mb/s"],[1999,"Bluetooth 1.0 and 802.11b ship — the band never sleeps again"]] },
{ lo:5150e6, hi:5895e6, protos:["wifi6e"] },
{ lo:5925e6, hi:7125e6, protos:["wifi6e"],
  hist:[[2020,"FCC opens all 1200 MHz to unlicensed use"],[2023,"WRC-23 identifies upper 6 GHz for IMT — the tug-of-war begins"]] },
{ lo:2700e6, hi:3100e6, protos:["radar"],
  hist:[[1940,"The cavity magnetron crosses the Atlantic in a briefcase"],[1988,"First NEXRAD WSR-88D installed"],[2013,"Dual-polarization upgrade completes"]] },
{ lo:8500e6, hi:10e9, protos:["radar"] },
{ lo:10.7e9, hi:12.75e9, protos:["dvbs"],
  hist:[[1962,"Telstar relays the first live transatlantic TV"],[1994,"DirecTV launches digital DTH"],[2019,"Starlink begins filling the same downlink band"]] },
{ lo:24.25e9, hi:29.5e9, protos:["nr_mmw"], cond:{fam:"mob"},
  hist:[[2016,"FCC Spectrum Frontiers opens mmWave for 5G"],[2019,"First commercial mmWave 5G (Chicago/Minneapolis)"]] },
];

function encFor(band){
  const mid = Math.sqrt(band.lo * band.hi);
  for (const e of ENC){
    if (mid < e.lo || mid > e.hi) continue;
    if (e.cond){
      if (e.cond.ism && !band.flags.includes("i")) continue;
      if (e.cond.notIsm && band.flags.includes("i")) continue;
      if (e.cond.fam && !band.svcs.some(s => famOf(s) === e.cond.fam)) continue;
    }
    return e;
  }
  return null;
}

/* ── render: physics strip (every band) ── */
function renderPhysics(band, root){
  const fc = Math.sqrt(band.lo * band.hi);
  const p = physProfile(fc);
  const sec = document.createElement("div");
  sec.className = "physics";
  const txt = document.createElement("div");
  txt.className = "phys-txt";
  const pens = ["buildings","foliage","rain","seawater"];
  txt.innerHTML = "<h4>Physics at " + fmtFreq(fc) + "</h4><p>" + p.prop + "</p>" +
    "<div class='pen-key'>penetrates:</div>" +
    "<div class='pens'>" + pens.map((n, i) =>
      "<span class='pen'><span class='pdots'>" +
      [0,1,2].map(j => "<i class='" + (j < p.pen[i] ? "on" : "") + "'></i>").join("") +
      "</span>" + n + "</span>").join("") + "</div>";
  sec.appendChild(txt);
  vizDipole(sec, fc, "Half-wave antenna at this frequency, to scale");
  root.appendChild(sec);
}

/* ── render: full encyclopedia section ── */
function renderEncyclopedia(band, root){
  renderPhysics(band, root);
  const e = encFor(band);
  if (!e) return;
  const head = document.createElement("h2");
  head.textContent = "Protocols & signals";
  head.style.marginTop = "16px";
  root.appendChild(head);
  for (const pid of e.protos){
    const P = PROTO[pid];
    if (!P) continue;
    const card = document.createElement("section");
    card.className = "pcard";
    card.innerHTML =
      "<div class='phead'><span class='pname'>" + P.name + "</span>" +
      "<span class='psub'>" + P.sub + "</span><span class='pyear'>" + P.year + "</span></div>" +
      "<div class='modchips'>" + P.mod.map(m => "<span>" + m + "</span>").join("") + "</div>" +
      "<div class='statrow'><span><b>" + P.stats.rate + "</b>data rate</span>" +
      "<span><b>" + P.stats.range + "</b>typical range</span>" +
      "<span><b>" + P.stats.power + "</b>power</span></div>" +
      "<p class='pblurb'>" + P.blurb + "</p>";
    const grid = document.createElement("div");
    grid.className = "vizgrid";
    card.appendChild(grid);
    for (const v of P.viz){
      const [g, arg, cap] = v.length === 2 ? [v[0], null, v[1]] : v;
      try {
        if (g === "wave") vizWave(grid, arg, cap);
        else if (g === "waterfall") vizWaterfall(grid, arg, cap);
        else if (g === "const") vizConst(grid, arg, cap);
        else if (g === "ofdm") vizOFDM(grid, arg, cap);
        else if (g === "hop") vizHop(grid, arg || cap);
        else if (g === "frame") vizFrame(grid, arg, cap);
        else if (g === "baseband") vizBaseband(grid, arg, cap);
        else if (g === "duplex") vizDuplex(grid, arg, cap);
        else if (g === "channels"){
          const spec = Object.assign({}, arg);
          spec.rows = arg.rows.map(r => Object.assign({}, r, {
            color: r.color || COLORS.fam.mob,
            chans: typeof r.chans === "string" ? CHAN_TABLES[r.chans] : r.chans,
          }));
          vizChannels(grid, spec, cap);
        }
      } catch (err){ /* a broken visual must never take down the card */ }
    }
    root.appendChild(card);
  }
  if (e.hist){
    const hl = document.createElement("div");
    hl.className = "hist";
    hl.innerHTML = "<h4>Milestones</h4>" +
      e.hist.map(([y, t]) => "<div><span class='hy'>" + y + "</span><span>" + t + "</span></div>").join("");
    root.appendChild(hl);
  }
  if (e.listen){
    const a = document.createElement("a");
    a.className = "listen";
    a.href = e.listen.url; a.target = "_blank"; a.rel = "noopener";
    a.textContent = "▶ " + e.listen.label;
    root.appendChild(a);
  }
}
