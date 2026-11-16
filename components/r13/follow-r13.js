/* 一张谱 r13 用的 follow 副本（components/follow.js、r12 副本都不改）：叠在阅读器的竖屏谱页上（24, 41, 786×1112，框单位 834 宽）。
   第 1 页透明，直接用下面 board 的 K. 545 第 1 页（components/assets/k545-p1.jpg，1300×1839，1878 年 Breitkopf & Härtel 旧版莫扎特全集，公有领域）；第 2 页是 k545-p2.jpg，白底，从右边滑进来盖住第 1 页。
   照 App 的 ReaderFollowOverlay：
   拍 1：每个小节都标上小节号（每行第一小节也标，谱上印了号的照样标），白底胶囊左边离小节线 4×pageScale，竖直以这一小节的谱表（小节线上下端）中线居中，压在蓝框上面；
   拍 2：边弹边跟，柔和的蓝框一小节一小节落下（1–10 小节），每小节停 T；
   拍 3：11–20 小节快进（每小节 FT），21–24 小节照常走，第 2 页照 App 整页横滑推进来（两页中间留 12 pt，第 1 页透明，滑的是阅读器的 board 层），框落在第 25 小节。
   顶栏和页码胶囊借翻页层的（阅读器把它盖在这一层上面），翻到第 2 页时 opt.onPage(2) 让胶囊数到 2 / 8。
   小节线、五线谱上下线、每行墨迹上下沿都在这两页上量过（work/k545-ama：r60/fol-ov-p1.png、fol-ov-p2.png 是核对叠图）。
   接口：beat(n, soft) 直接摆拍 n 终态（soft 时按动画退回）；one(n) 只播拍 n；play() 从拍 1 连播；reset() 回到起点。 */
(function(){
const NS = window.SNSims = window.SNSims || {};
if (NS['r13/follow-r13']) return;
const W = 834, H = 1194, CX = 24, CY = 41, CW = 786, CH = 786*1839/1300;
// T：蓝框在每小节停多久（小谭批注 74：原来 480 太快，放慢到约 1.8 倍）
// FT：拍 3 快进那几小节每小节停多久（第 1 页 24 小节，照 T 全走一遍太长）
const IW = 1300, IH = 1839, T = 860, FT = 300, ACCENT = '#3F529F';
// 整页横滑：一页框宽加 12 pt 的缝，340 ms（和 turns-r13 一样）
const SLIDE = W + 12/1.235, SLIDE_MS = 340;
const src = document.currentScript && document.currentScript.src;
const P2 = src ? new URL('../assets/k545-p2.jpg', src).href : 'components/assets/k545-p2.jpg';
// 每行谱：上线 t、下线 b（谱图 px，也就是小节线上下端）、这一行墨迹（加线音符、tr、印的小节号）上下沿外扩 6 px 的 y0/y1（蓝框用）、小节线 xs
const SYS = {
  a: [{t:381, b:504.5, y0:323, y1:549, xs:[122,366,559,741,952.5,1228]},
      {t:606.5, b:728.5, y0:567, y1:752, xs:[74,385,657,930.5,1225]},
      {t:829.5, b:956.5, y0:783, y1:992, xs:[71,430,740,874,1223]},
      {t:1055, b:1183.5, y0:1011, y1:1204, xs:[67,383.5,660,937,1220.5]},
      {t:1284.5, b:1403.5, y0:1241, y1:1449, xs:[62,484,845,1218]},
      {t:1509.5, b:1631.5, y0:1458, y1:1678, xs:[58.5,441.5,663,921,1216.5]}],
  b: [{t:160.5, b:292.5, y0:102, y1:334, xs:[94.5,458,751,1055,1226]},
      {t:383.5, b:514, y0:335, y1:544, xs:[94,403,640.5,925,1228.5]},
      {t:602.5, b:734.5, y0:567, y1:778, xs:[93,477.5,811,1228]},
      {t:826.5, b:956, y0:780, y1:998, xs:[92,502,856,1227]},
      {t:1045.5, b:1176, y0:1007, y1:1209, xs:[90,484,868,1225.5]},
      {t:1269.5, b:1398.5, y0:1218, y1:1427, xs:[88,317,527,726,931,1226]},
      {t:1491, b:1633, y0:1443, y1:1643, xs:[85,498,868,1225.5]}]
};
// 小节号胶囊照 App ReaderFollowOverlay（框单位 = iPad pt）：pageScale = 谱页宽 786 / A4 宽 595.28 pt（k545 图 1300×1839 正好 A4 比例）≈ 1.32；
// 字 max(11, min(18, 12×pageScale)) medium，高 max(16, 字行高 + 2)（SF 行高 ≈ 1.193 字号），宽 max(高, 字宽 + 8)，圆角 = 高/2；
// 左边 = 小节框 minX + 4×pageScale，竖直以小节框中线居中。App 的小节号和蓝框用同一个小节框（DemoBarLayout.rect：这一小节的谱表那一条），这里取小节线上下端 t–b
const PS = CW/595.28, MF = Math.max(11, Math.min(18, 12*PS)), MH = Math.max(16, Math.ceil(MF*1.1934) + 2), K = CW/IW;
const pc = (v, d) => (v/d*100).toFixed(3) + '%';
const CSS = `
.sns-fol{position:relative;overflow:hidden;-webkit-user-select:none;user-select:none}
.sns-fol .f-stage{position:absolute;left:0;top:0;width:${W}px;height:${H}px;transform-origin:0 0}
.sns-fol .f-card{position:absolute;left:${CX}px;top:${CY}px;width:${CW}px;height:${CH.toFixed(2)}px;overflow:hidden}
.sns-fol .pg{position:absolute;inset:0}
.sns-fol .pg.b{background:#fff url(${P2}) center top/100% auto no-repeat;transform:translateX(100%);transition:transform .55s cubic-bezier(.25,.8,.25,1)}
.sns-fol.full .pg.b{transform:none}
.sns-fol .pg.a{transition:opacity 0s .55s}
.sns-fol.full .pg.a{opacity:0}
.sns-fol .mn{position:absolute;height:${MH}px;min-width:${MH}px;box-sizing:border-box;padding:0 4px;border-radius:${MH/2}px;display:grid;place-items:center;white-space:nowrap;background:rgba(255,255,255,.8);box-shadow:0 1px 4px rgba(0,0,0,.1);font:500 ${MF.toFixed(2)}px/1 -apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif;color:${ACCENT};transform-origin:0 50%;transform:scale(.7);opacity:0;transition:opacity .3s,transform .35s;transition-delay:var(--d)}
.sns-fol.nums .mn{opacity:1;transform:none}
/* 手机（框窄）：小节号整体再放大 --ms，靠左、竖直居中不变（scale 和上面的 transform、弹出动画叠着算） */
.sns-fol .mn{scale:var(--ms,1)}
/* 批注 95：拍 1 小节号一行行弹出时先是强调蓝底白字、放大一下，再褪回 App 的白底蓝字；--p 是弹出的先后 */
.sns-fol.pop .mn{animation:folMn 1.1s var(--p) cubic-bezier(.3,.7,.3,1) both}
@keyframes folMn{
0%{opacity:0;transform:scale(.5);background:${ACCENT};color:#fff;box-shadow:0 0 0 0 rgba(63,82,159,.45)}
18%{opacity:1;transform:scale(1.22);background:${ACCENT};color:#fff;box-shadow:0 0 0 7px rgba(63,82,159,.16)}
36%{transform:none;background:${ACCENT};color:#fff;box-shadow:0 0 0 11px rgba(63,82,159,0)}
58%{background:${ACCENT};color:#fff;box-shadow:0 0 0 0 rgba(63,82,159,0)}
100%{opacity:1;transform:none;background:rgba(255,255,255,.8);color:${ACCENT};box-shadow:0 1px 4px rgba(0,0,0,.1)}}
.sns-fol .box{position:absolute;border-radius:5px;background:rgba(63,82,159,.10);box-shadow:inset 0 0 0 2px rgba(63,82,159,.5);opacity:0;pointer-events:none}
.sns-fol.now .pg,.sns-fol.now .mn,.sns-fol.roll .pg{transition:none!important}
.sns-fol.now .mn{animation:none!important}
.sns-fol.roll .f-card{overflow:visible}
`;
(function inject(){
  if (document.getElementById('sns-r13-follow-css')) return;
  const s = document.createElement('style'); s.id = 'sns-r13-follow-css'; s.textContent = CSS;
  (document.head || document.documentElement).appendChild(s);
})();
const RM = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches), CANCEL = {};
const snT = s => window.snT ? window.snT(s) : s;

NS['r13/follow-r13'] = function(root, opt){
  opt = opt || {}; const base = opt.base || (() => {});
  root.classList.add('sns-fol');
  const bars = [], mns = {a:'', b:''};
  for (const k of ['a','b']) SYS[k].forEach(({t, b, y0, y1, xs}, r) => xs.slice(0, -1).forEach((x, i) => {
    bars.push({k, x, y:y0, w:xs[i+1] - x, h:y1 - y0});
    mns[k] += `<span class="mn" style="left:${(x*K + 4*PS).toFixed(2)}px;top:${((t + b)/2*K - MH/2).toFixed(2)}px;--d:${r*110 + i*40}ms;--p:${r*190 + i*60}ms">${bars.length}</span>`;
  }));
  root.innerHTML = `<div class="f-stage"><div class="f-card">
    <div class="pg a">${mns.a}</div>
    <div class="pg b" role="img" aria-label="${snT('Mozart, Piano Sonata K. 545, second page')}">${mns.b}</div>
    <div class="box"></div></div></div>`;
  const stage = root.querySelector('.f-stage'), box = root.querySelector('.box'), pgs = {a:root.querySelector('.pg.a'), b:root.querySelector('.pg.b')};
  // 谱页上沿和 board 算法一致：框高换成框单位后，谱页在框里竖直居中（834×1194 时正好 41）
  const card = root.querySelector('.f-card');
  function layout(){ const w = root.clientWidth; if (!w) return; stage.style.transform = `scale(${w/W})`;
    root.style.setProperty('--ms', w/W < .5 ? 1.4 : 1);
    const fh = root.clientHeight ? Math.round(W*root.clientHeight/w) : H; card.style.top = Math.max(16, (fh - CH)/2) + 'px'; }
  const ro = new ResizeObserver(layout); ro.observe(root); layout();

  let anim = null;
  // mode：pass 一小节一拍 0→1→1→0；hold 渐亮后停住；set 直接亮着（摆终态）
  function cue(i, mode){
    anim?.cancel(); anim = null;
    if (i < 0){ box.style.opacity = 0; return; }
    // 蓝框放进小节所在那一页、排在小节号前面：小节号压在框上面，和 App 一样
    const b = bars[i]; if (box.parentNode !== pgs[b.k]) pgs[b.k].prepend(box);
    Object.assign(box.style, {left:pc(b.x, IW), top:pc(b.y, IH), width:pc(b.w, IW), height:pc(b.h, IH), opacity: mode === 'set' ? 1 : 0});
    if (mode === 'set') return;
    anim = box.animate(mode === 'hold' ? [{opacity:0},{opacity:1}] : [{opacity:0},{opacity:1, offset:1/3},{opacity:1, offset:2/3},{opacity:0}], {duration: mode === 'hold' ? 220 : T, fill:'forwards'});
  }
  const END = [{nums:0, bar:-1, full:0}, {nums:1, bar:-1, full:0}, {nums:1, bar:9, full:0}, {nums:1, bar:24, full:1}];
  // 第 1 页 ↔ 第 2 页：fwd 往前（第 2 页从右边推进来），否则往回；滑完把页和 board 摆回原位，用 .full 定住
  let rl = null;
  const ease = q => q < .5 ? 2*q*q : 1 - Math.pow(-2*q + 2, 2)/2;
  function unroll(){
    const was = rl || root.classList.contains('roll'); if (rl){ rl.dead = true; rl = null; }
    root.classList.remove('roll'); pgs.a.style.transform = pgs.b.style.transform = '';
    if (was) base(0);
  }
  function slide(fwd){
    unroll(); const r = rl = {dead:false};
    root.classList.add('roll'); root.classList.remove('full');
    const s = root.clientWidth/W;
    const put = e => { pgs.a.style.transform = `translateX(${-e*SLIDE}px)`; pgs.b.style.transform = `translateX(${(1 - e)*SLIDE}px)`; base(-e*SLIDE*s); };
    put(fwd ? 0 : 1);
    return new Promise(res => { const a = performance.now();
      (function f(now){
        if (r.dead) return res(false);
        const q = Math.min(1, (now - a)/SLIDE_MS); put(fwd ? ease(q) : 1 - ease(q));
        if (q < 1) return requestAnimationFrame(f);
        rl = null; root.classList.add('now'); root.classList.toggle('full', fwd); unroll();
        void root.offsetWidth; requestAnimationFrame(() => root.classList.remove('now'));
        opt.onPage?.(fwd ? 2 : 1); res(true);
      })(a); });
  }
  function show(e, soft){
    root.classList.toggle('nums', !!e.nums);
    if (soft && !RM && !e.full && (rl || root.classList.contains('full'))) slide(false);
    else { unroll(); root.classList.toggle('full', !!e.full); opt.onPage?.(e.full ? 2 : 1); }
    cue(e.bar, soft ? 'hold' : 'set');
  }
  const DUR = [0, 2650, 10*T + 300, 10*FT + 4*T + 1500];
  let tok = null, cur = 0, done = true, t0 = 0;
  async function run(n, t){
    const wait = ms => new Promise(r => setTimeout(r, ms)).then(() => { if (t.dead) throw CANCEL; });
    if (n === 1){ await wait(250); root.classList.add('nums', 'pop'); await wait(2100); root.classList.remove('pop'); await wait(300); }
    else if (n === 2){ for (let i = 0; i <= 9; i++){ cue(i, i === 9 ? 'hold' : 'pass'); await wait(T); } await wait(300); }
    else if (n === 3){ for (let i = 10; i <= 19; i++){ cue(i, 'set'); await wait(FT); } for (let i = 20; i <= 23; i++){ cue(i, 'pass'); await wait(T); } await slide(true); await wait(220); cue(24, 'hold'); await wait(940); }
  }
  function stop(){ if (tok){ tok.dead = true; tok = null; } root.classList.remove('pop'); }
  // soft：不切掉过渡，小节号、第 2 页按动画退回
  function snap(n, soft){
    stop();
    if (soft){ show(END[n], true); return; }
    root.classList.add('now'); show(END[n]); void root.offsetWidth; requestAnimationFrame(() => root.classList.remove('now'));
  }
  function go(n, animate, only, soft){
    n = Math.max(0, Math.min(3, n|0));
    if (!animate || RM || n === 0){ snap(n, soft); cur = n; done = true; return; }
    snap(n - 1);
    const t = tok = {dead:false};
    (async () => {
      for (let k = n; k <= (only ? n : 3); k++){
        cur = k; done = false; t0 = performance.now();
        try { await run(k, t); } catch(e){ if (e === CANCEL) return; throw e; }
        if (t.dead) return;
      }
      done = true; if (tok === t) tok = null;
    })();
  }
  // 播放中按下：停掉脚本，摆到这一拍的终态
  const onDown = () => { if (tok){ snap(cur); done = true; } };
  root.addEventListener('pointerdown', onDown);
  return {
    beats: 3,
    get beatNow(){ return cur; }, get busy(){ return !!tok; },
    get beatFrac(){ if (done || !tok) return cur ? 1 : 0; return Math.min(1, (performance.now() - t0)/DUR[cur]); },
    play(){ go(RM ? 3 : 1, true); },
    go(n){ go(n, true); },
    one(n){ go(n, true, true); },
    beat(n, soft){ go(n, false, false, soft); },
    reset(){ go(0, false); },
    visible(on){ if (!on && tok){ snap(cur); done = true; } },
    destroy(){ stop(); unroll(); anim?.cancel(); ro.disconnect(); root.removeEventListener('pointerdown', onDown); root.innerHTML = ''; }
  };
};
})();
