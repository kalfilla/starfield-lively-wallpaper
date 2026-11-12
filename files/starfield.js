(async function () {
  'use strict';

  // Keep these runtime values in sync with LivelyProperties.json for file:// use.
  var livelyProperties;
  var usingFallback = false;
  try {
    var propertiesResponse = await fetch('./LivelyProperties.json');
    if (!propertiesResponse.ok) {
      throw new Error('HTTP ' + propertiesResponse.status);
    }
    livelyProperties = await propertiesResponse.json();
  } catch (error) {
    console.warn('Unable to fetch LivelyProperties.json; using the embedded fallback.', error);
    livelyProperties = {
      starCount: { min: 100, max: 1600, step: 50, value: 1200 },
      speed: { min: 1, max: 10, step: 1, value: 1 },
      warp: { min: 0, max: 10, step: 1, value: 0 },
      starSize: { min: 1, max: 10, step: 1, value: 4 },
      glow: { min: 0, max: 10, step: 1, value: 5 },
      trail: { min: 0, max: 9, step: 1, value: 0 },
      roll: { min: -10, max: 10, step: 1, value: 0 },
      starColor: { value: '#FFFFFF' },
      colorMode: { value: 0 },
      steering: { value: 0 },
      nebulaBackdrop: { value: false },
      comets: { value: true },
      twinklingStars: { value: false },
      clockOverlay: { value: true },
      showClockSeconds: { value: false },
      clockSize: { min: 1, max: 8, step: 0.5, value: 2 },
      clockVerticalPosition: { min: 4, max: 92, step: 1, value: 10 },
      clockHorizontalPosition: { min: 0, max: 100, step: 1, value: 5 },
      clockAlignment: { value: 0 },
      autoQuality: { value: true },
      startStandaloneFullscreen: { value: false },
    };
    usingFallback = true;
  }

  var $ = function (id) {
    return document.getElementById(id);
  };
  var canvas = $('star-canvas'),
    ctx = canvas.getContext('2d');
  var wrap = $('canvas-wrap'),
    nebEl = $('nebula'),
    flashEl = $('sf-flash'),
    hudEl = $('sf-hud'),
    clockEl = $('sf-clock');
  var RAINBOW = [
    '#ff5566',
    '#ff9944',
    '#ffd700',
    '#00ff88',
    '#00d4ff',
    '#4488ff',
    '#b388ff',
    '#ff66cc',
  ];
  var REAL_W = [
    ['#9bb0ff', 1],
    ['#aabfff', 2],
    ['#cad7ff', 4],
    ['#f8f7ff', 10],
    ['#fff4ea', 18],
    ['#ffd2a1', 30],
    ['#ffcc6f', 35],
  ];
  // Pre-build color lookup tables so star rendering doesn't calculate colors every frame.
  var REAL = [];
  REAL_W.forEach(function (p) {
    for (var i = 0; i < p[1]; i++) REAL.push(p[0]);
  });
  var DEPTH = [];
  (function () {
    var stops = [
      [0, [88, 52, 230]],
      [0.5, [0, 200, 255]],
      [1, [255, 255, 255]],
    ];
    for (var i = 0; i < 32; i++) {
      var u = i / 31,
        a = u < 0.5 ? stops[0] : stops[1],
        b = u < 0.5 ? stops[1] : stops[2],
        k = u < 0.5 ? u / 0.5 : (u - 0.5) / 0.5;
      DEPTH.push(
        'rgb(' +
        Math.round(a[1][0] + (b[1][0] - a[1][0]) * k) +
        ',' +
        Math.round(a[1][1] + (b[1][1] - a[1][1]) * k) +
        ',' +
        Math.round(a[1][2] + (b[1][2] - a[1][2]) * k) +
        ')',
      );
    }
  })();

  /* ── settings ────────────────────────────────────────────── */
  // Values shared with Lively are loaded from LivelyProperties.json.
  var BASE = {
    style: 'smooth',
    neb: 'nebula',
  };
  // Keep URL names and control IDs here; Lively supplies shared types and values.
  var SETTINGS = {
    count: {
      type: 'number',
      query: 'n',
      lively: 'starCount',
      control: 's-count',
      valueControl: 'v-count',
    },
    speed: {
      type: 'number',
      query: 'sp',
      lively: 'speed',
      control: 's-speed',
      valueControl: 'v-speed',
    },
    warp: {
      type: 'number',
      query: 'w',
      lively: 'warp',
      control: 's-warp',
      valueControl: 'v-warp',
    },
    size: {
      type: 'number',
      query: 'sz',
      lively: 'starSize',
      control: 's-size',
      valueControl: 'v-size',
    },
    glow: {
      type: 'number',
      query: 'g',
      lively: 'glow',
      control: 's-glow',
      valueControl: 'v-glow',
    },
    trail: {
      type: 'number',
      query: 'tr',
      lively: 'trail',
      control: 's-trail',
      valueControl: 'v-trail',
    },
    roll: {
      type: 'number',
      query: 'ro',
      lively: 'roll',
      control: 's-roll',
      valueControl: 'v-roll',
    },
    color: { type: 'color', query: 'c', lively: 'starColor' },
    cm: {
      type: 'enum',
      query: 'cm',
      lively: 'colorMode',
      values: ['fixed', 'rainbow', 'real', 'depth'],
    },
    steer: { type: 'enum', query: 'st', lively: 'steering', values: ['off', 'pointer', 'auto'] },
    nebula: { type: 'boolean', query: 'nb', lively: 'nebulaBackdrop', control: 'o-nebula' },
    comets: { type: 'boolean', query: 'co', lively: 'comets', control: 'o-comets' },
    twinkle: { type: 'boolean', query: 'tw', lively: 'twinklingStars', control: 'o-twinkle' },
    clock: { type: 'boolean', query: 'cl', lively: 'clockOverlay', control: 'o-clock' },
    clockSeconds: {
      type: 'boolean',
      query: 'cs',
      lively: 'showClockSeconds',
      control: 'o-clock-seconds',
    },
    clockSize: {
      type: 'number',
      query: 'cz',
      lively: 'clockSize',
      control: 's-clock-size',
      valueControl: 'v-clock-size',
      unit: ' rem',
    },
    clockPosition: {
      type: 'number',
      query: 'cv',
      lively: 'clockVerticalPosition',
      control: 's-clock-position',
      valueControl: 'v-clock-position',
      unit: '%',
    },
    clockHorizontalPosition: {
      type: 'number',
      query: 'ch',
      lively: 'clockHorizontalPosition',
      control: 's-clock-horizontal',
      valueControl: 'v-clock-horizontal',
      unit: '%',
    },
    clockAlignment: {
      type: 'enum',
      query: 'ca',
      lively: 'clockAlignment',
      values: ['left', 'right'],
      control: 'o-clock-alignment',
    },
    auto: { type: 'boolean', query: 'aq', lively: 'autoQuality', control: 'o-auto' },
    fullscreen: {
      type: 'boolean',
      query: 'fs',
      lively: 'startStandaloneFullscreen',
      control: 'o-fullscreen',
    },
  };
  function loadLivelySettings() {
    Object.keys(SETTINGS).forEach(function (key) {
      var setting = SETTINGS[key];
      var property = livelyProperties[setting.lively];
      if (!property) {
        throw new Error('Missing Lively property "' + setting.lively + '".');
      }

      if (setting.type === 'number') {
        if (
          (!usingFallback && property.type !== 'slider') ||
          !Number.isFinite(property.min) ||
          !Number.isFinite(property.max) ||
          !Number.isFinite(property.step) ||
          !Number.isFinite(property.value) ||
          property.min > property.max ||
          property.step <= 0 ||
          property.value < property.min ||
          property.value > property.max
        ) {
          throw new Error('Invalid slider definition for "' + setting.lively + '".');
        }
        setting.range = [property.min, property.max];
        setting.step = property.step;
        BASE[key] = property.value;
      } else if (setting.type === 'enum') {
        if (
          (!usingFallback && property.type !== 'dropdown') ||
          !Number.isInteger(property.value) ||
          property.value < 0 ||
          property.value >= setting.values.length
        ) {
          throw new Error('Invalid dropdown definition for "' + setting.lively + '".');
        }
        BASE[key] = setting.values[property.value];
      } else if (setting.type === 'boolean') {
        if ((!usingFallback && property.type !== 'checkbox') || typeof property.value !== 'boolean') {
          throw new Error('Invalid checkbox definition for "' + setting.lively + '".');
        }
        BASE[key] = property.value;
      } else if (setting.type === 'color') {
        if ((!usingFallback && property.type !== 'color') || typeof property.value !== 'string') {
          throw new Error('Invalid color definition for "' + setting.lively + '".');
        }
        BASE[key] = property.value;
      }
    });
  }
  loadLivelySettings();

  /* ── presets ─────────────────────────────────────────────── */
  // BASE provides defaults; presets override only the settings they define.
  function P(o) {
    var r = {},
      k;
    for (k in BASE) r[k] = BASE[k];
    for (k in o)
      r[k] = Object.prototype.hasOwnProperty.call(SETTINGS, k) ? normalizeSetting(k, o[k]) : o[k];
    return r;
  }
  var PRESETS = {
    classic: P({}),
    zen: P({
      count: 220,
      speed: 1,
      warp: 0,
      size: 7,
      glow: 4,
      trail: 0,
      roll: 0,
      cm: 'real',
      steer: 'off',
      nebula: false,
      comets: false,
      twinkle: false,
    }),
  };
  var PRESET_KEYS = Object.keys(PRESETS);
  var LIM = {};
  Object.keys(SETTINGS).forEach(function (key) {
    if (SETTINGS[key].range) LIM[key] = SETTINGS[key].range;
  });
  var SLIDERS = Object.keys(SETTINGS).filter(function (key) {
    return SETTINGS[key].type === 'number';
  });
  var BOOLEAN_SETTINGS = Object.keys(SETTINGS).filter(function (key) {
    return SETTINGS[key].type === 'boolean';
  });
  var LIVELY_SETTING_KEYS = Object.create(null);
  Object.keys(SETTINGS).forEach(function (key) {
    LIVELY_SETTING_KEYS[SETTINGS[key].lively] = key;
  });
  var LIVELY_LABELS = Object.create(null);
  LIVELY_LABELS.flightSettings = true;
  LIVELY_LABELS.sceneSettings = true;
  var PRESET_PREFERENCES = [
    'auto',
    'clock',
    'clockSeconds',
    'clockSize',
    'clockPosition',
    'clockHorizontalPosition',
    'clockAlignment',
    'fullscreen',
  ];

  /* ── state ───────────────────────────────────────────────── */
  var cfg = P({}),
    curPreset = 'classic',
    paused = false,
    isFullscreen = false,
    pseudoFs = false,
    livelyMode = false;
  var W = 800,
    H = 480,
    res = 1,
    A = 1.6,
    F = 240,
    RX = 1.6,
    RY = 1;
  var MAXN = 1300,
    X = new Float32Array(MAXN),
    Y = new Float32Array(MAXN),
    Z = new Float32Array(MAXN),
    PH = new Float32Array(MAXN),
    PC = new Uint8Array(MAXN);
  var t = 0,
    vx = 0,
    vy = 0,
    ringPh = 0,
    gAng = 0,
    qScale = 1,
    lowSecs = 0,
    last = 0;
  var ptr = {
    x: 0,
    y: 0,
    active: false,
  };
  var comet = null,
    nextComet = 3,
    nebCv = null,
    nebKind = '',
    galCv = null,
    lastHud = '';
  var saveTimer = 0,
    dirty = false;

  function rngFrom(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      var x = Math.imul(a ^ (a >>> 15), 1 | a);
      x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }
  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  function spawn(i, initial) {
    if (cfg.style === 'wormhole') {
      var R = Math.max(A, 1) * 0.95,
        r = (0.2 + Math.random() * 1.2) * R,
        a = Math.random() * 6.2832;
      X[i] = Math.cos(a) * r;
      Y[i] = Math.sin(a) * r;
    } else {
      X[i] = (Math.random() * 2 - 1) * RX;
      Y[i] = (Math.random() * 2 - 1) * RY;
    }
    Z[i] = initial ? Math.random() * 0.98 + 0.02 : 1;
    PH[i] = Math.random() * 6.2832;
    PC[i] = (Math.random() * 256) | 0;
  }
  function rebuild() {
    for (var i = 0; i < MAXN; i++) spawn(i, true);
  }

  /* ── canvas size ─────────────────────────────────────────── */
  function sizeCanvas() {
    var r = canvas.getBoundingClientRect();
    W = Math.max(160, r.width);
    H = Math.max(120, r.height);
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    res = cfg.style === 'retro' ? 0.5 : dpr;
    // Reduce resolution on very large displays to keep the canvas responsive.
    while (W * H * res * res > 5.5e6) res *= 0.85;
    var cw = Math.round(W * res),
      ch = Math.round(H * res);
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw;
      canvas.height = ch;
    }
    ctx.setTransform(res, 0, 0, res, 0, 0);
    canvas.classList.toggle('retro', cfg.style === 'retro');
    A = W / H;
    RX = A;
    RY = 1;
    F = H * 0.5;
  }
  function fullRebuild() {
    sizeCanvas();
    rebuild();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  /* ── nebula layer + galaxy sprite ────────────────────────── */
  var NEB_PAL = {
    nebula: [
      [255, 60, 160],
      [90, 80, 255],
      [0, 200, 255],
      [160, 60, 255],
    ],
    zen: [
      [40, 120, 200],
      [90, 60, 200],
      [20, 170, 160],
      [30, 60, 140],
    ],
    galaxy: [
      [255, 170, 90],
      [100, 120, 255],
      [180, 80, 200],
      [60, 90, 200],
    ],
  };
  function makeNebula(kind) {
    // Draw the nebula once to an offscreen canvas, then reuse it as a background image.
    var S = 900,
      c = document.createElement('canvas');
    c.width = c.height = S;
    var g = c.getContext('2d'),
      rnd = rngFrom(kind === 'zen' ? 21 : kind === 'galaxy' ? 33 : 9),
      pal = NEB_PAL[kind] || NEB_PAL.nebula;
    g.fillStyle = '#000';
    g.fillRect(0, 0, S, S);
    g.globalCompositeOperation = 'lighter';
    function blob(x, y, r, col, a) {
      var gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',' + a + ')');
      gr.addColorStop(1, 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',0)');
      g.fillStyle = gr;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    for (var i = 0; i < 18; i++)
      blob(rnd() * S, rnd() * S, 160 + rnd() * 260, pal[i % pal.length], 0.1 + rnd() * 0.12);
    for (i = 0; i < 260; i++) {
      var cx0 = rnd() * S,
        cy0 = rnd() * S;
      blob(cx0, cy0, 22 + rnd() * 70, pal[(i * 7) % pal.length], 0.025 + rnd() * 0.05);
    }
    return c;
  }
  function setNebula() {
    if (!cfg.nebula) {
      nebEl.classList.remove('on');
      return;
    }
    if (nebKind !== cfg.neb || !nebCv) {
      nebKind = cfg.neb;
      nebCv = makeNebula(nebKind);
      try {
        nebEl.style.backgroundImage = 'url(' + nebCv.toDataURL('image/jpeg', 0.94) + ')';
      } catch (e) {
        nebEl.style.backgroundColor = '#101030';
      }
    }
    nebEl.classList.add('on');
  }
  function makeGalaxy() {
    var S = 640,
      c = document.createElement('canvas');
    c.width = c.height = S;
    var g = c.getContext('2d'),
      rnd = rngFrom(7),
      R = S * 0.46,
      i;
    g.translate(S / 2, S / 2);
    g.globalCompositeOperation = 'lighter';
    var gr = g.createRadialGradient(0, 0, 0, 0, 0, R * 1.05);
    gr.addColorStop(0, 'rgba(255,236,200,.9)');
    gr.addColorStop(0.12, 'rgba(255,196,120,.42)');
    gr.addColorStop(0.45, 'rgba(120,110,220,.10)');
    gr.addColorStop(1, 'rgba(60,70,180,0)');
    g.fillStyle = gr;
    g.fillRect(-S / 2, -S / 2, S, S);
    function gauss() {
      return (rnd() + rnd() + rnd() + rnd() - 2) / 2;
    }
    for (i = 0; i < 14000; i++) {
      var arm = i % 2,
        u = Math.pow(rnd(), 0.6),
        rr = u * R,
        th = arm * Math.PI + rr * 0.019 + gauss() * (0.1 + 0.5 * u);
      var x = Math.cos(th) * rr,
        y = Math.sin(th) * rr,
        k = Math.min(1, rr / R);
      var cr = Math.round(255 - 110 * k),
        cg = Math.round(214 - 34 * k),
        cb = Math.round(150 + 105 * k);
      g.fillStyle = 'rgba(' + cr + ',' + cg + ',' + cb + ',' + (0.08 + rnd() * 0.42) + ')';
      var s = 0.6 + rnd() * 1.1;
      g.fillRect(x, y, s, s);
    }
    for (i = 0; i < 70; i++) {
      var u2 = 0.25 + rnd() * 0.7,
        r2 = u2 * R,
        th2 = (i % 2) * Math.PI + r2 * 0.019 + gauss() * 0.12,
        x2 = Math.cos(th2) * r2,
        y2 = Math.sin(th2) * r2;
      var g2 = g.createRadialGradient(x2, y2, 0, x2, y2, 9 + rnd() * 12);
      g2.addColorStop(0, 'rgba(255,110,190,.20)');
      g2.addColorStop(1, 'rgba(255,110,190,0)');
      g.fillStyle = g2;
      g.fillRect(x2 - 24, y2 - 24, 48, 48);
    }
    return c;
  }

  /* ── scripted warp jump ─────────────────────────────────── */
  var WARP_LEN = 22;
  function warpScript(tt) {
    var u = tt % WARP_LEN,
      o = { sp: 1, wp: 1, fl: 0, gl: 0, hud: 'CRUISE' },
      p;
    if (u < 9) {
      o.hud = 'CRUISE';
    } else if (u < 12.5) {
      p = (u - 9) / 3.5;
      var e = p * p;
      o.sp = 1 + 2.2 * e;
      o.wp = 1 + 2.4 * e;
      o.gl = p * 0.6;
      o.hud = 'SPOOLING DRIVE · T-' + Math.max(1, Math.ceil(12.5 - u));
    } else if (u < 13.1) {
      p = (u - 12.5) / 0.6;
      o.sp = 9;
      o.wp = 7;
      o.fl = p;
      o.gl = 1;
      o.hud = 'JUMP';
    } else if (u < 13.9) {
      p = (u - 13.1) / 0.8;
      o.sp = 10;
      o.wp = 7.5;
      o.fl = 1 - p;
      o.gl = 1;
      o.hud = 'JUMP';
    } else if (u < 17) {
      p = (u - 13.9) / 3.1;
      o.sp = 10 - 3 * p;
      o.wp = 7.5 - 1.5 * p;
      o.gl = 0.9 - 0.2 * p;
      o.hud = 'LIGHTSPEED';
    } else if (u < 21) {
      p = (u - 17) / 4;
      var q = 1 - Math.pow(1 - p, 2);
      o.sp = 7 + (1 - 7) * q;
      o.wp = 6 + (1 - 6) * q;
      o.gl = 0.7 * (1 - q);
      o.hud = 'DECELERATING';
    } else {
      o.hud = 'ARRIVED';
    }
    return o;
  }

  /* ── steering ────────────────────────────────────────────── */
  function steerUpdate(dt) {
    var tx = 0,
      ty = 0;
    if (cfg.steer === 'pointer') {
      if (ptr.active) {
        tx = ptr.x;
        ty = ptr.y;
      }
    } else if (cfg.steer === 'auto') {
      tx = Math.sin(t * 0.13) * 0.6 + Math.sin(t * 0.047 + 1) * 0.35;
      ty = Math.cos(t * 0.09) * 0.4 + Math.sin(t * 0.061) * 0.25;
    }
    var k = 1 - Math.exp(-dt * 2.2);
    vx += (tx - vx) * k;
    vy += (ty - vy) * k;
  }

  /* ── comets ──────────────────────────────────────────────── */
  function cometStep(dt) {
    if (!cfg.comets) {
      comet = null;
      return;
    }
    nextComet -= dt;
    if (!comet && nextComet <= 0) {
      var dir = Math.random() < 0.5 ? 1 : -1,
        ang = ((20 + Math.random() * 40) * Math.PI) / 180;
      comet = {
        x: dir > 0 ? -20 : W + 20,
        y: Math.random() * H * 0.5,
        vx: dir * Math.cos(ang) * W * (0.5 + Math.random() * 0.4),
        vy: Math.sin(ang) * W * (0.5 + Math.random() * 0.4),
        life: 0,
      };
      nextComet = 4 + Math.random() * 7;
    }
    if (comet) {
      comet.x += comet.vx * dt;
      comet.y += comet.vy * dt;
      comet.life += dt;
      var tl = 0.16,
        tx = comet.x - comet.vx * tl,
        ty = comet.y - comet.vy * tl;
      var g = ctx.createLinearGradient(comet.x, comet.y, tx, ty);
      g.addColorStop(0, 'rgba(255,255,255,.95)');
      g.addColorStop(1, 'rgba(150,200,255,0)');
      ctx.globalAlpha = 1;
      ctx.strokeStyle = g;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(comet.x, comet.y);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(comet.x, comet.y, 1.8, 0, 6.2832);
      ctx.fill();
      if (comet.x < -200 || comet.x > W + 200 || comet.y > H + 100 || comet.life > 8) comet = null;
    }
  }

  /* ── main step ───────────────────────────────────────────── */
  function colorFor(i, depth) {
    var cm = cfg.cm;
    if (cm === 'rainbow') return RAINBOW[PC[i] & 7];
    if (cm === 'real') return REAL[PC[i] % REAL.length];
    if (cm === 'depth') return DEPTH[Math.min(31, (depth * 32) | 0)];
    return cfg.color;
  }
  var RETRO_G = ['#4a4a4a', '#8a8a8a', '#c8c8c8', '#ffffff'];
  function step(dt) {
    t += dt;
    var st = cfg.style,
      sc = { sp: 1, wp: 1, fl: 0, gl: 0, hud: '' };
    if (st === 'warp') sc = warpScript(t);
    var hud = st === 'warp' ? sc.hud : '';
    if (hud !== lastHud) {
      hudEl.textContent = hud;
      lastHud = hud;
    }
    flashEl.style.opacity = sc.fl > 0 ? (sc.fl * 0.9).toFixed(3) : '0';
    steerUpdate(dt);
    // The projected center follows the selected steering direction.
    var ox = W / 2 + vx * W * 0.28,
      oy = H / 2 + vy * H * 0.28;
    if (nebEl.classList.contains('on'))
      nebEl.style.transform =
        'translate(' +
        (-vx * 26).toFixed(1) +
        'px,' +
        (-vy * 18).toFixed(1) +
        'px) rotate(' +
        (t * 0.35).toFixed(2) +
        'deg) scale(1.25)';
    var zRate = (cfg.speed * 0.096 + 0.06) * sc.sp,
      dz = zRate * dt;
    ringPh += dz;
    var warpK = cfg.warp * sc.wp * (zRate / 60) * 6;
    var maxR = cfg.size * 0.45,
      glow = cfg.glow,
      n = Math.max(40, Math.floor(cfg.count * qScale));
    var rollRate = cfg.roll * 0.07,
      retro = st === 'retro';
    // clear / fade
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    if (cfg.trail > 0 && !retro) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,' + (1 - cfg.trail * 0.1).toFixed(2) + ')';
      ctx.fillRect(0, 0, W, H);
    } else ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = glow > 0 && !retro ? 'lighter' : 'source-over';
    ctx.lineCap = 'round';
    // backdrops
    if (st === 'galaxy') {
      if (!galCv) galCv = makeGalaxy();
      gAng += dt * (0.02 + cfg.roll * 0.012);
      var gs = Math.min(W, H) * (1.55 + 0.08 * Math.sin(t * 0.07));
      ctx.save();
      ctx.translate(W / 2 + vx * W * 0.1, H / 2 + vy * H * 0.1);
      ctx.rotate(-0.42);
      ctx.scale(1, 0.5);
      ctx.rotate(gAng);
      ctx.globalAlpha = 0.95;
      ctx.drawImage(galCv, -gs / 2, -gs / 2, gs, gs);
      ctx.restore();
      ctx.globalAlpha = 1;
    }
    if (st === 'tunnel' || st === 'warp' || st === 'wormhole') {
      var amt =
        st === 'tunnel'
          ? 0.1 + 0.12 * (cfg.speed / 10)
          : st === 'warp'
            ? 0.04 + 0.34 * sc.gl
            : 0.16;
      if (amt > 0.01) {
        var rad = Math.min(W, H) * (st === 'warp' ? 0.45 + 0.35 * sc.gl : 0.5),
          gg = ctx.createRadialGradient(ox, oy, 0, ox, oy, rad);
        var rgb = st === 'wormhole' ? '150,90,255' : '110,170,255';
        gg.addColorStop(0, 'rgba(' + rgb + ',' + amt.toFixed(3) + ')');
        gg.addColorStop(1, 'rgba(' + rgb + ',0)');
        ctx.fillStyle = gg;
        ctx.fillRect(0, 0, W, H);
      }
    }
    if (st === 'wormhole') {
      for (var k = 0; k < 7; k++) {
        var zz = (k / 7 - ringPh * 0.22) % 1;
        if (zz < 0) zz += 1;
        if (zz < 0.04) continue;
        var rr = ((F * Math.max(A, 1) * 0.95) / zz) * 0.55;
        if (rr > 3 * Math.max(W, H)) continue;
        var dep = 1 - zz;
        ctx.globalAlpha = 0.04 + 0.26 * dep;
        ctx.strokeStyle = '#b388ff';
        ctx.lineWidth = 0.8 + dep * 3.2;
        ctx.beginPath();
        ctx.arc(ox, oy, rr, 0, 6.2832);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    // stars
    var cA = Math.cos(rollRate * dt),
      sA = Math.sin(rollRate * dt);
    var twist = st === 'wormhole',
      tw = cfg.twinkle;
    var line = cfg.warp > 0 && !retro;
    for (var i = 0; i < n; i++) {
      var z = Z[i] - dz;
      if (z <= 0.02) {
        spawn(i, false);
        continue;
      }
      Z[i] = z;
      var x = X[i],
        y = Y[i];
      if (rollRate !== 0 || twist) {
        var ca = cA,
          sa = sA;
        if (twist) {
          var d = rollRate * dt + (0.55 * dz) / (z + 0.12);
          ca = Math.cos(d);
          sa = Math.sin(d);
        }
        var nx = x * ca - y * sa;
        y = x * sa + y * ca;
        x = nx;
        X[i] = x;
        Y[i] = y;
      }
      var kk = F / z,
        sx = ox + x * kk,
        sy = oy + y * kk;
      if (sx < -40 || sx > W + 40 || sy < -40 || sy > H + 40) {
        spawn(i, false);
        continue;
      }
      var depth = 1 - z;
      if (retro) {
        var lv = depth < 0.35 ? 0 : depth < 0.6 ? 1 : depth < 0.82 ? 2 : 3,
          s = [2, 4, 6, 8][lv];
        ctx.fillStyle = cfg.color === '#ffffff' ? RETRO_G[lv] : cfg.color;
        ctx.globalAlpha = cfg.color === '#ffffff' ? 1 : 0.35 + lv * 0.22;
        ctx.fillRect(Math.round(sx / 2) * 2, Math.round(sy / 2) * 2, s, s);
        continue;
      }
      var r = Math.max(0.4, depth * maxR),
        al = Math.min(1, 0.2 + depth * 1.05);
      if (tw) al *= 0.72 + 0.28 * Math.sin(t * 3 + PH[i]);
      var col = colorFor(i, depth);
      ctx.globalAlpha = al;
      ctx.strokeStyle = col;
      ctx.fillStyle = col;
      if (line) {
        var tz = Math.min(1, z + warpK),
          kp = F / tz,
          px = ox + x * kp,
          py = oy + y * kp;
        ctx.lineWidth = r;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(sx, sy);
        ctx.stroke();
        if (glow > 0 && r > 1.1) {
          ctx.globalAlpha = al * 0.14 * (0.4 + glow * 0.12);
          ctx.lineWidth = r * (2.2 + glow * 0.4);
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(sx, sy);
          ctx.stroke();
        }
      } else {
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, 6.2832);
        ctx.fill();
        if (glow > 0 && r > 1.1) {
          ctx.globalAlpha = al * 0.14 * (0.4 + glow * 0.12);
          ctx.beginPath();
          ctx.arc(sx, sy, r * (2.2 + glow * 0.4), 0, 6.2832);
          ctx.fill();
        }
      }
    }
    ctx.globalAlpha = 1;
    if (comet || cfg.comets) {
      ctx.globalCompositeOperation = 'source-over';
      cometStep(dt);
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  function frame(now) {
    requestAnimationFrame(frame);
    var dtRaw = last ? (now - last) / 1000 : 0.016;
    last = now;
    if (!(dtRaw > 0)) dtRaw = 0.016;
    fpsTick(dtRaw);
    if (paused) return;
    step(Math.min(dtRaw, 0.05));
  }
  var fpsT = 0,
    fpsN = 0,
    statEl = $('sf-stats');
  function fpsTick(d) {
    fpsT += d;
    fpsN++;
    if (fpsT >= 1) {
      var fps = fpsN / fpsT;
      fpsT = 0;
      fpsN = 0;
      // Lower the star count only after several slow seconds, avoiding brief quality drops.
      if (cfg.auto && !paused && document.visibilityState === 'visible') {
        if (fps < 38) lowSecs++;
        else lowSecs = 0;
        if (lowSecs >= 3 && qScale > 0.36 && cfg.count * qScale > 160) {
          qScale = Math.max(0.35, qScale * 0.8);
          lowSecs = 0;
        }
      } else lowSecs = 0;
      if (statEl)
        statEl.textContent =
          Math.round(fps) +
          ' fps · ' +
          Math.floor(cfg.count * qScale) +
          ' stars' +
          (qScale < 1 ? ' (auto-reduced)' : '');
    }
  }

  /* ── UI sync ─────────────────────────────────────────────── */
  // Keep controls, clock overlays, and range tracks in sync with the current settings.
  function syncUI() {
    SLIDERS.forEach(function (k) {
      var setting = SETTINGS[k];
      var el = $(setting.control);
      var v = $(setting.valueControl);
      if (el) el.value = cfg[k];
      if (v) v.textContent = cfg[k] + (setting.unit || '');
    });
    $('clock-options-control').hidden = !cfg.clock;
    $('o-clock-alignment').value = cfg.clockAlignment;
    clockEl.style.setProperty('--clock-size', cfg.clockSize + 'rem');
    clockEl.style.setProperty('--clock-position', cfg.clockPosition + '%');
    clockEl.style.setProperty('--clock-horizontal-position', cfg.clockHorizontalPosition + '%');
    clockEl.style.textAlign = cfg.clockAlignment;
    document.querySelectorAll('.color-swatch[data-color]').forEach(function (s) {
      s.classList.toggle('active', cfg.cm === 'fixed' && s.dataset.color === cfg.color);
    });
    document.querySelectorAll('.color-swatch[data-cm]').forEach(function (s) {
      s.classList.toggle('active', s.dataset.cm === cfg.cm);
    });
    $('custom-color').value = cfg.color;
    $('custom-color-val').textContent = cfg.color;
    $('o-steer').value = cfg.steer;
    BOOLEAN_SETTINGS.forEach(function (k) {
      var el = $(SETTINGS[k].control);
      if (el) el.checked = !!cfg[k];
    });
    document.querySelectorAll('.preset-btn').forEach(function (b) {
      b.classList.toggle('active', b.dataset.preset === curPreset && !dirty);
    });
    clockEl.classList.toggle('on', !!cfg.clock);
    $('fs-hint').textContent =
      cfg.steer === 'pointer' ? '⛶ click to fullscreen · move to steer' : '⛶ click to fullscreen';
    var cb = $('fs-clock');
    if (cb) cb.classList.toggle('on', !!cfg.clock);

    // Update slider tracks after syncing their values, including restored settings.
    document.querySelectorAll('input[type="range"]').forEach(function (range) {
      var min = Number(range.min) || 0;
      var max = Number(range.max) || 100;
      var value = Number(range.value);
      var progress = max > min ? ((value - min) / (max - min)) * 100 : 0;
      range.style.setProperty('--range-progress', clamp(progress, 0, 100) + '%');
    });
  }
  function markDirty() {
    dirty = true;
  }
  function persist() {
    // Lively stores settings per wallpaper/display; don't overwrite browser preferences.
    if (livelyMode) {
      clearTimeout(saveTimer);
      return;
    }
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      if (livelyMode) return;
      try {
        var sections = {};
        document.querySelectorAll('#sidebar .section[data-section]').forEach(function (section) {
          sections[section.dataset.section] = section.open;
        });
        localStorage.setItem('sf2', JSON.stringify({ cfg: cfg, preset: curPreset, sections: sections }));
      } catch (e) {
        console.warn('Could not save starfield settings.', e);
      }
    }, 250);
  }
  function afterChange(structural) {
    if (structural) {
      sizeCanvas();
    }
    setNebula();
    updateClock();
    syncUI();
    persist();
  }
  function applyPreset(name, keepPaused, resetPreferences) {
    var p = PRESETS[name];
    if (!p) return;
    // Keep user preferences intact when switching animation presets.
    var preferences = {};
    if (!resetPreferences)
      PRESET_PREFERENCES.forEach(function (key) {
        preferences[key] = cfg[key];
      });
    var k;
    for (k in p) cfg[k] = p[k];
    if (!resetPreferences)
      PRESET_PREFERENCES.forEach(function (key) {
        cfg[key] = preferences[key];
      });
    curPreset = name;
    dirty = false;
    qScale = 1;
    lowSecs = 0;
    vx = vy = 0;
    comet = null;
    t = 0;
    ringPh = 0;
    lastHud = '';
    hudEl.textContent = '';
    flashEl.style.opacity = '0';
    fullRebuild();
    afterChange(false);
    if (!keepPaused && paused) setPaused(false);
  }
  function nextPreset() {
    applyPreset(PRESET_KEYS[(PRESET_KEYS.indexOf(curPreset) + 1) % PRESET_KEYS.length]);
  }
  function setKey(k, v) {
    var value = normalizeSetting(k, v);
    if (value === null) {
      console.warn('Ignoring invalid starfield setting "' + k + '".');
      return;
    }
    cfg[k] = value;
    if (k === 'count') {
      qScale = 1;
    }
    markDirty();
    afterChange(false);
  }
  function resetDefaults() {
    applyPreset('classic', false, true);
  }

  // The settings registry is the source of truth for all slider markup values.
  function initializeSliderControls() {
    SLIDERS.forEach(function (key) {
      var setting = SETTINGS[key];
      var control = $(setting.control);
      control.min = setting.range[0];
      control.max = setting.range[1];
      control.step = setting.step;
      control.value = cfg[key];
    });
  }

  /* ── controls wiring ─────────────────────────────────────── */
  initializeSliderControls();
  SLIDERS.forEach(function (k) {
    var el = $(SETTINGS[k].control);
    el.addEventListener('input', function () {
      setKey(k, +el.value);
    });
  });
  document.querySelectorAll('.preset-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      applyPreset(b.dataset.preset);
    });
  });
  document.querySelectorAll('.color-swatch[data-color]').forEach(function (s) {
    s.addEventListener('click', function () {
      cfg.cm = 'fixed';
      setKey('color', s.dataset.color);
    });
  });
  document.querySelectorAll('.color-swatch[data-cm]').forEach(function (s) {
    s.addEventListener('click', function () {
      setKey('cm', s.dataset.cm);
    });
  });
  $('custom-color').addEventListener('input', function () {
    cfg.cm = 'fixed';
    setKey('color', this.value);
  });
  $('o-steer').addEventListener('change', function () {
    setKey('steer', this.value);
  });
  $('o-clock-alignment').addEventListener('change', function () {
    setKey('clockAlignment', this.value);
  });
  BOOLEAN_SETTINGS.forEach(function (k) {
    $(SETTINGS[k].control).addEventListener('change', function () {
      setKey(k, this.checked);
    });
  });
  $('b-fs').addEventListener('click', enterFullscreen);
  $('btn-pause').addEventListener('click', function () {
    setPaused(!paused);
  });
  $('b-png').addEventListener('click', savePNG);
  $('b-link').addEventListener('click', copyLink);
  $('b-reset').addEventListener('click', resetDefaults);
  $('fs-exit').addEventListener('click', exitFullscreen);
  $('fs-pause').addEventListener('click', function () {
    setPaused(!paused);
  });
  $('fs-next').addEventListener('click', nextPreset);
  $('fs-clock').addEventListener('click', function () {
    setKey('clock', !cfg.clock);
  });
  wrap.addEventListener('click', function (e) {
    if (
      e.target === canvas ||
      e.target === wrap ||
      e.target.id === 'fs-hint' ||
      e.target.id === 'nebula' ||
      e.target.id === 'sf-flash'
    ) {
      if (!isFullscreen) enterFullscreen();
    }
  });

  function setPaused(v) {
    paused = v;
    last = 0;
    var lab = paused
      ? '<span class="ab-icon">▶</span> Resume'
      : '<span class="ab-icon">⏸</span> Pause';
    $('btn-pause').innerHTML = lab;
    $('fs-pause').textContent = paused ? '▶ Resume' : '⏸ Pause';
  }

  /* ── pointer steering + idle cursor ─────────────────────── */
  var idleT = 0;
  function pointerMove(e) {
    var r = wrap.getBoundingClientRect();
    ptr.x = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1);
    ptr.y = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1);
    ptr.active = true;
    if (isFullscreen) {
      document.body.classList.remove('idle');
      clearTimeout(idleT);
      idleT = setTimeout(function () {
        document.body.classList.add('idle');
      }, 2600);
    }
  }
  wrap.addEventListener('pointermove', pointerMove);
  wrap.addEventListener('pointerdown', pointerMove);
  wrap.addEventListener('pointerleave', function () {
    ptr.active = false;
  });
  wrap.addEventListener('pointerup', function (e) {
    if (e.pointerType === 'touch') ptr.active = false;
  });
  var fsT = 0;
  wrap.addEventListener(
    'touchstart',
    function () {
      if (!isFullscreen) return;
      var c = $('fs-controls');
      c.classList.add('visible');
      clearTimeout(fsT);
      fsT = setTimeout(function () {
        c.classList.remove('visible');
      }, 3500);
    },
    { passive: true },
  );

  /* ── fullscreen ──────────────────────────────────────────── */
  var wl = null;
  function lockWake() {
    try {
      if ('wakeLock' in navigator && !wl)
        navigator.wakeLock
          .request('screen')
          .then(function (l) {
            wl = l;
            l.addEventListener('release', function () {
              wl = null;
            });
          })
          .catch(function () { });
    } catch (e) { }
  }
  function unlockWake() {
    try {
      if (wl) wl.release();
    } catch (e) { }
    wl = null;
  }
  function enterFullscreen() {
    // Lively already owns the full-screen desktop surface.
    if (livelyMode || isFullscreen) return;
    try {
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    } catch (e) { }
    var el = document.documentElement,
      req =
        el.requestFullscreen ||
        el.webkitRequestFullscreen ||
        el.mozRequestFullScreen ||
        el.msRequestFullscreen;
    if (req) {
      try {
        var r = req.call(el);
        if (r && r.catch) r.catch(pseudoEnter);
      } catch (e) {
        pseudoEnter();
      }
    } else pseudoEnter();
  }
  function pseudoEnter() {
    pseudoFs = true;
    onFsChange();
  }
  function exitFullscreen() {
    if (document.fullscreenElement || document.webkitFullscreenElement)
      (
        document.exitFullscreen ||
        document.webkitExitFullscreen ||
        document.mozCancelFullScreen ||
        document.msExitFullscreen
      ).call(document);
    else {
      pseudoFs = false;
      onFsChange();
    }
  }
  document.addEventListener('fullscreenchange', onFsChange);
  document.addEventListener('webkitfullscreenchange', onFsChange);
  function onFsChange() {
    isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement) || pseudoFs;
    if (!isFullscreen) pseudoFs = false;
    wrap.classList.toggle('fullscreen-active', isFullscreen);
    document.body.classList.toggle('in-fullscreen', isFullscreen);
    if (!isFullscreen) {
      document.body.classList.remove('idle');
      unlockWake();
    } else {
      lockWake();
      idleT = setTimeout(function () {
        document.body.classList.add('idle');
      }, 2600);
    }
    requestAnimationFrame(function () {
      sizeCanvas();
      rebuild();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
  }
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      last = 0;
      if (isFullscreen) lockWake();
    }
  });
  if (window.ResizeObserver)
    new ResizeObserver(function () {
      var oa = A;
      sizeCanvas();
      if (Math.abs(A - oa) / oa > 0.12) rebuild();
    }).observe(wrap);
  window.addEventListener('resize', function () {
    sizeCanvas();
  });

  /* ── clock ───────────────────────────────────────────────── */
  function updateClock() {
    if (!cfg.clock) return;
    var d = new Date();
    // Seconds are optional; the same locale formatting is used in the page and fullscreen.
    var timeOptions = { hour: '2-digit', minute: '2-digit' };
    if (cfg.clockSeconds) timeOptions.second = '2-digit';
    clockEl.querySelector('.t').textContent = d.toLocaleTimeString([], timeOptions);
    clockEl.querySelector('.d').textContent = d.toLocaleDateString([], {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }
  setInterval(updateClock, 1000);

  /* ── PNG + link ──────────────────────────────────────────── */
  function toast(msg) {
    var el = $('sf-toast');
    el.textContent = msg;
    el.classList.add('on');
    clearTimeout(el._h);
    el._h = setTimeout(function () {
      el.classList.remove('on');
    }, 2400);
  }
  function savePNG() {
    var sc = cfg.style === 'retro' ? 2 : 1,
      c = document.createElement('canvas');
    c.width = canvas.width * sc;
    c.height = canvas.height * sc;
    var g = c.getContext('2d');
    g.fillStyle = '#000';
    g.fillRect(0, 0, c.width, c.height);
    if (cfg.nebula && nebCv) {
      var s = Math.max(c.width, c.height) * 1.1;
      g.globalAlpha = 0.62;
      g.drawImage(nebCv, (c.width - s) / 2, (c.height - s) / 2, s, s);
      g.globalAlpha = 1;
    }
    g.imageSmoothingEnabled = sc === 1;
    g.drawImage(canvas, 0, 0, c.width, c.height);
    c.toBlob(function (b) {
      if (!b) {
        toast('Could not create the image');
        return;
      }
      var a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      a.download = 'starfield-' + curPreset + '.png';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        URL.revokeObjectURL(a.href);
        a.remove();
      }, 500);
      toast('Saved starfield-' + curPreset + '.png');
    }, 'image/png');
  }
  function buildQuery() {
    var q = new URLSearchParams();
    q.set('m', curPreset);
    Object.keys(SETTINGS).forEach(function (key) {
      var setting = SETTINGS[key];
      var value = cfg[key];
      if (setting.type === 'boolean') value = value ? 1 : 0;
      else if (setting.type === 'color') value = value.replace('#', '');
      q.set(setting.query, value);
    });
    return q.toString();
  }
  function copyLink() {
    var url = location.protocol + '//' + location.host + location.pathname + '?' + buildQuery();
    var done = function () {
      toast('Link to your settings copied');
    };
    try {
      navigator.clipboard.writeText(url).then(done, function () {
        history.replaceState(null, '', '?' + buildQuery());
        toast('Link is in the address bar');
      });
    } catch (e) {
      history.replaceState(null, '', '?' + buildQuery());
      toast('Link is in the address bar');
    }
  }
  function loadQuery(qs) {
    var q = new URLSearchParams(qs);
    if (!q.has('m')) return false;
    var m = q.get('m');
    if (!PRESETS[m]) return false;
    var k;
    for (k in PRESETS[m]) cfg[k] = PRESETS[m][k];
    curPreset = m;
    Object.keys(SETTINGS).forEach(function (key) {
      var setting = SETTINGS[key];
      if (!q.has(setting.query)) return;
      var value = settingFromQuery(key, q.get(setting.query));
      if (value !== null) cfg[key] = value;
    });
    return true;
  }

  function normalizeSetting(key, value) {
    var setting = SETTINGS[key];
    if (!setting) return null;

    if (setting.type === 'number') {
      if (
        (typeof value !== 'number' && typeof value !== 'string') ||
        (typeof value === 'string' && value.trim() === '')
      )
        return null;
      var number = Number(value);
      if (!isFinite(number)) return null;
      var min = setting.range[0];
      var max = setting.range[1];
      number = clamp(number, min, max);
      return clamp(Math.round((number - min) / setting.step) * setting.step + min, min, max);
    }
    if (setting.type === 'boolean') return typeof value === 'boolean' ? value : null;
    if (setting.type === 'color')
      return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value)
        ? value.toLowerCase()
        : null;
    if (setting.type === 'enum')
      return setting.values.indexOf(value) >= 0 ? value : null;
    return null;
  }

  function settingFromQuery(key, value) {
    var setting = SETTINGS[key];
    if (setting.type === 'boolean') {
      if (value === '1') return true;
      if (value === '0') return false;
      return null;
    }
    if (setting.type === 'color' && value.charAt(0) !== '#') value = '#' + value;
    return normalizeSetting(key, value);
  }

  /* ── keyboard ────────────────────────────────────────────── */
  function bump(k, d) {
    setKey(k, clamp(cfg[k] + d, LIM[k][0], LIM[k][1]));
  }
  document.addEventListener('keydown', function (e) {
    if (livelyMode) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var tag = e.target && e.target.tagName;
    if (tag === 'SELECT' || tag === 'TEXTAREA') return;
    if (tag === 'INPUT' && e.target.type === 'range' && e.key.indexOf('Arrow') === 0) return;
    if (e.key === ' ' && (tag === 'BUTTON' || tag === 'INPUT' || tag === 'A')) return;
    var key = e.key,
      lk = key.length === 1 ? key.toLowerCase() : key;
    if (lk === 'f') {
      isFullscreen ? exitFullscreen() : enterFullscreen();
    } else if (key === ' ') {
      e.preventDefault();
      setPaused(!paused);
    } else if (key === 'ArrowUp') {
      e.preventDefault();
      bump('speed', 1);
    } else if (key === 'ArrowDown') {
      e.preventDefault();
      bump('speed', -1);
    } else if (key === 'ArrowRight') {
      e.preventDefault();
      bump('roll', 1);
    } else if (key === 'ArrowLeft') {
      e.preventDefault();
      bump('roll', -1);
    } else if (lk === 'r') resetDefaults();
    else if (lk === 'c') setKey('clock', !cfg.clock);
    else if (lk === 'n') setKey('nebula', !cfg.nebula);
    else if (lk === 'm')
      setKey('steer', cfg.steer === 'off' ? 'pointer' : cfg.steer === 'pointer' ? 'auto' : 'off');
    else if (lk === 'p') savePNG();
    else if (key === 'Escape' && isFullscreen) exitFullscreen();
    else {
      var idx = parseInt(key, 10) - 1;
      if (idx >= 0 && idx < PRESET_KEYS.length) applyPreset(PRESET_KEYS[idx]);
    }
  });

  // Lively reads LivelyProperties.json and calls this function for each setting.
  window.livelyPropertyListener = function (name, value) {
    if (!livelyMode) {
      livelyMode = true;
      clearTimeout(saveTimer);
    }
    document.body.classList.add('lively-wallpaper');

    if (Object.prototype.hasOwnProperty.call(LIVELY_LABELS, name)) return;

    var key = LIVELY_SETTING_KEYS[name];
    if (!key) {
      console.warn('Ignoring unknown Lively property "' + name + '".');
      return;
    }

    var setting = SETTINGS[key];
    if (setting.type === 'enum') {
      var index = Number(value);
      if (!Number.isInteger(index) || index < 0 || index >= setting.values.length) {
        console.warn('Ignoring invalid Lively dropdown value for "' + name + '".');
        return;
      }
      value = setting.values[index];
    } else if (setting.type === 'number' && typeof value !== 'number') {
      console.warn('Ignoring invalid Lively slider value for "' + name + '".');
      return;
    }

    value = normalizeSetting(key, value);
    if (value === null) {
      console.warn('Ignoring invalid Lively value for "' + name + '".');
      return;
    }

    // Selecting a custom color switches the renderer to fixed-color mode.
    if (key === 'color') setKey('cm', 'fixed');
    setKey(key, value);
  };

  /* ── boot ────────────────────────────────────────────────── */
  (function boot() {
    var fromUrl = loadQuery(location.search),
      saved = null;
    try {
      saved = JSON.parse(localStorage.getItem('sf2') || 'null');
    } catch (e) {
      console.warn('Could not read saved starfield settings.', e);
    }
    if (!fromUrl) {
      if (saved && saved.cfg && typeof saved.cfg === 'object' && PRESETS[saved.preset]) {
        Object.keys(SETTINGS).forEach(function (key) {
          if (!(key in saved.cfg)) return;
          var value = normalizeSetting(key, saved.cfg[key]);
          if (value !== null) cfg[key] = value;
        });
        curPreset = saved.preset;
        cfg.style = PRESETS[curPreset].style;
        cfg.neb = PRESETS[curPreset].neb;
      } else if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) {
        var zen = PRESETS.zen;
        Object.keys(zen).forEach(function (key) {
          cfg[key] = zen[key];
        });
        curPreset = 'zen';
        var note = $('rm-note');
        if (note) note.hidden = false;
      }
    }
    if (saved && saved.sections && typeof saved.sections === 'object') {
      document.querySelectorAll('#sidebar .section[data-section]').forEach(function (section) {
        var savedState = saved.sections[section.dataset.section];
        if (typeof savedState === 'boolean') section.open = savedState;
      });
    }
    document.querySelectorAll('#sidebar .section[data-section]').forEach(function (section) {
      section.addEventListener('toggle', persist);
    });
    var fullscreenOption = new URLSearchParams(location.search).get(SETTINGS.fullscreen.query);
    if (fullscreenOption !== null) {
      var fullscreenValue = settingFromQuery('fullscreen', fullscreenOption);
      if (fullscreenValue !== null) cfg.fullscreen = fullscreenValue;
    }
    // Only an explicit fs=1 URL option should request fullscreen on page load.
    var startFullscreen = fullscreenOption === '1';
    fullRebuild();
    setNebula();
    updateClock();
    syncUI();
    requestAnimationFrame(frame);
    if (startFullscreen) setTimeout(enterFullscreen, 0);
  })();

  window.__sf = {
    get cfg() {
      return cfg;
    },
    get preset() {
      return curPreset;
    },
    applyPreset: applyPreset,
    step: step,
    sim: function (sec) {
      var n = Math.round(sec * 60);
      for (var i = 0; i < n; i++) step(1 / 60);
    },
    buildQuery: buildQuery,
    get vp() {
      return [vx, vy];
    },
    get qScale() {
      return qScale;
    },
    get size() {
      return [W, H, res];
    },
    get fs() {
      return isFullscreen;
    },
  };
})();

(function () {
  var b = document.body;
  function clr() {
    if (!b.classList.contains('in-fullscreen')) return;
    var c = document.getElementById('fs-controls');
    if (c) c.classList.remove('visible');
  }
  var T;
  document.addEventListener('mousemove', function () {
    if (!b.classList.contains('in-fullscreen')) return;
    var c = document.getElementById('fs-controls');
    if (!c) return;
    c.classList.add('visible');
    clearTimeout(T);
    T = setTimeout(clr, 2500);
  });
  new MutationObserver(function () {
    clr();
    setTimeout(clr, 0);
    setTimeout(clr, 120);
  }).observe(b, { attributes: true, attributeFilter: ['class'] });
})();
