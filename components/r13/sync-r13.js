/* 一张谱 r18 云同步章「上课写下，回家就在」（状态类名都带 s- 前缀：网页本身有 .pill 样式，撞名会把这一层压成一条蓝边）：叠在阅读器的竖屏谱页上（框单位 834 宽），透明，底下 board 的 K. 545 第 1 页和四色笔迹照旧露着。
   三拍，一个钢琴学生的一天（小谭 2026-11-16 选「A 上课到回家」）：
   拍 1 课上写下：Apple Pencil 在谱页左上角空白处用紫色蜡笔写「♩=80」，写完抬笔离开。App 收起画笔时静默上传（PDFReaderView 里没有上传提示），所以这一拍不出任何胶囊；
   拍 2 回家打开：谱页蒙上一层白，另一台 iPad mini 从下面升到中间，屏上是 StaffNotes 图书馆（Mozart 文件夹已打开，照导入章最后一拍的样子），手指点 K. 545，谱子从卡片放大成阅读器，四色笔迹和刚写的「♩=80」都已经在页上；
   拍 3 两台同时开着：iPad mini 缩到右下角，白色蒙层退掉，大 iPad 顶上的胶囊亮起「Also open on iPad mini」（照 App ReaderStatusPill / presenceLine），
         Pencil 在 iPad mini 上第 18 小节上方画一个减弱记号「>」，抬笔后大 iPad 同一处随即出现同一个记号。设备名 iPad mini 是样例。
   位置都按 K. 545 1878 年旧版全集第 1 页（1300 宽的谱页像素）量好，不压音符和文字：「♩=80」在 x 181–404、y 104–199，「>」在 x 150–440、y 1193–1241，用最细一档蜡笔（2.5 点），粗了两条边会糊成一块。
   接口和其他层一样：beat(n, soft) 直接摆拍 n 终态（soft 时按过渡退回）；one(n) 只播拍 n；play()；reset()。opt.board() 给出 board 层的根节点。 */
(function(){
const NS = window.SNSims = window.SNSims || {};
if (NS['r13/sync-r13']) return;
const W = 834, H = 1194, INK = '#292D38', PURPLE = 4;
const src = document.currentScript && document.currentScript.src;
const A = src ? new URL('../assets/', src).href : 'components/assets/';
// 谱页：board 上是 x=24、宽 786；这一层的笔迹画布都用「谱页单位」（谱页左上角为原点，786 宽），1300 宽的谱页像素乘 PU 换过来
const PW = 786, PHu = PW*1839/1300, PU = PW/1300;
// 另一台 iPad mini（竖放）：屏 520×792（1488×2266 的比例），黑边 24；大的时候居中，小的时候缩成一半停在右下角
const SWB = 520, SHB = Math.round(SWB*2266/1488), BZ = 24, DW = SWB + 2*BZ, DH = SHB + 2*BZ, SR = 16, BIGS = 1.15, SS = .5, DR = 26, DB = 40;
// 屏里是 App：744×1133 pt（iPad mini 竖屏），整体缩 AS 塞进屏
const AW = 744, AH = 1133, AS = SWB/AW;
// App 阅读器里的谱页：和大 iPad 一样左右留边（786/834），上下居中
const RW = AW*PW/W, RH = RW*1839/1300, RX = (AW - RW)/2, RY = (AH - RH)/2;
// 图书馆：照 story-r13 的卡片（LibraryCardMetrics 145:205），按 625 宽排四列，整体放大 LS 铺满 744 宽
const LS = AW/625, X0 = 20, GAP = 15, CW = 134.8, CH = 190, SCW = 136, SCH = 192, R1 = 92, R2 = R1 + CH + 30, R3 = 620;
const colX = c => X0 + c*(CW + GAP);
// K. 545 卡片在 App 里的位置（pt）和放大前阅读器要缩到多小
const KX = colX(1)*LS, KY = R2*LS, KS = SCW*LS/RW, KR = 5*LS/KS;
const glass = 'background:rgba(255,255,255,.92);box-shadow:0 1px 2px rgba(0,0,0,.07),0 3px 10px -4px rgba(41,45,56,.16),inset 0 0 0 .5px rgba(0,0,0,.07)';
// SF Symbols ipad.and.iphone 的简画
const DEV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><rect x="2.4" y="3.6" width="13.2" height="16.8" rx="2.2"/><rect x="14.2" y="9.2" width="7.4" height="11.6" rx="1.8" fill="#fff"/><path d="M17.1 18.6h1.6" stroke-linecap="round"/></svg>';
const CSS = `
.sns-sync{position:relative;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Helvetica Neue",sans-serif;color:${INK};-webkit-font-smoothing:antialiased;user-select:none;-webkit-user-select:none}
.sns-sync .y-stage{position:absolute;left:0;top:0;width:${W}px;height:${H}px;transform-origin:0 0}
.sns-sync .y-cv{position:absolute;z-index:1;display:block;pointer-events:none;opacity:0;transition:opacity .45s ease}
.sns-sync.s-tempo .y-cv.t,.sns-sync.s-hp .y-cv.h{opacity:1}
.sns-sync .y-scrim{position:absolute;inset:0;z-index:3;background:rgba(255,255,255,.86);opacity:0;transition:opacity .45s ease}
.sns-sync.s-scrim .y-scrim{opacity:1}
.sns-sync .y-pill{position:absolute;z-index:6;left:50%;top:15px;height:44px;min-width:130px;box-sizing:border-box;padding:0 16px;border-radius:22px;${glass};display:flex;align-items:center;justify-content:center;gap:9px;white-space:nowrap;font-weight:500;font-size:15px;line-height:1.2;
  translate:-50% 0;transform-origin:50% 0;scale:var(--ms,1);opacity:0;transform:translateY(-10px) scale(.92);transition:opacity .35s ease,transform .35s cubic-bezier(.3,.8,.2,1)}
.sns-sync.s-pill .y-pill{opacity:1;transform:none}
.sns-sync .y-pill svg{width:22px;height:22px;flex:none}
/* Pencil：照 board-r13 的 .k-touch.pen（笔尖在元素的点上，笔身往右上 30° 斜出去） */
.sns-sync .y-pen{position:absolute;z-index:5;left:0;top:0;width:6px;height:6px;margin:-3px 0 0 -3px;border-radius:50%;background:#3a3d46;filter:drop-shadow(0 5px 7px rgba(41,45,56,.22));pointer-events:none;
  opacity:0;transition:opacity .25s,translate .35s cubic-bezier(.3,.8,.2,1)}
.sns-sync .y-pen::before,.sns-sync .y-pen::after{content:"";position:absolute;left:-4px;width:14px;transform:rotate(30deg)}
.sns-sync .y-pen::before{bottom:3px;height:26px;transform-origin:50% 100%;clip-path:polygon(50% 100%,0 0,100% 0);background:linear-gradient(0deg,#3a3d46 0 16%,#f4f4f6 16%,#e4e5e9)}
.sns-sync .y-pen::after{bottom:29px;height:150px;border-radius:7px 7px 1px 1px;transform-origin:50% calc(100% + 26px);background:linear-gradient(90deg,#fff,#f3f3f5 55%,#dcdde2)}
.sns-sync .y-pen.on{opacity:1}
.sns-sync .y-pen.up{translate:10px -17px}
/* 另一台 iPad：位置和大小由 --bx --by --bs（大）、--sx --sy --ss（小）给出 */
.sns-sync .y-dev{position:absolute;z-index:4;left:0;top:0;width:${DW}px;height:${DH}px;box-sizing:border-box;border-radius:${SR + BZ}px;background:#1C1C1E;transform-origin:0 0;
  box-shadow:0 0 0 3px #3A3A3C inset,0 44px 96px -20px rgba(41,45,56,.38),0 12px 28px rgba(41,45,56,.14);
  opacity:0;transform:translate(var(--bx),calc(var(--by) + 70px)) scale(var(--bs));transition:transform .7s cubic-bezier(.25,.8,.2,1),opacity .45s ease}
.sns-sync.s-dev .y-dev{opacity:1;transform:translate(var(--bx),var(--by)) scale(var(--bs))}
.sns-sync.s-dev.s-small .y-dev{transform:translate(var(--sx),var(--sy)) scale(var(--ss))}
.sns-sync .y-scr{position:absolute;left:${BZ}px;top:${BZ}px;width:${SWB}px;height:${SHB}px;border-radius:${SR}px;background:#fff;overflow:hidden}
.sns-sync .y-app{position:absolute;left:0;top:0;width:${AW}px;height:${AH}px;transform:scale(${AS});transform-origin:0 0;background:#fff;
  font-family:"Timeless Sans",-apple-system,system-ui,sans-serif;color:${INK};letter-spacing:-.01em}
.sns-sync .y-app *{box-sizing:border-box;margin:0;padding:0}
.sns-sync .y-lib{position:absolute;left:0;top:0;width:625px;height:${(AH/LS).toFixed(1)}px;transform:scale(${LS});transform-origin:0 0;transition:opacity .35s ease}
.sns-sync.s-open .y-lib{opacity:0;transition-delay:.08s}
.sns-sync .y-hd{position:absolute;left:${X0 + 2}px;font-size:21px;display:flex;align-items:baseline;gap:9px;white-space:nowrap}
.sns-sync .y-hd small{font-size:13px;color:#8C919B}
.sns-sync .y-it{position:absolute;width:${CW}px;height:${CH}px}
.sns-sync .y-it .bp{position:absolute;left:34%;top:5%;width:62%;height:90%;border-radius:10px;background:#E6E6E8;opacity:0}
.sns-sync .y-it .pv{position:absolute;left:30%;top:8%;width:66%;height:84%;border-radius:4px;background:#fff center top/cover no-repeat;box-shadow:0 1px 2px rgba(0,0,0,.08)}
.sns-sync .y-it .cv{position:absolute;left:0;top:0;width:90%;height:100%;border-radius:10px;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.05),0 6px 14px -6px rgba(23,27,36,.12);overflow:hidden;transform-origin:50% 60%}
.sns-sync .y-it.mz .cv{width:80%;transform:rotate(-2.5deg)}
.sns-sync .y-it.mz .bp{opacity:1}
.sns-sync .y-it.mz .pv{opacity:0}
.sns-sync .y-it .dots{position:absolute;z-index:2;left:11px;top:4px;font-size:16px;letter-spacing:1px}
.sns-sync .y-it .n{position:absolute;z-index:2;right:12px;top:7px;font-size:14.4px;color:#646A75;font-variant-numeric:tabular-nums}
.sns-sync .y-it .ic{position:absolute;left:30%;top:31%;width:40%;height:24%;background:${INK};-webkit-mask:center/contain no-repeat;mask:center/contain no-repeat}
.sns-sync .y-it .av{position:absolute;left:6%;top:9%;width:88%;height:62%;background:#fff center bottom/contain no-repeat}
.sns-sync .y-it .t{position:absolute;left:12px;right:8px;bottom:14px;font:16.1px/1.08 var(--serif,"Timeless Serif",Georgia,serif)}
.sns-sync .y-it .t small{display:block;font:11px "Timeless Sans",sans-serif;color:#646A75;margin-bottom:3px}
.sns-sync .y-it .t .f{display:block;font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:1px}
.sns-sync .y-it .t .z{font-size:18px}
.sns-sync .y-sc{position:absolute;width:${SCW}px}
.sns-sync .y-sc .th{height:${SCH}px;border-radius:5px;background:#fff center top/cover no-repeat;box-shadow:0 1px 2px rgba(0,0,0,.08),0 6px 14px -6px rgba(23,27,36,.14)}
.sns-sync .y-sc p{margin-top:7px;font-size:11.5px;line-height:1.25}
.sns-sync .y-sc p small{display:block;font-size:10.5px;color:#8C919B;margin-top:2px}
.sns-sync.s-open .y-sc.k .th{opacity:0}
/* 点开 K. 545：阅读器从卡片的位置和大小放大成整屏（照 story-r13 拍 7 的 .rd） */
.sns-sync .y-rd{position:absolute;left:${RX.toFixed(2)}px;top:${RY.toFixed(2)}px;width:${RW.toFixed(2)}px;height:${RH.toFixed(2)}px;overflow:hidden;background:#fff;transform-origin:0 0;
  border-radius:${KR.toFixed(1)}px;opacity:0;transform:translate(${(KX - RX).toFixed(2)}px,${(KY - RY).toFixed(2)}px) scale(${KS.toFixed(4)});
  transition:transform .65s cubic-bezier(.3,.75,.15,1),border-radius .65s cubic-bezier(.3,.75,.15,1),opacity .12s linear .5s}
.sns-sync.s-open .y-rd{opacity:1;transform:none;border-radius:0;transition-delay:0s}
.sns-sync .y-rd img,.sns-sync .y-rd canvas{position:absolute;left:0;top:0;width:100%;height:100%;display:block}
.sns-sync .y-rd canvas{mix-blend-mode:multiply}
.sns-sync .y-tap{opacity:0;transition:opacity .25s,transform .12s}
.sns-sync .y-tap.on{opacity:1}
.sns-sync .y-tap.dn{transform:scale(.75)}
.sns-sync.s-now *,.sns-sync.s-now *::before,.sns-sync.s-now *::after{transition:none!important}
`;
(function inject(){
  if (document.getElementById('sns-r13-sync-css')) return;
  const s = document.createElement('style'); s.id = 'sns-r13-sync-css'; s.textContent = CSS;
  (document.head || document.documentElement).appendChild(s);
})();
const RM = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches), CANCEL = {};
const snT = (s, v) => window.snT ? window.snT(s, v) : s.replace(/\{(\w+)\}/g, (m, k) => v && k in v ? v[k] : m);

/* ---------- 两处新笔迹（谱页像素 → 谱页单位） ---------- */
// 「♩=80」：符头是一圈往里收的螺旋（涂实），符干朝上，等号两横，8 和 0 照手写；整组往右斜一点（x += (196 − y)·0.14）
const D8 = 'M8.4 2.6 C8 0.2 1.8 0 1.8 2.6 C1.8 5 8.8 5.2 8.8 7.6 C8.8 10.4 1.2 10.4 1.2 7.6 C1.2 5.2 8.4 5 8.4 2.6';
const D0 = 'M5.6 0.4 C2 0 0.6 3.4 0.8 5.6 C1 8.4 2.6 10 5 10 C7.8 10 9.4 7.6 9.2 4.8 C9 2 7.6 0.2 5.2 0.3 C4.4 0.4 3.8 0.9 3.6 1.4';
function tempoStrokes(K){
  const slant = p => [((p[0] + (196 - p[1])*.14))*PU, p[1]*PU];
  const head = Array.from({length: 41}, (_, i) => {
    const t = i/40, a = t*2.1*Math.PI*2, r = 1 - .78*t, th = -.38;
    const x = 17*r*Math.cos(a), y = 11.5*r*Math.sin(a);
    return [198 + x*Math.cos(th) - y*Math.sin(th), 182 + x*Math.sin(th) + y*Math.cos(th)];
  });
  const glyph = (d, x, y, w, h) => K.sample(d, 0, 0, 1).map(([a, b]) => [x + a*w/10, y + b*h/10]);
  return [head, K.sample('M214 176 L215 104', 0, 0, 1), K.sample('M240 147 L276 145', 0, 0, 1), K.sample('M241 165 L277 163', 0, 0, 1),
    glyph(D8, 296, 112, 40, 84), glyph(D0, 350, 112, 42, 84)].map(pts => pts.map(slant));
}
const TMS = [300, 170, 110, 110, 430, 380];   // 每一笔写多久（ms），笔与笔之间移笔 140
// 「>」：第 18 小节上方一笔画成，拐角处点要密，否则 trace 的二次曲线会把尖角磨圆；开口 48 是为了细笔两条边在小屏上也分得开
function hairpin(){
  const P = [[150, 1193], [440, 1217], [150, 1241]], out = [P[0]];
  for (let s = 0; s < 2; s++) for (let i = 1; i <= 24; i++){ const t = i/24; out.push([P[s][0] + (P[s+1][0] - P[s][0])*t, P[s][1] + (P[s+1][1] - P[s][1])*t]); }
  return out.map(p => [p[0]*PU, p[1]*PU]);
}

/* ---------- 图书馆（照 story-r13 拍 6 终态：Mozart 文件夹已打开，三份 K. 545 / K. 331 排在右边） ---------- */
function library(){
  const cmps = [['bach', 'Johann Sebastian', 'Bach', 3, 'th-Chopin_Nocturne_Op9_No1.jpg'], ['beethoven', 'Ludwig van', 'Beethoven', 3, 'op111-annot.jpg'],
    ['chopin', 'Frédéric', 'Chopin', 4, 'th-Chopin_Nocturne_Op9_No1.jpg'], ['haydn', 'Joseph', 'Haydn', 2, 'th-Schumann_Melodie_Op68_No1.jpg']];
  const pers = [['Baroque', '1600 – 1750', 'baroque', 3, 'th-Schumann_Melodie_Op68_No1.jpg'], ['Classical', '1750 – 1820', 'classical', 5, 'k331-p1.jpg'],
    ['Romantic', '1820 – 1900', 'romantic', 13, 'op111-annot.jpg'], ['Modern', '1900 – 1945', 'early20', 6, 'th-Debussy_Feux_dartifice.jpg']];
  const card = (x, y, n, pv, body, mz) => `<div class="y-it${mz ? ' mz' : ''}" style="left:${x.toFixed(1)}px;top:${y}px"><div class="bp"></div><div class="pv" style="background-image:url(${A}${pv})"></div><div class="cv"><div class="dots">···</div><div class="n">${n}</div>${body}</div></div>`;
  const cmp = (c, f, l) => `<div class="av" style="background-image:url(${A}cmp-${c}.jpg)"></div><div class="t"><span class="f">${f}</span><span class="z">${l}</span></div>`;
  const per = (label, years, png) => `<div class="ic" style="-webkit-mask-image:url(${A}fld-${png}.png);mask-image:url(${A}fld-${png}.png)"></div><div class="t"><small>${years}</small>${snT(label)}</div>`;
  const scores = [['k', 'k545-p1.jpg', snT('Piano Sonata No. 16 in C Major, K. 545')], ['', 'k331-p1.jpg', snT('Piano Sonata No. 11 in A Major, K. 331')], ['', 'k545-ed2.jpg', 'Sonata in C, KV 545']];
  return `<div class="y-hd" style="top:${R1 - 38}px">${snT('Composers')} <small>9</small></div>`
    + cmps.map(([c, f, l, n, pv], i) => card(colX(i), R1, n, pv, cmp(c, f, l))).join('')
    + card(colX(0), R2, 3, 'k545-ed2.jpg', cmp('mozart', 'Wolfgang Amadeus', 'Mozart'), 1)
    + scores.map(([c, img, t], i) => `<div class="y-sc ${c}" style="left:${colX(i + 1).toFixed(1)}px;top:${R2}px"><div class="th" style="background-image:url(${A}${img})"></div><p>${t}<small>Wolfgang Amadeus Mozart</small></p></div>`).join('')
    + `<div class="y-hd" style="top:${R3 - 38}px">${snT('Periods')} <small>8</small></div>`
    + pers.map(([label, years, png, n, pv], i) => card(colX(i), R3, n, pv, per(label, years, png))).join('');
}

NS['r13/sync-r13'] = function(root, opt){
  opt = opt || {};
  const K = window.SNSKit;
  root.classList.add('sns-sync');
  root.innerHTML = `<div class="y-stage">
    <canvas class="y-cv t"></canvas><canvas class="y-cv h"></canvas>
    <div class="y-scrim"></div>
    <div class="y-dev" aria-hidden="true"><div class="y-scr"><div class="y-app">
      <div class="y-lib">${library()}</div>
      <div class="y-rd"><img src="${A}k545-p1.jpg" alt="" draggable="false"><canvas class="y-mi"></canvas><canvas class="y-mh"></canvas></div>
      <i class="y-tap snd" style="left:${(KX + SCW*LS/2).toFixed(1)}px;top:${(KY + SCH*LS/2).toFixed(1)}px"></i>
    </div></div><i class="y-pen m"></i></div>
    <i class="y-pen"></i>
    <div class="y-pill" role="status">${DEV}<span>${snT('Also open on {d}', {d: 'iPad mini'})}</span></div></div>`;
  const $ = s => root.querySelector(s);
  const stage = $('.y-stage'), dev = $('.y-dev'), tap = $('.y-tap'), pen = $('.y-pen:not(.m)'), penM = $('.y-pen.m');
  const cvT = $('.y-cv.t'), cvH = $('.y-cv.h'), cvMI = $('.y-mi'), cvMH = $('.y-mh');
  const scrA = document.createElement('canvas'), scrB = document.createElement('canvas');   // 蜡笔颗粒用的草稿画布：大谱页一张、小屏一张
  const TEMPO = K ? tempoStrokes(K) : [], HP = hairpin();
  const st = {tm: 0, hn: 0};   // tm：「♩=80」写到第几笔（小数是这一笔写了多少）；hn：小屏上的「>」写了多少
  const stroke = (pts, wi) => ({tool: 'crayon', color: PURPLE, w: K ? K.WIDTHS.crayon[wi]*1.33 : 6, op: 1, pts});
  let k = 1, dpr = 1, fh = H, bs = 1, km = 1, kn = 1, pg = {x: 24, y: 41};

  function layout(){
    const w = root.clientWidth; if (!w) return;
    k = w/W; dpr = Math.min(2, window.devicePixelRatio || 1);
    fh = root.clientHeight ? Math.round(W*root.clientHeight/w) : H;
    stage.style.height = fh + 'px'; stage.style.transform = `scale(${k})`;
    root.style.setProperty('--ms', k < .5 ? 1.45 : 1);
    bs = Math.min(BIGS, (fh - 70)/DH, (W - 60)/DW);
    const v = {'--bx': (W - DW*bs)/2, '--by': (fh - DH*bs)/2, '--bs': bs, '--sx': W - DR - DW*SS, '--sy': fh - DB - DH*SS, '--ss': SS};
    for (const n in v) dev.style.setProperty(n, n.endsWith('s') ? v[n].toFixed(4) : v[n].toFixed(1) + 'px');
    tap.style.setProperty('--dotu', (Math.max(18, 30*k)/k/(AS*bs)).toFixed(2) + 'px');   // 圆点在屏幕上和别的章一样大
    // 大谱页上的两张画布贴着 board 的谱页
    const img = opt.board?.()?.querySelector('img.k-page');
    pg = {x: parseFloat(img?.style.left) || 24, y: parseFloat(img?.style.top) || Math.max(16, (fh - PHu)/2)};
    km = k*dpr; kn = k*dpr*bs*AS*RW/PW;
    for (const c of [cvT, cvH]){ Object.assign(c.style, {left: pg.x + 'px', top: pg.y + 'px', width: PW + 'px', height: PHu.toFixed(2) + 'px'}); c.width = Math.round(PW*km); c.height = Math.round(PHu*km); }
    for (const c of [cvMI, cvMH]){ c.width = Math.round(PW*kn); c.height = Math.round(PHu*kn); }
    scrA.width = cvT.width; scrA.height = cvT.height; scrB.width = cvMI.width; scrB.height = cvMI.height;
    drawAll();
  }

  /* ---------- 画 ---------- */
  function clear(c){ const g = c.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height); return g; }
  function put(g, pts, scr, kk, wi = 1){ if (!K || !pts.length) return; g.setTransform(kk, 0, 0, kk, 0, 0); K.drawStroke(g, stroke(pts, wi), scr, kk); }
  function tempoTo(g, scr, kk, tm){
    TEMPO.forEach((pts, i) => { const f = Math.min(1, Math.max(0, tm - i)); if (f > 0) put(g, f >= 1 ? pts : K.cut(pts, f), scr, kk); });
  }
  const drawT = () => tempoTo(clear(cvT), scrA, km, st.tm);
  const drawH = () => put(clear(cvH), HP, scrA, km, 0);
  // 小屏的笔迹：board 那四色从它的笔迹画布按谱页那一块拷过来，再补上完整的「♩=80」
  function drawMI(){
    const g = clear(cvMI), b = opt.board?.(), ink = b?.querySelector('canvas.k-ink');
    if (ink && ink.width){ const s = ink.width/W; g.drawImage(ink, pg.x*s, pg.y*s, PW*s, PHu*s, 0, 0, cvMI.width, cvMI.height); }
    tempoTo(g, scrB, kn, TEMPO.length);
  }
  function drawMH(){ const g = clear(cvMH); if (st.hn > 0) put(g, st.hn >= 1 ? HP : K.cut(HP, st.hn), scrB, kn, 0); }
  function drawAll(){ drawT(); drawH(); drawMI(); drawMH(); }

  /* ---------- 终态 ---------- */
  const END = [{}, {tempo: 1}, {tempo: 1, scrim: 1, dev: 1, open: 1}, {tempo: 1, dev: 1, small: 1, open: 1, pill: 1, hp: 1}];
  function show(e){ for (const c of ['tempo', 'scrim', 'dev', 'small', 'open', 'pill', 'hp']) root.classList.toggle('s-' + c, !!e[c]); }
  function pensOff(){ for (const p of [pen, penM]) p.classList.remove('on', 'up'); tap.classList.remove('on', 'dn'); }
  // 拍 n 结束时：「♩=80」拍 1 起写满，小屏的「>」拍 3 才有
  function fill(n){ st.tm = n >= 1 ? TEMPO.length : 0; st.hn = n >= 3 ? 1 : 0; drawAll(); }

  /* ---------- 播放 ---------- */
  const DUR = [0, 3900, 3700, 4500];
  const ease = p => p < .5 ? 2*p*p : 1 - Math.pow(-2*p + 2, 2)/2;
  let tok = null, cur = 0, done = true, t0 = 0;
  async function run(n, t){
    const wait = ms => new Promise(r => setTimeout(r, ms)).then(() => { if (t.dead) throw CANCEL; });
    const tween = (ms, fn) => new Promise((res, rej) => {
      const a = performance.now();
      (function f(now){ if (t.dead) return rej(CANCEL); const p = Math.min(1, (now - a)/ms); fn(p); p < 1 ? requestAnimationFrame(f) : res(); })(a);
    });
    // 笔放在谱页单位 q 上：大谱页的笔按舞台坐标，小屏的笔按设备坐标（设备整体再缩放）
    const at = (el, q) => {
      if (el === pen){ el.style.left = (pg.x + q[0]) + 'px'; el.style.top = (pg.y + q[1]) + 'px'; }
      else { el.style.left = (BZ + (RX + q[0]*RW/PW)*AS) + 'px'; el.style.top = (BZ + (RY + q[1]*RW/PW)*AS) + 'px'; }
    };
    const glide = (el, a, b, ms) => tween(ms, p => { const e = ease(p); at(el, [a[0] + (b[0] - a[0])*e, a[1] + (b[1] - a[1])*e]); });
    const lift = async el => { el.classList.add('up'); await wait(250); el.classList.remove('on'); await wait(350); el.classList.remove('up'); };
    if (n === 1){
      st.tm = 0; drawT(); root.classList.add('s-tempo');
      let tp = [TEMPO[0][0][0] + 40, TEMPO[0][0][1] + 50];
      at(pen, tp); pen.classList.add('on');
      for (let i = 0; i < TEMPO.length; i++){
        const pts = TEMPO[i];
        await glide(pen, tp, pts[0], i ? 140 : 420);
        await tween(TMS[i], p => { st.tm = i + p; drawT(); const c = K.cut(pts, p); tp = c.length ? c[c.length - 1] : pts[0]; at(pen, tp); });
      }
      st.tm = TEMPO.length; drawT();
      await wait(250); await lift(pen); await wait(600);
    } else if (n === 2){
      drawMI(); st.hn = 0; drawMH();
      root.classList.add('s-scrim', 's-dev');
      await wait(900); tap.classList.add('on');
      await wait(450); K.rip(tap); tap.classList.add('dn');
      await wait(120); tap.classList.remove('dn');
      await wait(80); tap.classList.remove('on'); root.classList.add('s-open');
      await wait(2150);
    } else if (n === 3){
      st.hn = 0; drawMH(); drawH();
      root.classList.remove('s-scrim'); root.classList.add('s-small');
      await wait(550); root.classList.add('s-pill');
      await wait(500);
      const a = HP[0], from = [a[0] + 40, a[1] + 50];
      at(penM, from); penM.classList.add('on');
      await glide(penM, from, a, 380);
      await tween(650, p => { st.hn = p; drawMH(); const c = K.cut(HP, p); at(penM, c.length ? c[c.length - 1] : a); });
      st.hn = 1; drawMH();
      await wait(200); lift(penM).catch(() => {});
      await wait(450); root.classList.add('s-hp');
      await wait(1750);
    }
  }
  function stop(){ if (tok){ tok.dead = true; tok = null; } }
  function snap(n, soft){
    stop(); pensOff(); fill(n);
    if (soft){ show(END[n]); return; }
    root.classList.add('s-now'); show(END[n]); void root.offsetWidth; requestAnimationFrame(() => root.classList.remove('s-now'));
  }
  function go(n, animate, only, soft){
    n = Math.max(0, Math.min(3, n|0));
    if (!animate || RM || n === 0 || !K){ snap(n, soft); cur = n; done = true; return; }
    snap(n - 1);
    const t = tok = {dead: false};
    (async () => {
      for (let j = n; j <= (only ? n : 3); j++){
        cur = j; done = false; t0 = performance.now();
        try { await run(j, t); } catch(e){ if (e === CANCEL) return; throw e; }
        if (t.dead) return;
      }
      done = true; if (tok === t) tok = null;
    })();
  }
  const ro = new ResizeObserver(layout); ro.observe(root); layout();
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
    destroy(){ stop(); ro.disconnect(); root.removeEventListener('pointerdown', onDown); root.innerHTML = ''; }
  };
};
})();
