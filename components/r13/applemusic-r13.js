// r11 一张谱用的副本（applemusic.js 不动）：Apple Music 演示拆成三步，每步一个停靠点。
//   beat(n)：无动画摆到第 n 步的终态（0 = ♪ 还没点开）；one(n)：先摆到第 n-1 步终态再只播第 n 步；busy、beatNow、beatFrac 给翻页和进度条读。
//   第 1 步 Recordings：点 ♪ 打开面板 → 列表往上滚 → 点一张录音开始放；
//   第 2 步 Drag it anywhere：拖到右上角吸附 → 点列表键收成竖条 → 把竖条拖到右边中段；
//   第 3 步 Capsule：点 ↖ 收进顶栏胶囊。
// 以下是原 applemusic.js 的说明。
// Apple Music 浮动面板复刻：叠在蜡笔画板同一张谱子上（834pt 宽的 iPad 舞台），只画 Music 自己的组件。
// 照 App 源码 App/Reader/ReaderMusicPanelHost.swift、ReaderMusicPanelPlacement.swift、ReaderMusicPanelLayout.swift、
// ReaderMusicVerticalBar.swift、ReaderMusicCapsuleView.swift、ReaderMusicPanelMetrics.swift：
// - 完整面板 380×520×0.85，列表收起后变竖条（宽 124×画笔面板缩放，高 238+封面）；
// - 按住顶部条拖动，松手按中线分左右，离上/下边 80 以内吸角，其余贴边（竖条停在松手高度），拖动时显示左右两个吸附轮廓；
// - 面板顶边离顶栏按钮底边 12；♪ 是 44 正圆；↖ 收进顶栏胶囊，胶囊只有完整、只封面两档，封面 18 秒转一圈；点胶囊展开。
// 录音和演奏者都是编的，封面是灰色占位，不出声音。
(()=>{
window.SNSims=window.SNSims||{};
const W=834,L=.85,FW=380*L,FH=520*L,PS=.787,SW=Math.round(124*PS),CV=SW-24,SH=238+CV;
const TB=44,M=18,GAP=12,CH=36;
const A='#3F529F',INK='#292D38',SEC='#646A75';
const EZ='cubic-bezier(.2,.85,.25,1)',DUR=.4032;
const CSS=`
.sns-am{position:absolute;inset:0;overflow:hidden;pointer-events:none;user-select:none;-webkit-user-select:none}
.sns-am .st{position:absolute;left:0;top:0;width:${W}px;transform-origin:0 0;
  font-family:"Timeless Sans",-apple-system,BlinkMacSystemFont,"Helvetica Neue",sans-serif;color:${INK};-webkit-font-smoothing:antialiased}
.sns-am *{box-sizing:border-box}
.sns-am svg{fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
.sns-am button{all:unset;cursor:pointer;-webkit-tap-highlight-color:transparent;box-sizing:border-box}
.sns-am .gl{background:rgba(250,249,246,.8);-webkit-backdrop-filter:blur(22px) saturate(1.4);backdrop-filter:blur(22px) saturate(1.4);
  box-shadow:0 0 0 .5px rgba(41,45,56,.08),0 10px 34px rgba(41,45,56,.16),0 1px 3px rgba(41,45,56,.08)}
.sns-am .vis{opacity:0;transition:opacity .35s;pointer-events:none}
.sns-am.on .vis{opacity:1;pointer-events:auto}
/* 顶栏的 ♪ 按钮就是胶囊（ReaderMusicCapsuleView）：面板开着或没在放时是 44 正圆 ♪；
   收起后长成胶囊：完整档 封面 28 在 x4、标题 13/副标题 11 在 x40、右边 40 宽播放键，宽 160–280；放不下只剩封面，宽 36 */
.sns-am .amc{position:absolute;left:${M}px;top:${M}px;height:${TB}px;width:${TB}px;border-radius:${TB/2}px;overflow:hidden;
  transition:width .4s ${EZ},opacity .35s}
.sns-am .amc .op{position:absolute;left:4px;top:4px;height:${CH}px;right:4px}
.sns-am .amc .gly{position:absolute;left:50%;top:50%;width:24px;height:24px;margin:-12px;color:${INK};transition:opacity .2s,color .2s}
.sns-am .amc .gly svg{width:24px;height:24px;stroke-width:1.5}
.sns-am .amc.act .gly{color:${A}}
.sns-am .amc .rc{position:absolute;top:4px;left:4px;width:28px;height:28px;border-radius:50%;display:grid;place-items:center;color:rgba(255,255,255,.75);transition:opacity .2s,left .4s ${EZ}}
.sns-am .amc .rc svg{width:12px;height:12px}
.sns-am .amc .rc::after{content:"";position:absolute;left:50%;top:50%;width:6px;height:6px;margin:-3px;border-radius:50%;background:#F7F6F3}
.sns-am .amc .tx{position:absolute;left:40px;right:46px;top:50%;transform:translateY(-50%);line-height:1.12;transition:opacity .2s}
.sns-am .amc .tx b{display:block;font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sns-am .amc .tx i{display:block;font-style:normal;font-size:11px;color:${SEC};white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sns-am .amc .ln{display:block;height:2px;border-radius:1px;background:rgba(41,45,56,.12);margin-top:2px;overflow:hidden}
.sns-am .amc .ln u{display:block;height:100%;background:${A};width:0}
.sns-am .amc .pp{position:absolute;right:4px;top:4px;width:40px;height:${CH}px;display:grid;place-items:center;transition:opacity .2s}
.sns-am .amc .pp svg{width:15px;height:15px;fill:${INK};stroke:none}
.sns-am .amc.v0 .rc,.sns-am .amc:not(.v2) .tx,.sns-am .amc:not(.v2) .pp,.sns-am .amc:not(.v0) .gly{opacity:0;pointer-events:none}
.sns-am .amc.v1 .rc{left:4px}
/* 吸附轮廓 */
.sns-am .ol{position:absolute;border:1px solid rgba(100,106,117,.25);opacity:0;transition:opacity .2s;pointer-events:none}
.sns-am .ol.up{opacity:1}
.sns-am .ol.act{border:2px solid ${A};background:rgba(63,82,159,.08)}
/* 面板外壳：完整面板和竖条共用，形状只在松手后变 */
.sns-am .pn{position:absolute;overflow:hidden;border-radius:${24*L}px;touch-action:none;
  transition:left ${DUR}s ${EZ},top ${DUR}s ${EZ},width ${DUR}s ${EZ},height ${DUR}s ${EZ},border-radius ${DUR}s ${EZ},opacity .3s}
.sns-am .pn.drag,.sns-am .pn.now{transition:none}
.sns-am .pn.gone{opacity:0;pointer-events:none}
.sns-am.cut,.sns-am.cut *{transition:none!important}
.sns-am .full,.sns-am .bar{position:absolute;left:0;top:0;transition:opacity .16s}
.sns-am .full{width:380px;height:520px;transform:scale(${L});transform-origin:0 0}
.sns-am .bar{width:${SW}px;height:${SH}px}
.sns-am .x{opacity:0;pointer-events:none}
.sns-am .in{transition:opacity .24s .16s}
.sns-am .top{position:absolute;left:0;top:0;width:100%;height:44px;cursor:grab}
.sns-am .grab{position:absolute;left:50%;top:8px;width:32px;height:4px;margin-left:-16px;border-radius:2px;background:rgba(60,60,67,.3)}
.sns-am .col,.sns-am .lb{position:absolute;top:0;width:44px;height:44px;display:grid;place-items:center;color:${SEC};transition:color .2s,transform .12s}
.sns-am .col{left:6px}.sns-am .lb{right:6px}
.sns-am .col svg{width:17px;height:17px;stroke-width:2}
.sns-am .lb svg{width:18px;height:18px;stroke-width:1.9}
.sns-am .cv{flex:none;border-radius:8px;position:relative;overflow:hidden;display:grid;place-items:center;color:rgba(255,255,255,.75)}
.sns-am .cv svg{width:42%;height:42%;stroke-width:1.5}
.sns-am .np{position:absolute;left:16px;right:16px;top:44px;height:70px}
.sns-am .row1{display:flex;align-items:center;height:44px}
.sns-am .np .cv{width:44px;height:44px}
.sns-am .np .tx{flex:1;min-width:0;margin:0 8px 0 12px;line-height:1.15}
.sns-am .np .tx b{display:block;font-size:15px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sns-am .np .tx i{display:block;font-style:normal;font-size:12px;color:${SEC};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px}
.sns-am .tb{width:44px;height:44px;display:grid;place-items:center;color:${INK};flex:none;border-radius:22px;transition:transform .12s}
.sns-am .tb svg{width:17px;height:17px;fill:currentColor;stroke:none}
.sns-am .tb.pl svg{width:22px;height:22px}
.sns-am .tb.dis{color:rgba(41,45,56,.25)}
.sns-am .row2{display:flex;align-items:center;height:20px;margin-top:6px;gap:8px;font-size:11px;color:${SEC};font-variant-numeric:tabular-nums}
.sns-am .prg{flex:1;height:4px;border-radius:2px;background:rgba(41,45,56,.12);overflow:hidden}
.sns-am .prg u{display:block;height:100%;background:${A};width:0}
.sns-am .body{position:absolute;left:0;top:126px;width:380px;height:394px;overflow:hidden}
.sns-am .amp{position:absolute;left:0;top:0;width:100%;height:100%;padding:0 16px;transition:transform .42s ${EZ},opacity .3s}
.sns-am .amp.l{transform:translateX(-30%);opacity:0;pointer-events:none}
.sns-am .amp.r{transform:translateX(100%);pointer-events:none}
.sns-am .sc{position:absolute;left:16px;right:16px;top:0;bottom:0;overflow:hidden;
  -webkit-mask-image:linear-gradient(180deg,#000 calc(100% - 28px),transparent);mask-image:linear-gradient(180deg,#000 calc(100% - 28px),transparent)}
.sns-am .vr{display:flex;align-items:center;height:62px;padding:7px 8px;margin:0 -8px;border-radius:12px;cursor:pointer;transition:background .2s}
.sns-am .vr:hover,.sns-am .vr.hl,.sns-am .mr:hover{background:rgba(41,45,56,.06)}
.sns-am .vr .cv{width:48px;height:48px}
.sns-am .vr .tx{flex:1;min-width:0;margin-left:12px;line-height:1.2}
.sns-am .vr .tx b{display:block;font-size:15px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sns-am .vr .tx i{display:block;font-style:normal;font-size:12px;color:${SEC};margin-top:2px}
.sns-am .chev{width:13px;height:13px;color:${SEC};stroke-width:2.4;flex:none}
.sns-am .wf{display:inline-flex;gap:1.6px;align-items:center;height:13px;width:14px;margin-right:8px;flex:none}
.sns-am .wf i{width:2px;border-radius:1px;background:${A};height:5px}
.sns-am .wf i:nth-child(2){height:11px}.sns-am .wf i:nth-child(3){height:7px}.sns-am .wf i:nth-child(4){height:9px}
.sns-am.anim.play .wf i{animation:sns-am-wf .9s ease-in-out infinite alternate}
.sns-am.anim.play .wf i:nth-child(2){animation-delay:-.3s}.sns-am.anim.play .wf i:nth-child(3){animation-delay:-.6s}.sns-am.anim.play .wf i:nth-child(4){animation-delay:-.15s}
@keyframes sns-am-wf{from{transform:scaleY(.35)}to{transform:scaleY(1)}}
.sns-am .bk{display:flex;align-items:center;gap:4px;height:36px;font-size:15px;cursor:pointer;width:max-content;color:${A}}
.sns-am .bk svg{width:15px;height:15px;stroke-width:2.2}
.sns-am .hd{display:flex;align-items:flex-start;margin-bottom:10px}
.sns-am .hd .cv{width:64px;height:64px;border-radius:10px}
.sns-am .hd .tx{flex:1;margin-left:12px}
.sns-am .hd .tx b{display:block;font:400 17px/1.22 "Timeless Serif",Georgia,serif}
.sns-am .hd .tx i{display:block;font-style:normal;font-size:12px;color:${SEC};margin-top:4px;line-height:1.3}
.sns-am .mr{display:flex;align-items:center;min-height:50px;padding:8px;margin:0 -8px;border-radius:12px;cursor:pointer}
.sns-am .mr .n{width:28px;font-size:13px;color:${SEC};font-variant-numeric:tabular-nums;flex:none;display:flex;align-items:center}
.sns-am .mr .n .wf{margin:0}
.sns-am .mr b{flex:1;font-size:15px;font-weight:400}
.sns-am .mr.cur b{color:${A};font-weight:500}
.sns-am .mr span{font-size:12px;color:${SEC};font-variant-numeric:tabular-nums}
/* 竖条：把手 28、收回、封面、进度、上一首、播放暂停、下一首各一行 */
.sns-am .bar{display:flex;flex-direction:column;align-items:center}
.sns-am .bar .bh{width:100%;height:28px;flex:none;position:relative;cursor:grab}
.sns-am .bar .bh .grab{top:12px}
.sns-am .bar .tb{color:${INK}}
.sns-am .bar .tb.c{color:${SEC}}
.sns-am .bar .tb.c svg{fill:none;stroke:currentColor;width:16px;height:16px;stroke-width:2}
.sns-am .bar .cv{width:${CV}px;height:${CV}px;border-radius:12px;margin-top:4px;cursor:pointer}
.sns-am .bar .prg{flex:none;width:${CV}px;margin:8px 0}
.sns-am .bar .tb svg{width:15px;height:15px}
.sns-am .bar .tb.pl svg{width:22px;height:22px}
/* 演示用的手指 */
.sns-am .fg{left:0;top:0;opacity:0;transition:opacity .2s,transform .12s}
.sns-am .fg.on{opacity:1}.sns-am .fg.dn{transform:scale(.75)}
`;
const svg=(d,vb='0 0 24 24')=>`<svg viewBox="${vb}">${d}</svg>`;
const I={
 upl:svg('<path d="M17 17 7 7M7 15V7h8"/>'),
 list:svg('<path d="M9 6.5h11M9 12h11M9 17.5h11"/><circle cx="4.6" cy="6.5" r=".9" fill="currentColor"/><circle cx="4.6" cy="12" r=".9" fill="currentColor"/><circle cx="4.6" cy="17.5" r=".9" fill="currentColor"/>'),
 play:svg('<path d="M7 4.5v15l12.5-7.5z"/>'),
 pause:svg('<rect x="6" y="4.5" width="4" height="15" rx="1.2"/><rect x="14" y="4.5" width="4" height="15" rx="1.2"/>'),
 prev:svg('<path d="M12 6v12L3.5 12zM21 6v12l-8.5-6z"/>'),
 next:svg('<path d="M3 6v12l8.5-6zM12 6v12l8.5-6z"/>'),
 chevR:svg('<path d="M9.5 6l6 6-6 6"/>'),chevL:svg('<path d="M14.5 6 8.5 12l6 6"/>'),
 note:svg('<path d="M9 17.5V6l10-2v11.5"/><circle cx="6.8" cy="17.5" r="2.3"/><circle cx="16.8" cy="15.5" r="2.3"/>')
};
const GRAYS=['#B9BCC2','#A6AAB2','#C7C9CD','#9A9EA6','#B0B3B9','#C0C2C6'];
const VERS=[{p:'Clara Ruiz',y:2019},{p:'Ingrid Haller',y:1987},{p:'Jonas Lind',y:2008},{p:'Tomás Varga',y:1994},{p:'Mei Okada',y:2002},{p:'Henrik Aalto',y:1972}];
const MOVS=[['I. Allegro',312],['II. Andante',384],['III. Rondo. Allegretto',121]];
const WORK='Piano Sonata No. 16 in C Major, K. 545',COMP='Wolfgang Amadeus Mozart';
const mmss=s=>Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');
const wf='<span class="wf"><i></i><i></i><i></i><i></i></span>';
let injected=false;
const inject=()=>{if(injected||document.querySelector('style[data-sns="r13-am"]'))return;injected=true;const s=document.createElement('style');s.dataset.sns='r13-am';s.textContent=CSS;document.head.appendChild(s)};

SNSims['r13/applemusic-r13']=function(root){
  inject();
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.add('sns-am');
  root.innerHTML=`<div class="st">
   <div class="amc gl vis v0" data-k="cap"><button class="op" data-k="op" aria-label="Apple Music"><span class="gly">${I.note}</span><span class="rc" data-k="rc">${I.note}</span><span class="tx"><b data-k="ct"></b><i data-k="ca"></i><span class="ln"><u data-k="cl"></u></span></span></button><button class="pp" data-k="cpp"></button></div>
   <div class="ol" data-k="olL"></div><div class="ol" data-k="olR"></div>
   <div class="pn gl vis gone" data-k="pn">
    <div class="full" data-k="full">
     <div class="top" data-k="top"><span class="grab"></span><button class="col" data-k="col" aria-label="Collapse">${I.upl}</button><button class="lb" data-k="lb" aria-label="Hide list">${I.list}</button></div>
     <div class="np">
      <div class="row1"><span class="cv" data-k="ncv">${I.note}</span><span class="tx"><b data-k="nt2"></b><i data-k="na"></i></span>
       <button class="tb" data-k="pv">${I.prev}</button><button class="tb pl" data-k="pp"></button><button class="tb" data-k="nx">${I.next}</button></div>
      <div class="row2"><span data-k="el">0:00</span><span class="prg"><u data-k="bu"></u></span><span data-k="rm"></span></div>
     </div>
     <div class="body">
      <div class="amp" data-k="ps"><div class="sc"><div data-k="scin" style="transition:transform .9s ${EZ}">
       ${VERS.map((v,i)=>`<div class="vr" data-v="${i}"><span class="cv" style="background:${GRAYS[i]}">${I.note}</span><span class="tx"><b>${v.p}</b><i>${v.y} · 3 movements</i></span><span data-k="vw${i}"></span>${I.chevR.replace('<svg','<svg class="chev"')}</div>`).join('')}
      </div></div></div>
      <div class="amp r" data-k="pm">
       <div class="bk" data-k="bk">${I.chevL}Recordings</div>
       <div class="hd"><span class="cv" data-k="hcv">${I.note}</span><span class="tx"><b>${WORK}</b><i data-k="hsub"></i></span></div>
       <div data-k="ml"></div>
      </div>
     </div>
    </div>
    <div class="bar x" data-k="bar">
     <div class="bh" data-k="bh"><span class="grab"></span></div>
     <button class="tb c" data-k="bcol" aria-label="Collapse">${I.upl}</button>
     <span class="cv" data-k="bcv" aria-label="Show list">${I.note}</span>
     <span class="prg"><u data-k="bbu"></u></span>
     <button class="tb" data-k="bpv">${I.prev}</button><button class="tb pl" data-k="bpp"></button><button class="tb" data-k="bnx">${I.next}</button>
    </div>
   </div>
   <div class="fg snd" data-k="fg"></div>
  </div>`;
  const $=k=>root.querySelector(`[data-k="${k}"]`);
  const st=root.querySelector('.st'),pn=$('pn'),cap=$('cap'),fg=$('fg'),ols={leading:$('olL'),trailing:$('olR')};

  /* ---------- 几何：舞台 834 宽，高度跟着画框 ---------- */
  let H=1194,k=1;
  const area=()=>{const top=M+TB+GAP;return{x:M,y:top,w:W-2*M,h:H-top-M}};
  let place={side:'leading',dock:'top',fy:0}, listCollapsed=false, open=false, geo=null;
  const size=()=>listCollapsed?{w:SW,h:SH}:{w:FW,h:FH};
  const radius=()=>listCollapsed?SW/2:24*L;
  // ReaderMusicPanelLayout.home
  const home=(p,s)=>{const a=area();const x=p.side==='leading'?a.x:Math.max(a.x,a.x+a.w-s.w);
    const y=p.dock==='top'?a.y:p.dock==='bottom'?a.y+a.h-s.h:a.y+p.fy*Math.max(0,a.h-SH);
    return{x,y:Math.min(Math.max(a.y,a.y+a.h-s.h),Math.max(a.y,y)),w:s.w,h:s.h}};
  // ReaderMusicPanelPlacement.released
  const released=f=>{const a=area();const side=f.x+f.w/2<a.x+a.w/2?'leading':'trailing';
    const nt=f.y<=a.y+80,nb=f.y+f.h>=a.y+a.h-80;
    if(nt&&nb)return{side,dock:f.y-a.y<=a.y+a.h-(f.y+f.h)?'top':'bottom',fy:0};
    if(nt)return{side,dock:'top',fy:0};if(nb)return{side,dock:'bottom',fy:0};
    const tr=a.h-SH;return{side,dock:'middle',fy:tr>0?Math.min(1,Math.max(0,(f.y-a.y)/tr)):0}};
  const capFrame=()=>({x:M,y:M,w:TB,h:TB});   // 面板从 ♪ 长出来、缩回 ♪
  const apply=(f,r)=>{Object.assign(pn.style,{left:f.x+'px',top:f.y+'px',width:f.w+'px',height:f.h+'px',borderRadius:r+'px'})};
  const now=fn=>{pn.classList.add('now');fn();pn.offsetWidth;pn.classList.remove('now')};
  const fit=()=>{const r=root.getBoundingClientRect();if(!r.width)return;k=r.width/W;H=Math.round(W*r.height/r.width)||1194;
    st.style.height=H+'px';st.style.transform=`scale(${k})`;
    if(open&&!drag){geo=home(place,size());now(()=>apply(geo,radius()))}};
  const ro=new ResizeObserver(fit);ro.observe(root);

  /* ---------- 播放状态（编的，不出声） ---------- */
  let ver=0,mov=0,el=84,playing=true,rot=0,raf=0,lastT=0,tick=0;
  const renderTrack=()=>{const v=VERS[ver],m=MOVS[mov];
    ['ncv','hcv','rc','bcv'].forEach(x=>$(x).style.background=GRAYS[ver]);
    $('nt2').textContent=m[0];$('na').textContent=`${v.p} · ${COMP}`;$('ct').textContent=m[0];$('ca').textContent=v.p;$('hsub').textContent=`${v.p} · ${v.y}`;
    $('ml').innerHTML=MOVS.map((x,i)=>`<div class="mr${i===mov?' cur':''}" data-m="${i}"><span class="n">${i===mov?wf:i+1}</span><b>${x[0].replace(/^[IV]+\. /,'')}</b><span>${mmss(x[1])}</span></div>`).join('');
    VERS.forEach((_,i)=>$('vw'+i).innerHTML=i===ver?wf:'');
    ['pv','bpv'].forEach(x=>$(x).classList.toggle('dis',mov===0));['nx','bnx'].forEach(x=>$(x).classList.toggle('dis',mov===MOVS.length-1));
    renderPlay();renderTime();capWidth()};
  const renderPlay=()=>{const ic=playing?I.pause:I.play;['pp','cpp','bpp'].forEach(x=>$(x).innerHTML=ic);root.classList.toggle('play',playing)};
  const renderTime=()=>{const d=MOVS[mov][1],f=Math.min(1,el/d)*100+'%';
    $('el').textContent=mmss(el);$('rm').textContent='−'+mmss(d-el);['bu','cl','bbu'].forEach(x=>$(x).style.width=f)};
  // ReaderMusicCapsuleView：完整档宽 160–280（文字宽 + 86），放不下就只剩 36 的封面
  const capWidth=()=>{const room=W/2-M-8;   // 顶栏左组给胶囊留的宽
    const t=Math.max(textW($('ct').textContent,'500 13px'),textW($('ca').textContent,'11px'));
    const v=open?0:room>=160?2:1,w=v===2?Math.min(room,Math.min(280,Math.max(160,t+86))):CH;
    cap.classList.remove('v0','v1','v2');cap.classList.add('v'+v);cap.classList.toggle('act',open);cap.style.width=(v?w+8:TB)+'px'};
  const cvs=document.createElement('canvas').getContext('2d');
  const textW=(s,font)=>{cvs.font=font+' "Timeless Sans",-apple-system,sans-serif';return cvs.measureText(s).width};
  const setPage=p=>{$('ps').className='amp'+(p==='s'?'':' l');$('pm').className='amp'+(p==='m'?'':' r')};
  const play=(m,v)=>{if(v!=null)ver=v;mov=m;el=0;playing=true;renderTrack()};
  const step=d=>{const m=mov+d;if(m<0||m>=MOVS.length)return;play(m)};
  const frame=t=>{raf=requestAnimationFrame(frame);const dt=lastT?Math.min(.1,(t-lastT)/1000):0;lastT=t;
    if(playing){el+=dt;if(el>=MOVS[mov][1]){if(mov<MOVS.length-1)play(mov+1);else{el=MOVS[mov][1];playing=false;renderPlay()}}
      if(!reduced&&!open)rot=(rot+dt*20)%360;}   // 18 秒一圈
    $('rc').style.transform=`rotate(${rot}deg)`;if((tick=(tick+1)%10)===0)renderTime()};
  const runFrames=v=>{if(v&&!raf){lastT=0;raf=requestAnimationFrame(frame)}else if(!v&&raf){cancelAnimationFrame(raf);raf=0}};

  /* ---------- 形状：完整面板 ↔ 竖条，胶囊 ---------- */
  const showShape=()=>{const v=listCollapsed;$('full').className='full'+(v?' x':' in');$('bar').className='bar'+(v?' in':' x');
    $('lb').setAttribute('aria-label',v?'Show list':'Hide list')};
  const settle=()=>{geo=home(place,size());apply(geo,radius())};
  const setList=c=>{if(c===listCollapsed)return;listCollapsed=c;showShape();settle();say(c?'dock':'list')};
  const present=()=>{if(open)return;open=true;capWidth();
    const c=capFrame();pn.classList.remove('gone');now(()=>apply(c,TB/2));pn.offsetWidth;settle()};
  const collapse=()=>{if(!open)return;open=false;apply(capFrame(),TB/2);pn.classList.add('gone');capWidth();say('capsule')};
  const press=x=>{x.classList.add('hit');setTimeout(()=>x.classList.remove('hit'),140)};

  /* ---------- 拖动：完整面板按住顶条（避开 ↖ 和列表键），竖条只有最上面 28 ---------- */
  let drag=null;
  const outlines=f=>{const t=released(f),s=size();
    for(const side of ['leading','trailing']){const o=ols[side],r=home({...t,side},s);
      Object.assign(o.style,{left:r.x+'px',top:r.y+'px',width:r.w+'px',height:r.h+'px',borderRadius:radius()+'px'});o.classList.toggle('act',t.side===side)}};
  const dragStart=(px,py)=>{drag={ox:geo.x,oy:geo.y,px,py};pn.classList.add('drag');
    Object.values(ols).forEach(o=>o.classList.add("up"));outlines(geo)};
  const dragMove=(px,py)=>{if(!drag)return;const a=area(),s=size();
    const f={x:Math.min(Math.max(a.x,drag.ox+px-drag.px),a.x+a.w-s.w),y:Math.min(Math.max(a.y,drag.oy+py-drag.py),a.y+a.h-s.h),w:s.w,h:s.h};
    geo=f;apply(f,radius());outlines(f)};
  const dragEnd=()=>{if(!drag)return;drag=null;pn.classList.remove('drag');place=released(geo);
    Object.values(ols).forEach(o=>o.classList.remove("up"));settle();say('dock')};
  const pt=e=>{const r=st.getBoundingClientRect();return[(e.clientX-r.left)/k,(e.clientY-r.top)/k]};
  const grab=e=>{if(e.target.closest('button'))return;user();e.preventDefault();pn.setPointerCapture(e.pointerId);dragStart(...pt(e))};
  $('top').addEventListener('pointerdown',grab);$('bh').addEventListener('pointerdown',grab);
  pn.addEventListener('pointermove',e=>{if(drag)dragMove(...pt(e))});
  pn.addEventListener('pointerup',dragEnd);pn.addEventListener('pointercancel',dragEnd);

  /* ---------- 点按 ---------- */
  const user=()=>{if(!touched){touched=true;clearDemo();finger(false);root.querySelectorAll('.vr.hl').forEach(r=>r.classList.remove('hl'));
    root.classList.add('anim');runFrames(true)}};
  let touched=false;
  root.addEventListener('pointerdown',e=>{if(e.target.closest(".vis,.amc"))user()},true);
  $('col').onclick=collapse;$('bcol').onclick=collapse;
  $('lb').onclick=()=>setList(!listCollapsed);$('bcv').onclick=()=>setList(false);
  $('op').onclick=()=>open?collapse():present();
  ['pp','cpp','bpp'].forEach(x=>$(x).onclick=e=>{e.stopPropagation();playing=!playing;renderPlay()});
  $('pv').onclick=$('bpv').onclick=()=>step(-1);$('nx').onclick=$('bnx').onclick=()=>step(1);
  $('ncv').onclick=()=>setPage('m');$('bk').onclick=()=>setPage('s');
  $('ps').addEventListener('click',e=>{const r=e.target.closest('.vr');if(!r)return;const v=+r.dataset.v;if(v!==ver)play(0,v);setPage('m');say('list')});
  $('ml').addEventListener('click',e=>{const r=e.target.closest('.mr');if(r)play(+r.dataset.m)});

  /* ---------- 演示：♪ 打开 → 选录音 → 拖到右上角吸附 → 收列表成竖条拖到右边中段 → ↖ 收成胶囊 ---------- */
  let demoT=[],shown=false;
  const clearDemo=()=>{demoT.forEach(clearTimeout);demoT=[]};
  const at=(ms,f)=>demoT.push(setTimeout(f,ms));
  const say=x=>root.dispatchEvent(new CustomEvent('am-step',{detail:x}));
  const finger=(on,x,y,dn)=>{if(x!=null){fg.style.left=x+'px';fg.style.top=y+'px'}fg.classList.toggle('on',!!on);
    if(dn&&!fg.classList.contains('dn')){fg.classList.remove('rip');void fg.offsetWidth;fg.classList.add('rip')}fg.classList.toggle('dn',!!dn)};   // r13：按下缩小并起涟漪
  const tap=(t,x,y,fn)=>{at(t,()=>finger(true,x,y));at(t+260,()=>finger(true,x,y,true));at(t+400,()=>{finger(true,x,y);fn()});at(t+700,()=>finger(false))};
  const tapAt=(x,y,fn)=>tap(0,x,y,fn);
  // 拖一条路径：手指按住把手，面板跟手，松手吸附
  const glide=(t,dur,hx,hy,tx,ty)=>{at(t,()=>finger(true,geo.x+hx,geo.y+hy));
    at(t+250,()=>{const sx=geo.x+hx,sy=geo.y+hy;finger(true,sx,sy,true);dragStart(sx,sy);const t0=performance.now();
      const mv=n=>{if(!drag)return;const q=Math.min(1,(n-t0)/dur),e=q<.5?2*q*q:1-Math.pow(-2*q+2,2)/2;
        const x=sx+(tx-sx)*e,y=sy+(ty-sy)*e;finger(true,x,y,true);dragMove(x,y);if(q<1)requestAnimationFrame(mv)};requestAnimationFrame(mv)});
    at(t+250+dur+150,()=>{dragEnd();finger(false)})};
  const reset=()=>{clearDemo();finger(false);drag=null;pn.classList.remove('drag');Object.values(ols).forEach(o=>o.classList.remove("up"));
    root.querySelectorAll('.vr.hl').forEach(r=>r.classList.remove('hl'));
    open=false;listCollapsed=false;showShape();place={side:'leading',dock:'top',fy:0};pn.classList.add('gone');
    ver=0;mov=0;el=84;playing=true;rot=0;renderTrack();setPage('s');$('scin').style.transform='';capWidth();now(()=>apply(capFrame(),TB/2))};
  const demo=()=>{
    reset();touched=false;root.classList.add('anim');runFrames(true);
    if(reduced){present();return}
    let t=500;
    tap(t,M+TB/2,M+TB/2,()=>{present();say('list')});
    t+=1500;at(t,()=>$('scin').style.transform='translateY(-40px)');
    t+=900;at(t,()=>tapAt(M+120,area().y+(126+62+31-40)*L,()=>{play(0,1);setPage('m');say('list')}));
    t+=1900;glide(t,1100,FW/2,14,W-M-FW/2+10,area().y+40);                       // 拖到右上角，松手吸附
    t+=2300;at(t,()=>tapAt(geo.x+(380-28)*L,geo.y+22*L,()=>setList(true)));     // 列表键 → 竖条
    t+=1600;glide(t,1000,SW/2,14,W-M-SW/2,area().y+(area().h-SH)*.45+14);        // 竖条贴右边中段
    t+=2200;at(t,()=>tapAt(geo.x+SW/2,geo.y+28+22,()=>{press($('bcol'));collapse()})); // ↖ 收成胶囊
  };
  const rest=()=>{reset();open=false;present();now(settle);root.classList.remove('anim');runFrames(false)};

  /* ---------- r11：三步各自一个停靠点 ---------- */
  // 不带过渡直接摆好：整块加 .cut，改完强制排版一次再拿掉
  const cut=fn=>{root.classList.add('cut');fn();root.offsetWidth;root.classList.remove('cut')};
  const stripEnd=()=>{const a=area();return{x:W-M-SW,y:a.y+(a.h-SH)*.45,w:SW,h:SH}};
  // 第 n 步播完时的样子
  const settleTo=n=>cut(()=>{
    reset();
    if(n>=1){present();settle();$('scin').style.transform='translateY(-40px)';play(0,1);setPage('m')}
    if(n>=2){listCollapsed=true;showShape();place=released(stripEnd());settle()}
    if(n>=3){collapse()}
  });
  // 每步的动作（从这一步开始算的毫秒）和整步时长
  const STEP={
    1:{dur:3900,run(){
      tap(300,M+TB/2,M+TB/2,()=>{present();say('list')});
      at(1800,()=>$('scin').style.transform='translateY(-40px)');
      at(2700,()=>tapAt(M+120,area().y+(126+62+31-40)*L,()=>{play(0,1);setPage('m');say('list')}));}},
    2:{dur:5800,run(){
      glide(300,1100,FW/2,14,W-M-FW/2+10,area().y+40);                          // 拖到右上角，松手吸附
      at(2600,()=>tapAt(geo.x+(380-28)*L,geo.y+22*L,()=>setList(true)));        // 列表键 → 竖条
      glide(3900,1000,SW/2,14,W-M-SW/2,area().y+(area().h-SH)*.45+14);}},       // 竖条贴右边中段
    3:{dur:1500,run(){
      at(300,()=>tapAt(geo.x+SW/2,geo.y+28+22,()=>{press($('bcol'));collapse()}));}}  // ↖ 收成胶囊
  };
  let bn=0,bt0=0,bdur=0,bbusy=0;
  const beat=n=>{n=Math.max(0,Math.min(3,n|0));clearTimeout(bbusy);bbusy=0;touched=false;settleTo(n);bn=n;bt0=performance.now();bdur=0;
    root.classList.add('anim');runFrames(true)};
  const one=n=>{n=Math.max(1,Math.min(3,n|0));if(reduced){beat(n);return}
    beat(n-1);bn=n;bt0=performance.now();bdur=STEP[n].dur;STEP[n].run();
    bbusy=setTimeout(()=>{bbusy=0},bdur)};

  fit();renderTrack();reset();
  return {
    // 切到 Apple Music：♪ 和面板出场；关掉就整套退场，谱子和笔迹在下面不动
    show(on){shown=!!on;root.classList.toggle('on',shown);if(!shown){clearTimeout(bbusy);bbusy=0;bn=0;bdur=0;reset();runFrames(false);root.classList.remove('anim')}},
    run(on){if(!on){this.show(false);return}this.show(true);demo()},
    rest(){this.show(true);rest()},
    beat(n){beat(n)},one(n){one(n)},
    get busy(){return !!bbusy},get beatNow(){return bn},
    get beatFrac(){return bn===0?0:bdur?Math.min(1,(performance.now()-bt0)/bdur):1},
    // 测试用：读当前位置
    state:()=>({place:{...place},geo:{...geo},open,listCollapsed,area:area()}),
    visible(){},
    destroy(){clearDemo();clearTimeout(bbusy);runFrames(false);ro.disconnect();root.innerHTML=''}
  };
};
})();
