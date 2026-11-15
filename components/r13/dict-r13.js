/* r13 一张谱 · 词典章（Pro）：从 r11 的 dictionary-os 改来，只改位置、缩放、单张谱和剧情接线。
   谱子不在这里画：下面的 board-r13 已经画了 K. 545 第 1 页（和四色笔迹），这里是透明舞台 834×1194，只放 Allegro 的标记、长按圆环、点按圆点和 Dictionary 面板。
   面板挂在谱页右上角（右边 810、顶 70），按 ps 放大（宽框上 .85/s，框越窄放大越少，手机上跟 Apple Music 一样只随框缩放），样式照 App 的 ReaderMusicDictionaryPanel。
   拍 1：圆点按住 Allegro，圆环走满，词被标出，面板弹出 allegro 词条（r14：不再贴 Pro，Pro 只标在页面大标题旁）；
   拍 2：圆点点搜索框，Allegro 清空、光标闪；慢慢打 a、n、d，列表每个字母过滤一次；点 andante，词条打开，左上返回钮，下面是 Related entries。
   词条原文取自 App 内置词典（ReaderMusicFrozenRuntime.json，en）。用户可以点 Allegro、搜索框、清除钮、列表、返回钮、相关词；桌面上点了搜索框还能直接打字。
   接口：beats、beat(n, soft)、one(n)、busy、beatNow、beatFrac、visible(on)、destroy()。 */
(function(){
const NS = window.SNSims = window.SNSims || {};
if (NS['r13/dict-r13']) return;
const W = 834, H = 1194, K = 786/1300, PW = 280, PR = 810, PT = 70, HOLD = 520;
const A = '#3F529F', INK = '#292D38', SEC = '#646A75', EZ = 'cubic-bezier(.2,.85,.25,1)';
// 谱上 Allegro（页面像素 178–270 × 251–277，按实际谱图核过）换成舞台单位
const ALG = {x: 24 + 178*K, y: 41 + 251*K, w: 92*K, h: 26*K};
const T = {
  'allegro': ['Give the passage a brisk pace.', 'Here the word directs speed; its separate use as a movement title is excluded.'],
  'andante': ['Move at a walking pace.', 'The direction suggests a measured, forward-moving musical gait.'],
  'andantino': ['Follow the contextual tempo intended by Andantino.', 'Historical usage differs on whether it is slower or faster than andante, so period and score context matter.'],
  'andante con moto': ['Moderately slow, with motion.', 'Con moto keeps the movement from stagnating; it does not invariably turn andante into allegro.'],
  'andante cantabile': ['Moderately slow, in a singing manner.', 'Shape a singing melodic line; instrumental players need not literally sing, and the written rhythm remains relevant.'],
  'andante sostenuto': ['Moderately slow and sustained.', 'Balance andante motion with sustain; sustaining does not mean extending every note indefinitely.'],
  'poco andante': ['A little slow, with an andante character.', 'Read poco within the complete tempo context; it does not universally mean a fixed amount faster or slower than unqualified andante.'],
  'accelerando': ['Let the music gather speed.', 'The marking accel. directs a change of pace as the passage unfolds.'],
  'adagio': ['Use a leisurely, slow pace.', 'As a tempo direction it is generally slower than andante; this entry excludes movement titles.'],
  'al niente': ['Fade the sound away completely.', 'It specifies silence as the destination of a diminuendo.'],
  'accent': ['Make one note stand out from its neighbours.', 'This is local emphasis rather than a sustained loud dynamic for a whole passage.'],
  'anacrusis': ['An incomplete opening measure or the notes that lead through it.', 'Often called a pickup, it can introduce a piece or a section.'],
  'anmutig': ['With graceful charm.', 'Shape the phrase with natural grace and charm. This expressive manner does not require adding ornaments that are absent from the score.']
};
// 打 a、an、and 时的列表照 App 的结果（只留有释义的这几条）；别的输入按词首匹配
const LISTS = {
  a: ['accelerando', 'adagio', 'allegro', 'andante', 'al niente', 'accent'],
  an: ['andante', 'anacrusis', 'anmutig', 'andantino'],
  and: ['andante', 'andantino', 'andante con moto', 'andante cantabile', 'andante sostenuto', 'poco andante']
};
const RELATED = {andante: ['andantino', 'andante con moto', 'andante cantabile', 'poco andante']};
const norm = q => q.trim().toLowerCase().replace(/\s+/g, ' ');
function matches(q){
  q = norm(q); if (!q) return [];
  if (LISTS[q]) return LISTS[q];
  const all = Object.keys(T);
  return [...all.filter(t => t === q), ...all.filter(t => t !== q && t.startsWith(q)), ...all.filter(t => !t.startsWith(q) && t.split(' ').some(w => w.startsWith(q)))];
}
const tr = (s, v) => window.snT ? snT(s, v) : s;
const esc = s => s.replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'})[c]);
const SERIF = 'var(--serif,"Timeless Serif",Georgia,serif)';
const CSS = `
.sns-r13d{overflow:hidden;-webkit-user-select:none;user-select:none}
.sns-r13d *{box-sizing:border-box}
.sns-r13d .d-stage{position:absolute;left:0;top:0;width:${W}px;height:${H}px;transform-origin:0 0;pointer-events:none}
.sns-r13d .mark{position:absolute;border-radius:2px;background:rgba(63,82,159,.28);opacity:0;transform:scale(.9);transition:opacity .2s,transform .3s}
.sns-r13d .mark.pre{opacity:.45;transform:none;transition:opacity ${HOLD}ms linear,transform .3s}
.sns-r13d .mark.on{opacity:1;transform:none}
.sns-r13d .hit{position:absolute;pointer-events:auto;cursor:pointer;border-radius:4px}
.sns-r13d .ring{position:absolute;width:calc(var(--dotu,30px)*1.3);height:calc(var(--dotu,30px)*1.3);margin:calc(var(--dotu,30px)*-.65) 0 0 calc(var(--dotu,30px)*-.65);opacity:0;transition:opacity .15s;z-index:59;overflow:visible;pointer-events:none}
.sns-r13d .ring.on{opacity:1}
.sns-r13d .ring circle{stroke:${A};stroke-width:3;fill:rgba(255,255,255,.35);stroke-dasharray:97;stroke-dashoffset:97;transform:rotate(-90deg);transform-origin:center}
.sns-r13d .ring.run circle{stroke-dashoffset:0;transition:stroke-dashoffset ${HOLD}ms linear}
.sns-r13d .snd{left:0;top:0;opacity:0;transition:opacity .2s,transform .12s}
.sns-r13d .pw{position:absolute;left:${PR - PW}px;top:${PT}px;width:${PW}px;transform-origin:100% 0;pointer-events:none}
.sns-r13d .pn{position:relative;width:${PW}px;border-radius:26px;overflow:hidden;background:rgba(250,249,247,.96);-webkit-backdrop-filter:blur(24px) saturate(1.5);backdrop-filter:blur(24px) saturate(1.5);box-shadow:0 0 0 .5px rgba(0,0,0,.06),0 22px 60px rgba(41,45,56,.18),0 2px 10px rgba(41,45,56,.06);
  font-family:"Timeless Sans",-apple-system,BlinkMacSystemFont,"Helvetica Neue",sans-serif;color:${INK};-webkit-font-smoothing:antialiased;
  transform-origin:100% 0;opacity:0;transform:scale(.9) translateX(8px);transition:opacity .22s,transform .42s ${EZ};pointer-events:none}
.sns-r13d .pn.on{opacity:1;transform:none;pointer-events:auto}
.sns-r13d .hd{position:relative;height:56px;display:flex;align-items:center;justify-content:center}
.sns-r13d .hd b{font-size:17px;font-weight:600;letter-spacing:-.2px}
.sns-r13d .bk{position:absolute;left:10px;top:50%;width:36px;height:36px;margin-top:-18px;border:0;padding:0;background:none;color:${A};display:grid;place-items:center;cursor:pointer;
  opacity:0;transform:translateX(6px);transition:opacity .2s,transform .3s ${EZ};pointer-events:none}
.sns-r13d .bk.on{opacity:1;transform:none;pointer-events:auto}
.sns-r13d .bk svg{width:21px;height:21px;fill:none;stroke:currentColor;stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round}
.sns-r13d .ct{padding:6px 16px 16px}
.sns-r13d .sf{display:flex;align-items:center;gap:8px;min-height:44px;padding:0 10px;border-radius:12px;background:rgba(233,234,236,.7);transition:box-shadow .2s;cursor:text}
.sns-r13d .sf.fo{box-shadow:inset 0 0 0 1.5px rgba(63,82,159,.45)}
.sns-r13d .sf>svg{width:15px;height:15px;color:${SEC};flex:none;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;transition:color .2s}
.sns-r13d .sf.fo>svg{color:${A}}
.sns-r13d .sf .q{flex:1;min-width:0;display:flex;align-items:center;font-size:14px;line-height:20px;white-space:pre;overflow:hidden}
.sns-r13d .sf .ph{color:#9A9EA6}
.sns-r13d .sf .cr{flex:none;width:1.5px;height:17px;margin:0 1px;background:${A};animation:sns-r13d-caret 1s steps(1) infinite}
@keyframes sns-r13d-caret{50%{opacity:0}}
.sns-r13d .cx{flex:none;width:22px;height:22px;margin-right:-3px;border:0;padding:0;background:none;display:none;place-items:center;cursor:pointer}
.sns-r13d .cx.on{display:grid}
.sns-r13d .cx svg{width:15px;height:15px}
.sns-r13d .rs{overflow:hidden;transition:height .28s ${EZ},margin-top .28s ${EZ}}
.sns-r13d .rs.has{margin-top:10px}
.sns-r13d .rs.cap{overflow-y:auto;scrollbar-width:none}
.sns-r13d .rs.cap::-webkit-scrollbar{display:none}
.sns-r13d .vw.in{animation:sns-r13d-in .32s ${EZ}}
@keyframes sns-r13d-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
.sns-r13d .row{display:block;width:100%;border:0;background:none;text-align:left;color:inherit;font:inherit;padding:13px 0;cursor:pointer}
.sns-r13d .row:active,.sns-r13d .rb:active,.sns-r13d .bk:active{opacity:.45}
.sns-r13d .tw{font:400 16px/1.2 ${SERIF};letter-spacing:-.1px}
.sns-r13d .sub{font-size:12px;line-height:1.3;color:${SEC};margin-top:5px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.sns-r13d .dv{display:block;height:.5px;background:rgba(41,45,56,.2)}
.sns-r13d .hw{font:400 20px/1.2 ${SERIF};letter-spacing:-.1px}
.sns-r13d .sh{font-size:14px;font-weight:500;color:${A};margin-top:7px;line-height:1.35}
.sns-r13d .dt{font-size:14px;margin-top:7px;line-height:1.4;text-wrap:pretty}
.sns-r13d .rl{font-size:12px;font-weight:600;color:${SEC};margin-top:14px}
.sns-r13d .rb{display:block;width:100%;border:0;background:none;text-align:left;color:${INK};padding:8px 0;font:400 16px/1.2 ${SERIF};cursor:pointer}
.sns-r13d .nr{display:flex;align-items:center;gap:7px;padding:9px 11px;border-radius:12px;background:rgba(233,234,236,.7);color:${SEC};font-size:14px}
.sns-r13d .nr svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round}
.sns-r13d.now .pn,.sns-r13d.now .mark,.sns-r13d.now .bk,.sns-r13d.now .rs,.sns-r13d.now .snd,.sns-r13d.now .ring{transition:none!important}
.sns-r13d.now .vw.in{animation:none}
`;
(function inject(){
  if (document.getElementById('sns-r13-dict-css')) return;
  const s = document.createElement('style'); s.id = 'sns-r13-dict-css'; s.textContent = CSS;
  (document.head || document.documentElement).appendChild(s);
})();
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches, CANCEL = {};
const ease = t => t < .5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2)/2;
const ICON = {
  search: '<svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 20 20"/></svg>',
  back: '<svg viewBox="0 0 24 24"><path d="M15 4.5 7.5 12l7.5 7.5"/></svg>',
  clear: `<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="9" fill="${SEC}" fill-opacity=".55"/><path d="M6.8 6.8l6.4 6.4M13.2 6.8l-6.4 6.4" stroke="#F4F4F5" stroke-width="1.8" stroke-linecap="round"/></svg>`
};
// 拍 1、拍 2 各自的时长（毫秒），和下面 run() 里的等待加起来一致
const DUR = [0, 3630, 6900];

NS['r13/dict-r13'] = function(root){
  root.classList.add('sns-r13d');
  if (getComputedStyle(root).position === 'static') root.style.position = 'relative';
  root.innerHTML = `<div class="d-stage">
    <div class="mark" style="left:${ALG.x - 2}px;top:${ALG.y - 2}px;width:${ALG.w + 4}px;height:${ALG.h + 4}px"></div>
    <div class="hit" role="button" aria-label="${tr('Look up {term}', {term: 'Allegro'})}" style="left:${ALG.x - 8}px;top:${ALG.y - 8}px;width:${ALG.w + 16}px;height:${ALG.h + 16}px"></div>
    <svg class="ring" viewBox="0 0 34 34"><circle cx="17" cy="17" r="15.5"/></svg>
    <div class="pw"><div class="pn">
      <div class="hd"><button class="bk" type="button" aria-label="${tr('Search results')}" tabindex="-1">${ICON.back}</button><b>${tr('Dictionary')}</b></div>
      <div class="ct"><div class="sf">${ICON.search}<span class="q"></span><button class="cx" type="button" aria-label="${tr('Clear')}" tabindex="-1">${ICON.clear}</button></div><div class="rs"><div class="ri"></div></div></div>
    </div></div>
    <div class="snd"></div></div>`;
  const $ = s => root.querySelector(s);
  const stage = $('.d-stage'), mk = $('.mark'), hit = $('.hit'), rg = $('.ring'), pw = $('.pw'), pn = $('.pn'), bk = $('.bk');
  const sf = $('.sf'), qEl = $('.sf .q'), cx = $('.cx'), rs = $('.rs'), ri = $('.ri'), dot = $('.snd');
  let s = 1, ps = 1, rsMax = 600;
  // 面板状态：搜索词、选中的词条、搜索框有没有焦点
  const st = {q: '', sel: null, focus: false};

  function layout(){
    const w = root.clientWidth; if (!w) return;
    s = w/W; ps = Math.max(1, Math.min(.85/s, 1 + (s - .45)*2));
    stage.style.transform = `scale(${s})`;
    pw.style.transform = `scale(${ps})`;
    // 面板底边留在框里：标题 56 + 上 6 + 搜索框 44 + 间距 10 + 下 16
    rsMax = Math.max(120, (H - 36 - PT)/ps - 132);
    fitRs(false);
  }
  const ro = new ResizeObserver(layout); ro.observe(root);

  // 结果区的高度跟内容走（App 的面板按内容长高），太高就在面板里滚
  function fitRs(anim){
    const full = ri.scrollHeight, h = Math.min(full, rsMax);
    if (!anim) rs.style.transition = 'none';
    rs.style.height = h + 'px'; rs.classList.toggle('has', full > 0); rs.classList.toggle('cap', full > rsMax + 1);
    if (!anim){ void rs.offsetWidth; rs.style.transition = ''; }
  }
  function mode(){
    const m = matches(st.q);
    if (!norm(st.q)) return {k: 'empty', m};
    if (st.sel) return {k: m.length > 1 && m.includes(st.sel) ? 'detail' : 'single', m, t: st.sel};
    if (!m.length) return {k: 'none', m};
    if (m.length === 1) return {k: 'single', m, t: m[0]};
    return {k: 'list', m};
  }
  function card(t){
    const e = T[t], rel = RELATED[t] || [];
    return `<div class="hw">${esc(t)}</div><div class="sh">${esc(tr(e[0]))}</div><div class="dt">${esc(tr(e[1]))}</div>` +
      (rel.length ? `<div class="rl">${tr('Related entries')}</div>${rel.map(r => `<button class="rb" type="button" tabindex="-1" data-t="${esc(r)}">${esc(r)}</button>`).join('')}` : '');
  }
  let lastView = '';
  function render(anim){
    const M = mode(), cr = st.focus ? '<i class="cr"></i>' : '';
    qEl.innerHTML = st.q ? esc(st.q) + cr : cr + `<span class="ph">${tr('Search musical terms')}</span>`;
    sf.classList.toggle('fo', st.focus);
    cx.classList.toggle('on', !!st.q);
    bk.classList.toggle('on', M.k === 'detail');
    const view = M.k + ':' + (M.t || M.m.join('|'));
    if (view !== lastView){
      let html = '';
      if (M.k === 'list') html = M.m.map((t, i) => `${i ? '<i class="dv"></i>' : ''}<button class="row" type="button" tabindex="-1" data-t="${esc(t)}"><div class="tw">${esc(t)}</div><div class="sub">${esc(tr(T[t][0]))}</div></button>`).join('');
      else if (M.k === 'single' || M.k === 'detail') html = card(M.t);
      else if (M.k === 'none') html = `<div class="nr">${ICON.search}${tr('No result')}</div>`;
      const fresh = anim && (M.k === 'single' || M.k === 'detail');
      ri.innerHTML = html ? `<div class="vw${fresh ? ' in' : ''}">${html}</div>` : '';
      rs.scrollTop = 0; lastView = view;
    }
    fitRs(anim);
  }

  /* ---------- 圆点 ---------- */
  let tp = null, lastP = null;
  const place = () => { if (tp){ dot.style.left = tp[0] + 'px'; dot.style.top = tp[1] + 'px'; } };
  const rip = () => { dot.classList.remove('rip'); void dot.offsetWidth; dot.classList.add('rip'); };
  const hideDot = () => { dot.style.opacity = 0; dot.style.transform = ''; dot.classList.remove('rip'); tp = lastP = null; };
  // 元素上某一点在舞台里的坐标
  const at = (el, fx = .5, fy = .5) => { const r = el.getBoundingClientRect(), sr = stage.getBoundingClientRect(), k = sr.width/W || 1;
    return [(r.left + r.width*fx - sr.left)/k, (r.top + r.height*fy - sr.top)/k]; };

  // 每拍终态：0 什么都没有；1 Allegro 标出、面板是 allegro 词条；2 搜过 and、打开 andante 词条
  let clr = 0;
  function show(n, soft){
    clearTimeout(clr);
    mk.classList.remove('pre'); mk.classList.toggle('on', n === 1); rg.classList.remove('on', 'run');
    pn.classList.toggle('on', n >= 1); hideDot();
    if (n === 0 && soft){
      // 面板照 App 收起，内容等收完再清
      st.focus = false; render(false);
      clr = setTimeout(() => { if (!pn.classList.contains('on')){ Object.assign(st, {q: '', sel: null}); render(false); } }, 450);
      return;
    }
    Object.assign(st, n === 1 ? {q: 'Allegro', sel: null, focus: false} : n === 2 ? {q: 'and', sel: 'andante', focus: false} : {q: '', sel: null, focus: false});
    render(false);
  }
  let tok = null, cur = 0, t0 = 0;
  async function run(n, t){
    const chk = () => { if (t.dead) throw CANCEL; };
    const wait = ms => new Promise(r => setTimeout(r, ms)).then(chk);
    const moveTo = (p, ms) => new Promise((res, rej) => {
      const a = tp || lastP || [p[0] + 60, p[1] + 140], s0 = performance.now(); tp = a; place(); dot.style.opacity = 1;
      (function f(now){ if (t.dead) return rej(CANCEL); const k = Math.min(1, (now - s0)/ms), e = ease(k);
        tp = [a[0] + (p[0] - a[0])*e, a[1] + (p[1] - a[1])*e]; place(); k < 1 ? requestAnimationFrame(f) : res(); })(s0); });
    const press = () => { dot.style.transform = 'scale(.75)'; rip(); };
    const lift = async () => { dot.style.transform = ''; await wait(120); dot.style.opacity = 0; await wait(200); lastP = tp; tp = null; };
    if (n === 1){
      const c = [ALG.x + ALG.w/2, ALG.y + ALG.h/2];
      await wait(350); await moveTo(c, 650);
      press(); Object.assign(rg.style, {left: c[0] + 'px', top: c[1] + 'px'});
      rg.classList.add('on'); void rg.offsetWidth; rg.classList.add('run'); mk.classList.add('pre');
      await wait(HOLD + 40);
      rg.classList.remove('on', 'run'); mk.classList.remove('pre'); mk.classList.add('on');
      Object.assign(st, {q: 'Allegro', sel: null, focus: false}); render(true); pn.classList.add('on');
      await wait(250); await lift(); await wait(200);
    } else if (n === 2){
      await wait(300); await moveTo(at(sf, .38), 600);
      press(); await wait(140);
      mk.classList.remove('on'); Object.assign(st, {q: '', sel: null, focus: true}); render(true);
      await wait(120); await lift();
      await wait(380);
      for (const ch of 'and'){ st.q += ch; render(true); await wait(780); }
      const row = ri.querySelector('.row[data-t="andante"]');
      await moveTo(row ? at(row, .22, .5) : at(sf, .5, 2), 620);
      press(); await wait(140);
      Object.assign(st, {sel: 'andante', focus: false}); render(true);
      await wait(120); await lift(); await wait(200);
    }
  }
  function snap(n, soft){
    if (tok){ tok.dead = true; tok = null; }
    if (!soft) root.classList.add('now');
    show(n, soft); void root.offsetWidth;
    if (!soft) requestAnimationFrame(() => root.classList.remove('now'));
  }
  function go(n, animate, soft){
    n = Math.max(0, Math.min(2, n|0));
    if (!animate || RM || n === 0){ snap(n, soft); cur = n; return; }
    snap(n - 1);
    const t = tok = {dead: false};
    cur = n; t0 = performance.now();
    run(n, t).then(() => { if (tok === t) tok = null; }, e => { if (e !== CANCEL) throw e; });
  }

  /* ---------- 用户自己玩：一按下就停掉脚本，交给用户 ---------- */
  function takeOver(){
    if (!tok) return;
    tok.dead = true; tok = null;
    rg.classList.remove('on', 'run'); mk.classList.remove('pre'); hideDot();
  }
  root.addEventListener('pointerdown', takeOver, true);
  hit.addEventListener('click', () => {
    mk.classList.remove('pre'); mk.classList.add('on');
    Object.assign(st, {q: 'Allegro', sel: null, focus: false}); render(true); pn.classList.add('on');
  });
  // 和脚本一样：点了 Allegro 之后再点搜索框，Allegro 清空
  sf.addEventListener('click', e => { if (e.target.closest('.cx')) return;
    if (!st.focus && mk.classList.contains('on')){ mk.classList.remove('on'); Object.assign(st, {q: '', sel: null}); }
    st.focus = true; render(true); });
  cx.addEventListener('click', () => { Object.assign(st, {q: '', sel: null, focus: true}); mk.classList.remove('on'); render(true); });
  bk.addEventListener('click', () => { st.sel = null; render(true); });
  ri.addEventListener('click', e => {
    const r = e.target.closest('.row'), b = e.target.closest('.rb');
    if (r){ Object.assign(st, {sel: r.dataset.t, focus: false}); render(true); }
    else if (b){ Object.assign(st, {q: b.dataset.t, sel: b.dataset.t, focus: false}); render(true); }
  });
  // 点面板以外的地方：搜索框失焦
  const blur = e => { if (st.focus && !pw.contains(e.target)){ st.focus = false; render(false); } };
  document.addEventListener('pointerdown', blur, true);
  // 桌面上搜索框有焦点时可以直接打字（字母和空格都留在框里，不让页面拿去翻站）
  const key = e => {
    if (!st.focus || e.metaKey || e.ctrlKey || e.altKey || !root.isConnected) return;
    const k = e.key;
    if (k === 'Escape'){ st.focus = false; render(false); return; }
    if (k === 'Enter'){ const m = matches(st.q); if (m.length){ Object.assign(st, {sel: m[0], focus: false}); render(true); } }
    else if (k === 'Backspace'){ st.q = st.q.slice(0, -1); st.sel = null; render(true); }
    else if (k.length === 1 && /[a-zà-ÿ '\-.]/i.test(k) && st.q.length < 40){ st.q += k; st.sel = null; mk.classList.remove('on'); render(true); }
    else return;
    e.preventDefault(); e.stopPropagation();
  };
  document.addEventListener('keydown', key, true);

  layout(); show(0);
  return {
    beats: 2,
    get beatNow(){ return cur; }, get busy(){ return !!tok; },
    get beatFrac(){ return tok ? Math.min(1, (performance.now() - t0)/DUR[cur]) : (cur ? 1 : 0); },
    one(n){ go(n, true); }, beat(n, soft){ go(n, false, !!soft); },
    visible(on){ if (on) return; if (tok) snap(cur); if (st.focus){ st.focus = false; render(false); } },
    destroy(){ if (tok) tok.dead = true; clearTimeout(clr); ro.disconnect(); root.removeEventListener('pointerdown', takeOver, true);
      document.removeEventListener('pointerdown', blur, true); document.removeEventListener('keydown', key, true); root.innerHTML = ''; root.classList.remove('sns-r13d'); }
  };
};
})();
