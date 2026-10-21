const $=selector=>document.querySelector(selector);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const integer=new Intl.NumberFormat('vi-VN');
const decimal=new Intl.NumberFormat('vi-VN',{minimumFractionDigits:1,maximumFractionDigits:1});
const ratioFormatter=new Intl.NumberFormat('vi-VN',{minimumFractionDigits:2,maximumFractionDigits:2});
const dateFormatter=new Intl.DateTimeFormat('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'UTC'});
const date=iso=>!iso?'Chưa xác minh':/^\d{4}-\d{2}$/.test(iso)?iso.slice(5)+'/'+iso.slice(0,4):dateFormatter.format(new Date(iso.slice(0,10)+'T00:00:00Z'));
const number=value=>Number.isFinite(value)?integer.format(value):'—';
const score=value=>Number.isFinite(value)?decimal.format(value):'—';
const ratio=value=>Number.isFinite(value)?ratioFormatter.format(value):'—';
const safeUrl=url=>/^https?:\/\//i.test(url)?url:'#';
const external=(url,text)=>`<a href="${esc(safeUrl(url))}" target="_blank" rel="noopener noreferrer">${esc(text??url)}</a>`;
const fullName=j=>j.title+' ('+j.code+')';
const reduced=matchMedia('(prefers-reduced-motion: reduce)');

const brandThemes=[
 {id:'nature',name:'1. Nature Portfolio',short:'Nature',accent:'#a31d32',paper:'#ffffff',desc:'Nature Portfolio (Springer Nature) — Trắng học thuật, đỏ crimson & serif cổ điển'},
 {id:'economist',name:'2. The Economist',short:'Economist',accent:'#e3120b',paper:'#f9f8f5',desc:'The Economist — Viền đỏ đặc trưng, nền giấy ấm & bảng màu Data Team'},
 {id:'ft',name:'3. Financial Times',short:'Financial Times',accent:'#990f3d',paper:'#fff1e5',desc:'Financial Times — Giấy hồng salmon đặc trưng, đỏ claret & xanh Oxford'},
 {id:'scopus',name:'4. Elsevier Scopus',short:'Scopus',accent:'#ff6c00',paper:'#f7f9fc',desc:'Elsevier Scopus — Cam phân tích, xanh hải quân đậm & kiểu chữ hiện đại'},
 {id:'clarivate',name:'5. Clarivate WoS',short:'Clarivate WoS',accent:'#5e33bf',paper:'#f9f8fc',desc:'Clarivate Web of Science — Tím hoàng gia, chàm đậm & bố cục chỉ mục'},
 {id:'science',name:'6. Science (AAAS)',short:'Science AAAS',accent:'#c5001a',paper:'#ffffff',desc:'Science (AAAS) — Đỏ tươi AAAS, đường kẻ đen sắc nét & tương phản cao'},
 {id:'springer',name:'7. SpringerLink',short:'SpringerLink',accent:'#025e8d',paper:'#f6f9fb',desc:'SpringerLink — Thanh tiêu đề xanh navy học thuật & lam cerulean'},
 {id:'wiley',name:'8. Wiley Library',short:'Wiley',accent:'#00594f',paper:'#f7fbfa',desc:'Wiley Online Library — Xanh ngọc lục bảo, xanh lục nhạt & bo góc mềm'},
 {id:'nytimes',name:'9. NYT The Upshot',short:'NYT Upshot',accent:'#326891',paper:'#fdfdfc',desc:'The New York Times (The Upshot) — Viền kép nhật báo, chữ serif & xanh thép'},
 {id:'bloomberg',name:'10. Bloomberg Dark',short:'Bloomberg',accent:'#ff8000',paper:'#0d1219',desc:'Bloomberg Terminal — Nền tối carbon, cam hổ phách, xanh lục & font số kỹ thuật'}
];

const metricInfo={citescore:{label:'CiteScore & Tracker chính thức',short:'CiteScore',scopus:true,decimals:1},citations:{label:'Trích dẫn trong cửa sổ CiteScore',short:'Trích dẫn',scopus:true},documents:{label:'Tài liệu trong cửa sổ CiteScore',short:'Tài liệu',scopus:true},papers:{label:'Bài đã xuất bản',short:'Bài xuất bản'},issues:{label:'Kỳ đã xuất bản',short:'Kỳ xuất bản'},localDocs:{label:'Tài liệu trích dẫn đã xác nhận',short:'Tài liệu trích dẫn',local:true},localEdges:{label:'Lượt trích dẫn đã xác nhận',short:'Lượt trích dẫn',local:true},localScore:{label:'CiteScore dự kiến 4 năm tự tính (5 tạp chí chưa vào Scopus)',short:'CiteScore dự kiến',local:true,decimals:2}};
const metricValue=value=>state.metric==='localScore'?ratio(value):metricInfo[state.metric].decimals?score(value):number(value);
let dashboard,scopus,journals,recordIndex,state,chartWidth=1000,subChartWidth=680,plot,selectedYear=null,pinned=false,currentTheme='nature';
const defaultSeries=['vjm','ansn','vjc','vjes'];
const candidateIds=['vjmech','jcc','ajb','vjmst','vjbt'];
const nonScopusIds=['vjmech','jcc','ajb','vjmst','vjbt'];
const scopusIds=['vjm','amv','ansn','vjc','vjes','vjst','cip'];
const localIds=['vjc','vjes','vjst','cip','vjmech','jcc','ajb','vjmst','vjbt'];
let candidateSeries=new Set(candidateIds),citationSeriesSet=new Set(localIds),paperSeriesSet=new Set();
let citationMode='localEdges',papersFocusYear=2025;
const subState={candidates:{year:null,pinned:false,plot:null},citations:{year:null,pinned:false,plot:null},papers:{year:null,pinned:false,plot:null}};
const seriesPalette=[['var(--c1)',''],['var(--c2)','7 4'],['var(--c3)','2 4'],['var(--c4)','10 4 2 4'],['var(--c5)','14 4'],['var(--c6)','4 3'],['var(--c7)',''],['var(--c8)','9 3'],['var(--c9)','3 3'],['var(--c10)','11 3 2 3'],['var(--c11)','2 3'],['var(--c12)','6 3 1 3']];
let styles;
async function fetchJson(url){const response=await fetch(url,{cache:'no-cache'});if(!response.ok)throw new Error('Không tải được '+url+' ('+response.status+')');return response.json();}
function checkedAt(j){return j.checkedAt??dashboard.collectedAt;}
function output(j,year){return j.outputs.find(o=>o.year===Number(year));}
function scopusRecord(j,year){return recordIndex.get(j.code+'|'+year+'|'+(year===scopus.trackerYear?'tracker':'annual'));}
function verifiedScopus(j){return j.indexings.some(i=>i.system==='Scopus'&&i.status==='listed'&&i.evidenceLevel==='database');}
function observation(j,metric,year){
 if(metric==='localScore'){
  if(verifiedScopus(j))return {value:null,reason:'Tạp chí đã vào Scopus; chỉ dùng CiteScore chính thức.',updated:null,kind:'annual',verified:false,extra:null};
  const local=j.localCitation,r=local?.selfCalculatedSeries.find(v=>v.year===year);
  return {value:r?.value??null,reason:'Chưa có số liệu trong bộ thu thập đã đối chiếu.',updated:local?.sourceExportDate??null,kind:year===Number(dashboard.collectedAt.slice(0,4))?'ytd':'annual',verified:Boolean(r),extra:r};
 }
 if(metricInfo[metric].local){const local=j.localCitation,r=local?.citationSeries.find(v=>v.year===year);const value=metric==='localDocs'?r?.citingDocuments:r?.confirmedCitationEdges;return {value:value??null,reason:'Chưa có số liệu trong bộ thu thập đã đối chiếu.',updated:local?.sourceExportDate??null,kind:year===Number(dashboard.collectedAt.slice(0,4))?'ytd':'annual',verified:Boolean(r),extra:r};}
 if(!metricInfo[metric].scopus){const o=output(j,year),value=metric==='papers'&&o?.coverage!=='complete'?null:o?.[metric];return {value:value??null,reason:o?.noteVi??'Chưa có số liệu đã đối chiếu cho kỳ này.',updated:o?.asOf??null,kind:o?.periodKind??'annual',verified:metric==='issues'?Number.isFinite(o?.issues):o?.coverage==='complete',extra:o};}
 const r=scopusRecord(j,year);
 const value=metric==='citescore'?r?.value:r?.[metric];
 return {value:Number.isFinite(value)?value:null,reason:r?.status==='scopus_na'?'Scopus hiển thị N/A cho năm này.':'Chưa có số liệu trong bản đối chiếu Scopus.',updated:r?.lastUpdated??r?.accessed??null,kind:r?.type??'annual',verified:r?.status==='verified_scopus',extra:r};
}
function annualRecord(j){return recordIndex.get(j.code+'|'+scopus.annualYears.at(-1)+'|annual');}
function indexingName(i){return i.system==='WoS'?'WoS '+(i.collection??'chưa rõ bộ chỉ mục'):i.system;}
function indexingBadges(j){
 const entries=j.indexings.filter(i=>i.status==='listed');
 if(!entries.length)return '<span class="badge pending">Chưa đối chiếu</span>';
 return '<div class="badge-list">'+entries.map(i=>`<span class="badge ${i.evidenceLevel==='database'?'verified':''}" title="${esc((i.evidenceLevel==='database'?'Đối chiếu cơ sở dữ liệu':i.evidenceLevel==='vast'?'VAST công bố':'Website tạp chí công bố')+'; kiểm tra '+date(i.checkedAt))}">${esc(indexingName(i))}${i.evidenceLevel==='database'?'':'*'}</span>`).join('')+'</div>';
}
function applyTheme(themeId,persist=true){
 const found=brandThemes.find(t=>t.id===themeId)??brandThemes[0];
 currentTheme=found.id;
 document.documentElement.dataset.theme=currentTheme;
 document.querySelector('meta[name="theme-color"]')?.setAttribute('content',found.paper);
 if($('#theme-select'))$('#theme-select').value=currentTheme;
 if($('#theme-active-desc'))$('#theme-active-desc').textContent=found.desc;
 for(const btn of document.querySelectorAll('.theme-pill'))btn.setAttribute('aria-pressed',String(btn.dataset.theme===currentTheme));
 if(persist){
  try{localStorage.setItem('vast-dashboard-theme',currentTheme);}catch{}
  if(state)saveState();
 }
}
function renderThemeBar(){
 $('#theme-pills').innerHTML=brandThemes.map(t=>`<button type="button" class="theme-pill" data-theme="${t.id}" aria-pressed="${t.id===currentTheme}" title="${esc(t.desc)}"><span class="theme-swatch" style="background:linear-gradient(135deg,${t.accent} 55%,${t.paper} 55%)"></span><span class="theme-pill-name">${esc(t.name)}</span></button>`).join('');
}
function readState(){
 const p=new URLSearchParams(location.search),years=dashboard.outputYears;
 let savedTheme='nature';try{savedTheme=localStorage.getItem('vast-dashboard-theme')||'nature';}catch{}
 const requestedTheme=p.get('theme')||savedTheme;
 applyTheme(requestedTheme,false);
 const ids=p.has('series')?p.get('series').split(',').filter(id=>journals.some(j=>j.id===id)):defaultSeries;
 state={q:p.get('q')??'',year:years.includes(Number(p.get('year')))?Number(p.get('year')):dashboard.defaultOutputYear,subject:p.get('subject')??'all',index:p.get('index')??'all',sort:p.get('sort')??'default',metric:Object.hasOwn(metricInfo,p.get('metric'))?p.get('metric'):'citescore',from:Number(p.get('from')),to:Number(p.get('to')),series:new Set(ids)};
 const available=availableYears();
 if(!available.includes(state.from))state.from=available[0];
 if(!available.includes(state.to)||state.to<state.from)state.to=available.at(-1);
 if(!journals.some(j=>j.subject===state.subject))state.subject='all';
 if(!['all','Scopus','WoS','ACI','DOAJ','unverified'].includes(state.index))state.index='all';
 if(!['default','name','papers','citescore','updated'].includes(state.sort))state.sort='default';
}
function saveState(){
 const url=new URL(location.href),p=url.searchParams;
 const set=(key,value,defaultValue)=>{if(value===defaultValue)p.delete(key);else p.set(key,value);};
 set('theme',currentTheme,'nature');set('q',state.q,'');set('year',String(state.year),String(dashboard.defaultOutputYear));set('subject',state.subject,'all');set('index',state.index,'all');set('sort',state.sort,'default');set('metric',state.metric,'citescore');
 const years=availableYears();set('from',String(state.from),String(years[0]));set('to',String(state.to),String(years.at(-1)));
 const selected=journals.filter(j=>state.series.has(j.id)).map(j=>j.id).join(',');set('series',selected,defaultSeries.join(','));
 history.replaceState(null,'',url);
}
function availableYears(){const metric=state?.metric??'citescore';if(metricInfo[metric].local)return [...new Set(journals.flatMap(j=>(metric==='localScore'?j.localCitation?.selfCalculatedSeries:j.localCitation?.citationSeries)?.map(r=>r.year)??[]))].filter(y=>y>=2015&&y<=Number(dashboard.collectedAt.slice(0,4))).sort((a,b)=>a-b);return metricInfo[metric].scopus?[...scopus.annualYears,scopus.trackerYear]:dashboard.outputYears;}
function syncInputs(){
 $('#journal-search').value=state.q;$('#publication-year').value=String(state.year);$('#subject-filter').value=state.subject;$('#index-filter').value=state.index;$('#sort-order').value=state.sort;$('#trend-metric').value=state.metric;
 const years=availableYears(),options=years.map(y=>`<option value="${y}">${y}</option>`).join('');$('#trend-from').innerHTML=options;$('#trend-to').innerHTML=options;$('#trend-from').value=String(state.from);$('#trend-to').value=String(state.to);
}
function folded(text){return text.normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLocaleLowerCase('vi-VN');}
function filteredJournals(){
 const q=folded(state.q.trim());
 const list=journals.filter(j=>!q||folded([j.title,j.code,j.titleVi,j.issn,j.eissn,...(j.aliases??[]),...(j.formerTitles??[]).map(t=>t.title)].join(' ')).includes(q)).filter(j=>state.subject==='all'||j.subject===state.subject).filter(j=>state.index==='all'||(state.index==='unverified'?!verifiedScopus(j):state.index==='Scopus'?verifiedScopus(j):j.indexings.some(i=>i.system===state.index&&i.status==='listed')));
 if(state.sort==='name')list.sort((a,b)=>a.title.localeCompare(b.title,'en'));
 if(state.sort==='papers'){const value=j=>{const o=output(j,state.year);return o?.coverage==='complete'?o.papers:-1;};list.sort((a,b)=>value(b)-value(a));}
 if(state.sort==='citescore')list.sort((a,b)=>(annualRecord(b)?.value??-1)-(annualRecord(a)?.value??-1));
 if(state.sort==='updated')list.sort((a,b)=>checkedAt(b).localeCompare(checkedAt(a)));
 return list;
}
function renderOverview(){
 const outputs=journals.map(j=>output(j,state.year));
 const papers=outputs.filter(o=>o&&Number.isFinite(o.papers)&&o.coverage==='complete'),issues=outputs.filter(o=>o&&Number.isFinite(o.issues));
 const totalPapers=papers.reduce((sum,o)=>sum+o.papers,0),totalIssues=issues.reduce((sum,o)=>sum+o.issues,0);
 const period=state.year===Number(dashboard.collectedAt.slice(0,4))?'Đến '+date(dashboard.collectedAt):'Cả năm '+state.year;
 const totalConfirmedCitations=journals.reduce((sum,j)=>sum+(j.localCitation?.totals?.citations??0),0);
 const cells=[['Tạp chí trong danh mục',journals.length,'7 đã vào Scopus · 5 chưa vào Scopus'],['Bài xuất bản '+state.year,papers.length?number(totalPapers):'—',papers.length+'/12 tạp chí đủ nguồn · '+period],['Kỳ xuất bản '+state.year,issues.length?number(totalIssues):'—',issues.length+'/12 tạp chí đã đối chiếu'],['Lượt trích dẫn xác nhận (09–09h)',number(totalConfirmedCitations),'9 tạp chí VAST đã lọc trích dẫn ảo']];
 $('#summary-strip').innerHTML=cells.map(([label,value,detail])=>`<div class="summary-item"><span class="summary-label">${esc(label)}</span><strong class="summary-value">${esc(value)}</strong><span class="summary-detail">${esc(detail)}</span></div>`).join('');
 const year=scopus.annualYears.at(-1),previous=year-1;
 const comparable=journals.filter(j=>Number.isFinite(scopusRecord(j,year)?.value)&&Number.isFinite(scopusRecord(j,previous)?.value));
 const growing=comparable.filter(j=>scopusRecord(j,year).value>scopusRecord(j,previous).value);
 const remarks=[
  `${growing.length}/${comparable.length} tạp chí Scopus có số liệu so sánh tăng CiteScore năm ${year} so với ${previous}; VJES đạt 5,0 (Q1, phân vị 77%), ANSN đạt 3,9 và VJC đạt 3,0.`,
  `Chỉ số CiteScore tự tính (dự kiến) chỉ áp dụng cho 5 tạp chí chưa vào Scopus: VJMech (1,14) và JCC (1,12) vượt mốc Tracker Scopus 0,7 của CIP; AJB (0,65) và VJMST (0,63) tiệm cận mốc 0,7.`,
  `Giai đoạn 2020–2026, cả 12/12 tạp chí đã được kiểm đếm đầy đủ theo từng số phát hành chính thức (${number(totalPapers)} bài / ${number(totalIssues)} kỳ trong kỳ đang chọn ${state.year}).`
 ];
 $('#remarks').innerHTML=remarks.map(text=>`<li>${esc(text)}</li>`).join('');
 $('#coverage-copy').textContent='7 tạp chí đã vào Scopus chỉ dùng CiteScore/Tracker chính thức từ Scopus. Chỉ số CiteScore dự kiến (4 năm tự tính từ bộ 09, 09e–09h) chỉ áp dụng cho 5 tạp chí chưa vào Scopus (VJMech, JCC, AJB, VJMST, VJBT).';
}
function renderPortfolio(){
 const year=scopus.annualYears.at(-1),tracker=scopus.trackerYear;
 $('#annual-column').innerHTML='CiteScore '+year+'<small>Chính thức / dự kiến*</small>';$('#tracker-column').innerHTML='Tracker '+tracker+`<small>${date(scopus.records.find(r=>r.type==='tracker').lastUpdated)} / dự kiến*</small>`;$('#output-column').innerHTML=`Bài / kỳ ${state.year}<small>${state.year===Number(dashboard.collectedAt.slice(0,4))?'Đến '+date(dashboard.collectedAt):'Cả năm'}</small>`;
 const list=filteredJournals();
 $('#portfolio-body').innerHTML=list.map(j=>{
  const isScopus=verifiedScopus(j),a=annualRecord(j),t=scopusRecord(j,tracker),o=output(j,state.year),papers=o?.coverage==='complete'?o.papers:null;
  const local25=!isScopus?j.localCitation?.selfCalculatedSeries.find(r=>r.year===year):null;
  const local26=!isScopus?j.localCitation?.selfCalculatedSeries.find(r=>r.year===tracker):null;
  const annualCell=isScopus?(Number.isFinite(a?.value)?`<strong>${score(a.value)}</strong><small>Scopus chính thức</small>`:`<strong class="neutral">—</strong><small>Scopus N/A</small>`):(local25&&Number.isFinite(local25.value)?`<strong class="neutral">${ratio(local25.value)}*</strong><small>Dự kiến (${local25.numerator}/${local25.denominator})</small>`:'<strong class="neutral">—</strong>');
  const trackerCell=isScopus?(Number.isFinite(t?.value)?`<strong>${score(t.value)}</strong><small>Scopus Tracker</small>`:'<strong class="neutral">—</strong>'):(local26&&Number.isFinite(local26.value)?`<strong class="neutral">${ratio(local26.value)}*</strong><small>Dự kiến (${local26.numerator}/${local26.denominator})</small>`:'<strong class="neutral">—</strong>');
  return `<tr><th scope="row"><a href="#journal/${encodeURIComponent(j.id)}">${esc(fullName(j))}</a><small>${esc(j.subject)} · ${esc(j.titleVi)}</small></th><td class="index-cell">${indexingBadges(j)}</td><td data-label="CiteScore ${year}">${annualCell}</td><td data-label="Tracker ${tracker}">${trackerCell}</td><td data-label="Bài / kỳ ${state.year}"><strong class="${Number.isFinite(papers)?'':'neutral'}">${number(papers)}</strong><small>${Number.isFinite(o?.issues)?number(o.issues)+' kỳ':'Chưa đối chiếu kỳ'}</small></td><td class="updated-cell"><time datetime="${esc(checkedAt(j))}">${date(checkedAt(j))}</time><small>Hồ sơ / nguồn</small></td></tr>`;
 }).join('');
 $('#results-count').textContent=list.length+' / '+journals.length+' tạp chí';$('#portfolio-empty').hidden=list.length!==0;
}
function detailMetric(label,value,detail){return `<div><span class="summary-label">${esc(label)}</span><strong class="summary-value">${esc(value)}</strong><span class="summary-detail">${esc(detail)}</span></div>`;}
function renderDetail(id){
 const j=journals.find(item=>item.id===id),panel=$('#detail-panel');
 if(!j){panel.innerHTML='<h2 id="detail-heading">Không tìm thấy tạp chí</h2><p>Địa chỉ hồ sơ không nằm trong danh mục đã đối chiếu.</p><a href="#journals">Trở lại danh mục</a>';return;}
 const isScopus=verifiedScopus(j),a=annualRecord(j),t=scopusRecord(j,scopus.trackerYear),o=output(j,state.year),profileRows=[['Tên tiếng Việt',j.titleVi],['Lĩnh vực',j.subject],['ISSN bản in',j.issn??'Chưa xác minh'],['ISSN điện tử',j.eissn??'Chưa xác minh'],['Đơn vị xuất bản',j.publisher??'Chưa xác minh'],['Kỳ hạn công bố',j.frequency?.issuesPerYear?j.frequency.issuesPerYear+' kỳ/năm (theo website)':'Chưa xác minh'],['Ngày đối chiếu',date(checkedAt(j))]];
 const ownRecords=scopus.records.filter(r=>r.journal===j.code);
 const categories=j.scopusCategories??[];
 const local25=!isScopus?j.localCitation?.selfCalculatedSeries.find(r=>r.year===scopus.annualYears.at(-1)):null;
 const local26=!isScopus?j.localCitation?.selfCalculatedSeries.find(r=>r.year===scopus.trackerYear):null;
 const metricRows=ownRecords.map(r=>`<tr><th scope="row">${r.year}${r.type==='tracker'?' · Tracker':''}</th><td>${score(r.value)}</td><td>${number(r.citations)}</td><td>${number(r.documents)}</td></tr>`).join('');
 const outputRows=j.outputs.map(row=>`<tr><th scope="row">${row.year}${row.periodKind==='ytd'?' · đến '+date(row.asOf):''}</th><td>${row.coverage==='complete'?number(row.papers):'—'}</td><td>${number(row.issues)}</td><td>${row.coverage==='complete'?'Đã đối chiếu':'Chưa đủ số bài'}</td></tr>`).join('');
 const indexRows=j.indexings.map(i=>`<li><strong>${esc(indexingName(i))}</strong> · ${i.status==='listed'?'Có tên theo nguồn':i.status==='not_listed'?'Nguồn ghi chưa thuộc danh mục':'Chưa xác minh'}<small>${i.evidenceLevel==='database'?'Đối chiếu trực tiếp cơ sở dữ liệu':i.evidenceLevel==='vast'?'Thông báo VAST':'Công bố trên website tạp chí'} · ${date(i.checkedAt)}${i.coverage?' · Phạm vi '+esc(i.coverage):''}</small>${external(i.sourceUrl,'Mở nguồn đối chiếu')}</li>`).join('');
 const issueGroups=j.outputs.slice().reverse().map(row=>`<section class="detail-section"><h3>Nguồn sản lượng ${row.year} (${number(row.papers)} bài / ${number(row.issues)} kỳ)</h3><p class="detail-note">${row.coverage==='complete'?'Đã đối chiếu bài đủ điều kiện trong các số đã phát hành.':'Chưa đủ bằng chứng để chốt tổng số bài; không suy từ số trang hay kỳ hạn xuất bản.'}${row.periodKind==='ytd'?' Số liệu đến '+date(row.asOf)+'.':''}</p><ul class="source-evidence">${row.issueItems.map(issue=>`<li>${external(issue.url,issue.title)}<small>${issue.published?'Phát hành '+date(issue.published)+' · ':''}${issue.paperKeys.length?issue.paperKeys.length+' bài được liệt kê':'Nguồn số đã phát hành'}</small></li>`).join('')}</ul></section>`).join('');
 const card1=isScopus?detailMetric('CiteScore '+scopus.annualYears.at(-1),score(a?.value),Number.isFinite(a?.value)?'Nguồn Scopus chính thức':'Scopus hiển thị N/A'):local25?detailMetric('CiteScore dự kiến '+local25.year,ratio(local25.value),`Tự tính 4 năm (${local25.numerator}/${local25.denominator}) · chưa vào Scopus`):detailMetric('CiteScore '+scopus.annualYears.at(-1),'—','Chưa vào Scopus');
 const card2=isScopus?detailMetric('Tracker '+scopus.trackerYear,score(t?.value),t?'Cập nhật '+date(t.lastUpdated):'Nguồn Scopus'):local26?detailMetric('Tracker dự kiến '+local26.year,ratio(local26.value),`Tự tính 4 năm (${local26.numerator}/${local26.denominator}) · chưa vào Scopus`):detailMetric('Tracker '+scopus.trackerYear,'—','Chưa vào Scopus');
 panel.innerHTML=`<a class="detail-back" href="#journals">Trở lại danh mục tạp chí</a><h2 id="detail-heading" class="detail-heading">${esc(fullName(j))}</h2><p class="detail-subtitle">${esc(j.titleVi)} · ${esc(j.subject)}</p><div class="detail-metrics">${card1}${card2}${detailMetric('Bài xuất bản '+state.year,o?.coverage==='complete'?number(o.papers):'—',Number.isFinite(o?.issues)?o.issues+' kỳ đã phát hành':'Chưa đủ nguồn sản lượng')}</div><div class="detail-grid"><div><section class="detail-section"><h3>Hồ sơ tạp chí</h3><dl class="profile-list">${profileRows.map(([label,value])=>`<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>${j.formerTitles?.length?`<p class="detail-note">Tên / ISSN trước đây: ${j.formerTitles.map(v=>esc(v.title)+(v.issn?' ('+esc(v.issn)+')':'')).join('; ')}.</p>`:''}<div class="detail-links">${external(j.website,'Website chính thức')}<a href="#trends" data-trend-journal="${j.id}">Xem xu hướng tạp chí</a></div></section><section class="detail-section"><h3>Sản lượng xuất bản (2020–2026)</h3><div class="detail-table-scroll"><table class="detail-table"><thead><tr><th scope="col">Kỳ dữ liệu</th><th scope="col">Bài</th><th scope="col">Số / kỳ</th><th scope="col">Đối chiếu</th></tr></thead><tbody>${outputRows}</tbody></table></div><p class="detail-note">Đếm bài trong số đã phát hành, khác số tài liệu trong cửa sổ tính CiteScore. Không tính tăng/giảm giữa một năm chưa kết thúc và cả năm trước.</p></section>${ownRecords.length?`<section class="detail-section"><h3>Lịch sử Scopus chính thức</h3><div class="detail-table-scroll"><table class="detail-table"><thead><tr><th scope="col">Năm</th><th scope="col">CiteScore</th><th scope="col">Trích dẫn</th><th scope="col">Tài liệu</th></tr></thead><tbody>${metricRows}</tbody></table></div><p class="detail-note">Trích dẫn / tài liệu thuộc cửa sổ tính CiteScore của từng năm; Tracker là tạm thời. “—” là nguồn chưa có giá trị, không phải 0.</p></section>`:'<p class="detail-note">Tạp chí chưa có trong danh mục Scopus chính thức; xem bảng trích dẫn và CiteScore dự kiến 4 năm tự tính bên dưới.</p>'}${categories.length?`<section class="detail-section"><h3>Phân vị theo nhóm ngành Scopus</h3><ul class="source-evidence">${categories.map(c=>`<li>${esc(c.name)} · ${c.year}<small>Phân vị ${number(c.percentile)} · Hạng ${number(c.rank)}/${number(c.total)}</small>${external(c.sourceUrl,'Nguồn Scopus')}</li>`).join('')}</ul></section>`:''}</div><div><section class="detail-section"><h3>Tình trạng chỉ mục</h3><ul class="source-evidence">${indexRows||'<li>Chưa có trạng thái chỉ mục được đối chiếu.</li>'}</ul></section><section class="detail-section"><h3>Kỳ phát hành mới nhất</h3>${j.latestIssue?`<p>${external(j.latestIssue.url,j.latestIssue.title)}</p><p class="detail-note">${j.latestIssue.published?'Phát hành '+date(j.latestIssue.published):'Chưa xác minh ngày phát hành'}</p>`:'<p class="detail-note">Chưa xác minh kỳ phát hành mới nhất.</p>'}</section>${issueGroups}<section class="detail-section"><h3>Nguồn hồ sơ</h3><ol class="reference-list" role="list">${j.profileSources.map(url=>`<li><p>${external(url)}. Truy cập ngày ${date(checkedAt(j))}.</p></li>`).join('')}</ol></section></div></div>`;
 if(j.localCitation)panel.querySelector('.detail-grid>div').insertAdjacentHTML('beforeend',localCitationSection(j));
}
function localCitationSection(j){
 const local=j.localCitation,showSelfScore=!verifiedScopus(j);
 const years=[...new Set([...local.citationSeries,...(showSelfScore?local.selfCalculatedSeries:[])].map(r=>r.year))].filter(y=>y>=2015&&y<=Number(dashboard.collectedAt.slice(0,4))).sort((a,b)=>a-b);
 const rows=years.map(year=>{
  const c=local.citationSeries.find(r=>r.year===year),s=showSelfScore?local.selfCalculatedSeries.find(r=>r.year===year):null;
  const scoreCol=showSelfScore?`<td title="${s?esc(s.window+': '+s.numerator+' / '+s.denominator):'Chưa có giá trị'}">${ratio(s?.value)}${s&&s.denominator>0?` <small>(${s.numerator}/${s.denominator})</small>`:''}</td>`:'';
  return `<tr><th scope="row">${year}</th><td>${number(c?.citingDocuments)}</td><td>${number(c?.confirmedCitationEdges)}</td>${scoreCol}</tr>`;
 }).join('');
 const tot=local.totals?`<p class="detail-note"><strong>Tổng hợp toàn bộ dữ liệu xác nhận:</strong> ${number(local.totals.citations)} lượt trích dẫn từ ${number(local.totals.citingDocs)} tài liệu trích dẫn (lọc từ ${number(local.totals.sourceRows)} dòng Scopus thô); ${number(local.totals.citedArticles)} bài được trích dẫn; <strong>h-index: ${number(local.totals.hIndex)}</strong>.</p>`:'';
 const heading=showSelfScore?'Trích dẫn &amp; CiteScore dự kiến (4 năm tự tính)':'Trích dẫn đã xác nhận từ bộ số liệu thu thập (09–09h)';
 const colHead=showSelfScore?'<th scope="col">CiteScore dự kiến<br>4 năm (tử/mẫu)</th>':'';
 const footNote=showSelfScore?'Năm là năm của tài liệu trích dẫn. CiteScore dự kiến = lượt trích dẫn xác nhận trong cửa sổ 4 năm tới bài xuất bản trong cùng cửa sổ / số bài trong danh mục của cửa sổ (chỉ áp dụng cho 5 tạp chí chưa vào Scopus).':'Năm là năm của tài liệu trích dẫn. Tạp chí đã vào Scopus nên chỉ số CiteScore và Tracker sử dụng trực tiếp từ bảng Lịch sử Scopus chính thức phía trên.';
 return `<section class="detail-section"><h3>${heading}</h3><p class="detail-note">Xử lý ngày ${date(local.processedAt)}.${local.sourceExportDate?' Xuất Scopus ngày '+date(local.sourceExportDate)+'.':' Bộ dữ liệu chưa ghi ngày xuất Scopus.'} Chỉ đếm tài liệu và lượt trích dẫn đã khớp với danh mục bài.</p>${tot}<div class="detail-table-scroll"><table class="detail-table"><thead><tr><th scope="col">Năm</th><th scope="col">Tài liệu trích dẫn</th><th scope="col">Lượt trích dẫn</th>${colHead}</tr></thead><tbody>${rows}</tbody></table></div><p class="detail-note">${footNote}</p>${local.publicSourceUrl?external(local.publicSourceUrl,'Nguồn thống kê tạp chí'):''}</section>`;
}
function renderUpdates(){
 $('#snapshot-history').innerHTML=dashboard.history.map(h=>`<li><time datetime="${h.date}">${date(h.date)}</time><h4>${esc(h.title)}</h4><p>${esc(h.description)}</p>${h.url?`<a href="${esc(h.url)}">Mở bản dữ liệu đã lưu</a>`:''}</li>`).join('');
 $('#source-links').innerHTML=journals.map(j=>{const original=scopus.journals.find(v=>v.code===j.code);return `<li><p><cite>${esc(fullName(j))}</cite>. ${external(j.website)}. Đối chiếu ngày ${date(checkedAt(j))}.${original?' Scopus Source Details: '+external('https://www.scopus.com/sourceid/'+original.sourceId,'nguồn chỉ số')+'.':''} <a href="#journal/${j.id}">Nguồn từng số / kỳ</a>.</p></li>`;}).join('');
}
function route(moveFocus=false){
 const hash=location.hash.slice(1)||'overview',detail=hash.startsWith('journal/'),view=detail?'detail':['overview','journals','trends','updates'].includes(hash)?hash:'overview';
 $('#overview-panel').hidden=view!=='overview';
 $('#trends-panel').hidden=!['overview','trends'].includes(view);
 $('#portfolio-panel').hidden=!['overview','journals'].includes(view);
 $('#updates-panel').hidden=view!=='updates';
 $('#detail-panel').hidden=view!=='detail';
 for(const tab of document.querySelectorAll('.tabs a')){if(tab.dataset.view===(detail?'journals':view))tab.setAttribute('aria-current','page');else tab.removeAttribute('aria-current');}
 if(detail){let id;try{id=decodeURIComponent(hash.slice(8));}catch{id='';}renderDetail(id);document.title=(journals.find(j=>j.id===id)?.code??'Hồ sơ')+' · VAST';}
 else document.title=({'overview':'Tổng quan','journals':'Danh mục','trends':'Biểu đồ & xu hướng','updates':'Nguồn & cập nhật'}[view])+' · VAST';
 if(['overview','trends'].includes(view))renderAllCharts();else closeAllTooltips();
 if(moveFocus){const target=view==='detail'?$('#detail-heading'):$('#main-content');target.tabIndex=-1;target.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}
}
function legendButtonsHtml(ids,activeSet,attrName){
 return ids.map(id=>{
  const j=journals.find(x=>x.id===id),s=styles[id];
  const mark=`<line x1="0" y1="6" x2="28" y2="6" stroke="${s.color}" stroke-width="2"${s.dash?` stroke-dasharray="${s.dash}"`:''}/>`;
  return `<button class="journal-toggle" type="button" ${attrName}="${j.id}" aria-pressed="${activeSet.has(j.id)}" aria-label="${esc(fullName(j))}" title="${esc(fullName(j))}"><svg viewBox="0 0 28 12" aria-hidden="true">${mark}</svg><span class="legend-label" translate="no">${j.code}</span></button>`;
 }).join('');
}
function renderLegend(){
 const list=state.metric==='localScore'?journals.filter(j=>!verifiedScopus(j)):journals;
 $('#chart-legend').innerHTML=list.map(j=>{const s=styles[j.id],isTrackerOnly=j.code==='CIP'&&state.metric==='citescore';const mark=isTrackerOnly?`<path d="M14 1 L19 6 L14 11 L9 6 Z" fill="var(--paper)" stroke="${s.color}" stroke-width="2"/>`:`<line x1="0" y1="6" x2="28" y2="6" stroke="${s.color}" stroke-width="2"${s.dash?` stroke-dasharray="${s.dash}"`:''}/>`;return `<button class="journal-toggle" type="button" data-journal="${j.id}" aria-pressed="${state.series.has(j.id)}" aria-label="${esc(fullName(j))}" title="${esc(fullName(j))}"><svg viewBox="0 0 28 12" aria-hidden="true">${mark}</svg><span class="legend-label" translate="no">${j.code}</span></button>`;}).join('');
}
function niceScale(maximum,decimals=false){
 const target=Math.max(decimals?0.5:1,maximum*1.12),rough=target/5,power=10**Math.floor(Math.log10(rough));
 let step=[1,2,2.5,5,10].find(n=>n>=rough/power)*power;
 if(!decimals)step=Math.max(1,step);
 return {step,max:Math.ceil(target/step)*step};
}
function formatAxisTick(v,decimals){
 if(!decimals)return integer.format(v);
 return Number.isInteger(v)?integer.format(v):decimal.format(v);
}
function renderChart(){
 if(!dashboard)return;
 const width=chartWidth,height=matchMedia('(max-width:767px)').matches?270:360,left=48,right=34,top=32,bottom=34;
 const years=availableYears().filter(y=>y>=state.from&&y<=state.to),start=years[0],end=years.at(-1),plotWidth=width-left-right,plotHeight=height-top-bottom;
 const values=journals.flatMap(j=>years.map(y=>observation(j,state.metric,y).value)).filter(Number.isFinite),scale=niceScale(Math.max(0,...values),Boolean(metricInfo[state.metric].decimals));
 const x=year=>years.length===1?left+plotWidth/2:left+(year-start)/(end-start)*plotWidth,y=value=>top+(1-value/scale.max)*plotHeight;
 plot={width,height,left,right,top,bottom,plotWidth,years,start,end,x,y};
 const chart=$('#trend-chart');chart.setAttribute('viewBox',`0 0 ${width} ${height}`);
 const currentYear=Number(dashboard.collectedAt.slice(0,4)),provisional=years.includes(currentYear);
 let svg=`<title id="chart-title">${esc(metricInfo[state.metric].label)} ${start}–${end}</title><desc id="chart-description">Đọc số liệu theo năm bằng chuột, chạm hoặc bàn phím. Giá trị chưa có nguồn không được vẽ thành 0. Năm ${currentYear} là ${metricInfo[state.metric].scopus?'Tracker tạm thời':'năm chưa kết thúc'}.</desc>`;
 if(provisional){const boundary=years.length===1?left:(x(currentYear-1)+x(currentYear))/2;svg+=`<rect x="${boundary}" y="${top-8}" width="${width-boundary}" height="${plotHeight+8}" fill="var(--surface)"/><text x="${width-6}" y="16" text-anchor="end" fill="var(--muted)" font-size="11">${metricInfo[state.metric].scopus?'Tracker':metricInfo[state.metric].local?'Chưa đủ năm':'Đến ngày chốt'}</text>`;}
 for(let i=0;i<=Math.round(scale.max/scale.step);i++){const v=+(i*scale.step).toFixed(4);svg+=`<line x1="${left}" y1="${y(v)}" x2="${width}" y2="${y(v)}" stroke="var(--line)"/><text x="${left-10}" y="${y(v)+4}" text-anchor="end" fill="var(--muted)" font-size="11">${formatAxisTick(v,Boolean(metricInfo[state.metric].decimals))}</text>`;}
 const tickStep=years.length<=7?1:width<600?3:2;
 for(const year of years)if((year-start)%tickStep===0||year===end)svg+=`<text x="${x(year)}" y="${height-10}" text-anchor="middle" fill="var(--muted)" font-size="12">${year}</text>`;
 for(const j of journals){
  const style=styles[j.id];let d='',connected=false;svg+=`<g class="journal-series" data-journal="${j.id}" aria-hidden="true">`;
  for(const year of years){const o=observation(j,state.metric,year);if(!Number.isFinite(o.value)){connected=false;continue;}const provisionalPoint=['tracker','ytd'].includes(o.kind);if(!provisionalPoint){d+=(connected?' L':'M')+x(year).toFixed(2)+' '+y(o.value).toFixed(2);connected=true;}else{const previous=observation(j,state.metric,year-1);if(year>start&&Number.isFinite(previous.value))svg+=`<path d="M${x(year-1)} ${y(previous.value)} L${x(year)} ${y(o.value)}" class="provisional-segment" fill="none" stroke="${style.color}" stroke-width="2" stroke-dasharray="5 4"/>`;connected=false;}}
  if(d)svg+=`<path class="chart-series" d="${d}" fill="none" stroke="${style.color}" stroke-width="2"${style.dash?` stroke-dasharray="${style.dash}"`:''}/>`;
  for(const year of years){const o=observation(j,state.metric,year);if(!Number.isFinite(o.value))continue;const px=x(year),py=y(o.value),attrs=`class="chart-point" data-journal="${j.id}" data-year="${year}" data-value="${o.value}" data-kind="${o.kind}"`;svg+=['tracker','ytd'].includes(o.kind)?`<path ${attrs} d="M${px} ${py-5} L${px+5} ${py} L${px} ${py+5} L${px-5} ${py} Z" fill="var(--paper)" stroke="${style.color}" stroke-width="2"/>`:`<circle ${attrs} cx="${px}" cy="${py}" r="3.25" fill="${style.color}" stroke="var(--paper)"/>`;}
  svg+='</g>';
 }
 svg+=`<g id="chart-empty" hidden><text x="${width/2}" y="${height/2-10}" text-anchor="middle" fill="var(--muted)" font-size="13"><tspan x="${width/2}">Chưa có giá trị để vẽ</tspan><tspan x="${width/2}" dy="22">Đổi chỉ số, khoảng năm hoặc chọn tạp chí.</tspan></text></g><g id="chart-hover" aria-hidden="true" pointer-events="none" hidden></g>`;
 chart.innerHTML=svg;updateSeries();
 const processingDates=[...new Set(journals.filter(j=>j.localCitation).map(j=>j.localCitation.processedAt.slice(0,10)))].sort(),processingPeriod=processingDates.length===1?date(processingDates[0]):date(processingDates[0])+'–'+date(processingDates.at(-1));
 $('#chart-caption').textContent=state.metric==='localScore'?`Nguồn: bộ số liệu 09, 09e–09h, xử lý ${processingPeriod}. Chỉ số CiteScore 4 năm tự tính chỉ áp dụng cho 5 tạp chí chưa vào Scopus (VJMech, JCC, AJB, VJMST, VJBT).`:metricInfo[state.metric].local?`Nguồn: bộ số liệu đã thu thập 09–09h, xử lý ${processingPeriod}. Tài liệu / lượt trích dẫn được tính theo năm của tài liệu trích dẫn và chỉ gồm tập đã xác nhận.`:metricInfo[state.metric].scopus?`Điểm tròn: số liệu năm trong cửa sổ tính CiteScore. Hình thoi, nét đứt: Tracker ${scopus.trackerYear}, cập nhật ${date(scopus.records.find(r=>r.type==='tracker').lastUpdated)}. Trích dẫn / tài liệu không phải sản lượng xuất bản của riêng năm đó.`:`Bài / kỳ trong các số đã phát hành. ${currentYear} là số liệu đến ${date(dashboard.collectedAt)}, không tương đương một năm đầy đủ. Giá trị thiếu nguồn không được thay bằng 0.`;
}
function updateSeries(animate=false){
 for(const button of document.querySelectorAll('#chart-legend .journal-toggle'))button.setAttribute('aria-pressed',String(state.series.has(button.dataset.journal)));
 let points=0;for(const group of document.querySelectorAll('#trend-chart .journal-series')){const on=state.series.has(group.dataset.journal),wasHidden=group.hasAttribute('hidden');group.toggleAttribute('hidden',!on);group.classList.remove('is-muted');if(on)points+=group.querySelectorAll('.chart-point').length;if(on&&wasHidden&&animate&&!reduced.matches)group.animate([{opacity:0},{opacity:1}],{duration:180,easing:'cubic-bezier(.23,1,.32,1)'});}
 const pool=state.metric==='localScore'?nonScopusIds:journals.map(j=>j.id);
 $('#show-all').disabled=pool.every(id=>state.series.has(id));$('#chart-empty')?.toggleAttribute('hidden',points!==0);
 const selected=pool.filter(id=>state.series.has(id)).map(id=>journals.find(j=>j.id===id)).filter(Boolean),withData=selected.filter(j=>plot.years.some(y=>Number.isFinite(observation(j,state.metric,y).value))).length;
 $('#chart-scope').textContent=`${selected.length} tạp chí được chọn; ${withData} có giá trị trong khoảng năm này.`+(selected.length>4?' Có thể chọn 2–4 tạp chí để dễ đối chiếu.':'');
 if(!points)closeDetails();else if(selectedYear!==null)showYear(selectedYear,true);
}
function closeDetails(announce=false){selectedYear=null;pinned=false;$('#chart-tooltip').hidden=true;$('#chart-hover')?.setAttribute('hidden','');if(announce)$('#chart-announcement').textContent='Đã đóng bảng số liệu.';}
function closeAllTooltips(){
 closeDetails();
 for(const key of ['candidates','citations','papers']){
  subState[key].year=null;subState[key].pinned=false;
  $(`#${key}-tooltip`).hidden=true;
  $(`#${key}-chart .sub-hover`)?.setAttribute('hidden','');
 }
}
function showYear(year,force=false,announce=false){
 if(!state.series.size||!plot.years.includes(year))return;if(year===selectedYear&&!force)return;selectedYear=year;
 const pool=state.metric==='localScore'?journals.filter(j=>!verifiedScopus(j)):journals;
 const rows=pool.filter(j=>state.series.has(j.id)).map(j=>({j,o:observation(j,state.metric,year)})),provisional=year===Number(dashboard.collectedAt.slice(0,4));
 const heading=metricInfo[state.metric].short+' '+year+(provisional?(metricInfo[state.metric].scopus?' · Tracker':metricInfo[state.metric].local?' · chưa đủ năm':' · đến ngày chốt'):'');$('#tooltip-year').textContent=heading;
 $('#tooltip-values').innerHTML=rows.map(({j,o})=>`<div class="tooltip-row"><dt><span class="tooltip-dot" style="background:${styles[j.id].color}" aria-hidden="true"></span><span title="${esc(fullName(j))}" translate="no">${j.code}</span></dt><dd class="${Number.isFinite(o.value)?'':'neutral'}" title="${esc(Number.isFinite(o.value)?'':o.reason)}">${metricValue(o.value)}</dd></div>`).join('');
 $('#tooltip-note').textContent=state.metric==='localScore'?'Chỉ áp dụng cho 5 tạp chí chưa vào Scopus. Các tạp chí đã vào Scopus dùng CiteScore chính thức.':metricInfo[state.metric].local?'Tập số liệu đã thu thập; không phải tổng trích dẫn của Scopus. “—”: chưa có nguồn.':provisional?(metricInfo[state.metric].scopus?'Chỉ số tạm thời. Nguồn cập nhật '+date(scopus.records.find(r=>r.type==='tracker').lastUpdated)+'.':'Năm chưa kết thúc; đối chiếu đến '+date(dashboard.collectedAt)+'.'):'“—”: chưa có giá trị được đối chiếu cho kỳ này.';
 const px=plot.x(year),tipWidth=Math.min(300,plot.width-24);$('#chart-tooltip').style.left=Math.max(12,px+16+tipWidth<=plot.width-12?px+16:px-tipWidth-16)+'px';$('#chart-tooltip').hidden=false;
 const hover=$('#chart-hover');hover.removeAttribute('hidden');hover.innerHTML=`<line x1="${px}" y1="${plot.top}" x2="${px}" y2="${plot.height-plot.bottom}" stroke="var(--muted)" stroke-dasharray="3 4"/>`+rows.filter(r=>Number.isFinite(r.o.value)).map(({j,o})=>`<circle cx="${px}" cy="${plot.y(o.value)}" r="5" fill="var(--paper)" stroke="${styles[j.id].color}" stroke-width="2.5"/>`).join('');
 if(announce)$('#chart-announcement').textContent=heading+'. '+rows.map(({j,o})=>j.code+': '+metricValue(o.value)).join('; ')+'.';
}
function yearFromPointer(event,p=plot,svgEl=$('#trend-chart')){
 const bounds=svgEl.getBoundingClientRect(),px=(event.clientX-bounds.left)*p.width/bounds.width;
 return p.years.length===1?p.start:Math.max(p.start,Math.min(p.end,Math.round(p.start+(px-p.left)/p.plotWidth*(p.end-p.start))));
}

function renderCandidatesChart(){
 if(!dashboard)return;
 $('#candidates-legend').innerHTML=legendButtonsHtml(candidateIds,candidateSeries,'data-candidate');
 const width=subChartWidth,height=matchMedia('(max-width:767px)').matches?260:340,left=48,right=34,top=34,bottom=34;
 const years=[2015,2016,2017,2018,2019,2020,2021,2022,2023,2024,2025,2026],start=years[0],end=years.at(-1),plotWidth=width-left-right,plotHeight=height-top-bottom;
 const list=candidateIds.map(id=>journals.find(j=>j.id===id));
 const values=list.flatMap(j=>years.map(y=>observation(j,'localScore',y).value)).filter(Number.isFinite);
 const scale=niceScale(Math.max(1.2,...values),true);
 const x=year=>left+(year-start)/(end-start)*plotWidth,y=value=>top+(1-value/scale.max)*plotHeight;
 subState.candidates.plot={width,height,left,right,top,bottom,plotWidth,years,start,end,x,y};
 const boundary=(x(2025)+x(2026))/2,cipOfficialTracker=0.7;
 let svg=`<title id="candidates-chart-title">CiteScore dự kiến của 5 tạp chí chưa vào Scopus (2015–2026)</title><desc id="candidates-chart-desc">Diễn biến chỉ số 4 năm tự tính của 5 tạp chí chưa vào Scopus: VJMech, JCC, AJB, VJMST, VJBT.</desc>`;
 svg+=`<rect x="${boundary}" y="${top-10}" width="${width-boundary}" height="${plotHeight+10}" fill="var(--surface)"/><text x="${width-6}" y="15" text-anchor="end" fill="var(--muted)" font-size="11">Dự kiến 2026</text>`;
 for(let i=0;i<=Math.round(scale.max/scale.step);i++){const v=+(i*scale.step).toFixed(4);svg+=`<line x1="${left}" y1="${y(v)}" x2="${width}" y2="${y(v)}" stroke="var(--line)"/><text x="${left-10}" y="${y(v)+4}" text-anchor="end" fill="var(--muted)" font-size="11">${formatAxisTick(v,true)}</text>`;}
 svg+=`<line x1="${left}" y1="${y(cipOfficialTracker)}" x2="${width}" y2="${y(cipOfficialTracker)}" stroke="var(--accent)" stroke-width="1.25" stroke-dasharray="4 4"/><text x="${left+6}" y="${y(cipOfficialTracker)-6}" fill="var(--accent)" font-size="11" font-weight="500">Mốc tham chiếu Tracker Scopus chính thức của CIP (2026): 0,7</text>`;
 const tickStep=width<520?3:2;
 for(const year of years)if((year-start)%tickStep===0||year===end)svg+=`<text x="${x(year)}" y="${height-10}" text-anchor="middle" fill="var(--muted)" font-size="12">${year}</text>`;
 for(const j of list){
  const style=styles[j.id],on=candidateSeries.has(j.id);let d='',connected=false;
  svg+=`<g class="journal-series" data-candidate-series="${j.id}"${on?'':' hidden'} aria-hidden="true">`;
  for(const year of years){
   const o=observation(j,'localScore',year);if(!Number.isFinite(o.value)){connected=false;continue;}
   if(year<2026){d+=(connected?' L':'M')+x(year).toFixed(2)+' '+y(o.value).toFixed(2);connected=true;}
   else{const prev=observation(j,'localScore',2025);if(Number.isFinite(prev.value))svg+=`<path d="M${x(2025)} ${y(prev.value)} L${x(2026)} ${y(o.value)}" fill="none" stroke="${style.color}" stroke-width="2" stroke-dasharray="5 4"/>`;connected=false;}
  }
  if(d)svg+=`<path d="${d}" fill="none" stroke="${style.color}" stroke-width="2"${style.dash?` stroke-dasharray="${style.dash}"`:''}/>`;
  for(const year of years){
   const o=observation(j,'localScore',year);if(!Number.isFinite(o.value))continue;
   const px=x(year),py=y(o.value);
   svg+=year===2026?`<path d="M${px} ${py-5} L${px+5} ${py} L${px} ${py+5} L${px-5} ${py} Z" fill="var(--paper)" stroke="${style.color}" stroke-width="2"/>`:`<circle cx="${px}" cy="${py}" r="3.25" fill="${style.color}" stroke="var(--paper)"/>`;
  }
  svg+='</g>';
 }
 svg+=`<g class="sub-hover" aria-hidden="true" pointer-events="none" hidden></g>`;
 $('#candidates-chart').innerHTML=svg;
 if(subState.candidates.year!==null)showCandidateYear(subState.candidates.year,true);
 const barRows=candidateIds.map(id=>{
  const j=journals.find(x=>x.id===id),s25=j.localCitation.selfCalculatedSeries.find(r=>r.year===2025),s26=j.localCitation.selfCalculatedSeries.find(r=>r.year===2026);
  return {j,s25,s26};
 }).sort((a,b)=>(b.s26?.value??0)-(a.s26?.value??0));
 const maxBar=Math.max(1.2,...barRows.flatMap(r=>[r.s25?.value??0,r.s26?.value??0]));
 $('#candidates-bars').innerHTML=barRows.map(({j,s25,s26},idx)=>{
  const c=styles[j.id].color;
  return `<div class="bar-item"><div class="bar-top"><div><a href="#journal/${j.id}">${idx+1}. ${esc(j.code)} · ${esc(j.title)}</a><small>Ứng viên chưa vào Scopus</small></div><div class="bar-metrics"><strong>${ratio(s26?.value)}</strong> (2026)</div></div><div class="bar-track"><div class="bar-row"><span>2025</span><div class="bar-rail"><div class="bar-fill" style="width:${((s25?.value??0)/maxBar*100).toFixed(1)}%;background:${c};opacity:.55"></div></div><span>${ratio(s25?.value)} (${s25?.numerator}/${s25?.denominator})</span></div><div class="bar-row"><span>2026*</span><div class="bar-rail"><div class="bar-fill" style="width:${((s26?.value??0)/maxBar*100).toFixed(1)}%;background:${c}"></div></div><span><strong>${ratio(s26?.value)}</strong> (${s26?.numerator}/${s26?.denominator})</span></div></div></div>`;
 }).join('');
}
function showCandidateYear(year,force=false){
 const p=subState.candidates.plot;if(!p||!candidateSeries.size||!p.years.includes(year))return;
 if(subState.candidates.year===year&&!force)return;subState.candidates.year=year;
 const rows=candidateIds.filter(id=>candidateSeries.has(id)).map(id=>{const j=journals.find(x=>x.id===id);return {j,o:observation(j,'localScore',year)};});
 $('#candidates-tooltip-year').textContent='CiteScore dự kiến '+year+(year===2026?' · Tracker dự kiến':'');
 $('#candidates-tooltip-values').innerHTML=rows.map(({j,o})=>`<div class="tooltip-row"><dt><span class="tooltip-dot" style="background:${styles[j.id].color}"></span><span>${j.code}</span></dt><dd class="${Number.isFinite(o.value)?'':'neutral'}">${ratio(o.value)}${o.extra&&o.extra.denominator>0?` (${o.extra.numerator}/${o.extra.denominator})`:''}</dd></div>`).join('');
 $('#candidates-tooltip-note').textContent=`Cửa sổ 4 năm (${year-3}–${year}) của 5 tạp chí chưa vào Scopus: lượt trích dẫn xác nhận / số bài trong danh mục.`;
 const px=p.x(year),tipWidth=Math.min(300,p.width-24),tip=$('#candidates-tooltip');
 tip.style.left=Math.max(12,px+16+tipWidth<=p.width-12?px+16:px-tipWidth-16)+'px';tip.hidden=false;
 const hover=$('#candidates-chart .sub-hover');hover.removeAttribute('hidden');
 hover.innerHTML=`<line x1="${px}" y1="${p.top}" x2="${px}" y2="${p.height-p.bottom}" stroke="var(--muted)" stroke-dasharray="3 4"/>`+rows.filter(r=>Number.isFinite(r.o.value)).map(({j,o})=>`<circle cx="${px}" cy="${p.y(o.value)}" r="5" fill="var(--paper)" stroke="${styles[j.id].color}" stroke-width="2.5"/>`).join('');
}

function citationObs(j,year){
 if(citationMode==='scopusCitations')return observation(j,'citations',year);
 return observation(j,citationMode,year);
}
function renderCitationsChart(){
 if(!dashboard)return;
 const poolIds=citationMode==='scopusCitations'?scopusIds:localIds;
 $('#citations-legend').innerHTML=legendButtonsHtml(poolIds,citationSeriesSet,'data-citation-journal');
 const width=subChartWidth,height=matchMedia('(max-width:767px)').matches?260:340,left=52,right=34,top=34,bottom=34;
 const years=[2015,2016,2017,2018,2019,2020,2021,2022,2023,2024,2025,2026],start=years[0],end=years.at(-1),plotWidth=width-left-right,plotHeight=height-top-bottom;
 const list=poolIds.map(id=>journals.find(j=>j.id===id));
 const activeList=list.filter(j=>citationSeriesSet.has(j.id));
 const values=(activeList.length?activeList:list).flatMap(j=>years.map(y=>citationObs(j,y).value)).filter(Number.isFinite);
 const scale=niceScale(Math.max(10,...values),false);
 const x=year=>left+(year-start)/(end-start)*plotWidth,y=value=>top+(1-value/scale.max)*plotHeight;
 subState.citations.plot={width,height,left,right,top,bottom,plotWidth,years,start,end,x,y,poolIds};
 const boundary=(x(2025)+x(2026))/2;
 const modeTitle=citationMode==='localEdges'?'Lượt trích dẫn đã xác nhận theo năm (2015–2026)':citationMode==='localDocs'?'Tài liệu trích dẫn đã xác nhận theo năm (2015–2026)':'Trích dẫn trong cửa sổ CiteScore 4 năm (2015–2026)';
 let svg=`<title id="citations-chart-title">${esc(modeTitle)}</title><desc id="citations-chart-desc">Biểu đồ diễn biến trích dẫn của các tạp chí VAST giai đoạn 2015–2026.</desc>`;
 svg+=`<rect x="${boundary}" y="${top-10}" width="${width-boundary}" height="${plotHeight+10}" fill="var(--surface)"/><text x="${width-6}" y="15" text-anchor="end" fill="var(--muted)" font-size="11">${citationMode==='scopusCitations'?'Tracker 2026':'2026 YTD'}</text>`;
 for(let i=0;i<=Math.round(scale.max/scale.step);i++){const v=i*scale.step;svg+=`<line x1="${left}" y1="${y(v)}" x2="${width}" y2="${y(v)}" stroke="var(--line)"/><text x="${left-10}" y="${y(v)+4}" text-anchor="end" fill="var(--muted)" font-size="11">${integer.format(v)}</text>`;}
 const tickStep=width<520?3:2;
 for(const year of years)if((year-start)%tickStep===0||year===end)svg+=`<text x="${x(year)}" y="${height-10}" text-anchor="middle" fill="var(--muted)" font-size="12">${year}</text>`;
 for(const j of list){
  const style=styles[j.id],on=citationSeriesSet.has(j.id);let d='',connected=false;
  svg+=`<g class="journal-series" data-citation-series="${j.id}"${on?'':' hidden'} aria-hidden="true">`;
  for(const year of years){
   const o=citationObs(j,year);if(!Number.isFinite(o.value)){connected=false;continue;}
   if(year<2026){d+=(connected?' L':'M')+x(year).toFixed(2)+' '+y(o.value).toFixed(2);connected=true;}
   else{const prev=citationObs(j,2025);if(Number.isFinite(prev.value))svg+=`<path d="M${x(2025)} ${y(prev.value)} L${x(2026)} ${y(o.value)}" fill="none" stroke="${style.color}" stroke-width="2" stroke-dasharray="5 4"/>`;connected=false;}
  }
  if(d)svg+=`<path d="${d}" fill="none" stroke="${style.color}" stroke-width="2"${style.dash?` stroke-dasharray="${style.dash}"`:''}/>`;
  for(const year of years){
   const o=citationObs(j,year);if(!Number.isFinite(o.value))continue;
   const px=x(year),py=y(o.value);
   svg+=year===2026?`<path d="M${px} ${py-5} L${px+5} ${py} L${px} ${py+5} L${px-5} ${py} Z" fill="var(--paper)" stroke="${style.color}" stroke-width="2"/>`:`<circle cx="${px}" cy="${py}" r="3.25" fill="${style.color}" stroke="var(--paper)"/>`;
  }
  svg+='</g>';
 }
 svg+=`<g class="sub-hover" aria-hidden="true" pointer-events="none" hidden></g>`;
 $('#citations-chart').innerHTML=svg;
 $('#citations-caption').textContent=citationMode==='scopusCitations'?'Trích dẫn thuộc cửa sổ 4 năm tính CiteScore trên Scopus của 7 tạp chí đã vào Scopus (2026 là Tracker cập nhật 05/10/2026).':'Số liệu trích dẫn từ 9 bộ thu thập (09–09h), tính theo năm xuất bản của tài liệu trích dẫn và chỉ giữ các trích dẫn đã xác nhận khớp danh mục bài gốc.';
 if(subState.citations.year!==null)showCitationYear(subState.citations.year,true);
 if(citationMode==='scopusCitations'){
  $('#citations-bar-heading').textContent='Trích dẫn cửa sổ 4 năm CiteScore (2025 & 2026)';
  $('#citations-bar-sub').textContent='So sánh tổng trích dẫn trong cửa sổ 4 năm trên Scopus chính thức (7 tạp chí).';
  const rows=scopusIds.map(id=>{const j=journals.find(x=>x.id===id);return {j,c25:scopusRecord(j,2025)?.citations??null,c26:scopusRecord(j,2026)?.citations??null};}).sort((a,b)=>(b.c26??0)-(a.c26??0));
  const maxVal=Math.max(10,...rows.flatMap(r=>[r.c25??0,r.c26??0]));
  $('#citations-bars').innerHTML=rows.map(({j,c25,c26})=>`<div class="bar-item"><div class="bar-top"><a href="#journal/${j.id}">${esc(j.code)} · ${esc(j.title)}</a><div class="bar-metrics"><strong>${number(c26)}</strong> (Tracker 2026)</div></div><div class="bar-track"><div class="bar-row"><span>2025</span><div class="bar-rail"><div class="bar-fill" style="width:${((c25??0)/maxVal*100).toFixed(1)}%;background:${styles[j.id].color};opacity:.55"></div></div><span>${number(c25)} trích dẫn</span></div><div class="bar-row"><span>2026</span><div class="bar-rail"><div class="bar-fill" style="width:${((c26??0)/maxVal*100).toFixed(1)}%;background:${styles[j.id].color}"></div></div><span><strong>${number(c26)}</strong> trích dẫn</span></div></div></div>`).join('');
 }else{
  $('#citations-bar-heading').textContent='Tổng hợp trích dẫn xác nhận & h-index (9 tạp chí)';
  $('#citations-bar-sub').textContent='Lũy kế toàn thời gian trong bộ dữ liệu 09–09h sau khi lọc bỏ trích dẫn trùng tên viết tắt ngoài danh mục.';
  const rows=localIds.map(id=>journals.find(x=>x.id===id)).sort((a,b)=>(b.localCitation.totals.citations)-(a.localCitation.totals.citations));
  const maxCit=Math.max(10,...rows.map(j=>j.localCitation.totals.citations));
  $('#citations-bars').innerHTML=rows.map(j=>{
   const t=j.localCitation.totals,c=styles[j.id].color;
   return `<div class="bar-item"><div class="bar-top"><div><a href="#journal/${j.id}">${esc(j.code)} · ${esc(j.title)}</a><small>h-index: <strong>${number(t.hIndex)}</strong> · ${number(t.citedArticles)} bài được trích dẫn</small></div><div class="bar-metrics"><strong>${number(t.citations)}</strong> lượt</div></div><div class="bar-track"><div class="bar-row"><span>Lượt TD</span><div class="bar-rail"><div class="bar-fill" style="width:${(t.citations/maxCit*100).toFixed(1)}%;background:${c}"></div></div><span><strong>${number(t.citations)}</strong> lượt</span></div><div class="bar-row"><span>Bài TD</span><div class="bar-rail"><div class="bar-fill" style="width:${(t.citingDocs/maxCit*100).toFixed(1)}%;background:${c};opacity:.55"></div></div><span>${number(t.citingDocs)} bài trích dẫn</span></div></div></div>`;
  }).join('');
 }
}
function showCitationYear(year,force=false){
 const p=subState.citations.plot;if(!p||!p.years.includes(year))return;
 const active=p.poolIds.filter(id=>citationSeriesSet.has(id));if(!active.length)return;
 if(subState.citations.year===year&&!force)return;subState.citations.year=year;
 const rows=active.map(id=>{const j=journals.find(x=>x.id===id);return {j,o:citationObs(j,year)};});
 const total=rows.reduce((sum,r)=>sum+(Number.isFinite(r.o.value)?r.o.value:0),0);
 $('#citations-tooltip-year').textContent=(citationMode==='localDocs'?'Bài trích dẫn ':'Lượt trích dẫn ')+year+(year===2026?' · YTD':'');
 $('#citations-tooltip-values').innerHTML=rows.map(({j,o})=>`<div class="tooltip-row"><dt><span class="tooltip-dot" style="background:${styles[j.id].color}"></span><span>${j.code}</span></dt><dd class="${Number.isFinite(o.value)?'':'neutral'}">${number(o.value)}</dd></div>`).join('')+`<div class="tooltip-row" style="border-top:1px solid var(--line);margin-top:4px;padding-top:4px"><dt><strong>Tổng nhóm chọn</strong></dt><dd><strong>${number(total)}</strong></dd></div>`;
 $('#citations-tooltip-note').textContent=citationMode==='scopusCitations'?'Trích dẫn trong cửa sổ 4 năm CiteScore của Scopus.':'Trích dẫn đã xác nhận khớp danh mục bài trong năm '+year+'.';
 const px=p.x(year),tipWidth=Math.min(300,p.width-24),tip=$('#citations-tooltip');
 tip.style.left=Math.max(12,px+16+tipWidth<=p.width-12?px+16:px-tipWidth-16)+'px';tip.hidden=false;
 const hover=$('#citations-chart .sub-hover');hover.removeAttribute('hidden');
 hover.innerHTML=`<line x1="${px}" y1="${p.top}" x2="${px}" y2="${p.height-p.bottom}" stroke="var(--muted)" stroke-dasharray="3 4"/>`+rows.filter(r=>Number.isFinite(r.o.value)).map(({j,o})=>`<circle cx="${px}" cy="${p.y(o.value)}" r="5" fill="var(--paper)" stroke="${styles[j.id].color}" stroke-width="2.5"/>`).join('');
}

function renderPapersChart(){
 if(!dashboard)return;
 const allIds=journals.map(j=>j.id);
 $('#papers-legend').innerHTML=legendButtonsHtml(allIds,paperSeriesSet,'data-paper-journal');
 const width=subChartWidth,height=matchMedia('(max-width:767px)').matches?260:340,left=48,right=34,top=40,bottom=34;
 const years=dashboard.outputYears,start=years[0],end=years.at(-1),plotWidth=width-left-right,plotHeight=height-top-bottom;
 const activeList=journals.filter(j=>paperSeriesSet.has(j.id));
 const values=(activeList.length?activeList:journals).flatMap(j=>years.map(y=>output(j,y)?.papers)).filter(Number.isFinite);
 const scale=niceScale(Math.max(20,...values),false);
 const x=year=>left+(year-start)/(end-start)*plotWidth,y=value=>top+(1-value/scale.max)*plotHeight;
 subState.papers.plot={width,height,left,right,top,bottom,plotWidth,years,start,end,x,y};
 const boundary=(x(end-1)+x(end))/2;
 const yearTotals=years.map(yr=>({year:yr,papers:activeList.reduce((s,j)=>s+(output(j,yr)?.papers??0),0),issues:activeList.reduce((s,j)=>s+(output(j,yr)?.issues??0),0)}));
 let svg=`<title id="papers-chart-title">Số bài đã xuất bản của 12 tạp chí (2020–2026)</title><desc id="papers-chart-desc">Diễn biến số bài nghiên cứu đã phát hành chính thức của 12 tạp chí VAST từ 2020 đến 2026.</desc>`;
 svg+=`<rect x="${boundary}" y="${top-14}" width="${width-boundary}" height="${plotHeight+14}" fill="var(--surface)"/><text x="${width-6}" y="14" text-anchor="end" fill="var(--muted)" font-size="10.5">2026 YTD</text>`;
 for(let i=0;i<=Math.round(scale.max/scale.step);i++){const v=i*scale.step;svg+=`<line x1="${left}" y1="${y(v)}" x2="${width}" y2="${y(v)}" stroke="var(--line)"/><text x="${left-10}" y="${y(v)+4}" text-anchor="end" fill="var(--muted)" font-size="11">${integer.format(v)}</text>`;}
 for(const {year,papers} of yearTotals){
  svg+=`<text x="${x(year)}" y="${height-10}" text-anchor="middle" fill="var(--muted)" font-size="12">${year}</text>`;
  if(activeList.length>1)svg+=`<text x="${x(year)}" y="${top-4}" text-anchor="middle" fill="var(--ink)" font-size="10.5" font-weight="500">Σ ${integer.format(papers)}</text>`;
 }
 for(const j of journals){
  const style=styles[j.id],on=paperSeriesSet.has(j.id);let d='',connected=false;
  svg+=`<g class="journal-series" data-paper-series="${j.id}"${on?'':' hidden'} aria-hidden="true">`;
  for(const year of years){
   const o=output(j,year);if(!Number.isFinite(o?.papers)){connected=false;continue;}
   if(year<end){d+=(connected?' L':'M')+x(year).toFixed(2)+' '+y(o.papers).toFixed(2);connected=true;}
   else{const prev=output(j,end-1);if(Number.isFinite(prev?.papers))svg+=`<path d="M${x(end-1)} ${y(prev.papers)} L${x(end)} ${y(o.papers)}" fill="none" stroke="${style.color}" stroke-width="2" stroke-dasharray="5 4"/>`;connected=false;}
  }
  if(d)svg+=`<path d="${d}" fill="none" stroke="${style.color}" stroke-width="2"${style.dash?` stroke-dasharray="${style.dash}"`:''}/>`;
  for(const year of years){
   const o=output(j,year);if(!Number.isFinite(o?.papers))continue;
   const px=x(year),py=y(o.papers);
   svg+=year===end?`<path d="M${px} ${py-5} L${px+5} ${py} L${px} ${py+5} L${px-5} ${py} Z" fill="var(--paper)" stroke="${style.color}" stroke-width="2"/>`:`<circle cx="${px}" cy="${py}" r="3.25" fill="${style.color}" stroke="var(--paper)"/>`;
  }
  svg+='</g>';
 }
 svg+=`<g class="sub-hover" aria-hidden="true" pointer-events="none" hidden></g>`;
 $('#papers-chart').innerHTML=svg;
 const tot25=yearTotals.find(t=>t.year===2025),tot26=yearTotals.find(t=>t.year===2026);
 $('#papers-caption').textContent=`Nhãn Σ phía trên mỗi năm là tổng số bài đã xuất bản của ${activeList.length} tạp chí đang chọn (năm 2025: ${number(tot25?.papers)} bài / ${number(tot25?.issues)} kỳ; năm 2026 đến 21/10/2026: ${number(tot26?.papers)} bài / ${number(tot26?.issues)} kỳ).`;
 if(subState.papers.year!==null)showPaperYear(subState.papers.year,true);
 const focusYear=papersFocusYear;
 $('#papers-bar-heading').textContent=`Số bài & kỳ xuất bản theo tạp chí (${focusYear} & 2026 YTD)`;
 $('#papers-bar-sub').textContent=`Sắp xếp theo số bài đã xuất bản năm ${focusYear}. Bấm tên tạp chí để xem danh mục từng số báo và DOI.`;
 const rows=journals.map(j=>({j,oFocus:output(j,focusYear),o26:output(j,2026)})).sort((a,b)=>(b.oFocus?.papers??0)-(a.oFocus?.papers??0));
 const maxPapers=Math.max(20,...rows.flatMap(r=>[r.oFocus?.papers??0,r.o26?.papers??0]));
 $('#papers-bars').innerHTML=rows.map(({j,oFocus,o26})=>{
  const c=styles[j.id].color;
  const secondRow=focusYear===2026?'':`<div class="bar-row"><span>2026*</span><div class="bar-rail"><div class="bar-fill" style="width:${((o26?.papers??0)/maxPapers*100).toFixed(1)}%;background:${c};opacity:.55"></div></div><span>${number(o26?.papers)} bài (${number(o26?.issues)} kỳ)</span></div>`;
  return `<div class="bar-item"><div class="bar-top"><a href="#journal/${j.id}">${esc(j.code)} · ${esc(j.title)}</a><div class="bar-metrics"><strong>${number(oFocus?.papers)}</strong> bài (${number(oFocus?.issues)} kỳ)</div></div><div class="bar-track"><div class="bar-row"><span>${focusYear}${focusYear===2026?'*':''}</span><div class="bar-rail"><div class="bar-fill" style="width:${((oFocus?.papers??0)/maxPapers*100).toFixed(1)}%;background:${c}"></div></div><span><strong>${number(oFocus?.papers)}</strong> bài (${number(oFocus?.issues)} kỳ)</span></div>${secondRow}</div></div>`;
 }).join('');
}
function showPaperYear(year,force=false){
 const p=subState.papers.plot;if(!p||!p.years.includes(year))return;
 const active=journals.filter(j=>paperSeriesSet.has(j.id));if(!active.length)return;
 if(subState.papers.year===year&&!force)return;subState.papers.year=year;
 const rows=active.map(j=>({j,o:output(j,year)}));
 const totalPapers=rows.reduce((s,r)=>s+(r.o?.papers??0),0),totalIssues=rows.reduce((s,r)=>s+(r.o?.issues??0),0);
 $('#papers-tooltip-year').textContent='Sản lượng xuất bản '+year+(year===2026?' · đến 21/10/2026':'');
 $('#papers-tooltip-values').innerHTML=rows.map(({j,o})=>`<div class="tooltip-row"><dt><span class="tooltip-dot" style="background:${styles[j.id].color}"></span><span>${j.code}</span></dt><dd>${number(o?.papers)} bài (${number(o?.issues)} kỳ)</dd></div>`).join('')+`<div class="tooltip-row" style="border-top:1px solid var(--line);margin-top:4px;padding-top:4px"><dt><strong>Tổng (${rows.length} tạp chí)</strong></dt><dd><strong>${number(totalPapers)} bài (${number(totalIssues)} kỳ)</strong></dd></div>`;
 $('#papers-tooltip-note').textContent='Chỉ đếm bài nghiên cứu, tổng quan và thông báo ngắn trong các số đã phát hành chính thức.';
 const px=p.x(year),tipWidth=Math.min(300,p.width-24),tip=$('#papers-tooltip');
 tip.style.left=Math.max(12,px+16+tipWidth<=p.width-12?px+16:px-tipWidth-16)+'px';tip.hidden=false;
 const hover=$('#papers-chart .sub-hover');hover.removeAttribute('hidden');
 hover.innerHTML=`<line x1="${px}" y1="${p.top}" x2="${px}" y2="${p.height-p.bottom}" stroke="var(--muted)" stroke-dasharray="3 4"/>`+rows.filter(r=>Number.isFinite(r.o?.papers)).map(({j,o})=>`<circle cx="${px}" cy="${p.y(o.papers)}" r="5" fill="var(--paper)" stroke="${styles[j.id].color}" stroke-width="2.5"/>`).join('');
}

function renderAllCharts(){
 renderChart();
 renderCandidatesChart();
 renderCitationsChart();
 renderPapersChart();
}
function bindSubChartInteraction(key,svgSelector,areaSelector,closeBtnSelector,showFn){
 const svg=$(svgSelector),area=$(areaSelector);
 svg.addEventListener('pointermove',e=>{if(e.pointerType!=='touch'&&!subState[key].pinned&&subState[key].plot)showFn(yearFromPointer(e,subState[key].plot,svg));});
 area.addEventListener('pointerleave',()=>{if(!subState[key].pinned){subState[key].year=null;$(`#${key}-tooltip`).hidden=true;svg.querySelector('.sub-hover')?.setAttribute('hidden','');}});
 svg.addEventListener('click',e=>{if(!subState[key].plot)return;const yr=yearFromPointer(e,subState[key].plot,svg);if(subState[key].pinned&&subState[key].year===yr){subState[key].pinned=false;subState[key].year=null;$(`#${key}-tooltip`).hidden=true;svg.querySelector('.sub-hover')?.setAttribute('hidden','');return;}subState[key].pinned=true;showFn(yr,true);});
 svg.addEventListener('keydown',e=>{const p=subState[key].plot;if(!p)return;if(e.key==='Escape'){subState[key].pinned=false;subState[key].year=null;$(`#${key}-tooltip`).hidden=true;svg.querySelector('.sub-hover')?.setAttribute('hidden','');return;}if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();let yr=subState[key].year;if(e.key==='Home')yr=p.start;else if(e.key==='End')yr=p.end;else if(e.key==='ArrowLeft')yr=yr===null?p.end:Math.max(p.start,yr-1);else yr=yr===null?p.start:Math.min(p.end,yr+1);subState[key].pinned=true;showFn(yr,true);});
 $(closeBtnSelector).addEventListener('click',()=>{subState[key].pinned=false;subState[key].year=null;$(`#${key}-tooltip`).hidden=true;svg.querySelector('.sub-hover')?.setAttribute('hidden','');});
}
function bindEvents(){
 $('.skip-link').addEventListener('click',event=>{event.preventDefault();$('#main-content').focus();$('#main-content').scrollIntoView({block:'start'});});
 $('#theme-select').addEventListener('change',e=>applyTheme(e.target.value,true));
 $('#theme-pills').addEventListener('click',e=>{const b=e.target.closest('button[data-theme]');if(b)applyTheme(b.dataset.theme,true);});
 document.querySelector('.chart-jump-nav').addEventListener('click',event=>{
  const link=event.target.closest('[data-chart-jump]');if(!link)return;
  event.preventDefault();
  const target=document.getElementById(link.dataset.chartJump);
  if(target)target.scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'start'});
 });
 $('#portfolio-filters').addEventListener('submit',e=>e.preventDefault());
 for(const [selector,key]of[['#journal-search','q'],['#publication-year','year'],['#subject-filter','subject'],['#index-filter','index'],['#sort-order','sort']])$(selector).addEventListener(key==='q'?'input':'change',event=>{state[key]=key==='year'?Number(event.target.value):event.target.value;saveState();renderPortfolio();renderOverview();});
 $('#reset-filters').addEventListener('click',()=>{Object.assign(state,{q:'',subject:'all',index:'all',sort:'default',year:dashboard.defaultOutputYear});syncInputs();saveState();renderPortfolio();renderOverview();});
 $('#trend-metric').addEventListener('change',event=>{
  state.metric=event.target.value;
  if(state.metric==='localScore'&&!nonScopusIds.some(id=>state.series.has(id)))state.series=new Set(nonScopusIds);
  const years=availableYears();state.from=years[0];state.to=years.at(-1);closeDetails();syncInputs();saveState();renderLegend();renderChart();
 });
 $('#trend-from').addEventListener('change',event=>{state.from=Number(event.target.value);if(state.to<state.from)state.to=state.from;closeDetails();syncInputs();saveState();renderChart();});
 $('#trend-to').addEventListener('change',event=>{state.to=Number(event.target.value);if(state.from>state.to)state.from=state.to;closeDetails();syncInputs();saveState();renderChart();});
 $('#show-all').addEventListener('click',event=>{const pool=state.metric==='localScore'?nonScopusIds:journals.map(j=>j.id);for(const id of pool)state.series.add(id);saveState();updateSeries(event.detail>0);});
 $('#reset-series').addEventListener('click',event=>{state.series=new Set(state.metric==='localScore'?nonScopusIds:defaultSeries);saveState();updateSeries(event.detail>0);});
 $('#chart-legend').addEventListener('click',event=>{const button=event.target.closest('button[data-journal]');if(!button)return;const id=button.dataset.journal;if(state.series.has(id))state.series.delete(id);else state.series.add(id);saveState();updateSeries(event.detail>0);});
 $('#chart-legend').addEventListener('pointerover',event=>{const b=event.target.closest('button[data-journal]');if(event.pointerType==='mouse'&&b&&state.series.has(b.dataset.journal))for(const g of document.querySelectorAll('#trend-chart .journal-series'))g.classList.toggle('is-muted',g.dataset.journal!==b.dataset.journal);});
 $('#chart-legend').addEventListener('pointerleave',()=>{for(const g of document.querySelectorAll('#trend-chart .journal-series'))g.classList.remove('is-muted');});
 $('#trend-chart').addEventListener('pointermove',e=>{if(e.pointerType!=='touch'&&!pinned)showYear(yearFromPointer(e));});
 $('.chart-area').addEventListener('pointerleave',()=>{if(!pinned)closeDetails();});
 $('#trend-chart').addEventListener('click',e=>{const year=yearFromPointer(e);if(pinned&&selectedYear===year){closeDetails();return;}pinned=true;showYear(year,true,true);});
 $('#trend-chart').addEventListener('keydown',e=>{if(e.key==='Escape'){closeDetails(true);return;}if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();let year=selectedYear;if(e.key==='Home')year=plot.start;else if(e.key==='End')year=plot.end;else if(e.key==='ArrowLeft')year=year===null?plot.end:Math.max(plot.start,year-1);else year=year===null?plot.start:Math.min(plot.end,year+1);pinned=true;showYear(year,true,true);});
 $('#close-tooltip').addEventListener('click',e=>{closeDetails(true);if(e.detail===0)$('#trend-chart').focus({preventScroll:true});});

 $('#candidates-legend').addEventListener('click',e=>{const b=e.target.closest('button[data-candidate]');if(!b)return;const id=b.dataset.candidate;if(candidateSeries.has(id))candidateSeries.delete(id);else candidateSeries.add(id);renderCandidatesChart();});
 $('#candidates-show-all').addEventListener('click',()=>{candidateSeries=new Set(candidateIds);renderCandidatesChart();});
 bindSubChartInteraction('candidates','#candidates-chart','#candidates-chart-area','#close-candidates-tooltip',showCandidateYear);

 $('#citations-mode').addEventListener('change',e=>{citationMode=e.target.value;citationSeriesSet=new Set(citationMode==='scopusCitations'?scopusIds:localIds);subState.citations.year=null;subState.citations.pinned=false;$('#citations-tooltip').hidden=true;renderCitationsChart();});
 $('#citations-preset-all').addEventListener('click',()=>{citationSeriesSet=new Set(citationMode==='scopusCitations'?scopusIds:localIds);renderCitationsChart();});
 $('#citations-preset-scopus').addEventListener('click',()=>{citationSeriesSet=new Set(citationMode==='scopusCitations'?scopusIds:['vjc','vjes','vjst','cip']);renderCitationsChart();});
 $('#citations-preset-candidates').addEventListener('click',()=>{if(citationMode==='scopusCitations')citationMode='localEdges';$('#citations-mode').value=citationMode;citationSeriesSet=new Set(nonScopusIds);renderCitationsChart();});
 $('#citations-legend').addEventListener('click',e=>{const b=e.target.closest('button[data-citation-journal]');if(!b)return;const id=b.dataset.citationJournal;if(citationSeriesSet.has(id))citationSeriesSet.delete(id);else citationSeriesSet.add(id);renderCitationsChart();});
 bindSubChartInteraction('citations','#citations-chart','#citations-chart-area','#close-citations-tooltip',showCitationYear);

 $('#papers-focus-year').addEventListener('change',e=>{papersFocusYear=Number(e.target.value);renderPapersChart();});
 $('#papers-preset-all').addEventListener('click',()=>{paperSeriesSet=new Set(journals.map(j=>j.id));renderPapersChart();});
 $('#papers-preset-scopus').addEventListener('click',()=>{paperSeriesSet=new Set(scopusIds);renderPapersChart();});
 $('#papers-preset-candidates').addEventListener('click',()=>{paperSeriesSet=new Set(nonScopusIds);renderPapersChart();});
 $('#papers-legend').addEventListener('click',e=>{const b=e.target.closest('button[data-paper-journal]');if(!b)return;const id=b.dataset.paperJournal;if(paperSeriesSet.has(id))paperSeriesSet.delete(id);else paperSeriesSet.add(id);renderPapersChart();});
 bindSubChartInteraction('papers','#papers-chart','#papers-chart-area','#close-papers-tooltip',showPaperYear);

 $('#detail-panel').addEventListener('click',event=>{const link=event.target.closest('[data-trend-journal]');if(!link)return;const j=journals.find(v=>v.id===link.dataset.trendJournal);state.series=new Set([j.id]);state.metric=scopus.journals.some(v=>v.code===j.code)?'citescore':'localScore';const years=availableYears();state.from=years[0];state.to=years.at(-1);closeDetails();syncInputs();saveState();renderLegend();});
 window.addEventListener('hashchange',()=>route(true));
 window.addEventListener('popstate',()=>{closeAllTooltips();readState();syncInputs();renderOverview();renderPortfolio();renderLegend();route();});
 new ResizeObserver(entries=>{const width=Math.round(entries[0].contentRect.width);if(width<=0||width===chartWidth)return;chartWidth=width;renderChart();}).observe($('.chart-area'));
 new ResizeObserver(entries=>{const width=Math.round(entries[0].contentRect.width);if(width<=0||width===subChartWidth)return;subChartWidth=width;renderCandidatesChart();renderCitationsChart();renderPapersChart();}).observe($('#candidates-chart-area'));
}
async function start(){
 try{
  renderThemeBar();
  [dashboard,scopus]=await Promise.all([fetchJson('data/dashboard.json'),fetchJson('data-scopus.json')]);
  journals=dashboard.journals;
  if(journals.length!==12||new Set(journals.map(j=>j.id)).size!==12)throw new Error('Danh mục tạp chí không hợp lệ.');
  paperSeriesSet=new Set(journals.map(j=>j.id));
  papersFocusYear=dashboard.defaultOutputYear;
  recordIndex=new Map(scopus.records.map(r=>[r.journal+'|'+r.year+'|'+r.type,r]));styles=Object.fromEntries(journals.map((j,i)=>[j.id,{color:seriesPalette[i][0],dash:seriesPalette[i][1]}]));
  readState();$('#snapshot-date').dateTime=dashboard.collectedAt;$('#snapshot-date').textContent=date(dashboard.collectedAt);
  const yearOptions=dashboard.outputYears.map(y=>`<option value="${y}">${y}${y===Number(dashboard.collectedAt.slice(0,4))?' · đến ngày chốt':''}</option>`).join('');
  $('#publication-year').innerHTML=yearOptions;
  $('#papers-focus-year').innerHTML=yearOptions;
  $('#papers-focus-year').value=String(papersFocusYear);
  const subjects=[...new Set(journals.map(j=>j.subject))].sort((a,b)=>a.localeCompare(b,'vi'));$('#subject-filter').insertAdjacentHTML('beforeend',subjects.map(s=>`<option value="${esc(s)}">${esc(s)}</option>`).join(''));
  syncInputs();renderOverview();renderPortfolio();renderUpdates();renderLegend();renderAllCharts();bindEvents();route();$('#load-status').hidden=true;
  const days=Math.floor((Date.now()-Date.parse(dashboard.collectedAt+'T00:00:00Z'))/86400000);
  if(days>dashboard.reviewAfterDays){$('#freshness-notice').textContent='Bản dữ liệu được đối chiếu đến '+date(dashboard.collectedAt)+'. Các nguồn cần được kiểm tra lại theo chu kỳ cập nhật.';$('#freshness-notice').hidden=false;}
 }catch(error){console.error(error);$('#load-status').hidden=true;$('#load-error').hidden=false;}
}
$('#retry-load').addEventListener('click',()=>location.reload());
start();
