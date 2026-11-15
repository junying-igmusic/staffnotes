/* r13 一张谱专用副本（取自 r12/story-r12.js）：点按提示统一成 dot-r13.css 的圆点（按下缩到 .75 并扩散一圈波纹）；拍 1 圆点拖着 PDF 落下；拍 4 先点 Mozart 文件夹；
   settle 后把非循环动画直接收到终态；rev(n) 动画倒回拍 n、不起计时；dot(px) 设圆点的屏幕直径。
   批注 67–70：字段展开收紧、Save to Library 等字段展示完才出现；文件夹数字一直在（只有收进 K. 545 的两个 +1）；Contemporary 用 App 的留声机图标；zpage(e) 给外面算卡片直接飞进阅读器。 */
/* r9 一张谱样片用的副本（story.js 不动）：多了 zoom(p, ch)——K. 545 卡片被按一下、放大成阅读器，跟着滚动走、可倒放；settle(n)——无动画落到拍 n 终态。
   以下是原 story.js 的说明。
   StaffNotes 官网 · 功能区：自动识别 → 图书馆，一条四拍的故事（r8 起停在拍 4：K. 545 已在 Mozart 文件夹里，不再点开；拍 5 的阅读器和点 Andante 代码保留在下面，LAST=4 时不会播到，翻页区块 turns.js 可照搬）
   拍 1：一份没名字的 PDF 落下；
   拍 2：导入卡片，版面照 App 的 ScoreDetailSheet.importSummary + movementChoices + fieldChoices：Previous / Import Score / Skip，缩略图旁三行（标题、作曲家·生卒、时期·时长），Contents 三个乐章（p. 页码、调性、时长、勾选），Choose individual fields，Save to Library；
          卡片停稳后点一下 Choose individual fields，照 App fieldChoices 的 DisclosureGroup 展开，卡片里的列表往上滚，露出识别到的字段（标题、作曲家、生卒、编号、体裁、时期、创作年份、调性、时长、主奏乐器），停一会儿滚回顶部，Save to Library 这时才出现，再按它；
   拍 3：卡片收起，谱子分别飞进 Mozart 作曲家文件夹和 Classical 时期文件夹，数字 +1（未打开的文件夹正放、封面不透明）；
   拍 4：点开 Mozart 文件夹（照 App：文件夹收窄微倾，谱子排在右边），新来的 K. 545 在里面，点它；
   拍 5：从被点的那张谱子放大成阅读器，周围就是网页底色；先停在第一乐章第 1 页，按压圆点出现、停一下、按下「2. Andante »」（按钮照 App 的 glass 按下态微微放大变亮，圆点缩小并扩散一圈波纹），才换到 Andante 第一页（5 / 12）。
   自动连播：play() 从拍 1 开始，每拍按 DUR 播完自动进下一拍，拍 5 播完停在终态；go(n) 直接切到拍 n 之前的终态再播拍 n；reset() 无动画回到起点。 */
(function(){
window.SNSims = window.SNSims || {};
const W = 780, H = 580, A = (document.currentScript && document.currentScript.src) ? new URL('../assets/', document.currentScript.src).href : 'components/assets/';
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const LAST = 4;
// 多语言：界面字走 i18n-r13.js 的 snT（词表 i18n/organize.json）；作曲家名、乐章速度术语、文件名照 App 不翻。时长照 App ScorePresentation.duration：中文「分钟」，德语小数逗号加「Min.」
const snT = (s, v) => window.snT ? window.snT(s, v) : s.replace(/\{(\w+)\}/g, (m, k) => v && k in v ? v[k] : m);
const min = v => snT('{n} min', {n: window.SN_LANG === 'de' ? String(v).replace('.', ',') : v});

// 图书馆卡片沿用 App 的 LibraryCardMetrics：145:205，列间距 18
const CW = 134.8, CH = 190, GAP = 18, X0 = 17, R1 = 76, R2 = 346, R3 = R1 + CH + 30;
const colX = c => X0 + c*(CW+GAP);
// 文档原始尺寸 170×246；拍 1 放大居中，拍 2 缩成导入卡片里的缩略图，拍 3 缩进两个文件夹
const DW = 170, DH = 246;
// 批注 80：拍 1 落下的 PDF 原来只放大 1.3 倍，太小；现在桌面 1.9 倍，手机窄版 2.2 倍（--ds）
// 导入卡片
// App 里 Import Score 是 720pt 宽的 sheet，这里按 KW/720 ≈ .89 缩：边距 40→36，缩略图 159→141，行高 44→39
const KX = 70, KY = 10, KW = 640, KH = 560, TS = 141/170, TX = 36, TY = 72;
// 文件夹里的谱子卡片（App 里比文件夹卡片略宽）
const SW = 136, SH = 192;
// 阅读器谱纸 410 宽、居中；拍 5 从卡片缩略图放大到它。T5：按下「2. Andante »」的时刻（先在第 1 页停约 1.2 秒）
const VX = (W-410)/2, ZS = SW/410, T5 = 2.9;
// 手机：只看 ${VN} 宽的一段
const VN = 640;
// 手机拍 3：第 2–5 列在 VN 宽的窗口里居中
const PN = (colX(1) + colX(4) + CW)/2 - VN/2;
// 拍 2 字段展开：TF 时点开，FS 是卡片列表往上滚的距离（十行字段 39 高，从 Choose individual fields 那一行露到最后一行）
const TF = 4.1, FS = 394, FR = 39;
// 字段展开要紧凑：TF+.12 起列表 FU 秒滚上去（字段跟着很快一行行亮起），停 FH 秒，FD 秒滚回顶；滚回来 Save to Library 才出现，TV 时圆点按它
const FU = .55, FH = .8, FD = .5, FL = FU + FH + FD, FP = [FU/FL, (FU + FH)/FL].map(v => (v*100).toFixed(1) + '%'), TV = TF + .12 + FL + .35;
const into = (c, rowY, s=.3) => `translate(${colX(c)+CW/2-DW*s/2}px,${rowY+CH*.48-DH*s/2}px) scale(${s})`;
const G = n => `.sns-story.g${n}`;

const CSS = `
/* 批注 81：只裁左右、上下放开。原来靠 overflow:clip visible，不认它的浏览器（Safari）退回 hidden，把导入卡片落在底下的阴影齐刷刷切掉，成了一道没有渐变的黑边；改用 clip-path 上下各留 400 px */
.sns-story{position:relative;width:100%;aspect-ratio:${W}/${H};--k:1;--ds:1.9;clip-path:inset(-400px 0 -400px 0)}
.sns-story.narrow{aspect-ratio:${VN}/${H};--ds:2.2}
/* 批注 77：手机竖屏一行只放得下 4 个文件夹，拍 1–3 收起第 1 列（Bach、Baroque），其余 4 列居中，标题对齐它们；拍 4 镜头左移时 Bach 再淡入 */
.sns-story.narrow .hd{left:${colX(1)+2}px}
.sns-story.narrow:not(.g4) .it.c0{opacity:0;transition-delay:0s}
.sns-story.narrow[data-s="4"] .hd,.sns-story.narrow[data-s="5"] .hd{left:${X0+2}px}
.sns-story *{box-sizing:border-box;margin:0;padding:0}
.sns-story .st{position:absolute;left:0;top:0;width:${W}px;height:${H}px;transform-origin:0 0;transition:transform calc(.9s*var(--k)) cubic-bezier(.2,.7,.2,1);font-family:"Timeless Sans",-apple-system,system-ui,sans-serif;color:#292D38;letter-spacing:-.01em;-webkit-font-smoothing:antialiased}
.sns-story.cut{--k:0}

/* 文档：两份叠在一起，拍 3 才分开 */
.sns-story .doc{position:absolute;left:0;top:0;width:${DW}px;height:${DH}px;transform-origin:0 0;z-index:5;
  transition:transform calc(.9s*var(--k)) cubic-bezier(.2,.7,.2,1),opacity calc(.5s*var(--k)) ease;opacity:0;
  transform:translate(calc(${W/2}px - ${DW/2}px*var(--ds)),-60px) scale(var(--ds)) rotate(-7deg)}
.sns-story .doc .pg{position:absolute;inset:0;border-radius:6px;background:#fff url(${A}k545-p1.jpg) center top/cover;box-shadow:0 1px 3px rgba(0,0,0,.08),0 18px 40px -14px rgba(23,27,36,.28);overflow:hidden}
.sns-story .doc.b .pg{box-shadow:none}
.sns-story .scan{position:absolute;left:-10%;right:-10%;top:0;height:34%;background:linear-gradient(to bottom,rgba(63,82,159,0),rgba(63,82,159,.16) 85%,rgba(63,82,159,.55) 100%);opacity:0;transform:translateY(-100%)}
.sns-story .fn{position:absolute;left:50%;top:100%;margin-top:calc(18px/var(--ds));transform:translateX(-50%) scale(calc(1.3/var(--ds)));transform-origin:50% 0;white-space:nowrap;font-size:11px;color:#646A75;padding:3px 9px;border-radius:9px;background:rgba(41,45,56,.06);transition:opacity calc(.3s*var(--k))}

.sns-story[data-s="1"] .doc{opacity:1;transform:translate(calc(${W/2}px - ${DW/2}px*var(--ds)),calc(${H/2-18}px - ${DH/2}px*var(--ds))) scale(var(--ds)) rotate(-1.5deg);transition-duration:calc(1.05s*var(--k)),calc(.35s*var(--k))}
.sns-story[data-s="2"] .doc{opacity:1;transform:translate(${KX+TX}px,${KY+TY}px) scale(${TS});transition-delay:calc(.08s*var(--k))}
.sns-story[data-s="2"] .doc .pg{box-shadow:0 1px 3px rgba(0,0,0,.08),0 6px 16px -8px rgba(23,27,36,.2)}
${G(2)} .fn{opacity:0}
.sns-story[data-s="2"] .scan{animation:snsScan calc(1.5s*var(--k)) calc(.55s*var(--k)) cubic-bezier(.45,0,.55,1) both}
@keyframes snsScan{0%{opacity:0;transform:translateY(-100%)}12%{opacity:1}88%{opacity:1}100%{opacity:0;transform:translateY(300%)}}
${G(3)} .doc{opacity:0;transition:transform calc(1s*var(--k)) cubic-bezier(.55,0,.25,1) calc(.3s*var(--k)),opacity calc(.25s*var(--k)) ease calc(1.12s*var(--k))}
${G(3)} .doc.a{transform:${into(4,R1)}}
${G(3)} .doc.b{transform:${into(1,R2)};transition-delay:calc(.42s*var(--k)),calc(1.24s*var(--k))}

/* 拍 2：导入卡片，照 App 的 Import Score */
.sns-story .card{position:absolute;left:${KX}px;top:${KY}px;width:${KW}px;height:${KH}px;border-radius:24px;background:#fff;box-shadow:0 1px 3px rgba(170,178,197,.25),0 24px 60px -24px rgba(41,45,56,.28);
  opacity:0;transform:translateY(24px) scale(.97);transition:opacity calc(.5s*var(--k)) ease,transform calc(.7s*var(--k)) cubic-bezier(.2,.7,.2,1)}
.sns-story[data-s="2"] .card{opacity:1;transform:none}
/* 批注 81：手机窄版卡片和窗口一样宽，原来的阴影往两边扩出去被截成硬边；窄版的阴影只往下落，不出左右边 */
.sns-story.narrow .card{box-shadow:0 1px 3px rgba(170,178,197,.25),0 30px 44px -38px rgba(41,45,56,.34)}
${G(3)} .card{opacity:0;transform:scale(.94);transition-delay:calc(.15s*var(--k))}
.sns-story .sb{-webkit-text-stroke:.35px currentColor}
.sns-story .card .h{position:absolute;left:0;right:0;top:19px;text-align:center;font-size:15px;line-height:20px}
.sns-story .card .nb{position:absolute;top:10px;height:38px;padding:0 14px;border-radius:19px;display:grid;place-items:center;font-size:15px;color:#3F529F;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.06),0 4px 14px -6px rgba(41,45,56,.18),inset 0 0 0 .5px rgba(0,0,0,.05)}
.sns-story .meta{position:absolute;left:${TX+141+20}px;right:36px;top:${TY+3}px}
.sns-story .meta>div{position:relative;min-height:20px}
.sns-story .meta>div+div{margin-top:9px}
.sns-story .meta .m1{font-size:18px;line-height:1.25}
.sns-story .meta .m2{font-size:15px;color:#8A8D96}
.sns-story .meta .m3{font-size:13.3px;color:#8A8D96}
.sns-story .ct{position:absolute;left:36px;right:36px;top:300px}
.sns-story .ch{position:relative;display:flex;justify-content:space-between;align-items:center;height:36px;font-size:15px;border-bottom:1px solid #ECECEE}
.sns-story .mr{position:relative;display:grid;grid-template-columns:27px 1fr 75px 111px 86px 32px;align-items:center;height:39px;margin-left:3px;border-bottom:1px solid #ECECEE;font-size:15px}
.sns-story .mr>.rx:first-child{text-align:center;padding-right:7px;font-variant-numeric:tabular-nums}
.sns-story .mr .k,.sns-story .mr .d{color:#8A8D96;text-align:right;padding-right:0}
.sns-story .mr .pp{justify-self:end}
.sns-story .cf{position:relative;display:flex;justify-content:space-between;align-items:center;height:39px;margin-top:18px;font-size:15px;border-bottom:1px solid #ECECEE}
/* 标题栏下面是 App sheet 的列表：点开 Choose individual fields 后列表在卡片里往上滚，缩略图跟着滚到标题栏下面 */
.sns-story .bd{position:absolute;left:0;right:0;top:56px;bottom:46px;overflow:hidden;-webkit-mask:linear-gradient(#000 calc(100% - 14px),transparent);mask:linear-gradient(#000 calc(100% - 14px),transparent)}
.sns-story .bi{position:absolute;left:0;right:0;top:-56px;height:${KH+FS}px}
.sns-story .cf .ex{display:block;transition:transform calc(.32s*var(--k)) cubic-bezier(.2,.7,.2,1)}
.sns-story[data-s="2"] .cf .ex{transform:rotate(90deg);transition-delay:calc(${TF+.08}s*var(--k))}
.sns-story .fr{display:grid;grid-template-columns:27px 160px 1fr 32px;align-items:center;height:${FR}px;border-bottom:1px solid #ECECEE;font-size:15px;opacity:0;transition:opacity calc(.2s*var(--k))}
.sns-story .fr svg{display:block}
.sns-story .fr .fy{color:#8A8D96}
.sns-story .fr .fk{justify-self:end;width:18px;height:18px;border-radius:50%;background:#3F529F;display:grid;place-items:center}
.sns-story[data-s="2"] .fr{opacity:1;transition-delay:calc((${TF+.15}s + var(--i)*.035s)*var(--k))}
.sns-story[data-s="2"] .bi{animation:snsFoB calc(${FL}s*var(--k)) calc(${TF+.12}s*var(--k)) both}
.sns-story[data-s="2"] .doc{animation:snsFoD calc(${FL}s*var(--k)) calc(${TF+.12}s*var(--k)) both}
@keyframes snsFoB{0%{translate:0 0;animation-timing-function:cubic-bezier(.45,0,.2,1)}${FP[0]}{translate:0 -${FS}px}${FP[1]}{translate:0 -${FS}px;animation-timing-function:cubic-bezier(.45,0,.2,1)}100%{translate:0 0}}
@keyframes snsFoD{0%{translate:0 0;clip-path:inset(${(-16/TS).toFixed(2)}px -60px -60px);animation-timing-function:cubic-bezier(.45,0,.2,1)}${FP[0]}{translate:0 -${FS}px;clip-path:inset(${((FS-16)/TS).toFixed(2)}px -60px -60px)}${FP[1]}{translate:0 -${FS}px;clip-path:inset(${((FS-16)/TS).toFixed(2)}px -60px -60px);animation-timing-function:cubic-bezier(.45,0,.2,1)}100%{translate:0 0;clip-path:inset(${(-16/TS).toFixed(2)}px -60px -60px)}}
.sns-story .cb{justify-self:end;width:18px;height:18px;border-radius:50%;background:#3F529F;display:grid;place-items:center;transform:scale(.4);opacity:0;transition:opacity calc(.25s*var(--k)),transform calc(.4s*var(--k)) cubic-bezier(.3,1.6,.5,1)}
.sns-story .rx{opacity:0;transform:translateY(6px);transition:opacity calc(.4s*var(--k)),transform calc(.5s*var(--k)) cubic-bezier(.2,.7,.2,1)}
.sns-story .sk{position:absolute;left:0;top:50%;margin-top:-5px;height:10px;border-radius:5px;background:linear-gradient(90deg,#EFEFF1 0%,#F8F8FA 40%,#EFEFF1 80%);background-size:300% 100%;transition:opacity calc(.3s*var(--k))}
.sns-story .mr .sk{left:27px}
.sns-story .pp{display:flex;align-items:center;gap:2px;color:#8A8D96;font-variant-numeric:tabular-nums;opacity:0;transition:opacity calc(.2s*var(--k))}
.sns-story .pp .dg{display:block;height:18px;overflow:hidden;line-height:18px}
.sns-story .pp .dg>span{display:flex;flex-direction:column;transition:transform calc((.25s + var(--n)*.065s)*var(--k)) cubic-bezier(.3,0,.2,1)}
.sns-story[data-s="2"] .pp{opacity:1;transition-delay:calc((2.35s + var(--j)*.3s)*var(--k))}
.sns-story[data-s="2"] .pp .dg>span{transform:translateY(calc((1 - var(--n))*18px));transition-delay:calc((2.35s + var(--j)*.3s)*var(--k))}
.sns-story[data-s="2"] .sk{animation:snsSk 1.2s linear infinite}
@keyframes snsSk{to{background-position:-300% 0}}
.sns-story[data-s="2"] .rx,.sns-story[data-s="2"] .cb{opacity:1;transform:none;transition-delay:calc((.75s + var(--i)*.2s)*var(--k))}
.sns-story[data-s="2"] .cb{transition-delay:calc((.9s + var(--i)*.2s)*var(--k))}
.sns-story[data-s="2"] .sk{opacity:0;transition-delay:calc((.75s + var(--i)*.2s)*var(--k))}
/* Save to Library：等字段展示完、列表滚回顶才浮上来，随后圆点按它 */
.sns-story .sv{position:absolute;left:50%;bottom:12px;height:32px;margin-left:-62px;width:124px;border-radius:16px;background:#3F529F;color:#fff;font-size:15px;display:grid;place-items:center;opacity:0;translate:0 8px;transition:opacity calc(.3s*var(--k)),translate calc(.45s*var(--k)) cubic-bezier(.2,.7,.2,1)}
.sns-story[data-s="2"] .sv{opacity:1;translate:0 0;transition-delay:calc(${TF+.12+FL}s*var(--k));animation:snsTap calc(.35s*var(--k)) calc(${TV+.2}s*var(--k)) ease both}
/* 德语「In Mediathek sichern」比 124 px 宽：按钮跟着字宽，仍然居中 */
:root:lang(de) .sns-story .sv{left:0;right:0;width:max-content;margin:0 auto;padding:0 16px}
.sns-story .tp{opacity:0;--tl:.7s}
.sns-story .tp::after{content:"";position:absolute;inset:0;border-radius:50%;border:calc(var(--dotu,30px)*.06) solid rgba(41,45,56,.28);opacity:0;pointer-events:none}
.sns-story[data-s="2"] .tp.t2{--td:${TV}s}
.sns-story[data-s="2"] .tp.t2f{--td:${TF-.2}s}
.sns-story[data-s="4"] .tp.t4{--td:0s}
.sns-story[data-s="2"] .tp.t2,.sns-story[data-s="2"] .tp.t2f,.sns-story[data-s="4"] .tp.t4{animation:snsTp calc(var(--tl)*var(--k)) calc(var(--td)*var(--k)) linear both}
.sns-story[data-s="2"] .tp.t2::after,.sns-story[data-s="2"] .tp.t2f::after,.sns-story[data-s="4"] .tp.t4::after{animation:snd-rip calc(.5s*var(--k)) calc((var(--td) + var(--tl)*.38)*var(--k)) ease-out both}
/* 拍 1：圆点按住 PDF 一路拖下来，落定后松开、淡出 */
.sns-story .tp.t1d{z-index:6}
.sns-story[data-s="1"] .tp.t1d{animation:snsDragT calc(1.05s*var(--k)) cubic-bezier(.2,.7,.2,1) both,snsDragP calc(1.5s*var(--k)) linear both}
.sns-story[data-s="1"] .tp.t1d::after{animation:snd-rip calc(.5s*var(--k)) calc(.02s*var(--k)) ease-out both}
@keyframes snsDragT{0%{translate:0 calc(${DH/2}px*var(--ds) - ${60+H/2-18}px)}100%{translate:0 0}}
@keyframes snsDragP{0%{opacity:0;scale:1}6%{opacity:1;scale:.75}70%{opacity:1;scale:.75}80%{opacity:1;scale:1}100%{opacity:0;scale:1}}
@keyframes snsTap{50%{transform:scale(.93)}100%{transform:none}}
@keyframes snsTp{0%{opacity:0;scale:1}22%{opacity:1;scale:1}38%{opacity:1;scale:.75}60%{opacity:1;scale:.75}74%{opacity:1;scale:1}100%{opacity:0;scale:1}}

/* 图书馆：卡片照 App，未打开时正放、封面实色 */
.sns-story .lib{position:absolute;inset:0;pointer-events:none;transition:opacity calc(.4s*var(--k))}
.sns-story .hd{position:absolute;left:${X0+2}px;font-size:21px;display:flex;align-items:baseline;gap:9px;white-space:nowrap;opacity:0;transform:translateY(10px);transition:opacity calc(.4s*var(--k)),transform calc(.6s*var(--k)) cubic-bezier(.2,.7,.2,1),left calc(.9s*var(--k)) cubic-bezier(.2,.7,.2,1)}
.sns-story .hd small{font-size:13px;color:#8C919B}
.sns-story .it{position:absolute;width:${CW}px;height:${CH}px;opacity:0;transform:translateY(16px) scale(.97);transition:opacity calc(.45s*var(--k)),transform calc(.7s*var(--k)) cubic-bezier(.2,.7,.2,1)}
${G(3)} .hd,${G(3)} .it{opacity:1;transform:none;transition-delay:calc((.2s + var(--i)*.05s)*var(--k))}
.sns-story .bp{position:absolute;left:34%;top:5%;width:62%;height:90%;border-radius:10px;background:#E6E6E8;opacity:0;transition:opacity calc(.4s*var(--k))}
.sns-story .pv{position:absolute;left:30%;top:8%;width:66%;height:84%;border-radius:4px;background:#fff center top/cover no-repeat;box-shadow:0 1px 2px rgba(0,0,0,.08);transition:opacity calc(.3s*var(--k))}
.sns-story .pv.new{opacity:0;transition:opacity calc(.3s*var(--k)),translate calc(.5s*var(--k)) cubic-bezier(.2,.7,.2,1);translate:-14px 0}
${G(3)} .pv.new{opacity:1;translate:0 0;transition-delay:calc(1.2s*var(--k))}
.sns-story .cv{position:absolute;left:0;top:0;width:90%;height:100%;border-radius:10px;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.05),0 6px 14px -6px rgba(23,27,36,.12);overflow:hidden;transform-origin:50% 60%;transition:transform calc(.6s*var(--k)) cubic-bezier(.2,.7,.2,1),width calc(.6s*var(--k)) cubic-bezier(.2,.7,.2,1)}
.sns-story .dots{position:absolute;z-index:2;left:11px;top:4px;font-size:16px;letter-spacing:1px}
.sns-story .n{position:absolute;z-index:2;right:12px;top:7px;height:18px;width:30px;font-size:14.4px;color:#646A75;font-variant-numeric:tabular-nums;text-align:right}
.sns-story .n span{position:absolute;right:0;top:0;transition:opacity calc(.25s*var(--k)),transform calc(.4s*var(--k)) cubic-bezier(.2,.7,.2,1)}
.sns-story .n .b{opacity:0;transform:translateY(8px)}
/* 只有收进 K. 545 的两个文件夹（.hit）数字 +1：旧数往上走、新数补上；其他文件夹的数字一直留着（以前这里没限定 .hit，拍 3 起别的文件夹数字全被清掉） */
${G(3)} .hit .n .a{opacity:0;transform:translateY(-8px);transition-delay:calc(1.22s*var(--k))}
${G(3)} .hit .n .b{opacity:1;transform:none;transition-delay:calc(1.22s*var(--k))}
.sns-story .ic{position:absolute;left:30%;top:31%;width:40%;height:24%;background:#292D38;-webkit-mask:center/contain no-repeat;mask:center/contain no-repeat}
.sns-story svg.ic{background:none}
.sns-story .av{position:absolute;left:6%;top:9%;width:88%;height:62%;background:#fff center bottom/contain no-repeat}
.sns-story .t{position:absolute;left:12px;right:8px;bottom:14px;font:16.1px/1.08 var(--serif,"Timeless Serif",Georgia,serif)}
.sns-story .t small{display:block;font:11px "Timeless Sans",sans-serif;color:#646A75;margin-bottom:3px}
.sns-story .t .f{display:block;font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:1px}
.sns-story .t .z{font-size:18px}

/* 拍 4：点开 Mozart。时期一行让开，Mozart 移到第二行最左，照 App 收窄微倾，右边排出它的谱子 */
${G(4)} .per{opacity:0;transform:translateY(20px);transition-delay:calc(.25s*var(--k))}
${G(4)} .hit.cmp{transform:translate(${colX(0)-colX(4)}px,${R3-R1}px);transition-delay:calc(.4s*var(--k))}
${G(4)} .hit.cmp .cv{width:80%;transform:rotate(-2.5deg);transition-delay:calc(.75s*var(--k))}
${G(4)} .hit.cmp .bp{opacity:1;transition-delay:calc(.8s*var(--k))}
${G(4)} .hit.cmp .pv{opacity:0;transition-delay:calc(.55s*var(--k))}
.sns-story .sc{position:absolute;top:${R3}px;width:${SW}px;opacity:0;transform:translateX(-18px);transition:opacity calc(.4s*var(--k)),transform calc(.6s*var(--k)) cubic-bezier(.2,.7,.2,1)}
.sns-story .sc .th{height:${SH}px;border-radius:5px;background:#fff center top/cover no-repeat;box-shadow:0 1px 2px rgba(0,0,0,.08),0 6px 14px -6px rgba(23,27,36,.14)}
.sns-story .sc p{margin-top:7px;font-size:11.5px;line-height:1.25}
.sns-story .sc p small{display:block;font-size:10.5px;color:#8C919B;margin-top:2px}
${G(4)} .sc{opacity:1;transform:none;transition-delay:calc((.9s + var(--i)*.12s)*var(--k))}

/* 拍 5：从被点的那张谱子放大成阅读器（谱纸 410×580 正好是卡片 136×192 的 ${ZS.toFixed(3)} 倍），周围不另铺底色，就是网页本身；
   放大完标题胶囊和底栏淡入，停在第 1 页，${T5}s 时手指按下「2. Andante »」才换页 */
.sns-story .rd{position:absolute;left:0;top:0;width:${W}px;height:${H}px;z-index:8;pointer-events:none;transform-origin:0 0;opacity:0;
  transform:translate(${colX(1)-VX*ZS}px,${R3}px) scale(${ZS});transition:transform calc(.65s*var(--k)) cubic-bezier(.3,.75,.15,1),opacity calc(.12s*var(--k)) linear calc(.5s*var(--k))}
.sns-story[data-s="5"] .rd{opacity:1;transform:none;transition-delay:0s}
.sns-story .rd .ttl,.sns-story .rd .bar{z-index:2;opacity:0;transition:opacity calc(.3s*var(--k))}
.sns-story[data-s="5"] .rd .ttl,.sns-story[data-s="5"] .rd .bar{opacity:1;transition-delay:calc(.55s*var(--k))}
.sns-story .lib{transition:opacity calc(.4s*var(--k))}
.sns-story[data-s="5"] .lib{opacity:0;transition-duration:calc(.35s*var(--k));transition-delay:calc(.08s*var(--k))}
.sns-story[data-s="5"] .sc.k{opacity:0;transition:opacity 0s}
.sns-story .vp{position:absolute;left:${VX}px;top:0;width:410px;border-radius:calc(5px/${ZS});height:${H}px;overflow:hidden}
.sns-story .vp>div{position:absolute;inset:0;background:#fff center top/contain no-repeat;transition:opacity calc(.12s*var(--k))}
.sns-story .vp .p5,.sns-story[data-s="5"] .vp .p1{opacity:0}
.sns-story[data-s="5"] .vp .p5{opacity:1}
.sns-story[data-s="5"] .vp>div{transition-delay:calc(${T5+.15}s*var(--k))}
.sns-story .ttl{position:absolute;left:50%;top:8px;height:22px;transform:translateX(-50%);display:grid;place-items:center;padding:0 11px;border-radius:11px;background:rgba(255,255,255,.9);box-shadow:0 1px 2px rgba(0,0,0,.07),inset 0 0 0 .5px rgba(0,0,0,.06);white-space:nowrap;text-align:center}
.sns-story .ttl>span{grid-area:1/1;font-size:7.2px;line-height:1.12;transition:opacity calc(.2s*var(--k))}
.sns-story .ttl small{display:block;font-size:5.9px;color:#8C919B}
.sns-story .ttl .t2,.sns-story[data-s="5"] .ttl .t1{opacity:0}
.sns-story[data-s="5"] .ttl .t2{opacity:1}
.sns-story[data-s="5"] .ttl>span{transition-delay:calc(${T5+.15}s*var(--k))}
/* 底栏：页码胶囊居中，上一乐章在左、下一乐章在右 */
.sns-story .bar{position:absolute;left:0;right:0;top:${H-30}px;height:22px}
.sns-story .pgc{position:absolute;left:50%;top:0;width:92px;height:22px;margin-left:-46px;display:flex;align-items:center;justify-content:center;gap:5px;border-radius:11px;background:rgba(255,255,255,.9);box-shadow:0 1px 2px rgba(0,0,0,.07),inset 0 0 0 .5px rgba(0,0,0,.06);font-size:8.5px;color:#646A75;overflow:hidden}
.sns-story .pn{position:relative;display:grid;padding:2px 5px;border-radius:4px;background:#EDEDEF;color:#292D38;font-variant-numeric:tabular-nums}
.sns-story .pn span{grid-area:1/1;text-align:center;transition:opacity calc(.12s*var(--k))}
.sns-story .pn .q2,.sns-story[data-s="5"] .pn .q1{opacity:0}
.sns-story[data-s="5"] .pn .q2{opacity:1}
.sns-story[data-s="5"] .pn span{transition-delay:calc(${T5+.15}s*var(--k))}
.sns-story .pgc i{position:absolute;left:11px;bottom:0;height:1.5px;width:calc((92px - 22px)/12);border-radius:1px;background:#3F529F}
.sns-story[data-s="5"] .pgc i{width:calc((92px - 22px)*5/12);transition-delay:calc(${T5+.15}s*var(--k))}
.sns-story .mvb{position:absolute;top:0;height:22px;display:flex;align-items:center;gap:4px;padding:0 9px;border-radius:11px;background:rgba(255,255,255,.9);box-shadow:0 1px 2px rgba(0,0,0,.07),inset 0 0 0 .5px rgba(0,0,0,.06);font-size:8.5px;white-space:nowrap;transition:opacity calc(.2s*var(--k))}
.sns-story .mvb svg{flex:none;width:8px;height:8px}
.sns-story .mvb.nx{left:${W/2+52}px}.sns-story .mvb.pr{right:${W/2+52}px}
.sns-story .mvb.n2,.sns-story .mvb.pr{opacity:0}
.sns-story[data-s="5"] .mvb.n1{opacity:0;transition-delay:calc(${T5+.15}s*var(--k));animation:snsGlass calc(.5s*var(--k)) calc(${T5-.25}s*var(--k)) ease both}
@keyframes snsGlass{35%{transform:scale(1.08);background:#fff;box-shadow:0 2px 9px rgba(41,45,56,.2),inset 0 0 0 .5px rgba(0,0,0,.06)}}
.sns-story[data-s="5"] .mvb.n2,.sns-story[data-s="5"] .mvb.pr{opacity:1;transition-delay:calc(${T5+.2}s*var(--k))}
.sns-story .tp.t5{z-index:3}
.sns-story .rp{position:absolute;z-index:3;width:40px;height:40px;margin:-20px 0 0 -20px;border-radius:50%;border:2px solid rgba(41,45,56,.45);opacity:0;pointer-events:none}
.sns-story[data-s="5"] .tp.t5{animation:snsPress calc(1.5s*var(--k)) calc(${T5-1.05}s*var(--k)) linear both}
.sns-story[data-s="5"] .rp{animation:snsRp calc(.75s*var(--k)) calc(${T5-.1}s*var(--k)) cubic-bezier(.2,.7,.2,1) both}
@keyframes snsPress{0%{opacity:0;transform:scale(1.5);animation-timing-function:cubic-bezier(.2,.7,.2,1)}17%{opacity:1;transform:scale(1)}60%{transform:scale(1);animation-timing-function:cubic-bezier(.4,0,.6,1)}68%{transform:scale(.74)}78%{opacity:1;transform:scale(.8)}100%{opacity:0;transform:scale(.86)}}
/* r9：zoom 时这些元素由脚本逐帧摆位，关掉过渡 */
.sns-story.zm .rd,.sns-story.zm .lib,.sns-story.zm .sc,.sns-story.zm .rd .ttl,.sns-story.zm .rd .bar,.sns-story.zm .tp.tz{transition:none!important}
.sns-story .tp.tz{z-index:9}
@keyframes snsRp{0%{opacity:0;transform:scale(.7)}8%{opacity:.9}100%{opacity:0;transform:scale(2.4)}}
`;

const P = [A+'k545-p1.jpg', A+'th-Chopin_Nocturne_Op9_No1.jpg', A+'th-Brahms_Ballade_Op118_No3.jpg', A+'th-Schumann_Melodie_Op68_No1.jpg', A+'th-Debussy_Feux_dartifice.jpg', A+'k545-ed2.jpg'];
const folderSvg = '<svg class="ic" viewBox="0 0 48 40" fill="none" stroke="#292D38" stroke-width="2.6" stroke-linejoin="round"><path d="M4 9a4 4 0 0 1 4-4h10l5 5h17a4 4 0 0 1 4 4v18a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"/></svg>';
function folder(o, i){
  const pv = `<div class="pv" style="background-image:url(${P[o.pa]})"></div>` + (o.hit ? `<div class="pv new" style="background-image:url(${P[0]})"></div>` : '');
  const body = o.cmp
    ? `<div class="av" style="background-image:url(${A}cmp-${o.cmp}.jpg)"></div><div class="t"><span class="f">${o.first}</span><span class="z">${o.last}</span></div>`
    : `${o.png ? `<div class="ic" style="-webkit-mask-image:url(${A}fld-${o.png}.png);mask-image:url(${A}fld-${o.png}.png)"></div>` : folderSvg}<div class="t"><small>${o.years}</small>${snT(o.label)}</div>`;
  const n = o.hit ? `<span class="a">${o.n}</span><span class="b">${o.n+1}</span>` : `<span class="a">${o.n}</span>`;
  return `<div class="it c${i%5} ${o.cmp?'cmp':'per'}${o.hit?' hit':''}" style="left:${colX(i%5)}px;top:${o.y}px;--i:${o.i}"><div class="bp"></div>${pv}<div class="cv"><div class="dots">···</div><div class="n">${n}</div>${body}</div></div>`;
}

SNSims['r13/story-r13'] = function(root){
  if(!document.getElementById('sns-story-r13-css')){ const s=document.createElement('style'); s.id='sns-story-r13-css'; s.textContent=CSS; document.head.appendChild(s); }
  root.classList.add('sns-story');
  if(RM) root.style.setProperty('--k','0');

  const cmps = [
    {cmp:'bach', first:'Johann Sebastian', last:'Bach', n:3, pa:1},{cmp:'beethoven', first:'Ludwig van', last:'Beethoven', n:2, pa:2},
    {cmp:'chopin', first:'Frédéric', last:'Chopin', n:4, pa:1},{cmp:'haydn', first:'Joseph', last:'Haydn', n:2, pa:3},
    {cmp:'mozart', first:'Wolfgang Amadeus', last:'Mozart', n:1, pa:5, hit:1}];
  const pers = [
    {label:'Baroque', years:'1600 – 1750', png:'baroque', n:3, pa:3},{label:'Classical', years:'1750 – 1820', png:'classical', n:3, pa:5, hit:1},
    {label:'Romantic', years:'1820 – 1900', png:'romantic', n:12, pa:1},{label:'Modern', years:'1900 – 1945', png:'early20', n:6, pa:4},
    // 图标照 App 的 LibraryFolderCoverStyle：period:modern 用 early20，period:contemporary 用 modern（留声机，fld-modern.png 由 App 的 LibraryFolder-modern.pdf 渲成）
    {label:'Contemporary', years:'1945 –', png:'modern', n:3, pa:2}];
  const check = (s=12) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>`;
  // 标题照 App ScoreSavedNames：德语界面用目录里的德语标题，中文界面和英语一样
  const t545 = snT('Piano Sonata No. 16 in C Major, K. 545');
  const meta = [['m1',t545,300],['m2','Wolfgang Amadeus Mozart · 1756 – 1791',230],['m3',`${snT('Classical')} · ${min(11.5)}`,110]];
  const mvs = [['1.','Allegro',snT('C Major'),min(3.5),1],['2.','Andante',snT('G Major'),min(6),5],['3.','Rondo: Allegretto',snT('C Major'),min(1.5),9]];
  const chev = '<svg width="9" height="14" viewBox="0 0 9 14" fill="none" stroke="#292D38" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="m1.5 1.5 5.5 5.5-5.5 5.5"/></svg>';
  const roll = n => `<span class="dg"><span>${Array.from({length:n},(_,i)=>`<span>${i+1}</span>`).join('')}</span></span>`;
  const gl = b => `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#292D38" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="${b?'M12 6l-6 6 6 6M19 6l-6 6 6 6':'M5 6l6 6-6 6M12 6l6 6-6 6'}"/></svg>`;
  const scores = [['k',P[0],t545],['',P[5],'Sonata in C, KV 545']];
  // Choose individual fields 展开后的行：照 App importableFields 的顺序，只放这份谱子识别到的字段；时期是选择器，不带勾
  const ico = d => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#292D38" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const icons = {
    book: '<path d="M12 6.5C10 5 7 4.6 4 5v13c3-.4 6 0 8 1.5 2-1.5 5-1.9 8-1.5V5c-3-.4-6 0-8 1.5zM12 6.5v13"/>',
    person: '<circle cx="12" cy="8.5" r="3.6"/><path d="M5 20c.8-3.6 3.6-5.6 7-5.6s6.2 2 7 5.6"/>',
    music: '<path d="M9 17.5V6l10-2v11.5"/><circle cx="6.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="15.5" r="2.5"/>',
    timer: '<circle cx="12" cy="13.5" r="7"/><path d="M12 10v3.5l2.4 1.6M10 3.5h4"/>',
    piano: '<rect x="3.5" y="5" width="17" height="14" rx="2"/><path d="M9.2 13v6M14.8 13v6M7.8 5v8h2.8V5M13.4 5v8h2.8V5"/>'};
  const fields = [['book','Title',t545,1],['person','Composer','Wolfgang Amadeus Mozart',1],['','Life dates','1756 – 1791',1],
    ['','Catalogue number','K. 545',1],['music','Work type',snT('Piano Sonata'),1],['','Period and Style',snT('Classical'),0],['','Year composed','1788',1],
    ['','Key',snT('C Major'),1],['timer','Estimated duration',min(11.5),1],['piano','Main instruments',snT('Piano'),1]];

  root.innerHTML = `<div class="st">
    <div class="card">
      <div class="nb" style="left:12px">${snT('Previous')}</div><div class="h sb">${snT('Import Score')}</div><div class="nb" style="right:12px">${snT('Skip')}</div>
      <div class="bd"><div class="bi">
      <div class="meta">${meta.map(([c,t,w],i)=>`<div class="${c}"><span class="rx${i?'':' sb'}" style="--i:${i};display:block">${t}</span><i class="sk" style="--i:${i};width:${w}px"></i></div>`).join('')}</div>
      <div class="ct">
        <div class="ch"><span class="rx sb" style="--i:4">${snT('Contents')}</span><i class="sk" style="--i:4;width:80px"></i><span class="cb" style="--i:4">${check()}</span></div>
        ${mvs.map(([n,t,k,d,pg],j)=>`<div class="mr"><span class="rx" style="--i:${j+5}">${n}</span><span class="rx" style="--i:${j+5}">${t}</span><span class="pp" style="--j:${j};--n:${pg}">${snT('p. {n}').replace(/ /g,'&nbsp;').replace('{n}',roll(pg))}</span><span class="rx k" style="--i:${j+5}">${k}</span><span class="rx d" style="--i:${j+5}">${d}</span><span class="cb" style="--i:${j+5}">${check()}</span><i class="sk" style="--i:${j+5};width:${[220,250,280][j]}px"></i></div>`).join('')}
        <div class="cf"><span class="rx" style="--i:8">${snT('Choose individual fields')}</span><span class="rx" style="--i:8"><span class="ex">${chev}</span></span><i class="sk" style="--i:8;width:170px"></i></div>
        ${fields.map(([ic,l,v,c],i)=>`<div class="fr" style="--i:${i}"><span>${ic?ico(icons[ic]):''}</span><span class="fy">${snT(l)}</span><span>${v}</span>${c?`<span class="fk">${check()}</span>`:'<span></span>'}</div>`).join('')}
      </div>
      </div></div>
      <div class="sv">${snT('Save to Library')}</div>
      <i class="tp snd t2" style="left:${KW/2}px;top:${KH-28}px"></i>
      <i class="tp snd t2f" style="left:${KW-41}px;top:${300+36+3*39+18+20}px"></i>
    </div>
    <div class="lib">
      <div class="hd" style="top:${R1-40}px;--i:0">${snT('Composers')} <small>9</small></div>
      ${cmps.map((o,i)=>folder({...o,y:R1,i:i+1},i)).join('')}
      <div class="hd per" style="top:${R2-40}px;--i:3">${snT('Periods')} <small>8</small></div>
      ${pers.map((o,i)=>folder({...o,y:R2,i:i+4},i)).join('')}
      ${scores.map(([c,src,t],i)=>`<div class="sc ${c}" style="left:${colX(i+1)}px;--i:${i}"><div class="th" style="background-image:url(${src})"></div><p>${t}<small>Wolfgang Amadeus Mozart</small></p></div>`).join('')}
      <i class="tp snd t4" style="left:${colX(4)+CW/2}px;top:${R1+CH/2}px"></i>
    </div>
    <i class="tp snd tz" style="left:${colX(1)+SW/2}px;top:${R3+SH/2}px"></i>
    <div class="doc b"><div class="pg"></div></div>
    <div class="doc a"><div class="pg"><div class="scan"></div></div><div class="fn">Scan 2026-11-03.pdf</div></div>
    <i class="tp snd t1d" style="left:${W/2}px;top:${H/2-18}px"></i>
    <div class="rd">
      <div class="ttl"><span class="t1">1. Allegro · ${t545}<small>Wolfgang Amadeus Mozart · 1756 – 1791</small></span><span class="t2">2. Andante · ${t545}<small>Wolfgang Amadeus Mozart · 1756 – 1791</small></span></div>
      <div class="vp"><div class="p1" style="background-image:url(${A}k545-p1.jpg)"></div><div class="p5" style="background-image:url(${A}k545-p5.jpg)"></div></div>
      <div class="bar">
        <div class="mvb pr">${gl(1)}1. Allegro</div>
        <div class="pgc">${snT('Page')}<span class="pn"><span class="q1">1 / 12</span><span class="q2">5 / 12</span></span><i></i></div>
        <div class="mvb nx n1">2. Andante${gl(0)}</div>
        <div class="mvb nx n2">3. Rondo: Allegretto${gl(0)}</div>
      </div>
      <i class="rp" style="left:${W/2+84}px;top:${H-19}px"></i>
      <i class="tp snd t5" style="left:${W/2+84}px;top:${H-19}px"></i>
    </div>
  </div>`;
  const st = root.firstElementChild;

  let cur = 0, zpan = 0, dotPx = 26;
  const fit=()=>{
    const narrow = root.clientWidth < 560; root.classList.toggle('narrow', narrow);
    const s = root.clientWidth/(narrow ? VN : W), pan = narrow ? (cur===3 ? PN : cur===4 ? zpan*(W-VN)/2 : (W-VN)/2) : 0;
    st.style.transform=`translateX(${-pan*s}px) scale(${s})`;
    if(s) root.style.setProperty('--dotu', (dotPx/s).toFixed(2)+'px');
  };
  const ro=new ResizeObserver(fit); ro.observe(root); fit();

  // 自动连播：每拍按 DUR 播完自动进下一拍，拍 5 播完停在终态
  const DUR = [0, 1800, Math.round((TV+.3)*1000), 2800, 2600, Math.round((T5+1.3)*1000)];
  let timer = 0, auto = false, t0 = 0, dur = 0;
  const show = () => { root.dataset.s = String(cur); for(let i=1;i<=LAST;i++) root.classList.toggle('g'+i, cur>=i); fit(); };
  // 不带动画直接落到拍 n 的终态
  const settle = n => {
    root.classList.add('cut'); cur = n; show(); void root.offsetWidth; root.classList.remove('cut');
    try { root.getAnimations({subtree:true}).forEach(a => { if(a.effect && a.effect.getTiming().iterations !== Infinity) a.finish(); }); } catch(e){}
  };
  show();
  function run(){
    clearTimeout(timer); t0 = performance.now(); dur = RM ? 0 : DUR[cur];
    timer = setTimeout(() => { timer = 0; if(auto && cur < LAST){ cur++; show(); run(); } }, dur);
  }
  function go(n, a=true){
    n = Math.max(0, Math.min(LAST, n|0)); clearTimeout(timer); timer = 0; auto = a;
    if(RM || n === 0){ settle(n); t0 = performance.now(); dur = 0; return; }
    settle(n-1); cur = n; show(); run();
  }
  // r9：卡片 → 阅读器，p 0–1 跟滚动走。前 22% 按压（圆点出现、按下、卡片微缩），之后放大；ch 控制标题胶囊和底栏（过场二淡出用）
  const rd = st.querySelector('.rd'), lib = st.querySelector('.lib'), sck = st.querySelector('.sc.k'), tz = st.querySelector('.tp.tz');
  const ttl = rd.querySelector('.ttl'), bar = rd.querySelector('.bar');
  const cl = v => Math.max(0, Math.min(1, v)), lp = (a, b, t) => a + (b - a)*t;
  const io = t => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3)/2;
  let zp = 0, za = 0;
  // eo：r11 一张谱里放大进度由外面给（和外层镜头同一条缓动），不给就按 p 自己算
  function zoom(p, ch = 1, eo){
    p = cl(p); zp = p;
    const on = p > 0; root.classList.toggle('zm', on);
    if(!on){ [rd, lib, sck, tz, ttl, bar].forEach(e => { e.style.opacity = ''; e.style.transform = ''; }); tz.classList.remove('rip'); za = 0; zpan = 0; fit(); return; }
    const a = cl(p/.22), e = eo ?? io(cl((p - .2)/.8));
    if(RM){
      tz.style.opacity = 0; sck.style.transform = '';
      rd.style.transform = 'none'; rd.style.opacity = cl((p - .1)/.8); lib.style.opacity = 1 - cl((p - .1)/.8);
    } else {
      // 圆点：出现 → 按下 → 松开 → 淡出；卡片跟着按下微缩
      const dO = a < .3 ? a/.3 : a < .8 ? 1 : 1 - (a - .8)/.2;
      const dS = a < .4 ? 1 : a < .5 ? lp(1, .75, io((a - .4)/.1)) : a < .62 ? .75 : lp(.75, 1, io(cl((a - .62)/.13)));
      tz.style.opacity = dO; tz.style.transform = `scale(${dS})`;
      if(a >= .5 && za < .5){ tz.classList.remove('rip'); void tz.offsetWidth; tz.classList.add('rip'); }
      za = a;
      const cS = a < .45 ? 1 : a < .65 ? lp(1, .96, (a - .45)/.2) : lp(.96, 1, cl((a - .65)/.2));
      sck.style.transform = `scale(${cS})`;
      const sw = p > .2;
      sck.style.opacity = sw ? 0 : 1; rd.style.opacity = sw ? 1 : 0;
      rd.style.transform = `translate(${lp(colX(1) - VX*ZS, 0, e)}px,${lp(R3, 0, e)}px) scale(${lp(ZS, 1, e)})`;
      lib.style.opacity = 1 - cl((p - .22)/.4);
    }
    const c = cl((p - .86)/.14)*ch; ttl.style.opacity = c; bar.style.opacity = c;
    zpan = RM ? 1 : e; fit();
  }
  return {
    zoom, get zoomNow(){ return zp; },
    // 放大进度 e 时谱页在舞台里的左上角和宽（从 K. 545 卡片到居中的谱纸，都是直线）；一张谱让它从卡片直接飞进阅读器时按这个反算外层
    zpage: e => ({x: lp(colX(1), VX, e), y: lp(R3, 0, e), w: 410*lp(ZS, 1, e)}),
    settle(n){ clearTimeout(timer); timer = 0; auto = false; settle(Math.max(0, Math.min(LAST, n|0))); t0 = performance.now(); dur = 0; },
    get busy(){ return !!timer; },
    beats: LAST, get beatNow(){ return cur; },
    // 当前这一拍播了多少（0–1），给进度条用
    get beatFrac(){ return cur === 0 ? 0 : dur ? Math.min(1, (performance.now()-t0)/dur) : 1; },
    play(){ go(RM ? LAST : 1); },
    go, beat(n){ go(n, false); },
    // 倒放：从当前终态带过渡退回拍 n，不起计时
    rev(n){ clearTimeout(timer); timer = 0; auto = false; cur = Math.max(0, Math.min(LAST, n|0)); show(); t0 = performance.now(); dur = 0; },
    dot(px){ dotPx = px; fit(); },
    reset(){ go(0, false); },
    progress(p){ go(Math.round(p*LAST), false); },
    visible(){},
    destroy(){ ro.disconnect(); clearTimeout(timer); }
  };
};
})();
