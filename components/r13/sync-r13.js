/* r19：2026-11-16 小谭定换机不丢为主线、多设备为第二卖点；四拍剧情小谭确认。
   拍 1：阅读器拉远成旧 iPad，停留后熄屏。
   拍 2：新 iPad 滑入，个人卡片显示同步状态，五个作曲家文件夹依次回来。
   拍 3：点 Mozart、K. 545，四色笔迹原样打开，放大后换回真阅读器。
   拍 4：mini 从下方升到右下，在第 18 小节上方画「>」，大谱同处出现。
   新首页是 App 概览页个人卡片 + 乐谱页作曲家文件夹的合成。
   拍 4 沿用 r18 拍 3 的「>」坐标：1878 年 K. 545 第 1 页像素 x 150–440、y 1193–1241，最细一档蜡笔。
   接口：beat(n, soft) 摆终态；one(n) 只播一拍；play()；reset()。opt.board() 提供谱页和四色笔迹。 */
(function(){
const NS = window.SNSims = window.SNSims || {};
if (NS['r13/sync-r13']) return;
const W = 834, H = 1194, INK = '#292D38', PURPLE = 4;
const src = document.currentScript && document.currentScript.src;
const A = src ? new URL('../assets/', src).href : 'components/assets/';
// 谱页：board 上是 x=24、宽 786；这一层的笔迹画布都用「谱页单位」（谱页左上角为原点，786 宽），1300 宽的谱页像素乘 PU 换过来
const PW = 786, PHu = PW*1839/1300, PU = PW/1300;
// iPad mini：屏 520×792，黑边 24，停在右下角
const SWB = 520, SHB = Math.round(SWB*2266/1488), BZ = 24, DW = SWB + 2*BZ, DH = SHB + 2*BZ, SR = 16, SS = .5, DR = 26, DB = 40;
// 屏里是 App：744×1133 pt（iPad mini 竖屏），整体缩 AS 塞进屏
const AW = 744, AH = 1133, AS = SWB/AW;
// App 阅读器里的谱页：和大 iPad 一样左右留边（786/834），上下居中
const RW = AW*PW/W, RH = RW*1839/1300, RX = (AW - RW)/2, RY = (AH - RH)/2;
// 大 iPad 从阅读器框拉远；首页沿用整理章的 625 宽四列。
const BZB = 38, ZS = .66, SL = 110;
const LSB = W/625, X0 = 20, GAP = 15, CW = 134.8, CH = 190, SCW = 136, SCH = 192, R1 = 250, R2 = 470;
const colX = c => X0 + c*(CW + GAP);
const KX = colX(1)*LSB, KY = R2*LSB, KS = SCW*LSB/PW, KR = 5*LSB/KS;
const glass = 'background:rgba(255,255,255,.92);box-shadow:0 1px 2px rgba(0,0,0,.07),0 3px 10px -4px rgba(41,45,56,.16),inset 0 0 0 .5px rgba(0,0,0,.07)';
// SF Symbols ipad.and.iphone 的简画
const DEV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><rect x="2.4" y="3.6" width="13.2" height="16.8" rx="2.2"/><rect x="14.2" y="9.2" width="7.4" height="11.6" rx="1.8" fill="#fff"/><path d="M17.1 18.6h1.6" stroke-linecap="round"/></svg>';
const CSS = `
.sns-sync{position:relative;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Helvetica Neue",sans-serif;color:${INK};-webkit-font-smoothing:antialiased;user-select:none;-webkit-user-select:none}
.sns-sync .y-stage{position:absolute;left:0;top:0;width:${W}px;height:${H}px;transform-origin:0 0}
.sns-sync .y-cv{position:absolute;z-index:1;display:block;pointer-events:none;opacity:0;transition:opacity .45s ease}
.sns-sync.s-hp .y-cv.h{opacity:1}
.os-rbox{transition:box-shadow .6s ease}.os-rbox.sy-bare{box-shadow:none}
.sns-sync .y-room{position:absolute;left:0;top:0;width:${W}px;height:var(--fh);z-index:0;background:var(--room,#F7F6F2);opacity:0;transition:opacity .5s ease}
.sns-sync.s-room .y-room{opacity:1}
.sns-sync .y-ipad{position:absolute;left:0;top:0;width:${W + 2*BZB}px;height:calc(var(--fh) + ${2*BZB}px);border-radius:calc(var(--srb) + ${BZB}px);background:#1C1C1E;transform-origin:0 0;
  box-shadow:0 0 0 3px #3A3A3C inset,0 44px 96px -20px rgba(41,45,56,.38),0 12px 28px rgba(41,45,56,.14)}
.sns-sync .y-bs{position:absolute;left:${BZB}px;top:${BZB}px;width:${W}px;height:var(--fh);border-radius:var(--srb);background:#fff;overflow:hidden}
.sns-sync .y-ipad.a{z-index:2;opacity:0;transform:translate(var(--wx),var(--wy)) scale(${ZS});transition:transform .9s cubic-bezier(.3,.7,.2,1),opacity .4s ease}
.sns-sync.s-a .y-ipad.a{opacity:1}
.sns-sync.s-a.s-afull .y-ipad.a{transform:translate(${-BZB}px,${-BZB}px) scale(1)}
.sns-sync.s-a.s-agone .y-ipad.a{opacity:0;transform:translate(calc(var(--wx) - ${SL}px),var(--wy)) scale(${ZS});transition:transform .6s cubic-bezier(.4,0,.6,1),opacity .4s ease}
.sns-sync .y-pg{position:absolute;left:24px;top:var(--py);width:${PW}px;height:${PHu}px}
.sns-sync .y-ai{position:absolute;left:0;top:0;width:${W}px;height:${H}px;mix-blend-mode:multiply}
.sns-sync .y-blk{position:absolute;inset:0;background:#0B0B0C;opacity:0;transition:opacity .35s ease}
.sns-sync.s-aoff .y-blk{opacity:1}
.sns-sync .y-ipad.b{z-index:3;opacity:0;transform:translate(calc(var(--wx) + ${SL}px),var(--wy)) scale(${ZS});transition:transform .7s cubic-bezier(.25,.8,.2,1),opacity .5s ease}
.sns-sync.s-b .y-ipad.b{opacity:1;transform:translate(var(--wx),var(--wy)) scale(${ZS})}
.sns-sync.s-b.s-bfull .y-ipad.b{transform:translate(${-BZB}px,${-BZB}px) scale(1);transition:transform .8s cubic-bezier(.3,.7,.2,1)}
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
.sns-sync .y-bn{position:absolute;left:20px;top:20px;width:585px;height:169.4px;border-radius:18px;padding:13.5px;${glass}}
.sns-sync .y-bn .e{font-size:8.24px;font-weight:500;color:#3F529F}
.sns-sync .y-bn .ti{font-size:14.24px;font-weight:600;margin-top:3px;color:#292D38}
.sns-sync .y-bn .av{position:absolute;right:13.5px;top:13.5px;width:39px;height:39px;display:grid;place-items:center}
.sns-sync .y-bn .av svg{width:22.5px;height:22.5px;fill:none;stroke:#292D38;stroke-width:1.5}
.sns-sync .y-bn .d{font-size:9.74px;color:#646A75;margin-top:6px}
.sns-sync .y-bn .s{position:relative;height:12px;margin-top:4.5px}
.sns-sync .y-bn .s span{position:absolute;inset:0;display:flex;align-items:center;gap:4.5px;font-size:9.74px;color:#646A75;white-space:nowrap;transition:opacity .3s ease}
.sns-sync .y-st1 svg{width:9.74px;height:9.74px;animation:ysp .8s steps(8) infinite}
.sns-sync .y-st2{opacity:0}.sns-sync .y-st2 svg{width:11px;height:11px;fill:none;stroke:currentColor;stroke-width:1.5}
.sns-sync.s-synced .y-st1{opacity:0}.sns-sync.s-synced .y-st2{opacity:1}
.sns-sync .y-bn .ac{position:absolute;left:13.5px;top:108px;display:flex;align-items:center;gap:3px;font-size:9.74px;font-weight:600;color:#3F529F}
.sns-sync .y-bn .ac svg{width:9.74px;height:9.74px;fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
.sns-sync .y-bn .pages{position:absolute;left:0;right:0;top:150.3px;display:flex;justify-content:center;gap:6px}
.sns-sync .y-bn .pages i{width:5.2px;height:5.2px;border-radius:50%;background:#292D38;opacity:.25}.sns-sync .y-bn .pages i:first-child{opacity:.85}
@keyframes ysp{to{transform:rotate(360deg)}}
@media(prefers-reduced-motion:reduce){.sns-sync .y-st1 svg{animation:none}}
.sns-sync .y-hd{position:absolute;left:${X0 + 2}px;font-size:21px;display:flex;align-items:baseline;gap:9px;white-space:nowrap}
.sns-sync .y-hd small{font-size:13px;color:#8C919B}
.sns-sync .y-it{position:absolute;width:${CW}px;height:${CH}px;opacity:0;transform:translateY(8px) scale(.96);transition:opacity .35s ease,transform .35s cubic-bezier(.3,.8,.2,1)}
.sns-sync .y-it.on{opacity:1;transform:none}
.sns-sync .y-it .bp{position:absolute;left:34%;top:5%;width:62%;height:90%;border-radius:10px;background:#E6E6E8;opacity:0}
.sns-sync .y-it .pv{position:absolute;left:30%;top:8%;width:66%;height:84%;border-radius:4px;background:#fff center top/cover no-repeat;box-shadow:0 1px 2px rgba(0,0,0,.08)}
.sns-sync .y-it .cv{position:absolute;left:0;top:0;width:90%;height:100%;border-radius:10px;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.05),0 6px 14px -6px rgba(23,27,36,.12);overflow:hidden;transform-origin:50% 60%;transition:width .35s ease,transform .35s cubic-bezier(.3,.8,.2,1)}
.sns-sync.s-mz .y-it.mo .cv{width:80%;transform:rotate(-2.5deg)}
.sns-sync.s-mz .y-it.mo .bp{opacity:1}
.sns-sync.s-mz .y-it.mo .pv{opacity:0}
.sns-sync .y-it .bp,.sns-sync .y-it .pv{transition:opacity .3s ease}
.sns-sync .y-it .dots{position:absolute;z-index:2;left:11px;top:4px;font-size:16px;letter-spacing:1px}
.sns-sync .y-it .n{position:absolute;z-index:2;right:12px;top:7px;font-size:14.4px;color:#646A75;font-variant-numeric:tabular-nums}
.sns-sync .y-it .ic{position:absolute;left:30%;top:31%;width:40%;height:24%;background:${INK};-webkit-mask:center/contain no-repeat;mask:center/contain no-repeat}
.sns-sync .y-it .av{position:absolute;left:6%;top:9%;width:88%;height:62%;background:#fff center bottom/contain no-repeat}
.sns-sync .y-it .t{position:absolute;left:12px;right:8px;bottom:14px;font:16.1px/1.08 var(--serif,"Timeless Serif",Georgia,serif)}
.sns-sync .y-it .t small{display:block;font:11px "Timeless Sans",sans-serif;color:#646A75;margin-bottom:3px}
.sns-sync .y-it .t .f{display:block;font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:1px}
.sns-sync .y-it .t .z{font-size:18px}
.sns-sync .y-sc{position:absolute;width:${SCW}px;opacity:0;transform:translateY(6px);transition:opacity .3s ease,transform .35s cubic-bezier(.3,.8,.2,1)}
.sns-sync.s-mz .y-sc{opacity:1;transform:none}
.sns-sync .y-sc .th{height:${SCH}px;border-radius:5px;background:#fff center top/cover no-repeat;box-shadow:0 1px 2px rgba(0,0,0,.08),0 6px 14px -6px rgba(23,27,36,.14)}
.sns-sync .y-sc p{margin-top:7px;font-size:11.5px;line-height:1.25}
.sns-sync .y-sc p small{display:block;font-size:10.5px;color:#8C919B;margin-top:2px}
.sns-sync.s-open .y-sc.k .th{opacity:0}
.sns-sync .y-rdb{position:absolute;left:24px;top:var(--py);width:${PW}px;height:${PHu}px;overflow:hidden;background:#fff;transform-origin:0 0;
  border-radius:${KR}px;opacity:0;transform:translate(${KX - 24}px,calc(${KY}px - var(--py))) scale(${KS});
  transition:transform .65s cubic-bezier(.3,.75,.15,1),border-radius .65s cubic-bezier(.3,.75,.15,1),opacity .12s linear .5s}
.sns-sync.s-open .y-rdb{opacity:1;transform:none;border-radius:0;transition-delay:0s}
.sns-sync .y-rdm{position:absolute;left:${RX}px;top:${RY}px;width:${RW}px;height:${RH}px}
.sns-sync .y-rdb img,.sns-sync .y-rdb canvas,.sns-sync .y-rdm img,.sns-sync .y-rdm canvas{position:absolute;left:0;top:0;width:100%;height:100%;display:block}
.sns-sync .y-rdb canvas,.sns-sync .y-rdm canvas{mix-blend-mode:multiply}
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

// 首页：个人卡片和作曲家文件夹。
function home(){
  const cmps = [['bach', 'Johann Sebastian', 'Bach', 3, 'th-Chopin_Nocturne_Op9_No1.jpg'], ['beethoven', 'Ludwig van', 'Beethoven', 3, 'op111-annot.jpg'],
    ['chopin', 'Frédéric', 'Chopin', 4, 'th-Chopin_Nocturne_Op9_No1.jpg'], ['haydn', 'Joseph', 'Haydn', 2, 'th-Schumann_Melodie_Op68_No1.jpg']];
  const card = (x, y, n, pv, body, mz) => `<div class="y-it${mz ? ' mo' : ''}" style="left:${x.toFixed(1)}px;top:${y}px"><div class="bp"></div><div class="pv" style="background-image:url(${A}${pv})"></div><div class="cv"><div class="dots">···</div><div class="n">${n}</div>${body}</div></div>`;
  const cmp = (c, f, l) => `<div class="av" style="background-image:url(${A}cmp-${c}.jpg)"></div><div class="t"><span class="f">${f}</span><span class="z">${l}</span></div>`;
  const scores = [['k', 'k545-p1.jpg', snT('Piano Sonata No. 16 in C Major, K. 545')], ['', 'k331-p1.jpg', snT('Piano Sonata No. 11 in A Major, K. 331')], ['', 'k545-ed2.jpg', 'Sonata in C, KV 545']];
  const spin = Array.from({length:8}, (_, i) => `<path d="M12 2v5" transform="rotate(${45*i} 12 12)" opacity="${1 - i*.8/7}"/>`).join('');
  return `<div class="y-bn"><div class="e">${snT('Your space')}</div><div class="ti">${snT('Your profile')}</div>
    <div class="av"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="9.6" r="3.4"/><path d="M5.6 19.1c1.4-2.6 3.8-3.9 6.4-3.9s5 1.3 6.4 3.9"/></svg></div>
    <div class="d">${snT('Photo and settings on this iPad')}</div><div class="s">
      <span class="y-st1"><svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round">${spin}</svg>${snT('Syncing…')}</span>
      <span class="y-st2"><svg viewBox="0 0 24 24"><path d="M7 18.5h10.5a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.6 9.2 4.7 4.7 0 0 0 7 18.5Z"/><path d="m9.6 13.4 2 2 3.6-3.8"/></svg>${snT('Synced {t}', {t:snT('just now')})}</span>
    </div><div class="ac">${snT('Open settings')}<svg viewBox="0 0 24 24"><path d="M4 12h15M13 6l6 6-6 6"/></svg></div><div class="pages"><i></i><i></i></div></div>
    <div class="y-hd" style="top:212px">${snT('Composers')} <small class="y-n">0</small></div>`
    + cmps.map(([c, f, l, n, pv], i) => card(colX(i), R1, n, pv, cmp(c, f, l))).join('')
    + card(colX(0), R2, 3, 'k545-ed2.jpg', cmp('mozart', 'Wolfgang Amadeus', 'Mozart'), 1)
    + scores.map(([c, img, t], i) => `<div class="y-sc ${c}" style="left:${colX(i + 1).toFixed(1)}px;top:${R2}px;transition-delay:${i*.09}s"><div class="th" style="background-image:url(${A}${img})"></div><p>${t}<small>Wolfgang Amadeus Mozart</small></p></div>`).join('');
}

NS['r13/sync-r13'] = function(root, opt){
  opt = opt || {};
  const K = window.SNSKit;
  root.classList.add('sns-sync');
  root.innerHTML = `<div class="y-stage"><div class="y-room"></div><canvas class="y-cv h"></canvas>
    <div class="y-ipad a" aria-hidden="true"><div class="y-bs"><img class="y-pg" src="${A}k545-p1.jpg" alt="" draggable="false"><canvas class="y-ai"></canvas><div class="y-blk"></div></div></div>
    <div class="y-ipad b" aria-hidden="true"><div class="y-bs"><div class="y-home">${home()}</div>
      <div class="y-rdb"><img src="${A}k545-p1.jpg" alt="" draggable="false"><canvas class="y-bi"></canvas></div>
      <i class="y-tap snd m" style="left:${(X0 + CW/2)*LSB}px;top:${(R2 + CH/2)*LSB}px"></i>
      <i class="y-tap snd k" style="left:${KX + SCW*LSB/2}px;top:${KY + SCH*LSB/2}px"></i>
    </div></div>
    <div class="y-dev" aria-hidden="true"><div class="y-scr"><div class="y-app"><div class="y-rdm">
      <img src="${A}k545-p1.jpg" alt="" draggable="false"><canvas class="y-mi"></canvas><canvas class="y-mh"></canvas>
    </div></div></div><i class="y-pen m"></i></div>
    <div class="y-pill" role="status">${DEV}<span>${snT('Also open on {d}', {d: 'iPad mini'})}</span></div></div>`;
  const $ = s => root.querySelector(s), rbox = root.closest('.os-rbox');
  const stage = $('.y-stage'), tapM = $('.y-tap.m'), tapK = $('.y-tap.k'), penM = $('.y-pen.m'), cards = [...root.querySelectorAll('.y-it')];
  const cvA = $('.y-ai'), cvB = $('.y-bi'), cvH = $('.y-cv.h'), cvMI = $('.y-mi'), cvMH = $('.y-mh');
  const scrA = document.createElement('canvas'), scrB = document.createElement('canvas');
  const HP = hairpin(), st = {hn: 0};
  const stroke = (pts, wi) => ({tool: 'crayon', color: PURPLE, w: K ? K.WIDTHS.crayon[wi]*1.33 : 6, op: 1, pts});
  let k = 1, dpr = 1, fh = H, km = 1, kn = 1, pg = {x: 24, y: 41};

  function layout(){
    const w = root.clientWidth; if (!w) return;
    k = w/W; dpr = Math.min(2, window.devicePixelRatio || 1);
    fh = root.clientHeight ? Math.round(W*root.clientHeight/w) : H;
    stage.style.height = fh + 'px'; stage.style.transform = `scale(${k})`;
    root.style.setProperty('--ms', k < .5 ? 1.45 : 1);
    let room = '#F7F6F2';
    for (let el = rbox?.parentElement; el; el = el.parentElement){
      const bg = getComputedStyle(el).backgroundColor;
      if (bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent'){ room = bg; break; }
    }
    const img = opt.board?.()?.querySelector('img.k-page'), ink = opt.board?.()?.querySelector('canvas.k-ink');
    pg = {x: parseFloat(img?.style.left) || 24, y: parseFloat(img?.style.top) || Math.max(16, (fh - PHu)/2)};
    const v = {'--wx': (W - (W + 2*BZB)*ZS)/2, '--wy': (fh - (fh + 2*BZB)*ZS)/2,
      '--sx': W - DR - DW*SS, '--sy': fh - DB - DH*SS, '--fh': fh, '--srb': rbox ? parseFloat(getComputedStyle(rbox).borderTopLeftRadius)/k || 26 : 26, '--py': pg.y};
    for (const n in v) root.style.setProperty(n, v[n] + 'px');
    root.style.setProperty('--ss', SS); root.style.setProperty('--room', room);
    for (const tap of [tapM, tapK]) tap.style.setProperty('--dotu', Math.max(18, 30*k)/k/ZS + 'px');
    km = k*dpr; kn = k*dpr*SS*AS*RW/PW;
    Object.assign(cvH.style, {left: pg.x + 'px', top: pg.y + 'px', width: PW + 'px', height: PHu + 'px'});
    cvA.width = ink?.width || Math.round(W*km); cvA.height = ink?.height || Math.round(H*km);
    for (const c of [cvB, cvH]){ c.width = Math.round(PW*km); c.height = Math.round(PHu*km); }
    for (const c of [cvMI, cvMH]){ c.width = Math.round(PW*kn); c.height = Math.round(PHu*kn); }
    scrA.width = cvH.width; scrA.height = cvH.height; scrB.width = cvMI.width; scrB.height = cvMI.height;
    drawAll();
  }

  function clear(c){ const g = c.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height); return g; }
  function put(g, pts, scr, kk){ if (!K || !pts.length) return; g.setTransform(kk, 0, 0, kk, 0, 0); K.drawStroke(g, stroke(pts, 0), scr, kk); }
  function drawA(){ const g = clear(cvA), ink = opt.board?.()?.querySelector('canvas.k-ink'); if (ink?.width) g.drawImage(ink, 0, 0, ink.width, ink.height, 0, 0, cvA.width, cvA.height); }
  function copyPage(c){
    const g = clear(c), ink = opt.board?.()?.querySelector('canvas.k-ink');
    if (ink?.width){ const s = ink.width/W; g.drawImage(ink, pg.x*s, pg.y*s, PW*s, PHu*s, 0, 0, c.width, c.height); }
  }
  const drawB = () => copyPage(cvB), drawMI = () => copyPage(cvMI);
  const drawH = () => put(clear(cvH), HP, scrA, km);
  function drawMH(){ const g = clear(cvMH); if (st.hn > 0) put(g, st.hn >= 1 ? HP : K.cut(HP, st.hn), scrB, kn); }
  function drawAll(){ drawA(); drawB(); drawMI(); drawMH(); drawH(); }

  const END = [{}, {bare: 1, room: 1, a: 1, aoff: 1}, {bare: 1, room: 1, a: 1, aoff: 1, agone: 1, b: 1, synced: 1, cards: 5}, {}, {dev: 1, pill: 1, hp: 1}];
  function showCards(n){ cards.forEach((c, i) => c.classList.toggle('on', i < n)); $('.y-n').textContent = n; }
  function show(e){
    for (const c of ['room','a','afull','aoff','agone','b','bfull','synced','mz','open','dev','pill','hp']) root.classList.toggle('s-' + c, !!e[c]);
    rbox?.classList.toggle('sy-bare', !!e.bare); showCards(e.cards || 0);
  }
  function pensOff(){ penM.classList.remove('on', 'up'); for (const tap of [tapM, tapK]) tap.classList.remove('on', 'dn'); }
  function fill(n){ st.hn = n >= 4 ? 1 : 0; drawAll(); }

  /* ---------- 播放 ---------- */
  const DUR = [0, 3000, 4000, 4400, 4500];
  const ease = p => p < .5 ? 2*p*p : 1 - Math.pow(-2*p + 2, 2)/2;
  let tok = null, cur = 0, done = true, t0 = 0;
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
      drawA(); root.classList.add('s-now'); show({room:1, a:1, afull:1}); void root.offsetWidth;
      requestAnimationFrame(() => root.classList.remove('s-now'));
      await wait(350); root.classList.remove('s-afull'); rbox?.classList.add('sy-bare');
      await wait(1900); root.classList.add('s-aoff');
      await wait(750);
    } else if (n === 2){
      show({...END[1], agone:1});
      await wait(300); root.classList.add('s-b');
      await wait(800); showCards(1);
      for (let i = 2; i <= 5; i++){ await wait(260); showCards(i); }
      await wait(560); root.classList.add('s-synced');
      await wait(1300);
    } else if (n === 3){
      drawB(); tapM.classList.add('on');
      await wait(450); K.rip(tapM); tapM.classList.add('dn');
      await wait(120); tapM.classList.remove('dn');
      await wait(80); tapM.classList.remove('on'); root.classList.add('s-mz');
      await wait(850); tapK.classList.add('on');
      await wait(450); K.rip(tapK); tapK.classList.add('dn');
      await wait(120); tapK.classList.remove('dn');
      await wait(80); tapK.classList.remove('on'); root.classList.add('s-open');
      await wait(850); root.classList.add('s-bfull'); rbox?.classList.remove('sy-bare');
      await wait(850); root.classList.add('s-now'); show(END[3]); void root.offsetWidth;
      requestAnimationFrame(() => root.classList.remove('s-now'));
      await wait(550);
    } else if (n === 4){
      st.hn = 0; drawMI(); drawMH(); drawH(); root.classList.add('s-dev');
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
    n = Math.max(0, Math.min(4, n|0));
    if (!animate || RM || n === 0 || !K){ snap(n, soft); cur = n; done = true; return; }
    snap(n - 1);
    const t = tok = {dead: false};
    (async () => {
      for (let j = n; j <= (only ? n : 4); j++){
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
    beats: 4,
    get beatNow(){ return cur; }, get busy(){ return !!tok; },
    get beatFrac(){ if (done || !tok) return cur ? 1 : 0; return Math.min(1, (performance.now() - t0)/DUR[cur]); },
    play(){ go(RM ? 4 : 1, true); },
    go(n){ go(n, true); },
    one(n){ go(n, true, true); },
    beat(n, soft){ go(n, false, false, soft); },
    reset(){ go(0, false); },
    visible(on){ if (!on && tok){ snap(cur); done = true; } },
    destroy(){ stop(); rbox?.classList.remove('sy-bare'); ro.disconnect(); root.removeEventListener('pointerdown', onDown); root.innerHTML = ''; }
  };
};
})();
