/* 一张谱 r13 的图层副本（layers.js、r10/r12 的副本都不改）：铺在竖屏 iPad 框（834×1194）上，谱页和 Lesson 组的笔迹是下面 board 画的四种颜色，
   这里只画面板、Fingering / Stage 两组的墨迹和点按圆点。Lesson 组的眼睛、切组都回调给阅读器（opts.onEye、opts.onGroup），由它去隐藏 board 上的笔迹。
   r14 两拍：1 面板弹出 → 点 Blue 的眼睛藏起连线 → 锁 Green（它的垃圾桶跟着变灰）→ 点 Gold 的垃圾桶，照 App 先弹「Delete “Gold Layer”?」，点 Delete，那一行收起、谱上的 Gold 消失；
   2 点 Fingering → 点 Stage → 点回 Lesson。藏、锁、删停在第 1 拍的终态，第 2 拍切回 Lesson 时还是那样；离开这一章由阅读器把颜色全摆回来。 */
(function(){
const NS = window.SNSims = window.SNSims || {};
if (NS['r13/layers-r13']) return;

const INKS = ['#B64C50','#39836B','#3F529F','#D9AC2B','#8064AD','#292D38'];
const NAMES = ['Red','Green','Blue','Gold','Purple','Black'];
const GROUPS = ['Lesson','Fingering','Stage'];
const ACCENT = '#3F529F', INK = '#292D38';
// 多语言：snT 来自 components/r13/i18n-r13.js（这里的词在 i18n/pens.json）；没载入时原样返回英文
const snT = (s, v) => window.snT ? window.snT(s, v) : s.replace(/\{(\w+)\}/g, (m, k) => v && k in v ? v[k] : m);
const layerName = c => snT('{c} Layer', {c: snT(NAMES[c])});

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
  trash: S('<path d="M4.5 6.5h15"/><path d="M9.5 6.5V4.2h5v2.3"/><path d="m6.3 6.5.9 13.3h9.6l.9-13.3"/><path d="M10.2 10.5v5.8M13.8 10.5v5.8"/>'),
  trashOn: S('<path d="M4.5 6.5h15"/><path d="M9.5 6.5V4.2h5v2.3"/><path d="m6.3 6.5.9 13.3h9.6l.9-13.3" fill="currentColor" fill-opacity=".25"/><path d="M10.2 10.5v5.8M13.8 10.5v5.8"/>')
};
// App 的删除确认（Resources/LayerPanel.xcstrings：layer.deleteTitle / layer.deleteMessage）
const DEL_MSG = 'Deletes this colour layer’s annotations on every page in the current note group. This cannot be undone. The PDF and layers in other groups are kept.';
const tip = c => `<svg class="tip" viewBox="0 0 16 18"><path d="M8 1.2 13 8v2.4H3V8Z" fill="${c}"/><rect x="3.4" y="11" width="9.2" height="5.8" rx="1.2" fill="#292D38"/></svg>`;

/* ---------- ink, in page pixels of k545-p1.jpg (1300 × 1839; r60: 1878 Breitkopf & Härtel, AMA Serie 20 N° 15, p. 1) ---------- */
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
    // r60：底图换成 1878 年 Breitkopf 旧全集第 1 页。右手（Blue）：第 1 小节 e″ g″、第 3 小节 g″ c‴，
    // 第 11 小节 f 那一排八分音符上方空着，整排写满 1 5 3 1 2 5 3 1
    up(3,284,344), up(5,331,348), up(2,664,362), up(5,703,350),
    up(1,450,800), up(5,490,798), up(3,522,800), up(1,560,800), up(2,596,800), up(5,635,798), up(3,670,800), up(1,707,800),
    // 左手（Green）写在第 1 行低音连线下面：第 1 小节 c–e、第 2 小节 d–f 各标两个，写满会读成一串数
    ...[[5,202],[3,245],[5,387],[2,427]].map(([n,x])=>Object.assign(dn(n,x,546),{c:1}))
  ].map(x=>x.c===undefined ? Object.assign(x,{c:2}) : x),
  [ // Stage: breaths at the phrase ends, two cues
    {c:4, d:comma(540,326)},   // 第 2 小节后
    {c:4, d:comma(424,770)},   // 第 11 小节 f 之前
    {c:4, d:comma(868,770)},   // 第 12 小节后
    {c:3, d:'M380 394 L 478 386', hl:true},    // 第 2 小节 b′ c″ d″ c″（第 3 小节在电脑上会被图层面板盖住）
    {c:3, d:'M1004 622 L 1112 618', hl:true}   // 第 9 小节升 c″ 那一串
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
.sns-layers .ly{display:flex;align-items:center;height:46px;padding:0 12px 0 18px;gap:10px;font-size:15px;font-weight:500;overflow:hidden;transition:height .3s ease,opacity .2s}
.sns-layers .ly.gone{height:0;opacity:0}
.sns-layers .ly .tr.off{opacity:.3;cursor:default}
.sns-layers .l-dim{position:absolute;left:0;top:0;width:100%;height:100%;background:rgba(20,22,28,.16);opacity:0;transition:opacity .22s ease;pointer-events:none}
.sns-layers .l-dim.on{opacity:1;pointer-events:auto}
.sns-layers .l-alert{position:absolute;left:50%;top:50%;width:300px;box-sizing:border-box;padding:22px 20px 18px;border-radius:32px;background:rgba(255,255,255,.98);box-shadow:0 1px 2px rgba(41,45,56,.08),0 20px 60px rgba(41,45,56,.22);text-align:center;
  transform:translate(-50%,-50%) scale(calc(var(--ps,1)*1.1));opacity:0;pointer-events:none;transition:opacity .2s ease,transform .3s cubic-bezier(.2,.8,.2,1)}
.sns-layers .l-alert.on{transform:translate(-50%,-50%) scale(var(--ps,1));opacity:1;pointer-events:auto}
.sns-layers .l-alert h4{margin:0 0 6px;font-size:17px;line-height:22px;font-weight:600}
.sns-layers .l-alert p{margin:0 0 18px;font-size:13.5px;line-height:18px;color:rgba(41,45,56,.72)}
/* 德语页给正文开了自动断字，App 的弹窗不断字 */
.sns-layers .l-alert p{-webkit-hyphens:manual;hyphens:manual}
.sns-layers .l-alert .bt{display:flex;gap:10px}
.sns-layers .l-alert .bt span{flex:1;height:46px;border-radius:23px;background:rgba(118,118,128,.12);display:grid;place-items:center;font-size:16px;font-weight:500;cursor:pointer}
.sns-layers .l-alert .bt .del{color:#C9433F;font-weight:600}
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
  const dim = document.createElement('div'); dim.className = 'l-dim';
  const alertEl = document.createElement('div'); alertEl.className = 'l-alert';
  alertEl.innerHTML = `<h4></h4><p>${snT(DEL_MSG)}</p><div class="bt"><span class="cn">${snT('Cancel')}</span><span class="del">${snT('Delete')}</span></div>`;
  const touch = document.createElement('div'); touch.className = 'snd';
  Object.assign(touch.style, {opacity:0, transition:'opacity .25s, transform .12s'});
  stage.append(card, pan, dim, alertEl, touch);
  const svg = card.querySelector('svg.ink');
  root.classList.add('ready');

  /* state */
  const fresh = () => ({g:0, open:false, hidden:[{},{},{}], locked:[{},{},{}], deleted:[{},{},{}], glocked:[false,false,false]});
  let st = fresh(), pend = null;   // pend：等确认删除的那一层 [组, 颜色]
  const live = g => usedColours(g).filter(c=>!st.deleted[g][c]);
  const gone = (g, c) => !!(st.hidden[g][c] || st.deleted[g][c]);

  /* panel */
  pan.innerHTML = `<div class="seg">${GROUPS.map((n,i)=>`<span data-g="${i}"><i></i><b>${snT(n)}</b></span>`).join('')}</div>
    <div class="gt"><span class="slot glock"><i class="ic"></i></span><span class="nm"></span><span class="slot geye"><i class="ic"></i></span></div><div class="rows"></div>`;
  const segs = [...pan.querySelectorAll('.seg span')], rowsEl = pan.querySelector('.rows');
  function renderRows(){
    const g = st.g;
    rowsEl.innerHTML = live(g).map(c=>{
      const off = !!st.hidden[g][c], lk = !!st.locked[g][c], ask = !!pend && pend[0]===g && pend[1]===c;
      // App：锁上的层不能删，垃圾桶变灰
      return `<div class="ly" data-c="${c}">${tip(INKS[c])}<div class="nm">${layerName(c)}</div>`+
        `<i class="ic eye ${off?'act':''}">${off?ICON.eyeOff:ICON.eye}</i><i class="ic lk ${lk?'act':''}">${lk?ICON.lock:ICON.unlock}</i><i class="ic tr ${lk?'off':''}">${ask?ICON.trashOn:ICON.trash}</i></div>`;
    }).join('');
  }
  function render(){
    const g = st.g;
    pan.classList.toggle('open', st.open);
    segs.forEach((s,i)=>{ s.classList.toggle('on', i===g); s.querySelector('i').innerHTML = i===g ? ICON.stackOn : ICON.stack; });
    pan.querySelector('.gt .nm').textContent = snT(GROUPS[g]);
    const gl = pan.querySelector('.glock .ic'); gl.classList.toggle('act', st.glocked[g]); gl.innerHTML = st.glocked[g] ? ICON.lock : ICON.unlock;
    const allOff = live(g).every(c=>st.hidden[g][c]);
    const ge = pan.querySelector('.geye .ic'); ge.classList.toggle('act', allOff); ge.innerHTML = allOff ? ICON.eyeOff : ICON.eye;
    renderRows();
    svg.querySelectorAll('.grp').forEach(e=>e.classList.toggle('on', +e.dataset.g===g));
    svg.querySelectorAll('.grp').forEach(e=>{ const gg = +e.dataset.g; e.querySelectorAll('.lay').forEach(l=>l.classList.toggle('off', gone(gg, +l.dataset.c))); });
  }
  // 把当前状态告诉阅读器：在哪一组、Lesson 组哪几层藏着或删了
  function report(soft){ onGroup(st.g, soft); usedColours(0).forEach(c=>onEye(c, gone(0, c), soft)); }
  // 删一层：照 App 先弹确认；点 Delete 那一行收起，谱上那种颜色消失
  function ask(g, c){ pend = [g, c]; alertEl.querySelector('h4').textContent = snT('Delete “{name}”?', {name: layerName(c)}); dim.classList.add('on'); alertEl.classList.add('on'); renderRows(); }
  function closeAsk(){ pend = null; dim.classList.remove('on'); alertEl.classList.remove('on'); }
  function del(g, c){
    closeAsk(); st.deleted[g][c] = true;
    if (g === 0) onEye(c, true, true); else svg.querySelectorAll(`.grp[data-g="${g}"] .lay[data-c="${c}"]`).forEach(l=>l.classList.add('off'));
    const row = rowsEl.querySelector(`.ly[data-c="${c}"]`);
    if (row){ row.querySelector('.tr').innerHTML = ICON.trash; row.classList.add('gone'); setTimeout(()=>{ if (st.deleted[g][c] && row.isConnected) render(); }, 320); }
  }

  /* layout：舞台 834×1194 按框宽缩放；面板挂右上。宽框（桌面）上 App 的 1 pt 在屏幕上至少 .85 px；
     r14：框越窄面板放大得越少，手机上（框宽 .45 以下）跟 Apple Music 一样只随框缩放，不盖住谱 */
  let s = 1;
  function layout(){
    const w = root.clientWidth; if (!w) return;
    s = w/W;
    stage.style.transform = `scale(${s})`;
    stage.style.setProperty('--ps', Math.max(1, Math.min(.85/s, 1 + (s - .45)*2)));
  }
  const ro = new ResizeObserver(layout); ro.observe(root);
  layout(); render();

  /* ---------- scripted beats ---------- */
  const CANCEL = {};
  const DUR = [0, 9200, 8100];
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
    const btn = (c, k) => rowsEl.querySelector(`.ly[data-c="${c}"] ${k}`);
    if (n===1){
      await wait(150);
      st.open = true; render();
      await wait(1100);
      await tapOn(btn(2, '.eye'), ()=>setEye(0, 2, true), 560);
      await wait(1150);
      await tapOn(btn(1, '.lk'), ()=>{ st.locked[0][1] = true; render(); }, 480);
      await wait(950);
      await tapOn(btn(3, '.tr'), ()=>ask(0, 3), 460);
      await wait(1900);
      await tapOn(alertEl.querySelector('.del'), ()=>del(0, 3), 520);
      await wait(1100);
      touch.style.opacity = 0;
      await wait(300);
    } else if (n===2){
      await wait(250);
      await tapOn(segs[1], ()=>pickGroup(1, true, t), 520);
      await wait(1450);
      await tapOn(segs[2], ()=>pickGroup(2, true, t), 460);
      await wait(1400);
      await tapOn(segs[0], ()=>pickGroup(0, true, t), 520);
      await wait(900);
      await tapOn(btn(2, '.eye'), () => setEye(0, 2, false), 520);
      await wait(320);
      await tapOn(btn(1, '.lk'), () => { st.locked[0][1] = false; render(); }, 420);
      await wait(320);
      st.open = false; render();
      touch.style.opacity = 0;
      await wait(300);
    }
  }
  // 拍 2 恢复 Blue 和 Green，收起面板；Gold 保持删除。
  function stateAt(n){
    const s = fresh();
    if (n>=1){ s.open = true; s.hidden[0][2] = true; s.locked[0][1] = true; s.deleted[0][3] = true; }
    if (n>=2){ s.open = false; s.hidden[0][2] = false; s.locked[0][1] = false; }
    return s;
  }
  function stop(){ if (tok){ tok.dead = true; tok = null; done = true; } touch.style.opacity = 0; touch._down = false; tp = null; touch.style.transform = ''; rowsEl.classList.remove('fade'); }
  function snap(n, soft){
    stop(); closeAsk(); st = stateAt(n);
    if (!soft || RM){ root.classList.add('now'); void root.offsetWidth; }
    render(); report(soft && !RM);
    if (!soft || RM){ void root.offsetWidth; requestAnimationFrame(()=>root.classList.remove('now')); }
  }
  function go(n, animate, only, soft){
    n = Math.max(0, Math.min(2, n|0));
    if (!animate || RM || n===0){ snap(n, soft); cur = n; done = true; t0 = performance.now(); return; }
    snap(n-1);
    const t = tok = {dead:false};
    (async ()=>{
      for (let k=n; k<=(only ? n : 2); k++){
        cur = k; done = false; t0 = performance.now();
        try { await run(k, t); } catch(e){ if (e===CANCEL) return; throw e; }
        if (t.dead) return;
      }
      done = true; if (tok===t) tok = null;
    })();
  }

  /* ---------- 用户自己点：切组、眼睛、锁、删；一按下就停掉正在播的脚本 ---------- */
  pan.addEventListener('pointerdown', ()=>{ if (tok) stop(); });
  alertEl.addEventListener('pointerdown', ()=>{ if (tok) stop(); });
  alertEl.addEventListener('click', e=>{
    if (!pend) return;
    if (e.target.closest('.del')) del(...pend);
    else if (e.target.closest('.cn')){ closeAsk(); renderRows(); }
  });
  pan.addEventListener('click', e=>{
    if (!st.open) return;
    const sg = e.target.closest('.seg span');
    if (sg){ const g = +sg.dataset.g; if (g !== st.g) pickGroup(g, true); return; }
    const row = e.target.closest('.ly'), g = st.g;
    if (row){
      const c = +row.dataset.c;
      if (e.target.closest('.eye')) setEye(g, c, !st.hidden[g][c]);
      else if (e.target.closest('.lk')){ st.locked[g][c] = !st.locked[g][c]; render(); }
      else if (e.target.closest('.tr') && !st.locked[g][c]) ask(g, c);
      return;
    }
    if (e.target.closest('.glock')){ st.glocked[g] = !st.glocked[g]; render(); return; }
    if (e.target.closest('.geye')){
      const h = !live(g).every(c=>st.hidden[g][c]);
      live(g).forEach(c=>{ st.hidden[g][c] = h; if (g === 0) onEye(c, h, true); });
      render();
    }
  });

  return {
    beats: 2,
    get beatNow(){ return cur; }, get busy(){ return !!tok; },
    get beatFrac(){ if (done || !tok) return cur ? 1 : 0; return Math.min(1, (performance.now()-t0)/DUR[cur]); },
    play(){ go(RM ? 2 : 1, true); },
    go(n){ go(n, true); },
    one(n){ go(n, true, true); },
    beat(n, soft){ go(n, false, false, soft); },
    reset(){ go(0, false); },
    visible(){},
    destroy(){ stop(); ro.disconnect(); root.innerHTML = ''; root.classList.remove('sns-layers', 'ready', 'now'); }
  };
};
})();
