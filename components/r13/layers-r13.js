/* 一张谱 r13 的图层副本（layers.js、r10/r12 的副本都不改）：铺在竖屏 iPad 框（834×1194）上，谱页和 Lesson 组的笔迹是下面 board 画的四种颜色，
   这里只画面板、Fingering / Stage 两组的墨迹和点按圆点。Lesson 组的眼睛、切组都回调给阅读器（opts.onEye、opts.onGroup），由它去隐藏 board 上的笔迹。
   三拍：1 面板弹出 → 点 Fingering → 点 Stage → 点回 Lesson；2 点 Blue 的眼睛藏起指法弧线，停一会儿再打开；3 锁 Gold 那一层，再锁整组。每拍都停在 Lesson、四色都在。 */
(function(){
const NS = window.SNSims = window.SNSims || {};
if (NS['r13/layers-r13']) return;

const INKS = ['#B64C50','#39836B','#3F529F','#D9AC2B','#8064AD','#292D38'];
const NAMES = ['Red','Green','Blue','Gold','Purple','Black'];
const GROUPS = ['Lesson','Fingering','Stage'];
const ACCENT = '#3F529F', INK = '#292D38';

/* ---------- icons (24 grid; linear = normal, soft duotone + accent = hidden / locked) ---------- */
const S = (body, sw) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw||1.5}" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
const STACK = '<g transform="translate(12 12) scale(.93) translate(-12 -12)"><path FILL d="m19.4 18.39-6.02 3.35c-1.38.77-3.07-.23-3.07-1.81v-6.56c0-.75.41-1.44 1.06-1.81l6.02-3.35c1.38-.77 3.07.23 3.07 1.81v6.56c0 .75-.41 1.44-1.06 1.81Z"/><path d="M17.08 4.26 9.02 8.84a4.2 4.2 0 0 0-2.09 3.59v7.62"/><path d="M13.69 2 5.66 6.46a3.9 3.9 0 0 0-2.13 3.61v6.6"/></g>';
const EYE = 'M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z';
const ICON = {
  stack: S(STACK.replace('FILL','')),
  stackOn: S(STACK.replace('FILL','fill="currentColor" fill-opacity=".25"')),
  eye: S(`<path d="${EYE}"/><circle cx="12" cy="12" r="3.1"/>`),
  eyeOff: S(`<path d="${EYE}" fill="currentColor" fill-opacity=".25"/><circle cx="12" cy="12" r="3.1" fill="currentColor"/><path d="M3.6 3.6 20.4 20.4" stroke="#fff" stroke-width="4"/><path d="M3.6 3.6 20.4 20.4" stroke-width="1.7"/>`),
  unlock: S('<rect x="5" y="10.4" width="14" height="10.1" rx="2.6"/><path d="M8.2 10.4V8.1a3.8 3.8 0 0 1 7.6 0v2.3"/><path d="M3.6 3.6 20.4 20.4"/>'),
  lock: S('<rect x="5" y="10.4" width="14" height="10.1" rx="2.6" fill="currentColor" fill-opacity=".25"/><path d="M8.2 10.4V8.1a3.8 3.8 0 0 1 7.6 0v2.3"/><path d="M12 14.2v2.6" stroke-width="1.9"/>'),
  trash: S('<path d="M4.5 6.5h15"/><path d="M9.5 6.5V4.2h5v2.3"/><path d="m6.3 6.5.9 13.3h9.6l.9-13.3"/><path d="M10.2 10.5v5.8M13.8 10.5v5.8"/>')
};
const tip = c => `<svg class="tip" viewBox="0 0 16 18"><path d="M8 1.2 13 8v2.4H3V8Z" fill="${c}"/><rect x="3.4" y="11" width="9.2" height="5.8" rx="1.2" fill="#292D38"/></svg>`;

/* ---------- ink, in page pixels of k545-p1.jpg (1300 × 1839) ---------- */
const DIGIT = {
  1:'M3 2 L5.5 0 L5.5 10',
  2:'M1 3 C1 -0.5 9 -0.5 9 3 C9 6 1 8 1 10 L9.5 10',
  3:'M1 1.2 C4 -1 9 0 8.2 3 C7.6 4.8 4.2 5 4.2 5 C9 5 10.2 9 6.2 10 C4 10.6 2 10.2 1 9',
  4:'M7 10 L7 0 L1 7 L10 7',
  5:'M9 0 L2.5 0 L1.5 4.5 C4 3.3 9 3.8 9 7 C9 10.6 3 10.8 1 8.8'
};
function loop(cx, cy, rx, ry, seed){            // a hand-drawn ring that overshoots its start
  let d = '', n = 46;
  for (let i=0;i<=n;i++){
    const t = -2.3 + i/n*Math.PI*2.12, r = 1 + .05*Math.sin(i*.55+seed) + (i>n*.9 ? .07*(i-n*.9)/(n*.1) : 0);
    d += (i?' L':'M') + (cx+Math.cos(t)*rx*r).toFixed(1) + ' ' + (cy+Math.sin(t)*ry*r).toFixed(1);
  }
  return d;
}
const dig = (n, x, y) => ({digit:n, x, y});
// r13：指法数字照 App 手写的样子缩小：一个数字高 26、宽约 15（页面像素，谱表一格 10），笔宽是 App 默认单线笔 2.5 pt，
// 照画笔章的换算（×1.33，舞台 1 pt = 页面 1300/786 像素）约 5.5；音符上方的写 up（b 是数字底边），下方的写 dn（t 是顶边）
const FW = 1.75, FH = 2.6, FSW = 2.5*1.33*1300/786;
const up = (n, x, b) => dig(n, x, b - 5*FH), dn = (n, x, t) => dig(n, x, t + 5*FH);
const glyph = (n, cx, cy) => DIGIT[n].replace(/(-?[\d.]+)[ ,]+(-?[\d.]+)/g, (m, x, y) => `${(cx+(x-5)*FW).toFixed(1)} ${(cy+(y-5)*FH).toFixed(1)}`);
const comma = (x, y) => `M${x} ${y} C ${x+16} ${y+4}, ${x+20} ${y+26}, ${x+4} ${y+44} M${x-1} ${y+2} C ${x-6} ${y+10}, ${x+6} ${y+16}, ${x+9} ${y+8}`;   // a breath mark: head, then the tail
// group → [{c: colour index, d | digit, hl}]
const INK_BY_GROUP = [
  [ // Lesson: teacher's circles, phrase arcs, a highlighted run, a dynamic
    {c:0, d:loop(528, 322, 74, 44, 1)},
    {c:0, d:loop(646, 872, 44, 36, 3)},
    {c:2, d:'M152 532 C 340 474, 660 470, 862 524'},
    {c:2, d:'M172 808 C 260 772, 400 770, 482 800'},
    {c:3, d:'M884 866 L1228 861', hl:true},
    {c:5, d:'M842 903 L522 917 L842 931'},
    {c:5, d:'M197 462 L188 500 M195 468 C 199 457, 214 458, 212 470 C 210 481, 196 482, 194 473'}
  ],
  [ // Fingering: right hand above, left hand below
    // r13：右手（Blue）写在各自音符正上方、谱表外；第 1 行 c‴ 等几个在面板底下
    up(3,352,290), up(5,405,276), up(5,750,273), up(2,862,277), up(5,917,260),
    up(2,182,553), up(3,209,553), up(1,231,553), up(5,325,536),   // 第 5 小节 b′ c″ d″ 挨得近，2、3 各往外让 2–3 像素
    up(1,522,543), up(1,607,553), up(5,695,543),
    // 左手（Green）写在第 1 行低音谱表下面一排：第 1 小节 c g e g、第 2 小节 d g f g（原来第 3 小节那组半截压在面板边上，挪到第 2 小节，指法一样）
    ...[[5,242],[1,267],[3,295],[1,322],[5,490],[1,517],[2,545],[1,571]].map(([n,x])=>Object.assign(dn(n,x,456),{c:1}))
  ].map(x=>x.c===undefined ? Object.assign(x,{c:2}) : x),
  [ // Stage: breaths at the phrase ends, two cues
    {c:4, d:comma(452,236)},
    {c:4, d:comma(1222,236)},
    {c:4, d:comma(1222,508)},
    {c:4, d:comma(486,778)},
    {c:3, d:'M734 284 L 940 280', hl:true},
    {c:3, d:'M592 880 L 704 876', hl:true}
  ]
];
// r13：Lesson 组的笔迹是 board 上画笔章画的四种颜色（Blue 2、Red 0、Green 1、Gold 3），这里不画
INK_BY_GROUP[0] = [];
const usedColours = g => g === 0 ? [2, 0, 1, 3] : [...new Set(INK_BY_GROUP[g].map(s=>s.c))].sort((a,b)=>a-b);

function inkSVG(){
  let html = '';
  INK_BY_GROUP.forEach((list, g)=>{
    html += `<g class="grp" data-g="${g}">`;
    (g ? usedColours(g) : []).forEach(c=>{
      html += `<g class="lay" data-c="${c}" stroke="${INKS[c]}">`;
      list.filter(s=>s.c===c).forEach((s, i)=>{
        if (s.digit){
          html += `<path class="st" style="--i:${i}" pathLength="1" stroke-width="${FSW.toFixed(2)}" d="${glyph(s.digit, s.x, s.y)}"/>`;
        } else if (s.hl){
          html += `<path class="st hl" style="--i:${i}" pathLength="1" stroke-width="44" d="${s.d}"/>`;
        } else {
          html += `<path class="st" style="--i:${i}" pathLength="1" stroke-width="11" d="${s.d}"/>`;
        }
      });
      html += '</g>';
    });
    html += '</g>';
  });
  return html;
}

/* ---------- CSS ---------- */
const W = 834, H = 1194, PR = {x:24, y:41, w:786, h:786*1839/1300};
const CSS = `
.sns-layers{font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Helvetica Neue",sans-serif;color:${INK};-webkit-font-smoothing:antialiased;user-select:none;-webkit-user-select:none}
.sns-layers .l-stage{position:absolute;left:0;top:0;width:${W}px;height:${H}px;transform-origin:0 0;pointer-events:none}
.sns-layers .l-card{position:absolute;left:${PR.x}px;top:${PR.y}px;width:${PR.w}px;height:${PR.h}px;pointer-events:none}
.sns-layers svg.ink{position:absolute;left:0;top:0;width:100%;height:100%;display:block;overflow:visible}
.sns-layers .ink path{fill:none;stroke-linecap:round;stroke-linejoin:round;opacity:.94}
.sns-layers .ink path.hl{opacity:.4;mix-blend-mode:multiply}
.sns-layers .grp{opacity:0;transition:opacity .45s ease}
.sns-layers .grp.on{opacity:1}
.sns-layers .lay{transition:opacity .6s ease}
.sns-layers .lay.off{opacity:0}
.sns-layers.now *{transition:none!important}
.sns-layers .l-pan{position:absolute;left:${810-300}px;top:70px;width:300px;padding:14px 0 10px;border-radius:30px;background:rgba(255,255,255,.97);box-shadow:0 1px 2px rgba(41,45,56,.06),0 14px 44px rgba(41,45,56,.14);
  transform-origin:100% 0;transform:scale(calc(var(--ps,1)*.86));opacity:0;pointer-events:none;transition:opacity .22s ease,transform .32s cubic-bezier(.2,.8,.2,1)}
.sns-layers .l-pan.open{transform:scale(var(--ps,1));opacity:1;pointer-events:auto}
.sns-layers .seg{display:flex;margin:0 18px;height:36px;border-radius:18px;background:rgba(118,118,128,.1);padding:2px;gap:2px}
.sns-layers .seg span{flex:1 1 0;min-width:0;display:flex;align-items:center;justify-content:center;border-radius:16px;color:${INK};font-size:13.5px;font-weight:500;transition:flex-grow .35s ease,background .3s,color .3s;white-space:nowrap;overflow:hidden;cursor:pointer}
.sns-layers .seg span.on{flex-grow:1.9;background:rgba(63,82,159,.12);color:${ACCENT}}
.sns-layers .seg span i{width:19px;height:19px;flex:none;display:block}
.sns-layers .seg span b{font-weight:500;max-width:0;opacity:0;overflow:hidden;transition:max-width .35s ease,opacity .25s,margin .35s}
.sns-layers .seg span.on b{max-width:90px;opacity:1;margin-left:6px}
.sns-layers .gt{display:flex;align-items:center;height:52px;margin-top:4px;padding:0 4px}
.sns-layers .gt .slot{width:44px;height:44px;display:grid;place-items:center;flex:none;cursor:pointer}
.sns-layers .gt .nm{flex:1;text-align:center;font-size:16px;font-weight:600}
.sns-layers i.ic{display:block;width:22px;height:22px;color:${INK}}
.sns-layers i.ic.act{color:${ACCENT}}
.sns-layers svg{display:block;width:100%;height:100%}
.sns-layers .rows{transition:opacity .16s}
.sns-layers .rows.fade{opacity:0}
.sns-layers .ly{display:flex;align-items:center;height:46px;padding:0 12px 0 18px;gap:10px;font-size:15px;font-weight:500}
.sns-layers .ly .nm{flex:1;height:100%;display:flex;align-items:center;box-shadow:inset 0 -.5px 0 rgba(41,45,56,.14)}
.sns-layers .ly .ic{width:29.6px;height:22px;display:grid;place-items:center;cursor:pointer}
.sns-layers .ly .ic svg{width:22px;height:22px}
.sns-layers .ly .tr{color:#C9433F}
.sns-layers .tip{width:16px;height:18px;flex:none}
`;
(function inject(){
  if (document.getElementById('sns-r13-layers-css')) return;
  const s = document.createElement('style'); s.id = 'sns-r13-layers-css'; s.textContent = CSS;
  (document.head || document.documentElement).appendChild(s);
})();

const reduced = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

NS['r13/layers-r13'] = function(root, opts){
  opts = opts || {};
  const onEye = (c, h, soft) => { try { opts.onEye && opts.onEye(c, h, !!soft); } catch(e){ console.warn(e); } };
  const onGroup = (g, soft) => { try { opts.onGroup && opts.onGroup(g, !!soft); } catch(e){ console.warn(e); } };
  root.classList.add('sns-layers');
  if (getComputedStyle(root).position === 'static') root.style.position = 'relative';
  root.innerHTML = '';
  const RM = reduced();
  const stage = document.createElement('div'); stage.className = 'l-stage'; root.appendChild(stage);
  const card = document.createElement('div'); card.className = 'l-card';
  card.innerHTML = `<svg class="ink" viewBox="0 0 1300 1839" aria-hidden="true">${inkSVG()}</svg>`;
  const pan = document.createElement('div'); pan.className = 'l-pan';
  const touch = document.createElement('div'); touch.className = 'snd';
  Object.assign(touch.style, {opacity:0, transition:'opacity .25s, transform .12s'});
  stage.append(card, pan, touch);
  const svg = card.querySelector('svg.ink');
  root.classList.add('ready');

  /* state */
  const fresh = () => ({g:0, open:false, hidden:[{},{},{}], locked:[{},{},{}], glocked:[false,false,false]});
  let st = fresh();

  /* panel */
  pan.innerHTML = `<div class="seg">${GROUPS.map((n,i)=>`<span data-g="${i}"><i></i><b>${n}</b></span>`).join('')}</div>
    <div class="gt"><span class="slot glock"><i class="ic"></i></span><span class="nm"></span><span class="slot geye"><i class="ic"></i></span></div><div class="rows"></div>`;
  const segs = [...pan.querySelectorAll('.seg span')], rowsEl = pan.querySelector('.rows');
  function renderRows(){
    const g = st.g;
    rowsEl.innerHTML = usedColours(g).map(c=>{
      const off = !!st.hidden[g][c], lk = !!st.locked[g][c];
      return `<div class="ly" data-c="${c}">${tip(INKS[c])}<div class="nm">${NAMES[c]} Layer</div>`+
        `<i class="ic eye ${off?'act':''}">${off?ICON.eyeOff:ICON.eye}</i><i class="ic lk ${lk?'act':''}">${lk?ICON.lock:ICON.unlock}</i><i class="ic tr">${ICON.trash}</i></div>`;
    }).join('');
  }
  function render(){
    const g = st.g;
    pan.classList.toggle('open', st.open);
    segs.forEach((s,i)=>{ s.classList.toggle('on', i===g); s.querySelector('i').innerHTML = i===g ? ICON.stackOn : ICON.stack; });
    pan.querySelector('.gt .nm').textContent = GROUPS[g];
    const gl = pan.querySelector('.glock .ic'); gl.classList.toggle('act', st.glocked[g]); gl.innerHTML = st.glocked[g] ? ICON.lock : ICON.unlock;
    const allOff = usedColours(g).every(c=>st.hidden[g][c]);
    const ge = pan.querySelector('.geye .ic'); ge.classList.toggle('act', allOff); ge.innerHTML = allOff ? ICON.eyeOff : ICON.eye;
    renderRows();
    svg.querySelectorAll('.grp').forEach(e=>e.classList.toggle('on', +e.dataset.g===g));
    svg.querySelectorAll('.grp').forEach(e=>{ const gg = +e.dataset.g; e.querySelectorAll('.lay').forEach(l=>l.classList.toggle('off', !!st.hidden[gg][+l.dataset.c])); });
  }
  // 把当前状态告诉阅读器：在哪一组、Lesson 组哪几层藏着
  function report(soft){ onGroup(st.g, soft); usedColours(0).forEach(c=>onEye(c, !!st.hidden[0][c], soft)); }

  /* layout：舞台 834×1194 按框宽缩放；面板挂右上，App 的 1 pt 在屏幕上至少 .85 px */
  let s = 1;
  function layout(){
    const w = root.clientWidth; if (!w) return;
    s = w/W;
    stage.style.transform = `scale(${s})`;
    pan.style.setProperty('--ps', Math.max(1, .85/s));
  }
  const ro = new ResizeObserver(layout); ro.observe(root);
  layout(); render();

  /* ---------- scripted beats ---------- */
  const CANCEL = {};
  const DUR = [0, 7600, 4200, 3800];
  let tok = null, cur = 0, t0 = 0, done = false, tp = null;
  const center = el => { const sr = stage.getBoundingClientRect(), r = el.getBoundingClientRect(), k = sr.width/W || 1; return [(r.left+r.width/2-sr.left)/k, (r.top+r.height/2-sr.top)/k]; };
  function place(){ if (!tp) return; touch.style.left = tp[0]+'px'; touch.style.top = tp[1]+'px'; touch.style.transform = touch._down ? 'scale(.75)' : ''; }
  const rip = () => { touch.classList.remove('rip'); void touch.offsetWidth; touch.classList.add('rip'); };
  function pickGroup(g, soft, t){
    rowsEl.classList.add('fade'); st.g = g;
    setTimeout(()=>{ if (t && t.dead) return; render(); rowsEl.classList.remove('fade'); }, 160);
    segs.forEach((s,i)=>{ s.classList.toggle('on', i===g); s.querySelector('i').innerHTML = i===g ? ICON.stackOn : ICON.stack; });
    svg.querySelectorAll('.grp').forEach(e=>e.classList.toggle('on', +e.dataset.g===g));
    onGroup(g, soft);
  }
  function setEye(g, c, h){ st.hidden[g][c] = h; render(); if (g === 0) onEye(c, h, true); }
  async function run(n, t){
    const chk = ()=>{ if (t.dead) throw CANCEL; };
    const wait = ms => new Promise(r=>setTimeout(r, ms)).then(chk);
    const ease = p => p<.5 ? 2*p*p : 1-Math.pow(-2*p+2,2)/2;
    const tween = (ms, fn) => new Promise((res, rej)=>{ const a = performance.now();
      (function f(now){ if (t.dead) return rej(CANCEL); const p = Math.min(1,(now-a)/ms); fn(p); p<1 ? requestAnimationFrame(f) : res(); })(a); });
    const moveTo = (el, ms) => { const q = center(el); const a = tp || [q[0]-60, q[1]+170]; if (!tp){ tp = a; place(); } touch.style.opacity = 1; return tween(ms||480, p=>{ const e = ease(p); tp = [a[0]+(q[0]-a[0])*e, a[1]+(q[1]-a[1])*e]; place(); }); };
    const press = async ()=>{ touch._down = true; place(); rip(); await wait(130); touch._down = false; place(); };
    const tapOn = async (el, fn, ms) => { await moveTo(el, ms); await press(); fn(); };
    const eye = c => rowsEl.querySelector(`.ly[data-c="${c}"] .eye`);
    if (n===1){
      await wait(150);
      st.open = true; render();
      await wait(1500);
      await tapOn(segs[1], ()=>pickGroup(1, true, t), 520);
      await wait(1450);
      await tapOn(segs[2], ()=>pickGroup(2, true, t), 460);
      await wait(1400);
      await tapOn(segs[0], ()=>pickGroup(0, true, t), 520);
      await wait(900);
      touch.style.opacity = 0;
      await wait(300);
    } else if (n===2){
      await wait(200);
      await tapOn(eye(2), ()=>setEye(0, 2, true), 560);
      await wait(1700);
      await tapOn(eye(2), ()=>setEye(0, 2, false), 200);
      await wait(900);
      touch.style.opacity = 0;
      await wait(300);
    } else if (n===3){
      await wait(200);
      await tapOn(rowsEl.querySelector('.ly[data-c="3"] .lk'), ()=>{ st.locked[0][3] = true; render(); }, 560);
      await wait(950);
      await tapOn(pan.querySelector('.glock'), ()=>{ st.glocked[0] = true; render(); }, 520);
      await wait(900);
      touch.style.opacity = 0;
      await wait(300);
    }
  }
  // 每一拍的终态：都停在 Lesson，四层都在
  function stateAt(n){
    const s = fresh();
    if (n>=1) s.open = true;
    if (n>=3){ s.locked[0][3] = true; s.glocked[0] = true; }
    return s;
  }
  function stop(){ if (tok){ tok.dead = true; tok = null; done = true; } touch.style.opacity = 0; touch._down = false; tp = null; touch.style.transform = ''; rowsEl.classList.remove('fade'); }
  function snap(n, soft){
    stop(); st = stateAt(n);
    if (!soft || RM){ root.classList.add('now'); void root.offsetWidth; }
    render(); report(soft && !RM);
    if (!soft || RM){ void root.offsetWidth; requestAnimationFrame(()=>root.classList.remove('now')); }
  }
  function go(n, animate, only, soft){
    n = Math.max(0, Math.min(3, n|0));
    if (!animate || RM || n===0){ snap(n, soft); cur = n; done = true; t0 = performance.now(); return; }
    snap(n-1);
    const t = tok = {dead:false};
    (async ()=>{
      for (let k=n; k<=(only ? n : 3); k++){
        cur = k; done = false; t0 = performance.now();
        try { await run(k, t); } catch(e){ if (e===CANCEL) return; throw e; }
        if (t.dead) return;
      }
      done = true; if (tok===t) tok = null;
    })();
  }

  /* ---------- 用户自己点：切组、眼睛、锁；一按下就停掉正在播的脚本 ---------- */
  pan.addEventListener('pointerdown', ()=>{ if (tok) stop(); });
  pan.addEventListener('click', e=>{
    if (!st.open) return;
    const sg = e.target.closest('.seg span');
    if (sg){ const g = +sg.dataset.g; if (g !== st.g) pickGroup(g, true); return; }
    const row = e.target.closest('.ly'), g = st.g;
    if (row){
      const c = +row.dataset.c;
      if (e.target.closest('.eye')) setEye(g, c, !st.hidden[g][c]);
      else if (e.target.closest('.lk')){ st.locked[g][c] = !st.locked[g][c]; render(); }
      return;
    }
    if (e.target.closest('.glock')){ st.glocked[g] = !st.glocked[g]; render(); return; }
    if (e.target.closest('.geye')){
      const h = !usedColours(g).every(c=>st.hidden[g][c]);
      usedColours(g).forEach(c=>{ st.hidden[g][c] = h; if (g === 0) onEye(c, h, true); });
      render();
    }
  });

  return {
    beats: 3,
    get beatNow(){ return cur; }, get busy(){ return !!tok; },
    get beatFrac(){ if (done || !tok) return cur ? 1 : 0; return Math.min(1, (performance.now()-t0)/DUR[cur]); },
    play(){ go(RM ? 3 : 1, true); },
    go(n){ go(n, true); },
    one(n){ go(n, true, true); },
    beat(n, soft){ go(n, false, false, soft); },
    reset(){ go(0, false); },
    visible(){},
    destroy(){ stop(); ro.disconnect(); root.innerHTML = ''; root.classList.remove('sns-layers', 'ready', 'now'); }
  };
};
})();
