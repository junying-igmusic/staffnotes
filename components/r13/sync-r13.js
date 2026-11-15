/* 一张谱 r17 云同步章（状态类名都带 s- 前缀：网页本身有 .pill 样式，撞名会把这一层压成一条蓝边）：叠在阅读器的竖屏谱页上（框单位 834 宽），透明，底下 board 的 K. 545 第 1 页和四色笔迹照旧露着。
   照 App：状态走 ReaderStatusPill（头部下面那颗玻璃胶囊，高 44、字 15 medium、图标 24、左右 16、间距 9，进场从上方 10 pt、.92 倍缩放淡入），
   同步中是 arrow.triangle.2.circlepath「Syncing…」，有别的设备打开同一份谱时是 ipad.and.iphone「Also open on %@」（PDFReaderView.statusUpdate / presenceLine）。
   拍 1：胶囊亮起「Syncing…」，右下角滑进一台 iPad mini，屏上是同一页，谱上的笔迹随后出现（直接从 board 的笔迹画布拷过来），胶囊收起；
   拍 2：胶囊换成「Also open on iPad mini」，停住。设备名 iPad mini 是样例。
   接口和其他层一样：beat(n, soft) 直接摆拍 n 终态（soft 时按过渡退回）；one(n) 只播拍 n；play()；reset()。opt.board() 给出 board 层的根节点。 */
(function(){
const NS = window.SNSims = window.SNSims || {};
if (NS['r13/sync-r13']) return;
const W = 834, H = 1194, ACCENT = '#3F529F', INK = '#292D38';
// iPad mini 竖放：屏 240×365（1488×2266 的比例），黑边 11，离框右边 30、下边 46；屏里谱页左右各留 4%
const SW = 240, SHt = Math.round(SW*2266/1488), BZ = 11, DW = SW + 2*BZ, DH = SHt + 2*BZ, DR = 30, DB = 46;
const PW = SW*.92, PH = PW*1839/1300, PL = (SW - PW)/2, PT = (SHt - PH)/2;
const src = document.currentScript && document.currentScript.src;
const P1 = src ? new URL('../assets/k545-p1.jpg', src).href : 'components/assets/k545-p1.jpg';
const glass = 'background:rgba(255,255,255,.92);box-shadow:0 1px 2px rgba(0,0,0,.07),0 3px 10px -4px rgba(41,45,56,.16),inset 0 0 0 .5px rgba(0,0,0,.07)';
// SF Symbols 的简画：arrow.triangle.2.circlepath、ipad.and.iphone
const IC = {
  sync: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M19.2 10.2A7.4 7.4 0 0 0 6 6.9L4.6 8.6"/><path d="M4.4 4.6v4.2h4.2"/><path d="M4.8 13.8A7.4 7.4 0 0 0 18 17.1l1.4-1.7"/><path d="M19.6 19.4v-4.2h-4.2"/></svg>',
  dev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><rect x="2.4" y="3.6" width="13.2" height="16.8" rx="2.2"/><rect x="14.2" y="9.2" width="7.4" height="11.6" rx="1.8" fill="#fff"/><path d="M17.1 18.6h1.6" stroke-linecap="round"/></svg>'
};
const CSS = `
.sns-sync{position:relative;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Helvetica Neue",sans-serif;color:${INK};-webkit-font-smoothing:antialiased;user-select:none;-webkit-user-select:none}
.sns-sync .y-stage{position:absolute;left:0;top:0;width:${W}px;height:${H}px;transform-origin:0 0}
.sns-sync .y-pill{position:absolute;left:50%;top:15px;height:44px;min-width:130px;box-sizing:border-box;padding:0 16px;border-radius:22px;${glass};display:grid;place-items:center;
  translate:-50% 0;transform-origin:50% 0;scale:var(--ms,1);opacity:0;transform:translateY(-10px) scale(.92);transition:opacity .35s ease,transform .35s cubic-bezier(.3,.8,.2,1)}
.sns-sync.s-pill .y-pill{opacity:1;transform:none}
.sns-sync .y-pill>span{grid-area:1/1;display:flex;align-items:center;gap:9px;white-space:nowrap;font-weight:500;font-size:15px;line-height:1.2;opacity:0;transition:opacity .2s}
.sns-sync .y-pill>span.on{opacity:1}
.sns-sync .y-pill svg{width:22px;height:22px;flex:none}
.sns-sync.s-spin .y-pill .c1 svg{animation:sySpin 1.1s linear infinite}
@keyframes sySpin{to{transform:rotate(360deg)}}
.sns-sync .y-dev{position:absolute;left:${W - DR - DW}px;width:${DW}px;height:${DH}px;box-sizing:border-box;padding:${BZ}px;border-radius:26px;background:#1C1C1E;
  box-shadow:0 0 0 1.5px #3A3A3C inset,0 22px 48px -10px rgba(41,45,56,.38),0 6px 14px rgba(41,45,56,.14);opacity:0;transform:translateX(70px);transition:opacity .45s ease,transform .6s cubic-bezier(.2,.8,.2,1)}
.sns-sync.s-dev .y-dev{opacity:1;transform:none}
.sns-sync .y-scr{position:relative;width:${SW}px;height:${SHt}px;border-radius:15px;background:#fff;overflow:hidden}
.sns-sync .y-scr img,.sns-sync .y-scr canvas{position:absolute;left:${PL.toFixed(2)}px;top:${PT.toFixed(2)}px;width:${PW.toFixed(2)}px;height:${PH.toFixed(2)}px}
.sns-sync .y-scr canvas{mix-blend-mode:multiply;opacity:0;transition:opacity .5s ease}
.sns-sync.s-ink .y-scr canvas{opacity:1}
.sns-sync.s-now .y-pill,.sns-sync.s-now .y-pill>span,.sns-sync.s-now .y-dev,.sns-sync.s-now .y-scr canvas{transition:none!important}
`;
(function inject(){
  if (document.getElementById('sns-r13-sync-css')) return;
  const s = document.createElement('style'); s.id = 'sns-r13-sync-css'; s.textContent = CSS;
  (document.head || document.documentElement).appendChild(s);
})();
const RM = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches), CANCEL = {};
const snT = (s, v) => window.snT ? window.snT(s, v) : s.replace(/\{(\w+)\}/g, (m, k) => v && k in v ? v[k] : m);

NS['r13/sync-r13'] = function(root, opt){
  opt = opt || {};
  root.classList.add('sns-sync');
  root.innerHTML = `<div class="y-stage">
    <div class="y-pill" role="status"><span class="c1 on">${IC.sync}<span>${snT('Syncing…')}</span></span><span class="c2">${IC.dev}<span>${snT('Also open on {d}', {d: 'iPad mini'})}</span></span></div>
    <div class="y-dev" aria-hidden="true"><div class="y-scr"><img src="${P1}" alt="" draggable="false"><canvas></canvas></div></div></div>`;
  const stage = root.querySelector('.y-stage'), dev = root.querySelector('.y-dev'), cv = root.querySelector('canvas');
  const c1 = root.querySelector('.c1'), c2 = root.querySelector('.c2');
  function layout(){
    const w = root.clientWidth; if (!w) return;
    stage.style.transform = `scale(${w/W})`;
    root.style.setProperty('--ms', w/W < .5 ? 1.45 : 1);
    const fh = root.clientHeight ? Math.round(W*root.clientHeight/w) : H;
    dev.style.top = (fh - DB - DH) + 'px';
  }
  const ro = new ResizeObserver(layout); ro.observe(root); layout();

  // 笔迹：从 board 的笔迹画布按谱页那一块拷到小屏上（画布按框宽 834 缩放，谱页在 x=24、宽 786）
  function paint(){
    const b = opt.board?.(); if (!b) return;
    const ink = b.querySelector('canvas.k-ink'), pg = b.querySelector('img.k-page');
    if (!ink || !ink.width) return;
    const s = ink.width/W, top = parseFloat(pg?.style.top) || 41, pw = 786, ph = 786*1839/1300;
    cv.width = Math.round(PW*2); cv.height = Math.round(PH*2);
    const g = cv.getContext('2d'); g.clearRect(0, 0, cv.width, cv.height);
    g.drawImage(ink, 24*s, top*s, pw*s, ph*s, 0, 0, cv.width, cv.height);
  }
  const END = [{pill: 0, dev: 0, ink: 0, msg: 1}, {pill: 0, dev: 1, ink: 1, msg: 1}, {pill: 1, dev: 1, ink: 1, msg: 2}];
  function show(e){
    root.classList.toggle('s-pill', !!e.pill); root.classList.toggle('s-dev', !!e.dev); root.classList.toggle('s-ink', !!e.ink);
    c1.classList.toggle('on', e.msg === 1); c2.classList.toggle('on', e.msg === 2);
    root.classList.remove('s-spin');
  }
  const DUR = [0, 2700, 2200];
  let tok = null, cur = 0, done = true, t0 = 0;
  async function run(n, t){
    const wait = ms => new Promise(r => setTimeout(r, ms)).then(() => { if (t.dead) throw CANCEL; });
    if (n === 1){
      paint(); c1.classList.add('on'); c2.classList.remove('on');
      await wait(200); root.classList.add('s-pill', 's-spin');
      await wait(250); root.classList.add('s-dev');
      await wait(1050); paint(); root.classList.add('s-ink');
      await wait(700); root.classList.remove('s-pill');
      await wait(400); root.classList.remove('s-spin'); await wait(100);
    } else if (n === 2){
      await wait(250); c1.classList.remove('on'); c2.classList.add('on'); root.classList.add('s-pill');
      await wait(1950);
    }
  }
  function stop(){ if (tok){ tok.dead = true; tok = null; } }
  function snap(n, soft){
    stop(); paint();
    if (soft){ show(END[n]); return; }
    root.classList.add('s-now'); show(END[n]); void root.offsetWidth; requestAnimationFrame(() => root.classList.remove('s-now'));
  }
  function go(n, animate, only, soft){
    n = Math.max(0, Math.min(2, n|0));
    if (!animate || RM || n === 0){ snap(n, soft); cur = n; done = true; return; }
    snap(n - 1);
    const t = tok = {dead: false};
    (async () => {
      for (let k = n; k <= (only ? n : 2); k++){
        cur = k; done = false; t0 = performance.now();
        try { await run(k, t); } catch(e){ if (e === CANCEL) return; throw e; }
        if (t.dead) return;
      }
      done = true; if (tok === t) tok = null;
    })();
  }
  const onDown = () => { if (tok){ snap(cur); done = true; } };
  root.addEventListener('pointerdown', onDown);
  return {
    beats: 2,
    get beatNow(){ return cur; }, get busy(){ return !!tok; },
    get beatFrac(){ if (done || !tok) return cur ? 1 : 0; return Math.min(1, (performance.now() - t0)/DUR[cur]); },
    play(){ go(RM ? 2 : 1, true); },
    go(n){ go(n, true); },
    one(n){ go(n, true, true); },
    beat(n, soft){ go(n, false, false, soft); },
    reset(){ go(0, false); },
    visible(on){ if (!on && tok){ snap(cur); done = true; } },
    destroy(){ stop(); ro.disconnect(); root.removeEventListener('pointerdown', onDown); root.innerHTML = ''; }
  };
};
})();
