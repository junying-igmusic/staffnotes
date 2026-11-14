// 统计区块（#stats）：用网站自己的版式画「这个月谱架上都是什么」，不截图、不照搬 App 现有统计面板，可当面板重做的方向稿。
// 口径照 specs/015：只记谱子在前台打开的时间，不识别是否在弹，也不评价练得好坏。
// 七张卡：本月月历（日格写时长，颜色深浅只表示同月相对时长，零记录日和未来日不同）、排行（曲目 / 作曲家 / 时期）、
// 近七天日均、本周目标（用户自己设）、过去 12 个月 10 / 50 / 100 小时里程碑、节拍器 1 万拍彩蛋、收藏数。
// 示例数据是编的：2027 年 3 月（1 日是周一，正好五行），「今天」是 24 日周三；三种排行的合计都等于月总量 1925 分钟。
// 进场：每张卡进视野时按自己的顺序长出来，同一批进视野的卡错开 110ms；系统减少动态效果时直接显示终态。
(()=>{
window.SNSims=window.SNSims||{};
if(SNSims.stats) return;
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const A='#3F529F',INK='#292D38',SEC='#646A75',MUT='#8A909B';

// 3 月 1–24 日每天开谱分钟数；周末多、几天空白
const MIN=[95,85,0,110,75,150,0, 85,120,85,0,90,175,70, 100,80,135,0,55,160,0, 115,90,50];
const TODAY=24, DAYS=31, MONTH='March', MAX=Math.max(...MIN);
const WD=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const TOTAL=MIN.reduce((s,m)=>s+m,0);                       // 1925
const LAST7=MIN.slice(TODAY-7);                               // 18–24 日
const AVG7=Math.round(LAST7.reduce((s,m)=>s+m,0)/7);          // 67
const WEEK=MIN.slice(21).reduce((s,m)=>s+m,0), GOAL=420;      // 22–24 日 255 分钟，目标 7 小时
const YEAR=Math.round((22*60+10+31*60+40+TOTAL)/60);          // 1–3 月合计 86 小时
const BEATS=8416, STARRED=12;
const RANK={
  Pieces:[['Piano Sonata No. 16 in C major, K. 545','Mozart',580],['Nocturne in B-flat minor, Op. 9 No. 1','Chopin',435],
    ['Prelude and Fugue in C minor, BWV 847','Bach',365],['Piano Sonata No. 8 in C minor, Op. 13','Beethoven',290],
    ['Piano Sonata in E-flat major, Hob. XVI:52','Haydn',150]],
  Composers:[['Mozart','2 scores',685],['Chopin','1 score',435],['Bach','1 score',365],['Beethoven','1 score',290],['Haydn','1 score',150]],
  Periods:[['Classical','Mozart, Beethoven, Haydn',1125],['Romantic','Chopin',435],['Baroque','Bach',365]]
};

const hm=m=>m<60?`${m}m`:`${Math.floor(m/60)}h ${String(m%60).padStart(2,'0')}`;
const bigHM=m=>m<60?`${m}<u>min</u>`:`${Math.floor(m/60)}<u>h</u>${String(m%60).padStart(2,'0')}<u>min</u>`;
const longHM=m=>{const h=Math.floor(m/60),r=m%60;return [h&&`${h} hour${h>1?'s':''}`,r&&`${r} minute${r>1?'s':''}`].filter(Boolean).join(' ')||'no time';};
const ease=t=>1-Math.pow(1-t,3);

const CSS=`
#stats .st{position:relative;z-index:1;margin-top:calc(110px - (100vh - min(42vh,433px)) / 2);margin-bottom:-56px}
#stats .st-head{display:grid;grid-template-columns:240px 1fr;gap:0 40px;margin-bottom:52px}
#stats .st-head .lead{font-size:14px;margin-bottom:14px}
#stats .st-head .lead span{display:block;color:var(--ink2)}
#stats .st-head h2{font-family:var(--serif);font-weight:400;font-size:clamp(36px,3.8vw,56px);line-height:1.05;letter-spacing:-.03em;max-width:700px}
#stats .st-head .sub{font-size:16px;color:var(--ink2);max-width:420px;margin-top:18px}
#stats .sim{aspect-ratio:auto;height:auto;overflow:visible;border-radius:0;background:none}
.sn-st{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:16px;color:${INK};font-family:var(--sans);-webkit-font-smoothing:antialiased}
.sn-st *{box-sizing:border-box}
.sn-st .c{background:var(--card,#fff);border-radius:24px;padding:24px 26px 26px;min-width:0;
  opacity:0;transform:translateY(16px);filter:blur(6px);transition:opacity .8s var(--ease),transform .9s var(--ease),filter .8s var(--ease)}
.sn-st .c.go{opacity:1;transform:none;filter:none}
.sn-st .t{display:flex;justify-content:space-between;align-items:baseline;gap:12px;font-size:14px;color:${SEC}}
.sn-st .big{font-family:var(--serif);font-size:46px;line-height:1;letter-spacing:-.03em;margin-top:16px;white-space:nowrap}
.sn-st .big u{text-decoration:none;font-family:var(--sans);font-size:15px;letter-spacing:0;color:${SEC};margin:0 7px 0 3px}
.sn-st .big u:last-child{margin-right:0}
.sn-st .sub{font-size:14px;color:${SEC};margin-top:8px}
.sn-st .cal{grid-column:1/span 5;grid-row:1;display:flex;flex-direction:column}
.sn-st .rank{grid-column:6/span 7;grid-row:1}
.sn-st .week{grid-column:1/span 5;grid-row:2/span 2;display:flex;flex-direction:column}
.sn-st .goal{grid-column:6/span 3;grid-row:2}
.sn-st .miles{grid-column:9/span 4;grid-row:2}
.sn-st .star{grid-column:6/span 3;grid-row:3}
.sn-st .metro{grid-column:9/span 4;grid-row:3}
/* month calendar */
.sn-st .cal .t b{font-family:var(--serif);font-weight:400;font-size:26px;letter-spacing:-.02em;color:${INK}}
.sn-st .cg{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:5px;margin-top:auto;padding-top:26px;container-type:inline-size}
.sn-st .cg .wd{font-size:11px;color:${MUT};padding:0 0 4px 7px}
.sn-st .d{position:relative;aspect-ratio:1;border-radius:9px;background:#F1F1EE;font-size:clamp(9px,2.8cqw,12px);line-height:1.1;font-variant-numeric:tabular-nums;
  transition:background .5s var(--ease) var(--dl,0s)}
.sn-st .d .n{position:absolute;left:12%;top:9%;color:${MUT};transition:color .5s var(--dl,0s)}
.sn-st .d .m{position:absolute;left:12%;bottom:10%;white-space:nowrap;opacity:0;transition:opacity .4s var(--dl,0s),color .5s var(--dl,0s)}
.sn-st .d.x{visibility:hidden}
.sn-st .d.f{background:none;box-shadow:inset 0 0 0 1px rgba(41,45,56,.10)}
.sn-st .d.f .n{opacity:.55}
.sn-st .d.td{box-shadow:0 0 0 2px #fff,0 0 0 3.5px ${A}}
.sn-st .cal.go .d.r{background:rgba(63,82,159,var(--a))}
.sn-st .cal.go .d.r .m{opacity:1}
.sn-st .cal.go .d.r .n{color:rgba(41,45,56,.55)}
.sn-st .cal.go .d.dk .n{color:rgba(255,255,255,.72)}
.sn-st .cal.go .d.dk .m{color:#fff}
/* ranking */
.sn-st .seg{display:inline-flex;padding:2px;border-radius:999px;background:#ECEDEF}
.sn-st .seg button{all:unset;cursor:pointer;height:28px;line-height:28px;padding:0 13px;border-radius:999px;font-size:13px;color:${SEC};transition:background .3s,color .3s}
.sn-st .seg button[aria-selected=true]{background:#fff;color:${INK};box-shadow:0 1px 2px rgba(41,45,56,.12)}
.sn-st .seg button:focus-visible{outline:2px solid ${A};outline-offset:2px}
.sn-st .rank .t{align-items:center;flex-wrap:wrap}
.sn-st .rows{list-style:none;margin-top:22px;display:flex;flex-direction:column;gap:16px}
.sn-st .row{display:grid;grid-template-columns:minmax(0,1fr) auto;column-gap:18px;align-items:baseline}
.sn-st .row .nm{font-family:var(--serif);font-size:18px;line-height:1.2;letter-spacing:-.015em}
.sn-st .row .cm{grid-column:1;font-size:13px;color:${SEC};margin-top:2px}
.sn-st .row .tm{grid-column:2;grid-row:1;font-size:15px;font-variant-numeric:tabular-nums}
.sn-st .row .b{grid-column:1/-1;height:6px;margin-top:9px;border-radius:0 4px 4px 0;background:${A};width:0;transition:width .9s var(--ease) var(--dl,0s)}
.sn-st .rank.go .row .b{width:var(--w)}
.sn-st .row{opacity:1;transition:opacity .35s}
.sn-st .rows.out .row{opacity:0}
/* last 7 days */
.sn-st .wk{position:relative;flex:1 0 132px;display:grid;grid-template-columns:repeat(7,minmax(0,1fr));margin-top:26px;border-bottom:1px solid rgba(41,45,56,.14);--ph:calc(100% - 22px)}
.sn-st .wk .col{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%}
.sn-st .wk .v{font-size:12px;font-variant-numeric:tabular-nums;padding:0 3px 4px;margin-bottom:2px;background:var(--card,#fff);white-space:nowrap;opacity:0;transition:opacity .4s var(--dl,0s)}
.sn-st .wk .bar{width:min(22px,58%);height:0;border-radius:4px 4px 0 0;background:${A};transition:height .8s var(--ease) var(--dl,0s)}
.sn-st .week.go .wk .bar{height:calc(var(--p) * (100% - 22px))}
.sn-st .week.go .wk .v{opacity:1}
.sn-st .wk .avg{position:absolute;left:0;right:0;height:1px;background:rgba(41,45,56,.38);bottom:calc(var(--p) * (100% - 22px));opacity:0;transition:opacity .5s 1s}
.sn-st .wk .avg span{position:absolute;left:0;bottom:4px;font-size:11px;color:${SEC};white-space:nowrap}
.sn-st .week.go .wk .avg{opacity:1}
.sn-st .wl{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));margin-top:8px;font-size:12px;color:${SEC};text-align:center}
.sn-st .wl .now{color:${INK}}
/* meters */
.sn-st .mtr{position:relative;height:8px;border-radius:4px;background:rgba(63,82,159,.12);margin-top:22px}
.sn-st .mtr>i{position:absolute;left:0;top:0;bottom:0;width:0;border-radius:4px;background:${A};transition:width 1.2s var(--ease) .25s}
.sn-st .go .mtr>i{width:var(--w)}
.sn-st .mtr.thin{height:4px;border-radius:2px}
.sn-st .mk{position:absolute;top:50%;left:var(--x);width:14px;height:14px;margin:-7px 0 0 -7px;border-radius:50%;background:#fff;
  box-shadow:inset 0 0 0 2px rgba(63,82,159,.35);transition:background .3s var(--dl,0s),box-shadow .3s var(--dl,0s)}
.sn-st .miles.go .mk.on{background:${A};box-shadow:0 0 0 2px #fff}
.sn-st .mk b{position:absolute;top:20px;left:50%;transform:translateX(-50%);font-weight:400;font-size:12px;color:${SEC};white-space:nowrap}
.sn-st .miles .mtr{margin:26px 8px 34px}
.sn-st .st-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
@container (max-width:980px){
  .sn-st{grid-template-columns:repeat(2,minmax(0,1fr));grid-auto-flow:row dense}
  .sn-st .c{grid-column:span 2!important;grid-row:auto!important}
  .sn-st .goal,.sn-st .star{grid-column:span 1!important}
}
@container (max-width:560px){
  .sn-st{gap:12px}
  .sn-st .c{padding:20px 20px 22px;border-radius:20px}
  .sn-st .big{font-size:40px}
  .sn-st .goal .big,.sn-st .star .big{font-size:32px}
  .sn-st .goal .big u,.sn-st .star .big u{font-size:13px}
  .sn-st .cg{gap:4px}
  .sn-st .d{border-radius:7px}
  .sn-st .row .nm{font-size:17px}
  .sn-st .rank .seg{margin-top:4px}
}
@media (max-width:900px){
  #stats .st{margin-top:0;margin-bottom:-56px}
  #stats .st-head{grid-template-columns:1fr;margin-bottom:36px}
}
`;

function card(cls,label,html){
  const c=document.createElement('div'); c.className='c '+cls; c.setAttribute('role','group'); c.setAttribute('aria-label',label); c.innerHTML=html; return c;
}
function count(el,to,fmt,dur,delay){
  if(RM){ el.innerHTML=fmt(to); return; }
  el.innerHTML=fmt(0);
  setTimeout(()=>{ const t0=performance.now();
    (function tick(now){ const p=Math.min(1,(now-t0)/dur); el.innerHTML=fmt(Math.round(to*ease(p))); if(p<1) requestAnimationFrame(tick); })(t0);
  },delay);
}

SNSims.stats=function(el){
  if(el._st) return el._st;
  if(!document.getElementById('sn-stats-css')){ const s=document.createElement('style'); s.id='sn-stats-css'; s.textContent=CSS; document.head.appendChild(s); }
  el.innerHTML='';
  const g=document.createElement('div'); g.className='sn-st'; el.appendChild(g);
  const fmtInt=n=>n.toLocaleString('en-US');

  // month calendar
  let cells=WD.map(w=>`<div class="wd" aria-hidden="true">${w[0]}</div>`).join('');
  for(let d=1; d<=DAYS; d++){
    const m=MIN[d-1], wd=WD[(d-1)%7], k=d-1;
    if(d>TODAY){ cells+=`<div class="d f" aria-label="${wd} ${d} ${MONTH}, not yet"><span class="n">${d}</span></div>`; continue; }
    const a=m?(.14+.76*m/MAX).toFixed(2):0;
    const cls='d'+(m?' r':'')+(a>.62?' dk':'')+(d===TODAY?' td':'');
    cells+=`<div class="${cls}" style="--a:${a};--dl:${(k*.032).toFixed(3)}s" title="${wd} ${d} ${MONTH} · ${m?hm(m):'nothing open'}" aria-label="${wd} ${d} ${MONTH}${d===TODAY?', today':''}: ${m?longHM(m):'no time'}"><span class="n" aria-hidden="true">${d}</span>${m?`<span class="m" aria-hidden="true">${hm(m)}</span>`:''}</div>`;
  }
  const days=MIN.filter(Boolean).length;
  const cal=card('cal',`${MONTH}: ${longHM(TOTAL)} with a score open, on ${days} days`,
    `<div class="t"><b>${MONTH}</b><span>${days} days</span></div><div class="big" aria-hidden="true"></div><div class="cg">${cells}</div>`);

  // ranking
  const rank=card('rank',`Where the time went in ${MONTH}`,
    `<div class="t"><span>Where the time went</span><div class="seg" role="tablist" aria-label="Rank by">${Object.keys(RANK).map((k,i)=>`<button role="tab" aria-selected="${i===0}">${k}</button>`).join('')}</div></div><ol class="rows"></ol>`);
  const rows=rank.querySelector('.rows'), tabs=[...rank.querySelectorAll('.seg button')];
  let tab='Pieces';
  const fillRows=(key,animate)=>{
    const list=RANK[key], top=list[0][2];
    rows.innerHTML=list.map(([n,c,m],i)=>`<li class="row" aria-label="${n}, ${c}: ${longHM(m)}"><span class="nm">${n}</span><span class="tm" aria-hidden="true">${hm(m)}</span><span class="cm">${c}</span><i class="b" style="--w:${(m/top*100).toFixed(1)}%;--dl:${(.18+i*.09).toFixed(2)}s" aria-hidden="true"></i></li>`).join('');
    if(animate && !RM){ rank.classList.remove('go'); void rows.offsetWidth; rank.classList.add('go'); }
  };
  fillRows(tab,false);
  tabs.forEach(b=>b.addEventListener('click',()=>{
    if(b.textContent===tab) return; tab=b.textContent;
    tabs.forEach(x=>x.setAttribute('aria-selected',x===b));
    if(RM){ fillRows(tab,false); return; }
    rows.classList.add('out'); setTimeout(()=>{ fillRows(tab,true); rows.classList.remove('out'); },220);
  }));
  rank.querySelector('.seg').addEventListener('keydown',e=>{
    const i=tabs.findIndex(x=>x.textContent===tab), j=e.key==='ArrowRight'?i+1:e.key==='ArrowLeft'?i-1:-9;
    if(tabs[j]){ tabs[j].click(); tabs[j].focus(); e.preventDefault(); }
  });

  // last 7 days
  const wmax=Math.max(...LAST7);
  const cols=LAST7.map((m,i)=>`<div class="col">${m?`<span class="v" style="--dl:${(.5+i*.07).toFixed(2)}s">${hm(m)}</span><i class="bar" style="--p:${(m/wmax).toFixed(3)};--dl:${(.1+i*.07).toFixed(2)}s"></i>`:''}</div>`).join('');
  const lbls=LAST7.map((m,i)=>{ const d=TODAY-6+i; return d===TODAY?'<span class="now">Today</span>':`<span>${WD[(d-1)%7]}</span>`; }).join('');
  const week=card('week',`Last 7 days: ${longHM(AVG7)} a day on average. `+LAST7.map((m,i)=>`${WD[(TODAY-7+i)%7]} ${longHM(m)}`).join(', '),
    `<div class="t"><span>Last 7 days</span></div><div class="big" aria-hidden="true"></div><div class="sub">a day, on average</div>
     <div class="wk" aria-hidden="true">${cols}<div class="avg" style="--p:${(AVG7/wmax).toFixed(3)}"><span>avg</span></div></div><div class="wl" aria-hidden="true">${lbls}</div>`);

  // weekly goal
  const goal=card('goal',`This week: ${longHM(WEEK)} of a ${GOAL/60} hour goal you set`,
    `<div class="t"><span>This week</span></div><div class="big" aria-hidden="true"></div><div class="sub">of your ${GOAL/60} h goal</div><div class="mtr" aria-hidden="true"><i style="--w:${(WEEK/GOAL*100).toFixed(1)}%"></i></div>`);

  // 12-month milestones
  const marks=[10,50,100].map(h=>`<span class="mk${YEAR>=h?' on':''}" style="--x:${h}%;--dl:${(.25+1.2*h/YEAR*(YEAR>=h?1:0)).toFixed(2)}s"><b>${h} h</b></span>`).join('');
  const miles=card('miles',`Past 12 months: ${YEAR} hours with a score open. 10 and 50 hours reached, 100 hours next`,
    `<div class="t"><span>Past 12 months</span><span>${100-YEAR} h to 100</span></div><div class="big" aria-hidden="true"></div><div class="mtr" aria-hidden="true"><i style="--w:${YEAR}%"></i>${marks}</div>`);

  // metronome easter egg
  const metro=card('metro',`Metronome: ${fmtInt(BEATS)} beats played. Something happens at 10,000`,
    `<div class="t"><span>Metronome</span></div><div class="big" aria-hidden="true"></div><div class="sub">Something happens at 10,000.</div><div class="mtr thin" aria-hidden="true"><i style="--w:${(BEATS/100).toFixed(1)}%"></i></div>`);

  // favourites
  const star=card('star',`${STARRED} starred scores`,
    `<div class="t"><span>Starred</span></div><div class="big" aria-hidden="true"></div><div class="sub">in your library</div>`);

  [cal,rank,week,goal,miles,metro,star].forEach(c=>g.appendChild(c));

  // 大数字：[卡, 终值, 格式, 时长, 延迟]；搭好时先写 0，区块高度从一开始就是终态
  const nums={
    cal:[cal,TOTAL,bigHM,1300,150],
    week:[week,AVG7,bigHM,1000,150],
    goal:[goal,WEEK,bigHM,1200,250],
    miles:[miles,YEAR,n=>`${n}<u>h</u>`,1300,250],
    metro:[metro,BEATS,n=>`${fmtInt(n)}<u>beats</u>`,1500,200],
    star:[star,STARRED,n=>`${n}<u>scores</u>`,700,200]
  };
  Object.values(nums).forEach(([c,,f])=>{ c.querySelector('.big').innerHTML=f(0); });
  const go=c=>{ c.classList.add('go'); const n=nums[c.classList[1]]; if(n){ const [k,...a]=n; count(k.querySelector('.big'),...a); } };
  if(RM || !('IntersectionObserver' in window)){ g.querySelectorAll('.c').forEach(go); return el._st={}; }
  const io=new IntersectionObserver(es=>{
    let k=0;
    es.forEach(e=>{ if(!e.isIntersecting) return; io.unobserve(e.target); const c=e.target; setTimeout(()=>go(c),k++*110); });
  },{threshold:.3});
  g.querySelectorAll('.c').forEach(c=>io.observe(c));
  return el._st={};
};
// 页面解析时就把卡片搭好：区块高度和负边距一开始就是终值，菜单从远处跳到 #pricing 不会因为这块晚长出来而落偏；
// 页面加载器之后再调 SNSims.stats 时直接拿回同一份
document.querySelectorAll('.sim[data-sim="stats"]').forEach(e=>SNSims.stats(e));
})();
