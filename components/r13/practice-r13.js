// 一张谱 r13 的练习卡片副本（practice.js 原文件不改）：App 里同一块 280×400pt 面板，原尺寸挂在竖屏 iPad 框（834×1194）谱面的右上角，
// r14：放大 1.1 倍（308×440），和 Apple Music 面板一样只随框缩放，桌面、手机上都占谱框约 37%；谱页是下面 board 画的，这里背景透明。
// 三拍：1 卡片在 Metronome 分段弹出，圆点点开始、点六下加号，拍点随拍闪；2 圆点点 Tuner，指针落到 0；3 圆点点 Reference，从 G3 选到 A4，点 Play tone。
// beat(n, soft) 直接摆第 n 拍终态（0 是卡片收起）；one(n) 先摆第 n−1 拍终态再播第 n 拍；用户一按卡片就停掉脚本。
// 全部演示不出声：没有任何发声代码，也不开麦克风。
(()=>{
window.SNSims=window.SNSims||{};
if(SNSims['r13/practice-r13'])return;
const W=834,H=1194,CW=280,CH=400;
const A='#3F529F',INK='#292D38',SEC='#646A75',MUT='#8A909B';
const CSS=`
.sns-pr13{user-select:none;-webkit-user-select:none;touch-action:manipulation}
.sns-pr13 .st{position:absolute;left:0;top:0;width:${W}px;height:${H}px;transform-origin:0 0;pointer-events:none;
  font-family:"Timeless Sans",-apple-system,BlinkMacSystemFont,"Helvetica Neue",sans-serif;color:${INK};-webkit-font-smoothing:antialiased}
.sns-pr13 svg{fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
.sns-pr13 .card{position:absolute;left:${810-CW}px;top:70px;width:${CW}px;height:${CH}px;border-radius:26px;background:#FCFCFB;
  box-shadow:0 0 0 .5px rgba(41,45,56,.07),0 2px 6px rgba(41,45,56,.05),0 14px 34px rgba(41,45,56,.10);
  transform-origin:100% 0;transform:scale(calc(var(--ps,1)*.86));opacity:0;pointer-events:none;transition:opacity .22s ease,transform .32s cubic-bezier(.2,.8,.2,1)}
.sns-pr13 .card.open{transform:scale(var(--ps,1));opacity:1;pointer-events:auto}
.sns-pr13.now *{transition:none!important}
.sns-pr13 .tab.hit{transform:scale(.96)}
.sns-pr13 .play.hit,.sns-pr13 .tap.hit{transform:scale(.94)}
.sns-pr13 .card *{box-sizing:border-box}
.sns-pr13 button{all:unset;cursor:pointer;-webkit-tap-highlight-color:transparent;box-sizing:border-box}
.sns-pr13 .tabs{position:absolute;left:20px;top:20.5px;width:240px;height:30px;border-radius:15px;background:#ECEDEF;display:flex;padding:0 2px;align-items:center;z-index:2}
.sns-pr13 .tab{flex:1 1 0;height:26px;display:flex;align-items:center;justify-content:center;gap:7px;border-radius:13px;color:${INK};font-size:14px;
  transition:flex-basis .32s cubic-bezier(.2,.7,.2,1),flex-grow .32s cubic-bezier(.2,.7,.2,1),background .2s,color .2s;overflow:hidden;white-space:nowrap}
.sns-pr13 .tab svg{width:19px;height:19px;stroke-width:1.5;flex:none}
.sns-pr13 .tab.sel{flex:0 0 113px;background:#fff;color:${A};box-shadow:0 1px 2px rgba(0,0,0,.05)}
.sns-pr13 .tab{cursor:pointer}.sns-pr13 .tab:not(.sel):hover{background:rgba(255,255,255,.6)}
.sns-pr13 .tab span{display:none}.sns-pr13 .tab.sel span{display:inline}
.sns-pr13 .pane{position:absolute;inset:0;transition:opacity .26s}
.sns-pr13 .pane>*{position:absolute}
.sns-pr13 .pane.hid{opacity:0;pointer-events:none;visibility:hidden;transition:opacity .2s,visibility 0s .2s}
.sns-pr13 .pcap{top:69px;height:30px;border-radius:15px;background:#fff;text-align:center;font-size:14px;line-height:30px;color:${INK};
  box-shadow:0 0 0 .5px rgba(0,0,0,.05),0 3px 10px rgba(41,45,56,.06);transition:transform .15s,background .15s;font-variant-numeric:tabular-nums}
.sns-pr13 .pcap.hit,.sns-pr13 .pcap.open{transform:scale(.97);background:#F1F2F4}
.sns-pr13 .pcap svg{width:12px;height:12px;stroke-width:2;vertical-align:-1px;margin-left:6px;color:${SEC}}
/* metronome */
.sns-pr13 .dots{left:20px;width:240px;top:145px;height:18px}
.sns-pr13 .dot{position:absolute;top:0;width:17.5px;height:17.5px;margin-left:-8.75px;border-radius:50%;background:#E6E7EA;transition:transform .09s ease-out,background .09s,box-shadow .09s}
.sns-pr13 .dot.k1,.sns-pr13 .dot.k2{background:rgba(63,82,159,.12)}
.sns-pr13 .dot.on{background:linear-gradient(180deg,#5366AD,#3F529F);box-shadow:0 0 7.8px rgba(63,82,159,.55)}
.sns-pr13 .step{top:223px;width:33px;height:33px;border-radius:10px;background:#fff;display:grid;place-items:center;color:${INK};
  box-shadow:0 0 0 .5px rgba(0,0,0,.05),0 3px 10px rgba(41,45,56,.07);transition:transform .12s,background .12s}
.sns-pr13 .step.hit{transform:scale(.9);background:#E7EAF3}
.sns-pr13 .step svg{width:16px;height:16px;stroke-width:1.8}
.sns-pr13 .bpm{left:60px;width:160px;top:194px;height:90px;text-align:center;font:300 74px/90px -apple-system,BlinkMacSystemFont,"SF Pro Display","Helvetica Neue",sans-serif;
  letter-spacing:-1px;font-variant-numeric:tabular-nums}
.sns-pr13 .unit{left:0;width:280px;top:283px;text-align:center;font-size:12px}
.sns-pr13 .track{left:20px;top:337px;width:131px;height:31px;border-radius:15.5px;background:#EEEFF1}
.sns-pr13 .tg{top:337px;width:31px;height:31px;display:grid;place-items:center;color:${INK}}
.sns-pr13 .tg svg{width:19px;height:19px}
.sns-pr13 .play{left:20px;top:328px;width:51.5px;height:47.3px;border-radius:23.6px;background:#fff;display:grid;place-items:center;color:#111;
  box-shadow:0 0 0 .5px rgba(0,0,0,.05),0 4px 14px rgba(41,45,56,.10);transition:background .18s,transform .12s}
.sns-pr13 .play svg{width:17px;height:17px;fill:currentColor;stroke:none}
.sns-pr13 .play.run{background:linear-gradient(180deg,#5366AD,#3F529F);color:#fff;box-shadow:0 4px 14px rgba(63,82,159,.35)}
.sns-pr13 .tap{left:165px;top:328px;width:95px;height:47.3px;border-radius:23.6px;background:#fff;text-align:center;line-height:47.3px;font-size:15px;
  box-shadow:0 0 0 .5px rgba(0,0,0,.05),0 4px 14px rgba(41,45,56,.10)}
/* tuner */
.sns-pr13 .pm{left:171.5px;width:88.5px;display:flex}
.sns-pr13 .pm span{flex:1;display:grid;place-items:center}
.sns-pr13 .pm svg{width:15px;height:15px;stroke-width:1.8;margin:0;color:${INK}}
.sns-pr13 .pm i{width:1px;height:12px;background:rgba(41,45,56,.14);align-self:center}
.sns-pr13 .note{left:0;width:280px;top:122px;height:78px;text-align:center;font:300 72.8px/78px -apple-system,BlinkMacSystemFont,"SF Pro Display","Helvetica Neue",sans-serif;white-space:nowrap}
.sns-pr13 .note sub,.sns-pr13 .rp sub{font-size:31.2px;vertical-align:baseline;margin-left:2px;font-weight:300}
.sns-pr13 .freq{left:0;width:280px;top:199px;text-align:center;font-size:16px;color:${SEC};font-variant-numeric:tabular-nums}
.sns-pr13 .stat{left:0;width:280px;top:233px;text-align:center;font-size:14px;color:${SEC};transition:color .2s}
.sns-pr13 .stat.ok{color:${A}}
.sns-pr13 .scale{left:29.5px;width:221px;top:265px;height:26px}
.sns-pr13 .scale .tr{position:absolute;left:0;right:0;top:11.7px;height:2.6px;border-radius:1.3px;background:rgba(41,45,56,.14)}
.sns-pr13 .scale .tk{position:absolute;top:7.8px;width:1.3px;height:10.4px;margin-left:-.65px;background:rgba(100,106,117,.5)}
.sns-pr13 .scale .tk.c{top:3.25px;width:2.6px;height:19.5px;margin-left:-1.3px;background:rgba(63,82,159,.65)}
.sns-pr13 .ndl{position:absolute;top:0;left:110.5px;width:5.2px;height:26px;margin-left:-2.6px;border-radius:2.6px;background:linear-gradient(180deg,#5366AD,#3F529F);box-shadow:0 1px 5px rgba(63,82,159,.45)}
.sns-pr13 .cents{left:0;width:280px;top:294px;text-align:center;font-size:14px;font-weight:500;font-variant-numeric:tabular-nums}
.sns-pr13 .pbig{left:20px;top:329px;width:240px;height:46.8px;border-radius:23.4px;background:rgba(63,82,159,.13);color:${A};display:flex;align-items:center;justify-content:center;gap:12px;font-size:16px;
  transition:background .2s,color .2s,transform .12s}
.sns-pr13 .pbig.hit{transform:scale(.96)}
.sns-pr13 .pbig svg{width:19px;height:19px}
.sns-pr13 .pbig .sq{width:16px;height:16px;border-radius:2.5px;background:${A}}
.sns-pr13 .pbig.fill{background:linear-gradient(180deg,#5366AD,#3F529F);color:#fff;box-shadow:0 4px 14px rgba(63,82,159,.3)}
.sns-pr13 .pbig.fill .sq{background:#fff}
/* reference */
.sns-pr13 .rp{left:0;width:280px;top:136px;height:76px;text-align:center;font:300 66.3px/76px -apple-system,BlinkMacSystemFont,"SF Pro Display","Helvetica Neue",sans-serif;color:${A};white-space:nowrap}
.sns-pr13 .rf{left:0;width:280px;top:214px;text-align:center;font-size:16px;color:${MUT};font-variant-numeric:tabular-nums}
.sns-pr13 .cal{left:40px;top:255px;width:200px;height:30px;border-radius:15px;background:#EEEFF1;display:flex;align-items:center}
.sns-pr13 .cal span{width:41.6px;height:30px;display:grid;place-items:center}
.sns-pr13 .cal svg{width:14px;height:14px;stroke-width:1.8}
.sns-pr13 .cal b{flex:1;text-align:center;font-size:14px;font-weight:400;font-variant-numeric:tabular-nums}
.sns-pr13 .wave{left:0;width:280px;top:174px;height:0;pointer-events:none}
.sns-pr13 .wave i{position:absolute;left:140px;top:0;width:110px;height:110px;margin:-55px 0 0 -55px;border-radius:50%;border:1.5px solid rgba(63,82,159,.35);opacity:0}
.sns-pr13 .wave.on i{animation:sns-pr13-ring 1.8s ease-out infinite}
.sns-pr13 .wave.on i:nth-child(2){animation-delay:.6s}.sns-pr13 .wave.on i:nth-child(3){animation-delay:1.2s}
@keyframes sns-pr13-ring{from{opacity:.8;transform:scale(.6)}to{opacity:0;transform:scale(1.6)}}
.sns-pr13 .menu{position:absolute;top:104px;width:120px;border-radius:14px;background:rgba(255,255,255,.98);padding:6px 0;z-index:4;
  box-shadow:0 0 0 .5px rgba(0,0,0,.08),0 12px 36px rgba(41,45,56,.18);transform-origin:50% 0;animation:sns-pr13-pop .18s ease-out}
.sns-pr13 .menu div{display:flex;height:30px;align-items:center;padding:0 14px 0 32px;font-size:14px;position:relative}
.sns-pr13 .menu div.cur::before{content:"";position:absolute;left:13px;top:10px;width:9px;height:5px;border-left:1.8px solid ${A};border-bottom:1.8px solid ${A};transform:rotate(-45deg)}
@keyframes sns-pr13-pop{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:none}}
`;
const svg=d=>`<svg viewBox="0 0 24 24">${d}</svg>`;
const I={
 metro:svg('<path d="M9.5 4h5l4 16h-13z"/><path d="M12 15l5-8"/>'),
 fork:svg('<g transform="rotate(38 12 12)"><path d="M9.3 2.5v7.2a2.7 2.7 0 0 0 5.4 0V2.5M12 12.4v9.4"/></g>'),
 ear:svg('<path d="M7 9.5a5 5 0 0 1 10 0c0 2.8-2.6 3.8-3 6.2-.3 1.8-1.4 3.3-3.3 3.3A2.7 2.7 0 0 1 8 16.5"/><path d="M10 10a2 2 0 0 1 4 0c0 1.2-1.2 1.6-1.6 2.5"/>'),
 minus:svg('<path d="M5.5 12h13"/>'),plus:svg('<path d="M5.5 12h13M12 5.5v13"/>'),chev:svg('<path d="M6 9l6 6 6-6"/>'),
 play:svg('<path d="M7 4.5v15l12.5-7.5z"/>'),pause:svg('<rect x="6" y="4.5" width="4" height="15" rx="1.2"/><rect x="14" y="4.5" width="4" height="15" rx="1.2"/>'),
 tplay:svg('<path d="M7 4.5v15l12.5-7.5z" fill="currentColor" stroke="none"/>'),
 spk:svg('<path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z" fill="currentColor"/><path d="M15.5 9.3a3.8 3.8 0 0 1 0 5.4M18 7a7 7 0 0 1 0 10"/>'),
 eye:svg('<path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.6" fill="currentColor"/>'),
};
const NAMES=['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];
const TERMS=[['Grave',30,39],['Largo',40,59],['Larghetto',60,65],['Adagio',66,75],['Andante',76,87],['Moderato',88,111],['Allegretto',112,119],['Allegro',120,155],['Vivace',156,175],['Presto',176,199],['Prestissimo',200,300]];
const termOf=b=>TERMS.find(t=>b>=t[1]&&b<=t[2])[0];
const ACC=[2,0,1,0],SCALE=[1.12,1.25,1.45];
const inject=()=>{if(document.querySelector('style[data-sns="r13-practice"]'))return;const s=document.createElement('style');s.dataset.sns='r13-practice';s.textContent=CSS;document.head.appendChild(s)};

SNSims['r13/practice-r13']=function(root){
  inject();
  const RM=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
  root.classList.add('sns-pr13');
  if(getComputedStyle(root).position==='static')root.style.position='relative';
  root.innerHTML=`<div class="st"><div class="card">
   <div class="tabs" role="tablist">
    <button class="tab sel" data-t="1" role="tab" aria-label="Metronome">${I.metro}<span>Metronome</span></button>
    <button class="tab" data-t="2" role="tab" aria-label="Tuner">${I.fork}<span>Tuner</span></button>
    <button class="tab" data-t="3" role="tab" aria-label="Reference">${I.ear}<span>Reference</span></button>
   </div>
   <div class="pane" data-p="1">
    <div class="pcap" style="left:20px;width:115.5px">4/4</div>
    <div class="pcap" data-k="term" style="left:144.5px;width:115.5px">Moderato</div>
    <div class="dots" data-k="dots">${ACC.map((v,i)=>`<i class="dot k${v}" style="left:${120-53.5*1.5+53.5*i}px"></i>`).join('')}</div>
    <div class="step" data-k="minus" style="left:21px">${I.minus}</div>
    <div class="bpm" data-k="bpm">90</div>
    <div class="step" data-k="plus" style="left:226px">${I.plus}</div>
    <div class="unit">♩ · BPM</div>
    <div class="track"></div>
    <div class="tg" style="left:83px">${I.spk}</div><div class="tg" style="left:117px">${I.eye}</div>
    <div class="play" data-k="play">${I.play}</div>
    <div class="tap">TAP</div>
   </div>
   <div class="pane hid" data-p="2">
    <div class="pcap" style="left:20px;width:139.5px">A4 = 440 Hz</div>
    <div class="pcap pm"><span>${I.minus}</span><i></i><span>${I.plus}</span></div>
    <div class="note">A<sub>4</sub></div>
    <div class="freq" data-k="freq"></div>
    <div class="stat" data-k="stat"></div>
    <div class="scale"><i class="tr"></i>${[-2,-1,0,1,2].map(i=>`<i class="tk${i?'':' c'}" style="left:${110.5+i*54.6}px"></i>`).join('')}<i class="ndl" data-k="ndl"></i></div>
    <div class="cents" data-k="cents"></div>
    <div class="pbig"><i class="sq"></i>Stop</div>
   </div>
   <div class="pane hid" data-p="3">
    <div class="pcap" data-k="rn" style="left:20px;width:115.5px"></div>
    <div class="pcap" data-k="ro" style="left:144.5px;width:115.5px"></div>
    <div class="wave" data-k="wave"><i></i><i></i><i></i></div>
    <div class="rp" data-k="rp"></div>
    <div class="rf" data-k="rf"></div>
    <div class="cal"><span>${I.minus}</span><b>A4 = 440 Hz</b><span>${I.plus}</span></div>
    <div class="pbig" data-k="tone"></div>
   </div>
  </div><div class="snd"></div></div>`;
  const $=k=>root.querySelector(`[data-k="${k}"]`);
  const st=root.querySelector('.st'),card=root.querySelector('.card'),tabs=[...root.querySelectorAll('.tab')],panes=[...root.querySelectorAll('.pane')];
  const touch=root.querySelector('.snd');
  Object.assign(touch.style,{opacity:0,transition:'opacity .25s, transform .12s'});

  // 舞台 834×1194 按框宽缩放；卡片挂右上，固定放大 1.1 倍，大小跟 Apple Music 面板（323×442）相当
  let s=1;
  const fit=()=>{const w=root.clientWidth;if(!w)return;s=w/W;st.style.transform=`scale(${s})`;card.style.setProperty('--ps',1.1)};
  fit();const ro=new ResizeObserver(fit);ro.observe(root);

  let on=true,cur=0,pick=null,pane=1;
  const hit=el=>{el.classList.add('hit');setTimeout(()=>el.classList.remove('hit'),130)};
  // 切分段；离开节拍器就停拍点，回到节拍器且在走就接着闪
  const show=n=>{const t=Math.max(1,n);pane=t;tabs.forEach(b=>{const v=+b.dataset.t===t;b.classList.toggle('sel',v);b.setAttribute('aria-selected',v)});panes.forEach(p=>p.classList.toggle('hid',+p.dataset.p!==t));
    if(t!==1)stopTick();else if(running)startTick()};

  // 节拍器：只有画面，没有拍子声
  let bpm=90,running=false,bi=-1,next=0,tick=0;
  const renderM=()=>{$('bpm').textContent=bpm;$('term').textContent=termOf(bpm);const p=$('play');p.classList.toggle('run',running);p.innerHTML=running?I.pause:I.play};
  const clearDots=()=>{bi=-1;$('dots').querySelectorAll('.dot').forEach(d=>{d.classList.remove('on');d.style.transform=''})};
  const fire=()=>{bi=(bi+1)%4;$('dots').querySelectorAll('.dot').forEach((d,i)=>{const a=i===bi;d.classList.toggle('on',a);d.style.transform=a&&!RM?`scale(${SCALE[ACC[bi]]})`:''})};
  const loop=()=>{fire();next+=60000/bpm;tick=setTimeout(loop,Math.max(0,next-performance.now()))};
  const startTick=()=>{if(tick||!on||pane!==1)return;if(RM){clearDots();bi=0;$('dots').firstChild.classList.add('on');return}bi=-1;next=performance.now();loop()};
  function stopTick(){clearTimeout(tick);tick=0}
  const setRun=v=>{running=v;renderM();if(v)startTick();else{stopTick();clearDots()}};

  // 调音器：A4 先偏低，指针来回收进 In tune 后停住
  let raf=0;
  const renderT=c=>{const rc=Math.round(c);
    $('freq').textContent=(440*Math.pow(2,c/1200)).toFixed(1)+' Hz';
    const ok=Math.abs(rc)<=5;$('stat').textContent=ok?'In tune':rc<0?'Flat':'Sharp';$('stat').classList.toggle('ok',ok);
    $('cents').textContent=(rc>0?'+':rc<0?'−':'±')+Math.abs(rc)+' cents';
    $('ndl').style.transform=`translateX(${Math.max(-50,Math.min(50,c))*2.184}px)`};
  const tunerPlay=()=>{cancelAnimationFrame(raf);renderT(-27);const t0=performance.now()+250;
    const f=now=>{const t=Math.max(0,(now-t0)/1000);if(t>3.4){renderT(0);raf=0;return}
      renderT(-27*Math.exp(-t*1.35)*Math.cos(t*2.7)+Math.sin(now/170)*Math.max(0,1-t/3.2));raf=requestAnimationFrame(f)};
    raf=requestAnimationFrame(f)};

  // 标准音：从 G3 选到 A、4，按 Play tone，波纹表示正在响（网页上不出声）
  let rN=9,rO=4,toneOn=false,menu=null;
  const renderR=()=>{$('rn').innerHTML=NAMES[rN]+I.chev;$('ro').innerHTML=rO+I.chev;$('rp').innerHTML=`${NAMES[rN]}<sub>${rO}</sub>`;
    $('rf').textContent=(440*Math.pow(2,((rO+1)*12+rN-69)/12)).toFixed(2)+' Hz';
    const b=$('tone');b.classList.toggle('fill',toneOn);b.innerHTML=toneOn?'<i class="sq"></i>Stop tone':I.tplay+'Play tone';$('wave').classList.toggle('on',toneOn&&!RM)};
  function closeMenu(){if(menu){menu.remove();menu=null;root.querySelectorAll('.pcap.open').forEach(c=>c.classList.remove('open'))}}
  const openMenu=(k,items,sel)=>{closeMenu();menu=document.createElement('div');menu.className='menu';menu.style.left=k==='rn'?'18px':'142px';$(k).classList.add('open');
    menu.innerHTML=items.map(v=>`<div class="${v===sel?'cur':''}">${v}</div>`).join('');panes[2].appendChild(menu);return menu};

  /* ---------- 每一拍的终态 ---------- */
  // 0 卡片收起；1 节拍器 96 在走；2 调音器停在 0；3 标准音 A4 在响。还没播到的分段停在播之前的样子（标准音 G3、没响）
  function stateAt(n){
    card.classList.toggle('open',n>=1);
    bpm=n>=1?96:90;
    renderT(n>=2?0:-27);
    if(n>=3){rN=9;rO=4;toneOn=true}else{rN=7;rO=3;toneOn=false}
    renderR();
    show(n);
    setRun(n===1);
  }

  /* ---------- 脚本 ---------- */
  const CANCEL={};
  const DUR=[0,5100,5600,7650];
  let tok=null,t0=0,done=true,tp=null,down=false;
  const center=el=>{const sr=st.getBoundingClientRect(),r=el.getBoundingClientRect(),k=sr.width/W||1;return[(r.left+r.width/2-sr.left)/k,(r.top+r.height/2-sr.top)/k]};
  const place=()=>{if(!tp)return;touch.style.left=tp[0]+'px';touch.style.top=tp[1]+'px';touch.style.transform=down?'scale(.75)':''};
  const rip=()=>{touch.classList.remove('rip');void touch.offsetWidth;touch.classList.add('rip')};
  async function run(n,t){
    const chk=()=>{if(t.dead)throw CANCEL};
    const wait=ms=>new Promise(r=>setTimeout(r,ms)).then(chk);
    const ease=p=>p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2;
    const tween=(ms,fn)=>new Promise((res,rej)=>{const a=performance.now();
      (function f(now){if(t.dead)return rej(CANCEL);const p=Math.min(1,(now-a)/ms);fn(p);p<1?requestAnimationFrame(f):res()})(a)});
    const moveTo=(el,ms)=>{const q=center(el);const a=tp||[q[0]-70,q[1]+150];if(!tp){tp=a;place()}touch.style.opacity=1;
      return tween(ms||480,p=>{const e=ease(p);tp=[a[0]+(q[0]-a[0])*e,a[1]+(q[1]-a[1])*e];place()})};
    const press=async el=>{down=true;place();rip();if(el)hit(el);await wait(130);down=false;place()};
    const tapOn=async(el,fn,ms)=>{await moveTo(el,ms);await press(el);fn&&fn()};
    const fade=async()=>{await wait(700);touch.style.opacity=0;await wait(300)};
    if(n===1){
      await wait(150);
      card.classList.add('open');
      await wait(650);
      await tapOn($('play'),()=>setRun(true),520);
      await wait(900);
      await moveTo($('plus'),560);
      for(let i=0;i<6;i++){await press($('plus'));bpm++;renderM();await wait(60)}
      await fade();
    }else if(n===2){
      await wait(200);
      await tapOn(tabs[1],()=>{show(2);setRun(false);tunerPlay()},560);
      await wait(3700);
      await fade();
    }else if(n===3){
      await wait(200);
      await tapOn(tabs[2],()=>show(3),520);
      await wait(550);
      await tapOn($('rn'),()=>openMenu('rn',['F','F♯','G','A♭','A','B♭','B'],'G'),480);
      await wait(380);
      await tapOn(menu.children[4],()=>{menu.children[2].classList.remove('cur');menu.children[4].classList.add('cur')},420);
      await wait(200);
      rN=9;renderR();closeMenu();
      await wait(300);
      await tapOn($('ro'),()=>openMenu('ro',['2','3','4','5','6'],'3'),420);
      await wait(380);
      await tapOn(menu.children[2],()=>{menu.children[1].classList.remove('cur');menu.children[2].classList.add('cur')},380);
      await wait(200);
      rO=4;renderR();closeMenu();
      await wait(350);
      await tapOn($('tone'),()=>{toneOn=true;renderR()},500);
      await wait(500);
      await fade();
    }
  }
  // 停脚本：清计时器、收圆点；调音器指针自己的回落动画留着
  function stop(){if(tok){tok.dead=true;tok=null}done=true;touch.style.opacity=0;down=false;tp=null;touch.style.transform=''}
  function snap(n,soft){
    stop();cancelAnimationFrame(raf);raf=0;closeMenu();
    const instant=!soft||RM;
    if(instant){root.classList.add('now');void root.offsetWidth}
    stateAt(n);
    if(instant){void root.offsetWidth;requestAnimationFrame(()=>root.classList.remove('now'))}
  }
  function go(n,animate,only,soft){
    n=Math.max(0,Math.min(3,n|0));
    if(!animate||RM||n===0){snap(n,soft);cur=n;done=true;t0=performance.now();return}
    snap(n-1);
    const t=tok={dead:false};
    (async()=>{
      for(let k=n;k<=(only?n:3);k++){
        cur=k;done=false;t0=performance.now();
        try{await run(k,t)}catch(e){if(e===CANCEL)return;throw e}
        if(t.dead)return;
      }
      done=true;if(tok===t)tok=null;
    })();
  }

  /* ---------- 用户自己点：分段、开始/停、加减速度、Play tone；一按下就停掉正在播的脚本 ---------- */
  card.addEventListener('pointerdown',()=>{if(tok){stop();closeMenu()}});
  card.addEventListener('click',e=>{
    if(!card.classList.contains('open'))return;
    const tb=e.target.closest('.tab');
    if(tb){const n=+tb.dataset.t;if(n===pane)return;show(n);if(n===2)tunerPlay();pick?.(n);return}
    const k=e.target.closest('[data-k]')?.dataset.k;
    if(k==='play'){hit($('play'));setRun(!running)}
    else if(k==='plus'||k==='minus'){hit($(k));bpm=Math.max(30,Math.min(300,bpm+(k==='plus'?1:-1)));renderM()}
    else if(k==='tone'){hit($('tone'));toneOn=!toneOn;renderR()}
  });

  snap(0);
  return {
    beats:3,
    get beatNow(){return cur},get busy(){return!!tok},
    get beatFrac(){if(done||!tok)return cur?1:0;return Math.min(1,(performance.now()-t0)/DUR[cur])},
    play(){go(RM?3:1,true)},
    go(n){go(n,true)},
    one(n){go(n,true,true)},
    beat(n,soft){go(n,false,false,soft)},
    reset(){go(0,false)},
    onPick(f){pick=f},
    visible(v){on=v;if(!v)stopTick();else if(running)startTick()},
    destroy(){stop();stopTick();cancelAnimationFrame(raf);closeMenu();ro.disconnect();root.innerHTML='';root.classList.remove('sns-pr13','now')}
  };
};
})();
