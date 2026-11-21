/* r17 导入 + 整理：八拍连播（导入 3 拍 + 整理 5 拍），第 8 拍终态已将自建文件夹 Recital 展开在画面上（K. 545 在 col 2），大过场直接点 col 2 的 K. 545 放大进阅读器（只由外面的 zoom 驱动）。
   拍 1 公版乐谱下载：图书馆右上角「导入」→ 菜单点「在线曲库」→ 搜 K. 331 → 点作品进「Editions and Parts」→ 谱种从「全部」换成「编订版」→ 选完整乐谱、下载，谱子从缩略图浮起放大到中间；
   拍 2 标注导入：K. 331 让到左后方，「导入」→「导入乐谱」→ 系统「文件」里选带标注的 Op. 111、打开，谱子放大到中间，四种颜色先一起、再红金绿蓝一种一种单独看、最后一起；
   拍 3 PDF 导入：Op. 111 让到右后方，邮件里扫描仪发来的 K. 545 附件点开分享、选 StaffNotes，谱子落到最前面，接拍 4 的识别卡片；
   拍 4 乐谱识别：导入卡片，照 App 的 ScoreDetailSheet；
   拍 5 自动归档：卡片收起，三份谱子各自飞进作曲家和时期文件夹，数字一份一份往上加；
   拍 6 作曲家文件夹：点开 Mozart，K. 545、K. 331 和原来那份排在右边；
   拍 7 自建文件夹：收起 Mozart 并滚回曲库顶部 → 点右上角「选择」进管理模式 → 依次点选 K. 545、Op. 111、K. 331 → 点「新建」输入 Recital 并按 ✓ → 自动退出管理模式，3 份谱子飞入新文件夹 Recital（计数 3），本学期仍为 2（体现多归属）；
   拍 8 调整曲目顺序：点开 Recital 文件夹 → 长按弹出液态玻璃菜单选「调整顺序」→ 在排序弹窗把第 3 行 K. 331 拖到第 1 位并点「完成」→ 展开行原地更新为 [Recital, K. 331, K. 545, Op. 111]；
   大过场（zoom）：直接点展开行 col 2 的 K. 545 卡片放大飞入阅读器。 */
(function(){
window.SNSims = window.SNSims || {};
const W = 780, H = 580, A = (document.currentScript && document.currentScript.src) ? new URL('../assets/', document.currentScript.src).href : 'components/assets/';
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const LAST = 8, CANCEL7 = {};
// 多语言：界面字走 i18n-r13.js 的 snT（词表 i18n/organize.json、pens.json、folders.json）；时长照 App ScorePresentation.duration
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
// 拍 3：邮件 .65–1.1 升起，M1 点附件，M2 分享面板弹出，M3 点 StaffNotes，M4 邮件收起、谱子飞到中间
const ME = .65, M1 = 1.3, M2 = 1.6, M3 = 2.2, M4 = 2.65;
// 文件夹里的谱子卡片（与 410×580 阅读器谱纸同比例）
const SW = 136, SH = 192, SH7 = +(H*SW/410).toFixed(2);
// 阅读器谱纸 410 宽、居中；大过场从卡片缩略图放大到它
const VX = (W-410)/2, ZS = SW/410, T5 = 2.9;
// 手机：只看 ${VN} 宽的一段
const VN = 640;
// 手机拍 5：第 2–5 列在 VN 宽的窗口里居中
const PN = (colX(1) + colX(4) + CW)/2 - VN/2;
// 拍 7–8 自建文件夹视图网格：桌面 4 列（780 宽内对称留边 79）、窄屏 3 列（70..710 可视 640 宽内对称留边 68）
const X7D = 79, G7D = 26, X7N = 138, G7N = 48;
const x7 = (c, nar) => (nar ? X7N : X7D) + c*(SW + (nar ? G7N : G7D));
const Y7_1 = 62, Y7_2 = 350, ROW7 = Y7_2 - Y7_1, RISE7N = 120, ORH = 60;
// 拍 4 字段展开：TF 时点开，FS 是卡片列表往上滚的距离
const TF = 4.1, FS = 394, FR = 39;
const FU = .55, FH = .8, FD = .5, FL = FU + FH + FD, FP = [FU/FL, (FU + FH)/FL].map(v => (v*100).toFixed(1) + '%'), TV = TF + .12 + FL + .35;
const into = (c, rowY, s=.3) => pose(colX(c)+CW/2-DW*s/2, rowY+CH*.48-DH*s/2, s);
const G = n => `.sns-story.g${n}`;
const pc = (t, T) => (t/T*100).toFixed(2) + '%';
const ease7 = t => t < .5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2)/2;
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
/* 批注 81：只裁左右、上下放开。改用 clip-path 上下各留 400 px */
.sns-story{position:relative;width:100%;aspect-ratio:${W}/${H};--k:1;--ds:1.9;--dp:1.8;clip-path:inset(-400px 0 -400px 0)}
.sns-story.narrow{aspect-ratio:${VN}/${H};--ds:2.2;--dp:2}
/* 批注 77：手机竖屏一行只放得下 4 个文件夹，拍 1–5 收起第 1 列（Bach、Baroque），其余 4 列居中，标题对齐它们；拍 6 镜头左移时 Bach 再淡入 */
.sns-story.narrow .hd{left:${colX(1)+2}px}
.sns-story.narrow:not(.g6) .it.c0{opacity:0;transition-delay:0s}
.sns-story.narrow[data-s="6"] .hd,.sns-story.narrow[data-s="9"] .hd{left:${X0+2}px}
.sns-story *{box-sizing:border-box;margin:0;padding:0}
.sns-story .st{position:absolute;left:0;top:0;width:${W}px;height:${H}px;transform-origin:0 0;transition:transform calc(.9s*var(--k)) cubic-bezier(.2,.7,.2,1);font-family:"Timeless Sans",-apple-system,system-ui,sans-serif;color:#292D38;letter-spacing:-.01em;-webkit-font-smoothing:antialiased}
.sns-story.cut{--k:0}

/* 文档：每份谱子两张叠在一起（a/b 是 K. 545，c/c2 是 K. 331，d/d2 是 Op. 111），拍 5 才分开飞进作曲家和时期文件夹。 */
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

/* 图书馆右上角的「导入」按钮和它的菜单 */
.sns-story .ib{position:absolute;top:28px;right:17px;height:36px;padding:0 15px 0 12px;border-radius:18px;display:flex;align-items:center;gap:6px;font-size:15px;color:#3F529F;background:#fff;z-index:2;white-space:nowrap;opacity:0;
  box-shadow:0 1px 4px rgba(0,0,0,.06),0 4px 14px -6px rgba(41,45,56,.18),inset 0 0 0 .5px rgba(0,0,0,.05);transition:opacity calc(.3s*var(--k)),right calc(.9s*var(--k)) cubic-bezier(.2,.7,.2,1)}
.sns-story .ib svg{flex:none}
.sns-story.narrow:not(.g5) :is(.ib,.mn){right:87px}
.sns-story[data-s="1"] .ib{animation:snsTap1 calc(.35s*var(--k)) calc(${TI+.25}s*var(--k)) ease both,snsIbV1 calc(${TC+.2}s*var(--k)) linear both}
.sns-story[data-s="2"] .ib{animation:snsTap2 calc(.35s*var(--k)) calc(${TI+.25}s*var(--k)) ease both,snsIbV2 calc(${TC+.2}s*var(--k)) linear both}
@keyframes snsTap1{50%{transform:scale(.93)}100%{transform:none}}
@keyframes snsTap2{50%{transform:scale(.93)}100%{transform:none}}
@keyframes snsIbV1{0%{opacity:0}${pc(.2, TC+.2)}{opacity:1}${pc(TC, TC+.2)}{opacity:1}100%{opacity:0}}
@keyframes snsIbV2{0%{opacity:0}${pc(.2, TC+.2)}{opacity:1}${pc(TC, TC+.2)}{opacity:1}100%{opacity:0}}
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

/* 拍 1 的在线曲库：搜索页 → 推进「Editions and Parts」 */
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

/* 拍 2 系统「文件」 */
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

/* 邮件和曲库只在同一个视口内滑动。 */
.sns-story .mail-viewport,.sns-story .library-viewport{position:absolute;inset:0;overflow:hidden;pointer-events:none}
.sns-story .mail-viewport{z-index:6}
.sns-story.g7:not(.pre7) .lib{visibility:hidden;transition:translate calc(.8s*var(--k)) cubic-bezier(.2,.7,.2,1),visibility 0s calc(.8s*var(--k))}

/* 拍 3 邮件 */
.sns-story .ml{position:absolute;left:${KX}px;top:${KY}px;width:${KW}px;height:${KH}px;border-radius:24px;background:#fff;z-index:6;opacity:0;pointer-events:none;
  box-shadow:0 1px 3px rgba(170,178,197,.25),0 24px 60px -24px rgba(41,45,56,.28)}
.sns-story[data-s="3"] .ml{animation:snsMl calc(${M4+.35}s*var(--k)) linear both}
@keyframes snsMl{
  0%,${pc(ME, M4+.35)}{opacity:1;transform:translateY(${H-KY}px);animation-timing-function:cubic-bezier(.2,.7,.2,1)}
  ${pc(ME+.45, M4+.35)},${pc(M4, M4+.35)}{opacity:1;transform:none}
  100%{opacity:0;transform:scale(.97)}
}
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

/* 拍 4：导入卡片 */
${G(4)} .ab{transform:${pose(KX+TX, KY+TY, TS)};z-index:5;transition:transform calc(.9s*var(--k)) cubic-bezier(.2,.7,.2,1) calc(.08s*var(--k)),opacity calc(.5s*var(--k)) ease}
.sns-story[data-s="4"] .ab .pg{box-shadow:0 1px 3px rgba(0,0,0,.08),0 6px 16px -8px rgba(23,27,36,.2)}
${G(4)} :is(.cc,.dd){transform:${UNDER};transition:transform calc(.8s*var(--k)) cubic-bezier(.2,.7,.2,1) calc(.3s*var(--k)),opacity calc(.2s*var(--k))}
.sns-story[data-s="4"] .scan{animation:snsScan calc(1.5s*var(--k)) calc(.55s*var(--k)) cubic-bezier(.45,0,.55,1) both}
@keyframes snsScan{0%{opacity:0;transform:translateY(-100%)}12%{opacity:1}88%{opacity:1}100%{opacity:0;transform:translateY(300%)}}

/* 拍 5：三份谱子各自飞进作曲家和时期文件夹 */
${G(5)} .doc{opacity:0;transition:transform calc(1s*var(--k)) cubic-bezier(.55,0,.25,1) calc(var(--fd)*1s*var(--k)),opacity calc(.25s*var(--k)) ease calc((var(--fd) + .82)*1s*var(--k))}
${G(5)} .doc.a,${G(5)} .doc.c{transform:${into(4,R1)}}
${G(5)} .doc.b,${G(5)} .doc.c2{transform:${into(1,R2)}}
${G(5)} .doc.d{transform:${into(1,R1)}}
${G(5)} .doc.d2{transform:${into(2,R2)}}

.sns-story .card{position:absolute;left:${KX}px;top:${KY}px;width:${KW}px;height:${KH}px;border-radius:24px;background:#fff;z-index:4;box-shadow:0 1px 3px rgba(170,178,197,.25),0 24px 60px -24px rgba(41,45,56,.28);
  opacity:0;transform:translateY(24px) scale(.97);transition:opacity calc(.5s*var(--k)) ease,transform calc(.7s*var(--k)) cubic-bezier(.2,.7,.2,1)}
.sns-story[data-s="4"] .card{opacity:1;transform:none}
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
.sns-story .sv{position:absolute;left:50%;bottom:12px;height:32px;margin-left:-62px;width:124px;border-radius:16px;background:#3F529F;color:#fff;font-size:15px;display:grid;place-items:center;opacity:0;translate:0 8px;transition:opacity calc(.3s*var(--k)),translate calc(.45s*var(--k)) cubic-bezier(.2,.7,.2,1)}
.sns-story[data-s="4"] .sv{opacity:1;translate:0 0;transition-delay:calc(${TF+.12+FL}s*var(--k));animation:snsTap calc(.35s*var(--k)) calc(${TV+.2}s*var(--k)) ease both}
:root:lang(de) .sns-story .sv{left:0;right:0;width:max-content;margin:0 auto;padding:0 16px}
.sns-story .tp{opacity:0;--tl:.7s}
.sns-story .tp::after{content:"";position:absolute;inset:0;border-radius:50%;border:calc(var(--dotu,30px)*.06) solid rgba(41,45,56,.28);opacity:0;pointer-events:none}
${[1,2,3,4,6].map(n => `.sns-story[data-s="${n}"] .tp.b${n}`).join(',')}{animation:snsTp calc(var(--tl)*var(--k)) calc(var(--td)*var(--k)) linear both}
${[1,2,3,4,6].map(n => `.sns-story[data-s="${n}"] .tp.b${n}::after`).join(',')}{animation:snd-rip calc(.5s*var(--k)) calc((var(--td) + var(--tl)*.38)*var(--k)) ease-out both}
@keyframes snsTap{50%{transform:scale(.93)}100%{transform:none}}
@keyframes snsTp{0%{opacity:0;scale:1}22%{opacity:1;scale:1}38%{opacity:1;scale:.75}60%{opacity:1;scale:.75}74%{opacity:1;scale:1}100%{opacity:0;scale:1}}

/* 图书馆（拍 5–6） */
.sns-story .lib{position:absolute;inset:0;pointer-events:none;transition:translate calc(.8s*var(--k)) cubic-bezier(.2,.7,.2,1)}
${G(7)} .lib{translate:0 ${H}px}
.sns-story.pre7 .lib{translate:none}
.sns-story.g7 .mz.cmp,.sns-story.g7 .mz.cmp .cv,.sns-story.g7 .mz.cmp .pv,.sns-story.g7 .mz.cmp .bp,.sns-story.g7 .sc{
  transition-duration:calc(.45s*var(--k));transition-delay:0s
}
.sns-story.g7 .mz.cmp{transform:none}
.sns-story.g7 .mz.cmp .cv{width:90%;transform:none}
.sns-story.g7 .mz.cmp .pv{opacity:1}
.sns-story.g7 .mz.cmp .bp{opacity:0}

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

/* 拍 6：点开 Mozart */
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

/* ---------- 拍 7–8：自建文件夹与多归属 + 调整曲目顺序（复用 folders-r13 视觉语言与 App 014 排序弹窗） ---------- */
.sns-story .lib2{position:absolute;inset:0;z-index:7;opacity:0;pointer-events:none;translate:0 -${H}px;transition:translate calc(.8s*var(--k)) cubic-bezier(.2,.7,.2,1);user-select:none}
${G(7)} .lib2{opacity:1;translate:none}
.sns-story.pre7 .lib2{translate:0 -${H}px}
.sns-story.g7 .lib .sc{opacity:0;transform:translate(calc(${colX(4)-colX(1)}px - var(--i)*${CW+GAP}px),${R1-R3}px)}
.sns-story .lib2 .recent2{position:absolute;inset:0;transition:translate .62s cubic-bezier(.2,.7,.2,1)}
.sns-story .lib2.open .recent2{translate:0 -${ROW7}px;visibility:hidden;transition:translate .62s cubic-bezier(.2,.7,.2,1),visibility 0s .62s}
.sns-story.org-open .library-viewport{overflow:visible;clip-path:inset(0 0 -24px)}
/* 手机露出第三排，底边仍在进度条上方。 */
.sns-story.narrow.org-open .library-viewport{clip-path:inset(${-RISE7N}px 0 -188px)}
.sns-story.narrow.g7 .lib2.open{translate:0 ${-RISE7N}px}
.sns-story .lib2.open .tb2.br{opacity:0}
.sns-story .lib2 .sc2.fs{transition-delay:var(--member-delay,0s)}
.sns-story .lib2.now2 *,.sns-story .lib2.now2 *::before,.sns-story .lib2.now2 *::after{transition:none!important}
.sns-story .lib2 .ic2{display:block;width:20px;height:20px;flex:none}
.sns-story .lib2 .hd2{position:absolute;font-size:20px;display:flex;align-items:baseline;gap:9px;white-space:nowrap;transition:opacity .4s,transform .65s cubic-bezier(.2,.7,.2,1),top .65s cubic-bezier(.2,.7,.2,1)}
.sns-story .lib2 .hd2 small{position:relative;display:inline-grid;font-size:13px;color:#8C919B;font-variant-numeric:tabular-nums}
.sns-story .lib2 .roll2>span{grid-area:1/1;transition:opacity .25s,transform .4s cubic-bezier(.2,.7,.2,1)}
.sns-story .lib2 .roll2>span.in{opacity:0;transform:translateY(8px)}
.sns-story .lib2 .roll2>span.out{opacity:0;transform:translateY(-8px)}

/* 乐谱卡片（上排最近打开 & 展开的文件夹成员） */
.sns-story .lib2 .sc2{position:absolute;width:${SW}px;transition:left .58s cubic-bezier(.2,.7,.2,1),top .58s cubic-bezier(.2,.7,.2,1),opacity .38s,transform .58s cubic-bezier(.2,.7,.2,1)}
.sns-story .lib2 .sc2 .tap2{transform-origin:50% 42%;transition:transform .18s}
.sns-story .lib2 .sc2.prs .tap2,.sns-story .lib2 .fd2.prs .cv2{transform:scale(.96)}
.sns-story .lib2 .sc2 .cd2{transition:opacity .3s}
.sns-story .lib2.mg .sc2.rs2:not(.on) .cd2,.sns-story .lib2.mg .fd2 .cv2{opacity:.58}
.sns-story .lib2 .th2{height:${SH7}px;border-radius:5px;background:#fff center top/cover no-repeat;box-shadow:0 1px 2px rgba(0,0,0,.08),0 6px 14px -6px rgba(23,27,36,.14)}
.sns-story .lib2 .sc2 p{margin-top:7px;font-size:11.5px;line-height:1.25;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.sns-story .lib2 .sc2 small{display:block;font-size:10.5px;line-height:1.25;color:#8C919B;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sns-story .lib2 .mk2{position:absolute;z-index:2;left:0;top:0;width:34px;height:34px;display:grid;place-items:center}
.sns-story .lib2 .mk2>*{grid-area:1/1;transition:opacity .25s,transform .35s cubic-bezier(.3,1.4,.5,1)}
.sns-story .lib2 .dots2{font-size:16px;letter-spacing:1px;line-height:1;margin-top:-6px}
.sns-story .lib2 .ci2{width:20px;height:20px;border-radius:50%;background:rgba(255,255,255,.92);box-shadow:inset 0 0 0 1.5px #646A75;opacity:0;transform:scale(.6)}
.sns-story .lib2 .nb2{width:20px;height:20px;border-radius:50%;background:#3F529F;color:#fff;font:600 11.5px/20px "Timeless Sans",sans-serif;text-align:center;font-variant-numeric:tabular-nums;opacity:0;transform:scale(.5)}
.sns-story .lib2.mg .sc2.rs2 .dots2,.sns-story .lib2.mg .fd2 .dots2{opacity:0}
.sns-story .lib2.mg .sc2.rs2 .ci2,.sns-story .lib2.mg .fd2 .ci2{opacity:1;transform:none}
.sns-story .lib2.mg .sc2.rs2.on .ci2{opacity:0}
.sns-story .lib2.mg .sc2.rs2.on .nb2{opacity:1;transform:none}

/* 文件夹卡片（Recital 自建文件夹 + Mozart 作曲家文件夹 + 我的分类） */
.sns-story .lib2 .fd2{position:absolute;width:${SW}px;height:${SH7}px;transition:left .62s cubic-bezier(.2,.7,.2,1),top .62s cubic-bezier(.2,.7,.2,1),opacity .4s,transform .62s cubic-bezier(.2,.7,.2,1)}
.sns-story .lib2 .bp2{position:absolute;left:34%;top:5%;width:62%;height:90%;border-radius:10px;background:#E6E6E8;opacity:0;transition:opacity .4s}
.sns-story .lib2 .pv2{position:absolute;left:30%;top:8%;width:66%;height:84%;border-radius:4px;background:#fff center top/cover no-repeat;box-shadow:0 1px 2px rgba(0,0,0,.08);transition:opacity .3s}
.sns-story .lib2 .cv2{position:absolute;left:0;top:0;width:90%;height:100%;border-radius:10px;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.05),0 6px 14px -6px rgba(23,27,36,.12);overflow:hidden;transform-origin:50% 60%;transition:transform .55s cubic-bezier(.2,.7,.2,1),width .55s cubic-bezier(.2,.7,.2,1),opacity .3s,box-shadow .25s}
.sns-story .lib2 .fd2 .mk2{left:-1px;top:-3px}
.sns-story .lib2 .n2{position:absolute;z-index:2;right:12px;top:7px;height:18px;display:grid;justify-items:end;font-size:14.4px;color:#646A75;font-variant-numeric:tabular-nums}
.sns-story .lib2 .cv2>.ic2{position:absolute;left:30%;top:31%;width:40%;height:24%;color:#292D38;stroke-width:1.15}
.sns-story .lib2 .cv2>.ip2{position:absolute;left:30%;top:31%;width:40%;height:24%;background:#292D38;-webkit-mask:center/contain no-repeat;mask:center/contain no-repeat}
.sns-story .lib2 .av2{position:absolute;left:6%;top:9%;width:88%;height:62%;background:#fff center bottom/contain no-repeat}
.sns-story .lib2 .t2{position:absolute;left:12px;right:8px;bottom:14px;font:16.1px/1.08 var(--serif,"Timeless Serif",Georgia,serif);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sns-story .lib2 .t2.wr{white-space:normal;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical}
.sns-story .lib2 .t2 .f{display:block;font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:1px}
.sns-story .lib2 .t2 .z{font-size:18px}
.sns-story .lib2 .fd2.rc2:not(.has) .pv2{opacity:0}
.sns-story .lib2 .fd2.rc2.bump .cv2{animation:snsBump2 .42s cubic-bezier(.2,.7,.2,1)}
@keyframes snsBump2{40%{transform:scale(.95)}}
.sns-story .lib2.open .fd2.rc2 .cv2{width:80%;transform:rotate(-2.5deg)}
.sns-story .lib2.open .fd2.rc2 .bp2{opacity:1}
.sns-story .lib2.open .fd2.rc2 .pv2{opacity:0}
.sns-story .lib2 .fd2.rc2.hold{z-index:8}
.sns-story .lib2 .fd2.rc2.hold .cv2{transform:rotate(-2.5deg) scale(1.03);box-shadow:0 8px 28px -8px rgba(23,27,36,.32)}

/* 飞入新文件夹的乐谱缩略图 */
.sns-story .lib2 .gh2{position:absolute;left:0;top:0;width:${SW}px;height:${SH7}px;border-radius:5px;background:#fff center top/cover no-repeat;transform-origin:0 0;z-index:6;pointer-events:none;
  box-shadow:0 1px 3px rgba(0,0,0,.08),0 18px 40px -14px rgba(23,27,36,.28)}

/* 顶部液态玻璃工具栏（浏览态 Select & 管理态 6 胶囊） */
.sns-story .lib2 .tb2{position:absolute;top:14px;right:${X7D}px;height:36px;display:flex;gap:6px;justify-content:flex-end;z-index:7;transition:opacity .28s,transform .32s cubic-bezier(.2,.7,.2,1);transform-origin:100% 50%}
.sns-story.narrow .lib2 .tb2{right:86px}
.sns-story.narrow .lib2 .tb2.mt .gb2.x{padding:0;width:36px;justify-content:center}
.sns-story.narrow .lib2 .tb2.mt .gb2.x>span{display:none}
.sns-story .lib2 .gb2{height:36px;padding:0 11px 0 8px;border-radius:18px;display:flex;align-items:center;gap:4px;font-size:14.5px;white-space:nowrap;background:#fff;color:#292D38;overflow:hidden;
  box-shadow:0 1px 4px rgba(0,0,0,.06),0 4px 14px -6px rgba(41,45,56,.18),inset 0 0 0 .5px rgba(0,0,0,.05);transition:transform .18s,max-width .42s cubic-bezier(.2,.7,.2,1),padding .42s cubic-bezier(.2,.7,.2,1),margin .42s cubic-bezier(.2,.7,.2,1),opacity .25s}
.sns-story .lib2 .gb2.prs{transform:scale(.93)}
.sns-story .lib2 .tb2.br .gb2{color:#3F529F;padding:0 13px 0 10px}
.sns-story .lib2 .gb2.x{max-width:132px}
.sns-story .lib2 .gb2.del{color:#FF3B30}
.sns-story .lib2 .tb2.mt:not(.has) .gb2.x{max-width:0;padding:0;margin-left:-6px;opacity:0}
.sns-story .lib2 .gb2.cnt{gap:10px;padding:0 4px 0 9px}
.sns-story .lib2 .gb2.cnt>span:first-child{display:flex;align-items:center;gap:4px}
.sns-story .lib2 .gb2.cnt .roll2{display:inline-grid;min-width:9px}
.sns-story .lib2 .gb2.cnt .dn2{height:28px;padding:0 11px;border-radius:14px;background:#3F529F;color:#fff;display:grid;place-items:center;font-size:14px}
.sns-story .lib2 .tb2.mt{opacity:0;transform:translateY(-10px) scale(.92)}
.sns-story .lib2.mg .tb2.mt{opacity:1;transform:none}
.sns-story .lib2.mg .tb2.br{opacity:0;transform:translateY(-10px) scale(.92)}
.sns-story .lib2.pop .tb2.mt{opacity:0;transition-duration:.18s}

/* 拍 7 新建文件夹毛玻璃弹窗（右上角长出，✓ 随输入变蓝） */
.sns-story .lib2 .po2{position:absolute;top:18px;right:${X7D}px;width:344px;height:242px;border-radius:24px;background:rgba(244,244,246,.97);z-index:9;overflow:hidden;opacity:0;transform:scale(.88);transform-origin:100% 0;
  box-shadow:0 0 0 .5px rgba(0,0,0,.06),0 18px 50px -14px rgba(41,45,56,.36);transition:opacity .25s,transform .42s cubic-bezier(.2,.7,.2,1)}
.sns-story.narrow .lib2 .po2{left:218px;right:auto;transform-origin:50% 0}
.sns-story .lib2.pop .po2{opacity:1;transform:none}
.sns-story .lib2 .nv2{position:relative;height:54px;display:flex;align-items:center;justify-content:center;padding:0 10px}
.sns-story .lib2 .nv2 h4{font-size:15.5px;font-weight:600;white-space:nowrap;max-width:210px;overflow:hidden;text-overflow:ellipsis}
.sns-story .lib2 .nv2 .gb2{position:absolute;top:10px;height:34px;padding:0 13px;font-size:15px;color:#3F529F;box-shadow:0 1px 3px rgba(0,0,0,.06),0 4px 12px -6px rgba(41,45,56,.2),inset 0 0 0 .5px rgba(0,0,0,.05)}
.sns-story .lib2 .nv2 .gb2.ico{width:34px;padding:0;justify-content:center}
.sns-story .lib2 .nv2 .l{left:10px}.sns-story .lib2 .nv2 .r{right:10px}
.sns-story .lib2 .nv2 .ok2{color:#B4B7BE;transition:color .22s,background .22s,transform .18s}
.sns-story .lib2 .nv2 .ok2.go{background:#3F529F;color:#fff}
.sns-story .lib2 .grp2{margin:2px 16px 0;border-radius:12px;background:#fff;overflow:hidden}
.sns-story .lib2 .row2{position:relative;min-height:44px;display:flex;align-items:center;gap:11px;padding:0 14px;font-size:15px}
.sns-story .lib2 .row2+.row2::before{content:"";position:absolute;left:14px;right:0;top:0;border-top:.5px solid rgba(60,60,67,.18)}
.sns-story .lib2 .row2.hint{min-height:0;padding:10px 14px 11px;font-size:12.5px;line-height:1.35;color:#8C919B}
.sns-story .lib2 .tx2{display:flex;align-items:center;white-space:pre}
.sns-story .lib2 .ph2{color:#B4B7BE}
.sns-story .lib2 .cr2{width:2px;height:19px;margin:0 1px;border-radius:1px;background:#3F529F;animation:snsCr2 1s steps(1) infinite}
@keyframes snsCr2{50%{opacity:0}}

/* 拍 8 长按液态玻璃上下文菜单（4 项：Select Contents / Reorder Scores / Rename… / 红色 Delete…） */
.sns-story .lib2 .ctx2{position:absolute;top:${Y7_2 + 18}px;left:var(--ctx-x,${X7D}px);min-width:222px;border-radius:14px;background:rgba(252,252,254,.96);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);z-index:10;overflow:hidden;
  opacity:0;transform:scale(.88);transform-origin:24px 0;box-shadow:0 0 0 .5px rgba(0,0,0,.08),0 16px 44px -10px rgba(23,27,36,.34);transition:opacity .22s,transform .32s cubic-bezier(.2,.8,.2,1)}
.sns-story .lib2.ctx .ctx2{opacity:1;transform:none}
.sns-story .lib2 .cmi2{position:relative;height:40px;padding:0 14px 0 16px;display:flex;align-items:center;justify-content:space-between;gap:16px;font-size:14.5px;white-space:nowrap;transition:background .15s}
.sns-story .lib2 .cmi2+.cmi2::before{content:"";position:absolute;left:0;right:0;top:0;border-top:.5px solid rgba(60,60,67,.16)}
.sns-story .lib2 .cmi2.sep::before{border-top:6px solid rgba(60,60,67,.08)}
.sns-story .lib2 .cmi2.sep{height:46px;padding-top:6px;color:#FF3B30}
.sns-story .lib2 .cmi2.hl{background:#E8E8ED}
.sns-story .lib2 .cmi2 svg{width:18px;height:18px;flex:none}

/* 拍 8 文件夹成员排序弹窗（LibraryFolderMemberOrderList：居中白底列表 + 右侧三横杠手柄拖动排序） */
.sns-story .lib2 .ord-bg2{position:absolute;inset:-40px 0;background:rgba(23,27,36,.12);z-index:9;opacity:0;transition:opacity .28s}
.sns-story .lib2.modal .ord-bg2{opacity:1}
.sns-story .lib2 .ord2{position:absolute;left:50%;top:118px;width:392px;height:${58 + 3*ORH + 22}px;margin-left:-196px;border-radius:24px;background:#F4F4F6;z-index:10;overflow:hidden;
  opacity:0;transform:translateY(18px) scale(.95);box-shadow:0 0 0 .5px rgba(0,0,0,.06),0 24px 60px -16px rgba(23,27,36,.38);transition:opacity .26s,transform .38s cubic-bezier(.2,.75,.2,1)}
.sns-story .lib2.modal .ord2{opacity:1;transform:none}
.sns-story .lib2 .ogrp2{position:relative;margin:2px 16px 0;height:${3*ORH}px;border-radius:13px;background:#fff;box-shadow:0 0 0 .5px rgba(0,0,0,.04)}
.sns-story .lib2 .orow2{position:absolute;left:0;right:0;top:0;height:${ORH}px;padding:0 14px;display:flex;align-items:center;gap:12px;background:#fff;border-radius:13px;
  transition:transform .32s cubic-bezier(.2,.75,.2,1),box-shadow .2s}
.sns-story .lib2 .orow2::after{content:"";position:absolute;left:60px;right:0;bottom:0;border-bottom:.5px solid rgba(60,60,67,.16)}
.sns-story .lib2 .orow2.last::after,.sns-story .lib2 .orow2.drag::after{opacity:0}
.sns-story .lib2 .orow2.drag{z-index:3;transition:box-shadow .2s;box-shadow:0 10px 26px -6px rgba(23,27,36,.24),0 0 0 .5px rgba(0,0,0,.06)}
.sns-story .lib2 .oth2{width:34px;height:46px;border-radius:3px;background:#fff center top/cover no-repeat;box-shadow:0 1px 2px rgba(0,0,0,.1),0 0 0 .5px rgba(0,0,0,.08);flex:none}
.sns-story .lib2 .otx2{flex:1;min-width:0;font-size:13.5px;line-height:1.28;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.sns-story .lib2 .ograb2{width:20px;height:20px;flex:none;display:block}

/* 拍 7–8 交互圆点（含长按外扩圆环） */
.sns-story .st>.snd.d2{left:0;top:0;z-index:12;opacity:0;transition:opacity .18s,transform .12s}
.sns-story .st>.snd.d2.hld::before{content:"";position:absolute;inset:-8px;border-radius:50%;border:2px solid rgba(63,82,159,.45);animation:snsHold2 .45s ease-out both}
@keyframes snsHold2{0%{opacity:0;transform:scale(.6)}35%{opacity:1}100%{opacity:0;transform:scale(1.55)}}

/* 大过场放大阅读器（从展开行 col 2 的 K. 545 放大成 410×580 阅读器谱纸） */
.sns-story .rd{position:absolute;left:0;top:0;width:${W}px;height:${H}px;z-index:8;pointer-events:none;transform-origin:0 0;opacity:0;
  transform:translate(${x7(2,false)-VX*ZS}px,${Y7_2}px) scale(${ZS});transition:transform calc(.65s*var(--k)) cubic-bezier(.3,.75,.15,1),opacity calc(.12s*var(--k)) linear calc(.5s*var(--k))}
.sns-story[data-s="9"] .rd{opacity:1;transform:none;transition-delay:0s}
.sns-story .rd .ttl,.sns-story .rd .bar{z-index:2;opacity:0;transition:opacity calc(.3s*var(--k))}
.sns-story[data-s="9"] .rd .ttl,.sns-story[data-s="9"] .rd .bar{opacity:1;transition-delay:calc(.55s*var(--k))}
.sns-story .vp{position:absolute;left:${VX}px;top:0;width:410px;border-radius:calc(5px/${ZS});height:${H}px;overflow:hidden}
.sns-story .vp>div{position:absolute;inset:0;background:#fff center top/contain no-repeat;transition:opacity calc(.12s*var(--k))}
.sns-story .vp .p5,.sns-story[data-s="9"] .vp .p1{opacity:0}
.sns-story[data-s="9"] .vp .p5{opacity:1}
.sns-story .ttl{position:absolute;left:50%;top:8px;height:22px;transform:translateX(-50%);display:grid;place-items:center;padding:0 11px;border-radius:11px;background:rgba(255,255,255,.9);box-shadow:0 1px 2px rgba(0,0,0,.07),inset 0 0 0 .5px rgba(0,0,0,.06);white-space:nowrap;text-align:center}
.sns-story .ttl>span{grid-area:1/1;font-size:7.2px;line-height:1.12;transition:opacity calc(.2s*var(--k))}
.sns-story .ttl small{display:block;font-size:5.9px;color:#8C919B}
.sns-story .ttl .t2,.sns-story[data-s="9"] .ttl .t1{opacity:0}
.sns-story[data-s="9"] .ttl .t2{opacity:1}
.sns-story .bar{position:absolute;left:0;right:0;top:${H-30}px;height:22px;translate:var(--bx,0px) 0}
.sns-story .pgc{position:absolute;left:50%;top:0;width:92px;height:22px;margin-left:-46px;display:flex;align-items:center;justify-content:center;gap:5px;border-radius:11px;background:rgba(255,255,255,.9);box-shadow:0 1px 2px rgba(0,0,0,.07),inset 0 0 0 .5px rgba(0,0,0,.06);font-size:8.5px;color:#646A75;overflow:hidden}
.sns-story .pn{position:relative;display:grid;padding:2px 5px;border-radius:4px;background:#EDEDEF;color:#292D38;font-variant-numeric:tabular-nums}
.sns-story .pn span{grid-area:1/1;text-align:center;transition:opacity calc(.12s*var(--k))}
.sns-story .pn .q2,.sns-story[data-s="9"] .pn .q1{opacity:0}
.sns-story[data-s="9"] .pn .q2{opacity:1}
.sns-story .pgc i{position:absolute;left:11px;bottom:0;height:1.5px;width:calc((92px - 22px)/12);border-radius:1px;background:#3F529F}
.sns-story .mvb{position:absolute;top:0;height:22px;display:flex;align-items:center;gap:4px;padding:0 9px;border-radius:11px;background:rgba(255,255,255,.9);box-shadow:0 1px 2px rgba(0,0,0,.07),inset 0 0 0 .5px rgba(0,0,0,.06);font-size:8.5px;white-space:nowrap;transition:opacity calc(.2s*var(--k))}
.sns-story.narrow .mvb{width:22px;padding:0;justify-content:center}
.sns-story.narrow .mvb span{display:none}
.sns-story .mvb svg{flex:none;width:8px;height:8px}
.sns-story .mvb.nx{left:${W/2+52}px}.sns-story .mvb.pr{right:${W/2+52}px}
.sns-story .mvb.n2,.sns-story .mvb.pr{opacity:0}
.sns-story .tp.t7{z-index:3}
.sns-story .rp{position:absolute;z-index:3;width:40px;height:40px;margin:-20px 0 0 -20px;border-radius:50%;border:2px solid rgba(41,45,56,.45);opacity:0;pointer-events:none}
/* r9：zoom 时这些元素由脚本逐帧摆位，关掉过渡 */
.sns-story.zm .rd,.sns-story.zm .lib,.sns-story.zm .lib2,.sns-story.zm .sc,.sns-story.zm .sc2,.sns-story.zm .sc2 .tap2,.sns-story.zm .rd .ttl,.sns-story.zm .rd .bar,.sns-story.zm .tp.tz{transition:none!important}
.sns-story .tp.tz{z-index:9}
`;

// 文件夹封面和新来的谱子：6 是下载的 K. 331，7 是带批注的 Op. 111
const P = [A+'k545-p1.jpg', A+'th-Chopin_Nocturne_Op9_No1.jpg', A+'th-Brahms_Ballade_Op118_No3.jpg', A+'th-Schumann_Melodie_Op68_No1.jpg', A+'th-Debussy_Feux_dartifice.jpg', A+'k545-ed2.jpg', A+'k331-p1.jpg', A+'op111-annot.jpg'];
const folderSvg = '<svg class="ic" viewBox="0 0 48 40" fill="none" stroke="#292D38" stroke-width="2.6" stroke-linejoin="round"><path d="M4 9a4 4 0 0 1 4-4h10l5 5h17a4 4 0 0 1 4 4v18a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"/></svg>';
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

// 拍 7–8 图标（照 App LibraryManagementIcons 与 SF Symbols）
const P7 = {
  folder: 'M22 11V17C22 21 21 22 17 22H7C3 22 2 21 2 17V7C2 3 3 2 7 2H8.5C10 2 10.33 2.44 10.9 3.2L12.4 5.2C12.78 5.7 13 6 14 6H17C21 6 22 7 22 11Z',
  add: 'M9.5 14H14.5M12 11.5V16.5', join: 'M12 10.7V17.3M9.2 14.5L12 17.3L14.8 14.5', mem: 'M10.8 11.1H15.8M10.8 14H15.8M10.8 16.9H15.8',
  heart: 'M9.19997 14.7805L11.78 17.0405C11.9 17.1505 12.09 17.1505 12.21 17.0405L14.79 14.7805C15.46 14.1905 15.55 13.1905 14.99 12.4905C14.43 11.7905 13.41 11.6605 12.7 12.2005L12 12.7405L11.29 12.2105C10.57 11.6705 9.55997 11.8005 8.99997 12.5005C8.43997 13.1905 8.52997 14.2005 9.19997 14.7805Z'
};
const svg2 = (body, cls = '') => `<svg class="ic2 ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
const lm2 = extra => svg2(`<g transform="translate(-0.279070 -0.279070) scale(1.023256)"><path d="${P7.folder}"/>${extra}</g>`);
const I2 = {
  folder: lm2(''), add: lm2(`<path d="${P7.add}"/>`), join: lm2(`<path d="${P7.join}"/>`), mem: lm2(`<path d="${P7.mem}"/>`),
  fav: lm2(`<g transform="translate(0 -0.5)"><path d="${P7.heart}"/></g>`),
  sel: svg2('<circle cx="12" cy="12" r="9.2"/><path d="M8.2 12.3l2.6 2.6 5-5.4"/>'),
  list: svg2('<path d="M3.6 6.2l1.4 1.4 2.6-2.8M3.6 12.2l1.4 1.4 2.6-2.8M3.6 18.2l1.4 1.4 2.6-2.8M10.6 6.6H20.6M10.6 12.6H20.6M10.6 18.6H20.6"/>'),
  trash: svg2('<path d="M4.5 6.5h15M9.5 6.5V4.8c0-.6.4-1 1-1h3c.6 0 1 .4 1 1v1.7M6.6 6.5l.8 12.2c.1 1 .9 1.8 1.9 1.8h5.4c1 0 1.8-.8 1.9-1.8l.8-12.2M10.2 10.2v6.6M13.8 10.2v6.6"/>'),
  x: svg2('<path d="M7 7l10 10M17 7L7 17"/>'), ok: svg2('<path d="M5.6 12.6l4.2 4.2 8.6-9.4"/>'),
  reorder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><path d="M8 5v14M4.5 8.5L8 5l3.5 3.5M16 19V5M12.5 15.5L16 19l3.5-3.5"/></svg>',
  pencil: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><path d="M16.2 4.2a2.2 2.2 0 0 1 3.1 3.1L8 18.6l-4.2 1.1 1.1-4.2z"/></svg>',
  grab: '<svg class="ograb2" viewBox="0 0 20 20" fill="none" stroke="#AEAEB4" stroke-width="1.8" stroke-linecap="round"><path d="M3.5 6.5h13M3.5 10h13M3.5 13.5h13"/></svg>'
};
const SC7 = [
  {id: 'k545', img: 'k545-p1.jpg', t: 'Piano Sonata No. 16 in C Major, K. 545', c: 'Wolfgang Amadeus Mozart'},
  {id: 'op111', img: 'op111-annot.jpg', t: 'Piano Sonata No. 32 in C Minor, Op. 111', c: 'Ludwig van Beethoven'},
  {id: 'k331', img: 'k331-p1.jpg', t: 'Piano Sonata No. 11 in A Major, K. 331', c: 'Wolfgang Amadeus Mozart'}
];
const BY7 = Object.fromEntries(SC7.map(s => [s.id, s]));

SNSims['r13/story-r13'] = function(root){
  if(!document.getElementById('sns-story-r13-css')){ const s=document.createElement('style'); s.id='sns-story-r13-css'; s.textContent=CSS; document.head.appendChild(s); }
  root.classList.add('sns-story');
  if(RM) root.style.setProperty('--k','0');
  const NAME7 = () => snT('Recital');

  const cmps = [
    {cmp:'bach', first:'Johann Sebastian', last:'Bach', n:3, pa:1},{cmp:'beethoven', first:'Ludwig van', last:'Beethoven', n:2, pa:2, t:[2.12], nv:[7]},
    {cmp:'chopin', first:'Frédéric', last:'Chopin', n:4, pa:1},{cmp:'haydn', first:'Joseph', last:'Haydn', n:2, pa:3},
    {cmp:'mozart', first:'Wolfgang Amadeus', last:'Mozart', n:1, pa:5, mz:1, t:[1.22, 1.67], nv:[0, 6]}];
  const pers = [
    {label:'Baroque', years:'1600 – 1750', png:'baroque', n:3, pa:3},{label:'Classical', years:'1750 – 1820', png:'classical', n:3, pa:5, t:[1.34, 1.79], nv:[0, 6]},
    {label:'Romantic', years:'1820 – 1900', png:'romantic', n:12, pa:1, t:[2.24], nv:[7]},{label:'Modern', years:'1900 – 1945', png:'early20', n:6, pa:4},
    {label:'Contemporary', years:'1945 –', png:'modern', n:3, pa:2}];
  const check = (s=12) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>`;
  const t545 = snT('Piano Sonata No. 16 in C Major, K. 545'), t331 = snT('Piano Sonata No. 11 in A Major, K. 331');
  const meta = [['m1',t545,300],['m2','Wolfgang Amadeus Mozart · 1756 – 1791',230],['m3',`${snT('Classical')} · ${min(11.5)}`,110]];
  const mvs = [['1.','Allegro',snT('C Major'),min(3.5),1],['2.','Andante',snT('G Major'),min(6),4],['3.','Rondo: Allegretto',snT('C Major'),min(1.5),7]];
  const chev = '<svg width="9" height="14" viewBox="0 0 9 14" fill="none" stroke="#292D38" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="m1.5 1.5 5.5 5.5-5.5 5.5"/></svg>';
  const back = '<svg width="9" height="14" viewBox="0 0 9 14" fill="none" stroke="#292D38" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 1.5-5.5 5.5 5.5 5.5"/></svg>';
  const down = '<svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="#3F529F" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="m1 1 4 4 4-4"/></svg>';
  const dl = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/></svg>';
  const svgp = (ps, a) => `<svg viewBox="0 0 24 24" ${a}>${ps.split('|').map(d => `<path d="${d}"/>`).join('')}</svg>`;
  const inbox = svgp('M12 9.75C11.9 9.75 11.81 9.73 11.71 9.69C11.43 9.58 11.25 9.3 11.25 9L11.25 2C11.25 1.59 11.59 1.25 12 1.25C12.41 1.25 12.75 1.59 12.75 2L12.75 7.19L13.47 6.47C13.76 6.18 14.24 6.18 14.53 6.47C14.82 6.76 14.82 7.24 14.53 7.53L12.53 9.53C12.39 9.67 12.2 9.75 12 9.75ZM12 9.75|M12 9.75C11.81 9.75 11.62 9.68 11.47 9.53L9.47 7.53C9.18 7.24 9.18 6.76 9.47 6.47C9.76 6.18 10.24 6.18 10.53 6.47L12.53 8.47C12.82 8.76 12.82 9.24 12.53 9.53C12.38 9.68 12.19 9.75 12 9.75ZM12 9.75|M13.76 17.75L10.23 17.75C9.18 17.75 8.24 17.17 7.77 16.23L6.6 13.89C6.56 13.8 6.47 13.75 6.38 13.75L1.98 13.75C1.57 13.75 1.23 13.41 1.23 13C1.23 12.59 1.57 12.25 1.98 12.25L6.39 12.25C7.06 12.25 7.66 12.62 7.96 13.22L9.13 15.56C9.34 15.99 9.77 16.25 10.25 16.25L13.78 16.25C14.26 16.25 14.69 15.99 14.9 15.56L16.07 13.22C16.37 12.62 16.97 12.25 17.64 12.25L22 12.25C22.41 12.25 22.75 12.59 22.75 13C22.75 13.41 22.41 13.75 22 13.75L17.64 13.75C17.54 13.75 17.46 13.8 17.42 13.89L16.25 16.23C15.75 17.17 14.81 17.75 13.76 17.75ZM13.76 17.75|M15 22.75L9 22.75C3.57 22.75 1.25 20.43 1.25 15L1.25 11C1.25 6.31 2.99 3.96 6.89 3.39C7.31 3.33 7.68 3.61 7.74 4.02C7.8 4.43 7.52 4.81 7.11 4.87C3.97 5.33 2.75 7.05 2.75 11L2.75 15C2.75 19.61 4.39 21.25 9 21.25L15 21.25C19.61 21.25 21.25 19.61 21.25 15L21.25 11C21.25 7.05 20.03 5.33 16.89 4.87C16.48 4.81 16.2 4.43 16.26 4.02C16.32 3.61 16.7 3.33 17.11 3.39C21.01 3.96 22.75 6.31 22.75 11L22.75 15C22.75 20.43 20.43 22.75 15 22.75ZM15 22.75', 'fill="#292D38"');
  const globe = svgp('M22 12C22 6.48 17.52 2 12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22|M8 3L9 3C7.05 8.84 7.05 15.16 9 21L8 21|M15 3C15.97 5.92 16.46 8.96 16.46 12|M3 16L3 15C5.92 15.97 8.96 16.46 12 16.46|M21 9C18.08 8.03 15.04 7.54 12 7.54|M3 9C4.59 8.47 6.21 8.09 7.85 7.84|M18.2 21.4C19.97 21.4 21.4 19.97 21.4 18.2C21.4 16.43 19.97 15 18.2 15C16.43 15 15 16.43 15 18.2C15 19.97 16.43 21.4 18.2 21.4ZM18.2 21.4|M22 22L21 21', 'fill="none" stroke="#292D38" stroke-width="1.5" stroke-linecap="round"');
  const plus = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 1.5v11M1.5 7h11"/></svg>';
  const mag = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8A8D96" stroke-width="2.4" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></svg>';
  const tick = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#292D38" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
  const cats = ['All', 'Urtext', 'Manuscripts', 'Edited Editions', 'Parts', 'Reductions', 'Arrangements', 'Other'];
  const files = [[P[7], 'Beethoven Op. 111.pdf'], [P[1], 'Nocturne Op. 9 No. 1.pdf'], [P[2], 'Ballade Op. 118 No. 3.pdf'], [P[4], "Feux d'artifice.pdf"]];
  const size = window.SN_LANG === 'de' ? '2,4 MB' : '2.4 MB';
  const dmeta = `${snT('{n} downloads', {n: new Intl.NumberFormat(window.SN_LANG === 'de' ? 'de-DE' : 'en-US').format(4213)})} · ${snT('{n} pages', {n: 18})}`;
  const roll = n => `<span class="dg"><span>${Array.from({length:n},(_,i)=>`<span>${i+1}</span>`).join('')}</span></span>`;
  const gl = b => `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#292D38" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="${b?'M12 6l-6 6 6 6M19 6l-6 6 6 6':'M5 6l6 6-6 6M12 6l6 6-6 6'}"/></svg>`;
  const scores = [['k',P[0],t545],['',P[6],t331],['',P[5],'Sonata in C, KV 545']];
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

  const scCard7 = (s, cls) => `<div class="sc2 ${cls}" data-id="${s.id}"><div class="tap2"><div class="mk2"><span class="dots2">···</span><i class="ci2"></i><b class="nb2"></b></div>`
    + `<div class="cd2"><div class="th2" style="background-image:url(${A}${s.img})"></div><p>${snT(s.t)}</p><small>${snT(s.c)}</small></div></div></div>`;
  const fxFolders7 = [
    `<div class="fd2 fx" data-fi="0"><div class="bp2"></div><div class="pv2" style="background-image:url(${A}k545-p1.jpg)"></div><div class="cv2"><div class="mk2"><span class="dots2">···</span><i class="ci2"></i></div><div class="n2"><span>2</span></div>${I2.folder}<div class="t2">${snT('This Term')}</div></div></div>`,
    `<div class="fd2 fx" data-fi="1"><div class="bp2"></div><div class="pv2" style="background-image:url(${A}k331-p1.jpg)"></div><div class="cv2"><div class="mk2"><span class="dots2">···</span><i class="ci2"></i></div><div class="n2"><span>12</span></div><i class="ip2" style="-webkit-mask-image:url(${A}fld-added.png);mask-image:url(${A}fld-added.png)"></i><div class="t2 wr">${snT('Recently Added')}</div></div></div>`,
    `<div class="fd2 fx" data-fi="2"><div class="bp2"></div><div class="pv2" style="background-image:url(${A}k545-ed2.jpg)"></div><div class="cv2"><div class="mk2"><span class="dots2">···</span><i class="ci2"></i></div><div class="n2"><span>3</span></div>${I2.fav}<div class="t2">${snT('Favorites')}</div></div></div>`
  ];

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
    <div class="mail-viewport"><div class="ml">
      <div class="ma">S</div><div class="ms sb">${snT('Scanner')}</div><div class="mj">Scan 2026-11-03</div><div class="mt">09:41</div>
      <div class="at"><div class="pt" style="background-image:url(${P[0]})"></div><p>Scan 2026-11-03.pdf<small>${size}</small></p></div>
      <div class="ss">
        <div class="sx"><i style="background-image:url(${P[0]})"></i><span>Scan 2026-11-03.pdf<small>${snT('PDF Document')} · ${size}</small></span></div>
        <div class="si on" style="left:22px"><i style="background-image:url(${A}app-icon.png)"></i><span>StaffNotes</span></div>
        ${[104, 186, 268].map(x => `<div class="si sg" style="left:${x}px"><i></i><span></span></div>`).join('')}
        <i class="tp snd b3" style="--td:${M3}s;left:52px;top:128px"></i>
      </div>
      <i class="tp snd b3" style="--td:${M1}s;left:${MAX+MW/2}px;top:${MAY+MH/2}px"></i>
    </div></div>
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
    <div class="library-viewport"><div class="lib">
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
    <div class="lib2">
      <div class="recent2">
        <div class="hd2 hr1">${snT('Recently opened')} <small>3</small></div>
        ${SC7.map(s => scCard7(s, 'rs2')).join('')}
      </div>
      <div class="hd2 hr2">${snT('My Collections')} <small class="roll2 hn2"><span>3</span></small></div>
      <div class="fd2 rc2"><div class="bp2"></div><div class="pv2" style="background-image:url(${A}k545-p1.jpg)"></div>
        <div class="cv2"><div class="mk2"><span class="dots2">···</span><i class="ci2"></i></div><div class="n2 roll2"></div>${I2.folder}<div class="t2"></div></div></div>
      ${fxFolders7.join('')}
      ${['k545', 'op111', 'k331'].map(id => scCard7(BY7[id], 'fs')).join('')}
      <div class="tb2 br"><div class="gb2 sl2">${I2.sel}${snT('Select')}</div></div>
      <div class="tb2 mt">
        <div class="gb2 nw2">${I2.add}${snT('New')}</div>
        <div class="gb2 x">${I2.join}<span>${snT('Add')}</span></div>
        <div class="gb2 x">${I2.mem}<span>${snT('Folders')}</span></div>
        <div class="gb2 x">${I2.fav}<span>${snT('Favorite')}</span></div>
        <div class="gb2 x del">${I2.trash}<span>${snT('Delete')}</span></div>
        <div class="gb2 cnt"><span>${I2.list}<b class="roll2 cn2"><span>0</span></b></span><span class="dn2">${snT('Done')}</span></div>
      </div>
      <div class="po2">
        <div class="nv2"><div class="gb2 l ico">${I2.x}</div><h4>${snT('New Folder')}</h4><div class="gb2 r ico ok2">${I2.ok}</div></div>
        <div class="grp2"><div class="row2"><span class="tx2"></span></div><div class="row2 hint">${snT('Choose a name that fits on one line of the folder cover.')}</div></div>
      </div>
      <div class="ctx2">
        <div class="cmi2"><span>${snT('Select Contents')}</span>${I2.sel}</div>
        <div class="cmi2 ro"><span>${snT('Reorder Scores')}</span>${I2.reorder}</div>
        <div class="cmi2"><span>${snT('Rename…')}</span>${I2.pencil}</div>
        <div class="cmi2 sep"><span>${snT('Delete…')}</span>${I2.trash}</div>
      </div>
      <div class="ord-bg2"></div>
      <div class="ord2">
        <div class="nv2"><h4 class="otitle2">${NAME7()}</h4><div class="gb2 r odn2">${snT('Done')}</div></div>
        <div class="ogrp2">
          ${['k545', 'op111', 'k331'].map(id => `<div class="orow2" data-id="${id}"><div class="oth2" style="background-image:url(${A}${BY7[id].img})"></div><div class="otx2">${snT(BY7[id].t)}</div>${I2.grab}</div>`).join('')}
        </div>
      </div>
    </div></div>
    <i class="snd d2"></i>
    <i class="tp snd tz" style="left:${x7(2,false)+SW/2}px;top:${Y7_2+SH7/2}px"></i>
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
        <div class="mvb pr" aria-label="1. Allegro" title="1. Allegro">${gl(1)}<span>1. Allegro</span></div>
        <div class="pgc">${snT('Page')}<span class="pn"><span class="q1">1 / 8</span><span class="q2">4 / 8</span></span><i></i></div>
        <div class="mvb nx n1" aria-label="2. Andante" title="2. Andante"><span>2. Andante</span>${gl(0)}</div>
        <div class="mvb nx n2" aria-label="3. Rondo: Allegretto" title="3. Rondo: Allegretto"><span>3. Rondo: Allegretto</span>${gl(0)}</div>
      </div>
      <i class="rp" style="left:calc(${W/2+52}px + var(--n1h,32px) + var(--bx,0px));top:${H-19}px"></i>
      <i class="tp snd t7" style="left:calc(${W/2+52}px + var(--n1h,32px) + var(--bx,0px));top:${H-19}px"></i>
    </div>
  </div>`;
  const st = root.firstElementChild;
  const lib2 = st.querySelector('.lib2'), q2 = s => lib2.querySelector(s);
  const shelf2 = Object.fromEntries([...lib2.querySelectorAll('.sc2.rs2')].map(e => [e.dataset.id, e]));
  const fsMap2 = Object.fromEntries([...lib2.querySelectorAll('.sc2.fs')].map(e => [e.dataset.id, e]));
  const fxList2 = [...lib2.querySelectorAll('.fd2.fx')];
  const rc2 = q2('.fd2.rc2'), rcN2 = rc2.querySelector('.n2'), rcT2 = rc2.querySelector('.t2');
  const hr1 = q2('.hr1'), hr2 = q2('.hr2'), hn2 = q2('.hn2'), cn2 = q2('.cn2'), mt2 = q2('.tb2.mt');
  const tx2 = q2('.tx2'), ok2 = q2('.ok2'), cmiRo = q2('.cmi2.ro'), odn2 = q2('.odn2'), dot2 = st.querySelector('.snd.d2');
  const orows2 = Object.fromEntries([...lib2.querySelectorAll('.orow2')].map(e => [e.dataset.id, e]));

  const isNar = () => root.closest('.os') ? innerWidth <= 900 : root.clientWidth < 560;
  function roll2(el, v, anim){
    v = v === '' ? '' : String(v);
    if (el.dataset.v === v) return; el.dataset.v = v;
    const old = [...el.children];
    if (!anim){ el.innerHTML = v === '' ? '' : `<span>${v}</span>`; return; }
    old.forEach(o => { o.classList.add('out'); setTimeout(() => o.remove(), 420); });
    if (v === '') return;
    const s = document.createElement('span'); s.textContent = v; s.className = 'in'; el.appendChild(s);
    void s.offsetWidth; s.classList.remove('in');
  }

  const S7 = {
    6: () => ({mg:false, sel:[], made:false, rec:[], order:['k545','op111','k331'], open:false, pop:false, name:'', ctx:false, ctxHl:false, modal:false, dragId:null, dragY:0, slots:{k545:0,op111:1,k331:2}}),
    7: () => ({mg:false, sel:[], made:true, rec:['k545','op111','k331'], order:['k545','op111','k331'], open:false, pop:false, name:'*', ctx:false, ctxHl:false, modal:false, dragId:null, dragY:0, slots:{k545:0,op111:1,k331:2}}),
    8: () => ({mg:false, sel:[], made:true, rec:['k545','op111','k331'], order:['k331','k545','op111'], open:true, pop:false, name:'*', ctx:false, ctxHl:false, modal:false, dragId:null, dragY:0, slots:{k331:0,k545:1,op111:2}})
  };
  let st7 = S7[6](), zp = 0;

  const folderX = (col, nar) => nar ? 82 + col*160 : x7(col, false);
  const scoreX = (idx, nar) => x7((idx + 1) % (nar ? 3 : 4), nar);
  function render7(anim){
    const s = st7, nar = isNar();
    const nm = s.name === '*' ? NAME7() : s.name;
    lib2.classList.toggle('mg', s.mg);
    lib2.classList.toggle('open', s.open);
    root.classList.toggle('org-open', s.open);
    lib2.classList.toggle('pop', s.pop);
    lib2.classList.toggle('ctx', s.ctx);
    lib2.classList.toggle('modal', s.modal);
    cmiRo.classList.toggle('hl', s.ctxHl);
    mt2.classList.toggle('has', s.sel.length > 0);
    roll2(cn2, s.sel.length, anim);
    roll2(hn2, 3 + (s.made ? 1 : 0), anim);
    roll2(rcN2, s.rec.length || '', anim);
    rc2.classList.toggle('has', s.rec.length > 0);
    rcT2.textContent = s.made ? NAME7() : '';
    q2('.otitle2').textContent = NAME7();

    const typing = s.pop, ph = `<span class="ph2">${snT('Folder Name')}</span>`;
    tx2.innerHTML = nm ? nm + (typing ? '<i class="cr2"></i>' : '') : (typing ? '<i class="cr2"></i>' : '') + ph;
    ok2.classList.toggle('go', !!nm);

    // 标题与上排「最近打开」乐谱
    hr1.style.left = (x7(0, nar) + 2) + 'px';
    hr1.style.top = '24px';
    SC7.forEach((c, i) => {
      const el = shelf2[c.id], k = s.sel.indexOf(c.id);
      el.style.left = x7(i, nar) + 'px';
      el.style.top = Y7_1 + 'px';
      el.classList.toggle('on', k >= 0);
      if (k >= 0) el.querySelector('.nb2').textContent = k + 1;
    });

    // 系统文件夹在前，自建文件夹按新到旧排列。
    hr2.style.left = ((s.open ? x7(0, nar) : folderX(0, nar)) + 2) + 'px';
    hr2.style.top = (s.open ? 24 : 314) + 'px';
    const rcX = s.open ? x7(0, nar) : folderX(2, nar);
    rc2.style.left = rcX + 'px';
    rc2.style.top = Y7_2 + 'px';
    rc2.style.opacity = s.made ? 1 : 0;
    rc2.style.transform = s.made ? 'none' : 'translateY(16px) scale(.97)';
    lib2.style.setProperty('--ctx-x', rcX + 'px');

    fxList2.forEach((el, i) => {
      if (s.open){
        el.style.left = x7(i === 0 ? Number(nar) : i - 1, nar) + 'px';
        el.style.top = (i === 0 ? Y7_2 + ROW7 : Y7_1) + 'px';
      } else {
        el.style.left = folderX(i === 0 ? (s.made ? 3 : 2) : i - 1, nar) + 'px';
        el.style.top = Y7_2 + 'px';
      }
    });

    s.order.forEach((id, idx) => {
      const el = fsMap2[id];
      el.style.left = (s.open ? scoreX(idx, nar) : folderX(2, nar)) + 'px';
      el.style.top = (Y7_2 + (s.open && nar && idx === 2 ? ROW7 : 0)) + 'px';
      if (!(zp > 0 && id === 'k545')) el.style.opacity = s.open ? 1 : 0;
      el.style.transform = s.open ? 'none' : 'scale(.88)';
      el.style.setProperty('--member-delay', (s.open && anim && !s.dragId && !s.modal ? idx*.1 : 0) + 's');
    });

    // 排序弹窗内的 3 行
    Object.entries(orows2).forEach(([id, el]) => {
      const sl = s.slots[id], dragging = s.dragId === id;
      el.classList.toggle('drag', dragging);
      el.classList.toggle('last', sl === 2 && !s.dragId);
      const y = dragging ? s.dragY : sl * ORH;
      el.style.transform = `translateY(${y}px)${dragging ? ' scale(1.02)' : ''}`;
    });
  }

  let cur = 0, zpan = 0, dotPx = 26, sNow = 1;
  const tz = st.querySelector('.tp.tz');
  const fit = () => {
    const narrow = isNar(); root.classList.toggle('narrow', narrow);
    const wN1 = st.querySelector('.mvb.n1').offsetWidth;
    root.style.setProperty('--bx', -(6 + wN1)/2 + 'px');
    root.style.setProperty('--n1h', wN1/2 + 'px');
    const s = root.clientWidth/(narrow ? VN : W), pan = narrow ? (cur===5 ? PN : (cur===6 || root.classList.contains('pre7')) ? zpan*(W-VN)/2 : (W-VN)/2) : 0;
    sNow = s || 1;
    st.style.transform = `translateX(${-pan*s}px) scale(${s})`;
    if(s) root.style.setProperty('--dotu', (dotPx/s).toFixed(2)+'px');
    tz.style.left = (scoreX(st7.order.indexOf('k545'), narrow) + SW/2) + 'px';
    tz.style.top = (Y7_2 - (narrow ? RISE7N : 0) + SH7/2) + 'px';
    render7(false);
  };
  const ro = new ResizeObserver(fit); ro.observe(root);
  addEventListener('resize', fit);
  fit();
  document.fonts.ready.then(fit);

  /* ---------- 拍 7–8 动画脚本引擎 ---------- */
  let tok7 = null, tp7 = null, lastP7 = null;
  const fly7 = new Set();
  const placeDot7 = () => { if (tp7){ dot2.style.left = tp7[0] + 'px'; dot2.style.top = tp7[1] + 'px'; } };
  const rip7 = () => { dot2.classList.remove('rip'); void dot2.offsetWidth; dot2.classList.add('rip'); };
  const hideDot7 = () => { dot2.style.opacity = 0; dot2.style.transform = ''; dot2.classList.remove('rip', 'hld'); rc2.classList.remove('hold', 'bump'); tp7 = lastP7 = null; };
  const clearGhosts7 = () => { fly7.forEach(a => a.cancel()); fly7.clear(); lib2.querySelectorAll('.gh2').forEach(g => g.remove()); };
  const at7 = (el, fx = .5, fy = .5) => {
    const r = el.getBoundingClientRect(), sr = st.getBoundingClientRect();
    const k = sr.width / W || sNow || 1;
    return [(r.left + r.width*fx - sr.left)/k, (r.top + r.height*fy - sr.top)/k];
  };

  function launchFly7(ids, tok){
    const nar = isNar(), x1 = folderX(2, nar) + SW*.45 - SW*.36/2, y1 = Y7_2 + SH7*.48 - SH7*.36/2, k = .36;
    return Promise.all(ids.map((id, idx) => new Promise(res => {
      const i = SC7.findIndex(s => s.id === id), x0 = x7(i, nar), y0 = Y7_1;
      const g = document.createElement('div'); g.className = 'gh2'; g.style.backgroundImage = `url(${A}${BY7[id].img})`;
      g.style.transform = `translate(${x0}px,${y0}px)`; g.style.opacity = 0;
      lib2.insertBefore(g, q2('.tb2.br'));
      const a = g.animate([
        {transform: `translate(${x0}px,${y0}px) scale(1)`, opacity: 1},
        {transform: `translate(${x0 + (x1 - x0)*.35}px,${y0 + (y1 - y0)*.58}px) scale(.66)`, opacity: 1, offset: .45},
        {transform: `translate(${x1}px,${y1}px) scale(${k})`, opacity: 1}
      ], {duration: 720, delay: 140 + idx*135, easing: 'cubic-bezier(.3,.6,.25,1)', fill: 'both'});
      fly7.add(a);
      a.onfinish = () => {
        fly7.delete(a);
        if (!tok.dead){
          st7.rec = [...st7.rec, id]; render7(true);
          rc2.classList.remove('bump'); void rc2.offsetWidth; rc2.classList.add('bump');
        }
        g.animate([{opacity: 1}, {transform: `translate(${x1}px,${y1 + 4}px) scale(${k*.9})`, opacity: 0}], {duration: 120, fill: 'both'}).onfinish = () => g.remove();
        res();
      };
      a.oncancel = () => { fly7.delete(a); g.remove(); res(); };
    })));
  }

  async function play78(n, tok){
    const chk = () => { if (tok.dead) throw CANCEL7; };
    const wait = ms => new Promise(r => setTimeout(r, ms)).then(chk);
    const moveTo = (p, ms = 460) => new Promise((res, rej) => {
      const a = tp7 || lastP7 || [p[0] + 54, p[1] + 90], s0 = performance.now();
      tp7 = a; placeDot7(); dot2.style.opacity = 1;
      (function f(now){
        if (tok.dead) return rej(CANCEL7);
        const k = Math.min(1, (now - s0)/ms), e = ease7(k);
        tp7 = [a[0] + (p[0] - a[0])*e, a[1] + (p[1] - a[1])*e]; placeDot7();
        k < 1 ? requestAnimationFrame(f) : res();
      })(s0);
    });
    const press = async (el) => { dot2.style.transform = 'scale(.75)'; rip7(); el && el.classList.add('prs'); await wait(135); el && el.classList.remove('prs'); };
    const lift = async (fade = true) => { dot2.style.transform = ''; await wait(95); if (fade){ dot2.style.opacity = 0; await wait(110); lastP7 = tp7; tp7 = null; } };
    const tap = async (el, fx = .5, fy = .5, ms = 460, pressEl = el) => { await moveTo(at7(el, fx, fy), ms); await press(pressEl); };

    if (n === 7){
      await moveTo([W/2, 180], 380);
      dot2.style.transform = 'scale(.75)'; rip7();
      root.classList.remove('pre7'); fit();
      await moveTo([W/2, 455], 800);
      await lift(true);
      await tap(q2('.sl2'), .5, .5, 480);
      st7.mg = true; render7(true); await lift(false);
      for (const [id, ms] of [['k545', 430], ['op111', 360], ['k331', 360]]){
        await wait(90);
        await tap(shelf2[id].querySelector('.th2'), .5, .42, ms, shelf2[id]);
        st7.sel = [...st7.sel, id]; render7(true);
        dot2.style.transform = ''; await wait(80);
      }
      await wait(120);
      await tap(q2('.nw2'), .5, .5, 440);
      st7.pop = true; st7.name = ''; render7(false);
      await lift(true);
      await wait(240);
      const chars = [...NAME7()], gap = Math.min(135, Math.max(85, Math.round(680 / Math.max(1, chars.length))));
      for (const ch of chars){ await wait(gap); st7.name += ch; render7(true); }
      await wait(260);
      await tap(ok2, .5, .5, 440);
      st7.name = '*'; st7.made = true; st7.pop = false; st7.mg = false; st7.sel = [];
      render7(true);
      await lift(true);
      await launchFly7(['k545', 'op111', 'k331'], tok);
      chk();
      await wait(260);
    } else if (n === 8){
      await wait(220);
      await tap(rc2.querySelector('.cv2'), .5, .5, 470, rc2);
      st7.open = true; render7(true);
      await lift(false);
      await wait(440);
      // 移到已展开的 Recital 文件夹上长按弹出菜单
      await moveTo(at7(rc2), 400);
      dot2.style.transform = 'scale(.78)'; dot2.classList.add('hld'); rc2.classList.add('hold');
      await wait(450);
      dot2.classList.remove('hld'); rc2.classList.remove('hold'); dot2.style.transform = '';
      st7.ctx = true; render7(true);
      await wait(220);
      await moveTo(at7(cmiRo, .45, .5), 360);
      st7.ctxHl = true; render7(true);
      dot2.style.transform = 'scale(.75)'; rip7();
      await wait(160);
      dot2.style.transform = '';
      st7.ctx = false; st7.ctxHl = false; st7.modal = true; render7(true);
      await wait(340);
      // 按住第 3 行 K. 331 右侧三横杠手柄，向上拖到第 1 位
      const grabPt = at7(orows2.k331.querySelector('.ograb2'), .5, .5);
      await moveTo(grabPt, 420);
      dot2.style.transform = 'scale(.76)'; rip7();
      const yStart = 2 * ORH, yEnd = 0, p0 = [...tp7];
      st7.dragId = 'k331'; st7.dragY = yStart; render7(true);
      await wait(140);
      await new Promise((res, rej) => {
        const s0 = performance.now(), dMs = 820;
        let step1 = false, step2 = false;
        (function f(now){
          if (tok.dead) return rej(CANCEL7);
          const k = Math.min(1, (now - s0)/dMs), e = ease7(k);
          const dy = (yEnd - yStart)*e;
          tp7 = [p0[0], p0[1] + dy]; placeDot7();
          st7.dragY = yStart + dy;
          if (!step1 && st7.dragY < 1.38*ORH){ step1 = true; st7.slots.op111 = 2; }
          if (!step2 && st7.dragY < 0.55*ORH){ step2 = true; st7.slots.k545 = 1; st7.slots.k331 = 0; st7.order = ['k331', 'k545', 'op111']; }
          render7(true);
          k < 1 ? requestAnimationFrame(f) : res();
        })(s0);
      });
      st7.dragId = null; st7.dragY = 0; render7(true);
      dot2.style.transform = '';
      await wait(200);
      await tap(odn2, .5, .5, 420);
      st7.modal = false; render7(true);
      await lift(true);
      await wait(260);
    }
  }

  // 自动连播：每拍按 DUR 播完自动进下一拍，拍 8 播完停在终态
  const DUR = [0, Math.round((QM+1.1)*1000), Math.round((LE+.3)*1000), Math.round((M4+1.35)*1000), Math.round((TV+.3)*1000), 2900, 2600, 7700, 6000];
  let timer = 0, auto = false, t0 = 0, dur = 0;
  const show = () => { root.dataset.s = String(cur); for(let i=1;i<=LAST;i++) root.classList.toggle('g'+i, cur>=i); fit(); };
  const snap7 = (n, soft) => {
    if (tok7){ tok7.dead = true; tok7 = null; }
    clearGhosts7(); hideDot7();
    lib2.querySelectorAll('.prs').forEach(e => e.classList.remove('prs'));
    st7 = S7[n <= 6 ? 6 : n === 7 ? 7 : 8]();
    if (!soft) lib2.classList.add('now2');
    render7(!!soft);
    if (!soft){ void lib2.offsetWidth; lib2.classList.remove('now2'); }
  };
  const settle = n => {
    snap7(n, false);
    root.classList.remove('pre7'); root.classList.add('cut'); cur = n; show(); void root.offsetWidth; root.classList.remove('cut');
    try { root.getAnimations({subtree:true}).forEach(a => { if(a.effect && a.effect.getTiming().iterations !== Infinity) a.finish(); }); } catch(e){}
  };
  show();
  function run(){
    clearTimeout(timer);
    if (tok7){ tok7.dead = true; tok7 = null; }
    t0 = performance.now(); dur = RM ? 0 : DUR[cur];
    if (!RM && (cur === 7 || cur === 8)){
      const tk = tok7 = {dead: false};
      play78(cur, tk).then(() => { if (tok7 === tk) tok7 = null; }, e => { if (e !== CANCEL7) throw e; });
    }
    timer = setTimeout(() => {
      timer = 0;
      if (cur === 7 || cur === 8) snap7(cur, true);
      if(auto && cur < LAST){ cur++; if (cur === 7) root.classList.add('pre7'); show(); run(); }
    }, dur);
  }
  function go(n, a=true){
    n = Math.max(0, Math.min(LAST, n|0)); clearTimeout(timer); timer = 0;
    if (tok7){ tok7.dead = true; tok7 = null; }
    clearGhosts7(); hideDot7(); auto = a;
    if(RM || n === 0){ settle(n); t0 = performance.now(); dur = 0; return; }
    settle(n-1); cur = n; if (n === 7) root.classList.add('pre7'); show(); run();
  }

  // 大过场：从拍 8 终态展开行 col 2 的 K. 545 卡片放大飞入阅读器
  const rd = st.querySelector('.rd'), lib = st.querySelector('.lib'), sck2 = fsMap2.k545, sck2Tap = sck2.querySelector('.tap2');
  const ttl = rd.querySelector('.ttl'), bar = rd.querySelector('.bar');
  const cl = v => Math.max(0, Math.min(1, v)), lp = (a, b, t) => a + (b - a)*t;
  const io = t => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3)/2;
  const zoomOrigin = () => ({x:sck2.offsetLeft, y:sck2.offsetTop - (isNar() ? RISE7N : 0)});
  let za = 0;
  function zoom(p, ch = 1, eo){
    p = cl(p); zp = p;
    const on = p > 0; root.classList.toggle('zm', on);
    if(!on){
      [rd, lib, lib2, tz, ttl, bar].forEach(e => { e.style.opacity = ''; e.style.transform = ''; });
      sck2Tap.style.transform = ''; sck2.style.opacity = st7.open ? 1 : 0;
      tz.classList.remove('rip'); za = 0; zpan = 0; fit(); return;
    }
    const {x:kx, y:ky} = zoomOrigin();
    tz.style.left = (kx + SW/2) + 'px'; tz.style.top = (ky + SH7/2) + 'px';
    const a = cl(p/.22), e = eo ?? io(cl((p - .2)/.8));
    if(RM){
      tz.style.opacity = 0; sck2Tap.style.transform = '';
      rd.style.transform = 'none'; rd.style.opacity = cl((p - .1)/.8); lib2.style.opacity = 1 - cl((p - .1)/.8);
    } else {
      const dO = a < .3 ? a/.3 : a < .8 ? 1 : 1 - (a - .8)/.2;
      const dS = a < .4 ? 1 : a < .5 ? lp(1, .75, io((a - .4)/.1)) : a < .62 ? .75 : lp(.75, 1, io(cl((a - .62)/.13)));
      tz.style.opacity = dO; tz.style.transform = `scale(${dS})`;
      if(a >= .5 && za < .5){ tz.classList.remove('rip'); void tz.offsetWidth; tz.classList.add('rip'); }
      za = a;
      const cS = a < .45 ? 1 : a < .65 ? lp(1, .96, (a - .45)/.2) : lp(.96, 1, cl((a - .65)/.2));
      sck2Tap.style.transform = `scale(${cS})`;
      const sw = p > .2;
      sck2.style.opacity = sw ? 0 : 1; rd.style.opacity = sw ? 1 : 0;
      rd.style.transform = `translate(${lp(kx - VX*ZS, 0, e)}px,${lp(ky, 0, e)}px) scale(${lp(ZS, 1, e)})`;
      lib2.style.opacity = 1 - cl((p - .22)/.4);
    }
    const c = cl((p - .86)/.14)*ch; ttl.style.opacity = c; bar.style.opacity = c;
    zpan = RM ? 1 : e; fit();
  }
  return {
    zoom, get zoomNow(){ return zp; },
    zpage(e){
      const {x,y} = zoomOrigin();
      return {x:lp(x, VX, e), y:lp(y, 0, e), w:410*lp(ZS, 1, e)};
    },
    settle(n){ clearTimeout(timer); timer = 0; auto = false; settle(Math.max(0, Math.min(LAST, n|0))); t0 = performance.now(); dur = 0; },
    get busy(){ return !!(timer || tok7); },
    beats: LAST, get beatNow(){ return cur; },
    get beatFrac(){ return cur === 0 ? 0 : dur ? Math.min(1, (performance.now()-t0)/dur) : 1; },
    play(){ go(RM ? LAST : 1); },
    go, beat(n){ go(n, false); },
    rev(n){ clearTimeout(timer); timer = 0; auto = false; root.classList.remove('pre7'); cur = Math.max(0, Math.min(LAST, n|0)); snap7(cur, true); show(); t0 = performance.now(); dur = 0; },
    dot(px){ dotPx = px; fit(); },
    reset(){ go(0, false); },
    progress(p){ go(Math.round(p*LAST), false); },
    visible(){},
    destroy(){ ro.disconnect(); removeEventListener('resize', fit); clearTimeout(timer); if(tok7) tok7.dead = true; clearGhosts7(); }
  };
};
})();
