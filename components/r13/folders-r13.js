/* r17 乐谱管理（自建文件夹）：一张图书馆，三拍，照 App 的管理模式（LibraryManagementViews / LibraryNativeToolbar / HomeView.scoreCell）走。
   拍 1 选择乐谱：点右上角「选择」进管理模式（上面换成管理工具栏，卡片左上角换成圆圈、没选的淡到 .6），依次点 K. 545、Op. 49 No. 2，左上角按点选顺序标 1、2，工具栏长出加入、归属、收藏、删除；
   拍 2 新建文件夹：点「新建」，弹窗直接是 New Folder 页（✓ 先灰），一个字一个字打名字，✓ 变亮、点它：建好就收起整个弹窗、结束这次管理回到普通图书馆
        （不退回根页、不再点一次完成；右上换回「选择」，选圈和管理工具栏消失），两份谱子飞进「我的分类」里新出现的文件夹；
   拍 3 加入文件夹：重新点「选择」进管理，点 K. 331 →「加入」→ 列表点刚建的文件夹，谱子飞进去、数字 2→3，选择清空，弹窗退回根页；点弹窗「完成」、再点工具栏「完成」回到浏览，
        点开这个文件夹：它另起一行排在最左，右边排出里面的三份谱子（一份谱可以同时在几个文件夹里，原来的「最近打开」不动）。
   卡片、文件夹封面、点按圆点、飞进文件夹的样子沿用 story-r13；图标路径照 App 的 LibraryManagementIcons（folder、folderAdd、folderJoin、folderMembership、favorite），SF 图标按同样线宽画。
   弹窗照 App 是 384pt 宽、贴工具栏右上角的 popover，这里按 350 宽、内容高 250 画（App 里最小高 260pt）；乐谱数、文件夹数都是样例。
   接口（和 dict、follow 一样）：beats、beat(n, soft) 直接摆第 n 拍终态（soft 带过渡退回）、one(n) 先摆第 n−1 拍终态再只播第 n 拍、busy、beatNow、beatFrac、
   one(n, true) 接着上一拍往前走：上一拍没走完的动作从当前画面按 FAST 倍速补完（圆点、打字、飞行都接着走），再播第 n 拍，不摆终态、不重建；
   interrupt() 原地停住（飞行中的谱子一起停），等 one(n + 1, true) 接着走；visible(on)、dot(px)、destroy()；
   在官网页面里自己接上 #folders 的章节列表和进度条，连播 1→2→3，滚走时停在当前拍终态。
   谱图：K. 545 是 Breitkopf & Härtel AMA 1878；两首贝多芬和收藏封面的 K. 545 是 G. Schirmer《Sonata album》c1894–95（archive.org sonataalbumtwent01lebe）；
   K. 331 是官网用 LilyPond 自刻（work/r17/k331/k331.ly）。来源和生成步骤见 work/organize-1117/HANDOFF.md。 */
(function(){
const NS = window.SNSims = window.SNSims || {};
if (NS['r13/folders-r13']) return;
const W = 640, H = 610;
const A = (document.currentScript && document.currentScript.src) ? new URL('../assets/', document.currentScript.src).href : 'components/assets/';
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches, CANCEL = {};
const snT = (s, v) => window.snT ? window.snT(s, v) : s.replace(/\{(\w+)\}/g, (m, k) => v && k in v ? v[k] : m);
const ease = t => t < .5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2)/2;
// 卡片照 App 的 LibraryCardMetrics（145:205，列间距 18），和 story-r13 一样缩到 134.8 宽
const CW = 134.8, CH = 190, GAP = 18, X0 = 23.4, R1 = 112, R2 = 407, R3 = R2 + CH + 30, SHIFT = 295;
const colX = c => X0 + c*(CW + GAP);
const TR = colX(3) + CW, PW = 350, PH = 250, PT = 22;
// 拍长（毫秒），给进度条估算；每拍实际播完以脚本为准
const DUR = [0, 4900, 6300, 12100];
// 中途前进时，上一拍没走完的动作按这个时间倍数补完
const FAST = .4;
const NAME = () => snT('Recital');
// App 的 LibraryManagementIcons（viewBox 24，线宽 1.5），和 SF 图标用同一套画法
const P = {
  folder: 'M22 11V17C22 21 21 22 17 22H7C3 22 2 21 2 17V7C2 3 3 2 7 2H8.5C10 2 10.33 2.44 10.9 3.2L12.4 5.2C12.78 5.7 13 6 14 6H17C21 6 22 7 22 11Z',
  add: 'M9.5 14H14.5M12 11.5V16.5', join: 'M12 10.7V17.3M9.2 14.5L12 17.3L14.8 14.5', mem: 'M10.8 11.1H15.8M10.8 14H15.8M10.8 16.9H15.8',
  heart: 'M9.19997 14.7805L11.78 17.0405C11.9 17.1505 12.09 17.1505 12.21 17.0405L14.79 14.7805C15.46 14.1905 15.55 13.1905 14.99 12.4905C14.43 11.7905 13.41 11.6605 12.7 12.2005L12 12.7405L11.29 12.2105C10.57 11.6705 9.55997 11.8005 8.99997 12.5005C8.43997 13.1905 8.52997 14.2005 9.19997 14.7805Z'
};
const svg = (body, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
const lm = extra => svg(`<g transform="translate(-0.279070 -0.279070) scale(1.023256)"><path d="${P.folder}"/>${extra}</g>`);
const I = {
  folder: lm(''), add: lm(`<path d="${P.add}"/>`), join: lm(`<path d="${P.join}"/>`), mem: lm(`<path d="${P.mem}"/>`),
  fav: lm(`<g transform="translate(0 -0.5)"><path d="${P.heart}"/></g>`),
  sel: svg('<circle cx="12" cy="12" r="9.2"/><path d="M8.2 12.3l2.6 2.6 5-5.4"/>'),
  list: svg('<path d="M3.6 6.2l1.4 1.4 2.6-2.8M3.6 12.2l1.4 1.4 2.6-2.8M3.6 18.2l1.4 1.4 2.6-2.8M10.6 6.6H20.6M10.6 12.6H20.6M10.6 18.6H20.6"/>'),
  trash: svg('<path d="M4.5 6.5h15M9.5 6.5V4.8c0-.6.4-1 1-1h3c.6 0 1 .4 1 1v1.7M6.6 6.5l.8 12.2c.1 1 .9 1.8 1.9 1.8h5.4c1 0 1.8-.8 1.9-1.8l.8-12.2M10.2 10.2v6.6M13.8 10.2v6.6"/>'),
  x: svg('<path d="M7 7l10 10M17 7L7 17"/>'), ok: svg('<path d="M5.6 12.6l4.2 4.2 8.6-9.4"/>')
};
// 「最近打开」四份，每张图都是这首作品自己的谱页：K. 545（AMA 1878 第 1 页）、Op. 49 No. 2 和 Op. 14 No. 2（Schirmer 首页）、K. 331（LilyPond 自刻）
const SC = [
  {id: 'k545', img: 'k545-p1.jpg', t: 'Piano Sonata No. 16 in C Major, K. 545', c: 'Wolfgang Amadeus Mozart'},
  {id: 'op49', img: 'fo-op49-2.jpg', t: 'Piano Sonata No. 20 in G Major, Op. 49 No. 2', c: 'Ludwig van Beethoven'},
  {id: 'k331', img: 'k331-p1.jpg', t: 'Piano Sonata No. 11 in A Major, K. 331', c: 'Wolfgang Amadeus Mozart'},
  {id: 'op14', img: 'fo-op14-2.jpg', t: 'Piano Sonata No. 10 in G Major, Op. 14 No. 2', c: 'Ludwig van Beethoven'}
];
const BY = Object.fromEntries(SC.map(s => [s.id, s]));
// 「我的分类」照 App 的顺序：最近添加、A–Z、收藏，然后是自建文件夹（新建的排在后面这一格）
const FD = [
  {k: 'ra', t: 'Recently Added', png: 'added', n: 12, pv: 'k331-p1.jpg', cls: 'wr'},
  {k: 'az', t: 'A–Z', png: 'all', n: 12, pv: 'fo-op14-2.jpg', cls: 'az'},
  {k: 'fv', t: 'Favorites', icon: 'fav', n: 3, pv: 'k545-ed2.jpg'}
];
// 每拍终态；go 是已经定下来、还在飞（或还没起飞）的谱子，落进文件夹才进 rec
const S = [
  {mg: false, sel: [], rec: [], go: [], pop: null, page: 'root', name: '', open: false},
  {mg: true, sel: ['k545', 'op49'], rec: [], go: [], pop: null, page: 'root', name: '', open: false},
  {mg: false, sel: [], rec: ['k545', 'op49'], go: [], pop: null, page: 'root', name: '*', open: false},
  {mg: false, sel: [], rec: ['k545', 'op49', 'k331'], go: [], pop: null, page: 'root', name: '*', open: true}
];

const CSS = `
.sn-fo{position:relative;width:100%;aspect-ratio:${W}/${H};--dotu:30px}
.sn-fo *{box-sizing:border-box;margin:0;padding:0}
.sn-fo .st{position:absolute;left:0;top:0;width:${W}px;height:${H}px;transform-origin:0 0;font-family:"Timeless Sans",-apple-system,system-ui,sans-serif;color:#292D38;letter-spacing:-.01em;-webkit-font-smoothing:antialiased;user-select:none}
.sn-fo .ic{display:block;width:20px;height:20px;flex:none}
.sn-fo.now *,.sn-fo.now *::before,.sn-fo.now *::after{transition:none!important}

/* 内容：两个标题、两排卡片；点开文件夹时整块往上走（App 里是图书馆滚到那一组） */
.sn-fo .ct{position:absolute;left:0;top:0;width:${W}px;height:${H}px;transition:transform .9s cubic-bezier(.2,.7,.2,1)}
.sn-fo.open .ct{transform:translateY(${-SHIFT}px)}
.sn-fo .hd{position:absolute;left:${X0 + 2}px;font-size:21px;display:flex;align-items:baseline;gap:9px;white-space:nowrap;transition:opacity .4s}
.sn-fo .hd small{position:relative;display:inline-grid;font-size:13px;color:#8C919B;font-variant-numeric:tabular-nums}
.sn-fo .rl{transition:opacity .45s}
.sn-fo.open .rl{opacity:0}
/* 数字换掉：旧的往上走、新的从下面补上 */
.sn-fo .roll>span{grid-area:1/1;transition:opacity .25s,transform .4s cubic-bezier(.2,.7,.2,1)}
.sn-fo .roll>span.in{opacity:0;transform:translateY(8px)}
.sn-fo .roll>span.out{opacity:0;transform:translateY(-8px)}

/* 乐谱卡片：缩略图 + 标题 + 作曲家；管理模式下没选中的整张淡到 .6，左上角的圆圈和序号不淡 */
.sn-fo .sc{position:absolute;width:${CW}px}
.sn-fo .sc .cd{transition:opacity .3s}
.sn-fo.mg .sc:not(.on) .cd{opacity:.6}
.sn-fo .th{height:${CH}px;border-radius:5px;background:#fff center top/cover no-repeat;box-shadow:0 1px 2px rgba(0,0,0,.08),0 6px 14px -6px rgba(23,27,36,.14)}
.sn-fo .sc p{margin-top:7px;font-size:11.5px;line-height:1.25;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.sn-fo .sc small{display:block;font-size:10.5px;line-height:1.25;color:#8C919B;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sn-fo .sc .tap{transition:transform .18s}
.sn-fo .sc.prs .tap,.sn-fo .it.prs .cv{transform:scale(.96)}
/* 左上角：浏览时是「···」，管理时换成圆圈，选中是带序号的实心圆（App 的 LibrarySelectionIndicator：21pt，36pt 的框） */
.sn-fo .mk{position:absolute;z-index:2;left:0;top:0;width:34px;height:34px;display:grid;place-items:center}
.sn-fo .mk>*{grid-area:1/1;transition:opacity .25s,transform .35s cubic-bezier(.3,1.4,.5,1)}
.sn-fo .dots{font-size:16px;letter-spacing:1px;line-height:1;margin-top:-6px}
.sn-fo .ci{width:20px;height:20px;border-radius:50%;background:rgba(255,255,255,.9);box-shadow:inset 0 0 0 1.5px #646A75;opacity:0;transform:scale(.6)}
.sn-fo .nb{width:20px;height:20px;border-radius:50%;background:#3F529F;color:#fff;font:600 11.5px/20px "Timeless Sans",sans-serif;text-align:center;font-variant-numeric:tabular-nums;opacity:0;transform:scale(.5)}
.sn-fo.mg .dots{opacity:0}
.sn-fo.mg .ci{opacity:1;transform:none}
.sn-fo.mg .sc.on .ci{opacity:0}
.sn-fo.mg .sc.on .nb{opacity:1;transform:none}

/* 文件夹卡片：沿用 story-r13 的封面（后面露一张谱子、右上角数字、衬线标题） */
.sn-fo .it{position:absolute;width:${CW}px;height:${CH}px;transition:opacity .45s,transform .9s cubic-bezier(.2,.7,.2,1)}
.sn-fo .bp{position:absolute;left:34%;top:5%;width:62%;height:90%;border-radius:10px;background:#E6E6E8;opacity:0;transition:opacity .4s}
.sn-fo .pv{position:absolute;left:30%;top:8%;width:66%;height:84%;border-radius:4px;background:#fff center top/cover no-repeat;box-shadow:0 1px 2px rgba(0,0,0,.08);transition:opacity .3s}
.sn-fo .cv{position:absolute;left:0;top:0;width:90%;height:100%;border-radius:10px;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.05),0 6px 14px -6px rgba(23,27,36,.12);overflow:hidden;transform-origin:50% 60%;transition:transform .6s cubic-bezier(.2,.7,.2,1),width .6s cubic-bezier(.2,.7,.2,1)}
.sn-fo .it .mk{left:-1px;top:-3px}
.sn-fo .n{position:absolute;z-index:2;right:12px;top:7px;height:18px;display:grid;justify-items:end;font-size:14.4px;color:#646A75;font-variant-numeric:tabular-nums}
.sn-fo .cv>.ic{position:absolute;left:30%;top:31%;width:40%;height:24%;color:#292D38;stroke-width:1.15}
.sn-fo .cv>.ip{position:absolute;left:30%;top:31%;width:40%;height:24%;background:#292D38;-webkit-mask:center/contain no-repeat;mask:center/contain no-repeat}
.sn-fo .t{position:absolute;left:12px;right:8px;bottom:14px;font:16.1px/1.08 var(--serif,"Timeless Serif",Georgia,serif);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
/* App：文件夹（收藏、自建）名字一行；「最近添加」这类集合可以折行；A–Z 单独 18 */
.sn-fo .t.wr{white-space:normal;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical}
.sn-fo .t.az{font-size:18px}
/* 新建的文件夹：拍 2 按 ✓ 时从下面升起；收进谱子时封面轻轻一顿 */
.sn-fo .it.rc{left:${colX(3)}px;top:${R2}px;opacity:0;transform:translateY(16px) scale(.97)}
.sn-fo .it.rc.on{opacity:1;transform:none}
.sn-fo .it.rc .pv{opacity:0}
.sn-fo .it.rc.has .pv{opacity:1}
.sn-fo .it.rc.bump .cv{animation:snfBump .45s cubic-bezier(.2,.7,.2,1)}
@keyframes snfBump{40%{transform:scale(.95)}}
/* 点开：另起一行排在最左，照 App 收窄微倾，右边排出里面的谱子 */
.sn-fo.open .it.rc{transform:translate(${colX(0) - colX(3)}px,${R3 - R2}px);transition-delay:.15s}
.sn-fo.open .it.rc .cv{width:80%;transform:rotate(-2.5deg);transition-delay:.55s}
.sn-fo.open .it.rc .bp{opacity:1;transition-delay:.6s}
.sn-fo.open .it.rc .pv{opacity:0;transition-delay:.35s}
.sn-fo .fs{top:${R3}px;opacity:0;transform:translateX(-18px);transition:opacity .4s,transform .6s cubic-bezier(.2,.7,.2,1)}
.sn-fo.open .fs{opacity:1;transform:none;transition-delay:calc(.75s + var(--i)*.12s)}

/* 飞进文件夹的那张谱子（复制出来的，原来那张留在原处） */
.sn-fo .gh{position:absolute;left:0;top:0;width:${CW}px;height:${CH}px;border-radius:5px;background:#fff center top/cover no-repeat;transform-origin:0 0;z-index:4;pointer-events:none;
  box-shadow:0 1px 3px rgba(0,0,0,.08),0 18px 40px -14px rgba(23,27,36,.28)}

/* 顶上：浏览时只有「选择」；管理时换成 App 的工具栏，每个按钮单独一块玻璃，已选数和「完成」合一块 */
.sn-fo .tb{position:absolute;top:18px;right:${W - TR}px;height:36px;display:flex;gap:6px;justify-content:flex-end;z-index:5;transition:opacity .3s,transform .32s cubic-bezier(.2,.7,.2,1);transform-origin:100% 50%}
.sn-fo .gb{height:36px;padding:0 11px 0 8px;border-radius:18px;display:flex;align-items:center;gap:4px;font-size:15px;white-space:nowrap;background:#fff;color:#292D38;overflow:hidden;
  box-shadow:0 1px 4px rgba(0,0,0,.06),0 4px 14px -6px rgba(41,45,56,.18),inset 0 0 0 .5px rgba(0,0,0,.05);transition:transform .18s,max-width .45s cubic-bezier(.2,.7,.2,1),padding .45s cubic-bezier(.2,.7,.2,1),margin .45s cubic-bezier(.2,.7,.2,1),opacity .25s}
.sn-fo .gb.prs,.sn-fo .gb>.prs{transform:scale(.93)}
.sn-fo .tb.br .gb{color:#3F529F}
.sn-fo .gb.x{max-width:130px}
.sn-fo .gb.del{color:#FF3B30}
.sn-fo .tb.mt:not(.has) .gb.x{max-width:0;padding:0;margin-left:-6px;opacity:0}
.sn-fo .gb.cnt{gap:12px;padding:0 12px 0 9px}
.sn-fo .gb.cnt>span{display:flex;align-items:center;gap:4px;transition:transform .18s}
.sn-fo .gb.cnt .roll{display:inline-grid;min-width:9px}
.sn-fo .tb.mt{opacity:0;transform:translateY(-10px) scale(.92);pointer-events:none}
.sn-fo.mg .tb.mt{opacity:1;transform:none}
.sn-fo.mg .tb.br{opacity:0;transform:translateY(-10px) scale(.92)}
/* 弹窗盖在工具栏右上角，工具栏在它底下换成表单那一套，看不见 */
.sn-fo.pop .tb.mt{opacity:0;transition-duration:.2s}

/* 弹窗：App 是不带箭头的 popover，从工具栏右上角长出来；里面一个导航栈，根页是已选的乐谱，往里推一页做新建或加入 */
.sn-fo .po{position:absolute;top:${PT}px;right:${W - TR + 4}px;width:${PW}px;height:${PH}px;border-radius:24px;background:#F4F4F6;z-index:6;overflow:hidden;opacity:0;transform:scale(.88);transform-origin:100% 0;pointer-events:none;
  box-shadow:0 0 0 .5px rgba(0,0,0,.06),0 18px 50px -14px rgba(41,45,56,.36);transition:opacity .25s,transform .45s cubic-bezier(.2,.7,.2,1)}
.sn-fo.pop .po{opacity:1;transform:none}
.sn-fo .pg{position:absolute;inset:0;transition:transform .45s cubic-bezier(.2,.7,.2,1),opacity .45s;background:#F4F4F6}
.sn-fo .pg.root{transform:translateX(-30%);opacity:0}
.sn-fo .pg.dest{transform:translateX(100%)}
.sn-fo .pg.on{transform:none;opacity:1}
.sn-fo .nv{position:relative;height:56px;display:flex;align-items:center;justify-content:center;padding:0 10px}
.sn-fo .nv h4{font-size:15.5px;font-weight:600;white-space:nowrap;max-width:200px;overflow:hidden;text-overflow:ellipsis}
.sn-fo .nv .gb{position:absolute;top:10px;height:34px;padding:0 13px;font-size:15px;color:#3F529F;box-shadow:0 1px 3px rgba(0,0,0,.06),0 4px 12px -6px rgba(41,45,56,.2),inset 0 0 0 .5px rgba(0,0,0,.05)}
.sn-fo .nv .gb.ico{width:34px;padding:0;justify-content:center}
.sn-fo .nv .l{left:10px}.sn-fo .nv .r{right:10px}
.sn-fo .nv .off{color:#B4B7BE}
.sn-fo .nv .gb.ok{transition:color .25s,background .25s,transform .18s}
.sn-fo .nv .gb.ok.go{background:#3F529F;color:#fff}
.sn-fo .em{position:absolute;left:0;right:0;top:92px;display:flex;flex-direction:column;align-items:center;gap:12px;color:#8C919B}
.sn-fo .em .ic{width:40px;height:40px;stroke-width:1.2}
.sn-fo .em p{font-size:14.5px;font-weight:600;color:#292D38;text-align:center;padding:0 28px;line-height:1.3}
.sn-fo .grp{margin:2px 16px 0;border-radius:12px;background:#fff;overflow:hidden}
.sn-fo .row{position:relative;min-height:44px;display:flex;align-items:center;gap:11px;padding:0 14px;font-size:15px}
.sn-fo .row+.row::before{content:"";position:absolute;left:14px;right:0;top:0;border-top:.5px solid rgba(60,60,67,.2)}
.sn-fo .row.lnk{color:#3F529F}
.sn-fo .row.lnk+.row.lnk::before{left:47px}
.sn-fo .row .ic{width:22px;height:22px}
.sn-fo .row.hl{background:#E8E8EC}
.sn-fo .row.hint{min-height:0;padding:10px 14px 11px;font-size:12.5px;line-height:1.35;color:#8C919B}
.sn-fo .fld .tx{display:flex;align-items:center;white-space:pre}
.sn-fo .fld .ph{color:#B4B7BE}
.sn-fo .fld .cr{width:2px;height:19px;margin:0 1px;border-radius:1px;background:#3F529F;animation:snfCr 1s steps(1) infinite}
.sn-fo .po.nt .pg{transition:none}
@keyframes snfCr{50%{opacity:0}}

/* 点按圆点：沿用全站的 .snd（dot-r13.css），这里只管位置、显隐、按下 */
.sn-fo .snd{left:0;top:0;opacity:0;transition:opacity .2s,transform .12s}
`;

function scoreCard(s, cls, x, y, i){
  return `<div class="sc ${cls}" data-id="${s.id}" style="left:${x}px;top:${y}px;--i:${i}"><div class="tap"><div class="mk"><span class="dots">···</span><i class="ci"></i><b class="nb"></b></div>`
    + `<div class="cd"><div class="th" style="background-image:url(${A}${s.img})"></div><p>${snT(s.t)}</p><small>${s.c}</small></div></div></div>`;
}
function folderCard(f, i){
  const icon = f.png ? `<i class="ip" style="-webkit-mask-image:url(${A}fld-${f.png}.png);mask-image:url(${A}fld-${f.png}.png)"></i>` : I[f.icon];
  return `<div class="it" style="left:${colX(i)}px;top:${R2}px"><div class="bp"></div><div class="pv" style="background-image:url(${A}${f.pv})"></div>`
    + `<div class="cv"><div class="mk"><span class="dots">···</span><i class="ci"></i></div><div class="n"><span>${f.n}</span></div>${icon}<div class="t ${f.cls || ''}">${snT(f.t)}</div></div></div>`;
}

NS['r13/folders-r13'] = function(root, opts = {}){
  if (!document.getElementById('sn-fo-css')){ const s = document.createElement('style'); s.id = 'sn-fo-css'; s.textContent = CSS; document.head.appendChild(s); }
  root.classList.add('sn-fo');
  const en = (window.SN_LANG || 'en') === 'en';
  // App 的「Clear」是清空已选（清空 / Leeren），和官网词表里已有的「Clear」（清除搜索）不是一回事，单独一条
  const clearT = en ? 'Clear' : snT('Clear selection');
  root.innerHTML = `<div class="st">
    <div class="ct">
      <div class="hd rl" style="top:${R1 - 40}px">${snT('Recently opened')} <small>4</small></div>
      ${SC.map((s, i) => scoreCard(s, 'rl sh', colX(i), R1, i)).join('')}
      <div class="hd" style="top:${R2 - 40}px">${snT('My Collections')} <small class="roll hn"><span>3</span></small></div>
      ${FD.map(folderCard).join('')}
      <div class="it rc"><div class="bp"></div><div class="pv" style="background-image:url(${A}${SC[0].img})"></div>
        <div class="cv"><div class="mk"><span class="dots">···</span><i class="ci"></i></div><div class="n roll"></div>${I.folder}<div class="t"></div></div></div>
      ${['k545', 'op49', 'k331'].map((id, i) => scoreCard(BY[id], 'fs', colX(i + 1), R3, i)).join('')}
    </div>
    <div class="tb br"><div class="gb sl">${I.sel}${snT('Select')}</div></div>
    <div class="tb mt">
      <div class="gb nw">${I.add}${snT('New')}</div>
      <div class="gb x ad">${I.join}${snT('Add')}</div>
      <div class="gb x">${I.mem}${snT('Folders')}</div>
      <div class="gb x">${I.fav}${snT('Favorite')}</div>
      <div class="gb x del">${I.trash}${snT('Delete')}</div>
      <div class="gb cnt"><span>${I.list}<b class="roll cn"><span>0</span></b></span><span class="dn">${snT('Done')}</span></div>
    </div>
    <div class="po">
      <div class="pg root on">
        <div class="nv"><div class="gb l off cl">${clearT}</div><h4 class="rt"></h4><div class="gb r pd">${snT('Done')}</div></div>
        <div class="em">${I.mem}<p>${snT('Select scores or folders to organize')}</p></div>
      </div>
      <div class="pg dest cr8">
        <div class="nv"><div class="gb l ico">${I.x}</div><h4>${snT('New Folder')}</h4><div class="gb r ico ok off">${I.ok}</div></div>
        <div class="grp"><div class="row fld"><span class="tx"></span></div><div class="row hint">${snT('Choose a name that fits on one line of the folder cover.')}</div></div>
      </div>
      <div class="pg dest add">
        <div class="nv"><div class="gb l ico">${I.x}</div><h4>${snT('Add to Folder')}</h4><div class="gb r ico">${I.ok}</div></div>
        <div class="grp"><div class="row lnk">${I.fav}${snT('Favorites')}</div><div class="row lnk rcr">${I.folder}<span class="rn"></span></div></div>
      </div>
    </div>
    <i class="snd"></i>
  </div>`;
  const st = root.firstElementChild, $ = s => st.querySelector(s);
  const shelf = Object.fromEntries([...st.querySelectorAll('.sc.sh')].map(e => [e.dataset.id, e]));
  const rc = $('.it.rc'), rcN = rc.querySelector('.n'), rcT = rc.querySelector('.t'), hn = $('.hn'), cn = $('.cn');
  const mt = $('.tb.mt'), po = $('.po'), pages = {root: $('.pg.root'), create: $('.pg.cr8'), add: $('.pg.add')};
  const fld = $('.fld .tx'), ok = $('.pg.cr8 .ok'), rt = $('.rt'), cl = $('.cl'), rn = $('.rn'), dot = $('.snd');

  // 数字换掉：anim 时旧的往上走、新的从下面补上
  function roll(el, v, anim){
    v = v === '' ? '' : String(v);
    if (el.dataset.v === v) return; el.dataset.v = v;
    const old = [...el.children];
    if (!anim){ el.innerHTML = v === '' ? '' : `<span>${v}</span>`; return; }
    old.forEach(o => { o.classList.add('out'); setTimeout(() => o.remove(), 420); });
    if (v === '') return;
    const s = document.createElement('span'); s.textContent = v; s.className = 'in'; el.appendChild(s);
    void s.offsetWidth; s.classList.remove('in');
  }

  let st8 = {...S[0]};
  function render(anim){
    const s = st8, name = s.name === '*' ? NAME() : s.name;
    root.classList.toggle('mg', s.mg); root.classList.toggle('open', s.open); root.classList.toggle('pop', !!s.pop);
    mt.classList.toggle('has', s.sel.length > 0);
    roll(cn, s.sel.length, anim);
    SC.forEach(c => { const e = shelf[c.id], k = s.sel.indexOf(c.id); e.classList.toggle('on', k >= 0); if (k >= 0) e.querySelector('.nb').textContent = k + 1; });
    // 新文件夹按 ✓ 就在「我的分类」里出现、标题数字跟着加一；里面的数字和封面后面那张谱子等谱子飞进去再出
    const made = s.name === '*';
    rc.classList.toggle('on', made); rc.classList.toggle('has', s.rec.length > 0);
    roll(rcN, s.rec.length || '', anim); roll(hn, 3 + made, anim);
    rcT.textContent = s.name === '*' ? NAME() : ''; rn.textContent = NAME();
    Object.entries(pages).forEach(([k, p]) => p.classList.toggle('on', k === s.page));
    rt.textContent = snT('{n} selected scores', {n: s.sel.length}); cl.classList.toggle('off', s.sel.length === 0);
    // 光标：有字时跟在字后面，空着时在占位文字前面（照 iOS 文本框）
    const typing = s.page === 'create' && s.pop, ph = `<span class="ph">${snT('Folder Name')}</span>`;
    fld.innerHTML = name ? name + (typing ? '<i class="cr"></i>' : '') : (typing ? '<i class="cr"></i>' : '') + ph;
    ok.classList.toggle('off', !name); ok.classList.toggle('go', !!name);
  }

  /* ---------- 缩放 ---------- */
  let dotPx = 0, sNow = 1;
  const fit = () => {
    const s = root.clientWidth/W; if (!s) return; sNow = s;
    st.style.transform = `scale(${s})`;
    const d = dotPx || Math.max(18, Math.min(30, 34*s));
    root.style.setProperty('--dotu', (d/s).toFixed(2) + 'px');
  };
  const ro = new ResizeObserver(fit); ro.observe(root); fit();

  /* ---------- 圆点和飞行 ---------- */
  let tp = null, lastP = null;
  // 飞行中的谱子 id → {a, p}：不跟拍子走，落进文件夹时才记进 rec；中途前进时接着飞，snap/destroy 时取消、不记
  const flying = new Map();
  const place = () => { if (tp){ dot.style.left = tp[0] + 'px'; dot.style.top = tp[1] + 'px'; } };
  const rip = () => { dot.classList.remove('rip'); void dot.offsetWidth; dot.classList.add('rip'); };
  const hideDot = () => { dot.style.opacity = 0; dot.style.transform = ''; dot.classList.remove('rip'); tp = lastP = null; };
  const at = (el, fx = .5, fy = .5) => { const r = el.getBoundingClientRect(), sr = st.getBoundingClientRect(), k = sr.width/W || 1;
    return [(r.left + r.width*fx - sr.left)/k, (r.top + r.height*fy - sr.top)/k]; };
  // rate 是播放倍速（补完上一拍时加快）；落进文件夹时：记进 rec、数字滚动、封面一顿，谱子再淡掉
  function fly(id, delay, rate = 1){
    const g = document.createElement('div'); g.className = 'gh'; g.style.backgroundImage = `url(${A}${BY[id].img})`;
    const i = SC.findIndex(s => s.id === id), x0 = colX(i), y0 = R1, k = .36;
    const x1 = colX(3) + CW*.45 - CW*k/2, y1 = R2 + CH*.48 - CH*k/2;
    g.style.transform = `translate(${x0}px,${y0}px)`; g.style.opacity = 0; st.insertBefore(g, $('.tb'));
    const a = g.animate([
      {transform: `translate(${x0}px,${y0}px) scale(1)`, opacity: 1},
      // 先往下再往右：不从右上角的工具栏和弹窗那里穿过去
      {transform: `translate(${x0 + (x1 - x0)*.18}px,${y0 + (y1 - y0)*.6}px) scale(.68)`, opacity: 1, offset: .44},
      {transform: `translate(${x1}px,${y1}px) scale(${k})`, opacity: 1}
    ], {duration: 820, delay, easing: 'cubic-bezier(.3,.6,.25,1)', fill: 'both'});
    a.playbackRate = rate;
    let landed; const p = new Promise(r => { landed = r; });
    a.onfinish = () => {
      flying.delete(id);
      st8.go = st8.go.filter(x => x !== id); st8.rec = [...st8.rec, id]; render(true);
      rc.classList.remove('bump'); void rc.offsetWidth; rc.classList.add('bump');
      g.animate([{opacity: 1}, {transform: `translate(${x1}px,${y1 + 4}px) scale(${k*.9})`, opacity: 0}], {duration: 130, fill: 'both'}).onfinish = () => g.remove();
      landed();
    };
    a.oncancel = () => { flying.delete(id); g.remove(); landed(); };
    flying.set(id, {a, p});
  }

  /* ---------- 剧情 ---------- */
  // cur 是正在播（或刚播完）的拍，done 是画面已经完整走到终态的拍；t.k 是时间倍数（补完上一拍时为 FAST）
  let tok = null, cur = 0, done = 0, t0 = 0, dur = 0;
  // 每一步先看画面走到哪了，已经做完的步骤跳过：同一段脚本既能从头播，也能从中途接着补完
  async function run(n, t){
    const chk = () => { if (t.dead) throw CANCEL; };
    const wait = ms => new Promise(r => setTimeout(r, ms*t.k)).then(chk);
    const moveTo = (p, ms = 560) => new Promise((res, rej) => {
      ms *= t.k;
      const a = tp || lastP || [p[0] + 70, p[1] + 150], s0 = performance.now(); tp = a; place(); dot.style.opacity = 1;
      (function f(now){ if (t.dead) return rej(CANCEL); const k = Math.min(1, (now - s0)/ms), e = ease(k);
        tp = [a[0] + (p[0] - a[0])*e, a[1] + (p[1] - a[1])*e]; place(); k < 1 ? requestAnimationFrame(f) : res(); })(s0); });
    // 落指：圆点按下、被点的东西跟着按一下
    const press = async (el) => { dot.style.transform = 'scale(.75)'; rip(); el && el.classList.add('prs'); await wait(150); el && el.classList.remove('prs'); };
    const lift = async () => { dot.style.transform = ''; await wait(110); dot.style.opacity = 0; await wait(180); lastP = tp; tp = null; };
    const tap = async (el, fx, fy, ms, pressEl = el) => { await moveTo(at(el, fx, fy), ms); await press(pressEl); };
    const set = (o, anim = true) => { Object.assign(st8, o); render(anim); };
    const sel = (id) => set({sel: [...st8.sel, id]});
    // 定下来的谱子（go）还没起飞的补飞，然后等所有飞行中的都落进文件夹
    const launch = async (delay) => {
      st8.go.filter(id => !flying.has(id)).forEach((id, i) => fly(id, delay + i*170, 1/t.k));
      await Promise.all([...flying.values()].map(f => f.p)); chk();
    };
    if (n === 1){
      if (!st8.mg){ await wait(350); await tap($('.tb.br .gb'), .5, .5, 620); set({mg: true}); await lift(); }
      if (!st8.sel.includes('k545')){ await wait(420); await tap(shelf.k545.querySelector('.th'), .5, .42, 560, shelf.k545); sel('k545'); await lift(); }
      if (!st8.sel.includes('op49')){ await wait(260); await tap(shelf.op49.querySelector('.th'), .5, .42, 520, shelf.op49); sel('op49'); await lift(); }
      await wait(300);
    } else if (n === 2){
      if (st8.name !== '*'){
        const full = [...NAME()], gap = full.length > 4 ? 120 : 220;
        if (st8.pop !== 'create'){
          await wait(350); await tap($('.gb.nw'), .5, .5, 620);
          // App 里弹窗一出来就是新建页，不从根页滑过去
          po.classList.add('nt'); set({page: 'create', name: ''}, false); void po.offsetWidth; po.classList.remove('nt');
          set({pop: 'create'}); await lift(); await wait(600 - gap);
        }
        // 先等再打：中途接手时下一个字也隔一拍才出来
        for (const ch of full.slice([...st8.name].length)){ await wait(gap); st8.name += ch; render(true); }
        await wait(380 + gap); await tap(ok, .5, .5, 600);
        // 建好就收起整个弹窗并结束管理（照 App 创建成功的收尾）：不退回根页、不再点一次完成（弹窗停在新建页淡出），右上换回「选择」；两份谱子飞进新文件夹
        set({name: '*', sel: [], pop: null, mg: false, go: st8.sel.slice()});
        await lift();
      }
      await launch(250); await wait(700);
    } else if (n === 3){
      if (!st8.rec.includes('k331') && !st8.go.includes('k331')){
        // 拍 2 已回到普通图书馆：重新点「选择」进管理
        if (!st8.mg){ await wait(450); await tap($('.tb.br .gb'), .5, .5, 620); set({mg: true}); await lift(); }
        if (!st8.sel.includes('k331')){ await wait(350); await tap(shelf.k331.querySelector('.th'), .5, .42, 600, shelf.k331); sel('k331'); await lift(); }
        if (st8.pop !== 'add'){
          await wait(300); await tap($('.gb.ad'), .5, .5, 560);
          po.classList.add('nt'); set({page: 'add'}, false); void po.offsetWidth; po.classList.remove('nt');
          set({pop: 'add'}); await lift(); await wait(500);
        }
        const row = $('.rcr');
        await moveTo(at(row, .3, .5), 560); row.classList.add('hl'); await press();
        set({sel: [], page: 'root', go: st8.sel.slice()}); setTimeout(() => { if (!t.dead) row.classList.remove('hl'); }, 250*t.k);
        await lift();
      }
      await launch(200); await wait(650);
      if (st8.pop){ await tap($('.pd'), .5, .5, 600); set({pop: null}); await lift(); }
      if (st8.mg){ await wait(320); await tap($('.dn'), .5, .5, 560); set({mg: false}); await lift(); }
      if (!st8.open){ await wait(380); await tap(rc.querySelector('.cv'), .5, .5, 600, rc); set({open: true}); await lift(); }
      await wait(1500);
    }
  }
  function show(n, soft){
    st8 = {...S[n], sel: [...S[n].sel], rec: [...S[n].rec], go: []};
    hideDot(); rc.classList.remove('bump');
    st.querySelectorAll('.prs,.hl').forEach(e => e.classList.remove('prs', 'hl'));
    render(!!soft);
  }
  function snap(n, soft){
    if (tok){ tok.dead = true; tok = null; }
    flying.forEach(f => f.a.cancel()); flying.clear();
    if (!soft) root.classList.add('now');
    show(n, soft); done = n; void root.offsetWidth;
    if (!soft) requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('now')));
  }
  function go(n, animate, soft, cont){
    n = Math.max(0, Math.min(3, n|0));
    if (!animate || RM || n === 0){ snap(n, soft); cur = n; dur = 0; return Promise.resolve(); }
    // 接着上一拍往前走：画面、圆点、飞行中的谱子都不动，旧的计时和回调随旧 token 作废
    const hand = cont && cur === n - 1 && done < n;
    if (hand){
      if (tok) tok.dead = true;
      st.querySelectorAll('.prs,.hl').forEach(e => e.classList.remove('prs', 'hl')); dot.style.transform = '';
    } else snap(n - 1);
    const t = tok = {dead: false, k: 1}, from = done;
    cur = n; t0 = performance.now(); dur = DUR[n];
    return (async () => {
      if (from < n - 1){
        // 上一拍（连按几次时可能更早）没走完的动作，从当前画面按 FAST 倍速可见地补完
        t.k = FAST; flying.forEach(f => { f.a.playbackRate = 1/FAST; f.a.play(); });
        for (let k = from + 1; k < n; k++){ await run(k, t); done = k; }
        t.k = 1;
      }
      await run(n, t); done = n;
    })().then(() => { if (tok === t){ tok = null; dur = performance.now() - t0; } return !t.dead; }, e => { if (e !== CANCEL) throw e; return false; });
  }
  render(false);

  const api = {
    beats: 3,
    get beatNow(){ return cur; }, get busy(){ return !!tok; },
    get beatFrac(){ return cur === 0 ? 0 : tok ? Math.min(.99, (performance.now() - t0)/DUR[cur]) : 1; },
    one(n, cont){ return go(n, true, false, !!cont); }, beat(n, soft){ go(n, false, !!soft); },
    // 原地停住：旧 token 作废，飞行中的谱子暂停（不会再落地改画面），等 one(n + 1, true) 接着走；要摆终态用 beat(n)
    interrupt(){ if (!tok) return; tok.dead = true; tok = null; flying.forEach(f => f.a.pause()); },
    progress(){},
    visible(on){ page && page.visible(on); },
    dot(px){ dotPx = px; fit(); },
    destroy(){ if (tok) tok.dead = true; flying.forEach(f => f.a.cancel()); flying.clear(); ro.disconnect(); page && page.destroy(); root.innerHTML = ''; root.classList.remove('sn-fo', 'mg', 'open', 'pop', 'now'); }
  };

  /* ---------- 官网 #folders：章节列表和进度条，第一次看到时连播 1→2→3，点哪拍从哪拍播到底 ---------- */
  const sec = opts.wire === false ? null : root.closest('section');
  const lis = sec ? [...sec.querySelectorAll('.fo-copy li')] : [], bars = sec ? [...sec.querySelectorAll('.fo-prog button')] : [];
  const page = sec && (lis.length || bars.length) ? (() => {
    let chain = 0, seen = false, on = false, raf = 0, gapT = 0, pend = 0;
    const paint = () => {
      const f = api.beatFrac;
      bars.forEach((b, k) => b.style.setProperty('--p', k < cur - 1 ? 1 : k === cur - 1 ? f : 0));
      lis.forEach((l, k) => l.classList.toggle('on', k === cur - 1));
    };
    const loop = () => { paint(); raf = on && (tok || gapT) ? requestAnimationFrame(loop) : 0; };
    const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
    async function from(n){
      const c = ++chain; clearTimeout(gapT); gapT = 0; pend = 0;
      if (RM){ api.beat(n); paint(); return; }
      for (let k = n; k <= 3; k++){
        // 往下一拍走（自动连播，或播到一半点了下一拍）都接着当前画面走，不摆终态
        const p = api.one(k, cur === k - 1); kick();
        const ok = await p;
        if (!ok || c !== chain) return;
        if (k < 3){ await new Promise(r => { gapT = setTimeout(r, 1100); }); gapT = 0; if (c !== chain) return; }
      }
      paint();
    }
    const pick = n => { from(n); };
    const hs = [];
    const bind = (el, n) => { const h = e => { if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return; if (e.type === 'keydown') e.preventDefault(); pick(n); };
      el.addEventListener('click', h); el.addEventListener('keydown', h); hs.push([el, h]); };
    lis.forEach((l, k) => bind(l, k + 1)); bars.forEach((b, k) => bind(b, k + 1));
    paint();
    return {
      visible(v){
        on = v;
        if (v){
          if (!seen){ seen = true; RM ? (api.beat(3), paint()) : setTimeout(() => { if (on && !tok && cur === 0) from(1); }, 350); }
          else if (pend) from(pend);
          kick();
        } else {
          // 滚走了：停在当前这拍的终态，回来时接着播下一拍
          if (tok || gapT){ chain++; clearTimeout(gapT); gapT = 0; if (tok) snap(cur); pend = cur < 3 ? cur + 1 : 0; }
          paint();
        }
      },
      destroy(){ chain++; clearTimeout(gapT); cancelAnimationFrame(raf); hs.forEach(([el, h]) => { el.removeEventListener('click', h); el.removeEventListener('keydown', h); }); }
    };
  })() : null;
  return api;
};
})();
