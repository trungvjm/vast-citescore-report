const $=selector=>document.querySelector(selector);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const integer=new Intl.NumberFormat('vi-VN');
const decimal=new Intl.NumberFormat('vi-VN',{minimumFractionDigits:1,maximumFractionDigits:2});
const oneDec=new Intl.NumberFormat('vi-VN',{minimumFractionDigits:1,maximumFractionDigits:1});
const twoDec=new Intl.NumberFormat('vi-VN',{minimumFractionDigits:2,maximumFractionDigits:2});
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const CHART_START_YEAR=2015;

const baseStyles={
  vjm:{color:'#2d81ff',dash:'',marker:'circle'},
  amv:{color:'#7048e8',dash:'6 4',marker:'diamond'},
  ansn:{color:'#0f7b4c',dash:'',marker:'square'},
  vjc:{color:'#d9480f',dash:'',marker:'triangle'},
  vjes:{color:'#c92a2a',dash:'',marker:'circle'},
  vjst:{color:'#0c8599',dash:'3 3',marker:'square'},
  cip:{color:'#5c5b57',dash:'2 3',marker:'diamond'},
  vjmech:{color:'#2d81ff',dash:'',marker:'circle'},
  jcc:{color:'#0f7b4c',dash:'',marker:'square'},
  ajb:{color:'#d9480f',dash:'',marker:'triangle'},
  vjmst:{color:'#0c8599',dash:'5 3',marker:'diamond'},
  vjbt:{color:'#7048e8',dash:'3 3',marker:'circle'}
};

const styles=Object.fromEntries(Object.keys(baseStyles).map(k=>[k,{...baseStyles[k]}]));

const metricInfo={
  citescore:{label:'CiteScore & Tracker chính thức',short:'CiteScore',decimals:1},
  citations:{label:'Trích dẫn trong cửa sổ CiteScore',short:'Trích dẫn',decimals:0},
  documents:{label:'Tài liệu trong mẫu số CiteScore',short:'Tài liệu',decimals:0}
};

const state={
  themeMode:'light',
  search:'',
  index:'all',
  subject:'all',
  sort:'default',
  metric:'citescore',
  fromYear:CHART_START_YEAR,
  toYear:2026,
  selected:new Set(),
  selectedCandidates:new Set(),
  selectedCitations:new Set(),
  showCipBenchmark:true,
  citationMode:'scopus-cited-by',
  citationGroup:'all',
  papersGroup:'all',
  papersFocusYear:2025,
  activeYear:null,
  pinnedYear:null,
  activeCandidateYear:null,
  activeCitationYear:null,
  activePaperYear:null,
  detailFromYear:null,
  detailToYear:null
};

let dashboard=null,scopus=null;

function coverUrl(j){
  return j?.cover||j?.coverImage||`assets/images/covers/${j?.id}.png`;
}

/* ==========================================================================
   1. LIGHT / DARK MODE TOGGLE (GETARTCRAFT.COM PALETTE)
   ========================================================================== */
function syncPaletteColors(){
  const cs=getComputedStyle(document.documentElement);
  const c=[1,2,3,4,5,6].map(i=>cs.getPropertyValue(`--c${i}`).trim()||'#2d81ff');
  const map={vjm:c[0],amv:c[3],ansn:c[1],vjc:c[2],vjes:c[5],vjst:c[4],cip:cs.getPropertyValue('--muted').trim()||'#666',vjmech:c[0],jcc:c[1],ajb:c[2],vjmst:c[4],vjbt:c[3]};
  for(const [k,val] of Object.entries(map)){if(styles[k]&&val)styles[k].color=val;}
}

function applyThemeMode(mode,persist=true,animate=false){
  const valid=mode==='dark'?'dark':'light';
  state.themeMode=valid;
  const root=document.documentElement;
  if(animate){
    root.classList.add('theme-anim');
    setTimeout(()=>root.classList.remove('theme-anim'),380);
  }
  root.dataset.theme=valid;
  const meta=$('meta[name="theme-color"]');
  if(meta)meta.setAttribute('content',valid==='dark'?'#121316':'#f2f1ee');
  const lbl=$('#theme-toggle-label');
  if(lbl)lbl.textContent=valid==='dark'?'SÁNG':'TỐI';
  if(persist){try{localStorage.setItem('vast-artcraft-mode',valid);}catch{}}
  requestAnimationFrame(()=>{
    syncPaletteColors();
    if(dashboard){
      renderAllCharts();
      const id=decodeURIComponent(location.hash.slice(1));
      if(id.startsWith('journal/')){
        const j=dashboard.journals.find(x=>x.id===id.slice(8));
        if(j)renderDetailCharts(j);
      }
    }
  });
}

function initThemeMode(){
  let saved='light';
  try{saved=localStorage.getItem('vast-artcraft-mode')||'light';}catch{}
  applyThemeMode(saved,false,false);
  const btn=$('#theme-toggle');
  if(btn){
    btn.addEventListener('click',()=>{
      applyThemeMode(state.themeMode==='dark'?'light':'dark',true,true);
    });
  }
}

/* ==========================================================================
   2. ARTCRAFT SCROLLBAR RULER, SCROLL-FLIGHT LETTERS & KINETIC MARQUEE
   ========================================================================== */
const homeFlightSections=[
  {id:'overview',elId:'section-overview',word:'TỔNG QUAN',navId:'overview'},
  {id:'catalog',elId:'section-catalog',word:'DANH MỤC',navId:'catalog'},
  {id:'citescore',elId:'section-citescore',word:'BIỂU ĐỒ',navId:'citescore'},
  {id:'references',elId:'section-references',word:'THAM KHẢO',navId:'references'}
];
let flightSections=[];
let flightRoute='';
let flightBrand='VAST JOURNALS';
let marqueeOffset=0;
let marqueeVelocity=0.45;
let lastScrollY=0;
let scrollFrame=0;
const clamp01=value=>Math.max(0,Math.min(1,value));

function setFlightSections(sections,brand='VAST JOURNALS',route=''){
  flightRoute=route;
  flightBrand=brand;
  const stage=$('#flight-letters-stage');
  const anchors=$('.flight-corner-anchors');
  stage.replaceChildren();
  anchors.replaceChildren();
  flightSections=sections.filter(s=>document.getElementById(s.elId)).map(section=>{
    const anchor=document.createElement('a');
    anchor.href=route?`#journal/${route}/${section.elId}`:`#${section.elId}`;
    anchor.textContent=section.word;
    anchor.dataset.flightLink=section.id;
    anchors.append(anchor);
    let width=0;
    const chars=[...section.word].map((ch,index)=>{
      const el=document.createElement('span');
      el.className='flight-char';
      el.textContent=ch;
      el.dataset.flightSection=section.id;
      el.style.opacity='0';
      stage.append(el);
      const charWidth=el.getBoundingClientRect().width;
      const center=width+charWidth/2;
      width+=charWidth+1.4;
      return {el,center,index};
    });
    return {...section,element:document.getElementById(section.elId),anchor,chars,width};
  });
  $('#flight-brand-dock').textContent=brand;
  $('#scroll-flight-layer').hidden=false;
  lastScrollY=window.scrollY;
  onScrollUpdate();
}

function scheduleScrollUpdate(){
  if(scrollFrame)return;
  scrollFrame=requestAnimationFrame(()=>{
    scrollFrame=0;
    onScrollUpdate();
  });
}

function initRulerAndFlight(){
  const track=$('#ruler-track');
  track.style.height='2400px';
  track.innerHTML=Array.from({length:101},(_,i)=>{
    const major=i%5===0;
    return `<div style="position:absolute;left:0;right:0;top:${i*24}px;height:0"><span class="ruler-tick ${major?'is-major':'is-minor'}"></span>${major?`<span class="ruler-tick-label">${i}</span>`:''}</div>`;
  }).join('');
  $('#artcraft-scrollbar').addEventListener('click',e=>{
    const rect=e.currentTarget.getBoundingClientRect();
    const ratio=clamp01((e.clientY-rect.top)/Math.max(1,rect.height));
    window.scrollTo({top:ratio*Math.max(0,document.documentElement.scrollHeight-innerHeight),behavior:reducedMotion.matches?'instant':'smooth'});
  });
  if(!reducedMotion.matches&&innerWidth>=960&&'IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{
      for(const entry of entries)if(entry.isIntersecting)entry.target.classList.remove('is-pending');
    },{threshold:0.01,rootMargin:'120px 0px'});
    document.querySelectorAll('[data-reveal]').forEach((el,index)=>{
      if(index>0)el.classList.add('is-pending');
      observer.observe(el);
    });
  }
  window.addEventListener('scroll',scheduleScrollUpdate,{passive:true});
  window.addEventListener('resize',scheduleScrollUpdate,{passive:true});
  reducedMotion.addEventListener('change',()=>{
    document.querySelectorAll('.is-pending').forEach(el=>el.classList.remove('is-pending'));
    scheduleScrollUpdate();
  });
  document.fonts.ready.then(()=>{
    setFlightSections(flightSections,flightBrand,flightRoute);
  });
  requestAnimationFrame(stepMarquee);
}

function onScrollUpdate(){
  const scrollY=window.scrollY;
  marqueeVelocity=Math.max(-4.2,Math.min(4.8,0.45+(scrollY-lastScrollY)*0.08));
  lastScrollY=scrollY;
  const vw=innerWidth,vh=innerHeight;
  document.querySelectorAll('[data-reveal].is-pending').forEach(el=>{
    if(vw<960||el.getBoundingClientRect().top<vh+120)el.classList.remove('is-pending');
  });
  const progress=clamp01(scrollY/Math.max(1,document.documentElement.scrollHeight-vh));
  const percent=Math.round(progress*100);
  $('#artcraft-scrollbar').setAttribute('aria-valuenow',String(percent));
  $('#ruler-percent').textContent=String(percent).padStart(3,'0')+'%';
  $('#ruler-indicator').style.transform=`translateY(${24+progress*Math.max(10,vh-96)}px)`;
  $('#ruler-track').style.transform=`translateY(${-progress*(2400-vh+48)}px)`;

  const detail=Boolean(flightRoute);
  const hero=$('#hero-wordmark');
  const heroProgress=detail||reducedMotion.matches?0:clamp01(scrollY/380);
  hero.style.transform=`translateY(${-heroProgress*34}px) scale(${1-heroProgress*0.32})`;
  hero.style.opacity=String(1-heroProgress*0.85);
  $('#flight-brand-dock').classList.toggle('is-docked',detail||scrollY>260);
  if(!flightSections.length)return;

  const tops=flightSections.map(s=>s.element.getBoundingClientRect().top);
  const entryY=detail?Math.min(vh*0.44,380):vh*0.82;
  let active=detail?0:-1;
  tops.forEach((top,index)=>{if(top<=entryY)active=index;});
  if(progress>0.995)active=flightSections.length-1;
  const current=flightSections[active];
  document.querySelectorAll('.nav-pill').forEach(el=>{
    el.classList.toggle('is-active',el.dataset.navSec===(detail?'catalog':current?.navId??'overview'));
  });
  flightSections.forEach((section,index)=>{
    section.anchor.classList.toggle('is-current',index===active);
    if(index===active)section.anchor.setAttribute('aria-current','location');
    else section.anchor.removeAttribute('aria-current');
    const span=Math.max(120,entryY-96);
    const t=reducedMotion.matches?1:(detail&&index===0?clamp01(scrollY/220):clamp01((entryY-tops[index])/span));
    section.chars.forEach(({el,center,index:charIndex})=>{
      if(index!==active||vw<768){
        el.style.opacity='0';
        return;
      }
      const delay=charIndex/Math.max(1,section.chars.length)*0.18;
      const u=clamp01((t-delay)/0.82);
      const ease=u*u*(3-2*u);
      const startX=vw-76-(section.width-center)*0.54;
      const startY=vh-110+index*20;
      const endX=vw-76-section.width+center;
      const endY=96;
      const inverse=1-ease;
      const x=inverse*inverse*startX+2*inverse*ease*(vw-40)+ease*ease*endX;
      const y=inverse*inverse*startY+2*inverse*ease*((startY+endY)/2)+ease*ease*endY;
      const rotation=reducedMotion.matches?0:-65*Math.sin(ease*Math.PI);
      el.style.opacity=String(0.4+ease*0.6);
      el.style.transform=`translate3d(${x}px,${y}px,0) translate(-50%,-50%) rotate(${rotation}deg) scale(${0.54+ease*0.46})`;
    });
  });
}

function stepMarquee(){
  const track=$('#marquee-track');
  if(track&&track.firstElementChild&&!reducedMotion.matches&&!document.hidden&&!$('#home-view').hidden){
    marqueeVelocity+=(0.45-marqueeVelocity)*0.06;
    marqueeOffset-=marqueeVelocity;
    const halfWidth=track.scrollWidth/2;
    if(halfWidth>0){
      if(marqueeOffset<=-halfWidth)marqueeOffset+=halfWidth;
      if(marqueeOffset>0)marqueeOffset-=halfWidth;
      track.style.transform=`translate3d(${marqueeOffset.toFixed(2)}px,0,0)`;
    }
  }
  requestAnimationFrame(stepMarquee);
}

/* ==========================================================================
   3. DATA HELPERS
   ========================================================================== */
function formatDate(iso){
  if(!iso||!/^\d{4}-\d{2}-\d{2}$/.test(iso))return'Chưa xác minh';
  return new Intl.DateTimeFormat('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'UTC'}).format(new Date(iso+'T00:00:00Z'));
}
function formatValue(value,metric=state.metric){
  if(!Number.isFinite(value))return'N/A';
  return metricInfo[metric]?.decimals?oneDec.format(value):integer.format(value);
}
function safeUrl(url){return /^https?:\/\//i.test(String(url??''))?String(url):'#';}
function external(url,text){return `<a href="${esc(safeUrl(url))}" target="_blank" rel="noopener noreferrer">${esc(text??url)}</a>`;}
function fullName(j){return j.title+` (${j.code})`;}
function publicationFrequency(j){
  const issues=j.frequency?.issuesPerYear;
  return Number.isInteger(issues)&&issues>0?`${issues} kỳ/năm`:'Chưa có thông tin';
}
function archiveLinks(j){
  return [external(j.archiveUrl,'Các số đã xuất bản'),...(j.additionalArchives??[]).map(a=>external(a.url,a.label))].join(' · ');
}
function formatHdgsnnScore(score){
  return String(score??'').split('-').map(p=>decimal.format(Number(p))).join('–');
}
function hdgsnnRangeText(j){
  const rows=j.hdgsnn2025||[];
  if(!rows.length)return'—';
  const nums=rows.flatMap(r=>String(r.score).split('-').map(Number)).filter(Number.isFinite);
  const min=Math.min(...nums),max=Math.max(...nums);
  const range=min===max?decimal.format(max):`${decimal.format(min)}–${decimal.format(max)}`;
  return `0–${range} điểm (${rows.length} hội đồng)`;
}
function isScopusVerified(j){return j.indexings.some(i=>i.system==='Scopus'&&i.status==='listed');}
function scopusRecord(j,year){return scopus.records.find(r=>r.journal===j.code&&r.year===year);}
function annualRecord(j,year){return scopus.records.find(r=>r.journal===j.code&&r.year===year&&r.type==='annual');}
function trackerRecord(j){return scopus.records.find(r=>r.journal===j.code&&r.year===scopus.trackerYear&&r.type==='tracker');}
function localScore(j,year=2025){
  if(j.group==='VAST-1')return null;
  const r=j.localCitation?.selfCalculatedSeries?.find(x=>x.year===year);
  if(!r)return null;
  const s=r.score??r.value;
  return {...r,score:s,value:s};
}
function statisticalStartYear(j){return j.id==='vjst'?2016:CHART_START_YEAR;}
function citationRecord(j,year){
  if(year<statisticalStartYear(j))return null;
  return (j.scopusCitedBy?.citationSeries||j.localCitation?.citationSeries)?.find(r=>r.year===year)??null;
}
function scopusQuartile(percentile){return Number.isFinite(percentile)?(percentile>=75?'Q1':(percentile>=50?'Q2':(percentile>=25?'Q3':'Q4'))):null;}
function historyRecord(j,year){
  if(year<statisticalStartYear(j))return null;
  return (j.annualHistory||j.outputs||[]).find(r=>r.year===year)??null;
}
function statisticalHistory(j){
  const startYear=statisticalStartYear(j);
  return (j.annualHistory||j.outputs||[]).filter(r=>r.year>=startYear);
}
function observation(j,metric,year){
  const r=scopusRecord(j,year);
  if(!r)return{value:null,isProvisional:false,kind:'missing'};
  const value=metric==='citescore'?r.value:r[metric];
  return{value:Number.isFinite(value)?value:null,isProvisional:r.type==='tracker',kind:r.type,record:r};
}

function indexingBadges(j){
  const groupBadge=`<span class="badge ${j.group==='VAST-1'?'is-vast1':'is-vast2'}">${esc(j.group)}</span>`;
  const verified=j.indexings.filter(i=>i.status==='listed').map(i=>{
    const short=i.system==='WoS'?(i.collection?`WoS ${i.collection}`:'WoS'):i.system;
    const source=i.system==='WoS'?'Clarivate Master Journal List':i.evidenceLevel==='database'?'cơ sở dữ liệu':i.evidenceLevel==='vast'?'website VAST':'website tạp chí';
    return `<a class="badge is-verified" href="${esc(safeUrl(i.sourceUrl))}" target="_blank" rel="noopener noreferrer" title="${esc(`${short}: đã có trong danh mục. Nguồn: ${source}.`)}">${esc(short)}</a>`;
  }).join('');
  return groupBadge+verified;
}

function niceScale(maximum){
  const target=Math.max(1,maximum*1.12),rough=target/5,power=10**Math.floor(Math.log10(rough));
  let step=[1,2,2.5,5,10].find(n=>n*power>=rough)*power;
  return{step,max:Math.ceil(target/step)*step};
}
function formatAxisTick(v,decimals){return decimals?oneDec.format(v):integer.format(v);}
function markerShape(marker,x,y,r,fill,stroke='var(--bg)'){
  const f=n=>n.toFixed(1);
  if(marker==='square')return`<rect x="${f(x-r)}" y="${f(y-r)}" width="${f(r*2)}" height="${f(r*2)}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
  if(marker==='diamond')return`<polygon points="${f(x)},${f(y-r-1)} ${f(x+r+1)},${f(y)} ${f(x)},${f(y+r+1)} ${f(x-r-1)},${f(y)}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
  if(marker==='triangle')return`<polygon points="${f(x)},${f(y-r-1.5)} ${f(x+r+1.5)},${f(y+r+1)} ${f(x-r-1.5)},${f(y+r+1)}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
  return`<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
}

/* ==========================================================================
   4. RENDER HERO ORBIT COVERS, MARQUEE & SECTION 01 OVERVIEW / CITESCORE MATRIX
   ========================================================================== */
function renderHeroAndOverview(){
  $('#snapshot-date').textContent=formatDate(dashboard.collectedAt);
  for(const [group,selector] of [['VAST-1','#overview-international-journals'],['VAST-2','#overview-national-journals']]){
    $(selector).innerHTML=dashboard.journals.filter(j=>j.group===group).map(j=>`<li><a href="#journal/${esc(j.id)}">${esc(fullName(j))}</a></li>`).join('');
  }

  // 1. Place 12 journal covers around the Hero orbital ellipses
  const orbitPositions=[
    {x:13,y:20},{x:26,y:11},{x:74,y:11},{x:87,y:20},
    {x:8,y:49},{x:21,y:48},{x:79,y:48},{x:92,y:49},
    {x:14,y:79},{x:28,y:87},{x:72,y:87},{x:86,y:79}
  ];
  const orbitBox=$('#hero-orbit-covers');
  if(orbitBox){
    orbitBox.innerHTML=dashboard.journals.map((j,idx)=>{
      const pos=orbitPositions[idx]||orbitPositions[0];
      return `<a class="orbit-cover-node" href="#journal/${esc(j.id)}" style="left:${pos.x}%;top:${pos.y}%" title="${esc(j.title)} (${esc(j.code)})">
        <img src="${esc(coverUrl(j))}" alt="Bìa ${esc(j.code)}">
        <span class="orbit-cover-tag">${esc(j.code)}</span>
      </a>`;
    }).join('');
  }

  // 2. Build continuous kinetic Marquee ticker (duplicated for seamless loop)
  const marqueeTrack=$('#marquee-track');
  if(marqueeTrack){
    const itemsHtml=dashboard.journals.map(j=>{
      const a25=annualRecord(j,2025),t26=trackerRecord(j),loc25=localScore(j,2025);
      const metricTxt=j.group==='VAST-1'
        ?(Number.isFinite(a25?.value)?`CITESCORE 2025: ${oneDec.format(a25.value)}`:(Number.isFinite(t26?.value)?`TRACKER 2026: ${oneDec.format(t26.value)}`:'SCOPUS'))
        :`DỰ KIẾN 2025: ${loc25?twoDec.format(loc25.score):'N/A'}`;
      const instShort=j.id==='amv'?'VIỆN TOÁN HỌC & SPRINGER':(j.institution?.coPublisher?`NXB KHTN&CN & ${j.institution.coPublisher.toUpperCase()}`:'NXB KHTN&CN');
      return `<a class="marquee-item" href="#journal/${esc(j.id)}">
        <span class="marquee-dot">▪</span>
        <strong>${esc(j.code)}</strong>
        <span>${esc(j.group)} · ${esc(metricTxt)} · ${esc(instShort)}</span>
      </a>`;
    }).join('');
    marqueeTrack.innerHTML=itemsHtml+itemsHtml;
  }

  // 3. Summary KPI strip
  const totalPeriodPapers=dashboard.journals.reduce((s,j)=>s+statisticalHistory(j).reduce((a,r)=>a+(r.papers||0),0),0);
  const totalPeriodIssues=dashboard.journals.reduce((s,j)=>s+statisticalHistory(j).reduce((a,r)=>a+(r.issues||0),0),0);
  const totalCitingDocs=dashboard.journals.reduce((s,j)=>s+(j.scopusCitedBy?.citingDocuments??0),0);

  const cells=[
    ['Hệ thống tạp chí VAST','12 tạp chí','7 tạp chí VAST-1 (Scopus; 5 tạp chí có JCR/ESCI) · 5 tạp chí VAST-2'],
    ['Tổng số bài trong thống kê (2015–2026)',`${integer.format(totalPeriodPapers)} bài`,`${integer.format(totalPeriodIssues)} kỳ xuất bản`],
    ['Tài liệu trích dẫn (7 tạp chí Scopus)',`${integer.format(totalCitingDocs)} tài liệu`,'Cộng theo tạp chí; một tài liệu có thể trích dẫn nhiều tạp chí.'],
    ['Đỉnh CiteScore & JIF 2025','CS 5,0 · JIF 2,4','CiteScore: VJES 5,0 · ANSN 3,9 | JIF (JCR): ANSN 2,4 · VJES 2,1']
  ];
  $('#summary-strip').innerHTML=cells.map(([l,v,d])=>`<div class="summary-item"><span class="summary-label">${esc(l)}</span><strong class="summary-value">${esc(v)}</strong><span class="summary-detail">${esc(d)}</span></div>`).join('');

}

function renderVast1MatrixTable(){
  const years=scopus.annualYears||[2015,2016,2017,2018,2019,2020,2021,2022,2023,2024,2025];
  const vast1=dashboard.journals.filter(j=>j.group==='VAST-1');
  $('#vast1-matrix-head').innerHTML=`<tr>
    <th scope="col">Tạp chí VAST-1 &amp; Đơn vị xuất bản</th>
    ${years.map(y=>`<th scope="col">${y}</th>`).join('')}
    <th scope="col">Tracker<br>${scopus.trackerYear}</th>
    <th scope="col">Trích dẫn / Tài liệu<br>(2022–2025)</th>
    <th scope="col">Phân ngành, Quartile, Vị trí &amp; Phân vị Scopus<br>(2025 &amp; Tracker 2026)</th>
  </tr>`;

  $('#vast1-matrix-body').innerHTML=vast1.map(j=>{
    const inst=j.institution||{name:j.publisher,logo:'assets/images/logos/nxb.png',coPublisher:null,coLogo:null};
    const a25=annualRecord(j,2025),t26=trackerRecord(j);
    const scats=j.scopusCategories||[];
    const ratioCell=Number.isFinite(a25?.citations)&&Number.isFinite(a25?.documents)
      ?`${integer.format(a25.citations)} / ${integer.format(a25.documents)}`
      :(Number.isFinite(t26?.citations)&&Number.isFinite(t26?.documents)?`${integer.format(t26.citations)} / ${integer.format(t26.documents)} (T26)`:'N/A');
    const pctCell=scats.length
      ?scats.map(c=>{
        const a=c.annual2025,t=c.tracker2026;
        const label=c.parent?`${c.parent}: ${c.name}`:c.name;
        if(a){
          const aq=a.quartile||scopusQuartile(a.percentile);
          const tq=t?(t.quartile||scopusQuartile(t.percentile)):null;
          const tTxt=t?` · <span style="color:var(--muted)">T26: <strong>${esc(tq)}</strong> · ${t.percentile}% (${t.rank}/${t.total})</span>`:'';
          return `<div style="margin-bottom:4px"><strong>${esc(aq)}</strong> · <strong>${a.percentile}%</strong> · hạng <strong>${a.rank}/${a.total}</strong>${tTxt}<small style="display:block;color:var(--muted)">${esc(label)}</small></div>`;
        }
        if(t){
          const tq=t.quartile||scopusQuartile(t.percentile);
          return `<div style="margin-bottom:4px"><strong>Tracker 26: ${esc(tq)}</strong> · <strong>${t.percentile}%</strong> · hạng <strong>${t.rank}/${t.total}</strong><small style="display:block;color:var(--muted)">${esc(label)}</small></div>`;
        }
        return '';
      }).join('')
      :'—';
    const yearCells=years.map(y=>{
      const r=annualRecord(j,y);
      const val=r&&Number.isFinite(r.value)?oneDec.format(r.value):'—';
      const cls=y===2025?' class="matrix-score-annual"':'';
      const tip=r&&Number.isFinite(r.value)?`${j.code} (${y}): CiteScore ${oneDec.format(r.value)} (${integer.format(r.citations)} trích dẫn / ${integer.format(r.documents)} tài liệu)`:`${j.code} (${y}): Chưa có CiteScore`;
      return `<td${cls} title="${esc(tip)}">${val}</td>`;
    }).join('');

    const trackerVal=t26&&Number.isFinite(t26.value)?oneDec.format(t26.value):'—';
    return `<tr>
      <td>
        <div class="matrix-journal-cell">
          <a href="#journal/${esc(j.id)}"><img class="matrix-cover" src="${esc(coverUrl(j))}" alt="Bìa ${esc(j.code)}" width="40" height="58"></a>
          <div class="matrix-meta">
            <a href="#journal/${esc(j.id)}">${esc(j.code)} · ${esc(j.title)}</a>
            <div class="matrix-pub-row">
              <img class="mini-inst-logo" src="${esc(inst.logo)}" alt="${esc(inst.name)}">
              ${inst.coLogo?`<img class="mini-inst-logo" src="${esc(inst.coLogo)}" alt="${esc(inst.coPublisher||'')}">`:''}
              <span>${esc(inst.name)}${inst.coPublisher?` &amp; ${esc(inst.coPublisher)}`:''}</span>
            </div>
          </div>
        </div>
      </td>
      ${yearCells}
      <td class="matrix-score-tracker">${trackerVal}</td>
      <td>${ratioCell}</td>
      <td>${pctCell}</td>
    </tr>`;
  }).join('');
}

function renderVast1JcrTable(){
  const head=$('#vast1-jcr-head'),body=$('#vast1-jcr-body');
  if(!head||!body)return;
  const jcrJournals=dashboard.journals.filter(j=>j.jcr);
  head.innerHTML=`<tr>
    <th scope="col">Tạp chí VAST-1 (ESCI)</th>
    <th scope="col">JIF 2025<br>(2 năm)</th>
    <th scope="col">JIF không<br>tự trích dẫn</th>
    <th scope="col">Tử số / Mẫu số JIF<br>(2023–2024)</th>
    <th scope="col">5-Year<br>JIF</th>
    <th scope="col">JCI<br>2025</th>
    <th scope="col">Immediacy<br>Index</th>
    <th scope="col">Tổng trích dẫn<br>JCR 2025</th>
    <th scope="col">Xếp hạng &amp; Quartile JIF (JCR 2025)</th>
    <th scope="col">Xếp hạng &amp; Quartile JCI (JCR 2025)</th>
    <th scope="col">Clarivate JCR / Web of Science</th>
  </tr>`;
  body.innerHTML=jcrJournals.map(j=>{
    const jr=j.jcr;
    const jifCats=jr.categories.map(c=>`<div><strong>${esc(c.jif.quartile)}</strong> · hạng ${c.jif.rank}/${c.jif.total} (${oneDec.format(c.jif.percentile)}%)<small style="display:block;color:var(--muted)">${esc(c.name)}</small></div>`).join('');
    const jciCats=jr.categories.map(c=>`<div><strong>${esc(c.jci.quartile)}</strong> · hạng ${c.jci.rank}/${c.jci.total} (${twoDec.format(c.jci.percentile)}%)<small style="display:block;color:var(--muted)">${esc(c.name)}</small></div>`).join('');
    return `<tr>
      <td>
        <div class="matrix-journal-cell">
          <a href="#journal/${esc(j.id)}"><img class="matrix-cover" src="${esc(coverUrl(j))}" alt="Bìa ${esc(j.code)}" width="40" height="58"></a>
          <div class="matrix-meta">
            <a href="#journal/${esc(j.id)}">${esc(j.code)} · ${esc(j.title)}</a>
            <small style="display:block;color:var(--muted)">WoS Core Collection (${esc(jr.wosCollection)}) · ISSN: ${esc(j.issn||'—')} / ${esc(j.eissn||'—')}</small>
          </div>
        </div>
      </td>
      <td class="matrix-score-annual"><strong>${oneDec.format(jr.jif)}</strong></td>
      <td>${oneDec.format(jr.jifWithoutSelfCitations)}</td>
      <td>${integer.format(jr.jifNumerator)} / ${integer.format(jr.jifDenominator)}<small style="display:block;color:var(--muted)">Không tự TD: ${integer.format(jr.jifWithoutSelfNumerator)}/${integer.format(jr.jifDenominator)}</small></td>
      <td>${Number.isFinite(jr.fiveYearJif)?oneDec.format(jr.fiveYearJif):'—'}<small style="display:block;color:var(--muted)">${jr.fiveYearNumerator&&jr.fiveYearDenominator?`${integer.format(jr.fiveYearNumerator)}/${integer.format(jr.fiveYearDenominator)}`:''}</small></td>
      <td><strong>${twoDec.format(jr.jci)}</strong></td>
      <td>${Number.isFinite(jr.immediacyIndex)?oneDec.format(jr.immediacyIndex):'—'}<small style="display:block;color:var(--muted)">${jr.immediacyNumerator&&jr.immediacyDenominator?`${integer.format(jr.immediacyNumerator)}/${integer.format(jr.immediacyDenominator)}`:''}</small></td>
      <td><strong>${Number.isFinite(jr.totalCitations)?integer.format(jr.totalCitations):'—'}</strong><small style="display:block;color:var(--muted)">Cited half-life: ${jr.citedHalfLife} năm</small></td>
      <td>${jifCats}</td>
      <td>${jciCats}</td>
      <td>Clarivate JCR ${jr.metricYear}<br>${external(j.indexings.find(i=>i.system==='WoS'&&i.status==='listed').sourceUrl,'Xem chỉ mục trên Clarivate MJL')}</td>
    </tr>`;
  }).join('');
}


/* ==========================================================================
   5. SECTION 02: ARTCRAFT 4x3 JOURNAL LINEUP CARDS (NO TABLE LIST BELOW)
   ========================================================================== */
function populateControls(){
  const subjects=[...new Set(dashboard.journals.map(j=>j.subject))];
  $('#subject-filter').innerHTML='<option value="all">Tất cả lĩnh vực</option>'+subjects.map(s=>`<option value="${esc(s)}">${esc(s)}</option>`).join('');
  const allYears=[...scopus.annualYears,scopus.trackerYear].filter(y=>y>=CHART_START_YEAR);
  $('#trend-from').innerHTML=allYears.map(y=>`<option value="${y}">${y}</option>`).join('');
  $('#trend-to').innerHTML=allYears.map(y=>`<option value="${y}">${y}</option>`).join('');
  $('#trend-from').value=String(state.fromYear);
  $('#trend-to').value=String(state.toYear);
}

function fold(text){return String(text??'').normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLocaleLowerCase('vi-VN');}

function filteredJournals(){
  const q=fold(state.search.trim());
  const list=dashboard.journals.filter(j=>{
    if(q&&!fold([j.title,j.code,j.titleVi,j.group,j.issn,j.eissn,j.publisher,j.institution?.name,...(j.aliases??[]),...(j.formerTitles??[]).map(t=>t.title)].join(' ')).includes(q))return false;
    if(state.subject!=='all'&&j.subject!==state.subject)return false;
    if(state.index==='all')return true;
    if(state.index==='VAST-1'||state.index==='VAST-2')return j.group===state.index;
    if(state.index==='WoS')return j.indexings.some(i=>i.system==='WoS'&&i.status==='listed'&&['SCIE','SSCI','AHCI','ESCI','Core Collection'].includes(i.collection));
    return j.indexings.some(i=>i.system===state.index&&i.status==='listed');
  });
  const totalHistPapers=j=>statisticalHistory(j).reduce((s,r)=>s+(r.papers||0),0);
  const scoreSort=j=>j.group==='VAST-1'?(annualRecord(j,2025)?.value??trackerRecord(j)?.value??-1):(localScore(j,2025)?.score??-1);
  if(state.sort==='name')list.sort((a,b)=>a.title.localeCompare(b.title,'en'));
  if(state.sort==='papers')list.sort((a,b)=>totalHistPapers(b)-totalHistPapers(a)||a.order-b.order);
  if(state.sort==='citescore')list.sort((a,b)=>scoreSort(b)-scoreSort(a)||a.order-b.order);
  if(state.sort==='default')list.sort((a,b)=>a.order-b.order);
  return list;
}

function renderCatalog(){
  const rows=filteredJournals();
  const statusEl=$('#Filter-status');
  if(statusEl)statusEl.textContent=`HIỂN THỊ ${rows.length} / ${dashboard.journals.length} TẠP CHÍ`;

  $('#artcraft-lineup-grid').innerHTML=rows.map(j=>{
    const st=styles[j.id]||{color:'#2d81ff'};
    const num=String(j.order).padStart(2,'0');
    const inst=j.institution||{name:j.publisher,logo:'assets/images/logos/nxb.png',coPublisher:null,coLogo:null};
    const publisherName=inst.name==='NXB Khoa học tự nhiên và Công nghệ'?'<span class="publisher-name-line">NXB Khoa học tự nhiên</span><br><span class="publisher-name-line">và Công nghệ</span>':esc(inst.name);
    const a25=annualRecord(j,2025),t26=trackerRecord(j);
    const loc25=localScore(j,2025),loc26=localScore(j,2026);

    const topScopus25=j.scopusCategories?.find(c=>c.annual2025)?.annual2025||null;
    const topScopusT26=j.scopusCategories?.[0]?.tracker2026||null;
    const m1Label=j.group==='VAST-1'?'CiteScore 25':'CiteScore 2025 (tự tính)';
    const m1Val=j.group==='VAST-1'?(Number.isFinite(a25?.value)?`${oneDec.format(a25.value)}${topScopus25?` (${topScopus25.quartile||scopusQuartile(topScopus25.percentile)})`:''}`:'N/A'):(loc25?twoDec.format(loc25.score)+'*':'N/A');
    const m2Label=j.jcr?'JIF 25 (WoS)':(j.group==='VAST-1'?'Tracker 26':'CiteScore 2026 (tự tính)');
    const m2Val=j.jcr?`${oneDec.format(j.jcr.jif)} (${j.jcr.categories[0].jif.quartile})`:(j.group==='VAST-1'?(Number.isFinite(t26?.value)?`${oneDec.format(t26.value)}${topScopusT26?` (${topScopusT26.quartile||scopusQuartile(topScopusT26.percentile)})`:''}`:'N/A'):(loc26?twoDec.format(loc26.score)+'*':'N/A'));
    const m3Val=j.jcr?(Number.isFinite(t26?.value)?`${oneDec.format(t26.value)}${topScopusT26?` (${topScopusT26.quartile||scopusQuartile(topScopusT26.percentile)})`:''}`:'N/A'):null;

    return `<article class="lineup-card">
      <div class="lineup-card-top">
        <span class="lineup-num" style="background:${st.color}">${num}</span>
        <span>${esc(j.group)} · ${esc(j.subject)}</span>
      </div>
      <div class="lineup-stage">
        <a class="lineup-cover-link" href="#journal/${esc(j.id)}" aria-label="Xem hồ sơ và biểu đồ lịch sử của ${esc(j.title)}">
          <img class="lineup-cover" src="${esc(coverUrl(j))}" alt="Bìa tạp chí ${esc(j.title)}" width="102" height="148">
        </a>
        <div class="lineup-logos">
          <div class="lineup-inst-badge">
            <div class="lineup-inst-logos">
              <img src="${esc(inst.logo)}" alt="${esc(inst.name)}" title="${esc(inst.name)}">
              ${inst.coLogo?`<img src="${esc(inst.coLogo)}" alt="${esc(inst.coPublisher||'')}" title="${esc(inst.coPublisher||'')}">`:''}
            </div>
            <span class="lineup-inst-name">${publisherName}${inst.coPublisher?`<br>&amp; ${esc(inst.coPublisher)}`:''}</span>
          </div>
        </div>
      </div>
      <div class="lineup-body">
        <div>
          <h3 class="lineup-title"><a href="#journal/${esc(j.id)}">${esc(j.title)} <span class="lineup-code">(${esc(j.code)})</span></a></h3>
          ${j.titleVi&&j.titleVi!==j.title?`<p class="lineup-vi">${esc(j.titleVi)}</p>`:''}
        </div>
        <div>
          <div class="lineup-metrics${j.jcr?' has-third-metric':''}">
            <div class="lineup-metric-cell"><span>${esc(m1Label)}</span><strong>${esc(m1Val)}</strong></div>
            <div class="lineup-metric-cell"><span>${esc(m2Label)}</span><strong>${esc(m2Val)}</strong></div>
            ${j.jcr?`<div class="lineup-metric-cell"><span>Tracker 26</span><strong>${esc(m3Val)}</strong></div>`:''}
          </div>
          <div class="lineup-tags">${indexingBadges(j)}</div>
          <a class="lineup-explore" href="#journal/${esc(j.id)}">Xem chi tiết</a>
        </div>
      </div>
    </article>`;
  }).join('');
}

/* ==========================================================================
   6. INTERACTIVE CHARTS 1–4 IN SECTION 01
   ========================================================================== */
function scopusJournals(){
  return dashboard.journals.filter(j=>scopus.journals.some(s=>s.code===j.code));
}
function candidateJournals(){
  return dashboard.journals.filter(j=>j.group==='VAST-2'&&j.localCitation?.selfCalculatedSeries?.length);
}
function citationJournals(){
  if(state.citationMode==='scopus-cited-by'){
    return dashboard.journals.filter(j=>j.scopusCitedBy&&(state.citationGroup==='all'||j.group===state.citationGroup));
  }
  if(state.citationMode==='scopus-window'){
    return scopusJournals().filter(j=>state.citationGroup==='all'||j.group===state.citationGroup);
  }
  return dashboard.journals.filter(j=>j.localCitation?.citationSeries?.length&&(state.citationGroup==='all'||j.group===state.citationGroup));
}

function buildLegend(containerSelector,journalsList,selectedSet,onChange){
  const el=$(containerSelector);
  if(!el)return;
  el.innerHTML=journalsList.map(j=>{
    const st=styles[j.id]||{color:'#2d81ff',dash:'',marker:'circle'};
    const dash=st.dash?`stroke-dasharray="${st.dash}"`:'';
    const pressed=selectedSet.has(j.id);
    return`<button class="journal-toggle" type="button" data-id="${esc(j.id)}" aria-pressed="${pressed}" title="${esc(fullName(j))}">
      <svg viewBox="0 0 20 12" aria-hidden="true"><line x1="1" y1="6" x2="19" y2="6" stroke="${st.color}" stroke-width="2.4" ${dash}/>${markerShape(st.marker,10,6,3.1,st.color)}</svg>
      <span class="legend-label" translate="no">${esc(j.code)}</span>
    </button>`;
  }).join('');
  for(const btn of el.querySelectorAll('.journal-toggle')){
    btn.addEventListener('click',()=>{
      const id=btn.dataset.id;
      if(selectedSet.has(id)&&selectedSet.size>1)selectedSet.delete(id);
      else selectedSet.add(id);
      onChange();
    });
  }
}

function renderLegend(){
  buildLegend('#trend-legend',scopusJournals(),state.selected,()=>{renderLegend();renderChart();});
}

function currentTrendYears(){
  const all=[...scopus.annualYears,scopus.trackerYear];
  const a=Math.max(CHART_START_YEAR,Math.min(state.fromYear,state.toYear)),b=Math.max(state.fromYear,state.toYear);
  return all.filter(y=>y>=a&&y<=b);
}

function renderChart(){
  const svg=$('#trend-chart');
  if(!svg||!dashboard)return;
  const years=currentTrendYears();
  const journals=scopusJournals().filter(j=>state.selected.has(j.id));
  const m=metricInfo[state.metric];
  const values=[];
  for(const j of journals)for(const y of years){const v=observation(j,state.metric,y).value;if(Number.isFinite(v))values.push(v);}
  const scale=niceScale(values.length?Math.max(...values):1);
  const width=820,height=360,plot={left:56,right:80,top:24,bottom:44};
  plot.width=width-plot.left-plot.right;plot.height=height-plot.top-plot.bottom;
  const x=idx=>years.length===1?plot.left+plot.width/2:plot.left+idx*(plot.width/(years.length-1));
  const y=v=>plot.top+plot.height-(v/scale.max)*plot.height;

  let out=`<title id="chart-title">${esc(m.label)} (${years[0]}–${years.at(-1)})</title><desc id="chart-desc">Biểu đồ đường tương tác theo năm của 7 tạp chí VAST-1.</desc>`;
  if(years.includes(scopus.trackerYear)&&years.length>1){
    const idx=years.indexOf(scopus.trackerYear),leftX=x(idx)-(x(idx)-x(idx-1))/2;
    out+=`<rect x="${leftX.toFixed(1)}" y="${plot.top}" width="${(plot.left+plot.width-leftX).toFixed(1)}" height="${plot.height}" fill="var(--bg-sunken)" opacity="0.65"/><text x="${(leftX+6).toFixed(1)}" y="${plot.top+14}" fill="var(--muted)" font-size="10.5">Tracker ${scopus.trackerYear}</text>`;
  }
  for(let tick=0;tick<=scale.max+scale.step/2;tick+=scale.step){
    const py=y(tick);
    if(py<plot.top-1)break;
    out+=`<line x1="${plot.left}" y1="${py.toFixed(1)}" x2="${plot.left+plot.width}" y2="${py.toFixed(1)}" stroke="var(--line)"/><text x="${plot.left-10}" y="${(py+4).toFixed(1)}" text-anchor="end" fill="var(--muted)" font-size="11.5">${esc(formatAxisTick(tick,m.decimals))}</text>`;
  }
  years.forEach((yr,idx)=>{
    const px=x(idx);
    out+=`<text x="${px.toFixed(1)}" y="${height-14}" text-anchor="middle" fill="var(--muted)" font-size="11.5">${yr===scopus.trackerYear?yr+'*':yr}</text>`;
  });

  const endLabels=[];
  for(const j of journals){
    const st=styles[j.id],pts=[];
    years.forEach((yr,idx)=>{
      const obs=observation(j,state.metric,yr);
      if(Number.isFinite(obs.value))pts.push({yr,px:x(idx),py:y(obs.value),...obs});
    });
    if(!pts.length)continue;
    let group=`<g class="journal-series" data-id="${esc(j.id)}">`;
    for(let i=1;i<pts.length;i++){
      const a=pts[i-1],b=pts[i];
      if(years.indexOf(b.yr)-years.indexOf(a.yr)!==1)continue;
      const dash=b.isProvisional?'4 4':st.dash;
      group+=`<line x1="${a.px.toFixed(1)}" y1="${a.py.toFixed(1)}" x2="${b.px.toFixed(1)}" y2="${b.py.toFixed(1)}" stroke="${st.color}" stroke-width="2.4" ${dash?`stroke-dasharray="${dash}"`:''}/>`;
    }
    for(const pt of pts){
      group+=markerShape(st.marker,pt.px,pt.py,pt.isProvisional?4.2:3.5,pt.isProvisional?'var(--bg)':st.color,st.color);
    }
    group+='</g>';
    out+=group;
    const last=pts.at(-1);
    endLabels.push({code:j.code,color:st.color,y:last.py,text:`${j.code} ${formatValue(last.value)}`});
  }
  endLabels.sort((a,b)=>a.y-b.y);
  for(let i=1;i<endLabels.length;i++)if(endLabels[i].y-endLabels[i-1].y<14)endLabels[i].y=endLabels[i-1].y+14;
  for(const l of endLabels){
    const py=Math.min(plot.top+plot.height,Math.max(plot.top+8,l.y));
    out+=`<text x="${plot.left+plot.width+8}" y="${(py+4).toFixed(1)}" fill="${l.color}" font-size="11" font-weight="600">${esc(l.text)}</text>`;
  }
  out+=`<line id="hover-line" x1="0" y1="${plot.top}" x2="0" y2="${plot.top+plot.height}" stroke="var(--ink)" stroke-dasharray="3 3" hidden/><rect id="chart-hitbox" x="${plot.left}" y="${plot.top}" width="${plot.width}" height="${plot.height}" fill="transparent"/>`;
  svg.innerHTML=out;
  $('#trend-caption').textContent=`* Tracker 2026 (${formatDate(dashboard.officialScopus.trackerSourceUpdatedAt)}).`;
  bindChartEvents(svg,years,x,plot);
  if(state.activeYear&&years.includes(state.activeYear))showYearTooltip(state.activeYear,years,x,plot);
  else hideTooltip();
}


function bindChartEvents(svg,years,x,plot){
  const idxFromEvent=e=>{
    const r=svg.getBoundingClientRect();
    const px=((e.clientX-r.left)/r.width)*820;
    const ratio=Math.max(0,Math.min(1,(px-plot.left)/Math.max(1,plot.width)));
    return Math.round(ratio*(years.length-1));
  };
  svg.onpointermove=e=>{
    if(state.pinnedYear)return;
    state.activeYear=years[idxFromEvent(e)];
    showYearTooltip(state.activeYear,years,x,plot);
  };
  svg.onpointerleave=()=>{
    if(!state.pinnedYear){state.activeYear=null;hideTooltip();}
  };
  svg.onclick=e=>{
    const yr=years[idxFromEvent(e)];
    state.pinnedYear=state.pinnedYear===yr?null:yr;
    state.activeYear=yr;
    showYearTooltip(yr,years,x,plot);
  };
}

function showYearTooltip(year,years,x,plot){
  const idx=years.indexOf(year);
  if(idx<0)return;
  const px=x(idx),line=$('#hover-line'),tip=$('#chart-tooltip');
  if(line){line.setAttribute('x1',px.toFixed(1));line.setAttribute('x2',px.toFixed(1));line.hidden=false;}
  $('#tooltip-year').textContent=year===scopus.trackerYear?`Năm ${year} (Tracker)`:`Năm ${year}`;
  const rows=scopusJournals().filter(j=>state.selected.has(j.id)).map(j=>({j,obs:observation(j,state.metric,year)})).sort((a,b)=>(b.obs.value??-1)-(a.obs.value??-1));
  $('#tooltip-values').innerHTML=rows.map(({j,obs})=>{
    const st=styles[j.id];
    const ratio=obs.record&&Number.isFinite(obs.record.citations)&&Number.isFinite(obs.record.documents)?` (${integer.format(obs.record.citations)}/${integer.format(obs.record.documents)})`:'';
    return`<div class="tooltip-row"><dt><span class="tooltip-dot" style="background:${st.color}"></span>${esc(j.code)}</dt><dd>${esc(formatValue(obs.value)+ratio)}</dd></div>`;
  }).join('');
  $('#tooltip-note').textContent=year===scopus.trackerYear?`CiteScore Tracker cập nhật ngày ${formatDate(dashboard.officialScopus.trackerSourceUpdatedAt)}.`:'CiteScore chính thức theo năm của Scopus.';
  tip.hidden=false;
  const area=$('.chart-area').getBoundingClientRect();
  const left=(px/820)*area.width;
  tip.style.left=`${Math.max(12,Math.min(area.width-tip.offsetWidth-12,left+16))}px`;
}

function hideTooltip(){
  const line=$('#hover-line');if(line)line.hidden=true;
  const tip=$('#chart-tooltip');if(tip)tip.hidden=true;
}

/* CHART 2: VAST-2 PROJECTED CITESCORE */
function renderCandidatesSection(){
  const cands=candidateJournals();
  buildLegend('#candidates-legend',cands,state.selectedCandidates,()=>{renderCandidatesSection();});
  const svg=$('#candidates-chart');
  if(!svg)return;
  const years=[2015,2016,2017,2018,2019,2020,2021,2022,2023,2024,2025,2026];
  const active=cands.filter(j=>state.selectedCandidates.has(j.id));
  const vals=[0.8];
  for(const j of active)for(const r of j.localCitation?.selfCalculatedSeries||[]){if(r.year<CHART_START_YEAR)continue;const s=r.score??r.value;if(Number.isFinite(s))vals.push(s);}
  const scale=niceScale(Math.max(...vals));
  const width=820,height=350,plot={left:56,right:84,top:24,bottom:42};
  plot.width=width-plot.left-plot.right;plot.height=height-plot.top-plot.bottom;
  const x=idx=>plot.left+idx*(plot.width/(years.length-1));
  const y=v=>plot.top+plot.height-(v/scale.max)*plot.height;

  let out='';
  const x25=x(years.indexOf(2025)),x26=x(years.indexOf(2026)),splitX=(x25+x26)/2;
  out+=`<rect x="${splitX.toFixed(1)}" y="${plot.top}" width="${(plot.left+plot.width-splitX).toFixed(1)}" height="${plot.height}" fill="var(--bg-sunken)" opacity="0.65"/><text x="${(splitX+5).toFixed(1)}" y="${plot.top+14}" fill="var(--muted)" font-size="10">2026 YTD</text>`;

  for(let tick=0;tick<=scale.max+scale.step/2;tick+=scale.step){
    const py=y(tick);
    if(py<plot.top-1)break;
    out+=`<line x1="${plot.left}" y1="${py.toFixed(1)}" x2="${plot.left+plot.width}" y2="${py.toFixed(1)}" stroke="var(--line)"/><text x="${plot.left-10}" y="${(py+4).toFixed(1)}" text-anchor="end" fill="var(--muted)" font-size="11.5">${esc(twoDec.format(tick))}</text>`;
  }
  years.forEach((yr,idx)=>{
    out+=`<text x="${x(idx).toFixed(1)}" y="${height-14}" text-anchor="middle" fill="var(--muted)" font-size="11.5">${yr===2026?'2026*':yr}</text>`;
  });

  if(state.showCipBenchmark){
    const py70=y(0.7);
    if(py70>=plot.top&&py70<=plot.top+plot.height){
      out+=`<line x1="${plot.left}" y1="${py70.toFixed(1)}" x2="${plot.left+plot.width}" y2="${py70.toFixed(1)}" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="5 4"/><text x="${plot.left+8}" y="${(py70-6).toFixed(1)}" fill="var(--accent-ink)" font-size="10.5" font-weight="600">Mốc CIP Tracker 2026 (0,70 · 97/130)</text>`;
    }
  }

  const endLabels=[];
  for(const j of active){
    const st=styles[j.id],pts=[];
    years.forEach((yr,idx)=>{
      const rec=localScore(j,yr);
      if(rec&&Number.isFinite(rec.score))pts.push({yr,px:x(idx),py:y(rec.score),rec});
    });
    if(!pts.length)continue;
    let g=`<g class="journal-series" data-id="${esc(j.id)}">`;
    for(let i=1;i<pts.length;i++){
      const a=pts[i-1],b=pts[i];
      const dash=b.yr===2026?'4 4':st.dash;
      g+=`<line x1="${a.px.toFixed(1)}" y1="${a.py.toFixed(1)}" x2="${b.px.toFixed(1)}" y2="${b.py.toFixed(1)}" stroke="${st.color}" stroke-width="2.4" ${dash?`stroke-dasharray="${dash}"`:''}/>`;
    }
    for(const pt of pts){
      g+=markerShape(st.marker,pt.px,pt.py,pt.yr===2026?4.1:3.4,pt.yr===2026?'var(--bg)':st.color,st.color);
    }
    g+='</g>';
    out+=g;
    const last=pts.at(-1);
    endLabels.push({code:j.code,color:st.color,y:last.py,text:`${j.code} ${twoDec.format(last.rec.score)}`});
  }
  endLabels.sort((a,b)=>a.y-b.y);
  for(let i=1;i<endLabels.length;i++)if(endLabels[i].y-endLabels[i-1].y<14)endLabels[i].y=endLabels[i-1].y+14;
  for(const l of endLabels){
    const py=Math.min(plot.top+plot.height,Math.max(plot.top+8,l.y));
    out+=`<text x="${plot.left+plot.width+8}" y="${(py+4).toFixed(1)}" fill="${l.color}" font-size="11" font-weight="600">${esc(l.text)}</text>`;
  }
  out+=`<line id="candidates-hover-line" x1="0" y1="${plot.top}" x2="0" y2="${plot.top+plot.height}" stroke="var(--ink)" stroke-dasharray="3 3" hidden/><rect x="${plot.left}" y="${plot.top}" width="${plot.width}" height="${plot.height}" fill="transparent"/>`;
  svg.innerHTML=out;

  const showYr=yr=>{
    const idx=years.indexOf(yr);if(idx<0)return;
    const px=x(idx),ln=$('#candidates-hover-line'),tip=$('#candidates-tooltip');
    if(ln){ln.setAttribute('x1',px.toFixed(1));ln.setAttribute('x2',px.toFixed(1));ln.hidden=false;}
    $('#candidates-tooltip-year').textContent=`Năm ${yr} (${yr-3}–${yr})`;
    const rows=active.map(j=>({j,rec:localScore(j,yr)})).sort((a,b)=>(b.rec?.score??-1)-(a.rec?.score??-1));
    $('#candidates-tooltip-values').innerHTML=rows.map(({j,rec})=>{
      const st=styles[j.id];
      const txt=rec?`${twoDec.format(rec.score)} (${integer.format(rec.numerator)}/${integer.format(rec.denominator)})`:'N/A';
      return`<div class="tooltip-row"><dt><span class="tooltip-dot" style="background:${st.color}"></span>${esc(j.code)}</dt><dd>${esc(txt)}</dd></div>`;
    }).join('');
    tip.hidden=false;
    const area=svg.parentElement.getBoundingClientRect();
    const left=(px/820)*area.width;
    tip.style.left=`${Math.max(12,Math.min(area.width-tip.offsetWidth-12,left+16))}px`;
  };
  svg.onpointermove=e=>{
    const r=svg.getBoundingClientRect(),px=((e.clientX-r.left)/r.width)*820;
    const idx=Math.round(Math.max(0,Math.min(1,(px-plot.left)/plot.width))*(years.length-1));
    showYr(years[idx]);
  };
  svg.onpointerleave=()=>{
    const ln=$('#candidates-hover-line'),tip=$('#candidates-tooltip');
    if(ln)ln.hidden=true;if(tip)tip.hidden=true;
  };

}

/* CHART 3: CITATIONS */
function renderCitationsSection(){
  const list=citationJournals();
  for(const j of list)if(!state.selectedCitations.size)state.selectedCitations.add(j.id);
  buildLegend('#citations-legend',list,state.selectedCitations,()=>{renderCitationsSection();});
  const svg=$('#citations-chart');
  if(!svg)return;
  const years=[2015,2016,2017,2018,2019,2020,2021,2022,2023,2024,2025,2026];
  const active=list.filter(j=>state.selectedCitations.has(j.id));
  const getVal=(j,yr)=>{
    if(state.citationMode==='scopus-cited-by'){
      if(yr<statisticalStartYear(j))return null;
      const c=j.scopusCitedBy?.citationSeries?.find(r=>r.year===yr);
      return c?c.citingDocuments:null;
    }
    if(state.citationMode==='scopus-window'){
      const r=scopusRecord(j,yr);
      return r&&Number.isFinite(r.citations)?r.citations:null;
    }
    const c=j.localCitation?.citationSeries?.find(r=>r.year===yr);
    if(!c)return null;
    return state.citationMode==='local-docs'?c.citingDocuments:c.confirmedCitationEdges;
  };
  const vals=[];
  for(const j of active)for(const yr of years){const v=getVal(j,yr);if(Number.isFinite(v))vals.push(v);}
  const scale=niceScale(vals.length?Math.max(...vals):10);
  const width=820,height=350,plot={left:60,right:88,top:24,bottom:42};
  plot.width=width-plot.left-plot.right;plot.height=height-plot.top-plot.bottom;
  const x=idx=>plot.left+idx*(plot.width/(years.length-1));
  const y=v=>plot.top+plot.height-(v/scale.max)*plot.height;

  let out='';
  for(let tick=0;tick<=scale.max+scale.step/2;tick+=scale.step){
    const py=y(tick);
    if(py<plot.top-1)break;
    out+=`<line x1="${plot.left}" y1="${py.toFixed(1)}" x2="${plot.left+plot.width}" y2="${py.toFixed(1)}" stroke="var(--line)"/><text x="${plot.left-10}" y="${(py+4).toFixed(1)}" text-anchor="end" fill="var(--muted)" font-size="11.5">${esc(integer.format(tick))}</text>`;
  }
  years.forEach((yr,idx)=>{
    out+=`<text x="${x(idx).toFixed(1)}" y="${height-14}" text-anchor="middle" fill="var(--muted)" font-size="11.5">${yr===2026?'2026*':yr}</text>`;
  });

  const endLabels=[];
  for(const j of active){
    const st=styles[j.id],pts=[];
    years.forEach((yr,idx)=>{
      const v=getVal(j,yr);
      if(Number.isFinite(v))pts.push({yr,px:x(idx),py:y(v),v});
    });
    if(!pts.length)continue;
    let g=`<g class="journal-series" data-id="${esc(j.id)}">`;
    for(let i=1;i<pts.length;i++){
      const a=pts[i-1],b=pts[i];
      if(years.indexOf(b.yr)-years.indexOf(a.yr)!==1)continue;
      const dash=b.yr===2026?'4 4':st.dash;
      g+=`<line x1="${a.px.toFixed(1)}" y1="${a.py.toFixed(1)}" x2="${b.px.toFixed(1)}" y2="${b.py.toFixed(1)}" stroke="${st.color}" stroke-width="2.3" ${dash?`stroke-dasharray="${dash}"`:''}/>`;
    }
    for(const pt of pts){
      g+=markerShape(st.marker,pt.px,pt.py,3.3,pt.yr===2026?'var(--bg)':st.color,st.color);
    }
    g+='</g>';
    out+=g;
    const last=pts.at(-1);
    endLabels.push({code:j.code,color:st.color,y:last.py,text:`${j.code} ${integer.format(last.v)}`});
  }
  endLabels.sort((a,b)=>a.y-b.y);
  for(let i=1;i<endLabels.length;i++)if(endLabels[i].y-endLabels[i-1].y<14)endLabels[i].y=endLabels[i-1].y+14;
  if(endLabels.length){
    endLabels.at(-1).y=Math.min(plot.top+plot.height,endLabels.at(-1).y);
    for(let i=endLabels.length-2;i>=0;i--)endLabels[i].y=Math.min(endLabels[i].y,endLabels[i+1].y-14);
  }
  for(const l of endLabels){
    const py=Math.min(plot.top+plot.height,Math.max(plot.top+8,l.y));
    out+=`<text x="${plot.left+plot.width+8}" y="${(py+4).toFixed(1)}" fill="${l.color}" font-size="11" font-weight="600">${esc(l.text)}</text>`;
  }
  out+=`<line id="citations-hover-line" x1="0" y1="${plot.top}" x2="0" y2="${plot.top+plot.height}" stroke="var(--ink)" stroke-dasharray="3 3" hidden/><rect x="${plot.left}" y="${plot.top}" width="${plot.width}" height="${plot.height}" fill="transparent"/>`;
  svg.innerHTML=out;

  let modeLabel='';
  if(state.citationMode==='scopus-cited-by'){
    const colDate=dashboard.scopusCitedBy.collectedAt;
    modeLabel=`Tài liệu trích dẫn theo năm xuất bản · Scopus · Cập nhật ${colDate}. Số liệu 2026 chưa đầy đủ`;
  }else if(state.citationMode==='scopus-window'){
    modeLabel='Trích dẫn trong cửa sổ CiteScore 4 năm chính thức của Scopus (84 bản ghi cơ sở 2015–2025 và Tracker 2026)';
  }else if(state.citationMode==='local-docs'){
    modeLabel='Tài liệu trích dẫn theo năm (dữ liệu rà soát OJS · 9 tạp chí)';
  }else{
    modeLabel='Lượt trích dẫn theo năm (dữ liệu rà soát OJS · 9 tạp chí)';
  }
  $('#citations-caption').textContent=`${modeLabel}.`;

  svg.onpointermove=e=>{
    const r=svg.getBoundingClientRect(),px=((e.clientX-r.left)/r.width)*820;
    const idx=Math.round(Math.max(0,Math.min(1,(px-plot.left)/plot.width))*(years.length-1));
    const yr=years[idx],ln=$('#citations-hover-line'),tip=$('#citations-tooltip');
    if(ln){ln.setAttribute('x1',x(idx).toFixed(1));ln.setAttribute('x2',x(idx).toFixed(1));ln.hidden=false;}
    $('#citations-tooltip-year').textContent=`Năm ${yr}`;
    const rows=active.map(j=>({j,v:getVal(j,yr)})).sort((a,b)=>(b.v??-1)-(a.v??-1));
    $('#citations-tooltip-values').innerHTML=rows.map(({j,v})=>`<div class="tooltip-row"><dt><span class="tooltip-dot" style="background:${styles[j.id]?.color}"></span>${esc(j.code)}</dt><dd>${Number.isFinite(v)?integer.format(v):'N/A'}</dd></div>`).join('');
    tip.hidden=false;
    const area=svg.parentElement.getBoundingClientRect();
    const left=(x(idx)/820)*area.width;
    tip.style.left=`${Math.max(12,Math.min(area.width-tip.offsetWidth-12,left+16))}px`;
  };
  svg.onpointerleave=()=>{
    const ln=$('#citations-hover-line'),tip=$('#citations-tooltip');
    if(ln)ln.hidden=true;if(tip)tip.hidden=true;
  };

}

/* CHART 4: PUBLISHED PAPERS */
function renderPapersSection(){
  const svg=$('#papers-chart');
  if(!svg||!dashboard)return;
  const years=[...new Set(dashboard.journals.flatMap(j=>statisticalHistory(j).map(r=>r.year)))].sort((a,b)=>a-b);
  const journals=dashboard.journals.filter(j=>state.papersGroup==='all'||j.group===state.papersGroup);
  const extraColors=document.documentElement.dataset.theme==='dark'
    ?{vjmech:'#df59ff',jcc:'#e6c654',ajb:'#b5d47a',vjmst:'#d7b28c',vjbt:'#9aaed7'}
    :{vjmech:'#c6009c',jcc:'#b08900',ajb:'#5c940d',vjmst:'#8d5a3b',vjbt:'#7286b8'};
  const colorFor=j=>extraColors[j.id]||styles[j.id].color;
  $('#papers-legend').innerHTML=journals.map(j=>`<span class="papers-legend-item" role="listitem" title="${esc(fullName(j))}"><span class="papers-swatch" style="background:${colorFor(j)}" aria-hidden="true"></span><span translate="no">${esc(j.code)}</span></span>`).join('');
  const yearTotals=years.map(yr=>{
    const rows=journals.map(j=>({j,papers:historyRecord(j,yr)?.papers}));
    return{yr,totalPapers:rows.reduce((s,r)=>s+(Number.isFinite(r.papers)?r.papers:0),0),rows};
  });
  const scale=niceScale(Math.max(50,...yearTotals.map(t=>t.totalPapers)));
  const width=820,height=350,plot={left:60,right:40,top:28,bottom:44};
  plot.width=width-plot.left-plot.right;plot.height=height-plot.top-plot.bottom;
  const slot=plot.width/years.length,barW=Math.min(58,slot*0.56);
  const xCenter=idx=>plot.left+(idx+0.5)*slot;
  const y=v=>plot.top+plot.height-(v/scale.max)*plot.height;

  let out='';
  for(let tick=0;tick<=scale.max+scale.step/2;tick+=scale.step){
    const py=y(tick);
    if(py<plot.top-1)break;
    out+=`<line x1="${plot.left}" y1="${py.toFixed(1)}" x2="${plot.left+plot.width}" y2="${py.toFixed(1)}" stroke="var(--line)"/><text x="${plot.left-10}" y="${(py+4).toFixed(1)}" text-anchor="end" fill="var(--muted)" font-size="11.5">${esc(integer.format(tick))}</text>`;
  }
  out+=`<rect x="${plot.left}" y="${plot.top}" width="${plot.width}" height="${plot.height}" fill="transparent"/>`;
  yearTotals.forEach((t,idx)=>{
    const cx=xCenter(idx),bx=cx-barW/2,py=y(t.totalPapers);
    const isFocus=t.yr===Number(state.papersFocusYear);
    let cumulative=0;
    out+=`<g class="year-bar" data-year="${t.yr}">`;
    for(const {j,papers} of t.rows){
      if(!Number.isFinite(papers)||papers<=0)continue;
      const top=y(cumulative+papers),segmentHeight=y(cumulative)-top;
      out+=`<rect class="paper-segment" data-journal="${esc(j.id)}" data-papers="${papers}" x="${bx.toFixed(1)}" y="${top.toFixed(2)}" width="${barW.toFixed(1)}" height="${segmentHeight.toFixed(2)}" fill="${colorFor(j)}" opacity="${t.yr===2026?'0.7':'1'}"><title>${esc(j.code)}: ${integer.format(papers)} bài (${t.yr})</title></rect>`;
      cumulative+=papers;
    }
    if(isFocus)out+=`<rect class="papers-focus-outline" x="${(bx-2).toFixed(1)}" y="${(py-2).toFixed(1)}" width="${(barW+4).toFixed(1)}" height="${(y(0)-py+4).toFixed(1)}" fill="none" stroke="var(--ink-strong)" stroke-width="1.5" pointer-events="none"/>`;
    out+=`<text x="${cx.toFixed(1)}" y="${(py-7).toFixed(1)}" text-anchor="middle" fill="var(--ink-strong)" font-size="11.5" font-weight="600">${integer.format(t.totalPapers)}</text>
      <text x="${cx.toFixed(1)}" y="${height-14}" text-anchor="middle" fill="${isFocus?'var(--accent-ink)':'var(--muted)'}" font-weight="${isFocus?'700':'400'}" font-size="11.5">${t.yr===2026?'2026*':t.yr}</text></g>`;
  });
  svg.innerHTML=out;

  const tip=$('#papers-tooltip');
  let pinnedIndex=null,activeIndex=Math.max(0,years.indexOf(Number(state.papersFocusYear)));
  tip.hidden=true;
  const showYear=(idx,clientX)=>{
    activeIndex=idx;
    const t=yearTotals[idx];
    $('#papers-tooltip-year').textContent=`Năm ${t.yr}${t.yr===2026?' (chưa đủ năm)':''}`;
    $('#papers-tooltip-values').innerHTML=t.rows.map(({j,papers})=>`<div class="tooltip-row"><dt><span class="tooltip-dot" style="background:${colorFor(j)}"></span>${esc(j.code)}</dt><dd>${Number.isFinite(papers)?`${integer.format(papers)} bài`:'—'}</dd></div>`).join('')
      +`<div class="tooltip-row"><dt><strong>Tổng</strong></dt><dd>${integer.format(t.totalPapers)} bài</dd></div>`;
    tip.hidden=false;
    tip.style.pointerEvents=pinnedIndex===null?'none':'auto';
    $('#close-papers-tooltip').hidden=pinnedIndex===null;
    const area=svg.parentElement.getBoundingClientRect();
    const anchor=Number.isFinite(clientX)?clientX-area.left:(xCenter(idx)/width)*area.width;
    const left=anchor+tip.offsetWidth+28<=area.width?anchor+16:anchor-tip.offsetWidth-16;
    tip.style.left=`${Math.max(12,Math.min(area.width-tip.offsetWidth-12,left))}px`;
  };
  const indexFromEvent=e=>{
    const r=svg.getBoundingClientRect(),px=(e.clientX-r.left)/r.width*width;
    return Math.max(0,Math.min(years.length-1,Math.floor((px-plot.left)/slot)));
  };
  svg.onpointermove=e=>{if(pinnedIndex===null)showYear(indexFromEvent(e),e.clientX);};
  svg.onpointerleave=()=>{if(pinnedIndex===null)tip.hidden=true;};
  svg.onclick=e=>{
    const idx=indexFromEvent(e);
    if(pinnedIndex===idx){pinnedIndex=null;tip.hidden=true;}
    else{pinnedIndex=idx;showYear(idx,e.clientX);}
  };
  svg.onkeydown=e=>{
    if(e.key==='Escape'){pinnedIndex=null;tip.hidden=true;return;}
    const idx=e.key==='ArrowLeft'?Math.max(0,activeIndex-1):e.key==='ArrowRight'?Math.min(years.length-1,activeIndex+1):e.key==='Home'?0:e.key==='End'?years.length-1:null;
    if(idx===null)return;
    e.preventDefault();pinnedIndex=idx;showYear(idx);
  };
  $('#close-papers-tooltip').onclick=()=>{pinnedIndex=null;tip.hidden=true;};
}

function renderAllCharts(){
  if(!dashboard)return;
  renderLegend();
  renderChart();
  renderCandidatesSection();
  renderCitationsSection();
  renderPapersSection();
}

/* ==========================================================================
   7. SECTION 04: NUMBERED ACADEMIC REFERENCES
   ========================================================================== */
function renderReferences(){
  const indexAuthors={Scopus:'Elsevier',WoS:'Clarivate',DOAJ:'Directory of Open Access Journals',ACI:'ASEAN Citation Index'};
  const references=dashboard.journals.flatMap(j=>{
    const institution=j.institution?.name||j.publisher;
    const publisher=j.institution?.coPublisher||institution;
    return [
      {author:publisher,title:j.title,url:j.website},
      {author:publisher,title:`${j.title}: Các số đã xuất bản`,url:j.archiveUrl},
      ...(j.additionalArchives??[]).map(a=>({author:institution,title:a.label,url:a.url})),
      ...j.indexings.filter(i=>i.status==='listed').map(i=>({
        author:indexAuthors[i.system]||i.system,
        title:`${i.system}${i.collection?` — ${i.collection}`:''}: ${fullName(j)}`,
        url:i.sourceUrl
      }))
    ];
  });
  references.push(...dashboard.historySources.filter(source=>source.url&&source.kind!=='published-photograph').map(source=>({
    author:source.author||(new URL(source.url).hostname==='math.ac.vn'?'Viện Toán học, VAST':null),
    title:source.title,url:source.url
  })));
  if(dashboard.hdgsnn){
    references.push(
      {author:'Hội đồng Giáo sư nhà nước',title:dashboard.hdgsnn.decision.title,year:dashboard.hdgsnn.year,url:dashboard.hdgsnn.decision.url},
      ...dashboard.hdgsnn.councils.map(c=>({author:c.name,title:`Danh mục tạp chí khoa học được tính điểm năm ${dashboard.hdgsnn.year}`,year:dashboard.hdgsnn.year,url:c.sourceUrl}))
    );
  }
  const unique=new Map();
  for(const ref of references)if(ref.url&&!unique.has(ref.url))unique.set(ref.url,ref);
  $('#source-links').innerHTML=[...unique.values()].map(ref=>`<li><p>${ref.author?`${esc(ref.author)}, `:''}“<em>${esc(ref.title)}</em>”${ref.year?`, ${ref.year}`:''}. [Trực tuyến]. Có tại: ${external(ref.url,ref.url)}.</p></li>`).join('');
}


function renderJournalHistory(j){
  const history=j.journalHistory;
  return `
    <section id="journal-history" class="history-section" aria-labelledby="journal-history-heading">
      <p class="hud-label chart-kicker">LỊCH SỬ PHÁT TRIỂN · ${esc(j.code)}</p>
      <h3 id="journal-history-heading">Từ những số đầu tiên đến hôm nay</h3>
      <p class="history-summary">${esc(history.summary)}</p>
      <ol class="history-timeline">${history.events.map(event=>`<li><strong class="history-date">${esc(event.dateLabel)}</strong><div><p>${esc(event.text)}</p></div></li>`).join('')}</ol>
    </section>
    <section id="journal-editors" class="history-section" aria-labelledby="journal-editors-heading">
      <p class="hud-label chart-kicker">LÃNH ĐẠO TẠP CHÍ · ${esc(j.code)}</p>
      <h3 id="journal-editors-heading">Tổng biên tập qua các thời kỳ</h3>
      <div class="editor-grid">${history.editors.map(editor=>`<article class="editor-card${editor.portrait?'':' is-text-only'}">
        ${editor.portrait?`<img class="editor-portrait" src="${esc(editor.portrait.path)}" alt="Chân dung ${esc(editor.name)}" width="${editor.portrait.width}" height="${editor.portrait.height}" loading="lazy" decoding="async">`:''}
        <div class="editor-content"><h4>${esc(editor.name)}</h4><ul class="editor-appointments">${editor.appointments.map(appointment=>`<li><strong>${esc(appointment.role)}</strong>${appointment.tenure?`<span>${esc(appointment.tenure)}</span>`:''}</li>`).join('')}</ul>
        </div>
      </article>`).join('')}</div>
    </section>`;
}

/* ==========================================================================
   8. VIEW 2: PER-JOURNAL DETAIL PAGE & FULL-HISTORY CHARTS (#journal/<id>)
   ========================================================================== */
function renderDetail(id){
  const j=dashboard.journals.find(item=>item.id===id);
  const panel=$('#detail-panel');
  if(!j){
    panel.innerHTML=`<div class="detail-top-bar"><a class="detail-back" href="#section-catalog">← QUAY LẠI DANH MỤC 12 TẠP CHÍ</a></div><div style="padding:28px"><h2 id="detail-heading">Không tìm thấy tạp chí</h2></div>`;
    return;
  }
  const inst=j.institution||{name:j.publisher,logo:'assets/images/logos/nxb.png',coPublisher:null,coLogo:null};
  const a25=annualRecord(j,2025),t26=trackerRecord(j);
  const loc25=localScore(j,2025),loc26=localScore(j,2026);
  const hist=statisticalHistory(j);
  const minYear=hist[0]?.year??statisticalStartYear(j),maxYear=hist.at(-1)?.year||2026;
  state.detailFromYear=minYear;
  state.detailToYear=maxYear;

  const totalHistPapers=hist.reduce((s,r)=>s+(r.papers||0),0);
  const totalHistIssues=hist.reduce((s,r)=>s+(r.issues||0),0);
  const histYearSet=new Set(hist.map(r=>r.year));
  const missingYears=[];
  for(let y=minYear;y<=maxYear;y++)if(!histYearSet.has(y))missingYears.push(y);
  const jr=j.jcr||null;
  const listedIndexings=j.indexings.filter(i=>i.status==='listed');

  const profileRows=[
    ['Phân nhóm VAST',j.group==='VAST-1'?'VAST-1 · Tạp chí quốc tế':'VAST-2 · Tạp chí quốc gia'],
    ['Tên tiếng Việt',j.titleVi],
    ['Lĩnh vực',j.subject],
    ['Đơn vị chủ quản xuất bản',inst.name],
    ['Đối tác đồng xuất bản quốc tế',inst.coPublisher||'Xuất bản độc lập trên hệ thống VJS (VAST)'],
    ['ISSN bản in / điện tử',`${j.issn??'—'} / ${j.eissn??'—'}`],
    ...(jr?[['Chỉ số Web of Science (JCR 2025)',`JIF 2025: <strong>${oneDec.format(jr.jif)}</strong> (${jr.jifNumerator}/${jr.jifDenominator}) · 5-Year JIF: <strong>${oneDec.format(jr.fiveYearJif)}</strong> · JCI: <strong>${twoDec.format(jr.jci)}</strong> · Tổng trích dẫn JCR 2025: <strong>${integer.format(jr.totalCitations)}</strong>`]]:[]),
    ['Kỳ hạn xuất bản',esc(publicationFrequency(j))],
    ...(j.hdgsnn2025?.length?[['Điểm HĐGSNN 2025 (QĐ 26/QĐ-HĐGSNN)',esc(hdgsnnRangeText(j))]]:[]),
    ['Số liệu xuất bản',`${minYear}–${maxYear} · ${integer.format(totalHistPapers)} bài / ${integer.format(totalHistIssues)} kỳ${missingYears.length?`; năm chưa có số liệu: ${missingYears.join(', ')}`:''}`],
    ['Trang chủ chính thức',external(j.website)],
    ['Các số đã xuất bản',archiveLinks(j)]
  ];

  const ownRecords=scopus.records.filter(r=>r.journal===j.code&&r.year>=statisticalStartYear(j)&&Number.isFinite(r.value));
  const cats=j.scopusCategories??[];

  let metricCards=[];
  if(j.group==='VAST-1'){
    const bestS25=cats.find(c=>c.annual2025)?.annual2025||null;
    const bestT26=cats[0]?.tracker2026||null;
    metricCards=[
      ['CiteScore 2025 (Scopus)',a25&&Number.isFinite(a25.value)?`${oneDec.format(a25.value)}${bestS25?` (${bestS25.quartile||scopusQuartile(bestS25.percentile)})`:''}`:'N/A',a25&&Number.isFinite(a25.citations)?`${integer.format(a25.citations)} trích dẫn / ${integer.format(a25.documents)} tài liệu (2022–2025)${bestS25?` · phân vị ${bestS25.percentile}% (${bestS25.rank}/${bestS25.total})`:''}`:'Chưa có CiteScore chính thức'],
      ['CiteScore Tracker 2026',t26&&Number.isFinite(t26.value)?`${oneDec.format(t26.value)}${bestT26?` (${bestT26.quartile||scopusQuartile(bestT26.percentile)})`:''}`:'N/A',t26&&Number.isFinite(t26.citations)?`${integer.format(t26.citations)} trích dẫn / ${integer.format(t26.documents)} tài liệu${bestT26?` · phân vị ${bestT26.percentile}% (${bestT26.rank}/${bestT26.total})`:' (cập nhật 05/10/2026)'}`:'Cập nhật 05/10/2026'],
      jr
        ?['JIF 2025 (WoS JCR)',`${oneDec.format(jr.jif)} (${jr.categories[0].jif.quartile})`,`${integer.format(jr.jifNumerator)} trích dẫn / ${integer.format(jr.jifDenominator)} bài (2023–2024) · JCI: ${twoDec.format(jr.jci)}`]
        :[`Tổng số bài (${minYear}–${maxYear})`,`${integer.format(totalHistPapers)} bài`,`${integer.format(totalHistIssues)} kỳ xuất bản`],
      ['Tổng tài liệu trích dẫn (Scopus)',`${integer.format(j.scopusCitedBy.citingDocuments)} tài liệu`,`${integer.format(j.scopusCitedBy.sourceDocuments)} bài nguồn · Toàn bộ bản ghi tại nguồn`]
    ];
  }else{
    const tot=j.localCitation?.totals;
    metricCards=[
      ['CiteScore 2025 (tự tính)',loc25?twoDec.format(loc25.score):'N/A',loc25?`${integer.format(loc25.numerator)} trích dẫn / ${integer.format(loc25.denominator)} bài (2022–2025)`:'—'],
      ['CiteScore 2026 (tự tính)',loc26?twoDec.format(loc26.score):'N/A',loc26?`${integer.format(loc26.numerator)} trích dẫn / ${integer.format(loc26.denominator)} bài (2023–2026)`:'—'],
      [`Tổng số bài (${minYear}–${maxYear})`,`${integer.format(totalHistPapers)} bài`,`${integer.format(totalHistIssues)} kỳ xuất bản`],
      ['Tổng trích dẫn',tot?`${integer.format(tot.citations)} lượt`:'N/A',tot?`h-index: ${tot.hIndex} · ${integer.format(tot.citingDocs)} bài trích dẫn`:'—']
    ];
  }

  const yearOptions=hist.map(r=>`<option value="${r.year}">${r.year}</option>`).join('');

  panel.innerHTML=`
    <div class="detail-top-bar">
      <div class="detail-top-main">
        <a class="detail-back" href="#section-catalog">← QUAY LẠI DANH MỤC 12 TẠP CHÍ</a>
        <span class="hud-label">${esc(j.group)} · MÃ TẠP CHÍ: <strong>${esc(j.code)}</strong></span>
      </div>
      <nav class="detail-mobile-nav" aria-label="Chuyển nhanh mục trong hồ sơ tạp chí">
        <a href="#journal/${esc(j.id)}/journal-profile">Thông tin chung</a>
        ${listedIndexings.length?`<a href="#journal/${esc(j.id)}/journal-indexing">Chỉ mục</a>`:''}
        <a href="#journal/${esc(j.id)}/journal-history">Lịch sử</a>
        <a href="#journal/${esc(j.id)}/journal-editors">Tổng biên tập</a>
        <a href="#journal/${esc(j.id)}/journal-charts">Biểu đồ</a>
        <a href="#journal/${esc(j.id)}/journal-data">Số liệu</a>
        ${j.hdgsnn2025?.length?`<a href="#journal/${esc(j.id)}/journal-hdgsnn">HĐGSNN</a>`:''}
      </nav>
    </div>

    <div id="journal-info" class="detail-hero">
      <img class="detail-cover-img" src="${esc(coverUrl(j))}" alt="Bìa tạp chí ${esc(j.title)}" width="164" height="238">
      <div>
        <div class="lineup-tags">${indexingBadges(j)}</div>
        <h2 id="detail-heading" class="detail-heading">${esc(fullName(j))}</h2>
        <p class="detail-subtitle">${esc(j.titleVi)} · ${esc(j.subject)}</p>
        <div class="detail-inst-row">
          <img src="${esc(inst.logo)}" alt="${esc(inst.name)}">
          ${inst.coLogo?`<img src="${esc(inst.coLogo)}" alt="${esc(inst.coPublisher||'')}">`:''}
          <div>
            <strong style="display:block;font-size:13.5px">${esc(inst.name)}${inst.coPublisher?` · Đồng xuất bản với ${esc(inst.coPublisher)}`:''}</strong>
            <span style="font-size:12px;color:var(--muted)">ISSN: ${esc(j.issn??'—')} · eISSN: ${esc(j.eissn??'—')} · Kỳ hạn xuất bản: ${esc(publicationFrequency(j))}</span>
          </div>
        </div>
        <div class="detail-metrics">
          ${metricCards.map(([l,v,d])=>`<div class="summary-item" style="padding:12px 14px;border:1px solid var(--line)"><span class="summary-label">${esc(l)}</span><strong class="summary-value">${esc(v)}</strong><span class="summary-detail">${esc(d)}</span></div>`).join('')}
        </div>
      </div>
    </div>
    <section id="journal-profile" class="detail-profile-section" aria-labelledby="journal-profile-heading">
      <h3 id="journal-profile-heading">Thông tin chung</h3>
      <dl class="profile-list">
        ${profileRows.map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${v}</dd></div>`).join('')}
      </dl>
      ${listedIndexings.length?`<div id="journal-indexing" class="detail-indexing-block">
        <h4 class="profile-subheading">Chỉ mục khoa học</h4>
        <ul class="source-evidence">
          ${listedIndexings.map(i=>`<li><strong>${esc(i.system)}${i.collection?` · ${esc(i.collection)}`:''}</strong><small>${[i.coverage?`Phạm vi: ${esc(i.coverage)}`:'',external(i.sourceUrl,i.system==='WoS'?'Clarivate MJL':`Thông tin ${i.system}`)].filter(Boolean).join(' · ')}</small></li>`).join('')}
        </ul>
      </div>`:''}
    </section>
    ${renderJournalHistory(j)}

    <section id="journal-charts" class="detail-charts-section" aria-label="Số liệu xuất bản và trích dẫn qua các năm của ${esc(j.code)}">
      <div class="detail-charts-head">
        <div>
          <span class="hud-label chart-kicker">${esc(j.code)} · ${minYear}–${maxYear}</span>
          <h3>Xuất bản, trích dẫn &amp; CiteScore</h3>
        </div>
        <form class="trend-controls" style="margin:0" aria-label="Chọn khoảng năm hiển thị">
          <div class="field">
            <label for="detail-from-year">Từ năm</label>
            <select id="detail-from-year">${yearOptions}</select>
          </div>
          <div class="field">
            <label for="detail-to-year">Đến năm</label>
            <select id="detail-to-year">${yearOptions}</select>
          </div>
          <button id="detail-reset-years" class="text-button" type="button">Toàn bộ (${minYear}–${maxYear})</button>
        </form>
      </div>

      <div class="detail-charts-grid">
        <div class="detail-chart-card">
          <h4>1. Bài và kỳ xuất bản</h4>
          <p id="j-pub-summary"></p>
          <svg id="j-pub-chart" class="detail-svg" viewBox="0 0 860 270" role="img" aria-label="Biểu đồ lịch sử xuất bản của ${esc(j.code)}"></svg>
        </div>
        <div class="detail-chart-card">
          <h4>2. ${j.scopusCitedBy?'Tài liệu trích dẫn theo năm (Scopus)':'Trích dẫn theo năm'}</h4>
          <p id="j-cit-summary"></p>
          <svg id="j-cit-chart" class="detail-svg" viewBox="0 0 860 260" role="img" aria-label="Biểu đồ lịch sử trích dẫn của ${esc(j.code)}"></svg>
        </div>
        <div class="detail-chart-card">
          <h4>3. ${j.group==='VAST-1'?'CiteScore &amp; Tracker (Scopus)':'CiteScore tự tính'}</h4>
          <p id="j-cs-summary"></p>
          <svg id="j-cs-chart" class="detail-svg" viewBox="0 0 860 250" role="img" aria-label="Biểu đồ CiteScore của ${esc(j.code)}"></svg>
        </div>
      </div>
    </section>

    <div id="journal-data" class="detail-data-section">
        <section class="detail-section">
          <h3>Bảng số liệu xuất bản &amp; trích dẫn theo năm</h3>
          <div class="table-scroll" style="max-height:520px;overflow-y:auto">
            <table class="detail-table">
              <thead>
                <tr>
                  <th scope="col">Năm</th>
                  <th scope="col">Số bài xuất bản</th>
                  <th scope="col">Số kỳ</th>
                  <th scope="col">${j.group==='VAST-1'?'Tài liệu trích dẫn (Scopus)':'Bài trích dẫn'}</th>
                  ${j.scopusCitedBy?'':'<th scope="col">Lượt trích dẫn</th>'}
                  <th scope="col">${j.group==='VAST-1'?'CiteScore Scopus':'CiteScore tự tính'}</th>
                </tr>
              </thead>
              <tbody>
                ${[...hist].reverse().map(r=>{
                  const sc=scopusRecord(j,r.year);
                  const csVal=j.group==='VAST-1'
                    ?(sc&&Number.isFinite(sc.value)?`${oneDec.format(sc.value)}${sc.type==='tracker'?' (Tracker)':''}`:'—')
                    :(Number.isFinite(r.selfCalcScore)?`${twoDec.format(r.selfCalcScore)} (${r.selfCalcNum}/${r.selfCalcDen})`:'—');
                  return `<tr>
                    <td><strong>${r.year}${r.periodKind==='ytd'?' (YTD)':''}</strong></td>
                    <td>${Number.isFinite(r.papers)?integer.format(r.papers):'—'}</td>
                    <td>${Number.isFinite(r.issues)?integer.format(r.issues):'—'}</td>
                    <td>${Number.isFinite(r.citingDocs)?integer.format(r.citingDocs):'—'}</td>
                    ${j.scopusCitedBy?'':`<td>${Number.isFinite(r.citationEdges)?integer.format(r.citationEdges):'—'}</td>`}
                    <td><strong>${esc(csVal)}</strong></td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
          ${j.scopusCitedBy?`<p style="font-size:12.5px;color:var(--muted);margin:8px 0 0">
            Scopus đếm tài liệu trích dẫn riêng biệt theo năm xuất bản, không phải số lượt dẫn chiếu. Cập nhật ${esc(j.scopusCitedBy.collectedAt)}; số liệu 2026 chưa đầy đủ.
          </p>`:''}
        </section>

        ${ownRecords.length?`<section class="detail-section">
          <h3>CiteScore Scopus theo năm</h3>
          <div class="table-scroll">
            <table class="detail-table">
              <thead><tr><th scope="col">Năm</th><th scope="col">Loại</th><th scope="col">CiteScore</th><th scope="col">Trích dẫn</th><th scope="col">Tài liệu</th><th scope="col">Cửa sổ</th></tr></thead>
              <tbody>${ownRecords.map(r=>`<tr><td>${r.year}</td><td>${r.type==='tracker'?'Tracker':'Chính thức'}</td><td><strong>${oneDec.format(r.value)}</strong></td><td>${Number.isFinite(r.citations)?integer.format(r.citations):'N/A'}</td><td>${Number.isFinite(r.documents)?integer.format(r.documents):'N/A'}</td><td>${esc(r.citationWindow??'—')}</td></tr>`).join('')}</tbody>
            </table>
          </div>
        </section>`:''}
        ${cats.length?`<section class="detail-section">
          <h3>Thứ hạng Scopus theo phân ngành qua các năm</h3>
          <p style="font-size:13px;color:var(--muted);margin:0 0 10px">Phân ngành ASJC · dữ liệu lịch sử Scopus.</p>
          <div class="table-scroll" style="max-height:420px;overflow-y:auto">
            <table class="detail-table">
              <thead><tr><th scope="col">Lĩnh vực &amp; Phân ngành Scopus (ASJC)</th><th scope="col">Năm</th><th scope="col">Loại</th><th scope="col">Vị trí (Hạng / Tổng)</th><th scope="col">Quartile Scopus</th><th scope="col">Phân vị Scopus</th></tr></thead>
              <tbody>
                ${cats.flatMap(c=>(c.history||[{year:c.year,type:c.isTrackerOnly?'tracker':'annual',rank:c.rank,total:c.total,percentile:c.percentile,quartile:c.quartile}]).filter(h=>h.year>=CHART_START_YEAR).sort((a,b)=>b.year-a.year).map(h=>{
                  const q=h.quartile||scopusQuartile(h.percentile);
                  return `<tr>
                  <td><strong>${esc(c.name)}</strong><small style="display:block;color:var(--muted)">${esc(c.parent||'')}${c.code?` · ASJC ${esc(c.code)}`:''}</small></td>
                  <td><strong>${h.year}</strong></td>
                  <td>${h.type==='tracker'?'Tracker 2026':'Chính thức'}</td>
                  <td><strong>${h.rank}/${h.total}</strong></td>
                  <td><strong>${esc(q||'—')}</strong></td>
                  <td><strong>${h.percentile}%</strong></td>
                </tr>`;
                })).join('')}
              </tbody>
            </table>
          </div>
        </section>`:''}
        ${jr?`<section class="detail-section">
          <h3>JCR ${jr.metricYear} · ${esc(jr.wosCollection)}</h3>
          <p style="font-size:13px;color:var(--muted);margin:0 0 10px">${external(j.indexings.find(i=>i.system==='WoS'&&i.status==='listed').sourceUrl,'Clarivate MJL')}</p>
          <div class="table-scroll">
            <table class="detail-table">
              <thead><tr><th scope="col">Chỉ số JCR 2025</th><th scope="col">Giá trị</th><th scope="col">Chi tiết / Giai đoạn tính</th></tr></thead>
              <tbody>
                <tr><td><strong>Journal Impact Factor (JIF 2025)</strong></td><td><strong>${oneDec.format(jr.jif)}</strong></td><td>${integer.format(jr.jifNumerator)} trích dẫn năm 2025 / ${integer.format(jr.jifDenominator)} bài citable (2023–2024)</td></tr>
                <tr><td>JIF không tính tự trích dẫn</td><td><strong>${oneDec.format(jr.jifWithoutSelfCitations)}</strong></td><td>${integer.format(jr.jifWithoutSelfNumerator)} trích dẫn không tự TD / ${integer.format(jr.jifDenominator)} bài citable (2023–2024)</td></tr>
                <tr><td>5-Year Impact Factor</td><td><strong>${oneDec.format(jr.fiveYearJif)}</strong></td><td>${integer.format(jr.fiveYearNumerator)} trích dẫn năm 2025 / ${integer.format(jr.fiveYearDenominator)} bài citable (2020–2024)</td></tr>
                <tr><td>Journal Citation Indicator (JCI 2025)</td><td><strong>${twoDec.format(jr.jci)}</strong></td><td>Chỉ số chuẩn hóa theo lĩnh vực (CNCI trung bình 3 năm)</td></tr>
                <tr><td>Immediacy Index</td><td><strong>${oneDec.format(jr.immediacyIndex)}</strong></td><td>${integer.format(jr.immediacyNumerator)} trích dẫn năm 2025 / ${integer.format(jr.immediacyDenominator)} bài citable năm 2025</td></tr>
                <tr><td>Tổng trích dẫn trong JCR 2025</td><td><strong>${integer.format(jr.totalCitations)} lượt</strong></td><td>Cited Half-life: ${jr.citedHalfLife} năm · Citing Half-life: ${jr.citingHalfLife} năm</td></tr>
                <tr><td>Eigenfactor / Normalized Eigenfactor / AIS</td><td><strong>${jr.eigenfactorScore.toFixed(5)}</strong></td><td>Normalized Eigenfactor: ${jr.normalizedEigenfactor.toFixed(5)} · Article Influence Score: ${jr.articleInfluenceScore.toFixed(3)}</td></tr>
              </tbody>
            </table>
          </div>
          <div class="table-scroll" style="margin-top:12px">
            <table class="detail-table">
              <thead><tr><th scope="col">Phân ngành Web of Science (JCR)</th><th scope="col">Năm</th><th scope="col">Hạng JIF</th><th scope="col">Quartile JIF</th><th scope="col">Phân vị JIF</th><th scope="col">Hạng JCI</th><th scope="col">Quartile JCI</th><th scope="col">Phân vị JCI</th></tr></thead>
              <tbody>
                ${jr.categories.flatMap(c=>{
                  const years=[...new Set([...(c.jifHistory||[]).map(x=>x.year),...(c.jciHistory||[]).map(x=>x.year)])].filter(y=>y>=CHART_START_YEAR).sort((a,b)=>b-a);
                  return years.map(yr=>{
                    const jf=(c.jifHistory||[]).find(x=>x.year===yr);
                    const jc=(c.jciHistory||[]).find(x=>x.year===yr);
                    return `<tr>
                      <td><strong>${esc(c.name)}</strong></td>
                      <td>${yr}</td>
                      <td>${jf?`${jf.rank}/${jf.total}`:'—'}</td>
                      <td>${jf?`<strong>${esc(jf.quartile)}</strong>`:'—'}</td>
                      <td>${jf?`${oneDec.format(jf.percentile)}%`:'—'}</td>
                      <td>${jc?`${jc.rank}/${jc.total}`:'—'}</td>
                      <td>${jc?`<strong>${esc(jc.quartile)}</strong>`:'—'}</td>
                      <td>${jc?`${twoDec.format(jc.percentile)}%`:'—'}</td>
                    </tr>`;
                  });
                }).join('')}
              </tbody>
            </table>
          </div>
        </section>`:''}


        ${j.hdgsnn2025?.length?`<section id="journal-hdgsnn" class="detail-section">
          <h3>Điểm tính tại HĐGSNN năm 2025 (${j.hdgsnn2025.length} hội đồng)</h3>
          <p style="font-size:13px;color:var(--muted);margin:0 0 10px">${external(dashboard.hdgsnn.decision.pdfUrl,'Quyết định 26/QĐ-HĐGSNN (11/07/2025)')}</p>
          <div class="table-scroll">
            <table class="detail-table">
              <thead><tr><th scope="col">Hội đồng Giáo sư ngành, liên ngành</th><th scope="col">Điểm tối đa 2025</th><th scope="col">Quy định trong danh mục</th></tr></thead>
              <tbody>
                ${j.hdgsnn2025.map(r=>`<tr>
                  <td>${external(r.sourceUrl,r.council)}</td>
                  <td><strong>${esc(formatHdgsnnScore(r.score))}</strong></td>
                  <td>${esc(r.conditions)}</td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </section>`:''}
    </div>`;

  const fromSel=$('#detail-from-year'),toSel=$('#detail-to-year');
  if(fromSel&&toSel){
    fromSel.value=String(minYear);
    toSel.value=String(maxYear);
    const updateRange=()=>{
      state.detailFromYear=Math.min(Number(fromSel.value),Number(toSel.value));
      state.detailToYear=Math.max(Number(fromSel.value),Number(toSel.value));
      renderDetailCharts(j);
    };
    fromSel.addEventListener('change',updateRange);
    toSel.addEventListener('change',updateRange);
    $('#detail-reset-years')?.addEventListener('click',()=>{
      fromSel.value=String(minYear);
      toSel.value=String(maxYear);
      updateRange();
    });
  }
  renderDetailCharts(j);
}

function renderDetailCharts(j){
  const color=styles[j.id]?.color||'#2d81ff';
  const allHist=statisticalHistory(j);
  const a=Math.max(statisticalStartYear(j),state.detailFromYear??allHist[0]?.year??2020);
  const b=state.detailToYear??allHist.at(-1)?.year??2026;
  const hist=allHist.filter(r=>r.year>=a&&r.year<=b);
  if(!hist.length)return;

  // 1. Publication History Chart
  const pubSvg=$('#j-pub-chart');
  if(pubSvg){
    const maxP=Math.max(10,...hist.map(r=>r.papers||0));
    const scale=niceScale(maxP);
    const W=860,H=270,p={left:52,right:28,top:24,bottom:38};
    p.w=W-p.left-p.right;p.h=H-p.top-p.bottom;
    const slot=p.w/hist.length,barW=Math.max(4,Math.min(34,slot*0.66));
    const xC=i=>p.left+(i+0.5)*slot;
    const y=v=>p.top+p.h-((v||0)/scale.max)*p.h;

    let out='';
    for(let tick=0;tick<=scale.max+scale.step/2;tick+=scale.step){
      const py=y(tick);if(py<p.top-1)break;
      out+=`<line x1="${p.left}" y1="${py.toFixed(1)}" x2="${p.left+p.w}" y2="${py.toFixed(1)}" stroke="var(--line)"/><text x="${p.left-8}" y="${(py+4).toFixed(1)}" text-anchor="end" fill="var(--muted)" font-size="11">${integer.format(tick)}</text>`;
    }
    const labelEvery=hist.length>30?5:(hist.length>16?2:1);
    const polyPts=hist.map((r,i)=>`${xC(i).toFixed(1)},${y(r.papers||0).toFixed(1)}`).join(' ');
    const areaPts=`${xC(0).toFixed(1)},${(p.top+p.h).toFixed(1)} ${polyPts} ${xC(hist.length-1).toFixed(1)},${(p.top+p.h).toFixed(1)}`;
    out+=`<polygon points="${areaPts}" fill="${color}" opacity="0.10"/>`;
    hist.forEach((r,i)=>{
      const cx=xC(i),bx=cx-barW/2,py=y(r.papers||0),bh=p.top+p.h-py;
      out+=`<rect x="${bx.toFixed(1)}" y="${py.toFixed(1)}" width="${barW.toFixed(1)}" height="${Math.max(1.5,bh).toFixed(1)}" rx="1.5" fill="${color}" opacity="${r.year===2026?'0.62':'0.88'}"/>`;
      if(hist.length<=20&&(r.papers||0)>0){
        out+=`<text x="${cx.toFixed(1)}" y="${(py-5).toFixed(1)}" text-anchor="middle" fill="var(--ink-strong)" font-size="10" font-weight="600">${r.papers}</text>`;
      }
      if(i%labelEvery===0||i===hist.length-1){
        out+=`<text x="${cx.toFixed(1)}" y="${H-12}" text-anchor="middle" fill="var(--muted)" font-size="10.5">${r.year}</text>`;
      }
    });
    pubSvg.innerHTML=out;
    pubSvg.onpointermove=e=>{
      const rect=pubSvg.getBoundingClientRect(),px=((e.clientX-rect.left)/rect.width)*W;
      const idx=Math.max(0,Math.min(hist.length-1,Math.floor((px-p.left)/slot)));
      const r=hist[idx];
      if(r)$('#j-pub-summary').innerHTML=`<strong>Năm ${r.year}${r.periodKind==='ytd'?' (YTD)':''}:</strong> <strong>${integer.format(r.papers||0)} bài</strong> nghiên cứu · <strong>${integer.format(r.issues||0)} kỳ</strong> phát hành.`;
    };
  }

  // 2. Citations History Chart
  const citSvg=$('#j-cit-chart');
  if(citSvg){
    const series=hist;
    const maxC=Math.max(10,...series.map(r=>Math.max(r.citationEdges||0,r.citingDocs||0)));
    const scale=niceScale(maxC);
    const W=860,H=260,p={left:52,right:28,top:22,bottom:36};
    p.w=W-p.left-p.right;p.h=H-p.top-p.bottom;
    const x=i=>series.length===1?p.left+p.w/2:p.left+i*(p.w/(series.length-1));
    const y=v=>p.top+p.h-((v||0)/scale.max)*p.h;

    let out='';
    for(let tick=0;tick<=scale.max+scale.step/2;tick+=scale.step){
      const py=y(tick);if(py<p.top-1)break;
      out+=`<line x1="${p.left}" y1="${py.toFixed(1)}" x2="${p.left+p.w}" y2="${py.toFixed(1)}" stroke="var(--line)"/><text x="${p.left-8}" y="${(py+4).toFixed(1)}" text-anchor="end" fill="var(--muted)" font-size="11">${integer.format(tick)}</text>`;
    }
    const labelEvery=series.length>28?5:(series.length>14?2:1);
    const edgePts=series.map((r,i)=>({i,r,px:x(i),py:y(r.citationEdges||0)})).filter(pt=>Number.isFinite(pt.r.citationEdges));
    const docPts=series.map((r,i)=>({i,r,px:x(i),py:y(r.citingDocs||0)})).filter(pt=>Number.isFinite(pt.r.citingDocs));

    if(edgePts.length>1){
      const poly=edgePts.map(pt=>`${pt.px.toFixed(1)},${pt.py.toFixed(1)}`).join(' ');
      const area=`${edgePts[0].px.toFixed(1)},${(p.top+p.h).toFixed(1)} ${poly} ${edgePts.at(-1).px.toFixed(1)},${(p.top+p.h).toFixed(1)}`;
      out+=`<polygon points="${area}" fill="${color}" opacity="0.14"/><polyline points="${poly}" fill="none" stroke="${color}" stroke-width="2.5"/>`;
    }else if(docPts.length>1&&j.scopusCitedBy){
      const poly2=docPts.map(pt=>`${pt.px.toFixed(1)},${pt.py.toFixed(1)}`).join(' ');
      const area=`${docPts[0].px.toFixed(1)},${(p.top+p.h).toFixed(1)} ${poly2} ${docPts.at(-1).px.toFixed(1)},${(p.top+p.h).toFixed(1)}`;
      out+=`<polygon points="${area}" fill="${color}" opacity="0.14"/><polyline points="${poly2}" fill="none" stroke="${color}" stroke-width="2.5"/>`;
    }
    if(docPts.length>1&&!j.scopusCitedBy){
      const poly2=docPts.map(pt=>`${pt.px.toFixed(1)},${pt.py.toFixed(1)}`).join(' ');
      out+=`<polyline points="${poly2}" fill="none" stroke="var(--ink)" stroke-width="1.8" stroke-dasharray="4 3"/>`;
    }
    const markerPts=edgePts.length?edgePts:docPts;
    for(const pt of markerPts){
      out+=`<circle cx="${pt.px.toFixed(1)}" cy="${pt.py.toFixed(1)}" r="3.3" fill="${color}" stroke="var(--bg)" stroke-width="1.3"/>`;
    }
    series.forEach((r,i)=>{
      if(i%labelEvery===0||i===series.length-1){
        out+=`<text x="${x(i).toFixed(1)}" y="${H-11}" text-anchor="middle" fill="var(--muted)" font-size="10.5">${r.year}</text>`;
      }
    });
    if(!markerPts.length)out+=`<text x="${p.left+p.w/2}" y="${p.top+p.h/2}" text-anchor="middle" fill="var(--muted)" font-size="13">Chưa có dữ liệu trích dẫn cho khoảng năm đã chọn.</text>`;
    citSvg.innerHTML=out;
    citSvg.onpointermove=e=>{
      const rect=citSvg.getBoundingClientRect(),px=((e.clientX-rect.left)/rect.width)*W;
      const idx=Math.max(0,Math.min(series.length-1,Math.round(((px-p.left)/Math.max(1,p.w))*(series.length-1))));
      const r=series[idx];
      if(r){
        $('#j-cit-summary').innerHTML=j.scopusCitedBy
          ?`<strong>Năm ${r.year}${r.year===2026?' (chưa đầy đủ)':''}:</strong> ${Number.isFinite(r.citingDocs)?`<strong>${integer.format(r.citingDocs)} tài liệu trích dẫn</strong> (Scopus).`:'Chưa có dữ liệu Scopus.'}`
          :`<strong>Năm ${r.year}:</strong> ${Number.isFinite(r.citationEdges)?`<strong>${integer.format(r.citationEdges)} lượt trích dẫn</strong>`:'Chưa có dữ liệu trích dẫn'} từ ${Number.isFinite(r.citingDocs)?`<strong>${integer.format(r.citingDocs)} bài báo trích dẫn</strong>`:'nguồn chưa có số liệu'}.`;
      }
    };
  }

  // 3. CiteScore History Chart
  const csSvg=$('#j-cs-chart');
  if(csSvg){
    const csRows=j.group==='VAST-1'
      ?scopus.records.filter(r=>r.journal===j.code&&r.year>=a&&r.year<=b&&Number.isFinite(r.value)).map(r=>({year:r.year,score:r.value,num:r.citations,den:r.documents,isTracker:r.type==='tracker'}))
      :(j.localCitation?.selfCalculatedSeries||[]).filter(r=>r.year>=a&&r.year<=b).map(r=>({year:r.year,score:r.score??r.value,num:r.numerator,den:r.denominator,isTracker:r.year===2026})).filter(r=>Number.isFinite(r.score));
    const maxS=Math.max(1,...csRows.map(r=>r.score));
    const scale=niceScale(maxS);
    const W=860,H=250,p={left:52,right:32,top:24,bottom:36};
    p.w=W-p.left-p.right;p.h=H-p.top-p.bottom;
    const x=i=>csRows.length===1?p.left+p.w/2:p.left+i*(p.w/(csRows.length-1));
    const y=v=>p.top+p.h-(v/scale.max)*p.h;

    let out='';
    for(let tick=0;tick<=scale.max+scale.step/2;tick+=scale.step){
      const py=y(tick);if(py<p.top-1)break;
      out+=`<line x1="${p.left}" y1="${py.toFixed(1)}" x2="${p.left+p.w}" y2="${py.toFixed(1)}" stroke="var(--line)"/><text x="${p.left-8}" y="${(py+4).toFixed(1)}" text-anchor="end" fill="var(--muted)" font-size="11">${decimal.format(tick)}</text>`;
    }
    if(csRows.length>1){
      const poly=csRows.map((r,i)=>`${x(i).toFixed(1)},${y(r.score).toFixed(1)}`).join(' ');
      out+=`<polyline points="${poly}" fill="none" stroke="${color}" stroke-width="2.6"/>`;
    }
    csRows.forEach((r,i)=>{
      const px=x(i),py=y(r.score);
      out+=`<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="4.2" fill="${r.isTracker?'var(--bg)':color}" stroke="${color}" stroke-width="2"/>`;
      out+=`<text x="${px.toFixed(1)}" y="${(py-8).toFixed(1)}" text-anchor="middle" fill="var(--ink-strong)" font-size="11" font-weight="600">${j.group==='VAST-1'?oneDec.format(r.score):twoDec.format(r.score)}</text>`;
      out+=`<text x="${px.toFixed(1)}" y="${H-11}" text-anchor="middle" fill="var(--muted)" font-size="11">${r.year}${r.isTracker?'*':''}</text>`;
    });
    csSvg.innerHTML=out;
    csSvg.onpointermove=e=>{
      if(!csRows.length)return;
      const rect=csSvg.getBoundingClientRect(),px=((e.clientX-rect.left)/rect.width)*W;
      const idx=Math.max(0,Math.min(csRows.length-1,Math.round(((px-p.left)/Math.max(1,p.w))*(csRows.length-1))));
      const r=csRows[idx];
      if(r){
        $('#j-cs-summary').innerHTML=`<strong>Năm ${r.year}${r.isTracker?(j.group==='VAST-1'?' (Tracker)':' (tự tính, YTD)'):''}:</strong> CiteScore = <strong>${j.group==='VAST-1'?oneDec.format(r.score):twoDec.format(r.score)}</strong> (${integer.format(r.num||0)} trích dẫn / ${integer.format(r.den||0)} tài liệu).`;
      }
    };
  }
}

/* ==========================================================================
   9. ROUTING & EVENT WIRING
   ========================================================================== */
function syncRoute(){
  if(!dashboard)return;
  const raw=decodeURIComponent(location.hash.slice(1));
  const homeView=$('#home-view');
  const panel=$('#detail-panel');
  let target=null;
  if(raw.startsWith('journal/')){
    const [,id,sectionId]=raw.split('/');
    const changed=panel.hidden||panel.dataset.journalId!==id;
    homeView.hidden=true;
    panel.hidden=false;
    if(changed){
      renderDetail(id);
      panel.dataset.journalId=id;
    }
    const journal=dashboard.journals.find(j=>j.id===id);
    document.title=journal?`${journal.code} · Thông tin & Biểu đồ · VAST`:'Thông tin tạp chí · VAST';
    setFlightSections([
      {id:'info',elId:'journal-profile',word:'THÔNG TIN'},
      ...(journal?.indexings?.some(i=>i.status==='listed')?[{id:'indexing',elId:'journal-indexing',word:'CHỈ MỤC'}]:[]),
      {id:'history',elId:'journal-history',word:'LỊCH SỬ'},
      {id:'editors',elId:'journal-editors',word:'TỔNG BIÊN TẬP'},
      {id:'charts',elId:'journal-charts',word:'BIỂU ĐỒ'},
      {id:'data',elId:'journal-data',word:'SỐ LIỆU'},
      ...(journal?.hdgsnn2025?.length?[{id:'hdgsnn',elId:'journal-hdgsnn',word:'HĐGSNN'}]:[])
    ],journal?`${journal.code} · VAST JOURNALS`:'VAST JOURNALS',id);
    target=sectionId?document.getElementById(sectionId):null;
    if(!target)window.scrollTo({top:0,behavior:'instant'});
  }else{
    homeView.hidden=false;
    panel.hidden=true;
    document.title='VAST JOURNALS — Hệ thống 12 Tạp chí Khoa học (VAST-1 & VAST-2)';
    setFlightSections(homeFlightSections);
    renderAllCharts();
    target=document.getElementById(raw);
  }
  requestAnimationFrame(()=>{
    if(target){
      if(target.id==='journal-info')window.scrollTo({top:0,behavior:reducedMotion.matches?'instant':'smooth'});
      else target.scrollIntoView({block:'start',behavior:reducedMotion.matches?'instant':'smooth'});
    }
    scheduleScrollUpdate();
  });
}

function wireEvents(){
  $('#journal-search').addEventListener('input',e=>{state.search=e.target.value;renderCatalog();});
  $('#index-filter').addEventListener('change',e=>{state.index=e.target.value;renderCatalog();});
  $('#subject-filter').addEventListener('change',e=>{state.subject=e.target.value;renderCatalog();});
  $('#sort-select').addEventListener('change',e=>{state.sort=e.target.value;renderCatalog();});
  $('#reset-filters').addEventListener('click',()=>{
    state.search='';state.index='all';state.subject='all';state.sort='default';
    $('#journal-search').value='';$('#index-filter').value='all';$('#subject-filter').value='all';$('#sort-select').value='default';
    renderCatalog();
  });

  $('#trend-metric').addEventListener('change',e=>{state.metric=e.target.value;renderChart();});
  $('#trend-from').addEventListener('change',e=>{state.fromYear=Number(e.target.value);renderChart();});
  $('#trend-to').addEventListener('change',e=>{state.toYear=Number(e.target.value);renderChart();});
  $('#select-all-journals').addEventListener('click',()=>{
    state.selected=new Set(scopusJournals().map(j=>j.id));
    renderLegend();renderChart();
  });
  $('#close-tooltip').addEventListener('click',()=>{state.pinnedYear=null;state.activeYear=null;hideTooltip();});

  $('#toggle-cip-benchmark').addEventListener('change',e=>{state.showCipBenchmark=e.target.checked;renderCandidatesSection();});
  $('#close-candidates-tooltip').addEventListener('click',()=>{$('#candidates-tooltip').hidden=true;$('#candidates-hover-line').hidden=true;});

  $('#citation-mode').addEventListener('change',e=>{
    state.citationMode=e.target.value;
    state.selectedCitations=new Set(citationJournals().map(j=>j.id));
    renderCitationsSection();
  });
  $('#citation-group').addEventListener('change',e=>{
    state.citationGroup=e.target.value;
    state.selectedCitations=new Set(citationJournals().map(j=>j.id));
    renderCitationsSection();
  });
  $('#close-citations-tooltip').addEventListener('click',()=>{$('#citations-tooltip').hidden=true;$('#citations-hover-line').hidden=true;});

  $('#papers-group').addEventListener('change',e=>{state.papersGroup=e.target.value;renderPapersSection();});
  $('#papers-focus-year').addEventListener('change',e=>{state.papersFocusYear=Number(e.target.value);renderPapersSection();});

  document.addEventListener('click',e=>{
    const link=e.target.closest('a[href^="#journal/"]');
    if(!link||e.defaultPrevented||e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
    // The browser cannot resolve a journal route as an element ID, and an
    // unchanged hash emits no hashchange when revisiting the current section.
    if(link.hash===location.hash){
      e.preventDefault();
      syncRoute();
    }
  });

  window.addEventListener('hashchange',syncRoute);
}

async function start(){
  try{
    initThemeMode();
    const [dRes,sRes]=await Promise.all([fetch('data/dashboard.json?v=20261023e'),fetch('data-scopus.json?v=20261023e')]);
    if(!dRes.ok||!sRes.ok)throw new Error('HTTP status error');
    [dashboard,scopus]=await Promise.all([dRes.json(),sRes.json()]);
    syncPaletteColors();
    state.selected=new Set(scopusJournals().map(j=>j.id));
    state.selectedCandidates=new Set(candidateJournals().map(j=>j.id));
    state.selectedCitations=new Set(citationJournals().map(j=>j.id));
    populateControls();
    renderHeroAndOverview();
    renderVast1MatrixTable();
    renderVast1JcrTable();
    renderCatalog();
    renderReferences();
    initRulerAndFlight();
    wireEvents();
    syncRoute();
    $('#load-status').hidden=true;
  }catch(error){
    console.error(error);
    $('#load-status').hidden=true;
    $('#load-error').hidden=false;
  }
}
$('#retry-load').addEventListener('click',()=>location.reload());
start();
