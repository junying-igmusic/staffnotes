/* r13 一张谱的版面控制（one-score-r13.html）：Organize 三拍 → 第 3 拍之后不停顿：Mozart 文件夹打开（文案「Right where you'd look」、第 4 格进度条走）→ 圆点点 K. 545 → 卡片放大
   → 一路落进竖放的整页阅读器（components/r13/reader-r13.js）→ 同一个阅读器从画笔讲到跟谱：画笔、图层、词典、练习工具、Apple Music、翻页与跳转、小节显示、跟谱。
   谱子大小全程不变（整页竖放，每一站都整页在屏幕里），每换一章阅读器整块换一边，文案在另一边。
   手机（≤900）：阅读器在导航条下面居中，文案在下面原地换，不换边。
   翻页式照 r11：hero 是起点，之后每个动画一个锚点；滚轮一格、触控板一次滑动（连惯性）、手机一次滑动、一次按键只走一站；往回一下退一站，那一站重播。
   到站后演示自己播，播完停 HOLD_MS 自动进下一站，一章播完自动进下一章，到跟谱最后一站停住；切到后台、离开这一段、或者用户在谱上按了一下（画、拖、点）就暂停，翻到下一站再接着连播。
   菜单：Organize、Read、Practice、Play 落到各自第一站；钉住段里菜单的滑块跟着当前这一站走（sec._os.nav）。
   右下角播放 / 暂停按钮（.os-play）直接管自动连播：暂停后滚动、菜单照常走站，只是不自己往下走；批注工具改 sec._os.auto 时图标跟着变。只在钉住段（hero 之后）出现。
   减少动态效果：不缩放不平移，一律淡入淡出；自动连播默认停着，点播放才连播。 */
(function(){
const sec = document.querySelector('section.os'); if(!sec) return;
const RMq = matchMedia('(prefers-reduced-motion: reduce)').matches;
const q1 = s => sec.querySelector(s), qa = s => [...sec.querySelectorAll(s)];
const track = q1('.os-track'), pin = q1('.os-pin'), stage = q1('.os-stage'), sbox = q1('.os-sbox'), sim = q1('.fx-sim');
const prog = q1('.fx-prog'), progB = qa('.fx-prog button');
const rbox = q1('.os-rbox'), rsim = q1('.os-rbox .sim'), rprog = q1('.os-rprog');
const copyEl = q1('.os-copy'), fxCopy = q1('.fx-copy'), beats = qa('.fx-beat'), nodes = qa('.fx-nodes i'), line = q1('.fx-nodes');
const marks = [['read', 'pen'], ['practice', 'prac'], ['play', 'turn']].map(([id, key]) => [document.getElementById(id), key]).filter(m => m[0] && sec.contains(m[0])), ovSec = document.getElementById('overview'), wordsEl = document.getElementById('words'), navEl = document.getElementById('nav');
const cl = (v, a=0, b=1) => Math.min(b, Math.max(a, v)), lp = (a, b, t) => a + (b - a)*t;
const io = t => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3)/2;

/* 可调的数：大过场（hero → Overview → Organize、换章）多长；换拍多长；Organize 第 4 拍 → 画笔第 1 拍那整段过场多长；滚轮停多久才算下一下；
   演示播完停多久自动进下一站；手机上手指滑多远算一下（毫秒、像素） */
const BIG = 1000, BEAT = 500, LONG = 1600, QUIET = 250, HOLD_MS = 1000, SWIPE = 24;
// Organize 第 3 拍 → 画笔第 1 拍：先 FOLD 毫秒播 Mozart 文件夹打开（story 第 4 拍），接着 LONG 毫秒点 K. 545、放大、挪进阅读器；往回走最后 UNFOLD 毫秒文件夹合上
const FOLD = 1350, UNFOLD = 700;
// story 舞台 780×580，放大后谱页 x=185、宽 410、满高；手机只看中间 640 宽，谱页在 115
const SW = 780, SH = 580, VX = 185, VN = 640;
// 阅读器：竖放的 iPad 框 834×1194 pt，K. 545 整页在 (24, 41)，786 宽（和 reader-r13.js 一致）；电脑和手机一样
const RD = {W: 834, H: 1194, px: 24, py: 41, pw: 786};
// 时间线，单位是屏高：锚点是一个点（AH 只是让它离边界有一点距离），拍与拍之间隔 BT；FB 是文件夹打开那一截，TR 是点 K. 545 → 画笔那段过场，X 是换章
const AH = .03, BT = .4, ORG = AH + 2*BT, FB = BT, TR = 2.2, X = 1.1;
const S_Z = ORG + FB, S_P = S_Z + TR;
// 那段过场的样子：前 P0 是手指点 K. 545；之后一条先慢后快再慢的缓动 w，放大到 w = WA 到顶，w = WB 起就开始挪向阅读器，两段叠着，中间不停
const P0 = .22, WA = .6, WB = .4;
// 各章：data-ch 是阅读器里这一章的站名前缀（pen1、pen2……），data-side 是阅读器在哪边，data-beats 是几站
const CH = qa('.os-chcopy').map((copy, i) => ({copy, i, key: copy.dataset.ch, side: copy.dataset.side, nb: +copy.dataset.beats, li: [...copy.querySelectorAll('li')], pr: q1(`.os-rprog [data-ch="${copy.dataset.ch}"]`)}));
let i0 = 0;
CH.forEach((c, i) => { c.k0 = i0; i0 += c.nb; c.s = i ? CH[i - 1].e : S_P - X; c.e = c.s + X + AH + (c.nb - 1)*BT; c.btn = c.pr ? [...c.pr.querySelectorAll('button')] : []; });
const LEN = CH[CH.length - 1].e;
const desk = () => innerWidth > 900;

/* 锚点：hero（起点）、Overview、Organize 三拍、各章每一站。abs 是不在钉住段里、按页面位置算的；big 是进这个锚点那段算大过场，long 是 Organize 第 3 拍 → 画笔那整段（含文件夹打开） */
let A = null;
function buildA(){
  A = [{k: 'hero', abs: 1}, {k: 'ov', abs: 1, big: 1}];
  for(let b = 1; b <= 3; b++) A.push({k: 'org', b, v: AH/2 + (b - 1)*BT, big: b === 1});
  CH.forEach(c => { for(let b = 1; b <= c.nb; b++) A.push({k: 'ch', c, b, key: c.key + b, ri: c.k0 + b - 1, v: c.s + X + AH/2 + (b - 1)*BT, long: c.i === 0 && b === 1, big: c.i > 0 && b === 1}); });
}

/* ---------- 版面：按窗口把谱子、阅读器和文案摆好 ---------- */
let G = null, wasDesk = null, api = null, rd = null, played = false, shown = -1, lastZ = -1, lastC = -1, lastE = -1;
function layout(){
  const vh = innerHeight, W = pin.clientWidth, d = desk();
  if(d !== wasDesk){
    wasDesk = d;
    [sim, copyEl, fxCopy, sbox, prog, rbox, rprog, ...CH.map(c => c.copy)].forEach(e => e.removeAttribute('style'));
    lastZ = -1;
  }
  // 钉住的这一屏按看得见的高度来定：iPhone Safari 的 100vh 比工具栏露出时的可视高度高，最后一站会被顶上去
  pin.style.height = vh + 'px';
  track.style.height = (LEN + 1)*vh + 'px';
  // 菜单里的 Read、Practice、Play 各有一个记号，落在各自第一站（没有脚本时链接也能滑到这里）
  marks.forEach(([m, key]) => { const c = CH.find(c => c.key === key); if(c) Object.assign(m.style, {top: (c.s + X + AH/2)*vh + 'px', height: '1px'}); });
  if(d){
    // Organize：左 4 份文案、右 8 份谱子
    const colL = (W - 48)*4/12, colX = colL + 48, colW = W - colX;
    const sw = Math.min(colW, .78*vh*SW/SH), sh = sw*SH/SW, sx = colX + (colW - sw)/2, sy = (vh - (sh + 38))/2;
    Object.assign(sbox.style, {left: sx + 'px', top: sy + 'px', width: sw + 'px'});
    Object.assign(prog.style, {left: (sx + sw/2) + 'px', top: (sy + sh + 18) + 'px'});
    fxCopy.style.width = colL + 'px';
    // 竖放阅读器：整页谱连框都在导航条以下，框下面留进度条的位置；阅读器加文案这一组按整个窗口水平居中，每章阅读器在左或右，文案在另一边
    const ox = pin.getBoundingClientRect().left, vw = document.documentElement.clientWidth;
    const k = Math.min((vh - 92 - 56)/RD.H, .5*vw/RD.W), fw = RD.W*k, fh = RD.H*k, fy = 92 + Math.max(0, (vh - 92 - fh - 40)/2);
    const GAP = 72, cw = Math.min(480, vw - 96 - fw - GAP), x0 = Math.max(48, (vw - fw - GAP - cw)/2) - ox;
    const fx = {L: x0, R: x0 + cw + GAP}, cx = {L: x0 + fw + GAP, R: x0};
    Object.assign(rbox.style, {top: fy + 'px', width: fw + 'px', height: fh + 'px', borderRadius: 26*k + 'px'});
    rprog.style.top = (fy + fh + 14) + 'px';
    CH.forEach(c => Object.assign(c.copy.style, {left: cx[c.side] + 'px', width: cw + 'px', top: (fy + fh/2) + 'px'}));
    // 过场终点：阅读器里谱页的位置（画笔章在左）；放大到顶时谱页已经是这个大小，停在屏幕正中，然后挪过去
    const B = {x: fx.L + RD.px*k, y: fy + RD.py*k, w: RD.pw*k}, s = B.w/(410*sw/SW);
    const full = {s, x: W/2 - sx - s*sw/2, y: B.y - sy};
    G = {vh, sx, sy, sw, sh, full, k, fw, fh, fy, fx, B};
  } else {
    // 手机：导航条下面是舞台，竖放阅读器整页放下、水平居中，下面留至少 200 px 给文案；Organize 的 story 是 640 宽的窄版，在阅读器那块里上下居中
    // 批注 79：阅读器原来离舞台顶 12 px，紧贴着菜单条；现在离菜单条底边 16 px
    const nb = navEl ? parseFloat(getComputedStyle(navEl).top) + navEl.offsetHeight : 72;
    const T = Math.max(12, Math.round(nb + 16 - 64)), fw = Math.min(W, (vh - 64 - T - 26 - 200)*RD.W/RD.H), fh = fw*RD.H/RD.W, fx0 = (W - fw)/2, k = fw/RD.W;
    const sw = W, u = W/VN, sh = SH*u, sy = T + (fh - sh)/2, SH2 = T + fh + 30;
    stage.style.setProperty('--os-sh', SH2 + 'px');
    Object.assign(sbox.style, {left: '0px', top: sy + 'px', width: sw + 'px'});
    Object.assign(rbox.style, {left: '0px', top: T + 'px', width: fw + 'px', height: fh + 'px', borderRadius: Math.max(10, 26*k) + 'px', transform: `translateX(${fx0}px)`});
    Object.assign(prog.style, {left: W/2 + 'px', top: (T + fh + 10) + 'px'});
    Object.assign(rprog.style, {left: W/2 + 'px', top: (T + fh + 10) + 'px'});
    const B = {x: fx0 + RD.px*k, y: T + RD.py*k, w: RD.pw*k};
    G = {vh, sx: 0, sy, sw, sh, u, k, fw, fh, B, ct: 64 + SH2 + 14};
    copyEl.style.top = G.ct + 'px';
    fitCopy();
  }
  // Overview 这一站：正文在导航条以下那块屏幕里上下居中
  const cs = getComputedStyle(ovSec), pt = parseFloat(cs.paddingTop), pb = parseFloat(cs.paddingBottom), r = ovSec.getBoundingClientRect();
  G.ov = Math.max(0, Math.round(r.top + scrollY + pt + (r.height - pt - pb)/2 - (vh + (navEl ? navEl.getBoundingClientRect().bottom : 92))/2));
  if(!A) buildA();
  dotSync();
  if(d !== A.d){ A.d = d; if(engaged) land(cur, 'jump'); }
  else if(engaged && !anim?.real) pinTo(cur);
}
// 手机：文案底边让开右下角的播放键（离底 20 + 41 高 + 9 空）；放不下先收掉导语，还放不下再连小标题一起收；
// 矮屏收完还压到那一角，就让最底下那行说明在右边空出播放键的宽度
function fitCopy(){
  const room = G.vh - G.ct - 70;
  [fxCopy, ...CH.map(c => c.copy)].forEach(el => {
    el.classList.remove('tight', 'tight1', 'narrow');
    if(el.offsetHeight <= room) return;
    el.classList.add('tight1');
    if(el.offsetHeight <= room) return;
    el.classList.replace('tight1', 'tight');
    if(el.offsetHeight > room) el.classList.add('narrow');
  });
}

/* ---------- Organize：三拍自己播；第 4 格是文件夹打开到点进阅读器那段过场；进度条点一下跳到那一拍 ---------- */
mountSim(sim).then(a => { api = a; dotSync(); });
mountSim(rsim).then(a => { rd = a; });
// story 里的圆点和阅读器里的一样大：框宽 834 时 30 px，再小也不小于 18 px
function dotSync(){ if(api && G && api.dot) api.dot(Math.max(18, 30*G.fw/RD.W)); }
progB.forEach((b, i) => { b.setAttribute('aria-label', beats[i].querySelector('h3').textContent);
  b.addEventListener('click', () => { if(!api || !A) return;
    const k = i < 3 ? A.findIndex(a => a.k === 'org' && a.b === i + 1) : A.findIndex(a => a.k === 'ch');
    if(engaged && k === cur && !anim){ seq++; arrive(k, 'replay'); } else goTo(k); }); });
function syncCopy(y){
  const n = api.beatNow, f = api.beatFrac, a3 = A.find(a => a.k === 'org' && a.b === 3).v, p4 = cl((y - a3)/(S_Z - a3));   // 第 4 格跟着文件夹打开那一截走，点 K. 545 时正好走满
  progB.forEach((b, i) => b.style.setProperty('--p', i === 3 ? (n >= 4 ? p4 : 0) : i < n - 1 || n >= 4 ? 1 : i === n - 1 ? f : 0));
  if(n !== shown){ shown = n; const k = Math.max(1, n) - 1;
    beats.forEach((el, i) => el.classList.toggle('on', i === k)); nodes.forEach((el, i) => el.classList.toggle('on', i < Math.max(1, n))); line.style.setProperty('--b', k); }
}
// 点 K. 545 一开始文件夹那一拍还没播完，就直接摆到第 4 拍的终态再走
function zoomTo(p, ch, eo){
  const e = eo ?? -1;
  if(Math.abs(p - lastZ) < 1e-4 && Math.abs(ch - lastC) < 1e-3 && Math.abs(e - lastE) < 1e-4) return;
  lastZ = p; lastC = ch; lastE = e;
  if(p > 0 && (api.beatNow < 4 || api.busy)){ api.settle(4); played = true; }
  api.zoom(p, ch, eo);
}
// 往上滚远了就复位，下次进来重新播；不是翻页走过来的（拖滚动条），故事在视野里、还没进这一段就先播第一拍
function storyIdle(y, top){
  const vh = G.vh, r = track.getBoundingClientRect();
  if(r.top > vh){ if(played){ played = false; api.reset(); } }
  else if(!engaged && !played && y < S_Z && Math.max(r.top, 0) + top < vh*.72){ played = true; api.beat(1); }
}
// 点 K. 545 → 画笔第 1 拍那段（y 在 S_Z 到 S_P 之间）：u 是整段进度；pr 是点 K. 545；a 是放大成阅读器、b 是挪进横屏阅读器，都挂在同一条缓动 w 上
function trans(y){
  const u = cl((y - S_Z)/TR), pr = cl(u/P0), v = cl((u - P0)/(1 - P0)), w = RMq ? v : io(v);
  const a = 1 - (1 - cl(w/WA))**2, b = cl((w - WB)/(1 - WB))**2;
  return {u, v, w, a, b, p: v > 0 ? .22 + .78*cl(w/WA) : .22*pr};
}
// story 里放大后的谱页挪到阅读器谱页上：同样宽、左上角对齐（两边都是整页，比例一样，不用裁）
function placeStory(T, U){
  const B = G.B, sc = G.sw/(desk() ? SW : VN), vx = desk() ? VX : VX - (SW - VN)/2;
  const s = B.w/(410*sc), tx = B.x - G.sx - s*vx*sc, ty = B.y - G.sy;
  const S = lp(lp(1, U.s, T.a), s, T.b), x = lp(U.x*T.a, tx, T.b), yy = lp(U.y*T.a, ty, T.b);
  sim.style.transform = `translate(${x}px,${yy}px) scale(${S})`;
}
// 电脑（批注 70）：K. 545 从卡片的位置直接飘到左边阅读器的谱页上，不先放大到正中再挪；屏幕上谱页的左上角和宽跟着 w 走直线，
// story 里的放大也走 w（tickDesk 里），外层的平移缩放按这一帧谱页在舞台里的位置（api.zpage）反算；w = 1 时和 placeStory 的终点一样
function flyStory(w){
  const B = G.B, sc = G.sw/SW, r0 = api.zpage(0), r = api.zpage(w);
  const S = lp(r0.w*sc, B.w, w)/(r.w*sc), x = lp(r0.x*sc, B.x - G.sx, w) - S*sc*r.x, yy = lp(r0.y*sc, B.y - G.sy, w) - S*sc*r.y;
  sim.style.transform = `translate(${x}px,${yy}px) scale(${S})`;
}

/* ---------- 阅读器：到站播这一站；不是翻页走过来的（拖滚动条、减少动态效果）就直接摆好那一站的终态 ---------- */
let rKey = undefined;
const keyAt = y => { let k = null; A.forEach(a => { if(a.k === 'ch' && a.v <= y + 1e-3) k = a.key; }); return k; };
function rSet(key, soft){ if(!rd || key === rKey) return; rKey = key; rd.beat(key, soft); }
// 这一章的进度条：一站一格，正在播的那格按演示自己报的进度走
function rProg(c){
  if(!rd || !c.pr) return;
  const n = rd.beatNow - c.k0 + 1, f = rd.beatFrac;
  c.btn.forEach((b, k) => b.style.setProperty('--p', k < n - 1 ? 1 : k === n - 1 ? f : 0));
}
// 这一章该亮第几条说明：还没到是 0，过了是最后一条；t 是进这一章的过场进度，tn 是进下一章的
function chAt(c, y){
  const t = cl((y - c.s)/X), nx = CH[c.i + 1], tn = nx ? cl((y - nx.s)/X) : 0;
  return {t, tn, b: t < 1 ? 1 : tn > 0 ? c.nb : cl(Math.round((y - c.s - X - AH/2)/BT) + 1, 1, c.nb)};
}
function chLi(c, b){ if(c.b === b) return; c.b = b; c.li.forEach((li, k) => li.classList.toggle('on', k === b - 1)); }
// 进度条：哪一章正在台上就显示哪一章的
function progOn(ci){ CH.forEach((c, i) => c.pr && c.pr.classList.toggle('on', i === ci)); }

/* ---------- 每帧：按进度 y（屏高）摆位 ---------- */
function tickDesk(y){
  storyIdle(y, G.sy + G.sh/2);
  const T = trans(y);
  zoomTo(T.p, 0, RMq ? undefined : T.w);
  // Organize 文案和进度条在点 K. 545 的时候就淡出
  const o1 = 1 - cl(T.u/.15);
  fxCopy.style.opacity = o1; fxCopy.style.transform = RMq ? 'translateY(-50%)' : `translateY(calc(-50% - ${(1 - o1)*24}px))`;
  fxCopy.style.pointerEvents = prog.style.pointerEvents = o1 > .5 ? '' : 'none';
  prog.style.opacity = o1;
  // 阅读器：过场末尾在谱页上淡入（谱页和 story 里那页完全重合，只多出四周的顶栏、底栏和白边）；之后每章换边，滑过去
  const xo = RMq ? cl((T.v - .55)/.4) : cl((T.b - .86)/.12);
  if(RMq){ sim.style.transform = ''; sim.style.clipPath = ''; sbox.style.opacity = 1 - xo; }
  else { flyStory(T.w); sbox.style.opacity = 1 - cl((T.b - .985)/.015); }
  sbox.style.pointerEvents = T.v > .5 ? 'none' : '';
  let x = G.fx.L, ci = -1;
  CH.forEach((c, i) => {
    const {t, tn, b} = chAt(c, y);
    if(i && t > 0){ const e = RMq ? (t >= .5 ? 1 : 0) : io(cl((t - .1)/.8)); x = lp(G.fx[CH[i - 1].side], G.fx[c.side], e); }
    // 文案：先等上一章的淡出、阅读器让开位置，再从阅读器那一侧滑进来
    const tin = i ? t : cl((T.b - .5)/.5)*(y >= S_Z ? 1 : 0), ci0 = i ? cl((t - .7)/.3) : tin, co = Math.min(ci0, 1 - cl(tn/.3));
    c.copy.style.opacity = co; c.copy.classList.toggle('live', co > .5);
    c.copy.style.transform = RMq ? 'translateY(-50%)' : `translate(${(1 - io(ci0))*(c.side === 'L' ? -64 : 64)}px,-50%)`;
    if(co > .5) ci = i;
    chLi(c, b); rProg(c);
  });
  rbox.style.transform = `translateX(${x}px)`;
  rbox.style.opacity = xo; rbox.style.visibility = xo > 0 ? 'visible' : 'hidden';
  rprog.style.left = (x + G.fw/2) + 'px'; rprog.classList.toggle('live', y >= S_P - .05 && xo >= 1);
  progOn(ci);
}
// 手机：舞台里 story 放大、挪到阅读器谱页上再交给阅读器；文案在舞台下面原地换，旧的先淡出上移，新的再淡入、从下面轻轻升上来
function fade(el, oIn, oOut){
  const o = oIn*oOut; el.style.opacity = o; el.classList.toggle('live', o > .5);
  el.style.transform = RMq ? '' : `translateY(${(1 - io(oIn))*16 - (1 - oOut)*16}px)`;
}
function tickPhone(y){
  storyIdle(y, 64 + G.sy + G.sh/2);
  const T = trans(y);
  zoomTo(T.p, 0, RMq ? undefined : T.a);
  const xo = RMq ? cl((T.v - .55)/.4) : cl((T.b - .86)/.12);
  if(RMq){ sim.style.transform = ''; sim.style.clipPath = ''; sbox.style.opacity = 1 - xo; }
  else { placeStory(T, {s: 1, x: 0, y: 0}); sbox.style.opacity = 1 - cl((T.b - .985)/.015); }
  sbox.style.pointerEvents = T.v > .5 ? 'none' : '';
  rbox.style.opacity = xo; rbox.style.visibility = xo > 0 ? 'visible' : 'hidden';
  const o1 = 1 - cl(T.u/.15);
  fade(fxCopy, 1, o1); prog.style.opacity = o1;
  fxCopy.style.pointerEvents = prog.style.pointerEvents = o1 > .5 ? '' : 'none';
  let ci = -1;
  CH.forEach((c, i) => {
    const {t, tn, b} = chAt(c, y), oin = i ? cl((t - .5)/.4) : cl((T.b - .5)/.5)*(y >= S_Z ? 1 : 0);
    fade(c.copy, oin, 1 - cl(tn/.35));
    if(oin*(1 - cl(tn/.35)) > .5) ci = i;
    chLi(c, b); rProg(c);
  });
  rprog.classList.toggle('live', y >= S_P - .05 && xo >= 1);
  progOn(ci);
}

/* ---------- Overview：到了这一站，字按时间一个个亮起来（页面里跟滚动走的那段看到 data-timed 就不管了） ---------- */
if(wordsEl) wordsEl.dataset.timed = '1';
const wordEls = wordsEl ? [...wordsEl.querySelectorAll('.w')] : [];
let wT = [], wDone = 0;
function wordsSet(on){ wT.forEach(clearTimeout); wT = []; wordEls.forEach(w => w.classList.toggle('on', on)); wDone = on ? 0 : Infinity; }
function wordsPlay(){
  wordsSet(false); if(RMq){ wordsSet(true); return; }
  const gap = cl(1500/Math.max(1, wordEls.length), 40, 60);
  wordEls.forEach((w, k) => wT.push(setTimeout(() => w.classList.add('on'), k*gap)));
  wDone = performance.now() + wordEls.length*gap + 250;
}

/* ---------- 翻页：锚点之间按时间播；钉住段里页面停在锚点对应的滚动位置不动，hero ↔ Overview ↔ Organize 是真的滚页面 ---------- */
let engaged = false, cur = 0, vy = 0, anim = null, seq = 0, doneAt = 0, lastY = scrollY, lastScroll = 0, sbDrag = false;
const last = () => A.length - 1;
const pos = i => { const a = A[i]; return a.k === 'hero' ? 0 : a.k === 'ov' ? G.ov : Math.round(track.getBoundingClientRect().top + scrollY + a.v*G.vh); };
const inZone = y => y >= -2 && y <= pos(last()) + 2;
const nearest = y => A.reduce((m, a, i) => Math.abs(pos(i) - y) < Math.abs(pos(m) - y) ? i : m, 0);
// 一站之前那一站在阅读器里的名字（没有就是刚打开的谱）
const prevKey = a => a.k === 'ch' && a.ri > 0 ? rd.keys[a.ri - 1] : null;
function pinTo(i){ const p = pos(i); if(Math.abs(scrollY - p) > 1) scrollTo({top: p, behavior: 'instant'}); lastY = scrollY; }
// 走一步：画面按时间从当前进度播到下一个锚点，页面直接停到那个锚点的滚动位置（钉住的舞台看不出来）；碰到 hero、Overview 就真的滚过去
function step(d){
  const i = cur + d; if(i < 0 || i > last()) return;
  const from = A[cur], to = A[i], k = d > 0 ? to : from, real = !!(from.abs || to.abs);
  anim = {t0: performance.now(), dur: RMq && real ? 0 : k.long ? LONG : k.big ? BIG : BEAT, lin: !!k.long, how: d > 0 ? 'next' : 'back'};
  Object.assign(anim, real ? {real: true, from: scrollY, to: pos(i)} : {from: vy, to: to.v});
  // Organize 拍与拍之间舞台不动，下一拍立刻开播（beat(n) 先把上一拍摆到终态）
  if(from.k === 'org' && to.k === 'org'){ played = true; api.beat(to.b); anim.how = 'pre'; }
  // Organize 第 3 拍 → 画笔第 1 拍：先播文件夹打开（进度停在 S_Z 之前，画面只有 story 自己在动），再接点 K. 545 和放大；往回先倒放放大，再让文件夹合上
  if(k.long && !RMq){
    if(d > 0){ played = true; api.beat(4); Object.assign(anim, {fold: FOLD, dur: FOLD + LONG}); }
    else Object.assign(anim, {unfold: UNFOLD, dur: LONG + UNFOLD, how: 'rev'});
  }
  if(from.k === 'hero') wordsSet(false);
  // 阅读器：往前走先把这一站摆到终态再动；往回走，面板顺着 App 的开合动画退回上一站开始前的样子，到站再重播
  if(rd){
    if(d > 0 && from.k === 'ch' && rd.busy){ rKey = from.key; rd.beat(from.key, true); }
    if(d < 0){ rKey = to.k === 'ch' ? prevKey(to) : null; rd.beat(rKey, true); }
  }
  cur = i; seq++; doneAt = 0; if(!real) pinTo(i);
}
// 两段过场里，按时间算这一帧的进度 y（两段都匀速，接缝处速度不变方向）
function animY(a, now){
  const t = now - a.t0;
  if(a.fold) return t < a.fold ? lp(a.from, S_Z, t/a.fold) : lp(S_Z, a.to, cl((t - a.fold)/LONG));
  if(a.unfold){ if(t < LONG) return lp(a.from, S_Z, t/LONG); if(!a.shut){ a.shut = 1; api.rev(3); } return lp(S_Z, a.to, cl((t - LONG)/a.unfold)); }
  return null;
}
// 接手停在锚点 i（不播）
function engageAt(i){ engaged = true; cur = i; seq++; doneAt = 0; anim = null; if(A[i].v != null) vy = A[i].v; }
// 直接落到某个锚点，不播中间（菜单、页脚、点文案跳拍、从外面滚进来）
function land(i, how){ engageAt(i); anim = {from: vy, to: vy, t0: 0, dur: 0, how}; pinTo(i); }
// 从外面进来：正好停在某个锚点上（页面顶上的 hero）就接手、这一下照走；停在两个锚点之间就先落到最近的，这一下不再往里走
function enter(){ const i = nearest(scrollY); if(Math.abs(scrollY - pos(i)) <= 2){ engageAt(i); return true; } land(i, 'enter'); return false; }
// 隔壁一站就播过去，远的直接落
function goTo(i){ if(engaged && !anim && Math.abs(i - cur) === 1) step(i - cur); else land(i, 'jump'); }
function release(){ engaged = false; anim = null; doneAt = 0; }
const veil = (on, ms) => { const r = document.documentElement; r.style.setProperty('--veil-ms', ms + 'ms'); r.classList.toggle('veil', on); };
// 菜单和页脚：整页淡出、落到锚点、再淡回来
function leap(fn){
  if(RMq){ fn(); return; }
  veil(true, 200); setTimeout(() => { fn(); requestAnimationFrame(() => veil(false, 420)); }, 220);
}
// 到了锚点：播这一站的演示（往回走、跳过来、点了重播都重播）
function arrive(i, how){
  const a = A[i]; doneAt = 0;
  if(a.k === 'hero'){ wordsSet(false); rSet(null); }
  else if(a.k === 'ov'){ if(how === 'back') wordsSet(true); else wordsPlay(); rSet(null); }
  else if(a.k === 'org'){ if(how !== 'pre' && how !== 'rev' && (how !== 'enter' || !played)){ played = true; api.beat(a.b); } rSet(null); }
  else if(rd){ rKey = a.key; RMq ? rd.beat(a.key) : rd.one(a.key); }
}
// 这一站的演示播完了没有
function finished(a){
  if(a.k === 'hero') return false;
  if(a.k === 'ov') return performance.now() >= wDone;
  if(a.k === 'org') return api.beatNow === a.b && !api.busy;
  return !!rd && rd.beatNow === a.ri && !rd.busy;
}
// 自动连播：播完停 HOLD_MS 再走下一步；hero、Overview 和最后一站不动；后台、离开这一段时不走；手势还没停（连惯性）也不计，停了再从头计
let autoOn = !RMq, held = -1, userPlay = false;
function autoTick(now){
  if((RMq && !userPlay) || !autoOn || !engaged || anim || held === seq || document.hidden || cur >= last() || A[cur].k === 'hero' || A[cur].k === 'ov' || now - lastWheel < QUIET || tch || !finished(A[cur])){ doneAt = 0; return; }
  if(!doneAt) doneAt = now; else if(now - doneAt >= HOLD_MS) step(1);
}
document.addEventListener('visibilitychange', () => { doneAt = 0; });
// 右下角播放 / 暂停：播着显示暂停图标，停着显示播放图标；按下用全页统一的圆点加涟漪。点播放清掉 held，这一站播完停 HOLD_MS 接着走
const PB_I = {play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 5.8v12.4a.8.8 0 0 0 1.2.7l9.6-6.2a.8.8 0 0 0 0-1.4L9.7 5.1a.8.8 0 0 0-1.2.7z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="5" width="3.6" height="14" rx="1"/><rect x="13.9" y="5" width="3.6" height="14" rx="1"/></svg>'};
const pbtn = document.createElement('button');
pbtn.type = 'button'; pbtn.className = 'os-play'; pbtn.dataset.osPlay = ''; pbtn.innerHTML = '<span class="ic"></span><i class="snd"></i>';
document.body.appendChild(pbtn);
const pIc = pbtn.querySelector('.ic'), pDot = pbtn.querySelector('.snd');
const playing = () => autoOn && (!RMq || userPlay);
let pbOn = null, pbShow = null;
function syncPlay(){
  const on = playing(); if(on === pbOn) return; pbOn = on;
  pIc.innerHTML = on ? PB_I.pause : PB_I.play; pbtn.setAttribute('aria-label', on ? 'Pause autoplay' : 'Play autoplay');
}
pbtn.addEventListener('click', () => { const on = !playing(); autoOn = on; if(on){ userPlay = true; held = -1; } doneAt = 0; syncPlay(); });
let pressT = 0;
pbtn.addEventListener('pointerdown', () => { clearTimeout(pressT); pDot.classList.remove('rip'); void pDot.offsetWidth; pDot.classList.add('rip'); pbtn.classList.add('press'); });
['pointerup', 'pointercancel', 'pointerleave'].forEach(t => pbtn.addEventListener(t, () => { pressT = setTimeout(() => pbtn.classList.remove('press'), 140); }));
function showPlay(on){ if(on === pbShow) return; pbShow = on; pbtn.classList.toggle('on', on); pbtn.tabIndex = on ? 0 : -1; document.body.classList.toggle('os-pb', on); }
syncPlay();
// 用户在阅读器或 Organize 舞台上按了一下（画、拖、点眼睛、点词、开节拍器……）：这一站不再自动往下走，翻到别的站再接着连播
[rbox, sbox].forEach(el => el.addEventListener('pointerdown', () => { if(engaged){ held = seq; doneAt = 0; } }, true));

// 滚轮：停 QUIET 毫秒以上的第一下算一个手势，走一步；同一个手势后面的（连惯性）、动画中的都吃掉
let lastWheel = -1e9, wg = {free: false, used: false};
addEventListener('wheel', e => {
  if(!api || !rd || !G || !A || e.ctrlKey) return;
  const dy = e.deltaY*(e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1);
  if(Math.abs(e.deltaX) > Math.abs(dy)) return;
  const now = performance.now(), fresh = now - lastWheel >= QUIET; lastWheel = now;
  if(fresh) wg = {free: false, used: false};
  if(wg.free) return;
  if(!engaged){ if(sbDrag || !inZone(scrollY)) return; if(!enter()) wg.used = true; }
  const d = Math.sign(dy);
  // 两头再往外滚：放开，交给页面自己滚
  if(fresh && !anim && d && (d > 0 ? cur === last() : cur === 0)){ wg.free = true; release(); return; }
  e.preventDefault();
  if(!fresh || wg.used || anim || !d){ wg.used = true; return; }
  wg.used = true; step(d);
}, {passive: false});
// 触摸：一次滑动走一步；在两头往外滑就放开
let tch = null;
const owns = el => { for(let n = el; n && n !== rbox && n.nodeType === 1; n = n.parentElement){ const ta = getComputedStyle(n).touchAction; if(ta === 'none' || ta === 'pinch-zoom') return true; } return false; };
addEventListener('touchstart', e => {
  if(e.touches.length !== 1 || (rbox.contains(e.target) && owns(e.target))){ tch = null; return; }
  tch = {y: e.touches[0].clientY, dec: 0, used: !!anim, free: false};
  if(!engaged && api && rd && G && A && !sbDrag && inZone(scrollY) && !enter()) tch.used = true;
}, {passive: true});
addEventListener('touchmove', e => {
  if(!tch || !engaged || tch.free || e.touches.length !== 1) return;
  const dy = tch.y - e.touches[0].clientY;
  if(!tch.dec){
    if(!dy) return;
    tch.dec = Math.sign(dy);
    if(!anim && !tch.used && (tch.dec > 0 ? cur === last() : cur === 0)){ tch.free = true; release(); return; }
  }
  if(e.cancelable) e.preventDefault();
  if(tch.used || anim){ tch.used = true; return; }
  if(Math.abs(dy) >= SWIPE){ tch.used = true; step(Math.sign(dy)); }
}, {passive: false});
const lift = () => { tch = null; };
addEventListener('touchend', lift, {passive: true}); addEventListener('touchcancel', lift, {passive: true});
// 按键：方向键、PageDown/PageUp、空格一下走一步
addEventListener('keydown', e => {
  if(!api || !rd || !G || !A || e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || e.target.closest?.('input,textarea,select,[contenteditable]')) return;
  const k = e.key, sp = k === ' ' && !e.target.closest?.('button,a,[tabindex],summary');
  const d = k === 'ArrowDown' || k === 'PageDown' || (sp && !e.shiftKey) ? 1 : k === 'ArrowUp' || k === 'PageUp' || (sp && e.shiftKey) ? -1 : 0;
  if(!d) return;
  if(!engaged){ if(sbDrag || !inZone(scrollY)) return; if(!enter()){ e.preventDefault(); return; } }
  if(anim){ e.preventDefault(); return; }
  if(d > 0 ? cur === last() : cur === 0){ release(); return; }
  e.preventDefault(); step(d);
});
// 拖滚动条：拖的时候画面跟着走，松手落到最近的锚点
addEventListener('mousedown', e => { if(e.clientX >= document.documentElement.clientWidth){ sbDrag = true; release(); } });
addEventListener('mouseup', () => { if(sbDrag){ sbDrag = false; lastScroll = 0; } });
// 页面自己滚了：从下面滚上来停在最后一个锚点，这一下不再往里走；
// 停着的时候被别的东西挪了：手势还在（滚轮刚滚过、手指没抬）或挪得少就回到原位，挪得远就落到最近的锚点，挪出这一段就放开
addEventListener('scroll', () => {
  if(!api || !rd || !G || !A) return;
  const y = scrollY, prev = lastY; lastY = y; lastScroll = performance.now();
  if(sbDrag || anim?.real) return;
  const aL = pos(last());
  if(engaged){
    if(Math.abs(y - pos(cur)) <= 2) return;
    if(!inZone(y)){ release(); return; }
    if(performance.now() - lastWheel < 400 || tch || Math.abs(y - pos(cur)) < G.vh*.4) pinTo(cur); else land(nearest(y), 'jump');
    return;
  }
  if(prev > aL && y <= aL && y >= 0){ wg.used = true; if(tch) tch.used = true; land(last(), 'enter'); }
}, {passive: true});

// 点章节说明或进度条：不在那一站就走过去，已经在那一站就重播
CH.forEach(c => [c.li, c.btn].forEach(els => els.forEach((el, k) => {
  const go = () => {
    const i = A.findIndex(a => a.k === 'ch' && a.c === c && a.b === k + 1);
    if(engaged && i === cur && !anim){ seq++; arrive(i, 'replay'); return; }
    goTo(i);
  };
  el.addEventListener('click', go);
  el.addEventListener('keydown', e => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); go(); } });
})));
// 菜单和页脚的 Organize、Read、Practice、Play、回到顶部直接落到锚点；其他链接（Stats、Pricing、FAQ……）放开，交给页面自己滑过去
const NAVTO = {organize: 'org', features: 'org', read: 'pen1', practice: 'prac1', play: 'turn1'};
document.addEventListener('click', e => {
  if(e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || !api || !rd || !G || !A) return;
  const a = e.target.closest?.('a[href^="#"]'); if(!a) return;
  const id = a.getAttribute('href').slice(1); if(!id) return;
  const t = NAVTO[id], i = id === 'top' ? 0 : id === 'overview' ? 1 : t === 'org' ? A.findIndex(x => x.k === 'org') : t ? A.findIndex(x => x.key === t) : -1;
  if(i < 0){ if(engaged){ release(); lastScroll = performance.now() + 1500; } return; }   // 等页面那段滑动走完，别半路又被落回锚点
  e.preventDefault(); history.replaceState(null, '', '#' + id);
  leap(() => land(i, 'jump'));
}, true);
// 菜单该亮哪一项：钉住段盖住屏幕 40% 那条线时由这里说了算（Organize 拍 → Organize，画笔、图层、词典 → Read，练习工具、Apple Music → Practice，翻页、小节、跟谱 → Play），其他地方交还给页面
const NAVK = {pen: 'read', lay: 'read', dict: 'read', prac: 'practice', am: 'practice', turn: 'play', bar: 'play', fol: 'play'};
function navKey(){
  if(!G || !A) return undefined;
  const r = track.getBoundingClientRect(), ln = G.vh*.4;
  if(r.top > ln || r.bottom < ln) return undefined;
  let a = engaged ? A[cur] : null;
  if(!a || a.v == null){ const y = -r.top/G.vh; a = A.filter(x => x.v != null && x.v <= y + .2).pop() || A.find(x => x.k === 'org'); }
  return a.k === 'org' ? 'organize' : a.k === 'ch' ? NAVK[a.c.key] : undefined;
}

// 给测试读当前停在哪个锚点
const keyOf = a => a.k === 'ch' ? a.key : a.k === 'org' ? 'org' + a.b : a.k;
sec._os = {get cur(){ return cur; }, get engaged(){ return engaged; }, get anim(){ return !!anim; }, get n(){ return A.length; }, get done(){ return doneAt; },
  get key(){ return keyOf(A[cur]); }, keys: () => A.map(keyOf), pos: i => pos(i), go: i => land(i, 'jump'), get rd(){ return rd; }, get story(){ return api; }, get fin(){ return finished(A[cur]); }, get held(){ return held === seq; }, get nav(){ return navKey(); }, get auto(){ return autoOn; }, set auto(v){ autoOn = !!v; doneAt = 0; syncPlay(); }, get playing(){ return playing(); }};
addEventListener('resize', layout); layout();
// 字体换好后手机文案的高度会变，再量一次
document.fonts?.ready.then(layout);

(function loop(now){
  if(api && rd && G && A){
    let fin = null;
    if(anim){
      const k = anim.dur ? cl((now - anim.t0)/anim.dur) : 1, e = anim.lin ? k : io(k);
      if(anim.real){ scrollTo({top: Math.round(lp(anim.from, anim.to, e)), behavior: 'instant'}); lastY = scrollY; }
      else { const ay = animY(anim, now); vy = ay ?? lp(anim.from, anim.to, e); }
      if(k >= 1){ fin = anim; if(anim.real && A[cur].v != null) vy = A[cur].v; }
    }
    // 停在这一段里但不是翻页进来的（刷新后停在半路、拖完滚动条）：落到最近的锚点
    if(!engaged && !sbDrag && now - lastScroll > 150){ const y = scrollY; if(y > 2 && y < pos(last()) - 2) land(nearest(y), 'jump'); }
    const y = engaged && !anim?.real && A[cur].v != null ? vy : -track.getBoundingClientRect().top/G.vh;
    // 没在翻页（拖滚动条）：阅读器直接摆到经过的最后一站
    if(!engaged) rSet(keyAt(y));
    desk() ? tickDesk(y) : tickPhone(y); syncCopy(y);
    if(fin && anim === fin){ anim = null; arrive(cur, fin.how); }
    autoTick(now); showPlay(engaged && A[cur].k !== 'hero' && A[cur].k !== 'ov');
  }
  requestAnimationFrame(loop);
})(performance.now());
})();
