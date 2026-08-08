/* ── SPECTRA engine ── */
const C_LIGHT = 299792458;
const LOGMIN = Math.log10(3e3), LOGMAX = Math.log10(3e11);
const MIN_SPAN = 5e-4;

const $ = id => document.getElementById(id);
const strip = $("strip"), mini = $("mini"), pinrow = $("pinrow"),
      tooltip = $("tooltip"), readout = $("readout");
const sctx = strip.getContext("2d"), mctx = mini.getContext("2d");

const state = {
  auth: "fcc",
  bands: [], landmarks: [],
  view: { a: LOGMIN, b: LOGMAX },
  hover: null, sel: null, fam: null,
  anim: null,
};
let booting = true;

/* ── deep links: #a=<auth>&v=<logA>,<logB>&b=<bandLoHz> ── */
let hashTimer = null;
function saveHash(){
  if (booting) return;
  let p = "a=" + state.auth + "&v=" + state.view.a.toFixed(4) + "," + state.view.b.toFixed(4);
  if (state.sel) p += "&b=" + state.sel.lo;
  history.replaceState(null, "", "#" + p);
}
function saveHashSoon(){ clearTimeout(hashTimer); hashTimer = setTimeout(saveHash, 250); }

/* ── theme-reactive colors ── */
let COLORS = {};
function readColors(){
  const cs = getComputedStyle(document.documentElement);
  const v = n => cs.getPropertyValue(n).trim();
  COLORS = {
    surface: v("--surface"), panel: v("--panel"), ink: v("--ink"),
    muted: v("--muted"), line: v("--line"), accent: v("--accent"),
    hatch: v("--hatch"),
    fam: {}
  };
  for (const f of FAM_ORDER) COLORS.fam[f] = v("--f-" + f);
}
function textOn(hex){
  const n = parseInt(hex.slice(1), 16);
  const yiq = ((n>>16&255)*299 + (n>>8&255)*587 + (n&255)*114) / 1000;
  return yiq > 150 ? "rgba(20,20,24,.92)" : "rgba(255,255,255,.94)";
}
let patIsm = null, patQuiet = null;
function makePatterns(){
  const c1 = document.createElement("canvas"); c1.width = c1.height = 8;
  const x1 = c1.getContext("2d");
  x1.strokeStyle = COLORS.hatch; x1.lineWidth = 1.6;
  x1.beginPath();
  for (let i = -8; i < 16; i += 5){ x1.moveTo(i, 8); x1.lineTo(i + 8, 0); }
  x1.stroke();
  patIsm = sctx.createPattern(c1, "repeat");
  const c2 = document.createElement("canvas"); c2.width = c2.height = 7;
  const x2 = c2.getContext("2d");
  x2.fillStyle = COLORS.hatch;
  x2.beginPath(); x2.arc(2, 2, 1.1, 0, 7); x2.fill();
  patQuiet = sctx.createPattern(c2, "repeat");
}

/* ── formatting ── */
function fmtFreq(hz){
  const u = hz >= 1e9 ? [1e9,"GHz"] : hz >= 1e6 ? [1e6,"MHz"] : hz >= 1e3 ? [1e3,"kHz"] : [1,"Hz"];
  let v = hz / u[0];
  let s = v >= 100 ? v.toFixed(1) : v >= 10 ? v.toFixed(2) : v.toFixed(3);
  s = s.replace(/\.?0+$/, "");
  return s + " " + u[1];
}
function fmtWave(hz){
  let m = C_LIGHT / hz;
  if (m >= 1000) return (m/1000).toPrecision(3).replace(/\.?0+$/,"") + " km";
  if (m >= 1)    return m.toPrecision(3).replace(/\.?0+$/,"") + " m";
  if (m >= .01)  return (m*100).toPrecision(3).replace(/\.?0+$/,"") + " cm";
  if (m >= .001) return (m*1000).toPrecision(3).replace(/\.?0+$/,"") + " mm";
  return (m*1e6).toPrecision(3).replace(/\.?0+$/,"") + " µm";
}
function fmtBW(hz){ return fmtFreq(hz).replace(" ", " ").replace("Hz","Hz"); }

/* ── data assembly ── */
function normBands(raw){
  return raw.map(r => ({
    lo: r[0], hi: r[1], svcs: r[2],
    nick: r[3] || "", note: r[4] || "", flags: r[5] || "",
    diff: false, fcc: null,
  }));
}
function applyPatches(base, patches){
  let out = base.slice();
  for (const [plo, phi, repl] of patches){
    const next = [];
    for (const b of out){
      if (b.hi <= plo || b.lo >= phi){ next.push(b); continue; }
      if (b.lo < plo) next.push(Object.assign({}, b, { hi: plo }));
      if (b.hi > phi) next.push(Object.assign({}, b, { lo: phi }));
    }
    for (const r of normBands(repl)) next.push(r);
    out = next.sort((a, b2) => a.lo - b2.lo);
  }
  return out;
}
let FCC_BANDS = null;
function findBand(bands, f){
  let lo = 0, hi = bands.length - 1;
  while (lo <= hi){
    const m = (lo + hi) >> 1, b = bands[m];
    if (f < b.lo) hi = m - 1;
    else if (f >= b.hi) lo = m + 1;
    else return b;
  }
  return null;
}
function svcSig(b){ return b.svcs.join("|"); }
function build(key){
  state.auth = key;
  const A = AUTH[key];
  if (!FCC_BANDS) FCC_BANDS = normBands(BASE);
  state.bands = key === "fcc" ? FCC_BANDS : applyPatches(FCC_BANDS, A.patches);
  if (key !== "fcc"){
    for (const b of state.bands){
      const mid = Math.sqrt(b.lo * b.hi);
      const fb = findBand(FCC_BANDS, mid);
      b.fcc = fb;
      b.diff = !fb || svcSig(b) !== svcSig(fb) || (b.nick || "") !== (fb.nick || "");
    }
  }
  state.landmarks = LM_WORLD.concat(A.landmarks)
    .map(l => ({ lo: l[0], hi: l[1], label: l[2], tour: !!l[3] }))
    .sort((a, b) => (a.lo + a.hi) - (b.lo + b.hi));
  state.sel = null; state.hover = null;
  $("regchip").textContent = A.flag + " " + A.region;
  $("statline").textContent = state.bands.length + " bands · " + A.country;
  buildChips(); buildLegend(); showAuthCard();
  $("diffkey").style.display = key === "fcc" ? "none" : "flex";
  renderMini(); requestRender(); saveHashSoon();
}

/* ── geometry ──
   Wide views split into up to 3 stacked rows (NTIA-chart style): each row is a
   contiguous slice of the log-frequency span, so zooming out buys horizontal
   resolution instead of squeezing everything into one strip. */
let W = 0, H = 0, DPR = 1, lastN = 0;
const PIN_H = 25, AX_H = 25, WAVE_H = 17, NICK_H = 20, ROW_GAP = 9;

function rowCount(){
  const span = state.view.b - state.view.a;
  return span >= 5 ? 3 : span >= 2.2 ? 2 : 1;
}
/* per-row geometry: log range + the y bands it owns */
function rowLayout(){
  const n = lastN || rowCount();
  const multi = n > 1;
  const railI = multi ? 17 : 24, railE = multi ? 13 : 18, waveH = multi ? 0 : WAVE_H;
  const per = (H - (n - 1) * ROW_GAP) / n;
  const bandH = per - PIN_H - railI - railE - AX_H - waveH;
  const slice = (state.view.b - state.view.a) / n;
  const rows = [];
  for (let r = 0; r < n; r++){
    const top = r * (per + ROW_GAP);
    const bandTop = top + PIN_H + railI + railE;
    rows.push({ r, n, per,
      a: state.view.a + r * slice, b: state.view.a + (r + 1) * slice,
      top, pinY: top, railIY: top + PIN_H, railEY: top + PIN_H + railI,
      railI, railE, waveH, bandTop, bandH, axY: bandTop + bandH });
  }
  return rows;
}
function rowAtY(y, rows){
  rows = rows || rowLayout();
  let best = rows[0], bd = Infinity;
  for (const rw of rows){
    if (y >= rw.top && y <= rw.top + rw.per) return rw;
    const d = y < rw.top ? rw.top - y : y - (rw.top + rw.per);
    if (d < bd){ bd = d; best = rw; }
  }
  return best;
}
const XR = (lg, rw) => (lg - rw.a) / (rw.b - rw.a) * W;
const XFR = (f, rw) => XR(Math.log10(f), rw);
const fAtRow = (x, rw) => Math.pow(10, rw.a + x / W * (rw.b - rw.a));

function applySize(){
  DPR = window.devicePixelRatio || 1;
  W = strip.clientWidth;
  const n = rowCount();
  lastN = n;
  H = n === 1
    ? Math.max(300, Math.min(520, Math.round(window.innerHeight * .48)))
    : Math.max(150 * n + 60, Math.min(190 * n, Math.round(window.innerHeight * .74)));
  strip.style.height = H + "px";
  strip.width = Math.round(W * DPR); strip.height = Math.round(H * DPR);
  sctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  mini.width = Math.round(mini.clientWidth * DPR); mini.height = Math.round(44 * DPR);
  mctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  $("rowbadge").textContent = n === 1 ? "single row" : n + " rows";
}
function resize(){ applySize(); renderMini(); requestRender(); keyWordmark(); }

/* ── ticks ── */
function niceTicks(a, b){
  const span = b - a, out = [];
  if (span > .8){
    const mants = span > 4 ? [1] : span > 1.6 ? [1,2,5] : [1,1.5,2,3,4,5,6,7,8,9];
    for (let d = Math.floor(a) - 1; d <= Math.ceil(b); d++)
      for (const m of mants){
        const lg = d + Math.log10(m);
        if (lg >= a - 1e-9 && lg <= b + 1e-9)
          out.push({ f: Math.pow(10, lg), major: m === 1 });
      }
  } else {
    const f0 = Math.pow(10, a), f1 = Math.pow(10, b), range = f1 - f0;
    const raw = range / 7, p = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = raw / p >= 5 ? 5*p : raw / p >= 2 ? 2*p : p;
    for (let f = Math.ceil(f0 / step) * step; f <= f1; f += step)
      out.push({ f, major: true });
  }
  return out;
}

/* ── main render ── */
let rafPending = false;
function requestRender(){
  if (rafPending) return;
  rafPending = true;
  requestAnimationFrame(() => { rafPending = false; render(); });
}
function render(){
  if (rowCount() !== lastN) applySize();
  sctx.clearRect(0, 0, W, H);
  const rows = rowLayout();
  for (const rw of rows) renderRow(rw);
  layoutPins(rows);
}

function renderRow(rw){
  const { a, b } = rw;
  const sT = rw.bandTop, sH = rw.bandH;
  const Xf = f => XFR(f, rw);

  /* ITU + IEEE rails */
  sctx.font = "700 " + (rw.n > 1 ? 10 : 11) + "px 'Bahnschrift','Avenir Next Condensed','Arial Narrow',system-ui";
  for (const [lo, hi, code, longName] of ITU_BANDS){
    const x0 = Math.max(0, Xf(lo)), x1 = Math.min(W, Xf(hi));
    if (x1 <= 0 || x0 >= W) continue;
    sctx.strokeStyle = COLORS.line;
    sctx.strokeRect(x0 + .5, rw.railIY + .5, x1 - x0, rw.railI - 1);
    sctx.fillStyle = COLORS.muted;
    const w = x1 - x0;
    if (w > 30){
      const label = w > 220 ? code + " · " + longName + " Frequency" : code;
      sctx.textAlign = "center"; sctx.textBaseline = "middle";
      sctx.fillText(label, (x0 + x1) / 2, rw.railIY + rw.railI / 2 + 1);
    }
  }
  sctx.font = "600 " + (rw.n > 1 ? 9 : 10) + "px ui-monospace,Menlo,Consolas,monospace";
  for (const [lo, hi, code] of IEEE_BANDS){
    const x0 = Math.max(0, Xf(lo)), x1 = Math.min(W, Xf(hi));
    if (x1 <= 0 || x0 >= W || x1 - x0 < 14) continue;
    sctx.strokeStyle = COLORS.line;
    sctx.strokeRect(x0 + .5, rw.railEY + .5, x1 - x0, rw.railE - 1);
    sctx.fillStyle = COLORS.muted;
    sctx.textAlign = "center"; sctx.textBaseline = "middle";
    sctx.fillText(code, (x0 + x1) / 2, rw.railEY + rw.railE / 2 + 1);
  }

  /* bands */
  const fLo = Math.pow(10, a), fHi = Math.pow(10, b);
  for (const band of state.bands){
    if (band.hi < fLo || band.lo > fHi) continue;
    let x0 = Xf(band.lo), x1 = Xf(band.hi);
    if (x1 - x0 < .8) x1 = x0 + .8;
    const bw = x1 - x0;
    const vx0 = Math.max(x0, 0), vx1 = Math.min(x1, W), vw = vx1 - vx0;
    const dim = state.fam && !band.svcs.some(s => famOf(s) === state.fam);
    const n = band.svcs.length;
    const hasNick = band.nick && vw > 70;
    const topY = sT + (hasNick ? NICK_H : 0);
    const segH = (sH - (hasNick ? NICK_H : 0)) / n;

    sctx.globalAlpha = dim ? .13 : 1;
    for (let i = 0; i < n; i++){
      const fam = famOf(band.svcs[i]);
      sctx.fillStyle = COLORS.fam[fam];
      const y = topY + i * segH;
      sctx.fillRect(x0, y, bw, segH - (i < n - 1 ? 1 : 0));
      /* segment label */
      if (!dim && segH > 13){
        const name = band.svcs[i];
        sctx.fillStyle = textOn(COLORS.fam[fam]);
        if (vw > 84){
          sctx.font = (isPrimary(name) ? "600 " : "400 italic ") + "11px system-ui";
          sctx.textAlign = "left"; sctx.textBaseline = "middle";
          const maxChars = Math.floor((vw - 12) / 6.2);
          sctx.fillText(name.length > maxChars ? name.slice(0, Math.max(0, maxChars - 1)) + "…" : name, vx0 + 6, y + segH / 2);
        } else if (vw > 15 && segH > 46){
          sctx.save();
          sctx.translate(vx0 + vw / 2, y + segH - 5);
          sctx.rotate(-Math.PI / 2);
          sctx.font = (isPrimary(name) ? "600 " : "400 ") + "10px system-ui";
          sctx.textAlign = "left"; sctx.textBaseline = "middle";
          const maxC = Math.floor((segH - 10) / 5.6);
          sctx.fillText(name.length > maxC ? name.slice(0, Math.max(0, maxC - 1)) + "…" : name, 0, 0);
          sctx.restore();
        }
      }
    }
    /* nick strip */
    if (hasNick && !dim){
      sctx.fillStyle = COLORS.surface;
      sctx.fillRect(x0, sT, bw, NICK_H);
      sctx.fillStyle = COLORS.ink;
      sctx.font = "600 11.5px 'Bahnschrift','Avenir Next Condensed','Arial Narrow',system-ui";
      sctx.textAlign = "center"; sctx.textBaseline = "middle";
      const t = band.nick, maxC = Math.floor(vw / 6);
      sctx.fillText(t.length > maxC ? t.slice(0, maxC - 1) + "…" : t, vx0 + vw / 2, sT + NICK_H / 2);
    }
    /* overlays */
    if (!dim && band.flags.includes("i") && patIsm){
      sctx.fillStyle = patIsm; sctx.fillRect(x0, topY, bw, sH - (hasNick ? NICK_H : 0));
    }
    if (!dim && band.flags.includes("q") && patQuiet){
      sctx.fillStyle = patQuiet; sctx.fillRect(x0, topY, bw, sH - (hasNick ? NICK_H : 0));
    }
    sctx.globalAlpha = 1;
    /* band divider */
    sctx.strokeStyle = COLORS.surface; sctx.lineWidth = 1;
    sctx.beginPath(); sctx.moveTo(x1 + .5, sT); sctx.lineTo(x1 + .5, sT + sH); sctx.stroke();
    /* differs-from-FCC dashes */
    if (band.diff && bw > 3){
      sctx.strokeStyle = COLORS.accent; sctx.lineWidth = 2;
      sctx.setLineDash([5, 4]);
      sctx.beginPath(); sctx.moveTo(x0 + 1, sT + sH - 1.5); sctx.lineTo(x1 - 1, sT + sH - 1.5); sctx.stroke();
      sctx.setLineDash([]);
    }
  }

  /* selection + hover outline (only in the row that owns the band) */
  for (const [bnd, wdt] of [[state.sel, 2.5], [state.hover && state.hover.band, 1.5]]){
    if (!bnd || bnd.hi < fLo || bnd.lo > fHi) continue;
    const x0 = Math.max(Xf(bnd.lo), -2), x1 = Math.min(Math.max(Xf(bnd.hi), x0 + 1), W + 2);
    sctx.strokeStyle = COLORS.accent; sctx.lineWidth = wdt;
    sctx.strokeRect(x0 + wdt/2, sT + wdt/2, x1 - x0 - wdt, sH - wdt);
  }

  /* axis */
  const axY = rw.axY;
  sctx.strokeStyle = COLORS.ink; sctx.lineWidth = 1;
  sctx.beginPath(); sctx.moveTo(0, axY + .5); sctx.lineTo(W, axY + .5); sctx.stroke();
  sctx.font = "10.5px ui-monospace,Menlo,Consolas,monospace";
  let lastEnd = -1e9;
  for (const t of niceTicks(a, b)){
    const x = Xf(t.f);
    if (x < -2 || x > W + 2) continue;
    sctx.strokeStyle = COLORS.muted;
    sctx.beginPath(); sctx.moveTo(x + .5, axY); sctx.lineTo(x + .5, axY + (t.major ? 7 : 4)); sctx.stroke();
    if (t.major){
      const label = fmtFreq(t.f);
      const wpx = sctx.measureText(label).width;
      /* nudge edge labels inside the canvas so they never clip */
      const lx = Math.min(Math.max(x, wpx / 2 + 3), W - wpx / 2 - 3);
      if (lx - wpx / 2 > lastEnd + 8){
        sctx.fillStyle = COLORS.ink;
        sctx.textAlign = "center"; sctx.textBaseline = "top";
        sctx.fillText(label, lx, axY + 9);
        lastEnd = lx + wpx / 2;
      }
    }
  }
  /* wavelength ruler (single-row views only; λ also lives in the tooltip and card) */
  if (rw.waveH){
    sctx.font = "10px ui-monospace,Menlo,Consolas,monospace";
    sctx.fillStyle = COLORS.muted;
    sctx.textAlign = "center"; sctx.textBaseline = "top";
    const wlY = axY + AX_H;
    let lastW = -1e9;
    for (let e = 6; e >= -4; e--){
      const lam = Math.pow(10, e), f = C_LIGHT / lam;
      const x = Xf(f);
      if (x < 16 || x > W - 16) continue;
      const lbl = "λ " + (e >= 3 ? Math.pow(10, e-3) + " km" : e >= 0 ? lam + " m" : e >= -2 ? Math.pow(10, e+2) + " cm" : Math.pow(10, e+3) + " mm");
      const wpx = sctx.measureText(lbl).width;
      if (x - wpx/2 > lastW + 10){
        sctx.strokeStyle = COLORS.line;
        sctx.beginPath(); sctx.moveTo(x + .5, wlY); sctx.lineTo(x + .5, wlY + 4); sctx.stroke();
        sctx.fillText(lbl, x, wlY + 4);
        lastW = x + wpx/2;
      }
    }
  }

  /* crosshair — only in the hovered row */
  if (state.hover && state.hover.row === rw.r){
    const x = state.hover.x;
    sctx.strokeStyle = COLORS.accent; sctx.lineWidth = 1;
    sctx.setLineDash([3, 3]);
    sctx.beginPath(); sctx.moveTo(x + .5, sT); sctx.lineTo(x + .5, sT + sH); sctx.stroke();
    sctx.setLineDash([]);
  }
}

/* ── landmark pins ── */
function layoutPins(rows){
  pinrow.textContent = "";
  const placed = rows.map(() => []);
  let total = 0;
  for (const lm of state.landmarks){
    const lg = (Math.log10(lm.lo) + Math.log10(lm.hi)) / 2;
    const rw = rows.find(r => lg >= r.a && lg <= r.b);
    if (!rw) continue;
    const cx = XR(lg, rw);
    if (cx < 8 || cx > W - 8) continue;
    const wpx = lm.label.length * 6.4 + 20;
    if (placed[rw.r].some(([p0, p1]) => cx - wpx/2 < p1 && cx + wpx/2 > p0)) continue;
    placed[rw.r].push([cx - wpx/2, cx + wpx/2]);
    const el = document.createElement("button");
    el.className = "pin"; el.textContent = lm.label;
    el.style.left = cx + "px";
    el.style.top = (rw.pinY + 3) + "px";
    el.title = fmtFreq(lm.lo) + (lm.hi > lm.lo ? " – " + fmtFreq(lm.hi) : "");
    el.addEventListener("click", () => flyTo(lm.lo, lm.hi));
    pinrow.appendChild(el);
    if (++total > 60) break;
  }
}

/* ── minimap ── */
function renderMini(){
  const mw = mini.clientWidth, mh = 44;
  mctx.clearRect(0, 0, mw, mh);
  const mx = f => (Math.log10(f) - LOGMIN) / (LOGMAX - LOGMIN) * mw;
  for (const b of state.bands){
    const x0 = mx(b.lo), x1 = Math.max(mx(b.hi), x0 + .6);
    mctx.fillStyle = COLORS.fam[famOf(b.svcs[0])];
    mctx.globalAlpha = .85;
    mctx.fillRect(x0, 6, x1 - x0, mh - 12);
  }
  mctx.globalAlpha = 1;
  mctx.strokeStyle = COLORS.line;
  for (let d = 4; d <= 11; d++){
    const x = (d - LOGMIN) / (LOGMAX - LOGMIN) * mw;
    mctx.beginPath(); mctx.moveTo(x + .5, 2); mctx.lineTo(x + .5, mh - 2); mctx.stroke();
  }
  const vx0 = (state.view.a - LOGMIN) / (LOGMAX - LOGMIN) * mw;
  const vx1 = (state.view.b - LOGMIN) / (LOGMAX - LOGMIN) * mw;
  mctx.fillStyle = COLORS.accent; mctx.globalAlpha = .15;
  mctx.fillRect(vx0, 0, Math.max(vx1 - vx0, 3), mh);
  mctx.globalAlpha = 1;
  mctx.strokeStyle = COLORS.accent; mctx.lineWidth = 1.5;
  mctx.strokeRect(vx0 + .75, .75, Math.max(vx1 - vx0, 3) - 1.5, mh - 1.5);
}

/* ── view control ── */
function clampView(a, b){
  let span = Math.max(MIN_SPAN, Math.min(b - a, LOGMAX - LOGMIN));
  if (a < LOGMIN){ a = LOGMIN; }
  if (a + span > LOGMAX){ a = LOGMAX - span; }
  return { a, b: a + span };
}
function setView(a, b){
  state.view = clampView(a, b);
  renderMini(); requestRender(); saveHashSoon();
}
function zoomAt(x, factor, rw){
  const { a, b } = state.view;
  const rows = rowLayout();
  rw = rw || rows[Math.floor(rows.length / 2)];
  const pivot = rw.a + x / W * (rw.b - rw.a);   // frequency under the cursor
  const span = b - a, nspan = Math.max(MIN_SPAN, Math.min(span * factor, LOGMAX - LOGMIN));
  const frac = (pivot - a) / span;              // hold it at the same place in the view
  const na = pivot - frac * nspan;
  setView(na, na + nspan);
}
function flyTo(lo, hi){
  let la = Math.log10(lo), lb = Math.log10(Math.max(hi, lo));
  if (lb - la < .01){ const c = (la + lb) / 2; la = c - .06; lb = c + .06; }
  const pad = (lb - la) * .18;
  const target = clampView(la - pad, lb + pad + ((lb - la) < MIN_SPAN ? MIN_SPAN : 0));
  if (matchMedia("(prefers-reduced-motion: reduce)").matches){
    setView(target.a, target.b); return;
  }
  const from = { ...state.view }, t0 = performance.now(), dur = 550;
  if (state.anim) cancelAnimationFrame(state.anim);
  const step = now => {
    const t = Math.min(1, (now - t0) / dur);
    const e = t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2;
    state.view = {
      a: from.a + (target.a - from.a) * e,
      b: from.b + (target.b - from.b) * e,
    };
    renderMini(); render();
    if (t < 1) state.anim = requestAnimationFrame(step);
    else { state.anim = null; saveHashSoon(); }
  };
  state.anim = requestAnimationFrame(step);
}

/* ── pointer interaction ── */
const pointers = new Map();
let dragStart = null, moved = false, pinch0 = null;
strip.addEventListener("pointerdown", e => {
  strip.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.offsetX, y: e.offsetY });
  moved = false;
  if (pointers.size === 1) dragStart = { x: e.offsetX, view: { ...state.view }, n: lastN };
  else if (pointers.size === 2){
    const [p1, p2] = [...pointers.values()];
    pinch0 = { d: Math.abs(p1.x - p2.x) || 1, cx: (p1.x + p2.x) / 2, view: { ...state.view } };
    dragStart = null;
  }
});
strip.addEventListener("pointermove", e => {
  if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.offsetX, y: e.offsetY });
  if (pointers.size === 2 && pinch0){
    const [p1, p2] = [...pointers.values()];
    const d = Math.abs(p1.x - p2.x) || 1;
    const scale = pinch0.d / d;
    const span0 = pinch0.view.b - pinch0.view.a;
    const pivot = pinch0.view.a + pinch0.cx / W * span0;
    const cx = (p1.x + p2.x) / 2;
    let na = pivot - cx / W * span0 * scale;
    setView(na, na + span0 * scale);
    moved = true;
    return;
  }
  if (dragStart && pointers.size === 1){
    const dx = e.offsetX - dragStart.x;
    if (Math.abs(dx) > 3) moved = true;
    /* pan by the row's own slice so content tracks the cursor 1:1 */
    const slice = (dragStart.view.b - dragStart.view.a) / dragStart.n;
    const shift = -dx / W * slice;
    setView(dragStart.view.a + shift, dragStart.view.b + shift);
  }
  updateHover(e.offsetX, e.offsetY);
});
function endPointer(e){
  pointers.delete(e.pointerId);
  if (pointers.size < 2) pinch0 = null;
  if (pointers.size === 0){
    if (!moved && e.type === "pointerup"){
      const rw = rowAtY(e.offsetY);
      const b = findBand(state.bands, fAtRow(e.offsetX, rw));
      selectBand(b === state.sel ? null : b);
    }
    dragStart = null;
  }
}
strip.addEventListener("pointerup", endPointer);
strip.addEventListener("pointercancel", endPointer);
strip.addEventListener("pointerleave", () => {
  if (pointers.size === 0){ state.hover = null; tooltip.style.display = "none"; readout.innerHTML = ""; requestRender(); }
});
strip.addEventListener("wheel", e => {
  e.preventDefault();
  zoomAt(e.offsetX, Math.exp(e.deltaY * .0016), rowAtY(e.offsetY));
  updateHover(e.offsetX, e.offsetY);
}, { passive: false });
strip.addEventListener("dblclick", e => {
  const rw = rowAtY(e.offsetY);
  const b = findBand(state.bands, fAtRow(e.offsetX, rw));
  if (b && e.shiftKey === false) flyTo(b.lo, b.hi);
  else zoomAt(e.offsetX, e.shiftKey ? 3 : 1/3, rw);
});

function updateHover(x, y){
  const rw = rowAtY(y);
  const f = fAtRow(x, rw);
  const band = findBand(state.bands, f);
  state.hover = { x, y, f, band, row: rw.r };
  readout.innerHTML = "<b>" + fmtFreq(f) + "</b> · λ " + fmtWave(f);
  if (band){
    tooltip.style.display = "block";
    let html = "<div class='tt-t'>" + (band.nick || fmtFreq(band.lo) + " – " + fmtFreq(band.hi)) + "</div>";
    html += "<div class='tt-f'>" + fmtFreq(band.lo) + " – " + fmtFreq(band.hi) + " · BW " + fmtFreq(band.hi - band.lo) + "</div>";
    for (const s of band.svcs){
      html += "<div class='tt-s'><span class='sw' style='background:" + COLORS.fam[famOf(s)] + "'></span>" + s + "</div>";
    }
    if (band.diff) html += "<div class='tt-more'>≠ FCC table — click to compare</div>";
    else if (band.note) html += "<div class='tt-more'>click for the story</div>";
    tooltip.innerHTML = html;
    const tw = tooltip.offsetWidth, th = tooltip.offsetHeight, sw = strip.clientWidth;
    let tx = x + 16; if (tx + tw > sw - 8) tx = x - tw - 16;
    let ty = y + 18; if (ty + th > H - 4) ty = Math.max(2, y - th - 12);
    tooltip.style.left = Math.max(4, tx) + "px";
    tooltip.style.top = ty + "px";
  } else tooltip.style.display = "none";
  requestRender();
}

/* keyboard */
strip.addEventListener("keydown", e => {
  const step = (state.view.b - state.view.a) / lastN * .12;
  if (e.key === "ArrowLeft"){ setView(state.view.a - step, state.view.b - step); }
  else if (e.key === "ArrowRight"){ setView(state.view.a + step, state.view.b + step); }
  else if (e.key === "+" || e.key === "="){ zoomAt(W/2, .7); }
  else if (e.key === "-" || e.key === "_"){ zoomAt(W/2, 1.4); }
  else if (e.key === "0" || e.key === "Home"){ setView(LOGMIN, LOGMAX); }
  else return;
  e.preventDefault();
});
$("zin").addEventListener("click", () => zoomAt(W/2, .55));
$("zout").addEventListener("click", () => zoomAt(W/2, 1.8));
$("zfit").addEventListener("click", () => flyTo(3e3, 3e11));

/* minimap interaction */
let miniDrag = false;
function miniGo(e){
  const r = mini.getBoundingClientRect();
  const frac = (e.clientX - r.left) / r.width;
  const lg = LOGMIN + frac * (LOGMAX - LOGMIN);
  const span = state.view.b - state.view.a;
  setView(lg - span/2, lg + span/2);
}
mini.addEventListener("pointerdown", e => { miniDrag = true; mini.setPointerCapture(e.pointerId); miniGo(e); });
mini.addEventListener("pointermove", e => { if (miniDrag) miniGo(e); });
mini.addEventListener("pointerup", () => miniDrag = false);
mini.addEventListener("pointercancel", () => miniDrag = false);

/* ── selection & detail panel ── */
function selectBand(b){
  state.sel = b;
  if (b) showBandCard(b); else showAuthCard();
  requestRender(); saveHashSoon();
}
function psBadge(s){ return isPrimary(s) ? "PRIMARY" : "secondary"; }
function showBandCard(b){
  const d = $("detail");
  const itu = ITU_BANDS.find(x => b.lo >= x[0] && b.lo < x[1]);
  const ieee = IEEE_BANDS.find(x => b.lo >= x[0] && b.lo < x[1]);
  let h = "<h2>Band detail</h2>";
  h += "<div class='d-nick'>" + (b.nick || "Allocation") + "</div>";
  h += "<div class='d-range'>" + fmtFreq(b.lo) + " – " + fmtFreq(b.hi) +
       " · BW " + fmtFreq(b.hi - b.lo) + " · λ " + fmtWave(b.hi) + " – " + fmtWave(b.lo) + "</div>";
  h += "<div class='d-meta'>";
  if (itu) h += "<span class='mchip'>" + itu[2] + " — " + itu[3] + " Frequency</span>";
  if (ieee) h += "<span class='mchip'>IEEE " + ieee[2] + "-band</span>";
  if (b.flags.includes("i")) h += "<span class='mchip warn'>Unlicensed / ISM</span>";
  if (b.flags.includes("q")) h += "<span class='mchip warn'>Passive quiet band</span>";
  if (b.diff) h += "<span class='mchip warn'>≠ FCC</span>";
  h += "</div><table>";
  for (const s of b.svcs){
    h += "<tr><td><span class='sw' style='background:" + COLORS.fam[famOf(s)] + "'></span>" + s +
         "</td><td class='ps'>" + psBadge(s) + "</td></tr>";
  }
  h += "</table>";
  if (b.note) h += "<p class='d-note'>" + b.note + "</p>";
  if (b.diff && b.fcc){
    h += "<div class='d-fcc'><b>FCC table here:</b> " + (b.fcc.nick ? b.fcc.nick + " — " : "") +
         b.fcc.svcs.join(", ") + "</div>";
  }
  d.innerHTML = h;
  renderEncyclopedia(b, d);
  d.insertAdjacentHTML("beforeend",
    "<div class='navbtns'><button id='bprev'>← Previous band</button><button id='bzoom'>Zoom to band</button><button id='bnext'>Next band →</button></div>");
  const idx = state.bands.indexOf(b);
  $("bprev").addEventListener("click", () => { const nb = state.bands[idx-1]; if (nb){ selectBand(nb); flyTo(nb.lo, nb.hi); } });
  $("bnext").addEventListener("click", () => { const nb = state.bands[idx+1]; if (nb){ selectBand(nb); flyTo(nb.lo, nb.hi); } });
  $("bzoom").addEventListener("click", () => flyTo(b.lo, b.hi));
}
function showAuthCard(){
  const A = AUTH[state.auth], d = $("detail");
  let h = "<h2>Regulator</h2>";
  h += "<div class='d-nick'>" + A.flag + " " + A.full + "</div>";
  h += "<div class='d-range'>" + A.country + " · " + A.region + " · " + state.bands.length + " bands in this model</div>";
  h += "<p class='d-note'>" + A.about + "</p>";
  h += "<ul class='quirks'>" + A.quirks.map(q => "<li>" + q + "</li>").join("") + "</ul>";
  h += "<p class='d-note' style='color:var(--muted);font-size:13px;margin-top:10px'>Click any band on the chart for its allocation card, or click a service in the legend to trace it across the spectrum.</p>";
  d.innerHTML = h;
}

/* ── legend ── */
function buildLegend(){
  const wrap = $("fams");
  wrap.textContent = "";
  const counts = {};
  for (const b of state.bands)
    for (const s of b.svcs){
      const f = famOf(s);
      counts[f] = (counts[f] || 0);
    }
  for (const b of state.bands){
    const seen = new Set(b.svcs.map(famOf));
    for (const f of seen) counts[f] = (counts[f] || 0) + 1;
  }
  for (const f of FAM_ORDER){
    const btn = document.createElement("button");
    btn.className = "fam";
    btn.setAttribute("aria-pressed", state.fam === f ? "true" : "false");
    btn.innerHTML = "<span class='sw' style='background:var(--f-" + f + ")'></span>" +
      FAMS[f].name + "<span class='n'>" + (counts[f] || 0) + "</span>";
    btn.addEventListener("click", () => {
      state.fam = state.fam === f ? null : f;
      buildLegend(); requestRender();
      $("clearfam").classList.toggle("on", !!state.fam);
    });
    wrap.appendChild(btn);
  }
}
$("clearfam").addEventListener("click", () => {
  state.fam = null; buildLegend(); requestRender();
  $("clearfam").classList.remove("on");
});

/* ── chips ── */
function buildChips(){
  const c = $("chips");
  c.querySelectorAll(".chip").forEach(x => x.remove());
  for (const lm of state.landmarks.filter(l => l.tour)){
    const b = document.createElement("button");
    b.className = "chip"; b.textContent = lm.label;
    b.addEventListener("click", () => flyTo(lm.lo, lm.hi));
    c.appendChild(b);
  }
}

/* ── search ── */
const searchEl = $("search"), resEl = $("results");
function parseFreq(q){
  const m = q.trim().toLowerCase().match(/^([\d.,]+)\s*(hz|khz|mhz|ghz|k|m|g)?\s*$/);
  if (!m) return null;
  const v = parseFloat(m[1].replace(/,/g, ""));
  if (!isFinite(v) || v <= 0) return null;
  const mult = { hz:1, khz:1e3, k:1e3, mhz:1e6, m:1e6, ghz:1e9, g:1e9 }[m[2] || "mhz"];
  const f = v * mult;
  return (f >= 3e3 && f <= 3e11) ? f : null;
}
function doSearch(q){
  resEl.textContent = "";
  if (!q.trim()){ resEl.style.display = "none"; return; }
  const items = [];
  const f = parseFreq(q);
  if (f !== null){
    const b = findBand(state.bands, f);
    items.push({ label: "Go to " + fmtFreq(f) + (b && b.nick ? " — " + b.nick : ""), f0: f, f1: f, band: b });
  }
  const ql = q.toLowerCase();
  for (const lm of state.landmarks)
    if (lm.label.toLowerCase().includes(ql))
      items.push({ label: lm.label, f0: lm.lo, f1: lm.hi });
  for (const b of state.bands){
    const hay = (b.nick + " " + b.note + " " + b.svcs.join(" ")).toLowerCase();
    if (hay.includes(ql))
      items.push({ label: (b.nick || b.svcs[0]), f0: b.lo, f1: b.hi, band: b });
    if (items.length > 14) break;
  }
  const seen = new Set();
  let shown = 0;
  for (const it of items){
    const key = it.label + it.f0;
    if (seen.has(key)) continue;
    seen.add(key);
    const btn = document.createElement("button");
    btn.setAttribute("role", "option");
    btn.innerHTML = "<span>" + it.label + "</span><span class='rf'>" +
      fmtFreq(it.f0) + (it.f1 > it.f0 ? "–" + fmtFreq(it.f1) : "") + "</span>";
    btn.addEventListener("click", () => {
      flyTo(it.f0, it.f1);
      if (it.band) selectBand(it.band);
      resEl.style.display = "none"; searchEl.value = "";
    });
    resEl.appendChild(btn);
    if (++shown >= 8) break;
  }
  resEl.style.display = shown ? "block" : "none";
}
searchEl.addEventListener("input", () => doSearch(searchEl.value));
searchEl.addEventListener("keydown", e => {
  if (e.key === "Enter"){
    const first = resEl.querySelector("button");
    if (first) first.click();
  } else if (e.key === "Escape"){ resEl.style.display = "none"; }
});
document.addEventListener("click", e => {
  if (!e.target.closest(".searchbox")) resEl.style.display = "none";
});

/* ── authority select ── */
const sel = $("auth");
for (const key of Object.keys(AUTH)){
  const o = document.createElement("option");
  o.value = key;
  o.textContent = AUTH[key].flag + " " + AUTH[key].name + " — " + AUTH[key].country;
  sel.appendChild(o);
}
sel.value = "fcc";
sel.addEventListener("change", () => build(sel.value));

/* ── theme reactivity ── */
function onTheme(){
  readColors(); makePatterns(); renderMini(); requestRender();
  if (state.sel) showBandCard(state.sel);
}
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", onTheme);
new MutationObserver(onTheme).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

/* ── wordmark: keyed slices ──
   A dense run of 1–3 px cuts at irregular 4–8 px spacing — a carrier gated at
   high rate. Slices this fine can't amputate a glyph, so they're distributed
   across the whole wordmark rather than placed per letter. Seeded, so the
   pattern is identical on every re-render instead of shimmering on resize. */
const KEY_SLICE = { w: [1, 3], gap: [4, 8], seed: 20260808 };
function keyWordmark(){
  const el = $("wordmark");
  if (!el || !CSS.supports("mask-image", "linear-gradient(#000,#000)")) return;
  const width = el.getBoundingClientRect().width;
  if (!width) return;
  const rnd = lcg(KEY_SLICE.seed);
  const [w0, w1] = KEY_SLICE.w, [g0, g1] = KEY_SLICE.gap;
  /* whole-pixel stops so the cuts stay crisp on 1× displays */
  let g = "linear-gradient(90deg", at = 0, x = 2 + Math.round(rnd() * 3), n = 0;
  while (x < width - 3 && n < 90){
    const x1 = x + w0 + Math.round(rnd() * (w1 - w0));
    g += ", #000 " + at + "px " + x + "px";
    g += ", transparent " + x + "px " + x1 + "px";
    at = x1; n++;
    x = x1 + g0 + Math.round(rnd() * (g1 - g0));
  }
  g += ", #000 " + at + "px 100%)";
  el.style.webkitMaskImage = g;
  el.style.maskImage = g;
}

/* ── boot ── */
readColors(); makePatterns();
const hp = new URLSearchParams(location.hash.slice(1));
const bootAuth = AUTH[hp.get("a")] ? hp.get("a") : "fcc";
sel.value = bootAuth;
build(bootAuth);
resize();
{
  const v = (hp.get("v") || "").split(",");
  if (v.length === 2 && isFinite(+v[0]) && isFinite(+v[1]) && +v[1] > +v[0]) setView(+v[0], +v[1]);
  const blo = +hp.get("b");
  if (blo){
    const bb = state.bands.find(x => x.lo === blo);
    if (bb){ selectBand(bb); if (!hp.get("v")) flyTo(bb.lo, bb.hi); }
  }
}
booting = false;
keyWordmark();
if (document.fonts && document.fonts.ready) document.fonts.ready.then(keyWordmark);
window.addEventListener("resize", resize);
new ResizeObserver(() => { if (strip.clientWidth !== W) resize(); }).observe(strip);
