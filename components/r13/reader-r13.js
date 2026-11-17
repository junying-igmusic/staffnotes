/* r13 一张谱的阅读器（one-score-r13.html）：竖放的 iPad 框 834×1194，K. 545 第 1 页整页竖放（24, 41, 786 宽）。
   最底下一层是 board-r13：谱页和四色笔迹，全程都在；画笔面板只在画笔章出现，也只有画笔章能在谱上画。
   上面各章的原组件副本各占一层、铺满整个框，只在自己那一章出现：图层 layers-r13、词典 dict-r13、练习工具 practice-r13、
   Apple Music applemusic-r13、翻页与跳转和小节显示 turns-r13（拍 1–3、拍 4–5）、跟谱 follow-r13、云同步 sync-r13。
   站名：pen1–5、lay1–2、dict1–2、prac1–3、am1–2、turn1–3、bar1–3、fol1–2、sync1–4，共 26 站（r14：画笔加 Undo，图层、Apple Music 各并成两站；r19：云同步改成四站）。
   r17：最后加云同步章 sync-r13。r19：云同步章改成「换了 iPad，笔记还在」四拍（小谭 2026-11-16 定）：阅读器拉远成一台 iPad 后熄屏；新 iPad 首页同步回作曲家文件夹；点开 K. 545 笔迹原样都在、放大回阅读器；iPad mini 上画「>」大 iPad 随即出现。
   r17：「小节号显示」从跟谱章挪进小节号章（小谭：应该在前面小节的章节里），动画顺序不变：bar3 播的是跟谱层第 1 拍，fol1–2 是跟谱层第 2–3 拍。
   对外用新站名，里面照旧按原来的分法跑（IN）。
   接口照 r12：keys；beat(key, soft) 直接摆到这一站的终态（null 是刚打开的干净谱页；soft 时面板按开合动画退回）；one(key) 先摆上一站终态再只播这一站；
   busy、beatNow（站的序号）、beatFrac（这一站播了多少）。四色笔迹画上去之后一直留着；图层章每站都停回 Lesson、四色都在。 */
(function(){
const NS = window.SNSims = window.SNSims || {};
if (NS['r13/reader-r13']) return;
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const BASE = (document.currentScript && document.currentScript.src) ? new URL('./', document.currentScript.src).href : 'components/r13/';
const KEYS = ['pen1','pen2','pen3','pen4','pen5','lay1','lay2','dict1','dict2','prac1','prac2','prac3','am1','am2','turn1','turn2','turn3','bar1','bar2','bar3','fol1','fol2','sync1','sync2','sync3','sync4'];
const IN = [...KEYS.slice(0, 19), 'fol1', 'fol2', 'fol3', 'sync1', 'sync2', 'sync3', 'sync4'];
// 画笔五站：Pens（蓝）、Apple Pencil only（红）、Shapes（金）、Lasso（绿）、Undo（双指轻点两下撤销）；2026-11-15 小谭：Basic 的三站在前，Pro 的套索和撤销在后
const DEMO = ['palette', 'pencil', 'shapes', 'lasso', 'undo'];
// 画笔五个演示大概多长（毫秒，量过），给进度条用
const PEN_MS = [7500, 7400, 8300, 10200, 4400];
// 每一章用哪一层、这一章第 n 站对应那一层的第几拍
const CH = {pen: {c: 'board', o: 0}, lay: {c: 'layers', o: 0}, dict: {c: 'dict', o: 0}, prac: {c: 'practice', o: 0}, am: {c: 'am', o: 0},
  turn: {c: 'turns', o: 0}, bar: {c: 'turns', o: 3}, fol: {c: 'follow', o: 0}, sync: {c: 'sync', o: 0}};
const FILES = {board: 'board-r13', layers: 'layers-r13', dict: 'dict-r13', practice: 'practice-r13', am: 'applemusic-r13', turns: 'turns-r13', follow: 'follow-r13', sync: 'sync-r13'};
const OVER = ['layers', 'dict', 'practice', 'am', 'turns', 'follow', 'sync'];
const inner = key => IN[KEYS.indexOf(key)] || null;
const parse = key => { const ik = inner(key); if (!ik) return null; const m = /^([a-z]+)(\d+)$/.exec(ik); return m && CH[m[1]] ? {ch: m[1], n: +m[2], ri: KEYS.indexOf(key)} : null; };

const CSS = `
.sns-r13r{position:relative;width:100%;height:100%;overflow:hidden;background:#fff}
.sns-r13r>.ly{position:absolute;inset:0}
.sns-r13r>.ly.ov:not(.on),.sns-r13r>.ly.ov:not(.on) *{pointer-events:none!important}
.sns-r13r>.ly.chrome{z-index:1}
.sns-r13r>.ly.chrome,.sns-r13r>.ly.chrome *{pointer-events:none!important}
`;

function load(name){
  return new Promise(done => {
    if (NS['r13/' + name]) return done();
    const s = document.createElement('script'); s.src = BASE + name + '.js?v=dadba98c'; s.async = false;
    s.onload = s.onerror = () => done(); document.head.appendChild(s);
  });
}

NS['r13/reader-r13'] = function(root){
  if (!document.getElementById('sns-r13r-css')){ const s = document.createElement('style'); s.id = 'sns-r13r-css'; s.textContent = CSS; document.head.appendChild(s); }
  root.classList.add('sns-r13r');
  // 圆点的屏幕直径：框宽 834 时 30 px，再小也不小于 18 px；各层舞台按 s 缩放，所以写成舞台单位
  const dot = () => { const s = root.clientWidth/834; if (s) root.style.setProperty('--dotu', (Math.max(18, 30*s)/s).toFixed(2) + 'px'); };
  const ro = new ResizeObserver(dot); ro.observe(root); dot();

  let L = null, cur = -1, chNow = null, penT0 = 0, penN = 0, penBusy = false, penTok = 0, pending = null, dead = false;
  // 翻页章和跟谱章的承接（小谭批注 77）：进跟谱前翻页层先一页页往回翻到第 1 页（pre），翻完才换层；第 1 页透明，滑的是 board 层
  let pre = false, preF = false, preK = 0, syncBack = -1;
  const slideBoard = x => { L.board.el.style.transform = x ? `translateX(${x}px)` : ''; };

  function init(){
    if (dead) return;
    L = {};
    const mk = (name, over) => {
      const el = document.createElement('div'); el.className = 'ly' + (over ? ' ov' : ''); el.dataset.c = name; root.appendChild(el);
      if (over){ el.style.opacity = 0; el.style.visibility = 'hidden'; }
      return el;
    };
    const bEl = mk('board', false);
    L.board = {el: bEl, api: NS['r13/board-r13'](bEl, {}), on: true};
    bEl.style.pointerEvents = 'none';
    const layOpts = {
      onEye: (c, h, soft) => L.board.api.setHidden(c, h, soft),
      onGroup: (g, soft) => L.board.api.hideAll(g !== 0, soft)
    };
    // 跟谱翻到第 2 页时滑的是 board 层，胶囊跟着数页（只在跟谱章里数，别的章退场时摆回起点不碰翻页层）
    const folOpts = {base: slideBoard, onPage: p => { if (chNow === 'fol') L.turns.api.fol(p); }};
    OVER.forEach(name => {
      const el = mk(name, true);
      const api = NS['r13/' + FILES[name]](el, name === 'layers' ? layOpts : name === 'follow' ? folOpts : name === 'sync' ? {board: () => L.board.el} : {});
      L[name] = {el, api, on: false, ft: 0};
    });
    if (pending){ const [f, a] = pending; pending = null; f(...a); }
  }
  const need = Object.values(FILES).filter(n => !NS['r13/' + n]);
  if (need.length) need.reduce((p, n) => p.then(() => load(n)), Promise.resolve()).then(init); else init();

  // 一层出现 / 退场：soft 时淡入淡出 .3s；退场后把那一层摆回第 0 拍（面板收起）
  function vis(name, on, soft){
    const o = L[name]; if (o.on === on) return; o.on = on;
    const el = o.el; clearTimeout(o.ft);
    el.classList.toggle('on', on);
    if (!soft || RM){
      el.style.transition = 'none'; el.style.opacity = on ? '' : 0; el.style.visibility = on ? '' : 'hidden';
      if (!on) rest(name);
      return;
    }
    el.style.visibility = '';
    if (on){ el.style.transition = 'none'; el.style.opacity = 0; void el.offsetWidth; }
    el.style.transition = 'opacity .3s ease'; el.style.opacity = on ? 1 : 0;
    // 淡入完就把 opacity 拿掉：词典面板的毛玻璃在 opacity < 1 的祖先下面会失效
    o.ft = setTimeout(() => { if (on){ el.style.transition = 'none'; el.style.opacity = ''; } else { el.style.visibility = 'hidden'; rest(name); } }, 320);
  }
  function rest(name){
    const a = L[name].api;
    if (name === 'am') a.show(false); else a.beat(0);
    if (name === 'layers') resetHidden();
  }
  function resetHidden(){ const b = L.board.api; b.hidden.forEach(c => b.setHidden(c, false)); b.hideAll(false); }
  // 谱上的笔迹：画笔章第 n 站之前画了前 n 个演示，过了画笔章四个都在
  function strokes(list){
    const b = L.board.api, have = b.demoNames, drop = DEMO.filter(d => !list.includes(d) && have.includes(d));
    if (drop.length) b.clear(drop);
    b.put(list);
  }
  // 只有画笔章：画笔面板出现、谱上能画
  function penMode(on){ L.board.api.pen(on); L.board.el.style.pointerEvents = on ? '' : 'none'; if (!on) L.board.api.visible(false); else L.board.api.visible(true); }
  // 顺带：往回翻到第 1 页还没翻完就换站，直接翻完，不再接跟谱
  function stopPen(){ penTok++; penBusy = false; if (pre){ pre = false; preK++; L.turns.api.finish(); } if (preF){ preF = false; preK++; } }
  function chapter(ch, soft){
    const want = ch ? CH[ch].c : null, fol = ch === 'fol';
    // 跟谱章：翻页层的顶栏和页码胶囊一直留着，盖在跟谱层上面、只看不点
    OVER.forEach(name => { if (name !== want && !(fol && name === 'turns')) vis(name, false, soft); });
    if (want && want !== 'board') vis(want, true, soft);
    if (fol){ if (chNow !== 'fol') L.turns.api.fol(1); vis('turns', true, soft); }
    L.turns.el.classList.toggle('chrome', fol);
    penMode(ch === 'pen');
    if (ch !== 'lay' && L.layers && !L.layers.on) resetHidden();
    chNow = ch;
  }

  function beat(key, soft){
    if (!L){ pending = [beat, [key, soft]]; return; }
    let s = parse(key);
    // 版面层倒退起步时传入目标的上一站；云同步提前摆目标终态，抵达后不重播。
    const next = s && parse(KEYS[s.ri + 1]);
    const returning = soft && chNow === 'sync' && s && s.ri < cur && next?.ch === 'sync';
    if (returning) s = next;
    syncBack = returning ? s.ri : -1;
    stopPen(); cur = s ? s.ri : -1;
    if (!s){ strokes([]); chapter(null, soft); return; }
    strokes(s.ch === 'pen' ? DEMO.slice(0, s.n) : DEMO);
    // 从跟谱第 2 站退回第 1 站：不闪回上一站停的第 6 页，跟谱层退回起点等着重播
    if (soft && !RM && chNow === 'fol' && key === 'bar2'){ L.follow.api.beat(0, true); return; }
    const was = chNow;
    chapter(s.ch, soft);
    const c = CH[s.ch];
    if (c.c === 'board') return;
    const a = L[c.c].api;
    if (c.c === 'am') a.show(true);
    // 从跟谱退回翻页章：翻页层停在第 1 页（和跟谱同一页）淡进来，再照 App 一页页往前翻到这一站的页
    if (soft && !RM && was === 'fol' && c.c === 'turns') a.enter(c.o + s.n, slideBoard); else a.beat(c.o + s.n, soft);
  }
  function one(key){
    if (!L){ pending = [one, [key]]; return; }
    const s = parse(key); if (!s){ beat(null); return; }
    if (RM){ beat(key); return; }
    const returning = s.ch === 'sync' && (s.ri < cur || s.ri === syncBack);
    syncBack = -1; stopPen(); cur = s.ri;
    const c = CH[s.ch];
    if (returning){ strokes(DEMO); chapter(s.ch, true); L.sync.api.beat(c.o + s.n, true); return; }
    if (s.ch === 'pen'){
      strokes(DEMO.slice(0, s.n - 1)); chapter('pen', true);
      const tok = ++penTok; penBusy = true; penN = s.n; penT0 = performance.now();
      L.board.api.demo(DEMO[s.n - 1]).then(() => { if (tok === penTok) penBusy = false; }, () => { if (tok === penTok) penBusy = false; });
      return;
    }
    strokes(DEMO);
    // 从翻页章进跟谱（谱还停在第 2–6 页）：翻页层先照 App 一页页往回翻到第 1 页，翻完再换跟谱层开播；翻的时候这一站算还没开始
    if (c.c === 'follow' && L.turns.on && chNow !== 'fol'){
      const k = ++preK; pre = true;
      L.turns.api.leave(slideBoard).then(ok => { if (!ok || k !== preK) return; pre = false; chapter(s.ch, true); L.follow.api.one(c.o + s.n); });
      return;
    }
    // 跟谱先滑回第一页，再等顶底栏退场；进场期间保持 busy，避免自动连播提前换站。
    if (c.c === 'sync' && chNow === 'fol'){
      const k = ++preK; preF = true;
      L.follow.api.beat(0, true);
      setTimeout(() => {
        if (k !== preK) return;
        chapter(s.ch, true);
        setTimeout(() => { if (k !== preK) return; preF = false; L.sync.api.one(c.o + s.n); }, 350);
      }, 400);
      return;
    }
    chapter(s.ch, true);
    const a = L[c.c].api;
    if (c.c === 'am') a.show(true);
    a.one(c.o + s.n);
  }
  function active(){ return chNow ? L[CH[chNow].c] : null; }

  return {
    keys: KEYS,
    beat, one,
    get busy(){
      if (!L) return !!pending;
      if (preF) return true;
      if (chNow === 'pen') return penBusy && L.board.api.busy;
      const o = active(); return !!(o && o.api.busy);
    },
    get beatNow(){ return cur; },
    get beatFrac(){
      if (!L || cur < 0 || pre || preF) return 0;
      if (chNow === 'pen') return penBusy && L.board.api.busy ? Math.min(1, (performance.now() - penT0)/PEN_MS[penN - 1]) : 1;
      const o = active(), s = parse(KEYS[cur]);
      if (!o || !s) return 1;
      const n = o.api.beatNow - CH[s.ch].o;
      return n < s.n ? 0 : n > s.n ? 1 : (o.api.beatFrac ?? 1);
    },
    // 给测试读：现在看得见哪几层、谱上有哪几种颜色的笔迹、藏了哪几种
    get layersOn(){ return L ? ['board', ...OVER.filter(n => L[n].on)] : []; },
    get strokeColors(){ return L ? L.board.api.strokeColors : []; },
    get hiddenColors(){ return L ? L.board.api.hidden : []; },
    get parts(){ return L ? Object.fromEntries(Object.entries(L).map(([k, o]) => [k, o.api])) : null; },
    visible(on){ if (!L) return; if (!on && preF) stopPen(); OVER.forEach(n => L[n].api.visible?.(on && L[n].on)); L.board.api.visible(on && chNow === 'pen'); },
    destroy(){ dead = true; if (L) stopPen(); ro.disconnect(); if (L) Object.values(L).forEach(o => o.api.destroy?.()); root.innerHTML = ''; }
  };
};
})();
