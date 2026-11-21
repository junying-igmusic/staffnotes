/* r19：2026-11-16 小谭定换机不丢为主线、多设备为第二卖点；四拍剧情小谭确认。
   拍 1：阅读器拉远成旧 iPad，停留后熄屏。
   拍 2：旧 iPad 熄屏后向左滑出，新 iPad 从右滑入并同步曲库。
   拍 3：展开独奏会，点 K. 545 放大成阅读器。
   拍 4：大 iPad 退到左侧，mini 升到右侧，第 18 小节同步出现「>」。
   大设备沿用 board 的同一张谱页与笔迹，仅移动其舞台，避免两份图像缩放后换手变糊。
   拍 4 沿用 r18 拍 3 的「>」坐标：1878 年 K. 545 第 1 页像素 x 150–440、y 1193–1241，最细一档蜡笔。
   接口：beat(n, soft) 摆终态；one(n) 只播一拍；play()；reset()。opt.board() 提供谱页和笔迹。 */
(function(){
const NS = window.SNSims = window.SNSims || {};
if (NS['r13/sync-r13']) return;
const W = 834, H = 1194, INK = '#292D38', PURPLE = 4;
const src = document.currentScript && document.currentScript.src;
const A = src ? new URL('../assets/', src).href : 'components/assets/';
// 谱页：board 上是 x=24、宽 786；这一层的笔迹画布都用「谱页单位」（谱页左上角为原点，786 宽），1300 宽的谱页像素乘 PU 换过来
const PW = 786, PHu = PW*1839/1300, PU = PW/1300;
// iPad mini：屏 520×792，黑边 24，停在右下角
const SWB = 520, SHB = Math.round(SWB*2266/1488), BZ = 24, DW = SWB + 2*BZ, DH = SHB + 2*BZ, SR = 16, SS = .44, LS = .51, DEV_GAP = 24;
// 屏里是 App：744×1133 pt（iPad mini 竖屏），整体缩 AS 塞进屏
const AW = 744, AH = 1133, AS = SWB/AW;
// App 阅读器里的谱页：和大 iPad 一样左右留边（786/834），上下居中
const RW = AW*PW/W, RH = RW*1839/1300, RX = (AW - RW)/2, RY = (AH - RH)/2;
// 大 iPad 从阅读器框拉远；首页沿用整理章的 625 宽四列。
const BZB = 38, ZS = .66, SL = 110;
const LSB = W/625, X0 = 20, GAP = 15, CW = 134.8, CH = 190, SCW = 136, SCH = 192, R1 = 108, R2 = 402;
const colX = c => X0 + c*(CW + GAP);
const KX = colX(2)*LSB, KY = R2*LSB, KS = SCW*LSB/PW, KR = 5*LSB/KS;
const glass = 'background:rgba(255,255,255,.92);box-shadow:0 1px 2px rgba(0,0,0,.07),0 3px 10px -4px rgba(41,45,56,.16),inset 0 0 0 .5px rgba(0,0,0,.07)';
// SF Symbols ipad.and.iphone 的简画
const DEV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><rect x="2.4" y="3.6" width="13.2" height="16.8" rx="2.2"/><rect x="14.2" y="9.2" width="7.4" height="11.6" rx="1.8" fill="#fff"/><path d="M17.1 18.6h1.6" stroke-linecap="round"/></svg>';
const CSS = `
.sns-sync{position:relative;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Helvetica Neue",sans-serif;color:${INK};-webkit-font-smoothing:antialiased;user-select:none;-webkit-user-select:none}
.sns-sync .y-stage{position:absolute;left:0;top:0;width:${W}px;height:${H}px;transform-origin:0 0}
.sns-sync .y-cv{position:absolute;z-index:5;display:block;pointer-events:none;opacity:0;transition:opacity .45s ease}
.sns-sync.s-hp .y-cv.h{opacity:1}
.os-rbox{transition:box-shadow .6s ease}.os-rbox.sy-bare{box-shadow:none}
.os-rbox.sy-bare,.os-rbox.sy-bare>.sim{background:transparent}
.sns-sync .y-room{position:absolute;left:0;top:0;width:100%;height:100%;z-index:0;background:var(--room,#F7F6F2);opacity:0;transition:opacity .5s ease}
.sns-sync.s-room .y-room{opacity:1}
.sns-sync .y-ipad{position:absolute;left:0;top:0;width:${W + 2*BZB}px;height:calc(var(--fh) + ${2*BZB}px);border-radius:calc(var(--srb) + ${BZB}px);background:#1C1C1E;transform-origin:0 0;
  box-shadow:0 0 0 3px #3A3A3C inset,0 44px 96px -20px rgba(41,45,56,.38),0 12px 28px rgba(41,45,56,.14)}
.sns-sync .y-bs{position:absolute;left:${BZB}px;top:${BZB}px;width:${W}px;height:var(--fh);border-radius:var(--srb);background:#fff;overflow:hidden}
.sns-sync .y-ipad.a{z-index:2;opacity:0;transform:translate(var(--wx),var(--wy)) scale(${ZS});transition:transform .9s cubic-bezier(.3,.7,.2,1),opacity .4s ease}
.sns-sync.s-a .y-ipad.a{opacity:1}
.sns-sync.s-a.s-afull .y-ipad.a{transform:translate(${-BZB}px,${-BZB}px) scale(1)}
.sns-sync.s-a.s-agone .y-ipad.a{opacity:0;transform:translate(calc(var(--wx) - ${SL}px),var(--wy)) scale(${ZS});transition:transform .7s cubic-bezier(.25,.8,.2,1),opacity .7s cubic-bezier(.25,.8,.2,1)}
.sns-sync .y-blk{position:absolute;inset:0;background:#0B0B0C;opacity:0;transition:opacity .35s ease}
.sns-sync.s-aoff .y-blk{opacity:1}
.sns-sync .y-ipad.b{z-index:3;opacity:0;transform:translate(calc(var(--wx) + ${SL}px),var(--wy)) scale(${ZS});transition:transform .7s cubic-bezier(.25,.8,.2,1),opacity .7s cubic-bezier(.25,.8,.2,1)}
.sns-sync.s-b .y-ipad.b{opacity:1;transform:translate(var(--wx),var(--wy)) scale(${ZS})}
.sns-sync.s-b.s-bfull .y-ipad.b{transform:translate(${-BZB}px,${-BZB}px) scale(1);transition:transform .9s cubic-bezier(.3,.7,.2,1)}
.sns-sync .y-pill{position:absolute;z-index:6;left:50%;top:15px;height:44px;min-width:130px;box-sizing:border-box;padding:0 16px;border-radius:22px;${glass};display:flex;align-items:center;justify-content:center;gap:9px;white-space:nowrap;font-weight:500;font-size:15px;line-height:1.2;
  translate:-50% 0;transform-origin:50% 0;scale:var(--ms,1);opacity:0;transform:translateY(-10px) scale(.92);transition:opacity .35s ease,transform .35s cubic-bezier(.3,.8,.2,1)}
.sns-sync.s-pill .y-pill:not(.y-status){opacity:1;transform:none}
.sns-sync .y-pill svg{width:22px;height:22px;flex:none}
/* Pencil：照 board-r13 的 .k-touch.pen（笔尖在元素的点上，笔身往右上 30° 斜出去） */
.sns-sync .y-pen{position:absolute;z-index:5;left:0;top:0;width:6px;height:6px;margin:-3px 0 0 -3px;border-radius:50%;background:#3a3d46;filter:drop-shadow(0 5px 7px rgba(41,45,56,.22));pointer-events:none;
  opacity:0;transition:opacity .25s,translate .35s cubic-bezier(.3,.8,.2,1)}
.sns-sync .y-pen::before,.sns-sync .y-pen::after{content:"";position:absolute;left:-4px;width:14px;transform:rotate(30deg)}
.sns-sync .y-pen::before{bottom:3px;height:26px;transform-origin:50% 100%;clip-path:polygon(50% 100%,0 0,100% 0);background:linear-gradient(0deg,#3a3d46 0 16%,#f4f4f6 16%,#e4e5e9)}
.sns-sync .y-pen::after{bottom:29px;height:150px;border-radius:7px 7px 1px 1px;transform-origin:50% calc(100% + 26px);background:linear-gradient(90deg,#fff,#f3f3f5 55%,#dcdde2)}
.sns-sync .y-pen.on{opacity:1}
.sns-sync .y-pen.up{translate:10px -17px}
/* mini 从右下方升起。 */
.sns-sync .y-dev{position:absolute;z-index:4;left:0;top:0;width:${DW}px;height:${DH}px;box-sizing:border-box;border-radius:${SR + BZ}px;background:#1C1C1E;transform-origin:0 0;
  box-shadow:0 0 0 3px #3A3A3C inset,0 44px 96px -20px rgba(41,45,56,.38),0 12px 28px rgba(41,45,56,.14);
  opacity:0;transform:translate(var(--sx),calc(var(--sy) + 70px)) scale(var(--ss));transition:transform .7s cubic-bezier(.25,.8,.2,1),opacity .45s ease}
.sns-sync.s-dev .y-dev{opacity:1;transform:translate(var(--sx),var(--sy)) scale(var(--ss))}
.sns-sync .y-scr{position:absolute;left:${BZ}px;top:${BZ}px;width:${SWB}px;height:${SHB}px;border-radius:${SR}px;background:#fff;overflow:hidden}
.sns-sync .y-app{position:absolute;left:0;top:0;width:${AW}px;height:${AH}px;transform:scale(${AS});transform-origin:0 0;background:#fff;
  font-family:"Timeless Sans",-apple-system,system-ui,sans-serif;color:${INK};letter-spacing:-.01em}
.sns-sync .y-app *,.sns-sync .y-home *{box-sizing:border-box;margin:0;padding:0}
.sns-sync .y-home{position:absolute;left:0;top:0;width:625px;height:calc(var(--fh)/${LSB});transform:scale(${LSB});transform-origin:0 0;background:#fff;
  font-family:"Timeless Sans",-apple-system,system-ui,sans-serif;color:${INK};letter-spacing:-.01em;transition:opacity .35s ease}
.sns-sync.s-open .y-home{opacity:0;transition-delay:.08s}
.sns-sync .y-status{top:16px;min-width:150px;scale:1;opacity:1;transform:none}
.sns-sync .y-status span{grid-area:1/1;display:flex;align-items:center;gap:8px;transition:opacity .3s}
.sns-sync .y-status{display:grid;place-items:center}
.sns-sync .y-st1 svg{animation:ysp .8s steps(8) infinite}
.sns-sync .y-st2{opacity:0;stroke:currentColor}
.sns-sync.s-synced .y-st1{opacity:0}.sns-sync.s-synced .y-st2{opacity:1}
@keyframes ysp{to{transform:rotate(360deg)}}
@media(prefers-reduced-motion:reduce){.sns-sync .y-st1 svg{animation:none}}
.sns-sync .y-hd{position:absolute;left:${X0 + 2}px;font-size:21px;display:flex;align-items:baseline;gap:9px;white-space:nowrap}
.sns-sync .y-hd small{font-size:13px;color:#8C919B}
.sns-sync .y-it{position:absolute;width:${CW}px;height:${CH}px;opacity:0;transform:translateY(8px) scale(.96);transition:opacity .35s ease,transform .35s cubic-bezier(.3,.8,.2,1)}
.sns-sync .y-it.on{opacity:1;transform:none}
.sns-sync .y-it .bp{position:absolute;left:34%;top:5%;width:62%;height:90%;border-radius:10px;background:#E6E6E8;opacity:0}
.sns-sync .y-it .pv{position:absolute;left:30%;top:8%;width:66%;height:84%;border-radius:4px;background:#fff center top/cover no-repeat;box-shadow:0 1px 2px rgba(0,0,0,.08)}
.sns-sync .y-it .cv{position:absolute;left:0;top:0;width:90%;height:100%;border-radius:10px;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.05),0 6px 14px -6px rgba(23,27,36,.12);overflow:hidden;transform-origin:50% 60%;transition:width .35s ease,transform .35s cubic-bezier(.3,.8,.2,1)}
.sns-sync.s-mz .y-it.recital .cv{width:80%;transform:rotate(-2.5deg)}
.sns-sync.s-mz .y-it.recital .bp{opacity:1}
.sns-sync.s-mz .y-it.recital .pv{opacity:0}
.sns-sync .y-it .bp,.sns-sync .y-it .pv{transition:opacity .3s ease}
.sns-sync .y-it .dots{position:absolute;z-index:2;left:11px;top:4px;font-size:16px;letter-spacing:1px}
.sns-sync .y-it .n{position:absolute;z-index:2;right:12px;top:7px;font-size:14.4px;color:#646A75;font-variant-numeric:tabular-nums}
.sns-sync .y-it .ic{position:absolute;left:30%;top:31%;width:40%;height:24%;background:${INK};-webkit-mask:center/contain no-repeat;mask:center/contain no-repeat}
.sns-sync .y-it .t{position:absolute;left:12px;right:8px;bottom:14px;font:16.1px/1.08 var(--serif,"Timeless Serif",Georgia,serif);overflow:hidden;text-overflow:ellipsis}
.sns-sync .y-it svg.ic{background:none}
.sns-sync .y-recent{position:absolute;inset:0;transition:translate .55s cubic-bezier(.2,.7,.2,1)}
.sns-sync.s-mz .y-recent{translate:0 -380px}
.sns-sync.s-mz .y-it.recital{translate:${colX(0)-colX(2)}px 0;transition:translate .55s cubic-bezier(.2,.7,.2,1)}
.sns-sync.s-mz :is(.y-hd.collections,.y-it:not(.recital)){translate:0 260px;opacity:0;transition:translate .55s cubic-bezier(.2,.7,.2,1),opacity .2s .25s}
.sns-sync .y-sc{position:absolute;width:${SCW}px;opacity:0;transform:translateY(6px);transition:opacity .3s ease,transform .35s cubic-bezier(.3,.8,.2,1)}
.sns-sync .y-sc.on,.sns-sync.s-mz .y-sc.member{opacity:1;transform:none}
.sns-sync .y-sc.member{transform:translateX(var(--from)) scale(.88);transition-delay:var(--stagger)}
.sns-sync.s-mz .y-sc.member{transform:none}
.sns-sync .y-sc .th{height:${SCH}px;border-radius:5px;background:#fff center top/cover no-repeat;box-shadow:0 1px 2px rgba(0,0,0,.08),0 6px 14px -6px rgba(23,27,36,.14)}
.sns-sync .y-sc p{margin-top:7px;font-size:11.5px;line-height:1.25;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.sns-sync .y-sc small{display:block;font-size:10.5px;color:#8C919B;margin-top:2px}
.sns-sync.s-open .y-sc.k .th{opacity:0}
.sns-sync .y-rdm{position:absolute;left:${RX}px;top:${RY}px;width:${RW}px;height:${RH}px}
.sns-sync .y-rdm img,.sns-sync .y-rdm canvas{position:absolute;left:0;top:0;width:100%;height:100%;display:block}
.sns-sync .y-rdm canvas{mix-blend-mode:multiply}
/* 谱面始终是原 board：只缩放内部舞台，外层尺寸保持不变，ResizeObserver 仍按真实框宽计算。 */
.os-rbox:has(.sns-sync.on) .k-stage{transition:transform .7s cubic-bezier(.3,.7,.2,1),clip-path .7s cubic-bezier(.3,.7,.2,1)}
.os-rbox:has(.sns-sync.on.s-a:not(.s-b)),
.os-rbox:has(.sns-sync.on.s-swap),
.os-rbox:has(.sns-sync.on.s-pair){background:var(--sy-room)}
.os-rbox:has(.sns-sync.on.s-a:not(.s-b)) .sns-board,
.os-rbox:has(.sns-sync.on.s-swap) .sns-board,
.os-rbox:has(.sns-sync.on.s-pair) .sns-board,
.os-rbox:has(.sns-sync.on.s-open) .sns-board{z-index:2}
.os-rbox:has(.sns-sync.on.s-a) .k-stage{transform:translate(var(--sy-x),var(--sy-y)) scale(calc(var(--sy-k)*${ZS}))!important;
  clip-path:inset(0 round var(--sy-radius));transition:transform .9s cubic-bezier(.3,.7,.2,1),clip-path .9s cubic-bezier(.3,.7,.2,1),opacity .4s ease}
.os-rbox:has(.sns-sync.on.s-afull) .k-stage{transform:scale(var(--sy-k))!important;clip-path:inset(0)}
.os-rbox:has(.sns-sync.on.s-agone) .k-stage{transform:translate(var(--sy-away),var(--sy-y)) scale(calc(var(--sy-k)*${ZS}))!important;opacity:0;
  transition:transform .7s cubic-bezier(.25,.8,.2,1),opacity .7s cubic-bezier(.25,.8,.2,1)}
.os-rbox:has(.sns-sync.on.s-a:not(.s-b),.sns-sync.on.s-swap) .k-stage::after{content:"";position:absolute;inset:0;background:#0B0B0C;opacity:0;transition:opacity .35s ease}
.os-rbox:has(.sns-sync.on.s-aoff:not(.s-b),.sns-sync.on.s-swap) .k-stage::after{opacity:1}
.os-rbox:has(.sns-sync.on.s-b:where(:not(.s-swap))) .k-stage{transform:translate(var(--sy-kx),var(--sy-ky)) scale(calc(var(--sy-k)*${ZS*KS}))!important;
  clip-path:inset(var(--sy-top) var(--sy-right) var(--sy-bottom) var(--sy-left) round ${KR}px);opacity:0;transition:none}
.os-rbox:has(.sns-sync.on.s-open) .k-stage{transform:translate(var(--sy-x),var(--sy-y)) scale(calc(var(--sy-k)*${ZS}))!important;
  clip-path:inset(var(--sy-top) var(--sy-right) var(--sy-bottom) var(--sy-left));opacity:1;
  transition:transform .65s cubic-bezier(.3,.75,.15,1),clip-path .65s cubic-bezier(.3,.75,.15,1),opacity .12s linear}
.os-rbox:has(.sns-sync.on.s-bfull) .k-stage{transform:scale(var(--sy-k))!important;clip-path:inset(0);
  transition:transform .9s cubic-bezier(.3,.7,.2,1),clip-path .9s cubic-bezier(.3,.7,.2,1)}
.sns-sync .y-ipad.pair{opacity:0;transform:translate(${-BZB}px,${-BZB}px) scale(1);
  transition:transform .7s cubic-bezier(.3,.7,.2,1),opacity .3s ease}
.sns-sync.s-pair .y-ipad.pair{opacity:1;transform:translate(var(--pair-x),var(--pair-y)) scale(${LS})}
.os-rbox:has(.sns-sync.on.s-pair) .k-stage{transform:translate(var(--sy-pair-x),var(--sy-pair-y)) scale(calc(var(--sy-k)*${LS}))!important;
  clip-path:inset(0 round var(--sy-radius))}
.sns-sync .y-cv.h{transform-origin:0 0}
.sns-sync.s-pair .y-cv.h{transform:translate(var(--hair-x),var(--hair-y)) scale(${LS})}
.os-rbox:has(.sns-sync.s-now) .k-stage,.os-rbox:has(.sns-sync.s-now) .k-stage::after{transition:none!important}
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

// 「>」：第 18 小节上方一笔画成，拐角处点要密，否则 trace 的二次曲线会把尖角磨圆；开口 48 是为了细笔两条边在小屏上也分得开
function hairpin(){
  const P = [[150, 1193], [440, 1217], [150, 1241]], out = [P[0]];
  for (let s = 0; s < 2; s++) for (let i = 1; i <= 24; i++){ const t = i/24; out.push([P[s][0] + (P[s+1][0] - P[s][0])*t, P[s][1] + (P[s+1][1] - P[s][1])*t]); }
  return out.map(p => [p[0]*PU, p[1]*PU]);
}

// 曲库：最近打开保留访问顺序，独奏会成员按整理后的顺序展开。
function home(){
  const scores = [
    ['k545-p1.jpg', 'Piano Sonata No. 16 in C Major, K. 545', 'Wolfgang Amadeus Mozart'],
    ['op111-annot.jpg', 'Piano Sonata No. 32 in C Minor, Op. 111', 'Ludwig van Beethoven'],
    ['k331-p1.jpg', 'Piano Sonata No. 11 in A Major, K. 331', 'Wolfgang Amadeus Mozart']
  ];
  const folders = [
    ['Recently Added', 12, 'k331-p1.jpg'],
    ['Favorites', 3, 'k545-ed2.jpg'],
    ['Recital', 3, 'k545-p1.jpg'],
    ['This Term', 2, 'k545-p1.jpg']
  ];
  const folderIcon = '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/></svg>';
  const card = ([name,n,pv], i) => `<div class="y-it${i === 2 ? ' recital' : ''}" style="left:${colX(i)}px;top:${R2}px"><div class="bp"></div><div class="pv" style="background-image:url(${A}${pv})"></div><div class="cv"><div class="dots">···</div><div class="n">${n}</div>${i === 0 ? `<i class="ic" style="mask-image:url(${A}fld-added.png)"></i>` : folderIcon}<div class="t">${snT(name)}</div></div></div>`;
  const score = ([img,title,composer], x, y, cls, style = '') => `<div class="y-sc ${cls}" style="left:${x}px;top:${y}px;${style}"><div class="th" style="background-image:url(${A}${img})"></div><p>${snT(title)}</p><small>${snT(composer)}</small></div>`;
  const spin = Array.from({length:8}, (_, i) => `<path d="M12 2v5" transform="rotate(${45*i} 12 12)" opacity="${1 - i*.8/7}"/>`).join('');
  return `<div class="y-pill y-status" role="status">
    <span class="y-st1"><svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round">${spin}</svg>${snT('Syncing…')}</span>
    <span class="y-st2"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.5"><path d="M7 18.5h10.5a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.6 9.2 4.7 4.7 0 0 0 7 18.5Z"/><path d="m9.6 13.4 2 2 3.6-3.8"/></svg>${snT('Synced {t}', {t:snT('just now')})}</span>
    </div><div class="y-recent"><div class="y-hd" style="top:${R1-36}px">${snT('Recently opened')} <small class="y-n-recent">0</small></div>
    ${scores.map((item,i) => score(item,colX(i),R1,'recent')).join('')}</div>
    <div class="y-hd collections" style="top:${R2-36}px">${snT('My Collections')} <small class="y-n-collections">0</small></div>
    ${folders.map(card).join('')}
    ${[2,0,1].map((idx,i) => score(scores[idx],colX(i+1),R2,'member' + (idx === 0 ? ' k' : ''),`--from:${colX(2)-colX(i+1)}px;--stagger:${i*.1}s`)).join('')}`;
}

NS['r13/sync-r13'] = function(root, opt){
  opt = opt || {};
  const K = window.SNSKit;
  root.classList.add('sns-sync');
  root.innerHTML = `<div class="y-room"></div><div class="y-stage"><canvas class="y-cv h"></canvas>
    <div class="y-ipad pair" aria-hidden="true"><div class="y-bs"></div></div>
    <div class="y-ipad a" aria-hidden="true"><div class="y-bs"><div class="y-blk"></div></div></div>
    <div class="y-ipad b" aria-hidden="true"><div class="y-bs"><div class="y-home">${home()}</div>
      <i class="y-tap snd m" style="left:${(colX(2) + CW/2)*LSB}px;top:${(R2 + CH/2)*LSB}px"></i>
      <i class="y-tap snd k" style="left:${KX + SCW*LSB/2}px;top:${KY + SCH*LSB/2}px"></i>
    </div></div>
    <div class="y-dev" aria-hidden="true"><div class="y-scr"><div class="y-app"><div class="y-rdm">
      <img src="${A}k545-p1.jpg" alt="" draggable="false"><canvas class="y-mi"></canvas><canvas class="y-mh"></canvas>
    </div></div></div><i class="y-pen m"></i></div>
    <div class="y-pill" role="status">${DEV}<span>${snT('Also open on {d}', {d: 'iPad mini'})}</span></div></div>`;
  const $ = s => root.querySelector(s), rbox = root.closest('.os-rbox');
  const stage = $('.y-stage'), tapM = $('.y-tap.m'), tapK = $('.y-tap.k'), penM = $('.y-pen.m'), cards = [...root.querySelectorAll('.y-sc.recent,.y-it')];
  const cvH = $('.y-cv.h'), cvMI = $('.y-mi'), cvMH = $('.y-mh');
  const scrA = document.createElement('canvas'), scrB = document.createElement('canvas');
  const HP = hairpin(), st = {hn: 0};
  const stroke = (pts, wi) => ({tool: 'crayon', color: PURPLE, w: K ? K.WIDTHS.crayon[wi]*1.33 : 6, op: 1, pts});
  let k = 1, dpr = 1, fh = H, km = 1, kn = 1, pg = {x: 24, y: 41};

  function layout(){
    const r = root.getBoundingClientRect(), w = r.width; if (!w) return;
    k = w/W; dpr = Math.min(2, window.devicePixelRatio || 1);
    fh = r.height ? Math.round(W*r.height/w) : H;
    stage.style.height = fh + 'px'; stage.style.transform = `scale(${k})`;
    root.style.setProperty('--ms', k < .5 ? 1.45 : 1);
    let room = '#F7F6F2';
    for (let el = rbox?.parentElement; el; el = el.parentElement){
      const bg = getComputedStyle(el).backgroundColor;
      if (bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent'){ room = bg; break; }
    }
    const img = opt.board?.()?.querySelector('img.k-page');
    pg = {x: parseFloat(img?.style.left) || 24, y: parseFloat(img?.style.top) || Math.max(16, (fh - PHu)/2)};
    const left = (W - (W + 2*BZB)*LS - DEV_GAP - DW*SS)/2;
    const pairY = (fh - (fh + 2*BZB)*LS)/2;
    const v = {'--pair-x':left, '--pair-y':pairY, '--wx': (W - (W + 2*BZB)*ZS)/2, '--wy': (fh - (fh + 2*BZB)*ZS)/2,
      '--sx': left + (W + 2*BZB)*LS + DEV_GAP, '--sy': (fh - DH*SS)/2, '--fh': fh, '--srb': rbox ? parseFloat(getComputedStyle(rbox).borderTopLeftRadius)/k || 26 : 26, '--py': pg.y};
    for (const n in v) root.style.setProperty(n, v[n] + 'px');
    const sx = v['--wx'] + BZB*ZS, sy = v['--wy'] + BZB*ZS;
    const boardVars = {'--sy-pair-x':(left + BZB*LS)*k, '--sy-pair-y':(pairY + BZB*LS)*k, '--sy-x':sx*k, '--sy-y':sy*k, '--sy-away':(sx - SL)*k,
      '--sy-kx':(sx + ZS*(KX - pg.x*KS))*k, '--sy-ky':(sy + ZS*(KY - pg.y*KS))*k,
      '--sy-top':pg.y, '--sy-right':W - pg.x - PW, '--sy-bottom':fh - pg.y - PHu, '--sy-left':pg.x, '--sy-radius':v['--srb']};
    for (const n in boardVars) rbox?.style.setProperty(n, boardVars[n] + 'px');
    rbox?.style.setProperty('--sy-k', k);
    rbox?.style.setProperty('--sy-room', room);
    root.style.setProperty('--ss', SS); root.style.setProperty('--room', room);
    for (const tap of [tapM, tapK]) tap.style.setProperty('--dotu', Math.max(18, 30*k)/k/ZS + 'px');
    km = k*dpr; kn = k*dpr*SS*AS*RW/PW;
    Object.assign(cvH.style, {left: pg.x + 'px', top: pg.y + 'px', width: PW + 'px', height: PHu + 'px'});
    cvH.style.setProperty('--hair-x', (left + BZB*LS - pg.x*(1 - LS)) + 'px');
    cvH.style.setProperty('--hair-y', (pairY + BZB*LS - pg.y*(1 - LS)) + 'px');
    cvH.width = Math.round(PW*km); cvH.height = Math.round(PHu*km);
    for (const c of [cvMI, cvMH]){ c.width = Math.round(PW*kn); c.height = Math.round(PHu*kn); }
    scrA.width = cvH.width; scrA.height = cvH.height; scrB.width = cvMI.width; scrB.height = cvMI.height;
    drawAll();
  }

  function clear(c){ const g = c.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height); return g; }
  function put(g, pts, scr, kk){ if (!K || !pts.length) return; g.setTransform(kk, 0, 0, kk, 0, 0); K.drawStroke(g, stroke(pts, 0), scr, kk); }
  function drawMI(){
    const g = clear(cvMI), ink = opt.board?.()?.querySelector('canvas.k-ink');
    if (ink?.width){ const s = ink.width/W; g.drawImage(ink, pg.x*s, pg.y*s, PW*s, PHu*s, 0, 0, cvMI.width, cvMI.height); }
  }
  const drawH = () => put(clear(cvH), HP, scrA, km);
  function drawMH(){ const g = clear(cvMH); if (st.hn > 0) put(g, st.hn >= 1 ? HP : K.cut(HP, st.hn), scrB, kn); }
  function drawAll(){ drawMI(); drawMH(); drawH(); }

  const END = [{}, {bare: 1, room: 1, a: 1, aoff: 1}, {bare: 1, room: 1, a: 1, aoff: 1, agone: 1, b: 1, synced: 1, cards: 7}, {}, {bare:1, room:1, pair:1, dev:1, pill:1, hp:1}];
  function showCards(n){
    cards.forEach((c, i) => c.classList.toggle('on', i < n));
    $('.y-n-recent').textContent = Math.min(n, 3);
    $('.y-n-collections').textContent = Math.max(0, n - 3);
  }
  function show(e){
    for (const c of ['room','a','afull','aoff','agone','swap','b','bfull','pair','synced','mz','open','dev','pill','hp']) root.classList.toggle('s-' + c, !!e[c]);
    rbox?.classList.toggle('sy-bare', !!e.bare); showCards(e.cards || 0);
  }
  function pensOff(){ penM.classList.remove('on', 'up'); for (const tap of [tapM, tapK]) tap.classList.remove('on', 'dn'); }
  function fill(n){ st.hn = n >= 4 ? 1 : 0; drawAll(); }

  /* ---------- 播放 ---------- */
  const DUR = [0, 3000, 4300, 4750, 5350];
  const ease = p => p < .5 ? 2*p*p : 1 - Math.pow(-2*p + 2, 2)/2;
  let tok = null, cur = 0, done = true, t0 = 0, queued4 = false;
  async function run(n, t){
    const wait = ms => new Promise(r => setTimeout(r, ms)).then(() => { if (t.dead) throw CANCEL; });
    const tween = (ms, fn) => new Promise((res, rej) => {
      const a = performance.now();
      (function f(now){ if (t.dead) return rej(CANCEL); const p = Math.min(1, (now - a)/ms); fn(p); p < 1 ? requestAnimationFrame(f) : res(); })(a);
    });
    const at = (el, q) => { el.style.left = (BZ + (RX + q[0]*RW/PW)*AS) + 'px'; el.style.top = (BZ + (RY + q[1]*RW/PW)*AS) + 'px'; };
    const glide = (el, a, b, ms) => tween(ms, p => { const e = ease(p); at(el, [a[0] + (b[0] - a[0])*e, a[1] + (b[1] - a[1])*e]); });
    const lift = async el => { el.classList.add('up'); await wait(250); el.classList.remove('on'); await wait(350); el.classList.remove('up'); };
    if (n === 1){
      root.classList.add('s-now'); show({room:1, a:1, afull:1}); void root.offsetWidth;
      requestAnimationFrame(() => root.classList.remove('s-now'));
      await wait(350); root.classList.remove('s-afull'); rbox?.classList.add('sy-bare');
      await wait(1900); root.classList.add('s-aoff');
      await wait(750);
    } else if (n === 2){
      show({...END[1], agone:1, b:1, swap:1});
      await wait(720); root.classList.remove('s-swap');
      showCards(1);
      for (let i = 2; i <= 7; i++){ await wait(260); showCards(i); }
      await wait(560); root.classList.add('s-synced');
      await wait(1300);
    } else if (n === 3){
      tapM.classList.add('on');
      await wait(450); K.rip(tapM); tapM.classList.add('dn');
      await wait(120); tapM.classList.remove('dn');
      await wait(80); tapM.classList.remove('on'); root.classList.add('s-mz');
      await wait(1150); tapK.classList.add('on');
      await wait(450); K.rip(tapK); tapK.classList.add('dn');
      await wait(120); tapK.classList.remove('dn');
      await wait(80); tapK.classList.remove('on'); root.classList.add('s-open');
      await wait(850); root.classList.add('s-bfull'); rbox?.classList.remove('sy-bare');
      // 读回样式以启动过渡，再等设备和谱页一起放大到位。
      void root.offsetWidth;
      try { await Promise.all([opt.board().querySelector('.k-stage'), $('.y-ipad.b')].flatMap(el => el.getAnimations().map(a => a.finished))); }
      catch(e){ if (t.dead) throw CANCEL; throw e; }
      await wait(50); root.classList.add('s-now'); show(END[3]); void root.offsetWidth;
      requestAnimationFrame(() => root.classList.remove('s-now'));
      await wait(550);
    } else if (n === 4){
      st.hn = 0; drawMI(); drawMH(); drawH();
      show({bare:1, room:1, pair:1});
      await wait(700); root.classList.add('s-dev');
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
  function stop(){ queued4 = false; if (tok){ tok.dead = true; tok = null; } }
  function snap(n, soft){
    stop(); pensOff(); fill(n);
    if (soft){ show(END[n]); return; }
    root.classList.add('s-now'); show(END[n]); void root.offsetWidth; requestAnimationFrame(() => root.classList.remove('s-now'));
  }
  function go(n, animate, only, soft){
    n = Math.max(0, Math.min(4, n|0));
    if (!animate || RM || n === 0 || !K){ snap(n, soft); cur = n; done = true; return; }
    if (only && n === 4 && cur === 3 && tok){ queued4 = true; return; }
    snap(n - 1);
    const t = tok = {dead: false};
    (async () => {
      for (let j = n; j <= (only ? n : 4); j++){
        cur = j; done = false; t0 = performance.now();
        try { await run(j, t); } catch(e){ if (e === CANCEL) return; throw e; }
        if (t.dead) return;
      }
      done = true; if (tok === t) tok = null;
      if (queued4) go(4, true, true);
    })();
  }
  const ro = new ResizeObserver(layout); ro.observe(root); layout();
  const onDown = () => { if (tok){ snap(cur); done = true; } };
  root.addEventListener('pointerdown', onDown);
  return {
    beats: 4,
    get beatNow(){ return cur; }, get busy(){ return !!tok; },
    get beatFrac(){ if (done || !tok) return cur ? 1 : 0; return Math.min(1, (performance.now() - t0)/DUR[cur]); },
    play(){ go(RM ? 4 : 1, true); },
    go(n){ go(n, true); },
    one(n){ go(n, true, true); },
    beat(n, soft){ go(n, false, false, soft); },
    reset(){ go(0, false); },
    visible(on){ if (!on && tok){ snap(cur); done = true; } },
    destroy(){ stop(); rbox?.classList.remove('sy-bare'); if (rbox) for (const n of [...rbox.style]) if (n.startsWith('--sy-')) rbox.style.removeProperty(n); ro.disconnect(); root.removeEventListener('pointerdown', onDown); root.innerHTML = ''; }
  };
};
})();
