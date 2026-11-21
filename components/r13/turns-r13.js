/* 一张谱 r13 用的 turns 副本（components/turns.js、r12 副本都不改）：叠在阅读器的竖屏谱页上，和下面 board 的第 1 页严丝合缝。
   原组件的舞台 600×580、谱页卡片 410 宽不动，整块按 786/410 放大对到阅读器谱页（24, 41, 786×1112，框单位 834 宽）；超出框的部分被框裁掉。
   卡片透明、第 1 页透明（露出 board 的谱和笔迹），其他页白底盖住整页。K. 545 三个乐章合在一份 8 页的 PDF 里（Allegro 第 1 页、Andante 第 4 页、Rondo 第 7 页）。
   拍 1：手指按住底部页码胶囊横向拖，胶囊上方的卡片显示目标页真实缩略图、乐章名和页码，拖到第 6 页再拖回第 3 页，松手才翻过去；
   拍 2：轻点胶囊，数字面板从胶囊里长出来，按 2，Go 变蓝，按 Go，面板收回，到第 2 页；
   拍 3：点底栏「2. Andante »」，到第 4 页，Andante 开头那行字用强调蓝渐入、停一下、渐出；
   拍 4：从 K. 545 第 4 页点上一首到 K. 331 第 1 页，拖到末页，再翻进 K. 545 第 1 页；两端是 K. 331 和 Op. 111。
   拍 5（Show measure numbers）：收起跨谱胶囊，胶囊加宽成等宽两半「Page 1 / 8 | Bar 1 / 73」；
   拍 6（Jump to a bar）：点 Bar 那一半，面板切成小节输入，按 3、3、Go，到第 2 页，第 33 小节闪一下（进跟谱只往回翻一页）。 */
(function(){
const NS = window.SNSims = window.SNSims || {};
if (NS['r13/turns-r13']) return;

const W = 600, H = 580, PX = (W-410)/2, N = 8, LAST = 6;
// 对到阅读器谱页：卡片 410 → 786 框单位，卡片左上角落在 (24, 41)
const R = 786/410, OX = 24 - PX*R, FW = 834;
const INK = '#292D38', ACCENT = '#3F529F';
const base = (()=>{ const c = document.currentScript && document.currentScript.src; return c ? new URL('../../assets/turns/', c).href : 'assets/turns/'; })();
const cAssets = (()=>{ const c = document.currentScript && document.currentScript.src; return c ? new URL('../assets/', c).href : 'components/assets/'; })();
// 8 页都是 1878 年 Breitkopf & Härtel 旧版莫扎特全集（Serie 20 N° 15，公有领域）的 K. 545，按 1000×1414 渲染（assets/turns/p1–p8、缩略图 t1–t8）
const PAGES = [1,2,3,4,5,6,7,8], THUMBS = [1,2,3,4,5,6,7,8];
const MOV = ['1. Allegro','2. Andante','3. Rondo: Allegretto'], MSTART = [1,4,7];
const mvOf = p => p >= 7 ? 2 : p >= 4 ? 1 : 0;
// 多语言：界面字查 i18n-r13.js，照 App 的 Page / Bar / 跨谱按钮译法
const T = (s, v) => window.snT ? snT(s, v) : s.replace(/\{(\w+)\}/g, (m, k) => v && k in v ? v[k] : m);
// 每页第一小节和本乐章小节总数（照谱面核过）
const BAR = {1:[1,73],2:[25,73],3:[50,73],4:[1,74],5:[25,74],6:[48,74],7:[1,73],8:[38,73]};
// 胶囊：单项 92 宽，页码加小节两项 146 宽，高度不变
const PW1 = 92, PW2 = 146, PY = H-30, PH = 22, INSET = 11;
// 13 寸 iPad 上顶部和底部的条封顶 1.12 倍，窗口系数 1.235，相对谱页是 11 寸的 0.907（App UIScale.swift）
const CS = 0.907;
// 顶栏、底栏贴框（框单位）：App 顶栏在安全区 24 下面 4，底栏贴着底部安全区 20 的上沿（ReaderChrome、ReaderSizing.Bottom.bottomInset = 0），13 寸的 pt 除以 1.235
const TOPF = (24 + 4*1.12)/1.235, BOTF = 20/1.235;
// 翻页过场：App 的 UIPageViewController（.scroll，横向，页间距 12），一页连页间距整页滑过去；舞台单位
const SLIDE = (FW + 12/1.235)/R, SLIDE_MS = 340, REST_MS = 90;
// Allegro 第 33 小节在第 2 页第三行开头
const B33 = {x:71.5, y:451.5, w:295.8, h:125.5};
// Andante 那行字在第 4 页左上
const AND = {x:178, y:107, w:112, h:31};

const gl = b => `<svg viewBox="0 0 24 24" fill="none" stroke="${INK}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="${b?'M12 6l-6 6 6 6M19 6l-6 6 6 6':'M5 6l6 6-6 6M12 6l6 6-6 6'}"/></svg>`;
// SF Symbols backward.end / forward.end（照 ReaderChrome.scoreButton）
const endGl = b => `<svg viewBox="0 0 24 24" fill="${INK}" stroke="${INK}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${b
  ? '<path d="M5.5 6.2v11.6"/><path d="M18.2 6.6v10.8L9.6 12z"/>'
  : '<path d="M18.5 6.2v11.6"/><path d="M5.8 6.6v10.8L14.4 12z"/>'}</svg>`;
const chev = b => `<svg viewBox="0 0 24 24" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="${b?'M14.5 6l-6 6 6 6':'M9.5 6l6 6-6 6'}"/></svg>`;
const goArrow = '<svg viewBox="0 0 27 22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11h20M15.5 3.5 23 11l-7.5 7.5"/></svg>';
const bksp = '<svg viewBox="0 0 20 17"><path fill="currentColor" d="M6.3 1h11a2.2 2.2 0 0 1 2.2 2.2v10.6A2.2 2.2 0 0 1 17.3 16h-11a1.6 1.6 0 0 1-1.2-.5L.6 9.6a1.6 1.6 0 0 1 0-2.2l4.5-5.9A1.6 1.6 0 0 1 6.3 1Zm3.4 4.6a.8.8 0 0 0-1.1 1.1l1.8 1.8-1.8 1.8a.8.8 0 1 0 1.1 1.1l1.8-1.8 1.8 1.8a.8.8 0 1 0 1.1-1.1l-1.8-1.8 1.8-1.8a.8.8 0 1 0-1.1-1.1l-1.8 1.8Z"/></svg>';

const glass = 'background:rgba(255,255,255,.92);box-shadow:0 1px 2px rgba(0,0,0,.07),0 3px 10px -4px rgba(41,45,56,.16),inset 0 0 0 .5px rgba(0,0,0,.07)';
const pc = (v, d) => (v/d*100).toFixed(3) + '%';
const CSS = `
.sns-turns{position:relative;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Helvetica Neue",sans-serif;color:${INK};-webkit-font-smoothing:antialiased;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
.sns-turns .t-stage{position:absolute;left:0;top:0;width:${W}px;height:${H}px;transform-origin:0 0}
/* 卡片就是阅读器的谱页：透明、不加阴影圆角，第 1 页透出下面 board 的谱和笔迹 */
.sns-turns .t-card{position:absolute;left:${PX}px;top:0;width:410px;height:${H}px;overflow:hidden;background:none}
.sns-turns .t-card .pg{position:absolute;inset:0;background:#fff center top/100% auto no-repeat;opacity:0;transition:opacity .22s ease}
.sns-turns .t-card .pg.p1{background:none}
.sns-turns .t-card .pg.on{opacity:1}
/* 跳到乐章开头：Andante 那行字强调蓝渐入、停、渐出；跳到小节：那一小节同样闪一下 */
.sns-turns .tfl,.sns-turns .bfl{position:absolute;border-radius:3px;background:rgba(63,82,159,.2);box-shadow:inset 0 0 0 1px rgba(63,82,159,.75);opacity:0;pointer-events:none}
.sns-turns .tfl{left:${pc(AND.x,1300)};top:${pc(AND.y,1839)};width:${pc(AND.w,1300)};height:${pc(AND.h,1839)}}
.sns-turns .bfl{left:${pc(B33.x,1000)};top:${pc(B33.y,1414)};width:${pc(B33.w,1000)};height:${pc(B33.h,1414)};background:rgba(63,82,159,.12)}
.sns-turns .tfl.go,.sns-turns .bfl.go{animation:trnFl 2.3s .25s ease both}
@keyframes trnFl{0%{opacity:0}18%{opacity:1}62%{opacity:1}100%{opacity:0}}
.sns-turns .ttl{position:absolute;left:50%;top:8px;height:22px;display:grid;place-items:center;padding:0 11px;border-radius:11px;${glass};white-space:nowrap;text-align:center;z-index:2;pointer-events:none}
.sns-turns .ttl>span{grid-area:1/1;font-size:7.2px;line-height:1.12;opacity:0;transition:opacity .2s}
.sns-turns .ttl>span.on{opacity:1}
.sns-turns .ttl small{display:block;font-size:5.9px;color:#8C919B}
/* 底栏 */
.sns-turns .t-stage>.bar>*{position:absolute;top:${PY}px;height:${PH}px;cursor:pointer;transition:left .45s cubic-bezier(.3,.8,.2,1),right .45s cubic-bezier(.3,.8,.2,1),width .45s cubic-bezier(.3,.8,.2,1),max-width .45s cubic-bezier(.3,.8,.2,1),opacity .2s}
.sns-turns .tpill{display:flex;align-items:center;border-radius:11px;${glass};font-size:8.5px;color:#646A75;overflow:hidden;z-index:2;touch-action:none}
.sns-turns .tpill .h{flex:1 1 0;min-width:0;display:flex;align-items:center;justify-content:center;gap:5px;white-space:nowrap;transition:opacity .25s}
.sns-turns .tpill .h.br{flex-grow:0;max-width:0;opacity:0;overflow:hidden;transition:flex-grow .45s cubic-bezier(.3,.8,.2,1),max-width .45s cubic-bezier(.3,.8,.2,1),opacity .3s}
.sns-turns.bars .tpill .h.br{flex-grow:1;max-width:100px;opacity:1;transition-delay:0s,0s,.15s}
.sns-turns .tpill .dv{flex:none;width:.5px;height:11px;background:rgba(41,45,56,.16);opacity:0;transition:opacity .3s}
.sns-turns.bars .tpill .dv{opacity:1}
.sns-turns .pn{padding:2px 5px;border-radius:4px;background:#EDEDEF;color:${INK};font-variant-numeric:tabular-nums}
.sns-turns .tpill>i{position:absolute;left:0;bottom:0;height:1.5px;width:0;background:${ACCENT}}
.sns-turns .tpill>i.ease{transition:width .3s ease}
.sns-turns .cv{width:22px;border-radius:11px;${glass};display:grid;place-items:center}
.sns-turns .cv svg{width:10px;height:10px}
.sns-turns .mv,.sns-turns .sc{display:flex;align-items:center;gap:4px;padding:0 9px;border-radius:11px;${glass};font-size:8.5px;white-space:nowrap;box-sizing:border-box}
.sns-turns .mv span,.sns-turns .sc span{min-width:0;overflow:hidden;text-overflow:ellipsis}
.sns-turns .mv svg,.sns-turns .sc svg{flex:none;width:8px;height:8px}
.sns-turns .mv.press{animation:trnGlass .5s ease both}
.sns-turns .sc.press{animation:trnScoreHl .65s cubic-bezier(.2,.7,.2,1) both}
@keyframes trnGlass{35%{transform:scale(1.08);background:#fff;box-shadow:0 2px 9px rgba(41,45,56,.2),inset 0 0 0 .5px rgba(0,0,0,.06)}}
@keyframes trnScoreHl{35%{transform:scale(1.07);background:#fff;box-shadow:0 0 0 1.5px rgba(63,82,159,.45),0 4px 12px rgba(63,82,159,.22)}65%{transform:scale(1.07);background:#fff;box-shadow:0 0 0 1.5px rgba(63,82,159,.4),0 4px 12px rgba(63,82,159,.18)}100%{transform:none}}
.sns-turns .t-stage>.bar .off{opacity:0;pointer-events:none}
.sns-turns.padon .tpill{opacity:0}
/* 拖动预览：真实缩略图、乐章名、页码，固定在胶囊上方，不跟手指走，不加阴影 */
.sns-turns .th{position:absolute;bottom:calc(${H-PY-PH+6}px + ${(PH*CS).toFixed(2)}px*var(--bs,1));width:${(92+6.6).toFixed(1)}px;padding:3.3px;box-sizing:border-box;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:2.75px;border-radius:4.4px;background:#fff;box-shadow:inset 0 0 0 .75px rgba(41,45,56,.16);font-size:6.6px;font-weight:500;line-height:1.25;opacity:0;pointer-events:none;transition:left .45s cubic-bezier(.3,.8,.2,1),opacity .12s;z-index:3}
.sns-turns .th.on{opacity:1}
.sns-turns .th .im{position:relative;width:92px;height:123px}
.sns-turns .th .im>div{position:absolute;inset:0;background:center/contain no-repeat;opacity:0}
.sns-turns .th .im>div.on{opacity:1}
.sns-turns .th b{font-weight:500;font-variant-numeric:tabular-nums}
/* 页码输入：从胶囊里长出来（App 的 PageJumpPad，按 App 尺寸的一半画）；--tps 是阅读器框小时额外放大，保证字看得清 */
.sns-turns .pad{position:absolute;top:${PY+PH-143}px;width:157px;height:143px;transform-origin:50% 100%;transform:scale(calc(${(PW1/157).toFixed(3)}*var(--bs,1)/var(--tps,1)),calc(${(PH/143).toFixed(3)}*var(--bs,1)/var(--tps,1)));opacity:0;pointer-events:none;transition:left .45s cubic-bezier(.3,.8,.2,1),transform .38s cubic-bezier(.2,.8,.2,1),opacity .16s;z-index:4}
.sns-turns.padon .pad{transform:none;opacity:1;pointer-events:auto}
.sns-turns .pad .row{display:flex;gap:4.5px;height:22px}
.sns-turns .pad .fld{flex:1;display:flex;align-items:center;padding-left:3.5px;border-radius:11px;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.07),0 3px 10px -4px rgba(41,45,56,.16),inset 0 0 0 .5px rgba(0,0,0,.07)}
.sns-turns .pad .chip{width:43px;height:15px;border-radius:7.5px;display:grid;place-items:center;background:rgba(118,118,128,.12);font-size:6.5px}
.sns-turns .pad .ty{margin-left:7px;font-size:9.5px;font-weight:500;font-variant-numeric:tabular-nums}
.sns-turns .pad .go{width:38px;border-radius:11px;${glass};display:grid;place-items:center;color:rgba(63,82,159,.4);cursor:pointer;transition:background .2s,color .2s}
.sns-turns .pad .go svg{width:13.5px;height:11px}
.sns-turns .pad .go.ok{background:${ACCENT};color:#fff}
.sns-turns .pad .tcap{height:9px;padding-right:40.6px;text-align:right;font-size:6px;line-height:9px;font-variant-numeric:tabular-nums}
.sns-turns .pad .kp{height:112px;box-sizing:border-box;padding:9.4px 4.1px 8.2px;border-radius:12.9px;background:#EFEFEF;box-shadow:0 1px 2px rgba(0,0,0,.06),0 8px 24px -8px rgba(41,45,56,.22),inset 0 0 0 .5px rgba(0,0,0,.06);display:grid;grid-template-columns:repeat(3,1fr);grid-auto-rows:22px;gap:2.34px}
.sns-turns .pad .k{display:grid;place-items:center;border-radius:3.1px;background:rgba(252,252,252,.95);font-size:9.4px;font-variant-numeric:tabular-nums;cursor:pointer;transition:background .12s}
.sns-turns .pad .k.hit{background:#E0E2E8}
.sns-turns .pad .k.e{background:none;cursor:default}
.sns-turns .pad .k.bk{background:none;opacity:.35}
.sns-turns .pad .k.bk svg{width:10px;height:8.5px}
/* 点按提示：样子全在 dot-r13.css（.snd），这里只管显隐和按下 */
.sns-turns .snd{left:0;top:0;opacity:0;transition:opacity .25s,transform .12s}
.sns-turns.now *{transition:none!important;animation:none!important}
.sns-turns .t-stage>.bar{transform:scale(calc(${CS}*var(--bs,1)));transform-origin:${W/2}px ${PY+PH}px}
.sns-turns .th,.sns-turns .pad{scale:calc(${CS}*var(--tps,1));transform-origin:50% 100%}
.sns-turns .th{transform-origin:0 100%}
.sns-turns .ttl{scale:calc(${CS}*var(--tts,1));transform-origin:50% 0}
/* 手机（框窄）：底栏和顶栏都放大 1.25 倍，乐章钮与跨谱钮均只留圆形图标；平时隐藏翻页圆钮，但 K. 331 末页保留下一页圆钮 > 供点按翻入下一首 */
.sns-turns.nar .t-stage>.bar .cv{opacity:0;pointer-events:none}
.sns-turns.nar.k331 .t-stage>.bar .cv.nx:not(.off){opacity:1;pointer-events:auto}
.sns-turns.nar .mv,.sns-turns.nar .sc{width:22px;padding:0;justify-content:center}
.sns-turns.nar .mv span,.sns-turns.nar .sc span{display:none}
.sns-turns .sc.ico{width:22px;padding:0;justify-content:center}
.sns-turns .sc.ico span{display:none}
/* 顶栏、底栏（连胶囊上方的缩略图、数字面板）挪到贴框的上下沿：--ty、--by 由 layout() 按框高算，舞台单位 */
.sns-turns .ttl{translate:-50% var(--ty,0px)}
.sns-turns .ttl,.sns-turns .t-stage>.bar{transition:translate .28s cubic-bezier(.2,.7,.2,1)}
.sns-turns.chrome-off .ttl{translate:-50% calc(var(--ty,0px) - 65px)}
.sns-turns.chrome-off .t-stage>.bar{translate:0 calc(var(--by,0px) + 65px)}
.sns-turns.prev-tap .t-stage>.bar .cv.pv:not(.off){opacity:1;z-index:3}
.sns-turns .sc.pv,.sns-turns .sc.nx{transition-property:left,right,width,max-width,opacity,translate}
.sns-turns .sc.pv.off{translate:-22px 0}
.sns-turns .sc.nx.off{translate:22px 0}
.sns-turns .t-card .pg.scrub-flash{animation:trnScrub .24s ease}
@keyframes trnScrub{50%{filter:brightness(.91)}}
.sns-turns .t-stage>.bar,.sns-turns .th,.sns-turns .pad{translate:0 var(--by,0px)}
/* 翻页过场：页外垫一层白（App 翻页时页与页之间的底），卡片不裁，页的透明度不过渡 */
.sns-turns>.bk{position:absolute;inset:0;background:#fff;visibility:hidden}
.sns-turns.roll>.bk{visibility:visible}
.sns-turns.roll .t-card{overflow:visible}
.sns-turns.roll .t-card .pg{transition:none}
.sns-turns .tpill .h.br.hit{background:rgba(63,82,159,.14);border-radius:9px}
.sns-turns .pad .chip.bm{background:rgba(63,82,159,.14);color:${ACCENT};font-weight:600}
`;
(function inject(){
  if (document.getElementById('sns-r13-turns-css')) return;
  const s = document.createElement('style'); s.id = 'sns-r13-turns-css'; s.textContent = CSS;
  (document.head || document.documentElement).appendChild(s);
})();

const reduced = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

NS['r13/turns-r13'] = function(root, opts){
  const baseSlide = opts && opts.base;
  root.classList.add('sns-turns');
  root.innerHTML = '';
  const RM = reduced();
  const tK545 = () => T('Piano Sonata No. 16 in C Major, K. 545');
  const tK331 = () => T('Piano Sonata No. 11 in A Major, K. 331');
  const tOp111 = () => T('Piano Sonata No. 32 in C Minor, Op. 111');
  const TTL = i => `${MOV[i]} · ${tK545()}<small>${T('Wolfgang Amadeus Mozart')} · 1756 – 1791</small>`;
  const TTL331 = movement => `${T(movement)} · ${tK331()}<small>${T('Wolfgang Amadeus Mozart')} · 1756 – 1791</small>`;
  const KEYS = [1,2,3,4,5,6,7,8,9].map(n=>`<span class="k" data-k="${n}">${n}</span>`).join('') + `<span class="k e"></span><span class="k" data-k="0">0</span><span class="k bk">${bksp}</span>`;
  root.innerHTML = `<i class="bk"></i><div class="t-stage">
    <div class="t-card">${PAGES.map(p=>`<div class="pg${p===1?' p1':''}" data-p="${p}"${p===1?'':` style="background-image:url(${base}p${p}.jpg)"`}></div>`).join('')}<div class="pg k331s" data-p="k331s" style="background-image:url(${cAssets}k331-start.jpg)"></div><div class="pg k331" data-p="k331" style="background-image:url(${cAssets}k331-end.jpg)"></div><i class="tfl"></i><i class="bfl"></i></div>
    <div class="ttl">${MOV.map((m,i)=>`<span data-m="${i}">${TTL(i)}</span>`).join('')}<span data-m="k331s">${TTL331('1. Andante grazioso')}</span><span data-m="k331">${TTL331('3. Alla Turca: Allegretto')}</span></div>
    <div class="bar">
      <div class="sc pv">${endGl(1)}<span></span></div>
      <div class="mv tpr">${gl(1)}<span></span></div>
      <div class="cv pv">${chev(1)}</div>
      <div class="tpill"><span class="h pg"><span class="lb">${T('Page')}</span><span class="pn"></span></span><span class="dv"></span><span class="h br"><span class="lb">${T('Bar')}</span><span class="pn"></span></span><i></i></div>
      <div class="cv nx">${chev(0)}</div>
      <div class="mv nx"><span></span>${gl(0)}</div>
      <div class="sc nx"><span></span>${endGl(0)}</div>
    </div>
    <div class="th"><div class="im">${THUMBS.map(p=>`<div data-p="${p}" style="background-image:url(${base}t${p}.jpg)"></div>`).join('')}</div><span class="mt"></span><b></b></div>
    <div class="pad"><div class="row"><div class="fld"><span class="chip">${T('Page')}</span><span class="ty"></span></div><div class="go">${goArrow}</div></div><div class="tcap">/ ${N}</div><div class="kp">${KEYS}</div></div>
    <div class="snd"></div>
  </div>`;
  const $ = s => root.querySelector(s);
  const stage = $('.t-stage'), tpill = $('.tpill'), line = $('.tpill>i'), touch = $('.snd');
  const pgs = [...root.querySelectorAll('.t-card .pg')], pgK331 = $('.pg.k331'), pgK331s = $('.pg.k331s'), pg1 = $('.pg.p1'), ttls = [...root.querySelectorAll('.ttl>span')];
  const scPv = $('.sc.pv'), scNx = $('.sc.nx'), mvPr = $('.mv.tpr'), mvNx = $('.mv.nx'), cvPv = $('.cv.pv'), cvNx = $('.cv.nx');
  const th = $('.th'), thIm = [...root.querySelectorAll('.th .im>div')], tfl = $('.tfl'), bfl = $('.bfl'), ty = $('.pad .ty'), goB = $('.pad .go');
  const pnPg = $('.h.pg .pn'), pnBr = $('.h.br .pn'), brH = $('.h.br'), chip = $('.pad .chip'), tcap = $('.pad .tcap'), pad = $('.pad'), bk = $('.bk');

  /* state */
  const fresh = () => ({page:1, disp:1, total:N, k331:false, playlist:false, frac:null, thumb:0, pad:false, typed:'', bars:false, bar:null, pmode:'page'});
  let st = fresh();
  let PC = W/2, drag = null, movedAt = 0;
  const widths = new Map();
  const ruler = document.createElement('span');
  ruler.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;font-size:8.5px';
  ruler.setAttribute('aria-hidden', 'true'); root.appendChild(ruler);
  const vis = x => W/2 + (x - W/2)*CS*bs;
  const measureCap = name => {
    if (!widths.has(name)){
      ruler.textContent = name;
      widths.set(name, parseFloat(getComputedStyle(ruler).width) + 30);
    }
    return widths.get(name);
  };
  const movement = (el, i) => {
    const name = i >= 0 ? MOV[i] : '', span = el.querySelector('span');
    span.textContent = name;
    for (const attr of ['aria-label', 'title']){
      if (name) el.setAttribute(attr, name); else el.removeAttribute(attr);
    }
    if (!name) return 0;
    if (nar) return 22;
    return measureCap(name);
  };
  const setScoreCap = (el, title, prev, maxW, edgeProp, edgeVal) => {
    const span = el.querySelector('span');
    span.textContent = title || '';
    const lb = title ? T(prev ? 'Previous score: {title}' : 'Next score: {title}', {title}) : '';
    for (const attr of ['aria-label', 'title']){
      if (lb) el.setAttribute(attr, lb); else el.removeAttribute(attr);
    }
    el.classList.toggle('off', !title || st.pad);
    el.style[edgeProp] = edgeVal + 'px';
    if (!title) return;
    if (nar || maxW < 54){
      el.classList.add('ico');
      el.style.maxWidth = '22px';
    } else {
      el.classList.remove('ico');
      el.style.maxWidth = Math.min(measureCap(title), maxW).toFixed(1) + 'px';
    }
  };

  function render(){
    const is331 = !!st.k331;
    const tot = is331 ? 12 : (st.total || N);
    const p = st.pv || st.page, m = is331 ? -1 : mvOf(p), pw = st.bars ? PW2 : PW1;
    const prev = is331 ? -1 : (p > MSTART[m] ? m : m - 1), next = is331 ? -1 : (m + 1 < MOV.length ? m + 1 : -1);
    const canPrev = p > 1;
    // FR-004：自建文件夹曲目单存在下一首时，K. 331 末页的下一页圆钮 > 保持可用
    const canNext = is331 ? true : p < tot;
    const hasPr = prev >= 0, hasNx = next >= 0;
    const hasCvP = !nar && canPrev, hasCvN = (!nar || is331) && canNext;
    // 按这一页可见的整组居中；手机留 8 框单位
    const hw = nar ? (FW/2/R - 8)/(CS*bs) : W/2 - PX - 4, gap = nar ? 5 : 31;
    let wPr = movement(mvPr, prev), wNx = movement(mvNx, next);
    let Lx = hasPr ? gap + wPr : (hasCvP ? 27 : 0), Rx = hasNx ? gap + wNx : (hasCvN ? 27 : 0);
    const excess = Lx + pw + Rx - 2*hw;
    if (excess > 0){
      if (wPr > wNx) wPr = Math.max(40, wPr - excess); else wNx = Math.max(40, wPr < wNx ? wNx - excess : wNx - excess);
      Lx = hasPr ? gap + wPr : (hasCvP ? 27 : 0); Rx = hasNx ? gap + wNx : (hasCvN ? 27 : 0);
    }
    if (!(st.thumb || drag || st.pad)){
      const pc = W/2 + (Lx - Rx)/2;
      if (pc !== PC){ PC = pc; movedAt = performance.now(); }
    }
    const L = PC - pw/2, R2 = PC + pw/2;
    root.classList.toggle('bars', st.bars); root.classList.toggle('padon', st.pad); root.classList.toggle('k331', is331);
    pgs.forEach(el => {
      const dp = el.dataset.p;
      el.classList.toggle('on', is331 ? dp === (st.page === 1 ? 'k331s' : 'k331') : +dp === st.page);
    });
    ttls.forEach(el => {
      const dm = el.dataset.m;
      el.classList.toggle('on', is331 ? dm === (st.page === 1 ? 'k331s' : 'k331') : +dm === m);
    });
    // 胶囊
    Object.assign(tpill.style, {left:L+'px', width:pw+'px'});
    pnPg.textContent = `${st.disp} / ${tot}`;
    const b = BAR[p] || BAR[1]; pnBr.textContent = `${st.bar || b[0]} / ${b[1]}`;
    line.style.width = (st.frac === null ? pw*p/tot : INSET + st.frac*(pw-2*INSET)) + 'px';
    // 翻页圆钮
    cvPv.style.left = (L-5-22)+'px'; cvNx.style.left = (R2+5)+'px';
    cvPv.classList.toggle('off', !canPrev || st.pad); cvNx.classList.toggle('off', !canNext || st.pad);
    // 跳乐章胶囊
    const tpr = W - (L - gap), nx = R2 + gap;
    Object.assign(mvPr.style, {right:tpr+'px', maxWidth:wPr+'px'});
    Object.assign(mvNx.style, {left:nx+'px', maxWidth:wNx+'px'});
    mvPr.classList.toggle('off', prev < 0 || st.pad); mvNx.classList.toggle('off', next < 0 || st.pad);
    mvPr._to = prev >= 0 ? MSTART[prev] : 0; mvNx._to = next >= 0 ? MSTART[next] : 0;
    // 最左、最右跨谱液态玻璃胶囊（贴框外沿，与内侧按钮至少留 7px 间距，绝不重叠）
    const barHalf = (FW/2 - (nar ? 14 : 16)) / (R * CS * bs);
    const edge = W/2 - barHalf;
    const innerL = hasPr ? (L - gap - wPr) : hasCvP ? (L - 5 - 22) : L;
    const innerR = hasNx ? (R2 + gap + wNx) : hasCvN ? (R2 + 5 + 22) : R2;
    const maxScL = Math.max(0, innerL - (W/2 - barHalf) - 7);
    const maxScR = Math.max(0, (W/2 + barHalf) - innerR - 7);
    const pvTitle = st.playlist ? (is331 ? '' : tK331()) : '';
    const nxTitle = st.playlist ? (is331 ? tK545() : tOp111()) : '';
    setScoreCap(scPv, pvTitle, true, maxScL, 'left', edge);
    setScoreCap(scNx, nxTitle, false, maxScR, 'right', edge);
    // 拖动预览
    th.style.left = vis(PC) + 'px';
    th.classList.toggle('on', !!st.thumb);
    if (st.thumb){
      thIm.forEach(el=>el.classList.toggle('on', +el.dataset.p === st.thumb));
      th.querySelector('.mt').textContent = MOV[mvOf(st.thumb)];
      th.querySelector('b').textContent = `${st.thumb} / ${N}`;
    }
    // 数字面板
    pad.style.left = (vis(PC) - 78.5) + 'px';
    ty.textContent = st.typed; goB.classList.toggle('ok', !!st.typed);
    chip.textContent = T(st.pmode === 'bar' ? 'Bar' : 'Page'); chip.classList.toggle('bm', st.pmode === 'bar');
    tcap.textContent = st.pmode === 'bar' ? `/ ${(BAR[p] || BAR[1])[1]}` : `/ ${N}`;
    $('.pad .k.bk').style.opacity = st.typed ? 1 : '';
  }

  // 整块对到阅读器谱页
  let sc = 1, by = 0, bs = 1, nar = false;
  function layout(){
    const w = root.clientWidth; if (!w) return;
    const s = w/FW, fh = root.clientHeight ? Math.round(FW*root.clientHeight/w) : 1194, oy = Math.max(16, (fh - 786*1839/1300)/2); sc = R*s;
    stage.style.transform = `translate(${OX*s}px,${oy*s}px) scale(${sc})`;
    by = (fh - BOTF - oy)/R - (PY + PH);
    root.style.setProperty('--ty', ((TOPF - oy)/R - 8).toFixed(2) + 'px');
    root.style.setProperty('--by', by.toFixed(2) + 'px');
    root.style.setProperty('--tps', Math.max(1, .85/s).toFixed(3));
    nar = s < .5; bs = nar ? 1.25 : 1;
    root.classList.toggle('nar', nar);
    root.style.setProperty('--bs', bs); root.style.setProperty('--tts', nar ? 1.25 : 1);
    const du = parseFloat(getComputedStyle(root).getPropertyValue('--dotu')) || Math.max(18, 30*s)/s;
    touch.style.setProperty('--dotu', (du/R).toFixed(2) + 'px');
    render();
  }
  const ro = new ResizeObserver(layout); ro.observe(root);
  layout();
  document.fonts.ready.then(() => { widths.clear(); layout(); });

  /* ---------- scripted beats ---------- */
  const CANCEL = {};
  const DUR = [0, 5800, 5050, 4650, 8500, 2900, 6400];
  let tok = null, cur = 0, t0 = 0, done = false, tp = null, rolling = null;
  const center = el => { const sr = stage.getBoundingClientRect(), r = el.getBoundingClientRect(), k = sr.width/W || 1; return [(r.left+r.width/2-sr.left)/k, (r.top+r.height/2-sr.top)/k]; };
  function place(){ if (!tp) return; touch.style.left = tp[0] + 'px'; touch.style.top = tp[1] + 'px'; touch.style.transform = touch._down ? 'scale(.75)' : ''; }
  const rip = () => { touch.classList.remove('rip'); void touch.offsetWidth; touch.classList.add('rip'); };
  const down = on => { touch._down = on; if (on) rip(); place(); };
  const xFor = (pg, total = N) => PC - PW1/2 + INSET + (pg-1)/(total-1)*(PW1-2*INSET);
  const vy = () => PY + PH - PH/2*CS*bs;
  const pulseScore = el => { el.classList.remove('press'); void el.offsetWidth; el.classList.add('press'); };

  async function run(n, t){
    const chk = ()=>{ if (t.dead) throw CANCEL; };
    const wait = ms => new Promise(r=>setTimeout(r, ms)).then(chk);
    const ease = p => p<.5 ? 2*p*p : 1-Math.pow(-2*p+2,2)/2;
    const tween = (ms, fn) => new Promise((res, rej)=>{ const a = performance.now();
      (function f(now){ if (t.dead) return rej(CANCEL); const p = Math.min(1,(now-a)/ms); fn(p); p<1 ? requestAnimationFrame(f) : res(); })(a); });
    const moveTo = (q, ms) => { const a = tp || [q[0]+60, q[1]+90]; touch.style.opacity = 1; return tween(ms||480, p=>{ const e = ease(p); tp = [a[0]+(q[0]-a[0])*e, a[1]+(q[1]-a[1])*e]; place(); }); };
    const press = async ()=>{ down(true); await wait(130); down(false); };
    const tapOn = async (el, fn, ms) => {
      const remaining = 460 - (performance.now() - movedAt);
      if (remaining > 0) await wait(remaining);
      await moveTo(center(el), ms); await press(); fn();
    };
    const lift = async ()=>{ touch.style.opacity = 0; await wait(280); tp = null; };
    const hitKey = d => { const k = $(`.pad .k[data-k="${d}"]`); k.classList.add('hit'); setTimeout(()=>k.classList.remove('hit'), 160); st.typed += d; render(); };
    const scrubTo = (x0, x1, ms, total = N) => tween(ms, p=>{
      const x = x0 + (x1-x0)*(1-Math.cos(Math.PI*p))/2; tp = [vis(x), vy() + by]; place();
      const f = Math.min(1, Math.max(0, (x - (PC-PW1/2+INSET)) / (PW1-2*INSET)));
      const pg = Math.round(f*(total-1)) + 1;
      st.frac = f; st.disp = pg; st.thumb = st.k331 ? 0 : pg; render();
    });
    if (n===1){
      root.classList.add('chrome-off');
      await wait(160);
      await moveTo([W/2, H/2], 430); await press();
      root.classList.remove('chrome-off');
      await wait(280);
      await moveTo([vis(xFor(1)), vy() + by], 420);
      down(true); line.classList.remove('ease');
      st.frac = 0; st.disp = 1; st.thumb = 1; render();
      await wait(300);
      await scrubTo(xFor(1), xFor(6), 1300);
      await wait(450);
      await scrubTo(xFor(6), xFor(3), 600);
      await wait(450);
      down(false); line.classList.add('ease');
      st.page = 3; st.disp = 3; st.frac = null; st.thumb = 0; render();
      await wait(250); await lift();
      await wait(100);
    } else if (n===2){
      await wait(350);
      await tapOn(tpill, ()=>{ st.pad = true; render(); }, 560);
      await wait(650);
      await tapOn($('.pad .k[data-k="2"]'), ()=>hitKey('2'), 520);
      await wait(600);
      await tapOn(goB, ()=>{ st.pad = false; st.typed = ''; st.page = 2; st.disp = 2; render(); }, 460);
      await wait(250); await lift();
      await wait(250);
    } else if (n===3){
      await wait(350);
      await tapOn(mvNx, ()=>{
        mvNx.classList.remove('press'); void mvNx.offsetWidth; mvNx.classList.add('press');
        setTimeout(()=>{ if (t.dead) return; st.page = 4; st.disp = 4; render(); tfl.classList.remove('go'); void tfl.offsetWidth; tfl.classList.add('go'); }, 180);
      }, 620);
      await wait(250); await lift();
      await wait(2100);
    } else if (n===4){
      st.playlist = true; render();
      await wait(420);
      await tapOn(scPv, () => pulseScore(scPv), 530);
      tfl.classList.remove('go');
      const cross = async (from, to, dir, next) => {
        root.classList.add('roll');
        const put = (el, x) => {
          el.style.transform = `translateX(${x}px)`;
          if (el === pg1 && baseSlide) baseSlide(x*sc);
        };
        put(to, -dir*SLIDE); to.classList.add('on');
        await tween(SLIDE_MS, q => {
          const e = ease(q);
          put(from, dir*SLIDE*e); put(to, dir*SLIDE*(e - 1));
          if (to === pg1) bk.style.transform = `translateX(${dir*SLIDE*e*sc}px)`;
        });
        st = next; render();
        from.style.transform = to.style.transform = bk.style.transform = '';
        if (baseSlide) baseSlide(0);
        root.classList.remove('roll');
      };
      await cross(pgOf(4), pgK331s, 1, {...fresh(), k331:true, playlist:true, total:12});
      await wait(410);
      await moveTo([vis(xFor(1, 12)), vy() + by], 490);
      down(true); line.classList.remove('ease');
      st.frac = 0; render();
      await scrubTo(xFor(1, 12), xFor(12, 12), 1300, 12);
      down(false); line.classList.add('ease');
      st.page = st.disp = 12; st.frac = null; render();
      pgK331.classList.add('scrub-flash');
      await wait(490);
      pgK331.classList.remove('scrub-flash');
      await tapOn(cvNx, () => {}, 440);
      await cross(pgK331, pg1, -1, {...fresh(), playlist:true});
      await wait(160); await lift();
      await wait(240);
      pulseScore(scPv);
      await wait(850);
      pulseScore(scNx);
      await wait(950);
    } else if (n===5){
      // 拍 5（bar1）：已在 K. 545 第 1 页，收起左右跨谱胶囊后直接展开 Page 1 / 8 | Bar 1 / 73
      await wait(260);
      st.playlist = false; render();
      await wait(380);
      st.bars = true; st.bar = 1; render();
      await wait(1600);
    } else if (n===6){
      await wait(300);
      await tapOn(brH, ()=>{ brH.classList.add('hit'); setTimeout(()=>brH.classList.remove('hit'), 220); st.pmode = 'bar'; st.pad = true; render(); }, 560);
      await wait(500);
      await tapOn($('.pad .k[data-k="3"]'), ()=>hitKey('3'), 420);
      await tapOn($('.pad .k[data-k="3"]'), ()=>hitKey('3'), 420);
      await wait(300);
      await tapOn(goB, ()=>{
        st.pad = false; st.typed = ''; st.page = 2; st.disp = 2; st.bar = 33; render();
        setTimeout(()=>{ if (t.dead) return; bfl.classList.remove('go'); void bfl.offsetWidth; bfl.classList.add('go'); }, 180);
      }, 460);
      await wait(250); await lift();
      await wait(2300);
    }
  }
  // end state of each beat
  function stateAt(n){
    const s = fresh();
    if (n>=1){ s.page = s.disp = 3; }
    if (n>=2){ s.page = s.disp = 2; }
    if (n>=3){ s.page = s.disp = 4; }
    if (n>=4){ s.page = s.disp = 1; s.playlist = true; }
    if (n>=5){ s.page = s.disp = 1; s.playlist = false; s.bars = true; s.bar = 1; }
    if (n>=6){ s.page = s.disp = 2; s.playlist = false; s.bars = true; s.bar = 33; s.pmode = 'bar'; }
    return s;
  }
  function stop(){
    if (tok){ tok.dead = true; tok = null; }
    if (rolling){ const r = rolling; rolling = null; r.res(false); unroll(r); }
    root.classList.remove('roll', 'chrome-off');
    prevTap?.cancel();
    pgK331.classList.remove('scrub-flash');
    pgs.forEach(el => el.style.transform = ''); bk.style.transform = '';
    if (baseSlide) baseSlide(0);
    scPv.classList.remove('press'); scNx.classList.remove('press');
    touch.style.opacity = 0; touch._down = false; tp = null;
  }
  // soft：不切掉过渡，面板、胶囊按动画退回
  function snap(n, soft){
    stop(); st = stateAt(n);
    tfl.classList.remove('go'); bfl.classList.remove('go'); mvNx.classList.remove('press'); mvPr.classList.remove('press'); line.classList.add('ease');
    if (soft){ render(); return; }
    root.classList.add('now'); render();
    void root.offsetWidth; requestAnimationFrame(()=>root.classList.remove('now'));
  }
  function go(n, animate, only, soft){
    n = Math.max(0, Math.min(LAST, n|0));
    if (rolling && animate && !RM && n){ rolling.next = n; rolling.only = only; return; }
    if (!animate || RM || n===0){ snap(n, soft); cur = n; done = true; return; }
    snap(n-1);
    const t = tok = {dead:false};
    (async ()=>{
      for (let k=n; k<=(only ? n : LAST); k++){
        cur = k; done = false; t0 = performance.now();
        try { await run(k, t); } catch(e){ if (e===CANCEL) return; throw e; }
        if (t.dead) return;
      }
      done = true; if (tok===t) tok = null;
    })();
  }

  /* ---------- 翻页过场：从这一页照 App 一页页横着滑到第 to 页，胶囊上的页码、小节跟着数 ---------- */
  const pgOf = p => pgs.find(el => +el.dataset.p === p);
  function unroll(r){
    root.classList.remove('roll');
    pgs.forEach(el => el.style.transform = ''); bk.style.transform = '';
    if (r.base) r.base(0);
  }
  let prevTap = null;
  async function tapPrevious(){
    root.classList.add('prev-tap');
    const [x, y] = center(cvPv);
    tp = [x, y]; place(); rip();
    const a = prevTap = touch.animate([
      {opacity:0, transform:'translate(36px,-32px)'},
      {opacity:1, transform:'translate(0,0)', offset:.62},
      {opacity:1, transform:'scale(.75)', offset:.82},
      {opacity:0, transform:'scale(1)'}
    ], {duration:460, easing:'ease-out'});
    try { await a.finished; return true; }
    catch { return false; }
    finally { if (prevTap === a){ prevTap = null; root.classList.remove('prev-tap'); } }
  }
  function roll(to, baseB, delay, end, tapBack = false){
    const t = tok = {dead:false}, r = rolling = {to, base: baseB || baseSlide, end, next:0, only:false};
    const done1 = new Promise(res => r.res = res);
    root.classList.add('roll'); tfl.classList.remove('go'); bfl.classList.remove('go');
    const put = (pg, x, w1) => {
      if (pg === 1){ if (r.base) r.base(x*sc); return; }
      pgOf(pg).style.transform = x ? `translateX(${x}px)` : '';
      if (w1) bk.style.transform = x ? `translateX(${x*sc}px)` : '';
    };
    const ease = q => q<.5 ? 2*q*q : 1-Math.pow(-2*q+2,2)/2;
    const wait = ms => new Promise(res => setTimeout(res, ms)).then(() => { if (t.dead) throw CANCEL; });
    const tween = (ms, fn) => new Promise((res, rej) => { const a = performance.now();
      (function f(now){ if (t.dead) return rej(CANCEL); const q = Math.min(1, (now-a)/ms); fn(q); q<1 ? requestAnimationFrame(f) : res(); })(a); });
    (async () => {
      await wait(delay);
      if (st.k331){ st.k331 = false; st.page = st.disp = 1; st.total = N; render(); }
      while (st.page !== to){
        const a = st.page, d = to < a ? 1 : -1, b = PAGES[PAGES.indexOf(a) - d], w1 = a === 1 || b === 1;
        if (tapBack && !await tapPrevious()) throw CANCEL;
        put(b, -d*SLIDE, w1); pgOf(b).classList.add('on');
        await tween(SLIDE_MS, q => { const e = ease(q); put(a, d*SLIDE*e, w1); put(b, d*SLIDE*(e - 1), w1); });
        st.page = st.disp = b; st.bar = null; render();
        put(a, 0, false);
        if (b !== to) await wait(REST_MS);
      }
      if (end) st = end;
      render(); void root.offsetWidth; rolling = null; unroll(r); if (tok === t) tok = null;
      r.res(true);
      if (r.next) go(r.next, true, r.only);
    })().catch(e => { if (e !== CANCEL) throw e; });
    return done1;
  }
  function finish(){
    const r = rolling; if (!r) return;
    r.res(true); stop();
    if (r.next){ snap(r.next); cur = r.next; done = true; return; }
    if (r.end) st = r.end; else { st.k331 = false; st.total = N; st.page = st.disp = r.to; st.bar = null; }
    root.classList.add('now'); render(); void root.offsetWidth; requestAnimationFrame(()=>root.classList.remove('now'));
  }
  function leave(baseB){
    stop(); done = true;
    Object.assign(st, {k331:false, total:N, pad:false, typed:'', thumb:0, frac:null}); line.classList.add('ease'); render();
    return st.page === 1 ? Promise.resolve(true) : roll(1, baseB || baseSlide, 180, null, true);
  }
  function fol(p){
    stop(); done = true; cur = 0;
    const was = st.bars;
    st = {...fresh(), bars:true, disp:p, pv:p > 1 ? p : 0};
    line.classList.add('ease');
    if (was){ render(); return; }
    root.classList.add('now'); render(); void root.offsetWidth; requestAnimationFrame(()=>root.classList.remove('now'));
  }
  function enter(n, baseB){
    n = Math.max(0, Math.min(LAST, n|0));
    snap(n); cur = n; done = true;
    const end = st; st = {...end, k331:false, total:N, page:1, disp:1, bar:null}; render();
    return end.page === 1 ? Promise.resolve(true) : roll(end.page, baseB || baseSlide, 380, end);
  }

  /* ---------- 用户自己玩 ---------- */
  const near = p => PAGES.reduce((m, q) => Math.abs(q - p) < Math.abs(m - p) || (Math.abs(q - p) === Math.abs(m - p) && q > m) ? q : m, PAGES[0]);
  const toStage = e => { const sr = stage.getBoundingClientRect(), k = sr.width/W || 1; return [(e.clientX - sr.left)/k, (e.clientY - sr.top)/k]; };
  const fingerAt = (e, on) => { tp = toStage(e); touch.style.opacity = on ? 1 : 0; place(); };
  function turnTo(p, flash){
    if (!PAGES.includes(p)) return;
    st.k331 = false; st.total = N;
    st.page = st.disp = p; st.frac = null; st.thumb = 0; st.bar = null; render();
    if (flash){ tfl.classList.remove('go'); void tfl.offsetWidth; tfl.classList.add('go'); }
  }
  function jump(){
    const v = parseInt(st.typed, 10); st.typed = ''; st.pad = false;
    if (!v){ render(); return; }
    if (st.pmode === 'bar'){
      const m = mvOf(st.page), tot = (BAR[st.page] || BAR[1])[1], b = Math.min(tot, v);
      const cand = PAGES.filter(p => mvOf(p) === m && BAR[p][0] <= b);
      const p = cand.length ? cand[cand.length - 1] : st.page;
      st.k331 = false; st.total = N;
      st.page = st.disp = p; st.bar = b; st.frac = null; render();
      if (p === 2 && b === 33){ bfl.classList.remove('go'); void bfl.offsetWidth; bfl.classList.add('go'); }
      return;
    }
    turnTo(near(Math.min(N, v)));
    render();
  }
  root.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    if (rolling) return;
    if (tok){ snap(cur); done = true; }
    const t = e.target, inPad = t.closest('.pad');
    if (st.pad){
      if (!inPad){ st.pad = false; st.typed = ''; render(); return; }
      const k = t.closest('.k');
      fingerAt(e, true); down(true);
      if (k && k.dataset.k != null && st.typed.length < 2){ k.classList.add('hit'); setTimeout(()=>k.classList.remove('hit'), 160); st.typed += k.dataset.k; render(); }
      else if (k && k.classList.contains('bk')){ st.typed = st.typed.slice(0, -1); render(); }
      else if (t.closest('.go') && st.typed) jump();
      return;
    }
    if (t.closest('.tpill')){
      e.preventDefault();
      const [x] = toStage(e), pw = st.bars ? PW2 : PW1;
      drag = {x0:x, moved:false, bar: st.bars && t.closest('.h.br'), pw, id:e.pointerId};
      try { tpill.setPointerCapture(e.pointerId); } catch(_){}
      fingerAt(e, true); down(true);
      return;
    }
    const scB = t.closest('.sc');
    if (scB && !scB.classList.contains('off')){
      fingerAt(e, true); down(true); pulseScore(scB);
      if (scB === scPv && !st.k331){ st.k331 = true; st.page = st.disp = 1; st.total = 12; render(); }
      else if (scB === scNx && st.k331){ st.k331 = false; st.page = st.disp = 1; st.total = N; render(); }
      return;
    }
    const mv = t.closest('.mv'), cv = t.closest('.cv');
    if (mv || cv){ fingerAt(e, true); down(true); }
    if (mv && mv._to){ mv.classList.remove('press'); void mv.offsetWidth; mv.classList.add('press'); if (PAGES.includes(mv._to)) setTimeout(()=>turnTo(mv._to, mv === mvNx), 180); }
    else if (cv){
      if (st.k331){
        if (cv === cvNx && st.page === 12){ st.k331 = false; st.total = N; st.page = st.disp = 1; }
        else st.page = st.disp = cv === cvNx ? 12 : 1;
        render(); return;
      }
      const p = st.page, nxt = cv === cvNx ? PAGES.find(q => q > p) : [...PAGES].reverse().find(q => q < p);
      if (nxt) turnTo(nxt);
    }
  });
  tpill.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    const [x] = toStage(e); fingerAt(e, true); touch.style.transform = 'scale(.75)';
    const ux = W/2 + (x - W/2)/(CS*bs), ux0 = W/2 + (drag.x0 - W/2)/(CS*bs);
    if (!drag.moved && Math.abs(ux - ux0) < 3) return;
    drag.moved = true; line.classList.remove('ease');
    const L = PC - drag.pw/2 + INSET, f = Math.min(1, Math.max(0, (ux - L)/(drag.pw - 2*INSET)));
    const pg = Math.round(f*(st.total-1)) + 1;
    st.frac = f; st.disp = pg; st.thumb = st.k331 ? 0 : pg; render();
  });
  const endDrag = e => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag; drag = null; down(false); touch.style.opacity = 0;
    line.classList.add('ease');
    if (st.k331){
      st.page = st.disp = st.disp < 7 ? 1 : 12; st.frac = null; render(); return;
    }
    if (d.moved){ turnTo(near(st.disp)); render(); return; }
    st.pmode = d.bar ? 'bar' : 'page'; st.pad = true; st.typed = ''; render();
  };
  tpill.addEventListener('pointerup', endDrag); tpill.addEventListener('pointercancel', endDrag);
  root.addEventListener('pointerup', () => { if (!drag && !tok){ down(false); touch.style.opacity = 0; } });

  return {
    beats: LAST,
    get beatNow(){ return cur; }, get busy(){ return !!tok; },
    get beatFrac(){ if (done || !tok) return cur ? 1 : 0; return Math.min(1, (performance.now()-t0)/DUR[cur]); },
    play(){ go(RM ? LAST : 1, true); },
    go(n){ go(n, true); },
    one(n){ go(n, true, true); },
    beat(n, soft){ go(n, false, false, soft); },
    reset(){ go(0, false); },
    leave, enter, finish, fol, tapPrevious,
    visible(on){ if (on) return; if (rolling) finish(); else if (tok){ snap(cur); done = true; } },
    destroy(){ stop(); ro.disconnect(); root.innerHTML = ''; }
  };
};
})();
