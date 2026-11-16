// r13 一张谱副本（board-os.js 原样复制后只改：挂在竖放的整页阅读器里、统一圆点、四个演示各点一种颜色、颜色隐藏接口、瞬间摆好终态）。
// 以下是 board-os 原说明。
// r10 一张谱专用副本（board-os）：去掉「只认 Apple Pencil」、套索、形状演示前面多余的切笔、选色、开 More 等前置动作；原 board.js 不动。
// Board 复刻：Try the crayon，可交互的 Reader + 浮动批注面板。源码 work/sns-src/，由 build.sh 拼接。
/* SNSKit: shared StaffNotes reader + annotation palette replica.
   Built into components/annotate.js and components/board.js; whichever loads first defines it.
   Geometry and values follow App/Annotation/FloatingPalette*.swift. */
(function(){
if (window.SNSKit) return;
const K = window.SNSKit = {};
// 多语言：snT 来自 components/r13/i18n-r13.js（这里的词在 i18n/pens.json）；没载入时原样返回英文
const snT = K.snT = (s, v) => window.snT ? window.snT(s, v) : s.replace(/\{(\w+)\}/g, (m, k) => v && k in v ? v[k] : m);
const cs = document.currentScript;
K.base = cs && cs.src ? new URL('..', cs.src).href : 'components/';   // r13：副本在 components/r13/，素材还在 components/assets/
K.asset = n => K.base + 'assets/' + n;

K.INKS = ['#B64C50','#39836B','#3F529F','#D9AC2B','#8064AD','#292D38'];
K.INK_NAMES = ['Red','Green','Blue','Gold','Purple','Black'];
K.TOOLS = ['monoline','crayon','highlighter','eraser'];
K.ART = {monoline:'PaletteMonoline',crayon:'PaletteCrayon',highlighter:'PaletteHighlighter',eraser:'PaletteEraser'};
K.OPTICAL = {monoline:0,crayon:0,highlighter:-4.08,eraser:-0.24};
K.WIDTHS = {monoline:[1.5,2,2.5,3,4],crayon:[2.5,4.5,6.5,9,12],highlighter:[12,18,24,30,38],eraser:[12,24,40,64]};
K.DEF_W = {monoline:2,crayon:1,highlighter:2,eraser:1};
K.DEF_OP = {monoline:1,crayon:1,highlighter:.4};
K.H = {w:48+88+232+2*150+3*13.5, h:16+100+8};          // 708.5 x 124
K.V = {w:124, h:22+44+232+2*132+3*13.5+18};            // 124 x 620.5
K.C = 111.6;
K.PAGE_W = 595;                                        // PDF points across the page

const S = (inner, sw) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw||1.5}" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
K.S = S;
/* SF Symbols rendered from macOS (sizes in pt, as the app draws them) and the app's own palette SVGs, used as masks so they take currentColor */
K.SF = {undo:[24,22],redo:[24,22],lasso:[29,28],rectangle:[29,21],'rectangle-sel':[29,22],ellipse:[23,23],'ellipse-sel':[24,24],line:[20,19],'line-sel':[20,19],arrow:[20,18],'arrow-sel':[20,18],applepencil:[18,17]};
K.sf = n => { const z = K.SF[n]; return `<i class="k-sf" style="width:${z[0]}px;height:${z[1]}px;--m:url('${K.asset('palette/sf-'+n+'.png')}')"></i>`; };
K.svgIcon = (n, z) => `<i class="k-sf" style="width:${z}px;height:${z}px;--m:url('${K.asset('palette/'+n+'.svg')}')"></i>`;
K.SHAPES = [['rectangle','Rectangle'],['ellipse','Ellipse'],['line','Line'],['arrow','Arrow']];
K.ICON = {
  undo: S('<path d="M8.5 14.5 4 10l4.5-4.5"/><path d="M4 10h10a5.5 5.5 0 0 1 0 11h-3"/>',1.6),
  redo: S('<path d="m15.5 14.5 4.5-4.5-4.5-4.5"/><path d="M20 10H10a5.5 5.5 0 0 0 0 11h3"/>',1.6),
  lasso: S('<path d="M8.2 15.4C5 14.6 3 12.6 3 10.3 3 6.8 7 4 12 4s9 2.8 9 6.3-4 6.3-9 6.3c-.9 0-1.8-.1-2.6-.3"/><path d="M9.4 16.3c-.2-1-1.3-1.5-2.3-1.2-1 .3-1.3 1.3-.7 2 .6.6 1.7.4 2.1-.4"/><path d="M6.6 17.6c-.5 1.3-1.5 2.2-2.9 2.6"/>',1.4),
  rect: S('<rect x="3" y="5.5" width="18" height="13" rx="2.6"/>',1.5),
  more: S('<path d="M20.13 15.86a3.6 3.6 0 1 1-5.09 0 3.6 3.6 0 0 1 5.09 0Z"/><path d="m21.53 7.19-3.1 3.1a1.2 1.2 0 0 1-1.7 0l-3.1-3.1a1.2 1.2 0 0 1 0-1.7l3.1-3.1a1.2 1.2 0 0 1 1.7 0l3.1 3.1a1.2 1.2 0 0 1 0 1.7Z"/><path d="M8.14 3.88a3.6 3.6 0 1 1-5.09 0 3.6 3.6 0 0 1 5.09 0Z"/><path d="M3.41 15.09H7.8c.66 0 1.2.54 1.2 1.2v4.38c0 .66-.54 1.2-1.2 1.2H3.41c-.66 0-1.2-.54-1.2-1.2v-4.38c0-.66.54-1.2 1.2-1.2Z"/>',1.5),
  layers: S('<g transform="translate(12 12) scale(.93) translate(-12 -12)"><path d="m19.4 18.39-6.02 3.35c-1.38.77-3.07-.23-3.07-1.81v-6.56c0-.75.41-1.44 1.06-1.81l6.02-3.35c1.38-.77 3.07.23 3.07 1.81v6.56c0 .75-.41 1.44-1.06 1.81Z"/><path d="M17.08 4.26 9.02 8.84a4.2 4.2 0 0 0-2.09 3.59v7.62"/><path d="M13.69 2 5.66 6.46a3.9 3.9 0 0 0-2.13 3.61v6.6"/></g>',1.5),
  layersFill: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><g transform="translate(12 12) scale(.93) translate(-12 -12)"><path fill="currentColor" d="m19.4 18.39-6.02 3.35c-1.38.77-3.07-.23-3.07-1.81v-6.56c0-.75.41-1.44 1.06-1.81l6.02-3.35c1.38-.77 3.07.23 3.07 1.81v6.56c0 .75-.41 1.44-1.06 1.81Z"/><path d="M17.08 4.26 9.02 8.84a4.2 4.2 0 0 0-2.09 3.59v7.62"/><path d="M13.69 2 5.66 6.46a3.9 3.9 0 0 0-2.13 3.61v6.6"/></g></svg>`,
  eye: S('<path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3.2"/>',1.5),
  eyeOff: S('<path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3.2"/><path d="M4 4l16 16" stroke-width="1.7"/>',1.5),
  editOff: S('<path d="M14.6 5.4 18.6 9.4 9.2 18.8H5.2v-4Z"/><path d="m12.4 7.6 4 4"/><path d="M4 4l16 16"/>',1.5),
  trash: S('<path d="M4.5 6.5h15"/><path d="M9.5 6.5V4.2h5v2.3"/><path d="m6.3 6.5.9 13.3h9.6l.9-13.3"/><path d="M10.2 10.5v5.8M13.8 10.5v5.8"/>',1.5),
  back: S('<path d="M20 12H5"/><path d="m11 5.5-6.5 6.5 6.5 6.5"/>',1.9),
  search: S('<circle cx="10.6" cy="10.6" r="6.6"/><path d="m15.4 15.4 4.8 4.8"/>',1.8),
  outline: S('<path d="M4 6h13M4 10.5h9M4 15h7"/><circle cx="16.2" cy="17.2" r="2.4"/><path d="M18.6 17.2V9.4l2.4 1"/>',1.6),
  info: S('<circle cx="12" cy="12" r="9"/><path d="M12 10.8v5.6"/><circle cx="12" cy="7.7" r=".4" fill="currentColor"/>',1.6),
  ai: S('<path d="M8 4.5H6.5a2.5 2.5 0 0 0-2.5 2.5v10a2.5 2.5 0 0 0 2.5 2.5h11a2.5 2.5 0 0 0 2.5-2.5V7a2.5 2.5 0 0 0-2.5-2.5H16"/><path d="m7.6 15.2 1.9-6 1.9 6M8.2 13.3h2.6M14.5 9.2v6"/>',1.4),
  az: S('<circle cx="12" cy="12" r="9"/><path d="m7.2 14.6 2.2-6.2 2.2 6.2M7.9 12.7h3"/><path d="M13 11.6h3.6L13 16h3.8"/>',1.4),
  metronome: S('<path d="M9.3 3.8h5.4l3.9 15.6a1 1 0 0 1-1 1.3H6.4a1 1 0 0 1-1-1.3Z"/><path d="m12 16.5 5.6-9.8"/>',1.5),
  pen: S('<path d="M16.7 3.6a1.9 1.9 0 0 1 2.7 2.7L9.9 15.8l-3.6.9.9-3.6Z" fill="currentColor"/><path d="M3.5 20.3c2.2 1 3.9-1.6 6.1-.6 1.5.7 2.7.9 4.6-.3"/>',1.4),
  chevR: S('<path d="m9.5 5.5 6.5 6.5-6.5 6.5"/>',1.9),
  wifi: `<svg viewBox="0 0 24 18" fill="currentColor"><path d="M12 15.6 14.6 13a3.7 3.7 0 0 0-5.2 0Zm-5.4-5.3 1.8 1.8a5.1 5.1 0 0 1 7.2 0l1.8-1.8a7.6 7.6 0 0 0-10.8 0ZM2.9 6.6l1.8 1.8a10.3 10.3 0 0 1 14.6 0l1.8-1.8a12.9 12.9 0 0 0-18.2 0Z"/></svg>`
};

/* ---------- geometry (FloatingPaletteGeometry.released / frame) ---------- */
K.frame = function(pl, area, ps){
  const cs = K.C*ps;
  if (pl.compact){
    const top = pl.corner[0]==='t';
    const lead = pl.corner[1]==='l';
    return {x: lead ? area.x : area.x+area.w-cs, y: top ? area.y : area.y+area.h-cs, w:cs, h:cs};
  }
  const vert = pl.edge==='l' || pl.edge==='r';
  const w = (vert?K.V.w:K.H.w)*ps, h = (vert?K.V.h:K.H.h)*ps;
  switch(pl.edge){
    case 'l': return {x:area.x, y:area.y+(area.h-h)/2, w, h};
    case 'r': return {x:area.x+area.w-w, y:area.y+(area.h-h)/2, w, h};
    case 't': return {x:area.x+(area.w-w)/2, y:area.y, w, h};
    default:  return {x:area.x+(area.w-w)/2, y:area.y+area.h-h, w, h};
  }
};
K.released = function(pt, area, ps){
  const storage = Math.min(area.h*.25, K.C*ps*1.5);
  let corner = null;
  if (pt.y <= area.y+storage){
    if (pt.x <= area.x+area.w*.35) corner='tl'; else if (pt.x >= area.x+area.w*.65) corner='tr';
  } else if (pt.y >= area.y+area.h-storage){
    if (pt.x <= area.x+area.w*.35) corner='bl'; else if (pt.x >= area.x+area.w*.65) corner='br';
  }
  if (corner) return {compact:true, corner, edge:corner[0]==='t'?'t':'b'};
  const px = Math.min(Math.max(pt.x,area.x),area.x+area.w), py = Math.min(Math.max(pt.y,area.y),area.y+area.h);
  const c = [['r',area.x+area.w-px],['l',px-area.x],['t',py-area.y],['b',area.y+area.h-py]].sort((a,b)=>a[1]-b[1]);
  return {compact:false, edge:c[0][0]};
};

/* ---------- CSS ---------- */
K.css = P => `
${P}{font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Helvetica Neue",sans-serif;color:#292D38;-webkit-font-smoothing:antialiased;user-select:none;-webkit-user-select:none}
${P} .k-stage{position:absolute;left:0;top:0;transform-origin:0 0;overflow:hidden;background:#fff}
${P} .k-page{position:absolute;mix-blend-mode:multiply;pointer-events:none;-webkit-user-drag:none}
${P} .k-ink{position:absolute;left:0;top:0;mix-blend-mode:multiply;pointer-events:none}
${P} .k-live{position:absolute;left:0;top:0;pointer-events:none}
${P} .k-status{position:absolute;left:0;right:0;top:0;height:30px;font-size:15px;font-weight:600;letter-spacing:-.01em}
${P} .k-status .t{position:absolute;left:17px;top:9px}
${P} .k-status .r{position:absolute;right:16px;top:9px;display:flex;align-items:center;gap:6px}
${P} .k-status .r svg{width:17px;height:13px}
${P} .k-bat{width:25px;height:12px;border-radius:3.5px;border:1px solid rgba(41,45,56,.38);position:relative;padding:1.5px;box-sizing:border-box}
${P} .k-bat::before{content:"";display:block;width:100%;height:100%;border-radius:2px;background:#1c1d21}
${P} .k-bat::after{content:"";position:absolute;right:-3.5px;top:3.5px;width:1.6px;height:3.5px;border-radius:0 1px 1px 0;background:rgba(41,45,56,.4)}
${P} .k-pill{position:absolute;height:44px;border-radius:22px;background:rgba(255,255,255,.88);box-shadow:0 4px 18px rgba(170,178,197,.28),0 0 0 .5px rgba(41,45,56,.04);display:flex;align-items:center;justify-content:space-around;box-sizing:border-box}
${P} .k-pill i{display:block;width:22px;height:22px;color:#292D38}
${P} .k-pill i svg{width:100%;height:100%;display:block}
${P} .k-pill i.blue{color:#3F529F}
${P} .k-title{position:absolute;left:0;right:0;text-align:center;line-height:1.05}
${P} .k-title b{display:block;font-size:13.5px;font-weight:500;letter-spacing:-.01em}
${P} .k-title span{display:block;font-size:11.5px;color:#646A75;margin-top:2px}
${P} .k-pager{position:absolute;height:42px;border-radius:21px;background:rgba(255,255,255,.9);box-shadow:0 4px 18px rgba(170,178,197,.28);display:flex;align-items:center;justify-content:center;gap:12px;font-size:13px;overflow:hidden}
${P} .k-pager em{font-style:normal;background:#F0EFEC;border-radius:6px;padding:4px 7px;font-variant-numeric:tabular-nums}
${P} .k-pager::after{content:"";position:absolute;left:13px;bottom:0;width:36px;height:2px;border-radius:1px;background:#3F529F}

${P} .k-pal{position:absolute;box-sizing:border-box;touch-action:none;cursor:grab}
${P} .k-pal.drag{cursor:grabbing}
${P} .k-glass{position:absolute;inset:0;border-radius:inherit;background:rgba(250,250,248,.8);-webkit-backdrop-filter:blur(18px) saturate(1.7);backdrop-filter:blur(18px) saturate(1.7);box-shadow:0 10px 34px rgba(41,45,56,.10),0 1px 3px rgba(41,45,56,.06),inset 0 0 0 .6px rgba(255,255,255,.9),inset 0 1px 0 rgba(255,255,255,.95)}
${P} .k-handle{position:absolute;border-radius:2px;background:rgba(60,60,67,.4);pointer-events:none}
${P} .k-exp{position:absolute;left:50%;top:50%;transform-origin:50% 50%}
${P} .k-row{position:absolute;inset:0;display:flex;align-items:flex-start;box-sizing:border-box}
${P} .k-row.h{flex-direction:row;padding:16px 24px 8px;gap:13.5px}
${P} .k-row.v{flex-direction:column;align-items:center;padding:22px 0 18px;gap:13.5px}
${P} .k-ur{display:flex;width:88px;height:44px;flex:none}
${P} .k-row.h .k-ur{margin-top:28px}
${P} .k-btn{all:unset;box-sizing:border-box;display:grid;place-items:center;cursor:pointer;color:#292D38;flex:none}
${P} .k-btn svg{display:block}
${P} .k-sf{display:block;flex:none;background:currentColor;-webkit-mask:var(--m) center/contain no-repeat;mask:var(--m) center/contain no-repeat}
${P} .k-ur .k-btn{width:44px;height:44px}
${P} .k-ur .k-btn svg{width:22px;height:22px}
${P} .k-tools{display:flex;flex:none}
${P} .k-row.h .k-tools{width:232px;height:100px}
${P} .k-row.v .k-tools{flex-direction:column;width:100px;height:232px}
${P} .k-tool{all:unset;position:relative;cursor:pointer;flex:none}
${P} .k-row.h .k-tool{width:58px;height:100px}
${P} .k-row.v .k-tool{width:100px;height:58px}
${P} .k-clip{position:absolute;width:58px;height:100px;overflow:hidden}
${P} .k-row.h .k-clip{left:0;top:8px}
${P} .k-row.v .k-clip{left:21px;top:-21px}
${P} .k-clip img{position:absolute;left:11px;width:36px;height:105.6px;transition:top .2304s cubic-bezier(.2,.7,.3,1),filter .2304s;-webkit-user-drag:none;pointer-events:none}
${P} .k-tool.sel .k-clip img{filter:drop-shadow(0 2px 3px rgba(0,0,0,.12))}
${P} .k-val{position:absolute;display:flex;flex-direction:column;align-items:center;gap:3px;font-size:11px;font-weight:600;font-variant-numeric:tabular-nums;color:#292D38;pointer-events:none;line-height:1;opacity:0;transition:opacity .2s}
${P} .k-row.h .k-val{left:15px;width:28px;top:${78+8-16}px;height:32px;justify-content:center}
${P} .k-row.v .k-val{flex-direction:row;gap:6px;width:56px;height:16px;top:21px;justify-content:center}
${P} .k-tool.sel .k-val{opacity:1}
${P} .k-grid{display:grid;flex:none}
${P} .k-row.h .k-grid{grid-template-columns:repeat(3,50px);grid-auto-rows:50px;margin-top:0}
${P} .k-row.v .k-grid{grid-template-columns:repeat(2,44px);grid-auto-rows:44px}
${P} .k-dot{all:unset;position:relative;display:grid;place-items:center;cursor:pointer}
${P} .k-dot b{display:block;width:30px;height:30px;border-radius:50%;box-shadow:inset 0 0 0 .5px rgba(0,0,0,.16)}
${P} .k-dot::after{content:"";position:absolute;left:50%;top:50%;width:36px;height:36px;margin:-18px 0 0 -18px;border-radius:50%;box-shadow:inset 0 0 0 1.5px transparent;transition:box-shadow .2s}
${P} .k-dot.sel::after{box-shadow:inset 0 0 0 1.5px #1c1d21}
${P} .k-act{all:unset;display:grid;place-items:center;cursor:pointer;color:#292D38}
${P} .k-act svg{width:22px;height:22px;display:block}
${P} .k-act.lasso svg{width:24px;height:24px}
${P} .k-act.layers svg{width:27.8px;height:27.8px}
${P} .k-act.sel{color:#3F529F}
${P} .k-act.sel svg{stroke-width:1.9}
${P} .k-cmp{position:absolute;left:50%;top:50%;width:${K.C}px;height:${K.C}px;transform-origin:50% 50%;pointer-events:none}
${P} .k-cmp .box{position:absolute;left:10.8px;top:17.1px;width:90px;height:94.5px;overflow:hidden}
${P} .k-cmp img{position:absolute;left:21.6px;top:0;width:46.8px;height:137.28px;filter:drop-shadow(0 2px 3px rgba(0,0,0,.12))}
${P} .k-cmp .sym{position:absolute;inset:0;display:grid;place-items:center;color:#292D38}
${P} .k-cmp .sym svg{width:44px;height:44px}
${P} .k-cmp .sym .k-sf{transform:scale(1.6)}

${P} .k-pop{position:absolute;box-sizing:border-box;border-radius:32px;padding:12px 14px;background:rgba(252,252,250,.78);-webkit-backdrop-filter:blur(22px) saturate(1.7);backdrop-filter:blur(22px) saturate(1.7);box-shadow:0 14px 44px rgba(41,45,56,.16),0 1px 3px rgba(41,45,56,.06),inset 0 0 0 .6px rgba(255,255,255,.9);transform-origin:var(--ox,50%) var(--oy,100%);transition:opacity .18s,transform .26s cubic-bezier(.2,.9,.3,1.1)}
${P} .k-pop.off{opacity:0;transform:scale(.86);pointer-events:none}
${P} .k-pop .arrow{position:absolute;width:22px;height:12px;overflow:hidden}
${P} .k-pop .arrow::before{content:"";position:absolute;left:3px;top:4px;width:16px;height:16px;transform:rotate(45deg);border-radius:3px;background:rgba(250,250,248,.96)}
${P} .k-widths{display:flex;gap:4px;height:44px}
${P} .k-widths.er{gap:${116/3}px;justify-content:center}
${P} .k-w{all:unset;width:44px;height:44px;display:grid;place-items:center;cursor:pointer;position:relative}
${P} .k-w::before{content:"";position:absolute;left:2px;top:2px;width:40px;height:40px;border-radius:10px;background:transparent;transition:background .15s}
${P} .k-w.sel::before{background:#000}
${P} .k-w svg{position:relative;width:27px;height:27px;overflow:visible;color:#1c1d21}
${P} .k-w.sel svg{color:#fff}
${P} .k-w i{position:relative;display:block;border-radius:50%;box-shadow:inset 0 0 0 2px rgba(28,29,33,.38)}
${P} .k-w.sel i{box-shadow:inset 0 0 0 2px #fff}
${P} .k-op{position:relative;height:36px;margin-top:12px;border-radius:18px;overflow:visible;cursor:pointer;touch-action:none}
${P} .k-op .tr{position:absolute;inset:0;border-radius:18px;background-color:#fff;background-image:linear-gradient(45deg,#e0e0e0 25%,transparent 25%,transparent 75%,#e0e0e0 75%),linear-gradient(45deg,#e0e0e0 25%,transparent 25%,transparent 75%,#e0e0e0 75%);background-size:16px 16px;background-position:0 0,8px 8px;overflow:hidden}
${P} .k-op .tr::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent,var(--ink))}
${P} .k-op .th{position:absolute;top:0;width:36px;height:36px;border-radius:50%;box-sizing:border-box;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.22)}
${P} .k-seg{display:flex;height:32px;margin:6px 0 12px;padding:2px;border-radius:9px;background:rgba(118,118,128,.12);font-size:13px;font-weight:500}
${P} .k-seg button{all:unset;flex:1;text-align:center;border-radius:7px;cursor:pointer;line-height:28px}
${P} .k-seg button.sel{background:#fff;box-shadow:0 2px 6px rgba(0,0,0,.1)}

${P} .k-lay{width:300px;padding:14px 0 10px;border-radius:30px}
${P} .k-lay .seg{display:flex;margin:0 18px;height:36px;border-radius:18px;background:rgba(118,118,128,.1);padding:2px;gap:2px}
${P} .k-lay .seg span{flex:1;display:flex;align-items:center;justify-content:center;gap:6px;border-radius:16px;color:#292D38;font-size:13.5px;font-weight:500}
${P} .k-lay .seg span:first-child{flex:1.7;background:rgba(63,82,159,.12);color:#3F529F}
${P} .k-lay .seg svg{width:19px;height:19px}
${P} .k-lay .gt{display:flex;align-items:center;justify-content:space-between;padding:0 18px;height:52px;margin-top:4px;font-size:15px;font-weight:600}
${P} .k-lay .gt i,${P} .k-lay .ly i{display:block;width:22px;height:22px;color:#292D38}
${P} .k-lay svg{display:block;width:100%;height:100%}
${P} .k-lay .ly{display:flex;align-items:center;height:46px;padding:0 14px 0 18px;gap:12px;font-size:14.5px;font-weight:500}
${P} .k-lay .ly .nm{flex:1;height:100%;display:flex;align-items:center;box-shadow:inset 0 -.5px 0 rgba(41,45,56,.14)}
${P} .k-lay .ly.off .nm{color:#9a9ea7}
${P} .k-lay .ly .eye{cursor:pointer}
${P} .k-lay .ly .tr{color:#C9433F}
${P} .k-lay .tip{width:16px;height:18px;flex:none}
${P} .k-lay .empty{padding:10px 18px 8px;font-size:13px;color:#646A75}
${P} .k-menu{width:270px;padding:6px;border-radius:18px}
${P} .k-menu button{all:unset;display:flex;align-items:center;justify-content:space-between;width:100%;box-sizing:border-box;height:44px;padding:0 12px;border-radius:12px;font-size:14.5px;cursor:pointer}
${P} .k-menu button:hover{background:rgba(118,118,128,.1)}
${P} .k-menu .sw{width:38px;height:23px;border-radius:12px;background:rgba(120,120,128,.24);position:relative;transition:background .2s}
${P} .k-menu .sw::after{content:"";position:absolute;left:2px;top:2px;width:19px;height:19px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.2);transition:left .2s}
${P} .k-menu .on .sw{background:#3F529F}
${P} .k-menu .on .sw::after{left:17px}
${P} .k-menu .warn{color:#C9433F}
${P} .k-menu .tx{flex:1}
${P} .k-menu .ck{width:20px;flex:none;font-weight:600}
${P} .k-menu .k-sf{transform:scale(.85)}
${P} .k-touch{position:absolute;width:30px;height:30px;margin:-15px 0 0 -15px;border-radius:50%;background:rgba(41,45,56,.16);box-shadow:0 0 0 1.5px rgba(255,255,255,.85),0 2px 8px rgba(41,45,56,.18);pointer-events:none}
${P} .k-touch.pen{width:6px;height:6px;margin:-3px 0 0 -3px;background:#3a3d46;box-shadow:none;filter:drop-shadow(0 5px 7px rgba(41,45,56,.22))}
${P} .k-touch.pen::before,${P} .k-touch.pen::after{content:"";position:absolute;left:-4px;width:14px;transform:rotate(30deg)}
${P} .k-touch.pen::before{bottom:3px;height:26px;transform-origin:50% 100%;clip-path:polygon(50% 100%,0 0,100% 0);background:linear-gradient(0deg,#3a3d46 0 16%,#f4f4f6 16%,#e4e5e9)}
${P} .k-touch.pen::after{bottom:29px;height:150px;border-radius:7px 7px 1px 1px;transform-origin:50% calc(100% + 26px);background:linear-gradient(90deg,#fff,#f3f3f5 55%,#dcdde2)}
${P} .k-tip{position:absolute;width:8px;height:8px;margin:-4px 0 0 -4px;border-radius:50%;background:rgba(41,45,56,.55);box-shadow:0 0 0 3px rgba(255,255,255,.55);pointer-events:none}
${P} .k-sel{position:absolute;border:1.5px dashed rgba(63,82,159,.85);border-radius:8px;background:rgba(63,82,159,.05);pointer-events:none;box-sizing:border-box}
${P} .k-seb,${P} .k-note{position:absolute;box-sizing:border-box;height:44px;border-radius:22px;background:rgba(252,252,250,.8);-webkit-backdrop-filter:blur(22px) saturate(1.7);backdrop-filter:blur(22px) saturate(1.7);box-shadow:0 8px 28px rgba(41,45,56,.14),0 1px 3px rgba(41,45,56,.06),inset 0 0 0 .6px rgba(255,255,255,.9);display:flex;align-items:center;pointer-events:none;z-index:25;transition:opacity .2s,transform .26s cubic-bezier(.2,.9,.3,1.1)}
${P} .k-seb{width:214px;padding:0 2px;transform-origin:50% 0}
${P} .k-seb i{flex:none;width:42px;height:44px;display:grid;place-items:center;color:#292D38;position:relative;transition:opacity .2s}
${P} .k-seb i::before{content:"";position:absolute;left:3px;top:4px;width:36px;height:36px;border-radius:18px;background:rgba(118,118,128,.16);opacity:0;transition:opacity .15s}
${P} .k-seb i.hit::before{opacity:1}
${P} .k-seb i.off{opacity:.3}
${P} .k-seb i.del{color:#B33E47}
${P} .k-seb svg{position:relative;display:block;overflow:visible}
${P} .k-seb .dot::after{content:"";width:17px;height:17px;border-radius:50%;background:var(--c);box-shadow:inset 0 0 0 1px #fff}
${P} .k-note{left:50%;padding:0 16px;gap:9px;font-size:15px;font-weight:500;letter-spacing:-.01em;white-space:nowrap;color:#292D38;transform:translateX(-50%);transform-origin:50% 0}
${P} .k-note svg{flex:none;display:block}
${P} .k-seb.off{opacity:0;transform:scale(.94)}
${P} .k-note.off{opacity:0;transform:translate(-50%,-10px) scale(.92)}
`;
// r13：统一圆点按下时的涟漪（样式在 onescore-r13.css 的 .snd）
K.rip = el => { el.classList.remove('rip'); void el.offsetWidth; el.classList.add('rip'); };
K.injectCSS = function(id, P){
  if (document.getElementById(id)) return;
  const s = document.createElement('style'); s.id = id; s.textContent = K.css(P);
  document.head.appendChild(s);
};

/* ---------- small DOM helpers ---------- */
const h = (tag, cls, html) => { const e=document.createElement(tag); if(cls) e.className=cls; if(html!=null) e.innerHTML=html; return e; };
K.h = h;
K.fmt = v => (Math.round(v*10)/10).toString();

/* ---------- reader chrome (portrait 834 or landscape 1194 wide) ---------- */
K.chrome = function(stage, W, H, opts){
  opts = opts || {};
  const st = h('div','k-status',`<span class="t">9:41&nbsp;&nbsp;Thu 12 Nov</span><span class="r">${K.ICON.wifi}<span style="font-size:14px">100%</span><span class="k-bat"></span></span>`);
  stage.appendChild(st);
  const p1 = h('div','k-pill',`<i class="blue">${K.ICON.back}</i><i>${K.ICON.search}</i>`); Object.assign(p1.style,{left:'16px',top:'32px',width:'95px'});
  const p2 = h('div','k-pill',`<i>${K.ICON.outline}</i>`); Object.assign(p2.style,{left:'118px',top:'32px',width:'44px'});
  const tw = Math.min(306, W-2*262);
  const p3 = h('div','k-pill',`<i style="position:absolute;left:13px;width:24px;height:24px">${K.ICON.info}</i><div class="k-title"><b>Sonata in C, KV 545</b><span>Wolfgang Amadeus Mozart · 1756 – 1791</span></div><i style="position:absolute;right:14px">${K.ICON.ai}</i>`);
  Object.assign(p3.style,{left:(W-tw)/2+'px',top:'32px',width:tw+'px'});
  const p4 = h('div','k-pill',`<i>${K.ICON.az}</i><i>${K.ICON.metronome}</i><i class="lay">${K.ICON.layers}</i><i class="pen">${K.ICON.pen}</i>`);
  Object.assign(p4.style,{left:(W-16-184)+'px',top:'32px',width:'184px',padding:'0 6px'});
  const pg = h('div','k-pager',`<span>Page</span><em>1 / 4</em>`); Object.assign(pg.style,{left:(W/2-100)+'px',top:(H-63)+'px',width:'200px'});
  const nx = h('div','k-pill',`<i>${K.ICON.chevR}</i>`); Object.assign(nx.style,{left:(W/2+110)+'px',top:(H-63)+'px',width:'44px',height:'42px'});
  [p1,p2,p3,p4,pg,nx].forEach(e=>stage.appendChild(e));
  return {pen:p4.querySelector('.pen'), pill:p4};
};

/* page placement in stage points; image is 1300 x 1839 */
K.pageRect = function(W){
  if (W < 1000) return {x:21, y:55, w:792, k:792/1300};
  const w = W - 120; return {x:60, y:70, w, k:w/1300};
};

/* ---------- palette ---------- */
K.palette = function(opts){
  const st = opts.state;   // {tool, color, wi:{}, op:{}}
  const el = h('div','k-pal');
  const glass = h('div','k-glass'), handle = h('div','k-handle');
  const exp = h('div','k-exp'), cmp = h('div','k-cmp');
  el.append(glass, handle, exp, cmp);
  let vertical = false, edge = 'b';
  const api = {el, exp, cmp, handle};

  function artSrc(t){ return K.asset('palette/'+K.ART[t]+(t==='eraser'?'':st.color)+'.svg'); }

  function build(){
    exp.innerHTML = '';
    const ideal = vertical ? K.V : K.H;
    exp.style.width = ideal.w+'px'; exp.style.height = ideal.h+'px';
    const row = h('div','k-row '+(vertical?'v':'h'));
    const ur = h('div','k-ur');
    const un = h('button','k-btn',K.sf('undo')), re = h('button','k-btn',K.sf('redo'));
    un.dataset.k='undo'; re.dataset.k='redo'; un.setAttribute('aria-label',snT('Undo')); re.setAttribute('aria-label',snT('Redo'));
    ur.append(un,re);
    const tools = h('div','k-tools');
    K.TOOLS.forEach(t=>{
      const b = h('button','k-tool'); b.dataset.k='tool'; b.dataset.t=t; b.setAttribute('aria-label',snT({monoline:'Monoline Pen',crayon:'Crayon',highlighter:'Highlighter',eraser:'Eraser'}[t]));
      const clip = h('div','k-clip'); const img = h('img'); img.alt=''; img.draggable=false;
      clip.appendChild(img); b.appendChild(clip);
      if (vertical) clip.style.transform = `rotate(${edge==='l'?90:-90}deg) translateY(${0}px)`;
      if (vertical) clip.style.left = (21 + (edge==='l'?-12:12))+'px';
      const v = h('div','k-val'); b.appendChild(v);
      if (vertical) v.style.left = ((edge==='l'?22:78)-28)+'px';
      tools.appendChild(b);
    });
    const colors = h('div','k-grid k-colors');
    K.INKS.forEach((c,i)=>{ const d=h('button','k-dot',`<b style="background:${c}"></b>`); d.dataset.k='color'; d.dataset.i=i; d.setAttribute('aria-label',snT(K.INK_NAMES[i])); colors.appendChild(d); });
    const acts = h('div','k-grid k-acts');
    [['lasso',K.sf('lasso'),'Lasso Selection'],['shape','','Shapes'],['more',K.svgIcon('PaletteMore',24),'More Tools'],['layers','','Layers and Groups']].forEach(([k,ic,l])=>{
      const a=h('button','k-act '+k,ic); a.dataset.k=k; a.setAttribute('aria-label',snT(l)); acts.appendChild(a);
    });
    acts.append(h('span'),h('span'));
    row.append(ur, tools, colors, acts);
    exp.appendChild(row);
    api.update();
  }

  api.update = function(){
    exp.querySelectorAll('.k-tool').forEach(b=>{
      const t=b.dataset.t, sel = st.tool===t;
      b.classList.toggle('sel', sel);
      const img=b.querySelector('img'), src=artSrc(t);
      if (img.getAttribute('src')!==src) img.src=src;
      img.style.top = (K.OPTICAL[t] + (sel?0:12))+'px';
      const v=b.querySelector('.k-val');
      if (t!=='eraser'){
        const w = K.fmt(K.WIDTHS[t][st.wi[t]]), op = st.op[t];
        const parts = [w]; if (op<0.999) parts.push(Math.round(op*100)+'%');
        if (vertical && edge==='l') parts.reverse();
        v.innerHTML = parts.map(x=>`<span>${x}</span>`).join('');
      }
    });
    exp.querySelectorAll('.k-dot').forEach(d=>d.classList.toggle('sel', +d.dataset.i===st.color));
    exp.querySelectorAll('.k-act').forEach(a=>a.classList.toggle('sel', (a.dataset.k==='lasso'&&st.tool==='lasso')||(a.dataset.k==='shape'&&st.tool==='shape')||(a.dataset.k==='layers'&&st.layersOpen)));
    const kind = st.shapeKind||'rectangle';
    const shp = exp.querySelector('.k-act.shape'), sk = kind+(st.tool==='shape'?'-sel':'');
    if (shp && shp.dataset.ic!==sk){ shp.dataset.ic=sk; shp.innerHTML=K.sf(sk); }
    const lay = exp.querySelector('.k-act.layers'), lk = st.layersOpen?'AppIconLayersActive':'AppIconLayers';
    if (lay && lay.dataset.ic!==lk){ lay.dataset.ic=lk; lay.innerHTML=K.svgIcon(lk, 30.4); }
    // compact artwork
    if (K.TOOLS.includes(st.tool)){
      const src = artSrc(st.tool);
      let img = cmp.querySelector('img');
      if (!img){ cmp.innerHTML='<div class="box"><img alt="" draggable="false"></div>'; img=cmp.querySelector('img'); }
      if (img.getAttribute('src')!==src) img.src=src;
    } else {
      cmp.innerHTML = `<div class="sym">${st.tool==='lasso'?K.sf('lasso'):K.sf((st.shapeKind||'rectangle')+'-sel')}</div>`;
    }
  };

  api.setOrientation = function(e){
    const v = e==='l'||e==='r';
    if (v===vertical && (!v || e===edge) && exp.firstChild){ edge=e; return; }
    vertical=v; edge=e; build();
  };
  /* rect in stage points, c = compact amount 0..1, ps = palette scale */
  api.layout = function(r, c, ps){
    el.style.left=r.x+'px'; el.style.top=r.y+'px'; el.style.width=r.w+'px'; el.style.height=r.h+'px';
    el.style.borderRadius = Math.min(r.w,r.h)/2+'px';
    const ideal = vertical ? K.V : K.H;
    const s = Math.min(r.w/ideal.w, r.h/ideal.h);
    exp.style.transform = `translate(-50%,-50%) scale(${s})`;
    exp.style.opacity = Math.max(0, Math.min(1, 1 - c*1.7));
    exp.style.pointerEvents = c>0.5 ? 'none' : '';
    const cs = Math.min(r.w,r.h)/K.C;
    cmp.style.transform = `translate(-50%,-50%) scale(${cs})`;
    cmp.style.opacity = Math.max(0, Math.min(1, (c-0.35)/0.65));
    const hv = Math.max(0, 1 - c*2.5);
    handle.style.opacity = hv;
    if (vertical){
      handle.style.width='4px'; handle.style.height='32px';
      handle.style.left = (edge==='l' ? 6 : r.w-10)+'px'; handle.style.top=(r.h/2-16)+'px';
    } else {
      handle.style.width='32px'; handle.style.height='4px';
      handle.style.left=(r.w/2-16)+'px'; handle.style.top='6px';
    }
  };
  /* centre of a control, in palette-local design units -> fraction of panel */
  api.anchor = function(sel){
    const n = typeof sel==='string' ? exp.querySelector(sel) : sel;
    if (!n) return null;
    const er = exp.getBoundingClientRect(), nr = n.getBoundingClientRect();
    return {fx:(nr.left+nr.width/2-er.left)/er.width, fy:(nr.top+nr.height/2-er.top)/er.height, top:(nr.top-er.top)/er.height, bottom:(nr.bottom-er.top)/er.height, left:(nr.left-er.left)/er.width, right:(nr.right-er.left)/er.width};
  };
  /* static design-unit position of a control in horizontal layout (no layout needed) */
  api.designPoint = function(kind, i){
    const L=24, T=16;
    if (kind==='undo') return {x:L+22, y:T+50};
    if (kind==='redo') return {x:L+66, y:T+50};
    if (kind==='tool') return {x:L+88+13.5+29+58*i, y:T+50};
    if (kind==='color') return {x:L+88+13.5+232+13.5+25+50*(i%3), y:T+25+50*Math.floor(i/3)};
    if (kind==='act') return {x:L+88+13.5+232+13.5+150+13.5+25+50*(i%3), y:T+25+50*Math.floor(i/3)};
  };
  api.edge = ()=>edge;
  api.vertical = ()=>vertical;
  api.setOrientation('b');
  return api;
};

/* ---------- popovers ---------- */
const CURVE = 'M6.75 1.62C1.62 9.45 .54 20.52 5.4 16.74 11.88 9.45 14.85 7.56 15.12 15.39 14.85 20.79 18.9 22.68 24.84 24.84';
K.settings = function(tool, st, onChange){
  const er = tool==='eraser';
  const p = h('div','k-pop k-set');
  p.style.width = (er?320:264)+'px';
  let html = '';
  if (er) html += `<div class="k-seg"><button data-m="0" class="${st.whole?'':'sel'}">${snT('Partial Strokes')}</button><button data-m="1" class="${st.whole?'sel':''}">${snT('Whole Strokes')}</button></div>`;
  html += `<div class="k-widths ${er?'er':''}">` + K.WIDTHS[tool].map((w,i)=>`<button class="k-w ${st.wi[tool]===i?'sel':''}" data-i="${i}" aria-label="${snT('Preset {i} of {n}, {w} points',{i:i+1,n:K.WIDTHS[tool].length,w})}">${er?`<i style="width:${13+6*i}px;height:${13+6*i}px"></i>`:`<svg viewBox="0 0 27 27"><path d="${CURVE}" fill="none" stroke="currentColor" stroke-width="${i+1}" stroke-linecap="round" stroke-linejoin="round"/></svg>`}</button>`).join('') + '</div>';
  if (!er) html += `<div class="k-op" style="--ink:${K.INKS[st.color]}"><div class="tr"></div><div class="th"></div></div>`;
  html += '<div class="arrow"></div>';
  p.innerHTML = html;
  const th = p.querySelector('.th'), op = p.querySelector('.k-op');
  function syncThumb(){
    if (!th) return;
    const v = st.op[tool], w = 236;
    th.style.left = ((v-0.1)/0.9*(w-36))+'px';
    const c = K.INKS[st.color];
    th.style.background = `color-mix(in srgb, ${c} ${Math.round(v*100)}%, white)`;
  }
  syncThumb();
  p.addEventListener('pointerdown', e=>e.stopPropagation());
  p.querySelectorAll('.k-w').forEach(b=>b.onclick=e=>{
    st.wi[tool]=+b.dataset.i; p.querySelectorAll('.k-w').forEach(x=>x.classList.toggle('sel',x===b)); onChange();
  });
  p.querySelectorAll('.k-seg button').forEach(b=>b.onclick=()=>{
    st.whole = b.dataset.m==='1'; p.querySelectorAll('.k-seg button').forEach(x=>x.classList.toggle('sel',x===b)); onChange();
  });
  if (op){
    const set = e=>{
      const r = op.getBoundingClientRect(); const f = Math.min(1,Math.max(0,(e.clientX-r.left-r.width*18/236)/(r.width*(236-36)/236)));
      st.op[tool] = Math.round((0.1+0.9*f)*100)/100; syncThumb(); onChange();
    };
    op.addEventListener('pointerdown', e=>{ op.setPointerCapture(e.pointerId); set(e); op.onpointermove=set; op.onpointerup=()=>{op.onpointermove=null}; });
  }
  p.syncThumb = syncThumb;
  return p;
};

K.tipIcon = c => `<svg class="tip" viewBox="0 0 16 18"><path d="M8 1.2 13 8v2.4H3V8Z" fill="${c}"/><rect x="3.4" y="11" width="9.2" height="5.8" rx="1.2" fill="#292D38"/></svg>`;
K.layers = function(st, used, onToggle){
  const p = h('div','k-pop k-lay');
  function render(){
    let html = `<div class="seg"><span>${K.ICON.layersFill}${snT('Group 1')}</span><span>${K.ICON.layers}</span><span>${K.ICON.layers}</span></div>`;
    html += `<div class="gt"><i>${K.ICON.editOff}</i><span>${snT('Group 1')}</span><i>${K.ICON.eye}</i></div>`;
    const list = used();
    if (!list.length) html += `<div class="empty">${snT('No annotations yet')}</div>`;
    list.forEach(ci=>{
      const off = st.hidden[ci];
      html += `<div class="ly ${off?'off':''}" data-i="${ci}">${K.tipIcon(K.INKS[ci])}<div class="nm">${snT('{c} Layer',{c:snT(K.INK_NAMES[ci])})}</div><i class="eye" data-i="${ci}" role="button" aria-label="${snT(off?'Show layer':'Hide layer')}">${off?K.ICON.eyeOff:K.ICON.eye}</i><i>${K.ICON.editOff}</i><i class="tr">${K.ICON.trash}</i></div>`;
    });
    html += '<div class="arrow"></div>';
    p.innerHTML = html;
    p.querySelectorAll('.eye').forEach(e=>e.onclick=()=>{ const i=+e.dataset.i; st.hidden[i]=!st.hidden[i]; render(); onToggle&&onToggle(); });
  }
  p.addEventListener('pointerdown', e=>e.stopPropagation());
  p.render = render; render();
  return p;
};

/* ---------- ink rendering ---------- */
function rng(seed){ let s=seed>>>0||1; return ()=>((s=Math.imul(s^(s>>>15),1|s)+0x6D2B79F5|0, s=(s^(s>>>7))>>>0), (s%100000)/100000); }
K.rng = rng;
let grainCanvas = null;
K.grain = function(){
  if (grainCanvas) return grainCanvas;
  const n = 192, c = document.createElement('canvas'); c.width=n; c.height=n;
  const g = c.getContext('2d'), d = g.createImageData(n,n), r = rng(545);
  // paper tooth: horizontal-ish speckle streaks
  const a = new Float32Array(n*n);
  for (let i=0;i<n*n;i++) a[i]=r();
  for (let y=0;y<n;y++) for (let x=0;x<n;x++){
    const v = (a[y*n+x]*0.5 + a[y*n+((x+1)%n)]*0.3 + a[y*n+((x+2)%n)]*0.2);
    let o = 0;
    if (v>0.72) o = 235; else if (v>0.62) o = 150; else if (v>0.55) o = 60;
    d.data[(y*n+x)*4+3] = o;
  }
  g.putImageData(d,0,0); grainCanvas = c; return c;
};
K.pathLen = function(pts){ let L=0; for(let i=1;i<pts.length;i++) L+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]); return L; };
K.cut = function(pts, f){
  if (f>=1) return pts; if (f<=0) return [];
  const L = K.pathLen(pts)*f; let acc=0; const out=[pts[0]];
  for (let i=1;i<pts.length;i++){
    const d = Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);
    if (acc+d>=L){ const t=(L-acc)/(d||1); out.push([pts[i-1][0]+(pts[i][0]-pts[i-1][0])*t, pts[i-1][1]+(pts[i][1]-pts[i-1][1])*t]); return out; }
    acc+=d; out.push(pts[i]);
  }
  return out;
};
function trace(ctx, pts){
  ctx.beginPath(); ctx.moveTo(pts[0][0],pts[0][1]);
  if (pts.length===1){ ctx.lineTo(pts[0][0]+.01,pts[0][1]); return; }
  for (let i=1;i<pts.length-1;i++){
    const mx=(pts[i][0]+pts[i+1][0])/2, my=(pts[i][1]+pts[i+1][1])/2;
    ctx.quadraticCurveTo(pts[i][0],pts[i][1],mx,my);
  }
  const l=pts[pts.length-1]; ctx.lineTo(l[0],l[1]);
}
K.trace = trace;
/* draws one stroke {tool,color,w (stage pts),op,pts,dx,dy}; scratch is a same-size canvas for crayon grain */
K.drawStroke = function(ctx, s, scratch, k, gscale){
  const pts = s.dx||s.dy ? s.pts.map(p=>[p[0]+(s.dx||0),p[1]+(s.dy||0)]) : s.pts;
  if (!pts.length) return;
  ctx.save();
  ctx.lineCap='round'; ctx.lineJoin='round'; ctx.lineWidth=s.w;
  if (s.tool==='eraser'){
    ctx.globalCompositeOperation='destination-out'; ctx.strokeStyle='#000'; trace(ctx,pts); ctx.stroke();
  } else if (s.tool==='crayon' && scratch){
    const sc = scratch.getContext('2d');
    let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9; pts.forEach(p=>{x0=Math.min(x0,p[0]);y0=Math.min(y0,p[1]);x1=Math.max(x1,p[0]);y1=Math.max(y1,p[1]);});
    const pad=s.w+2, bx=Math.max(0,Math.floor((x0-pad)*k)), by=Math.max(0,Math.floor((y0-pad)*k));
    const bw=Math.min(scratch.width,Math.ceil((x1+pad)*k))-bx, bh=Math.min(scratch.height,Math.ceil((y1+pad)*k))-by;
    if (bw<=0||bh<=0){ ctx.restore(); return; }
    sc.setTransform(1,0,0,1,0,0); sc.globalCompositeOperation='source-over'; sc.globalAlpha=1;
    sc.clearRect(bx,by,bw,bh);
    sc.setTransform(k,0,0,k,0,0);
    sc.lineCap='round'; sc.lineJoin='round'; sc.lineWidth=s.w; sc.strokeStyle=K.INKS[s.color];
    trace(sc,pts); sc.stroke();
    sc.globalCompositeOperation='destination-out';
    const pat = sc.createPattern(K.grain(),'repeat');
    const gs = gscale || 0.6;
    pat.setTransform(new DOMMatrix([gs,0,0,gs,0,0]));
    sc.fillStyle = pat; sc.fillRect(bx/k,by/k,bw/k,bh/k);
    ctx.setTransform(1,0,0,1,0,0);
    ctx.globalAlpha = 0.96*(s.op==null?1:s.op);
    ctx.drawImage(scratch,bx,by,bw,bh,bx,by,bw,bh);
  } else {
    ctx.strokeStyle = K.INKS[s.color];
    ctx.globalAlpha = s.op==null?1:s.op;
    if (s.tool==='highlighter'){ ctx.lineCap='butt'; ctx.lineJoin='round'; }
    if (s.tool==='shape'){ ctx.lineJoin='miter'; ctx.beginPath(); const [a,b]=[pts[0],pts[pts.length-1]]; const x=Math.min(a[0],b[0]),y=Math.min(a[1],b[1]),w=Math.abs(b[0]-a[0]),hh=Math.abs(b[1]-a[1]);
      const kind = s.kind||'rectangle';
      if (kind==='ellipse') ctx.ellipse(x+w/2,y+hh/2,w/2,hh/2,0,0,Math.PI*2);
      else if (kind==='line'||kind==='arrow'){ ctx.lineCap='round'; ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]);
        if (kind==='arrow'){ const L=Math.hypot(b[0]-a[0],b[1]-a[1]); if (L>1){ const an=Math.atan2(b[1]-a[1],b[0]-a[0]), bl=Math.min(L/5,34); [an+Math.PI-.49,an+Math.PI+.49].forEach(t=>{ ctx.moveTo(b[0],b[1]); ctx.lineTo(b[0]+Math.cos(t)*bl,b[1]+Math.sin(t)*bl); }); } } }
      else ctx.rect(x,y,w,hh);
      ctx.stroke(); }
    else { trace(ctx,pts); ctx.stroke(); }
  }
  ctx.restore();
};
K.bbox = function(list){
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  list.forEach(s=>s.pts.forEach(p=>{const x=p[0]+(s.dx||0),y=p[1]+(s.dy||0); x0=Math.min(x0,x-s.w/2);y0=Math.min(y0,y-s.w/2);x1=Math.max(x1,x+s.w/2);y1=Math.max(y1,y+s.w/2);}));
  return {x:x0,y:y0,w:x1-x0,h:y1-y0};
};
K.inPoly = function(p, poly){
  let c=false; for(let i=0,j=poly.length-1;i<poly.length;j=i++){
    const [xi,yi]=poly[i],[xj,yj]=poly[j];
    if(((yi>p[1])!==(yj>p[1]))&&(p[0]<(xj-xi)*(p[1]-yi)/(yj-yi)+xi)) c=!c;
  } return c;
};
/* tiny SVG-path sampler: absolute M L C Q only */
K.sample = function(d, tx, ty, sc){
  const tok = d.match(/[MLCQ]|-?[\d.]+/g); const out=[]; let i=0, cx=0, cy=0, cmd='M';
  const P = (x,y)=>[tx+x*sc, ty+y*sc];
  const num = ()=>parseFloat(tok[i++]);
  while(i<tok.length){
    if (/[MLCQ]/.test(tok[i])) cmd=tok[i++];
    if (cmd==='M'){ cx=num(); cy=num(); out.push(P(cx,cy)); cmd='L'; }
    else if (cmd==='L'){ const x=num(),y=num(); for(let t=1;t<=6;t++) out.push(P(cx+(x-cx)*t/6, cy+(y-cy)*t/6)); cx=x;cy=y; }
    else if (cmd==='C'){ const a=num(),b=num(),c=num(),e=num(),x=num(),y=num();
      for(let t=1;t<=14;t++){const u=t/14,m=1-u; out.push(P(m*m*m*cx+3*m*m*u*a+3*m*u*u*c+u*u*u*x, m*m*m*cy+3*m*m*u*b+3*m*u*u*e+u*u*u*y));} cx=x;cy=y; }
    else if (cmd==='Q'){ const a=num(),b=num(),x=num(),y=num();
      for(let t=1;t<=10;t++){const u=t/10,m=1-u; out.push(P(m*m*cx+2*m*u*a+u*u*x, m*m*cy+2*m*u*b+u*u*y));} cx=x;cy=y; }
  }
  return out;
};
/* underdamped spring progress for UIViewPropertyAnimator(duration, dampingRatio) */
K.springAt = function(t, dur, zeta){
  if (t<=0) return 0;
  const w = 2*Math.PI/dur, z = zeta==null?.88:zeta, wd = w*Math.sqrt(1-z*z);
  return 1 - Math.exp(-z*w*t)*(Math.cos(wd*t) + z*w/wd*Math.sin(wd*t));
};
K.reduced = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
})();
/* Board: "Try the crayon". Live replica of the reader with the floating annotation palette. */
(function(){
const K = window.SNSKit, snT = K.snT;
window.SNSims = window.SNSims || {};
const P = '.sns-board';
const WF = 1.33;                       // palette points -> stage points for stroke widths
const PS = 0.787;                      // palette scale measured on the 834pt iPad

SNSims['r13/board-r13'] = function(root, opts){
  opts = opts || {};
  K.injectCSS('sns-board-r13-css', P);
  root.classList.add('sns-board');
  if (getComputedStyle(root).position==='static') root.style.position='relative';
  root.style.overflow='hidden';
  const rr0 = root.getBoundingClientRect();
  const land = rr0.width > rr0.height*1.05;
  const W = land ? 1194 : 834;
  let H = rr0.width && rr0.height ? Math.round(W*rr0.height/rr0.width) : (land?834:1194);

  const stage = K.h('div','k-stage'); root.appendChild(stage);
  const pr = (()=>{ const w = W-48; return {x:24, y:Math.max(16,(H-w*1839/1300)/2), w}; })();   // clean paper card: just the page
  const page = K.h('img','k-page'); page.alt=snT('Mozart, Piano Sonata in C major, K. 545, first page'); page.draggable=false;
  page.src = K.asset('k545-p1.jpg');
  Object.assign(page.style,{left:pr.x+'px',top:pr.y+'px',width:pr.w+'px'});
  page.onload = ()=>root.classList.add('ready');
  stage.appendChild(page);
  // r14 批注 82：Apple Pencil only 那站手指翻到第 2 页再翻回来，第 2 页平时藏在右边
  const page2 = K.h('img','k-page'); page2.alt = ''; page2.draggable = false; page2.src = K.asset('k545-p2.jpg');
  Object.assign(page2.style,{left:pr.x+'px',top:pr.y+'px',width:pr.w+'px',visibility:'hidden'});
  stage.appendChild(page2);
  const ink = K.h('canvas','k-ink'), live = K.h('canvas','k-live'), scratch = document.createElement('canvas');
  const fadeC = K.h('canvas','k-ink');   // r13：图层章点眼睛时，那一种颜色在这里淡出淡入
  fadeC.style.opacity = 0;
  stage.append(ink, fadeC, live);
  const touch = K.h('div','k-touch snd'); Object.assign(touch.style,{opacity:0,transition:'opacity .25s, transform .12s',zIndex:30}); stage.appendChild(touch);
  // r14 批注 83、84：双指手势的第二个圆点；套索选中后的编辑条（照 App SelectionEditorBar：色点、剪切、复制、粘贴、删除）；顶部状态胶囊
  const touch2 = K.h('div','k-touch snd'); Object.assign(touch2.style,{opacity:0,transition:'opacity .25s, transform .12s',zIndex:30}); stage.appendChild(touch2);
  const CLIP_D = '<path d="M15.5 6V3.5C15.5 1.843 14.157.5 12.5.5h-9C1.843.5.5 1.843.5 3.5V17c0 1.657 1.343 3 3 3H8"/><path d="M12 .5l-.171.342C11.321 1.858 10.282 2.5 9.146 2.5H6.854C5.718 2.5 4.679 1.858 4.171.842L4 .5"/><rect x="6" y="6" width="14" height="14" rx="2.5"/>';
  const SEB_ICON = {
    cut: '<svg viewBox="2 3 20 18" width="16.4" height="14.76" fill="none" stroke="currentColor" stroke-width="1.88" stroke-linecap="round" stroke-linejoin="round" style="transform:translateX(.35px)"><circle cx="5.5" cy="6.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><path d="M22 6 8.65 15.98M22 17.97 8.65 7.98"/></svg>',
    copy: '<svg viewBox="1.25 1.2 21.55 21.55" width="18" height="18" fill="currentColor" fill-rule="evenodd" stroke="currentColor" stroke-width=".44" stroke-linejoin="round"><path d="M11.4 22.75H7.6c-4.39 0-6.35-1.96-6.35-6.35v-3.8c0-4.39 1.96-6.35 6.35-6.35h3c.41 0 .75.34.75.75s-.34.75-.75.75h-3c-3.58 0-4.85 1.27-4.85 4.85v3.8c0 3.58 1.27 4.85 4.85 4.85h3.8c3.58 0 4.85-1.27 4.85-4.85v-3c0-.41.34-.75.75-.75s.75.34.75.75v3c0 4.39-1.96 6.35-6.35 6.35Z"/><path d="M17 14.15h-3.2c-2.81 0-3.95-1.14-3.95-3.95V7c0-.3.18-.58.46-.69.28-.12.6-.05.82.16l6.4 6.4c.21.21.28.54.16.82-.11.28-.39.46-.69.46Zm-5.65-5.34v1.39c0 1.99.46 2.45 2.45 2.45h1.39l-3.84-3.84Z"/><path d="M15.6 2.75h-4c-.41 0-.75-.34-.75-.75s.34-.75.75-.75h4c.41 0 .75.34.75.75s-.34.75-.75.75Z"/><path d="M7 5.75c-.41 0-.75-.34-.75-.75 0-2.07 1.68-3.75 3.75-3.75h2.62c.41 0 .75.34.75.75s-.34.75-.75.75H10c-1.24 0-2.25 1.01-2.25 2.25 0 .41-.34.75-.75.75Z"/><path d="M19.19 17.75c-.41 0-.75-.34-.75-.75s.34-.75.75-.75c1.14 0 2.06-.93 2.06-2.06V8c0-.41.34-.75.75-.75s.75.34.75.75v6.19c0 1.96-1.6 3.56-3.56 3.56Z"/><path d="M22 8.75h-3c-2.66 0-3.75-1.09-3.75-3.75V2c0-.3.18-.58.46-.69.28-.12.6-.05.82.16l6 6c.21.21.28.54.16.82-.11.28-.39.46-.69.46Zm-5.25-4.94V5c0 1.83.42 2.25 2.25 2.25h1.19l-3.44-3.44Z"/></svg>',
    paste: `<svg viewBox=".5 .5 19.5 19.5" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.88" stroke-linecap="round" stroke-linejoin="round" style="transform:translate(-.2px,-.15px)">${CLIP_D}</svg>`,
    del: '<svg viewBox="3.75 3.45 16.5 17.1" width="15.4" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 6.5h15"/><path d="M9.5 6.5V4.2h5v2.3"/><path d="m6.3 6.5.9 13.3h9.6l.9-13.3"/><path d="M10.2 10.5v5.8M13.8 10.5v5.8"/></svg>'
  };
  const seb = K.h('div','k-seb off',`<i class="dot"></i><i class="cut">${SEB_ICON.cut}</i><i class="copy">${SEB_ICON.copy}</i><i class="paste off">${SEB_ICON.paste}</i><i class="del">${SEB_ICON.del}</i>`);
  stage.appendChild(seb);
  const PILL = {
    clip: [`<svg viewBox=".5 .5 19.5 19.5" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.05" stroke-linecap="round" stroke-linejoin="round">${CLIP_D}</svg>`, 'Content on clipboard · Tap a location with two fingers to paste'],
    undo: ['<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>', 'Undone']
  };
  const note = K.h('div','k-note off'); note.style.top = '16px'; stage.appendChild(note);
  const pill = name => { if (name){ note.innerHTML = `${PILL[name][0]}<span>${snT(PILL[name][1])}</span>`; note.classList.remove('off'); } else note.classList.add('off'); };

  /* ---------- state ---------- */
  const st = {tool:'crayon', color:2, wi:Object.assign({},K.DEF_W), op:Object.assign({},K.DEF_OP), whole:false, hidden:{}, layersOpen:false, pencilOnly:false, lastInk:'crayon', shapeKind:'rectangle'};
  let strokes = [], undoS = [], redoS = [];
  let sel = null;                      // {ids:Set, box}
  const pal = K.palette({state:st});
  stage.appendChild(pal.el);
  let pl = {compact:false, edge:'b', corner:'bl'};
  let shown = false;   // r13：画笔面板只在画笔章出现
  const reduced = K.reduced();
  const area = ()=>({x:18, y:18, w:W-36, h:H-36});

  /* spring-animated palette geometry */
  const cur = {x:0,y:0,w:0,h:0,c:0,o:1}, vel = {x:0,y:0,w:0,h:0,c:0,o:0}, tgt = {x:0,y:0,w:0,h:0,c:0,o:1};
  let drag = null, raf = 0, lastT = 0;
  function setTarget(snap){
    const f = K.frame(pl, area(), PS);
    Object.assign(tgt, f, {c:pl.compact?1:0, o:shown?1:0});
    if (snap){ Object.assign(cur, tgt); for (const k in vel) vel[k]=0; }
    kick();
  }
  function kick(){ if (!raf){ lastT = performance.now(); raf = requestAnimationFrame(step); } }
  function step(now){
    raf = 0;
    const dt = Math.min(0.034, (now-lastT)/1000); lastT = now;
    const dur = reduced ? 0.1728 : 0.4032, w0 = 2*Math.PI/dur, z = 0.88;
    let moving = false;
    for (const k in tgt){
      if (drag && (k==='x'||k==='y')) continue;
      const a = -w0*w0*(cur[k]-tgt[k]) - 2*z*w0*vel[k];
      vel[k] += a*dt; cur[k] += vel[k]*dt;
      const scale = (k==='c'||k==='o') ? 0.002 : 0.2;
      if (Math.abs(cur[k]-tgt[k])>scale || Math.abs(vel[k])>scale*10) moving = true; else { cur[k]=tgt[k]; vel[k]=0; }
    }
    if (drag){
      cur.x = drag.px - drag.fx*cur.w; cur.y = drag.py - drag.fy*cur.h;
      const a = area(); cur.x = Math.max(a.x-20, Math.min(a.x+a.w-cur.w+20, cur.x)); cur.y = Math.max(a.y-60, Math.min(a.y+a.h-cur.h+60, cur.y));
      moving = true;
    }
    applyPal();
    if (moving) raf = requestAnimationFrame(step);
  }
  function applyPal(){
    pal.layout(cur, cur.c, PS);
    pal.el.style.opacity = cur.o;
    pal.el.style.transform = `scale(${0.9+0.1*cur.o})`;
    pal.el.style.pointerEvents = cur.o<0.5 ? 'none' : '';
    pal.el.style.visibility = cur.o<0.01 ? 'hidden' : '';
    placePop();
  }

  /* ---------- sizing ---------- */
  let k = 1, dpr = 1;
  function resize(){
    const r = root.getBoundingClientRect(); if (!r.width) return;
    const nh = r.height ? Math.round(W*r.height/r.width) : H;
    k = r.width/W; dpr = Math.min(2, window.devicePixelRatio||1);
    if (nh !== H){ H = nh; }
    stage.style.width = W+'px'; stage.style.height = H+'px'; stage.style.transform = `scale(${k})`;
    [ink, fadeC, live, scratch].forEach(c=>{ c.width = Math.round(W*k*dpr); c.height = Math.round(H*k*dpr); });
    [ink, fadeC, live].forEach(c=>{ c.style.width = W+'px'; c.style.height = H+'px'; });
    if (fadeOn) drawSet(fadeC, fadeOn());
    setTarget(true); redraw();
  }
  const ro = new ResizeObserver(resize); ro.observe(root);

  /* ---------- rendering ---------- */
  function ctxOf(c){ const g = c.getContext('2d'); g.setTransform(k*dpr,0,0,k*dpr,0,0); return g; }
  // r13：只画某几笔到一张画布上（淡出淡入用）
  let fadeOn = null;
  function drawSet(c, list){ const g = c.getContext('2d'); g.setTransform(1,0,0,1,0,0); g.clearRect(0,0,c.width,c.height); const gc = ctxOf(c); list.forEach(s=>{ gc.setTransform(k*dpr,0,0,k*dpr,0,0); K.drawStroke(gc, s, scratch, k*dpr); }); }
  function visibleStrokes(){ return strokes.filter(s=>s.tool==='eraser' || !st.hidden[s.color]); }
  function redraw(){
    const g = ink.getContext('2d'); g.setTransform(1,0,0,1,0,0); g.clearRect(0,0,ink.width,ink.height);
    const gc = ctxOf(ink);
    visibleStrokes().forEach(s=>{ gc.setTransform(k*dpr,0,0,k*dpr,0,0); K.drawStroke(gc, s, scratch, k*dpr); });
    drawLive();
  }
  let curStroke = null, lassoPts = null;
  function drawLive(){
    const g = live.getContext('2d'); g.setTransform(1,0,0,1,0,0); g.clearRect(0,0,live.width,live.height);
    const gc = ctxOf(live);
    if (curStroke && curStroke.tool!=='eraser'){
      K.drawStroke(gc, curStroke, scratch, k*dpr);
    }
    if (curStroke && curStroke.tool==='eraser'){
      const p = curStroke.pts[curStroke.pts.length-1];
      gc.setTransform(k*dpr,0,0,k*dpr,0,0);
      gc.beginPath(); gc.arc(p[0],p[1],curStroke.w/2,0,7); gc.strokeStyle='rgba(41,45,56,.45)'; gc.lineWidth=1; gc.stroke();
    }
    if (lassoPts && lassoPts.length>1){
      gc.setTransform(k*dpr,0,0,k*dpr,0,0);
      gc.setLineDash([5,4]); gc.lineWidth=1.5; gc.strokeStyle='rgba(41,45,56,.7)';
      K.trace(gc, lassoPts); gc.stroke(); gc.setLineDash([]);
    }
    if (sel){
      const b = K.bbox(strokes.filter(s=>sel.ids.has(s.id)));
      gc.setTransform(k*dpr,0,0,k*dpr,0,0);
      gc.setLineDash([6,4]); gc.lineWidth=1.5; gc.strokeStyle='rgba(63,82,159,.9)'; gc.fillStyle='rgba(63,82,159,.05)';
      gc.beginPath(); gc.roundRect ? gc.roundRect(b.x-6,b.y-6,b.w+12,b.h+12,8) : gc.rect(b.x-6,b.y-6,b.w+12,b.h+12); gc.fill(); gc.stroke(); gc.setLineDash([]);
      sel.box = {x:b.x-6,y:b.y-6,w:b.w+12,h:b.h+12};
      placeSeb();
    }
  }

  /* ---------- history ---------- */
  function commit(next){ undoS.push(strokes); if (undoS.length>60) undoS.shift(); redoS = []; strokes = next; redraw(); refreshLayers(); }
  function undo(){ if (!undoS.length) return; redoS.push(strokes); strokes = undoS.pop(); sel=null; redraw(); refreshLayers(); }
  function redo(){ if (!redoS.length) return; undoS.push(strokes); strokes = redoS.pop(); sel=null; redraw(); refreshLayers(); }
  let sid = 1;

  /* ---------- auto compact (FloatingPaletteHost: 3 strokes, each within 3 s) ---------- */
  let burst = [];
  function noteStroke(){
    const t = performance.now(); burst = burst.filter(x=>t-x<3000); burst.push(t);
    if (burst.length>=3 && !pl.compact){
      burst = [];
      pl = {compact:true, corner: pl.edge==='t' ? 'tl' : 'bl', edge: pl.edge==='t'?'t':'b'};
      closePops(); setTarget(false);
    }
  }

  /* ---------- drawing on the page ---------- */
  function toStage(e){ const r = stage.getBoundingClientRect(); return [(e.clientX-r.left)/k, (e.clientY-r.top)/k]; }
  stage.addEventListener('pointerdown', e=>{
    if (e.target.closest('.k-pal,.k-pop,.k-pill,.k-pager')) return;
    if (e.button>0) return;
    stopDemo();
    stage.onpointermove=stage.onpointerup=stage.onpointercancel=null;
    if (openPop){ closePops(); return; }
    const p = toStage(e);
    stage.setPointerCapture(e.pointerId);
    const t = st.tool;
    if (sel){
      const b = sel.box;
      if (b && p[0]>=b.x && p[0]<=b.x+b.w && p[1]>=b.y && p[1]<=b.y+b.h){
        const base = strokes; const moved = strokes.map(s=>sel.ids.has(s.id)?Object.assign({},s):s);
        const o = p; undoS.push(base); redoS = []; strokes = moved;
        const mv = ev=>{ const q = toStage(ev); strokes.forEach(s=>{ if (sel.ids.has(s.id)){ const b0 = base.find(x=>x.id===s.id); s.dx=(b0.dx||0)+q[0]-o[0]; s.dy=(b0.dy||0)+q[1]-o[1]; } }); redraw(); };
        stage.onpointermove = mv; stage.onpointerup = stage.onpointercancel = ()=>{ stage.onpointermove=stage.onpointerup=stage.onpointercancel=null; refreshLayers(); };
        return;
      }
      sel = null; drawLive();
      if (t==='lasso'){} else return;
    }
    if (t==='lasso'){
      lassoPts = [p];
      stage.onpointermove = ev=>{ lassoPts.push(toStage(ev)); drawLive(); };
      stage.onpointerup = stage.onpointercancel = ()=>{
        stage.onpointermove=stage.onpointerup=stage.onpointercancel=null;
        const poly = lassoPts; lassoPts = null;
        const ids = new Set(visibleStrokes().filter(s=>s.tool!=='eraser' && s.pts.some(q=>K.inPoly([q[0]+(s.dx||0),q[1]+(s.dy||0)],poly))).map(s=>s.id));
        sel = ids.size ? {ids} : null; drawLive();
      };
      return;
    }
    if (t==='eraser' && st.whole){
      const r = K.WIDTHS.eraser[st.wi.eraser]*WF/2;
      let changed = false; let next = strokes.slice();
      const hit = q=>{ const before = next.length; next = next.filter(s=>s.tool==='eraser' || st.hidden[s.color] || !s.pts.some(a=>Math.hypot(a[0]+(s.dx||0)-q[0],a[1]+(s.dy||0)-q[1])<r+s.w/2)); if (next.length!==before) changed=true; };
      curStroke = {tool:'eraser', w:r*2, pts:[p]}; hit(p); drawLive();
      stage.onpointermove = ev=>{ const q = toStage(ev); curStroke.pts.push(q); hit(q); const keep = changed; if (keep){ const s0=strokes; strokes=next; redraw(); strokes=s0; } else drawLive(); };
      stage.onpointerup = stage.onpointercancel = ()=>{ stage.onpointermove=stage.onpointerup=stage.onpointercancel=null; curStroke=null; if (changed) commit(next); else drawLive(); };
      return;
    }
    const w = t==='shape' ? K.WIDTHS[st.lastInk][st.wi[st.lastInk]]*WF : K.WIDTHS[t][st.wi[t]]*WF;
    curStroke = {id:sid++, tool:t, color:st.color, w, op: t==='eraser'||t==='shape' ? 1 : st.op[t], pts:[p]};
    if (t==='shape'){ curStroke.op = st.op[st.lastInk]; curStroke.kind = st.shapeKind; }
    drawLive();
    stage.onpointermove = ev=>{
      const evs = ev.getCoalescedEvents ? ev.getCoalescedEvents() : [ev];
      evs.forEach(x=>{ const q = toStage(x); const l = curStroke.pts[curStroke.pts.length-1]; if (Math.hypot(q[0]-l[0],q[1]-l[1])>0.6) curStroke.pts.push(q); });
      if (t==='shape') curStroke.pts = [curStroke.pts[0], curStroke.pts[curStroke.pts.length-1]];
      if (t==='eraser'){ const s0 = strokes; strokes = strokes.concat([curStroke]); redraw(); strokes = s0; }
      else drawLive();
    };
    stage.onpointerup = stage.onpointercancel = ()=>{
      stage.onpointermove=stage.onpointerup=stage.onpointercancel=null;
      const s = curStroke; curStroke = null;
      if (s.pts.length===1 && t==='shape'){ drawLive(); return; }
      commit(strokes.concat([s]));
      if (t!=='eraser') noteStroke();
    };
  });

  /* ---------- palette interaction: tap vs drag ---------- */
  let press = null;
  pal.el.addEventListener('pointerdown', e=>{
    if (e.button>0) return;
    e.stopPropagation(); stopDemo();
    const p = toStage(e);
    press = {x:p[0], y:p[1], t:performance.now(), target:e.target.closest('button'), id:e.pointerId, moved:false};
    pal.el.setPointerCapture(e.pointerId);
  });
  pal.el.addEventListener('pointermove', e=>{
    if (!press || e.pointerId!==press.id) return;
    const p = toStage(e);
    if (!press.moved && Math.hypot(p[0]-press.x,p[1]-press.y) > 8){
      press.moved = true; closePops();
      drag = {fx:(press.x-cur.x)/cur.w, fy:(press.y-cur.y)/cur.h, px:p[0], py:p[1]};
      pal.el.classList.add('drag');
      const was = pl;
      setTimeout(()=>{ if (drag){ const cs = K.C*PS; tgt.w = cs; tgt.h = cs; tgt.c = 1; kick(); } }, reduced ? 0 : 120);
      if (was.compact){ tgt.c = 1; }
    }
    if (drag){ drag.px = p[0]; drag.py = p[1]; kick(); }
  });
  const endPress = e=>{
    if (!press || e.pointerId!==press.id) return;
    const pr0 = press; press = null;
    if (drag){
      const cx = cur.x+cur.w/2, cy = cur.y+cur.h/2;
      drag = null; pal.el.classList.remove('drag');
      pl = K.released({x:cx, y:cy}, area(), PS);
      if (!pl.compact) pal.setOrientation(pl.edge);
      setTarget(false);
      return;
    }
    if (pl.compact){
      pl = {compact:false, edge: pl.corner[0]==='t' ? 't' : 'b'};
      pal.setOrientation(pl.edge); setTarget(false);
      return;
    }
    if (pr0.target) tap(pr0.target);
  };
  pal.el.addEventListener('pointerup', endPress);
  pal.el.addEventListener('pointercancel', endPress);

  function tap(b){
    const kd = b.dataset.k;
    if (kd==='undo') return undo();
    if (kd==='redo') return redo();
    if (kd==='tool'){
      const t = b.dataset.t;
      if (st.tool===t){ return togglePop('settings', b); }
      closePops(); st.tool = t; if (t!=='eraser') st.lastInk = t; sel=null; drawLive(); pal.update(); return;
    }
    if (kd==='color'){
      st.color = +b.dataset.i;
      if (st.tool==='eraser' || st.tool==='lasso') st.tool = st.lastInk;
      pal.update(); if (openPop && openPop.kind==='settings') togglePop('settings', pal.exp.querySelector(`.k-tool[data-t="${st.tool}"]`), true);
      return;
    }
    if (kd==='lasso'){ closePops(); st.tool = st.tool==='lasso' ? st.lastInk : 'lasso'; sel=null; drawLive(); pal.update(); return; }
    if (kd==='shape'){ if (st.tool==='shape') return togglePop('shapes', b); closePops(); st.tool = 'shape'; sel=null; drawLive(); pal.update(); return; }
    if (kd==='layers') return togglePop('layers', b);
    if (kd==='more') return togglePop('more', b);
  }

  /* ---------- popovers ---------- */
  let openPop = null;
  function closePops(){
    if (!openPop) return;
    const p = openPop.el; p.classList.add('off'); setTimeout(()=>p.remove(), 260);
    openPop = null; st.layersOpen = false; pal.update();
  }
  function togglePop(kind, anchor, force){
    if (openPop && openPop.kind===kind && openPop.anchor===anchor && !force){ closePops(); return; }
    if (openPop){ const p = openPop.el; p.remove(); openPop = null; }
    let el;
    if (kind==='settings') el = K.settings(st.tool, st, ()=>pal.update());
    else if (kind==='layers'){ el = K.layers(st, usedColors, redraw); st.layersOpen = true; }
    else if (kind==='shapes') el = shapeMenu();
    else el = moreMenu();
    stage.appendChild(el);
    openPop = {kind, anchor, el};
    el.classList.add('off'); placePop();
    requestAnimationFrame(()=>requestAnimationFrame(()=>el.classList.remove('off')));
    pal.update();
  }
  function usedColors(){ const s = new Set(); strokes.forEach(x=>{ if (x.tool!=='eraser') s.add(x.color); }); return [...s].sort((a,b)=>a-b); }
  function refreshLayers(){ if (openPop && openPop.kind==='layers') { openPop.el.render(); placePop(); } }
  function moreMenu(){
    const m = K.h('div','k-pop k-menu');
    m.innerHTML = `<button class="po"><span class="ck">${st.pencilOnly?'✓':''}</span><span class="tx">${snT('Draw Only with Apple Pencil')}</span>${K.sf('applepencil')}</button><div class="arrow"></div>`;
    m.addEventListener('pointerdown', e=>e.stopPropagation());
    m.querySelector('.po').onclick = ()=>{ st.pencilOnly = !st.pencilOnly; closePops(); };
    return m;
  }
  /* AnnotationShape menu: Rectangle, Ellipse, Line, Arrow with their SF Symbols */
  function shapeMenu(){
    const m = K.h('div','k-pop k-menu');
    m.innerHTML = K.SHAPES.map(([k,t])=>`<button data-kind="${k}"><span class="tx">${snT(t)}</span>${K.sf(k)}</button>`).join('') + '<div class="arrow"></div>';
    m.addEventListener('pointerdown', e=>e.stopPropagation());
    m.querySelectorAll('button').forEach(b=>b.onclick=()=>{ st.shapeKind = b.dataset.kind; closePops(); pal.update(); });
    return m;
  }
  function placePop(){
    if (!openPop) return;
    const el = openPop.el, a = openPop.anchor;
    if (!a.isConnected){ closePops(); return; }
    const sr = stage.getBoundingClientRect(), ar = a.getBoundingClientRect();
    const ax = (ar.left+ar.width/2-sr.left)/k, ayT = (ar.top-sr.top)/k, ayB = (ar.bottom-sr.top)/k, axL = (ar.left-sr.left)/k, axR = (ar.right-sr.left)/k;
    const pw = el.offsetWidth, ph = el.offsetHeight, gap = 14;
    const arrow = el.querySelector('.arrow');
    const edge = pl.edge, palR = cur;
    let x, y, ox, oy;
    arrow.style.transform = ''; arrow.style.left = arrow.style.top = arrow.style.right = arrow.style.bottom = '';
    if (edge==='b' || edge==='t'){
      x = Math.max(12, Math.min(W-pw-12, ax-pw/2));
      if (edge==='b'){ y = palR.y - gap - ph; arrow.style.bottom='-11px'; arrow.style.transform='rotate(180deg)'; oy='100%'; }
      else { y = palR.y + palR.h + gap; arrow.style.top='-11px'; oy='0%'; }
      arrow.style.left = (ax-x-11)+'px'; ox = (ax-x)+'px';
    } else {
      y = Math.max(40, Math.min(H-ph-12, (ayT+ayB)/2-ph/2));
      if (edge==='l'){ x = palR.x + palR.w + gap; arrow.style.left='-16px'; arrow.style.transform='rotate(-90deg)'; ox='0%'; }
      else { x = palR.x - gap - pw; arrow.style.right='-16px'; arrow.style.transform='rotate(90deg)'; ox='100%'; }
      arrow.style.top = ((ayT+ayB)/2-y-5.5)+'px'; oy = ((ayT+ayB)/2-y)+'px';
    }
    el.style.left = x+'px'; el.style.top = y+'px';
    el.style.setProperty('--ox', ox); el.style.setProperty('--oy', oy);
  }

  /* ---------- scripted demos for the side list: layers, lasso, shapes ---------- */
  const CANCEL = {};
  let demoTok = null, tp = null;
  const PG = (x,y)=>[pr.x+x*pr.w/1300, pr.y+y*pr.w/1300];          // page pixels -> stage points
  const PK = pr.w/1300;
  // r14 批注 82：整页横滑（照 turns / follow：一页宽加 12 pt 的缝，340 ms），x 是第 1 页往左挪了多少（负数），第 2 页跟着从右边进来
  const SLIDE = W + 12/1.235, SLIDE_MS = 340;
  const slidePage = x => { const t = x ? `translateX(${x}px)` : ''; page.style.transform = ink.style.transform = live.style.transform = t;
    page2.style.visibility = x ? 'visible' : 'hidden'; page2.style.transform = `translateX(${SLIDE+x}px)`; };
  // 编辑条照 App SelectionEditorAnchor：在选中框正下方 14 pt，水平居中
  let sebOn = false;
  const placeSeb = ()=>{ if (!sebOn || !sel || !sel.box) return; const b = sel.box; seb.style.left = (b.x+b.w/2-107)+'px'; seb.style.top = (b.y+b.h+14)+'px'; };
  const showSeb = on => { sebOn = !!on; if (on){ seb.querySelector('.dot').style.setProperty('--c', K.INKS[st.color]); seb.querySelector('.paste').classList.add('off'); placeSeb(); } seb.classList.toggle('off', !on); };
  const ctr = pts => { const b = K.bbox([{pts, w:0}]); return [b.x+b.w/2, b.y+b.h/2]; };
  const PASTE = ()=>PG(711,991);   // 两指轻点的地方：第 16 小节 b″ 上方（和第 14 小节同一个音型，复制的 3 落在这里）
  const DIGIT = {
    1:'M3 2 L5.5 0 L5.5 10',
    2:'M1 3 C1 -0.5 9 -0.5 9 3 C9 6 1 8 1 10 L9.5 10',
    4:'M7 10 L7 0 L1 7 L10 7',
    5:'M9 0 L2.5 0 L1.5 4.5 C4 3.3 9 3.8 9 7 C9 10.6 3 10.8 1 8.8',
    3:'M1 1.2 C4 -1 9 0 8.2 3 C7.6 4.8 4.2 5 4.2 5 C9 5 10.2 9 6.2 10 C4 10.6 2 10.2 1 9'
  };
  const digit = (d, x, y)=>K.sample(DIGIT[d], PG(x,y)[0], PG(x,y)[1], 3.3*PK);
  // r13：四个演示各用一种颜色，画完的样子（瞬间摆好用，和下面演示里画的一致）
  const COLOR = {palette:2, pencil:0, lasso:1, shapes:3, undo:3};   // Blue、Red、Green、Gold；r14 撤销站那一笔用金色，撤掉后不留
  const SLUR = ()=>{ const a = PG(212,336), b = PG(552,336); return Array.from({length:30},(_,i)=>{ const t=i/29; return [a[0]+(b[0]-a[0])*t, a[1]-Math.sin(t*Math.PI)*40*PK]; }); };
  const PENCIL = [[1,436,766],[3,503,762],[5,618,756]];   // r60：底图换成 1878 年旧全集，写在第 11 小节 b′ e″ g″ 上方
  const SHAPES = [['ellipse',[782,342],[894,430]],['rectangle',[746,798],[870,892]]];   // 第 4 小节颤音、第 12 小节
  const SLIP = ()=>Array.from({length:26},(_,i)=>{ const t = i/25; return PG(500+430*t, 1392-70*t-Math.sin(t*Math.PI)*36+Math.sin(t*Math.PI*3)*6); });   // r14 撤销站：第 5 行谱上划错的一笔
  const FIN = {
    palette: ()=>[{tool:'crayon', pts:SLUR()}],
    pencil: ()=>PENCIL.map(([d,x,y])=>({tool:'crayon', pts:digit(d,x,y)})),
    // r14：拖过去的 3，加上两指粘贴落在 PASTE 的那份（中心对准两指中点）
    lasso: ()=>{ const pts = digit(3,96,978), c = ctr(pts), q = PASTE(); return [{tool:'crayon', pts, dx:44*PK, dy:-4*PK}, {tool:'crayon', pts, dx:q[0]-c[0], dy:q[1]-c[1]}]; },
    shapes: ()=>SHAPES.map(([kind,a,b])=>({tool:'shape', kind, pts:[PG(...a),PG(...b)]})),
    undo: ()=>[]
  };
  function put(names){
    stopDemo(); closePops(); sel = null; lassoPts = null;
    strokes = strokes.filter(s=>!names.includes(s.demo));
    for (const n of names) for (const f of FIN[n]()) strokes.push(Object.assign({id:sid++, color:COLOR[n], w:K.WIDTHS.crayon[1]*WF, op:1, demo:n}, f));
    st.wi.crayon = 1; st.tool = 'crayon'; st.lastInk = 'crayon';
    const cn = names.filter(n=>n in COLOR).pop();   // r14：DEMO 里有 COLOR 没登记的站名时，别把颜色设成 undefined（笔图标会去拉 PaletteCrayonundefined.svg）
    if (cn) st.color = COLOR[cn];
    if (names.includes('pencil')) st.pencilOnly = true;
    redraw(); pal.update();
  }
  function placeTouch(){ if (tp){ touch.style.left = tp[0]+'px'; touch.style.top = tp[1]+'px'; } }
  // r13：Apple Pencil only 那段，圆点换成原版那支 Pencil（.snd 的样式带 !important，先摘掉；写完换回圆点）
  function penTip(on){ touch.classList.toggle('pen', on); touch.classList.toggle('snd', !on); }
  function stopDemo(){
    showSeb(false); pill(null); touch2.style.opacity = 0; touch2.style.transform = ''; slidePage(0);
    if (!demoTok) return;
    demoTok.dead = true; demoTok = null;
    touch.style.opacity = 0; touch.style.transform = ''; penTip(false);
    if (curStroke && curStroke.demo) curStroke = null;
    lassoPts = null; drawLive();
  }
  async function runDemo(name){
    stopDemo();
    const tok = demoTok = {dead:false};
    const chk = ()=>{ if (tok.dead) throw CANCEL; };
    const wait = ms => new Promise(r=>setTimeout(r, reduced?0:ms)).then(chk);
    const tween = (ms, fn) => new Promise((res, rej)=>{
      if (reduced){ fn(1); return res(); }
      const t0 = performance.now();
      (function f(now){ if (tok.dead) return rej(CANCEL); const p = Math.min(1,(now-t0)/ms); fn(p); p<1 ? requestAnimationFrame(f) : res(); })(t0);
    });
    const ease = p => p<.5 ? 2*p*p : 1-Math.pow(-2*p+2,2)/2;
    const moveTo = (q, ms)=>{ const a = tp || [q[0]+90, q[1]+160]; touch.style.opacity = 1; return tween(ms||460, p=>{ const e = ease(p); tp = [a[0]+(q[0]-a[0])*e, a[1]+(q[1]-a[1])*e]; placeTouch(); }); };
    const down = ()=>{ if (touch.classList.contains('pen')) return; K.rip(touch); touch.style.transform = 'scale(.75)'; }, up = ()=>{ touch.style.transform = ''; };   // Pencil 落笔不缩、不起涟漪，照原版
    const press = async ()=>{ down(); await wait(120); up(); };
    const center = el => { const sr = stage.getBoundingClientRect(), r = el.getBoundingClientRect(); return [(r.left+r.width/2-sr.left)/k, (r.top+r.height/2-sr.top)/k]; };
    const tapPal = async sel => { const b = pal.exp.querySelector(sel); await moveTo(center(b)); await press(); tap(b); await wait(220); };
    // r14：圆点换成 Pencil（或换回来），先淡出再换，落在 q
    const toPen = async (on, q)=>{ touch.style.opacity = 0; await wait(250); penTip(on); if (q){ tp = q; placeTouch(); } };
    // r14：两根手指（两个圆点）以 q 为中点，从下面一点落进来；轻点一下 = 两个一起缩一下、起涟漪
    const two = (q, dy)=>{ tp = [q[0]-30, q[1]+7+dy]; placeTouch(); touch2.style.left = (q[0]+30)+'px'; touch2.style.top = (q[1]-7+dy)+'px'; };
    const twoIn = async q=>{ two(q, 36); touch.style.opacity = touch2.style.opacity = 1; await tween(420, p=>two(q, 36*(1-ease(p)))); };
    const tapTwo = async ()=>{ K.rip(touch); K.rip(touch2); touch.style.transform = touch2.style.transform = 'scale(.75)'; await wait(110); touch.style.transform = touch2.style.transform = ''; };
    const twoOut = ()=>{ touch.style.opacity = touch2.style.opacity = 0; };
    const ink = async (pts, tool, ms)=>{
      const w = K.WIDTHS[tool][st.wi[tool]]*WF;
      const s = {id:sid++, tool, color:st.color, w, op:st.op[tool], pts:[pts[0]], demo:name};
      await moveTo(pts[0], 380);
      curStroke = s; down();
      await tween(ms, p=>{ s.pts = K.cut(pts, p); if (!s.pts.length) s.pts = [pts[0]]; tp = s.pts[s.pts.length-1]; placeTouch(); drawLive(); });
      up(); s.pts = pts; curStroke = null; commit(strokes.concat([s]));
    };
    try {
      // fresh run: drop this demo's earlier strokes, open the palette
      sel = null; lassoPts = null; closePops();
      if (strokes.some(s=>s.demo===name)){ strokes = strokes.filter(s=>s.demo!==name); redraw(); }
      if (pl.compact || pl.edge!=='b'){ pl = {compact:false, edge:'b'}; pal.setOrientation('b'); setTarget(reduced); await wait(450); }
      tp = null;
      if (name==='palette'){
        // 笔面板：单线笔→蜡笔，画一道连线，再点一次蜡笔打开粗细，点 9 再回 4.5，面板留着
        await tapPal('.k-tool[data-t="monoline"]');
        await tapPal('.k-tool[data-t="crayon"]');
        await tapPal(`.k-dot[data-i="${COLOR.palette}"]`);
        await ink(SLUR(), 'crayon', 800);
        await tapPal('.k-tool[data-t="crayon"]');
        await wait(450);
        for (const i of [3,1]){
          const wb = openPop && openPop.el.querySelector(`.k-w[data-i="${i}"]`);
          if (wb){ await moveTo(center(wb), 420); await press(); wb.click(); await wait(600); }
        }
      } else if (name==='pencil'){
        // r14 批注 82：只认 Apple Pencil：手指在谱上横滑，整页翻到第 2 页、再翻回来，不留墨；然后 Pencil 出来写字
        await tapPal(`.k-dot[data-i="${COLOR.pencil}"]`);   // r13：先点红色
        st.pencilOnly = true;
        const y = PG(0,880)[1], R = pr.x+pr.w*.82, L = pr.x+pr.w*.18, DR = 240;
        const out = p => 1-Math.pow(1-p,3);
        // 手指按住往左一甩，页跟着手走；松手后整页滑过去（照 turns / follow 的 340 ms）
        await moveTo([R,y], 560); down();
        await tween(420, p=>{ const e = p*p; tp = [R-DR*e, y-6*e]; placeTouch(); slidePage(-DR*e); });
        up(); touch.style.opacity = 0;
        await tween(SLIDE_MS, p=>slidePage(-DR-(SLIDE-DR)*out(p)));
        await wait(750);
        // 第 2 页上，手指从左边往右拖，翻回第 1 页
        tp = [L,y]; placeTouch(); touch.style.opacity = 1;
        await wait(300); down();
        await tween(420, p=>{ const e = p*p; tp = [L+DR*e, y-6*e]; placeTouch(); slidePage(-SLIDE+DR*e); });
        up(); touch.style.opacity = 0;
        await tween(SLIDE_MS, p=>slidePage(-(SLIDE-DR)*(1-out(p))));
        slidePage(0);
        await wait(420);
        tp = PG(640,700); placeTouch(); penTip(true);
        for (const [d,x,y] of PENCIL) await ink(digit(d,x,y), 'crayon', 340);   // bar 11: b′ e″ g″
        await wait(500);
      } else if (name==='lasso'){
        // r14 批注 83：Pencil 写个 3，套索圈住、拖一下；选中框下面出 App 的编辑条，点 Copy，顶部提示双指粘贴；两根手指在别处轻点，复制的 3 落在那里
        // r60：3 写在第 14 小节 b″ 上方，拖一下对准音符，再粘到第 16 小节同一个 b″ 上
        await tapPal(`.k-dot[data-i="${COLOR.lasso}"]`);   // r13：先点绿色
        await toPen(true, PG(240,900));                   // 已经开了只认 Pencil，写和圈都用 Pencil
        await ink(digit(3, 96, 978), 'crayon', 420);
        await tapPal('.k-act.lasso');
        const c = PG(113,994), rx = 46*PK, ry = 40*PK;
        const loop = Array.from({length:60},(_,i)=>{ const t = -2.2 + i/59*Math.PI*2.15; const r = 1+0.06*Math.sin(i*.5); return [c[0]+Math.cos(t)*rx*r, c[1]+Math.sin(t)*ry*r]; });
        await moveTo(loop[0], 380);
        lassoPts = [loop[0]]; down();
        await tween(900, p=>{ lassoPts = K.cut(loop, p); if (!lassoPts.length) lassoPts=[loop[0]]; tp = lassoPts[lassoPts.length-1]; placeTouch(); drawLive(); });
        up();
        const poly = loop; lassoPts = null;
        const ids = new Set(visibleStrokes().filter(s=>s.tool!=='eraser' && s.pts.some(q=>K.inPoly([q[0]+(s.dx||0),q[1]+(s.dy||0)],poly))).map(s=>s.id));
        sel = ids.size ? {ids} : null; drawLive();
        if (sel){
          showSeb(true);
          await wait(500);
          await moveTo(c, 380); down();
          const base = strokes; undoS.push(base); redoS = [];
          strokes = strokes.map(s=>sel.ids.has(s.id)?Object.assign({},s):s);
          const D = [44*PK, -4*PK];
          const moved = strokes.filter(s=>sel.ids.has(s.id)).map(s=>[s, s.dx||0, s.dy||0]);
          await tween(700, p=>{ const e = ease(p); moved.forEach(([s,x,y])=>{ s.dx = x+D[0]*e; s.dy = y+D[1]*e; }); tp = [c[0]+D[0]*e, c[1]+D[1]*e]; placeTouch(); redraw(); });
          up(); await wait(450);
          // 编辑条上点 Copy：粘贴键亮起来，顶部出状态胶囊
          const cp = seb.querySelector('.copy');
          await moveTo(center(cp), 460); cp.classList.add('hit'); await press(); await wait(100); cp.classList.remove('hit');
          seb.querySelector('.paste').classList.remove('off'); pill('clip');
          const orig = strokes.filter(s=>sel.ids.has(s.id));
          touch.style.opacity = 0;
          await wait(1100);
          penTip(false);
          // 两根手指在别处轻点一下：复制的笔迹以两指中点为中心落下，选中换成新的那份，编辑条跟过去
          const m = PASTE();
          await twoIn(m);
          await wait(100);
          await tapTwo();
          const c0 = ctr(orig.flatMap(s=>s.pts.map(q=>[q[0]+(s.dx||0), q[1]+(s.dy||0)])));
          const copies = orig.map(s=>Object.assign({}, s, {id:sid++, dx:(s.dx||0)+m[0]-c0[0], dy:(s.dy||0)+m[1]-c0[1]}));
          seb.style.transition = 'none'; seb.classList.add('off'); void seb.offsetWidth; seb.style.transition = '';
          pill(null);
          sel = {ids:new Set(copies.map(s=>s.id))};
          commit(strokes.concat(copies));
          await wait(220);
          twoOut(); seb.classList.remove('off');
          await wait(1200);
        }
        sel = null; showSeb(false); st.tool = st.lastInk; pal.update(); drawLive();
      } else if (name==='shapes'){
        await tapPal(`.k-dot[data-i="${COLOR.shapes}"]`);   // r13：先点金色
        // r14：前面已经开了只认 Pencil，形状和 Lasso、Undo 一样用 Pencil 画
        const sb = center(pal.exp.querySelector('.k-act.shape'));
        await toPen(true, [sb[0]+70, sb[1]-150]);
        await tapPal('.k-act.shape');
        const shapes = SHAPES.map(([kind,a,b])=>[kind, PG(...a), PG(...b)]);
        for (const [kind, a, b] of shapes){
          await tapPal('.k-act.shape');                       // second tap opens the shape menu
          const item = openPop && openPop.el.querySelector(`[data-kind="${kind}"]`);
          if (item){ await moveTo(center(item), 380); await press(); item.click(); await wait(260); }
          const s = {id:sid++, tool:'shape', kind, color:st.color, w:K.WIDTHS[st.lastInk][st.wi[st.lastInk]]*WF, op:st.op[st.lastInk], pts:[a,a], demo:name};
          await moveTo(a, 420); curStroke = s; down();
          await tween(700, p=>{ const e = ease(p); const q = [a[0]+(b[0]-a[0])*e, a[1]+(b[1]-a[1])*e]; s.pts = [a,q]; tp = q; placeTouch(); drawLive(); });
          up(); curStroke = null; commit(strokes.concat([s]));
          await wait(350);
        }
        st.tool = st.lastInk; pal.update();
      } else if (name==='undo'){
        // r14 批注 84：Pencil 随手划了一笔（金色，和形状同一层），两根手指在谱上轻点两下，这一笔撤掉，顶部出 Undone（照 App ReaderHistoryInteraction：2 或 3 指双击撤销）
        st.color = COLOR.undo; st.tool = 'crayon'; st.lastInk = 'crayon'; pal.update();
        tp = PG(600,1300); placeTouch(); penTip(true);
        await ink(SLIP(), 'crayon', 460);
        await wait(500);
        touch.style.opacity = 0; await wait(250); penTip(false);
        await twoIn(PG(820,1228));
        await wait(120);
        await tapTwo(); await wait(90); await tapTwo();
        undo(); pill('undo');
        await wait(350);
        twoOut();
        await wait(1300);
        pill(null);
      }
      touch.style.opacity = 0;
      await wait(250);
      penTip(false);
      if (demoTok===tok) demoTok = null;
      return true;
    } catch(e){
      if (e!==CANCEL) throw e;
      return false;
    }
  }

  /* keyboard: Cmd/Ctrl+Z */
  let fadeT = 0;
  const onKey = e=>{ if (!visibleNow) return; if ((e.metaKey||e.ctrlKey) && e.key.toLowerCase()==='z'){ e.preventDefault(); e.shiftKey ? redo() : undo(); } };
  let visibleNow = true;
  document.addEventListener('keydown', onKey);

  resize();
  return {
    visible(on){ visibleNow = !!on; if (!on){ stopDemo(); closePops(); } },
    demo(name){ return runDemo(name); },
    get busy(){ return !!demoTok; },
    stopDemo,
    // Apple Music 出场时画笔面板退场，谱子和笔迹不动
    pen(on){ on=!!on; if (on===shown) return; shown=on; if (!on){ stopDemo(); closePops(); } setTarget(false); },
    // 往回滚：去掉这些演示画的笔迹，回到干净的面板
    clear(names){ stopDemo(); closePops(); sel = null; st.hidden = {}; st.tool = 'crayon'; st.lastInk = 'crayon'; if (!names || names.includes('pencil')) st.pencilOnly = false;
      strokes = strokes.filter(s=>!s.demo || (names && !names.includes(s.demo))); redraw(); drawLive(); pal.update(); },
    // r13：瞬间摆好这些演示画完的样子（跳站、往回走用）
    put,
    // r13：图层章用，某一种颜色藏起来 / 显示（soft 时淡出淡入）
    setHidden(c, on, soft){
      on = !!on; if (!!st.hidden[c]===on) return;
      const these = ()=>strokes.filter(s=>s.tool!=='eraser' && s.color===c);
      clearTimeout(fadeT); fadeC.style.transition = 'none'; fadeC.style.opacity = 0; fadeOn = null;
      if (!soft || reduced){ if (on) st.hidden[c] = true; else delete st.hidden[c]; redraw(); return; }
      fadeOn = these; drawSet(fadeC, these());
      if (on){ st.hidden[c] = true; redraw(); fadeC.style.opacity = 1; fadeC.offsetWidth; fadeC.style.transition = 'opacity .45s ease'; fadeC.style.opacity = 0;
        fadeT = setTimeout(()=>{ fadeOn = null; }, 470); }
      else { fadeC.offsetWidth; fadeC.style.transition = 'opacity .45s ease'; fadeC.style.opacity = 1;
        fadeT = setTimeout(()=>{ delete st.hidden[c]; redraw(); fadeC.style.transition = 'none'; fadeC.style.opacity = 0; fadeOn = null; }, 470); }
    },
    // r13：切到 Fingering / Stage 组时，Lesson 组的笔迹整体淡出
    hideAll(on, soft){ const t = soft && !reduced ? 'opacity .4s ease' : 'none'; [ink, fadeC].forEach(c=>c.style.transition = t); ink.style.opacity = on ? 0 : 1; if (on) fadeC.style.opacity = 0; },
    get hidden(){ return Object.keys(st.hidden).map(Number); },
    get strokeColors(){ return [...new Set(visibleStrokes().filter(s=>s.tool!=='eraser').map(s=>s.color))].sort(); },
    get demoNames(){ return [...new Set(strokes.filter(s=>s.demo).map(s=>s.demo))]; },
    destroy(){ ro.disconnect(); document.removeEventListener('keydown', onKey); root.innerHTML=''; }
  };
};
})();
