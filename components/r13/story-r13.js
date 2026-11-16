/* r17 导入 + 整理：六拍连播，放大进阅读器是拍 7（只由外面的 zoom 驱动）。r13 版备份在 work/r17/bak/story-r13.js，导入合并后的旧三拍在 work/r17/imp2/before/story-merged.js。
   导入三拍都照 App 的真实路径走（小谭 2026-11-15「A，B，A，A，C」）：
   拍 1 公版乐谱下载：图书馆右上角「导入」→ 菜单点「在线曲库」→ 搜 K. 331 → 点作品进「Editions and Parts」→ 谱种从「全部」换成「编订版」→ 选完整乐谱、下载，谱子从缩略图浮起放大到中间；
   拍 2 标注导入：K. 331 让到左后方，「导入」→「导入乐谱」→ 系统「文件」里选带标注的 Op. 111、打开，谱子放大到中间，四种颜色先一起、再红金绿蓝一种一种单独看、最后一起；
   拍 3 PDF 导入：Op. 111 让到右后方，邮件里扫描仪发来的 K. 545 附件点开分享、选 StaffNotes，谱子落到最前面，接拍 4 的识别卡片（小谭：最后一步导入 545，好接上整理）；
   拍 4 乐谱识别：导入卡片，照 App 的 ScoreDetailSheet（批注 67–70：字段展开收紧、Save to Library 等字段展示完才出现）；
   拍 5 自动归档：卡片收起，三份谱子各自飞进作曲家和时期文件夹，数字一份一份往上加；
   拍 6 作曲家文件夹：点开 Mozart，K. 545、K. 331 和原来那份排在右边；拍 7 阅读器从 K. 545 卡片放大出来。
   搜索结果、文件名、扫描仪发件人和主题、2.4 MB、下载次数和页数都是样例数据。
   同一个元素在拍 1 和拍 2 都要播的动画（导入按钮按下、菜单弹出）用不同的 keyframes 名字，否则换拍时不会重播。
   settle(n) 无动画落到拍 n 终态（非循环动画直接收尾）；rev(n) 带过渡退回拍 n、不起计时；zoom(p, ch, eo) 卡片 → 阅读器跟滚动走；zpage(e) 给外面算卡片飞进阅读器；dot(px) 设圆点的屏幕直径。 */
(function(){
window.SNSims = window.SNSims || {};
const W = 780, H = 580, A = (document.currentScript && document.currentScript.src) ? new URL('../assets/', document.currentScript.src).href : 'components/assets/';
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const LAST = 6;
// 多语言：界面字走 i18n-r13.js 的 snT（词表 i18n/organize.json、pens.json）；作曲家名、乐章速度术语、文件名、IMSLP 的版本信息照 App 不翻。时长照 App ScorePresentation.duration：中文「分钟」，德语小数逗号加「Min.」
const snT = (s, v) => window.snT ? window.snT(s, v) : s.replace(/\{(\w+)\}/g, (m, k) => v && k in v ? v[k] : m);
const min = v => snT('{n} min', {n: window.SN_LANG === 'de' ? String(v).replace('.', ',') : v});

// 图书馆卡片沿用 App 的 LibraryCardMetrics：145:205，列间距 18
const CW = 134.8, CH = 190, GAP = 18, X0 = 17, R1 = 76, R2 = 346, R3 = R1 + CH + 30;
const colX = c => X0 + c*(CW+GAP);
// 文档原始尺寸 170×246。所有位置都写成同一串变换 pose：左上角放在 (x, y)、缩放 s、绕中心转 r 度，过渡时逐项插值
const DW = 170, DH = 246;
const pose = (x, y, s, r=0) => `translate(${x}px,${y}px) scale(${s}) translate(${DW/2}px,${DH/2}px) rotate(${r}deg) translate(${-DW/2}px,${-DH/2}px)`;
// mid：中心对准舞台中间偏上 18（横向再挪 dx），缩放取 CSS 变量 v。--ds 是放大到中间（桌面 1.9、手机窄版 2.2），--dp 是让到后面那摞（1.8 / 2.08）
const mid = (dx, v, r) => `translate(calc(${W/2+dx}px - ${DW/2}px*var(${v})),calc(${H/2-18}px - ${DH/2}px*var(${v}))) scale(var(${v})) translate(${DW/2}px,${DH/2}px) rotate(${r}deg) translate(${-DW/2}px,${-DH/2}px)`;
const BIG = mid(0, '--ds', -1.5), PL = mid(-44, '--dp', -5), PR = mid(44, '--dp', 3.5);
// 拍 4 另两份缩成 .9 倍压在导入卡片正下面
const DS = .9, SY = H/2 - 18 - DH*DS/2, UNDER = pose(W/2 - DW*DS/2, SY, DS);
// 导入卡片、在线曲库、邮件：App 里是 720pt 宽的 sheet，这里按 KW/720 ≈ .89 缩：边距 40→36，缩略图 159→141，行高 44→39
const KX = 70, KY = 10, KW = 640, KH = 560, TS = 141/170, TX = 36, TY = 72;
// 拍 1「Editions and Parts」里的文件卡片：缩略图 136×197，谱子下载完从这里浮起来
const FX = 38, FY = 230, FT = .8;
// 拍 2 系统「文件」：FPY 面板顶，FPT 缩略图顶，FPX 第一张左边，缩略图 TW×TH、间距 28
const FPY = 130, FPT = 76, FPX = 38, TW = 120, TH = 174;
// 拍 3 邮件附件：左上角 (MAX, MAY)，MW×MH
const MAX = 36, MAY = 116, MW = 120, MH = 174;
// 拍 1、2 共用：TI 按「导入」，TM 菜单弹出，TK 点菜单项，TC 菜单收起、面板升起（.45 秒）
const TI = .35, TM = .65, TK = 1.0, TC = 1.45;
// 拍 1：Q0 起一个字一个字打「K. 331」（.1 秒一个），QS0 骨架，QR 结果，Q1 点结果，QP 推进版本页，QA 点「全部」，QE 点「编订版」，
// QSel 点完整乐谱，QD 按下载，QH–QF 转圈，QF 谱子浮起，QX 面板收起，QM 谱子飞到中间
const Q0 = 1.95, QS0 = 2.65, QR = 3.0, Q1 = 3.2, QP = 3.5, QA = 4.15, QE = 4.85, QSel = 5.55, QD = 6.15, QH = 6.55, QF = 7.55, QX = 7.7, QM = 7.8;
// 拍 2：P1 点 Op. 111，P2 按打开，P3 面板收起、谱子飞到中间；L0 起每种颜色单独显示 LG 秒，LE 四色都回来
const P1 = 2.05, P2 = 2.65, P3 = 3.0, L0 = 4.4, LG = .7, LE = L0 + 4*LG + .2;
// 拍 3：邮件 .15–.6 升起，M1 点附件，M2 分享面板弹出，M3 点 StaffNotes，M4 邮件收起、谱子飞到中间
const M1 = .8, M2 = 1.1, M3 = 1.7, M4 = 2.15;
// 文件夹里的谱子卡片（App 里比文件夹卡片略宽）
const SW = 136, SH = 192;
// 阅读器谱纸 410 宽、居中；拍 7 从卡片缩略图放大到它。T5：按下「2. Andante »」的时刻（先在第 1 页停约 1.2 秒）
const VX = (W-410)/2, ZS = SW/410, T5 = 2.9;
// 手机：只看 ${VN} 宽的一段
const VN = 640;
// 手机拍 5：第 2–5 列在 VN 宽的窗口里居中
const PN = (colX(1) + colX(4) + CW)/2 - VN/2;
// 拍 4 字段展开：TF 时点开，FS 是卡片列表往上滚的距离（十行字段 39 高，从 Choose individual fields 那一行露到最后一行）
const TF = 4.1, FS = 394, FR = 39;
// 字段展开要紧凑：TF+.12 起列表 FU 秒滚上去（字段跟着很快一行行亮起），停 FH 秒，FD 秒滚回顶；滚回来 Save to Library 才出现，TV 时圆点按它
const FU = .55, FH = .8, FD = .5, FL = FU + FH + FD, FP = [FU/FL, (FU + FH)/FL].map(v => (v*100).toFixed(1) + '%'), TV = TF + .12 + FL + .35;
const into = (c, rowY, s=.3) => pose(colX(c)+CW/2-DW*s/2, rowY+CH*.48-DH*s/2, s);
const G = n => `.sns-story.g${n}`;
const pc = (t, T) => (t/T*100).toFixed(2) + '%';
// 拍 2 每种颜色的透明度：先四色都在，轮到哪种只留哪种（其余 .1 秒淡到 0），最后四色都回来
const solo = i => {
  const p = [[0, 1], [L0, 1]];
  for(let k = 0; k < 4; k++){ const v = k === i ? 1 : 0; p.push([L0 + k*LG + .1, v], [L0 + (k+1)*LG, v]); }
  p.push([LE, 1]);
  return `@keyframes snsL${i}{${p.map(([t, v]) => `${pc(t, LE)}{opacity:${v}}`).join('')}}`;
};
// 弹出面板：t0 起 .45 秒升起，t1 起 .3 秒收起（T 是动画总长）
const rise = (name, t0, t1, T) => `@keyframes ${name}{0%,${pc(t0, T)}{opacity:0;transform:translateY(24px) scale(.97);animation-timing-function:cubic-bezier(.2,.7,.2,1)}${pc(t0+.45, T)}{opacity:1;transform:none}${pc(t1, T)}{opacity:1;transform:none}100%{opacity:0;transform:scale(.97)}}`;
// 菜单：TM 弹出，TC 收起
const menu = name => `@keyframes ${name}{0%,${pc(TM, TC+.2)}{opacity:0;transform:scale(.9);animation-timing-function:cubic-bezier(.2,.7,.2,1)}${pc(TM+.2, TC+.2)}{opacity:1;transform:none}${pc(TC, TC+.2)}{opacity:1;transform:none}100%{opacity:0;transform:scale(.96)}}`;

const CSS = `
/* 批注 81：只裁左右、上下放开。原来靠 overflow:clip visible，不认它的浏览器（Safari）退回 hidden，把导入卡片落在底下的阴影齐刷刷切掉，成了一道没有渐变的黑边；改用 clip-path 上下各留 400 px */
.sns-story{position:relative;width:100%;aspect-ratio:${W}/${H};--k:1;--ds:1.9;--dp:1.8;clip-path:inset(-400px 0 -400px 0)}
.sns-story.narrow{aspect-ratio:${VN}/${H};--ds:2.2;--dp:2}
/* 批注 77：手机竖屏一行只放得下 4 个文件夹，拍 1–5 收起第 1 列（Bach、Baroque），其余 4 列居中，标题对齐它们；拍 6 镜头左移时 Bach 再淡入 */
.sns-story.narrow .hd{left:${colX(1)+2}px}
.sns-story.narrow:not(.g6) .it.c0{opacity:0;transition-delay:0s}
.sns-story.narrow[data-s="6"] .hd,.sns-story.narrow[data-s="7"] .hd{left:${X0+2}px}
.sns-story *{box-sizing:border-box;margin:0;padding:0}
.sns-story .st{position:absolute;left:0;top:0;width:${W}px;height:${H}px;transform-origin:0 0;transition:transform calc(.9s*var(--k)) cubic-bezier(.2,.7,.2,1);font-family:"Timeless Sans",-apple-system,system-ui,sans-serif;color:#292D38;letter-spacing:-.01em;-webkit-font-smoothing:antialiased}
.sns-story.cut{--k:0}

/* 文档：每份谱子两张叠在一起（a/b 是 K. 545，c/c2 是 K. 331，d/d2 是 Op. 111），拍 5 才分开飞进作曲家和时期文件夹。
   起点都在各自来源的缩略图上：K. 331 在下载面板里，Op. 111 在「文件」里，K. 545 在邮件附件上 */
.sns-story .doc{position:absolute;left:0;top:0;width:${DW}px;height:${DH}px;transform-origin:0 0;z-index:3;
  transition:transform calc(.9s*var(--k)) cubic-bezier(.2,.7,.2,1),opacity calc(.5s*var(--k)) ease;opacity:0}
.sns-story .doc.ab{transform:${pose(KX+MAX, KY+MAY, MW/DW)}}
.sns-story .doc.cc{transform:${pose(KX+FX+6, KY+FY+6, FT)}}
.sns-story .doc.dd{transform:${pose(KX+FPX, FPY+FPT, TW/DW)}}
.sns-story .doc .pg{position:absolute;inset:0;border-radius:6px;background:#fff url(${A}k545-p1.jpg) center top/cover;box-shadow:0 1px 3px rgba(0,0,0,.08),0 18px 40px -14px rgba(23,27,36,.28);overflow:hidden}
.sns-story .doc:is(.b,.c2,.d2) .pg{box-shadow:none}
.sns-story .doc .ol{position:absolute;inset:0;background:center top/cover no-repeat}
.sns-story .scan{position:absolute;left:-10%;right:-10%;top:0;height:34%;background:linear-gradient(to bottom,rgba(63,82,159,0),rgba(63,82,159,.16) 85%,rgba(63,82,159,.55) 100%);opacity:0;transform:translateY(-100%)}
.sns-story .fn{position:absolute;left:50%;top:100%;margin-top:calc(18px/var(--ds));transform:translateX(-50%) scale(calc(1.3/var(--ds)));transform-origin:50% 0;white-space:nowrap;font-size:11px;color:#646A75;padding:3px 9px;border-radius:9px;background:rgba(41,45,56,.06);opacity:0;transition:opacity calc(.3s*var(--k))}

/* 拍 1：K. 331 下载完从面板缩略图浮起，面板收起后放大到中间 */
${G(1)} .cc{opacity:1;transform:${BIG};z-index:5;transition:transform calc(.9s*var(--k)) cubic-bezier(.2,.7,.2,1) calc(${QM}s*var(--k)),opacity calc(.1s*var(--k)) ease calc(${QF-.05}s*var(--k))}
/* 拍 2：K. 331 让到左后方；Op. 111 从「文件」的缩略图放大到中间，四种颜色一种一种单独看 */
${G(2)} .cc{transform:${PL};z-index:3;transition:transform calc(.9s*var(--k)) cubic-bezier(.2,.7,.2,1),opacity calc(.2s*var(--k))}
${G(2)} .dd{opacity:1;transform:${BIG};z-index:7;transition:transform calc(.9s*var(--k)) cubic-bezier(.2,.7,.2,1) calc(${P3+.05}s*var(--k)),opacity calc(.1s*var(--k)) ease calc(${P3-.05}s*var(--k))}
${[0,1,2,3].map(i => `${solo(i)}\n.sns-story[data-s="2"] .ol.o${i}{animation:snsL${i} calc(${LE}s*var(--k)) linear both}`).join('\n')}
/* 拍 3：Op. 111 让到右后方；K. 545 从邮件附件放大到最前面，底下标出文件名 */
${G(3)} .dd{transform:${PR};z-index:3;transition:transform calc(.9s*var(--k)) cubic-bezier(.2,.7,.2,1),opacity calc(.2s*var(--k))}
${G(3)} .ab{opacity:1;transform:${BIG};z-index:7;transition:transform calc(.95s*var(--k)) cubic-bezier(.2,.7,.2,1) calc(${M4+.05}s*var(--k)),opacity calc(.1s*var(--k)) ease calc(${M4}s*var(--k))}
.sns-story[data-s="3"] .ab .fn{opacity:1;transition-delay:calc(${M4+.95}s*var(--k))}

/* 图书馆右上角的「导入」按钮和它的菜单（照 App 的 LibraryHeaderBar：导入乐谱、在线曲库）；手机窄版拍 1–4 只看 70–710，按钮跟着往里收 */
.sns-story .ib{position:absolute;top:28px;right:17px;height:36px;padding:0 15px 0 12px;border-radius:18px;display:flex;align-items:center;gap:6px;font-size:15px;color:#3F529F;background:#fff;z-index:2;white-space:nowrap;opacity:0;
  box-shadow:0 1px 4px rgba(0,0,0,.06),0 4px 14px -6px rgba(41,45,56,.18),inset 0 0 0 .5px rgba(0,0,0,.05);transition:opacity calc(.3s*var(--k)),right calc(.9s*var(--k)) cubic-bezier(.2,.7,.2,1)}
.sns-story .ib svg{flex:none}
.sns-story.narrow:not(.g5) :is(.ib,.mn){right:87px}
${G(1)} .ib{opacity:1}
.sns-story[data-s="1"] .ib{animation:snsTap1 calc(.35s*var(--k)) calc(${TI+.25}s*var(--k)) ease both}
.sns-story[data-s="2"] .ib{animation:snsTap2 calc(.35s*var(--k)) calc(${TI+.25}s*var(--k)) ease both}
@keyframes snsTap1{50%{transform:scale(.93)}100%{transform:none}}
@keyframes snsTap2{50%{transform:scale(.93)}100%{transform:none}}
/* 桌面宽度：弹窗盖住按钮时先隐去，免得从弹窗右边露出半截 */
.sns-story:not(.narrow)[data-s="1"] .ib{animation:snsTap1 calc(.35s*var(--k)) calc(${TI+.25}s*var(--k)) ease both,snsIbH1 calc(${QX+.3}s*var(--k)) linear both}
@keyframes snsIbH1{0%,${pc(TC, QX+.3)}{opacity:1}${pc(TC+.2, QX+.3)},${pc(QX+.05, QX+.3)}{opacity:0}100%{opacity:1}}
.sns-story:not(.narrow)[data-s="3"] .ib{animation:snsIbH3 calc(${M4+.35}s*var(--k)) linear both}
@keyframes snsIbH3{0%,${pc(.1, M4+.35)}{opacity:1}${pc(.3, M4+.35)},${pc(M4, M4+.35)}{opacity:0}100%{opacity:1}}
.sns-story:not(.narrow)[data-s="4"] .ib{opacity:0}
.sns-story .mn{position:absolute;top:72px;right:17px;min-width:220px;padding:6px 0;border-radius:14px;background:rgba(255,255,255,.98);z-index:7;opacity:0;transform-origin:100% 0;
  box-shadow:0 0 0 .5px rgba(0,0,0,.06),0 12px 36px -10px rgba(41,45,56,.32)}
.sns-story .mi{position:relative;isolation:isolate;display:flex;align-items:center;gap:12px;height:44px;padding:0 22px 0 16px;font-size:15px;white-space:nowrap}
.sns-story .mi svg{width:20px;height:20px;flex:none}
.sns-story .mi::before{content:"";position:absolute;inset:1px 6px;border-radius:9px;background:#EFEFF1;opacity:0;z-index:-1}
.sns-story[data-s="1"] .mn{animation:snsMn1 calc(${TC+.2}s*var(--k)) linear both}
.sns-story[data-s="2"] .mn{animation:snsMn2 calc(${TC+.2}s*var(--k)) linear both}
${menu('snsMn1')}
${menu('snsMn2')}
.sns-story[data-s="1"] .mi.i2::before,.sns-story[data-s="2"] .mi.i1::before{animation:snsHl calc(.3s*var(--k)) calc(${TK+.25}s*var(--k)) both}
@keyframes snsHl{0%{opacity:0}35%,100%{opacity:1}}

/* 拍 1 的在线曲库：搜索页 → 推进「Editions and Parts」，照 App 的 IMSLP 导入 */
.sns-story .sw{position:absolute;left:${KX}px;top:${KY}px;width:${KW}px;height:${KH}px;border-radius:24px;background:#fff;z-index:4;opacity:0;overflow:hidden;pointer-events:none;
  box-shadow:0 1px 3px rgba(170,178,197,.25),0 24px 60px -24px rgba(41,45,56,.28)}
.sns-story.narrow :is(.sw,.fp,.ml){box-shadow:0 1px 3px rgba(170,178,197,.25),0 30px 44px -38px rgba(41,45,56,.34)}
.sns-story[data-s="1"] .sw{animation:snsSw calc(${QX+.3}s*var(--k)) linear both}
${rise('snsSw', TC, QX, QX+.3)}
.sns-story :is(.sl,.sh){position:absolute;inset:0;background:#fff}
.sns-story[data-s="1"] .sl{animation:snsPull calc(.45s*var(--k)) cubic-bezier(.3,0,.2,1) calc(${QP}s*var(--k)) both}
@keyframes snsPull{to{transform:translateX(-28%);opacity:.5}}
.sns-story .sh{transform:translateX(100%);box-shadow:-10px 0 24px -16px rgba(41,45,56,.25)}
.sns-story[data-s="1"] .sh{animation:snsPush calc(.45s*var(--k)) cubic-bezier(.3,0,.2,1) calc(${QP}s*var(--k)) both}
@keyframes snsPush{from{transform:translateX(100%)}to{transform:none}}
.sns-story .sq{position:absolute;left:20px;right:20px;top:58px;height:40px;border-radius:10px;background:#EFEFF1;display:flex;align-items:center;gap:8px;padding-left:12px;font-size:15px}
.sns-story .sq svg{flex:none}
.sns-story .ph{position:absolute;left:38px;top:0;line-height:40px;color:#8A8D96;white-space:nowrap;transition:opacity 0s}
.sns-story[data-s="1"] .ph{opacity:0;transition-delay:calc(${Q0}s*var(--k))}
.sns-story .qv{display:flex;align-items:center;height:40px;white-space:pre}
.sns-story .qc{font-size:0;transition:font-size 0s}
.sns-story[data-s="1"] .qc{font-size:15px;transition-delay:calc((${Q0}s + var(--q)*.1s)*var(--k))}
.sns-story .cr{width:2px;height:20px;margin-left:1px;border-radius:1px;background:#3F529F;opacity:0}
.sns-story[data-s="1"] .cr{animation:snsCr 1s steps(1) calc(${TC+.45}s*var(--k)) infinite}
@keyframes snsCr{0%{opacity:1}50%{opacity:0}}
.sns-story .rs{position:absolute;left:20px;right:20px;top:118px;height:60px;isolation:isolate;border-bottom:1px solid #ECECEE;opacity:0;transition:opacity calc(.2s*var(--k))}
.sns-story[data-s="1"] .rs{opacity:1;transition-delay:calc(${QS0}s*var(--k))}
.sns-story .rs::before{content:"";position:absolute;inset:2px -8px;border-radius:10px;background:#EFEFF1;opacity:0;z-index:-1}
.sns-story[data-s="1"] .rs::before{animation:snsHl calc(.4s*var(--k)) calc(${Q1+.25}s*var(--k)) both}
.sns-story .rk{position:absolute;left:44px;height:10px;border-radius:5px;background:linear-gradient(90deg,#EFEFF1 0%,#F8F8FA 40%,#EFEFF1 80%);background-size:300% 100%;transition:opacity calc(.2s*var(--k))}
.sns-story[data-s="1"] .rk{opacity:0;transition-delay:calc(${QR}s*var(--k));animation:snsSk 1.2s linear infinite}
.sns-story .rc{position:absolute;inset:0;display:flex;align-items:center;gap:12px;padding:0 4px 0 6px;opacity:0;transition:opacity calc(.3s*var(--k))}
.sns-story[data-s="1"] .rc{opacity:1;transition-delay:calc(${QR}s*var(--k))}
.sns-story .rc svg{flex:none}
.sns-story .rt{flex:1;min-width:0;font-size:15px;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sns-story .rt small{display:block;font-size:13px;color:#8A8D96}
.sns-story .sh .nb{width:38px;padding:0}
.sns-story .sh .e{position:absolute;left:40px;right:40px;white-space:nowrap}
.sns-story .sh .e1{top:66px;font-size:18px}
.sns-story .sh .e2{top:92px;font-size:15px;color:#8A8D96}
.sns-story .sh .e3{top:128px;font-size:15px;color:#3F529F;display:grid;justify-items:start}
.sns-story .sh .e3>span{grid-area:1/1;display:flex;align-items:center;gap:6px;transition:opacity calc(.2s*var(--k))}
.sns-story .sh .eb{opacity:0}
.sns-story[data-s="1"] .sh .ea{opacity:0;transition-delay:calc(${QE+.45}s*var(--k))}
.sns-story[data-s="1"] .sh .eb{opacity:1;transition-delay:calc(${QE+.45}s*var(--k))}
.sns-story .sh .e4{top:166px;font-size:15px}
.sns-story .sh .e5{top:186px;font-size:13px;color:#8A8D96}
.sns-story .sh .e6{top:204px;font-size:13px;color:#8A8D96}
.sns-story[data-s="1"] .sh :is(.e4,.e5,.e6,.fc){animation:snsRf calc(.5s*var(--k)) calc(${QE+.4}s*var(--k))}
@keyframes snsRf{0%,100%{opacity:1}35%{opacity:.15}}
/* 谱种菜单：照 App 的 versions.category */
.sns-story .cm{position:absolute;left:34px;top:158px;min-width:230px;padding:6px 0;border-radius:13px;background:#fff;z-index:6;opacity:0;transform-origin:24px 0;will-change:transform,opacity;
  box-shadow:0 0 0 .5px rgba(0,0,0,.06),0 12px 36px -10px rgba(41,45,56,.32)}
.sns-story .ci{position:relative;isolation:isolate;display:flex;align-items:center;height:34px;padding:0 20px 0 10px;font-size:14.5px;white-space:nowrap}
.sns-story .ci>span{width:24px;margin-right:6px;flex:none;display:grid;place-items:center}
.sns-story .ci::before{content:"";position:absolute;inset:1px 6px;border-radius:8px;background:#EFEFF1;opacity:0;z-index:-1}
.sns-story[data-s="1"] .cm{animation:snsCm calc(1s*var(--k)) calc(${QA+.3}s*var(--k)) both}
@keyframes snsCm{0%{opacity:0;transform:scale(.92)}18%,85%{opacity:1;transform:none}100%{opacity:0;transform:scale(.96)}}
.sns-story[data-s="1"] .ce::before{animation:snsHl calc(.3s*var(--k)) calc(${QE+.25}s*var(--k)) both}
.sns-story .fc{position:absolute;left:${FX}px;top:${FY}px;width:148px;height:258px;border-radius:12px;box-shadow:inset 0 0 0 1px #ECECEE}
.sns-story .fc .th{position:absolute;left:6px;top:6px;width:136px;height:197px;border-radius:5px;background:#fff url(${A}k331-p1.jpg) center top/cover;box-shadow:0 1px 2px rgba(0,0,0,.08),0 4px 10px -6px rgba(23,27,36,.2)}
.sns-story .fc .rr{position:absolute;left:8px;top:209px;display:flex;align-items:center;gap:6px;font-size:13px;white-space:nowrap;transition:color calc(.2s*var(--k))}
.sns-story .fc .ro{width:16px;height:16px;border-radius:50%;box-shadow:inset 0 0 0 1.5px #C5C7CD;display:grid;place-items:center;transition:background calc(.2s*var(--k)),box-shadow calc(.2s*var(--k))}
.sns-story .fc .ro svg{opacity:0;transition:opacity calc(.2s*var(--k))}
.sns-story .fc .mm{position:absolute;left:8px;top:233px;font-size:11px;color:#8A8D96;white-space:nowrap}
.sns-story[data-s="1"] .fc .rr{color:#3F529F;transition-delay:calc(${QSel+.3}s*var(--k))}
.sns-story[data-s="1"] .fc .ro{background:#3F529F;box-shadow:inset 0 0 0 1.5px #3F529F;transition-delay:calc(${QSel+.3}s*var(--k))}
.sns-story[data-s="1"] .fc .ro svg{opacity:1;transition-delay:calc(${QSel+.3}s*var(--k))}
.sns-story .ft{position:absolute;left:0;right:0;top:${KH-62}px;bottom:0;border-top:1px solid #ECECEE}
.sns-story .ft .fl{position:absolute;left:36px;top:0;bottom:0;display:grid;align-items:center}
.sns-story .ft .fl>span{grid-area:1/1;transition:opacity calc(.2s*var(--k))}
.sns-story .ft .f0{font-size:15px;color:#8A8D96}
.sns-story .ft .f1{opacity:0;font-size:14px;line-height:1.3}
.sns-story .ft .f1 small{display:block;font-size:11.5px;color:#8A8D96}
.sns-story[data-s="1"] .ft .f0{opacity:0;transition-delay:calc(${QSel+.3}s*var(--k))}
.sns-story[data-s="1"] .ft .f1{opacity:1;transition-delay:calc(${QSel+.3}s*var(--k))}
.sns-story .db{position:absolute;right:20px;top:11px;height:38px;padding:0 16px;border-radius:19px;display:flex;align-items:center;gap:7px;font-size:15px;white-space:nowrap;background:#ECECEE;color:#A3A6AD;transition:background calc(.2s*var(--k)),color calc(.2s*var(--k))}
.sns-story .db svg{width:15px;height:15px}
.sns-story[data-s="1"] .db{background:#3F529F;color:#fff;transition-delay:calc(${QSel+.3}s*var(--k));animation:snsTap calc(.35s*var(--k)) calc(${QD+.25}s*var(--k)) ease both}
.sns-story .hud{position:absolute;left:${KW/2-70}px;top:${KH/2-62}px;width:140px;height:104px;border-radius:16px;background:rgba(236,236,240,.94);box-shadow:0 10px 30px -12px rgba(41,45,56,.3);
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;font-size:14px;opacity:0}
.sns-story .hud i{width:26px;height:26px;border-radius:50%;border:2.5px solid rgba(41,45,56,.15);border-top-color:#292D38}
.sns-story[data-s="1"] .hud{animation:snsHud calc(${QF-QH}s*var(--k)) calc(${QH}s*var(--k)) both}
.sns-story[data-s="1"] .hud i{animation:snsSpin .8s linear infinite}
@keyframes snsHud{0%{opacity:0;transform:scale(.9)}14%{opacity:1;transform:none}86%{opacity:1;transform:none}100%{opacity:0;transform:scale(.96)}}
@keyframes snsSpin{to{transform:rotate(360deg)}}

/* 拍 2 系统「文件」：最近项目里四份 PDF，点选带标注的 Op. 111，「打开」才变蓝 */
.sns-story .fp{position:absolute;left:${KX}px;top:${FPY}px;width:${KW}px;height:320px;border-radius:24px;background:#fff;z-index:6;opacity:0;pointer-events:none;
  box-shadow:0 1px 3px rgba(170,178,197,.25),0 24px 60px -24px rgba(41,45,56,.28)}
.sns-story[data-s="2"] .fp{animation:snsFp calc(${P3+.3}s*var(--k)) linear both}
${rise('snsFp', TC, P3, P3+.3)}
.sns-story .pt{position:relative;border-radius:5px;background:#fff center top/cover no-repeat;box-shadow:0 1px 2px rgba(0,0,0,.08),0 4px 10px -6px rgba(23,27,36,.2)}
.sns-story .fi{position:absolute;top:${FPT}px;width:${TW}px}
.sns-story .fi .pt{height:${TH}px;transition:box-shadow calc(.2s*var(--k))}
.sns-story :is(.fi,.at) p{margin-top:8px;font-size:11.5px;line-height:1.3;text-align:center}
.sns-story .ok{position:absolute;right:6px;bottom:6px;width:20px;height:20px;border-radius:50%;background:#3F529F;display:grid;place-items:center;box-shadow:0 0 0 2px #fff;opacity:0;transform:scale(.4);
  transition:opacity calc(.2s*var(--k)),transform calc(.35s*var(--k)) cubic-bezier(.3,1.6,.5,1)}
.sns-story[data-s="2"] .ok{opacity:1;transform:none;transition-delay:calc(${P1+.3}s*var(--k))}
.sns-story[data-s="2"] .fi.on .pt{box-shadow:0 0 0 2.5px #3F529F,0 4px 10px -6px rgba(23,27,36,.2);transition-delay:calc(${P1+.3}s*var(--k))}
.sns-story .fp .nb.op{color:#A3A6AD;transition:color calc(.2s*var(--k))}
.sns-story[data-s="2"] .fp .nb.op{color:#3F529F;transition-delay:calc(${P1+.3}s*var(--k));animation:snsTap calc(.35s*var(--k)) calc(${P2+.25}s*var(--k)) ease both}

/* 拍 3 邮件：扫描仪发来的 K. 545，点附件弹出分享面板，选 StaffNotes（其他 App 只画灰块） */
.sns-story .ml{position:absolute;left:${KX}px;top:${KY}px;width:${KW}px;height:${KH}px;border-radius:24px;background:#fff;z-index:6;opacity:0;pointer-events:none;
  box-shadow:0 1px 3px rgba(170,178,197,.25),0 24px 60px -24px rgba(41,45,56,.28)}
.sns-story[data-s="3"] .ml{animation:snsMl calc(${M4+.35}s*var(--k)) linear both}
${rise('snsMl', .15, M4, M4+.35)}
.sns-story .ml::after{content:"";position:absolute;left:36px;right:36px;top:92px;height:1px;background:#ECECEE}
.sns-story .ma{position:absolute;left:36px;top:30px;width:40px;height:40px;border-radius:50%;background:#C5C7CD;color:#fff;display:grid;place-items:center;font-size:17px}
.sns-story .ms{position:absolute;left:88px;top:30px;font-size:15px}
.sns-story .mj{position:absolute;left:88px;top:52px;font-size:13.5px;color:#8A8D96}
.sns-story .mt{position:absolute;right:36px;top:31px;font-size:13px;color:#8A8D96}
.sns-story .at{position:absolute;left:${MAX}px;top:${MAY}px;width:${MW}px}
.sns-story .at .pt{height:${MH}px}
.sns-story .at p small{display:block;margin-top:2px;color:#8A8D96}
.sns-story[data-s="3"] .at .pt{animation:snsTap calc(.35s*var(--k)) calc(${M1+.25}s*var(--k)) ease both}
.sns-story .ss{position:absolute;left:${MAX+MW+18}px;top:${MAY-6}px;width:340px;height:204px;border-radius:16px;background:rgba(255,255,255,.98);z-index:2;opacity:0;transform-origin:0 30%;
  box-shadow:0 0 0 .5px rgba(0,0,0,.06),0 16px 44px -12px rgba(41,45,56,.34)}
.sns-story[data-s="3"] .ss{animation:snsSs calc(${M4}s*var(--k)) linear both}
@keyframes snsSs{0%,${pc(M2, M4)}{opacity:0;transform:scale(.92);animation-timing-function:cubic-bezier(.2,.7,.2,1)}${pc(M2+.25, M4)}{opacity:1;transform:none}${pc(M4-.12, M4)}{opacity:1;transform:none}100%{opacity:0;transform:scale(.96)}}
.sns-story .ss::after{content:"";position:absolute;left:0;right:0;top:80px;height:1px;background:#ECECEE}
.sns-story .sx i{position:absolute;left:22px;top:14px;width:36px;height:52px;border-radius:3px;background:#fff center top/cover;box-shadow:0 1px 2px rgba(0,0,0,.1),0 0 0 .5px rgba(0,0,0,.06)}
.sns-story .sx span{position:absolute;left:72px;top:21px;font-size:13.5px;white-space:nowrap}
.sns-story .sx small{display:block;margin-top:3px;font-size:11.5px;color:#8A8D96}
.sns-story .si{position:absolute;top:98px;width:60px;text-align:center}
.sns-story .si i{display:block;width:60px;height:60px;border-radius:14px;background:#fff center/cover;box-shadow:0 0 0 .5px rgba(0,0,0,.08)}
.sns-story .si span{display:block;margin-top:6px;font-size:11px;white-space:nowrap}
.sns-story .si.sg i{background:#ECECEE;box-shadow:none}
.sns-story .si.sg span{width:36px;height:7px;margin:10px auto 0;border-radius:3.5px;background:#ECECEE}
.sns-story[data-s="3"] .si.on i{animation:snsTap calc(.35s*var(--k)) calc(${M3+.25}s*var(--k)) ease both}

/* 拍 4：导入卡片，照 App 的 Import Score；K. 545 缩成卡片里的缩略图，另两份压在卡片正下面 */
${G(4)} .ab{transform:${pose(KX+TX, KY+TY, TS)};z-index:5;transition:transform calc(.9s*var(--k)) cubic-bezier(.2,.7,.2,1) calc(.08s*var(--k)),opacity calc(.5s*var(--k)) ease}
.sns-story[data-s="4"] .ab .pg{box-shadow:0 1px 3px rgba(0,0,0,.08),0 6px 16px -8px rgba(23,27,36,.2)}
${G(4)} :is(.cc,.dd){transform:${UNDER};transition:transform calc(.8s*var(--k)) cubic-bezier(.2,.7,.2,1) calc(.3s*var(--k)),opacity calc(.2s*var(--k))}
.sns-story[data-s="4"] .scan{animation:snsScan calc(1.5s*var(--k)) calc(.55s*var(--k)) cubic-bezier(.45,0,.55,1) both}
@keyframes snsScan{0%{opacity:0;transform:translateY(-100%)}12%{opacity:1}88%{opacity:1}100%{opacity:0;transform:translateY(300%)}}

/* 拍 5：三份谱子各自飞进作曲家和时期文件夹（--fd 是每张起飞的时刻） */
${G(5)} .doc{opacity:0;transition:transform calc(1s*var(--k)) cubic-bezier(.55,0,.25,1) calc(var(--fd)*1s*var(--k)),opacity calc(.25s*var(--k)) ease calc((var(--fd) + .82)*1s*var(--k))}
${G(5)} .doc.a,${G(5)} .doc.c{transform:${into(4,R1)}}
${G(5)} .doc.b,${G(5)} .doc.c2{transform:${into(1,R2)}}
${G(5)} .doc.d{transform:${into(1,R1)}}
${G(5)} .doc.d2{transform:${into(2,R2)}}

.sns-story .card{position:absolute;left:${KX}px;top:${KY}px;width:${KW}px;height:${KH}px;border-radius:24px;background:#fff;z-index:4;box-shadow:0 1px 3px rgba(170,178,197,.25),0 24px 60px -24px rgba(41,45,56,.28);
  opacity:0;transform:translateY(24px) scale(.97);transition:opacity calc(.5s*var(--k)) ease,transform calc(.7s*var(--k)) cubic-bezier(.2,.7,.2,1)}
.sns-story[data-s="4"] .card{opacity:1;transform:none}
/* 批注 81：手机窄版卡片和窗口一样宽，原来的阴影往两边扩出去被截成硬边；窄版的阴影只往下落，不出左右边 */
.sns-story.narrow .card{box-shadow:0 1px 3px rgba(170,178,197,.25),0 30px 44px -38px rgba(41,45,56,.34)}
${G(5)} .card{opacity:0;transform:scale(.94);transition-delay:calc(.15s*var(--k))}
.sns-story .sb{-webkit-text-stroke:.35px currentColor}
.sns-story :is(.card,.sw,.fp) .h{position:absolute;left:0;right:0;top:19px;text-align:center;font-size:15px;line-height:20px}
.sns-story :is(.card,.sw,.fp) .nb{position:absolute;top:10px;height:38px;padding:0 14px;border-radius:19px;display:grid;place-items:center;font-size:15px;color:#3F529F;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.06),0 4px 14px -6px rgba(41,45,56,.18),inset 0 0 0 .5px rgba(0,0,0,.05)}
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
.sns-story[data-s="4"] .cf .ex{transform:rotate(90deg);transition-delay:calc(${TF+.08}s*var(--k))}
.sns-story .fr{display:grid;grid-template-columns:27px 160px 1fr 32px;align-items:center;height:${FR}px;border-bottom:1px solid #ECECEE;font-size:15px;opacity:0;transition:opacity calc(.2s*var(--k))}
.sns-story .fr svg{display:block}
.sns-story .fr .fy{color:#8A8D96}
.sns-story .fr .fk{justify-self:end;width:18px;height:18px;border-radius:50%;background:#3F529F;display:grid;place-items:center}
.sns-story[data-s="4"] .fr{opacity:1;transition-delay:calc((${TF+.15}s + var(--i)*.035s)*var(--k))}
.sns-story[data-s="4"] .bi{animation:snsFoB calc(${FL}s*var(--k)) calc(${TF+.12}s*var(--k)) both}
.sns-story[data-s="4"] .ab{animation:snsFoD calc(${FL}s*var(--k)) calc(${TF+.12}s*var(--k)) both}
@keyframes snsFoB{0%{translate:0 0;animation-timing-function:cubic-bezier(.45,0,.2,1)}${FP[0]}{translate:0 -${FS}px}${FP[1]}{translate:0 -${FS}px;animation-timing-function:cubic-bezier(.45,0,.2,1)}100%{translate:0 0}}
@keyframes snsFoD{0%{translate:0 0;clip-path:inset(${(-16/TS).toFixed(2)}px -60px -60px);animation-timing-function:cubic-bezier(.45,0,.2,1)}${FP[0]}{translate:0 -${FS}px;clip-path:inset(${((FS-16)/TS).toFixed(2)}px -60px -60px)}${FP[1]}{translate:0 -${FS}px;clip-path:inset(${((FS-16)/TS).toFixed(2)}px -60px -60px);animation-timing-function:cubic-bezier(.45,0,.2,1)}100%{translate:0 0;clip-path:inset(${(-16/TS).toFixed(2)}px -60px -60px)}}
.sns-story .cb{justify-self:end;width:18px;height:18px;border-radius:50%;background:#3F529F;display:grid;place-items:center;transform:scale(.4);opacity:0;transition:opacity calc(.25s*var(--k)),transform calc(.4s*var(--k)) cubic-bezier(.3,1.6,.5,1)}
.sns-story .rx{opacity:0;transform:translateY(6px);transition:opacity calc(.4s*var(--k)),transform calc(.5s*var(--k)) cubic-bezier(.2,.7,.2,1)}
.sns-story .sk{position:absolute;left:0;top:50%;margin-top:-5px;height:10px;border-radius:5px;background:linear-gradient(90deg,#EFEFF1 0%,#F8F8FA 40%,#EFEFF1 80%);background-size:300% 100%;transition:opacity calc(.3s*var(--k))}
.sns-story .mr .sk{left:27px}
.sns-story .pp{display:flex;align-items:center;gap:2px;color:#8A8D96;font-variant-numeric:tabular-nums;opacity:0;transition:opacity calc(.2s*var(--k))}
.sns-story .pp .dg{display:block;height:18px;overflow:hidden;line-height:18px}
.sns-story .pp .dg>span{display:flex;flex-direction:column;transition:transform calc((.25s + var(--n)*.065s)*var(--k)) cubic-bezier(.3,0,.2,1)}
.sns-story[data-s="4"] .pp{opacity:1;transition-delay:calc((2.35s + var(--j)*.3s)*var(--k))}
.sns-story[data-s="4"] .pp .dg>span{transform:translateY(calc((1 - var(--n))*18px));transition-delay:calc((2.35s + var(--j)*.3s)*var(--k))}
.sns-story[data-s="4"] .sk{animation:snsSk 1.2s linear infinite}
@keyframes snsSk{to{background-position:-300% 0}}
.sns-story[data-s="4"] .rx,.sns-story[data-s="4"] .cb{opacity:1;transform:none;transition-delay:calc((.75s + var(--i)*.2s)*var(--k))}
.sns-story[data-s="4"] .cb{transition-delay:calc((.9s + var(--i)*.2s)*var(--k))}
.sns-story[data-s="4"] .sk{opacity:0;transition-delay:calc((.75s + var(--i)*.2s)*var(--k))}
/* Save to Library：等字段展示完、列表滚回顶才浮上来，随后圆点按它 */
.sns-story .sv{position:absolute;left:50%;bottom:12px;height:32px;margin-left:-62px;width:124px;border-radius:16px;background:#3F529F;color:#fff;font-size:15px;display:grid;place-items:center;opacity:0;translate:0 8px;transition:opacity calc(.3s*var(--k)),translate calc(.45s*var(--k)) cubic-bezier(.2,.7,.2,1)}
.sns-story[data-s="4"] .sv{opacity:1;translate:0 0;transition-delay:calc(${TF+.12+FL}s*var(--k));animation:snsTap calc(.35s*var(--k)) calc(${TV+.2}s*var(--k)) ease both}
/* 德语「In Mediathek sichern」比 124 px 宽：按钮跟着字宽，仍然居中 */
:root:lang(de) .sns-story .sv{left:0;right:0;width:max-content;margin:0 auto;padding:0 16px}
.sns-story .tp{opacity:0;--tl:.7s}
.sns-story .tp::after{content:"";position:absolute;inset:0;border-radius:50%;border:calc(var(--dotu,30px)*.06) solid rgba(41,45,56,.28);opacity:0;pointer-events:none}
/* 点按圆点：拍 n 的圆点带 bn，--td 是落指时刻（按下在 --td 后约 .27 秒） */
${[1,2,3,4,6].map(n => `.sns-story[data-s="${n}"] .tp.b${n}`).join(',')}{animation:snsTp calc(var(--tl)*var(--k)) calc(var(--td)*var(--k)) linear both}
${[1,2,3,4,6].map(n => `.sns-story[data-s="${n}"] .tp.b${n}::after`).join(',')}{animation:snd-rip calc(.5s*var(--k)) calc((var(--td) + var(--tl)*.38)*var(--k)) ease-out both}
@keyframes snsTap{50%{transform:scale(.93)}100%{transform:none}}
@keyframes snsTp{0%{opacity:0;scale:1}22%{opacity:1;scale:1}38%{opacity:1;scale:.75}60%{opacity:1;scale:.75}74%{opacity:1;scale:1}100%{opacity:0;scale:1}}

/* 图书馆：卡片照 App，未打开时正放、封面实色 */
.sns-story .lib{position:absolute;inset:0;pointer-events:none;transition:opacity calc(.4s*var(--k))}
.sns-story .hd{position:absolute;left:${X0+2}px;font-size:21px;display:flex;align-items:baseline;gap:9px;white-space:nowrap;opacity:0;transform:translateY(10px);transition:opacity calc(.4s*var(--k)),transform calc(.6s*var(--k)) cubic-bezier(.2,.7,.2,1),left calc(.9s*var(--k)) cubic-bezier(.2,.7,.2,1)}
.sns-story .hd small{font-size:13px;color:#8C919B}
.sns-story .it{position:absolute;width:${CW}px;height:${CH}px;opacity:0;transform:translateY(16px) scale(.97);transition:opacity calc(.45s*var(--k)),transform calc(.7s*var(--k)) cubic-bezier(.2,.7,.2,1)}
${G(5)} .hd,${G(5)} .it{opacity:1;transform:none;transition-delay:calc((.2s + var(--i)*.05s)*var(--k))}
.sns-story .bp{position:absolute;left:34%;top:5%;width:62%;height:90%;border-radius:10px;background:#E6E6E8;opacity:0;transition:opacity calc(.4s*var(--k))}
.sns-story .pv{position:absolute;left:30%;top:8%;width:66%;height:84%;border-radius:4px;background:#fff center top/cover no-repeat;box-shadow:0 1px 2px rgba(0,0,0,.08);transition:opacity calc(.3s*var(--k))}
.sns-story .pv.new{opacity:0;transition:opacity calc(.3s*var(--k)),translate calc(.5s*var(--k)) cubic-bezier(.2,.7,.2,1);translate:-14px 0}
${G(5)} .pv.new{opacity:1;translate:0 0;transition-delay:calc(var(--t)*1s*var(--k))}
.sns-story .cv{position:absolute;left:0;top:0;width:90%;height:100%;border-radius:10px;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.05),0 6px 14px -6px rgba(23,27,36,.12);overflow:hidden;transform-origin:50% 60%;transition:transform calc(.6s*var(--k)) cubic-bezier(.2,.7,.2,1),width calc(.6s*var(--k)) cubic-bezier(.2,.7,.2,1)}
.sns-story .dots{position:absolute;z-index:2;left:11px;top:4px;font-size:16px;letter-spacing:1px}
.sns-story .n{position:absolute;z-index:2;right:12px;top:7px;height:18px;width:30px;font-size:14.4px;color:#646A75;font-variant-numeric:tabular-nums;text-align:right}
.sns-story .n span{position:absolute;right:0;top:0;transition:opacity calc(.25s*var(--k)),transform calc(.4s*var(--k)) cubic-bezier(.2,.7,.2,1)}
.sns-story .n :is(.m,.b){opacity:0;transform:translateY(8px)}
/* 只有收进新谱子的文件夹数字往上加（Mozart、Classical 两次，Beethoven、Romantic 一次）：旧数往上走、新数补上，中间那个数停一下再走；其他文件夹的数字一直留着 */
${G(5)} .n .a.x{opacity:0;transform:translateY(-8px);transition-delay:calc(var(--to)*1s*var(--k))}
${G(5)} .n .b{opacity:1;transform:none;transition-delay:calc(var(--ti)*1s*var(--k))}
${G(5)} .n .m{animation:snsMid calc(.75s*var(--k)) calc(var(--ti)*1s*var(--k)) both}
@keyframes snsMid{0%{opacity:0;transform:translateY(8px)}33%{opacity:1;transform:none}60%{opacity:1;transform:none}100%{opacity:0;transform:translateY(-8px)}}
.sns-story .ic{position:absolute;left:30%;top:31%;width:40%;height:24%;background:#292D38;-webkit-mask:center/contain no-repeat;mask:center/contain no-repeat}
.sns-story svg.ic{background:none}
.sns-story .av{position:absolute;left:6%;top:9%;width:88%;height:62%;background:#fff center bottom/contain no-repeat}
.sns-story .t{position:absolute;left:12px;right:8px;bottom:14px;font:16.1px/1.08 var(--serif,"Timeless Serif",Georgia,serif)}
.sns-story .t small{display:block;font:11px "Timeless Sans",sans-serif;color:#646A75;margin-bottom:3px}
.sns-story .t .f{display:block;font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:1px}
.sns-story .t .z{font-size:18px}

/* 拍 6：点开 Mozart。时期一行让开，Mozart 移到第二行最左，照 App 收窄微倾，右边排出它的谱子 */
${G(6)} .per{opacity:0;transform:translateY(20px);transition-delay:calc(.25s*var(--k))}
${G(6)} .mz.cmp{transform:translate(${colX(0)-colX(4)}px,${R3-R1}px);transition-delay:calc(.4s*var(--k))}
${G(6)} .mz.cmp .cv{width:80%;transform:rotate(-2.5deg);transition-delay:calc(.75s*var(--k))}
${G(6)} .mz.cmp .bp{opacity:1;transition-delay:calc(.8s*var(--k))}
${G(6)} .mz.cmp .pv{opacity:0;transition-delay:calc(.55s*var(--k))}
.sns-story .sc{position:absolute;top:${R3}px;width:${SW}px;opacity:0;transform:translateX(-18px);transition:opacity calc(.4s*var(--k)),transform calc(.6s*var(--k)) cubic-bezier(.2,.7,.2,1)}
.sns-story .sc .th{height:${SH}px;border-radius:5px;background:#fff center top/cover no-repeat;box-shadow:0 1px 2px rgba(0,0,0,.08),0 6px 14px -6px rgba(23,27,36,.14)}
.sns-story .sc p{margin-top:7px;font-size:11.5px;line-height:1.25}
.sns-story .sc p small{display:block;font-size:10.5px;color:#8C919B;margin-top:2px}
${G(6)} .sc{opacity:1;transform:none;transition-delay:calc((.9s + var(--i)*.12s)*var(--k))}

/* 拍 7：从被点的那张谱子放大成阅读器（谱纸 410×580 正好是卡片 136×192 的 ${ZS.toFixed(3)} 倍），周围不另铺底色，就是网页本身；
   放大完标题胶囊和底栏淡入，停在第 1 页，${T5}s 时手指按下「2. Andante »」才换页 */
.sns-story .rd{position:absolute;left:0;top:0;width:${W}px;height:${H}px;z-index:8;pointer-events:none;transform-origin:0 0;opacity:0;
  transform:translate(${colX(1)-VX*ZS}px,${R3}px) scale(${ZS});transition:transform calc(.65s*var(--k)) cubic-bezier(.3,.75,.15,1),opacity calc(.12s*var(--k)) linear calc(.5s*var(--k))}
.sns-story[data-s="7"] .rd{opacity:1;transform:none;transition-delay:0s}
.sns-story .rd .ttl,.sns-story .rd .bar{z-index:2;opacity:0;transition:opacity calc(.3s*var(--k))}
.sns-story[data-s="7"] .rd .ttl,.sns-story[data-s="7"] .rd .bar{opacity:1;transition-delay:calc(.55s*var(--k))}
.sns-story[data-s="7"] .lib{opacity:0;transition-duration:calc(.35s*var(--k));transition-delay:calc(.08s*var(--k))}
.sns-story[data-s="7"] .sc.k{opacity:0;transition:opacity 0s}
.sns-story .vp{position:absolute;left:${VX}px;top:0;width:410px;border-radius:calc(5px/${ZS});height:${H}px;overflow:hidden}
.sns-story .vp>div{position:absolute;inset:0;background:#fff center top/contain no-repeat;transition:opacity calc(.12s*var(--k))}
.sns-story .vp .p5,.sns-story[data-s="7"] .vp .p1{opacity:0}
.sns-story[data-s="7"] .vp .p5{opacity:1}
.sns-story[data-s="7"] .vp>div{transition-delay:calc(${T5+.15}s*var(--k))}
.sns-story .ttl{position:absolute;left:50%;top:8px;height:22px;transform:translateX(-50%);display:grid;place-items:center;padding:0 11px;border-radius:11px;background:rgba(255,255,255,.9);box-shadow:0 1px 2px rgba(0,0,0,.07),inset 0 0 0 .5px rgba(0,0,0,.06);white-space:nowrap;text-align:center}
.sns-story .ttl>span{grid-area:1/1;font-size:7.2px;line-height:1.12;transition:opacity calc(.2s*var(--k))}
.sns-story .ttl small{display:block;font-size:5.9px;color:#8C919B}
.sns-story .ttl .t2,.sns-story[data-s="7"] .ttl .t1{opacity:0}
.sns-story[data-s="7"] .ttl .t2{opacity:1}
.sns-story[data-s="7"] .ttl>span{transition-delay:calc(${T5+.15}s*var(--k))}
/* 底栏：页码胶囊居中，上一乐章在左、下一乐章在右 */
.sns-story .bar{position:absolute;left:0;right:0;top:${H-30}px;height:22px}
.sns-story .pgc{position:absolute;left:50%;top:0;width:92px;height:22px;margin-left:-46px;display:flex;align-items:center;justify-content:center;gap:5px;border-radius:11px;background:rgba(255,255,255,.9);box-shadow:0 1px 2px rgba(0,0,0,.07),inset 0 0 0 .5px rgba(0,0,0,.06);font-size:8.5px;color:#646A75;overflow:hidden}
.sns-story .pn{position:relative;display:grid;padding:2px 5px;border-radius:4px;background:#EDEDEF;color:#292D38;font-variant-numeric:tabular-nums}
.sns-story .pn span{grid-area:1/1;text-align:center;transition:opacity calc(.12s*var(--k))}
.sns-story .pn .q2,.sns-story[data-s="7"] .pn .q1{opacity:0}
.sns-story[data-s="7"] .pn .q2{opacity:1}
.sns-story[data-s="7"] .pn span{transition-delay:calc(${T5+.15}s*var(--k))}
.sns-story .pgc i{position:absolute;left:11px;bottom:0;height:1.5px;width:calc((92px - 22px)/12);border-radius:1px;background:#3F529F}
.sns-story[data-s="7"] .pgc i{width:calc((92px - 22px)*5/12);transition-delay:calc(${T5+.15}s*var(--k))}
.sns-story .mvb{position:absolute;top:0;height:22px;display:flex;align-items:center;gap:4px;padding:0 9px;border-radius:11px;background:rgba(255,255,255,.9);box-shadow:0 1px 2px rgba(0,0,0,.07),inset 0 0 0 .5px rgba(0,0,0,.06);font-size:8.5px;white-space:nowrap;transition:opacity calc(.2s*var(--k))}
.sns-story .mvb svg{flex:none;width:8px;height:8px}
.sns-story .mvb.nx{left:${W/2+52}px}.sns-story .mvb.pr{right:${W/2+52}px}
.sns-story .mvb.n2,.sns-story .mvb.pr{opacity:0}
.sns-story[data-s="7"] .mvb.n1{opacity:0;transition-delay:calc(${T5+.15}s*var(--k));animation:snsGlass calc(.5s*var(--k)) calc(${T5-.25}s*var(--k)) ease both}
@keyframes snsGlass{35%{transform:scale(1.08);background:#fff;box-shadow:0 2px 9px rgba(41,45,56,.2),inset 0 0 0 .5px rgba(0,0,0,.06)}}
.sns-story[data-s="7"] .mvb.n2,.sns-story[data-s="7"] .mvb.pr{opacity:1;transition-delay:calc(${T5+.2}s*var(--k))}
.sns-story .tp.t7{z-index:3}
.sns-story .rp{position:absolute;z-index:3;width:40px;height:40px;margin:-20px 0 0 -20px;border-radius:50%;border:2px solid rgba(41,45,56,.45);opacity:0;pointer-events:none}
.sns-story[data-s="7"] .tp.t7{animation:snsPress calc(1.5s*var(--k)) calc(${T5-1.05}s*var(--k)) linear both}
.sns-story[data-s="7"] .rp{animation:snsRp calc(.75s*var(--k)) calc(${T5-.1}s*var(--k)) cubic-bezier(.2,.7,.2,1) both}
@keyframes snsPress{0%{opacity:0;transform:scale(1.5);animation-timing-function:cubic-bezier(.2,.7,.2,1)}17%{opacity:1;transform:scale(1)}60%{transform:scale(1);animation-timing-function:cubic-bezier(.4,0,.6,1)}68%{transform:scale(.74)}78%{opacity:1;transform:scale(.8)}100%{opacity:0;transform:scale(.86)}}
/* r9：zoom 时这些元素由脚本逐帧摆位，关掉过渡 */
.sns-story.zm .rd,.sns-story.zm .lib,.sns-story.zm .sc,.sns-story.zm .rd .ttl,.sns-story.zm .rd .bar,.sns-story.zm .tp.tz{transition:none!important}
.sns-story .tp.tz{z-index:9}
@keyframes snsRp{0%{opacity:0;transform:scale(.7)}8%{opacity:.9}100%{opacity:0;transform:scale(2.4)}}
`;

// 文件夹封面和新来的谱子：6 是下载的 K. 331，7 是带批注的 Op. 111
const P = [A+'k545-p1.jpg', A+'th-Chopin_Nocturne_Op9_No1.jpg', A+'th-Brahms_Ballade_Op118_No3.jpg', A+'th-Schumann_Melodie_Op68_No1.jpg', A+'th-Debussy_Feux_dartifice.jpg', A+'k545-ed2.jpg', A+'k331-p1.jpg', A+'op111-annot.jpg'];
const folderSvg = '<svg class="ic" viewBox="0 0 48 40" fill="none" stroke="#292D38" stroke-width="2.6" stroke-linejoin="round"><path d="M4 9a4 4 0 0 1 4-4h10l5 5h17a4 4 0 0 1 4 4v18a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"/></svg>';
// o.t：新谱子落进这个文件夹的时刻（和 --fd 起飞时刻对上），o.nv：每次落进来的封面
function folder(o, i){
  const t = o.t || [];
  const pv = `<div class="pv" style="background-image:url(${P[o.pa]})"></div>` + t.map((s, j) => `<div class="pv new" style="background-image:url(${P[o.nv[j]]});--t:${s - .02}"></div>`).join('');
  const n = t.length
    ? `<span class="a x" style="--to:${t[0]}">${o.n}</span>` + t.map((s, j) => `<span class="${j < t.length-1 ? 'm' : 'b'}" style="--ti:${s}">${o.n+j+1}</span>`).join('')
    : `<span class="a">${o.n}</span>`;
  const body = o.cmp
    ? `<div class="av" style="background-image:url(${A}cmp-${o.cmp}.jpg)"></div><div class="t"><span class="f">${o.first}</span><span class="z">${o.last}</span></div>`
    : `${o.png ? `<div class="ic" style="-webkit-mask-image:url(${A}fld-${o.png}.png);mask-image:url(${A}fld-${o.png}.png)"></div>` : folderSvg}<div class="t"><small>${o.years}</small>${snT(o.label)}</div>`;
  return `<div class="it c${i%5} ${o.cmp?'cmp':'per'}${o.mz?' mz':''}" style="left:${colX(i%5)}px;top:${o.y}px;--i:${o.i}"><div class="bp"></div>${pv}<div class="cv"><div class="dots">···</div><div class="n">${n}</div>${body}</div></div>`;
}

SNSims['r13/story-r13'] = function(root){
  if(!document.getElementById('sns-story-r13-css')){ const s=document.createElement('style'); s.id='sns-story-r13-css'; s.textContent=CSS; document.head.appendChild(s); }
  root.classList.add('sns-story');
  if(RM) root.style.setProperty('--k','0');

  // 落进来的时刻 = 起飞（--fd）+ .92：K. 545 .3/.42，K. 331 .75/.87，Op. 111 1.2/1.32
  const cmps = [
    {cmp:'bach', first:'Johann Sebastian', last:'Bach', n:3, pa:1},{cmp:'beethoven', first:'Ludwig van', last:'Beethoven', n:2, pa:2, t:[2.12], nv:[7]},
    {cmp:'chopin', first:'Frédéric', last:'Chopin', n:4, pa:1},{cmp:'haydn', first:'Joseph', last:'Haydn', n:2, pa:3},
    {cmp:'mozart', first:'Wolfgang Amadeus', last:'Mozart', n:1, pa:5, mz:1, t:[1.22, 1.67], nv:[0, 6]}];
  const pers = [
    {label:'Baroque', years:'1600 – 1750', png:'baroque', n:3, pa:3},{label:'Classical', years:'1750 – 1820', png:'classical', n:3, pa:5, t:[1.34, 1.79], nv:[0, 6]},
    {label:'Romantic', years:'1820 – 1900', png:'romantic', n:12, pa:1, t:[2.24], nv:[7]},{label:'Modern', years:'1900 – 1945', png:'early20', n:6, pa:4},
    // 图标照 App 的 LibraryFolderCoverStyle：period:modern 用 early20，period:contemporary 用 modern（留声机，fld-modern.png 由 App 的 LibraryFolder-modern.pdf 渲成）
    {label:'Contemporary', years:'1945 –', png:'modern', n:3, pa:2}];
  const check = (s=12) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>`;
  // 标题照 App ScoreSavedNames：德语界面用目录里的德语标题，中文界面和英语一样
  const t545 = snT('Piano Sonata No. 16 in C Major, K. 545'), t331 = snT('Piano Sonata No. 11 in A Major, K. 331');
  const meta = [['m1',t545,300],['m2','Wolfgang Amadeus Mozart · 1756 – 1791',230],['m3',`${snT('Classical')} · ${min(11.5)}`,110]];
  const mvs = [['1.','Allegro',snT('C Major'),min(3.5),1],['2.','Andante',snT('G Major'),min(6),4],['3.','Rondo: Allegretto',snT('C Major'),min(1.5),7]];
  const chev = '<svg width="9" height="14" viewBox="0 0 9 14" fill="none" stroke="#292D38" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="m1.5 1.5 5.5 5.5-5.5 5.5"/></svg>';
  const back = '<svg width="9" height="14" viewBox="0 0 9 14" fill="none" stroke="#292D38" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 1.5-5.5 5.5 5.5 5.5"/></svg>';
  const down = '<svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="#3F529F" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="m1 1 4 4 4-4"/></svg>';
  const dl = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/></svg>';
  // 导入菜单的两个图标照 App：导入乐谱是收件箱，在线曲库是地球
  const svgp = (ps, a) => `<svg viewBox="0 0 24 24" ${a}>${ps.split('|').map(d => `<path d="${d}"/>`).join('')}</svg>`;
  const inbox = svgp('M12 9.75C11.9 9.75 11.81 9.73 11.71 9.69C11.43 9.58 11.25 9.3 11.25 9L11.25 2C11.25 1.59 11.59 1.25 12 1.25C12.41 1.25 12.75 1.59 12.75 2L12.75 7.19L13.47 6.47C13.76 6.18 14.24 6.18 14.53 6.47C14.82 6.76 14.82 7.24 14.53 7.53L12.53 9.53C12.39 9.67 12.2 9.75 12 9.75ZM12 9.75|M12 9.75C11.81 9.75 11.62 9.68 11.47 9.53L9.47 7.53C9.18 7.24 9.18 6.76 9.47 6.47C9.76 6.18 10.24 6.18 10.53 6.47L12.53 8.47C12.82 8.76 12.82 9.24 12.53 9.53C12.38 9.68 12.19 9.75 12 9.75ZM12 9.75|M13.76 17.75L10.23 17.75C9.18 17.75 8.24 17.17 7.77 16.23L6.6 13.89C6.56 13.8 6.47 13.75 6.38 13.75L1.98 13.75C1.57 13.75 1.23 13.41 1.23 13C1.23 12.59 1.57 12.25 1.98 12.25L6.39 12.25C7.06 12.25 7.66 12.62 7.96 13.22L9.13 15.56C9.34 15.99 9.77 16.25 10.25 16.25L13.78 16.25C14.26 16.25 14.69 15.99 14.9 15.56L16.07 13.22C16.37 12.62 16.97 12.25 17.64 12.25L22 12.25C22.41 12.25 22.75 12.59 22.75 13C22.75 13.41 22.41 13.75 22 13.75L17.64 13.75C17.54 13.75 17.46 13.8 17.42 13.89L16.25 16.23C15.75 17.17 14.81 17.75 13.76 17.75ZM13.76 17.75|M15 22.75L9 22.75C3.57 22.75 1.25 20.43 1.25 15L1.25 11C1.25 6.31 2.99 3.96 6.89 3.39C7.31 3.33 7.68 3.61 7.74 4.02C7.8 4.43 7.52 4.81 7.11 4.87C3.97 5.33 2.75 7.05 2.75 11L2.75 15C2.75 19.61 4.39 21.25 9 21.25L15 21.25C19.61 21.25 21.25 19.61 21.25 15L21.25 11C21.25 7.05 20.03 5.33 16.89 4.87C16.48 4.81 16.2 4.43 16.26 4.02C16.32 3.61 16.7 3.33 17.11 3.39C21.01 3.96 22.75 6.31 22.75 11L22.75 15C22.75 20.43 20.43 22.75 15 22.75ZM15 22.75', 'fill="#292D38"');
  const globe = svgp('M22 12C22 6.48 17.52 2 12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22|M8 3L9 3C7.05 8.84 7.05 15.16 9 21L8 21|M15 3C15.97 5.92 16.46 8.96 16.46 12|M3 16L3 15C5.92 15.97 8.96 16.46 12 16.46|M21 9C18.08 8.03 15.04 7.54 12 7.54|M3 9C4.59 8.47 6.21 8.09 7.85 7.84|M18.2 21.4C19.97 21.4 21.4 19.97 21.4 18.2C21.4 16.43 19.97 15 18.2 15C16.43 15 15 16.43 15 18.2C15 19.97 16.43 21.4 18.2 21.4ZM18.2 21.4|M22 22L21 21', 'fill="none" stroke="#292D38" stroke-width="1.5" stroke-linecap="round"');
  const plus = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 1.5v11M1.5 7h11"/></svg>';
  const mag = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8A8D96" stroke-width="2.4" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></svg>';
  const tick = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#292D38" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
  // 谱种照 App 的 versions.category；「文件」里另三份是样例；邮件附件大小是样例
  const cats = ['All', 'Urtext', 'Manuscripts', 'Edited Editions', 'Parts', 'Reductions', 'Arrangements', 'Other'];
  const files = [[P[7], 'Beethoven Op. 111.pdf'], [P[1], 'Nocturne Op. 9 No. 1.pdf'], [P[2], 'Ballade Op. 118 No. 3.pdf'], [P[4], "Feux d'artifice.pdf"]];
  const size = window.SN_LANG === 'de' ? '2,4 MB' : '2.4 MB';
  // 下载面板的文件信息（样例数据）：数字按语言写千分位
  const dmeta = `${snT('{n} downloads', {n: new Intl.NumberFormat(window.SN_LANG === 'de' ? 'de-DE' : 'en-US').format(4213)})} · ${snT('{n} pages', {n: 18})}`;
  const roll = n => `<span class="dg"><span>${Array.from({length:n},(_,i)=>`<span>${i+1}</span>`).join('')}</span></span>`;
  const gl = b => `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#292D38" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="${b?'M12 6l-6 6 6 6M19 6l-6 6 6 6':'M5 6l6 6-6 6M12 6l6 6-6 6'}"/></svg>`;
  const scores = [['k',P[0],t545],['',P[6],t331],['',P[5],'Sonata in C, KV 545']];
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
    <div class="sw">
      <div class="sl">
        <div class="h sb">${snT('Online Library')}</div>
        <div class="sq">${mag}<span class="ph">${snT('Work, composer, or catalog number')}</span><span class="qv">${[...'K. 331'].map((c, i) => `<span class="qc" style="--q:${i}">${c === ' ' ? '&nbsp;' : c}</span>`).join('')}<i class="cr"></i></span></div>
        <div class="rs">
          <i class="rk" style="top:17px;width:260px"></i><i class="rk" style="top:35px;width:170px"></i>
          <div class="rc">${ico(icons.music)}<span class="rt"><span class="sb">${t331}</span><small>Wolfgang Amadeus Mozart</small></span>${chev}</div>
        </div>
        <i class="tp snd b1" style="--td:${Q1}s;left:220px;top:148px"></i>
      </div>
      <div class="sh">
        <div class="nb" style="left:12px">${back}</div><div class="h sb">${snT('Editions and Parts')}</div>
        <div class="e e1 sb">${t331}</div><div class="e e2">Wolfgang Amadeus Mozart</div>
        <div class="e e3"><span class="ea">${snT('All')}${down}</span><span class="eb">${snT('Edited Editions')}${down}</span></div>
        <div class="e e4 sb">Breitkopf &amp; Härtel · Leipzig · 1878</div><div class="e e5">Public Domain</div><div class="e e6">Complete</div>
        <div class="fc"><div class="th"></div><div class="rr"><span class="ro">${check(10)}</span><span>Complete Score</span></div><div class="mm">${dmeta}</div></div>
        <div class="ft">
          <div class="fl"><span class="f0">${snT('Select a score')}</span><span class="f1"><span class="sb">Complete Score</span><small>${dmeta}</small></span></div>
          <div class="db">${dl}${snT('Download Selected Score')}<i class="tp snd b1" style="--td:${QD}s;left:50%;top:50%"></i></div>
        </div>
        <div class="hud"><i></i>${snT('Downloading')}</div>
        <div class="cm">${cats.map((c, i) => `<div class="ci${i === 3 ? ' ce' : ''}"><span>${i ? '' : tick}</span>${snT(c)}</div>`).join('')}</div>
        <i class="tp snd b1" style="--td:${QA}s;left:56px;top:138px"></i>
        <i class="tp snd b1" style="--td:${QE}s;left:124px;top:283px"></i>
        <i class="tp snd b1" style="--td:${QSel}s;left:${FX+16}px;top:${FY+217}px"></i>
      </div>
    </div>
    <div class="fp">
      <div class="nb" style="left:12px">${snT('Cancel')}</div><div class="h sb">${snT('Recents')}</div><div class="nb op sb" style="right:12px">${snT('Open')}<i class="tp snd b2" style="--td:${P2}s;left:50%;top:50%"></i></div>
      ${files.map(([src, name], i) => `<div class="fi${i ? '' : ' on'}" style="left:${FPX + i*(TW+28)}px"><div class="pt" style="background-image:url(${src})">${i ? '' : `<span class="ok">${check(10)}</span>`}</div><p>${name}</p></div>`).join('')}
      <i class="tp snd b2" style="--td:${P1}s;left:${FPX+TW/2}px;top:${FPT+TH/2}px"></i>
    </div>
    <div class="ml">
      <div class="ma">S</div><div class="ms sb">${snT('Scanner')}</div><div class="mj">Scan 2026-11-03</div><div class="mt">09:41</div>
      <div class="at"><div class="pt" style="background-image:url(${P[0]})"></div><p>Scan 2026-11-03.pdf<small>${size}</small></p></div>
      <div class="ss">
        <div class="sx"><i style="background-image:url(${P[0]})"></i><span>Scan 2026-11-03.pdf<small>${snT('PDF Document')} · ${size}</small></span></div>
        <div class="si on" style="left:22px"><i style="background-image:url(${A}app-icon.png)"></i><span>StaffNotes</span></div>
        ${[104, 186, 268].map(x => `<div class="si sg" style="left:${x}px"><i></i><span></span></div>`).join('')}
        <i class="tp snd b3" style="--td:${M3}s;left:52px;top:128px"></i>
      </div>
      <i class="tp snd b3" style="--td:${M1}s;left:${MAX+MW/2}px;top:${MAY+MH/2}px"></i>
    </div>
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
      <i class="tp snd b4" style="--td:${TV}s;left:${KW/2}px;top:${KH-28}px"></i>
      <i class="tp snd b4" style="--td:${TF-.2}s;left:${KW-41}px;top:${300+36+3*39+18+20}px"></i>
    </div>
    <div class="lib">
      <div class="ib">${plus}${snT('Import')}<i class="tp snd b1" style="--td:${TI}s;left:50%;top:50%"></i><i class="tp snd b2" style="--td:${TI}s;left:50%;top:50%"></i></div>
      <div class="mn">
        <div class="mi i1">${inbox}${snT('Import Score')}<i class="tp snd b2" style="--td:${TK}s;left:44px;top:50%"></i></div>
        <div class="mi i2">${globe}${snT('Online Library')}<i class="tp snd b1" style="--td:${TK}s;left:44px;top:50%"></i></div>
      </div>
      <div class="hd" style="top:${R1-40}px;--i:0">${snT('Composers')} <small>9</small></div>
      ${cmps.map((o,i)=>folder({...o,y:R1,i:i+1},i)).join('')}
      <div class="hd per" style="top:${R2-40}px;--i:3">${snT('Periods')} <small>8</small></div>
      ${pers.map((o,i)=>folder({...o,y:R2,i:i+4},i)).join('')}
      ${scores.map(([c,src,t],i)=>`<div class="sc ${c}" style="left:${colX(i+1)}px;--i:${i}"><div class="th" style="background-image:url(${src})"></div><p>${t}<small>Wolfgang Amadeus Mozart</small></p></div>`).join('')}
      <i class="tp snd b6" style="--td:0s;left:${colX(4)+CW/2}px;top:${R1+CH/2}px"></i>
    </div>
    <i class="tp snd tz" style="left:${colX(1)+SW/2}px;top:${R3+SH/2}px"></i>
    <div class="doc c2 cc" style="--fd:.87"><div class="pg" style="background-image:url(${P[6]})"></div></div>
    <div class="doc c cc" style="--fd:.75"><div class="pg" style="background-image:url(${P[6]})"></div></div>
    <div class="doc d2 dd" style="--fd:1.32"><div class="pg" style="background-image:url(${P[7]})"></div></div>
    <div class="doc d dd" style="--fd:1.2"><div class="pg" style="background-image:url(${A}op111-page.jpg)">${['red','gold','green','blue'].map((c,i)=>`<i class="ol o${i}" style="background-image:url(${A}op111-${c}.png)"></i>`).join('')}</div></div>
    <div class="doc b ab" style="--fd:.42"><div class="pg"></div></div>
    <div class="doc a ab" style="--fd:.3"><div class="pg"><div class="scan"></div></div><div class="fn">Scan 2026-11-03.pdf</div></div>
    <div class="rd">
      <div class="ttl"><span class="t1">1. Allegro · ${t545}<small>Wolfgang Amadeus Mozart · 1756 – 1791</small></span><span class="t2">2. Andante · ${t545}<small>Wolfgang Amadeus Mozart · 1756 – 1791</small></span></div>
      <div class="vp"><div class="p1" style="background-image:url(${A}k545-p1.jpg)"></div><div class="p5" style="background-image:url(${A}k545-p4.jpg)"></div></div>
      <div class="bar">
        <div class="mvb pr">${gl(1)}1. Allegro</div>
        <div class="pgc">${snT('Page')}<span class="pn"><span class="q1">1 / 8</span><span class="q2">4 / 8</span></span><i></i></div>
        <div class="mvb nx n1">2. Andante${gl(0)}</div>
        <div class="mvb nx n2">3. Rondo: Allegretto${gl(0)}</div>
      </div>
      <i class="rp" style="left:${W/2+84}px;top:${H-19}px"></i>
      <i class="tp snd t7" style="left:${W/2+84}px;top:${H-19}px"></i>
    </div>
  </div>`;
  const st = root.firstElementChild;

  let cur = 0, zpan = 0, dotPx = 26;
  const fit=()=>{
    const narrow = root.clientWidth < 560; root.classList.toggle('narrow', narrow);
    const s = root.clientWidth/(narrow ? VN : W), pan = narrow ? (cur===5 ? PN : cur===6 ? zpan*(W-VN)/2 : (W-VN)/2) : 0;
    st.style.transform=`translateX(${-pan*s}px) scale(${s})`;
    if(s) root.style.setProperty('--dotu', (dotPx/s).toFixed(2)+'px');
  };
  const ro=new ResizeObserver(fit); ro.observe(root); fit();

  // 自动连播：每拍按 DUR 播完自动进下一拍，拍 6 播完停在终态
  const DUR = [0, Math.round((QM+1.1)*1000), Math.round((LE+.3)*1000), Math.round((M4+1.35)*1000), Math.round((TV+.3)*1000), 2900, 2600, Math.round((T5+1.3)*1000)];
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
