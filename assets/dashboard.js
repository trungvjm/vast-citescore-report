const $=selector=>document.querySelector(selector);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const integer=new Intl.NumberFormat('vi-VN');
const decimal=new Intl.NumberFormat('vi-VN',{minimumFractionDigits:1,maximumFractionDigits:1});
const dateFormatter=new Intl.DateTimeFormat('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'UTC'});
const date=iso=>!iso?'Chưa xác minh':/^\d{4}-\d{2}$/.test(iso)?iso.slice(5)+'/'+iso.slice(0,4):dateFormatter.format(new Date(iso.slice(0,10)+'T00:00:00Z'));
const number=value=>Number.isFinite(value)?integer.format(value):'—';
const score=value=>Number.isFinite(value)?decimal.format(value):'—';
const safeUrl=url=>/^https?:\/\//i.test(url)?url:'#';
const external=(url,text)=>`<a href="${esc(safeUrl(url))}" target="_blank" rel="noopener noreferrer">${esc(text??url)}</a>`;
const fullName=j=>j.title+' ('+j.code+')';
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const metricInfo={citescore:{label:'CiteScore & Tracker',short:'CiteScore',scopus:true,decimals:1},citations:{label:'Trích dẫn trong cửa sổ CiteScore',short:'Trích dẫn',scopus:true},documents:{label:'Tài liệu trong cửa sổ CiteScore',short:'Tài liệu',scopus:true},papers:{label:'Bài đã xuất bản',short:'Bài xuất bản'},issues:{label:'Kỳ đã xuất bản',short:'Kỳ xuất bản'},localDocs:{label:'Tài liệu trích dẫn đã xác nhận',short:'Tài liệu trích dẫn',local:true},localEdges:{label:'Lượt trích dẫn đã xác nhận',short:'Lượt trích dẫn',local:true},localScore:{label:'Chỉ số 4 năm tự tính · không chính thức',short:'Chỉ số tự tính',local:true,decimals:2}};
const ratioFormatter=new Intl.NumberFormat('vi-VN',{minimumFractionDigits:2,maximumFractionDigits:2});
const ratio=value=>Number.isFinite(value)?ratioFormatter.format(value):'—';
const metricValue=value=>state.metric==='localScore'?ratio(value):metricInfo[state.metric].decimals?score(value):number(value);
let dashboard,scopus,journals,recordIndex,state,chartWidth=1000,plot,selectedYear=null,pinned=false;
const defaultSeries=['vjm','ansn','vjc','vjes'];
const seriesPalette=[['var(--c1)',''],['var(--c2)','7 4'],['var(--c3)','2 4'],['var(--c4)','10 4 2 4'],['var(--c5)','14 4'],['var(--c6)','4 3'],['var(--ink)',''],['#666666','9 3'],['#444444','3 3'],['#7a6b65','11 3 2 3'],['#49635f','2 3'],['#6c6269','6 3 1 3']];
let styles;
async function fetchJson(url){const response=await fetch(url,{cache:'no-cache'});if(!response.ok)throw new Error('Không tải được '+url+' ('+response.status+')');return response.json();}
function checkedAt(j){return j.checkedAt??dashboard.collectedAt;}
function output(j,year){return j.outputs.find(o=>o.year===Number(year));}
function scopusRecord(j,year){return recordIndex.get(j.code+'|'+year+'|'+(year===scopus.trackerYear?'tracker':'annual'));}
function observation(j,metric,year){
 if(metricInfo[metric].local){const local=j.localCitation,r=metric==='localScore'?local?.selfCalculatedSeries.find(v=>v.year===year):local?.citationSeries.find(v=>v.year===year);const value=metric==='localScore'?r?.value:metric==='localDocs'?r?.citingDocuments:r?.confirmedCitationEdges;return {value:value??null,reason:'Chưa có số liệu trong bộ thu thập đã đối chiếu.',updated:local?.sourceExportDate??null,kind:year===Number(dashboard.collectedAt.slice(0,4))?'ytd':'annual',verified:Boolean(r)};}
 if(!metricInfo[metric].scopus){const o=output(j,year),value=metric==='papers'&&o?.coverage!=='complete'?null:o?.[metric];return {value:value??null,reason:o?.noteVi??'Chưa có số liệu đã đối chiếu cho kỳ này.',updated:o?.asOf??null,kind:o?.periodKind??'annual',verified:metric==='issues'?Number.isFinite(o?.issues):o?.coverage==='complete'};}
 const r=scopusRecord(j,year);
 const value=metric==='citescore'?r?.value:r?.[metric];
 return {value:Number.isFinite(value)?value:null,reason:r?.status==='scopus_na'?'Scopus hiển thị N/A cho năm này.':'Chưa có số liệu trong bản đối chiếu Scopus.',updated:r?.lastUpdated??r?.accessed??null,kind:r?.type??'annual',verified:r?.status==='verified_scopus'};
}
function annualRecord(j){return recordIndex.get(j.code+'|'+scopus.annualYears.at(-1)+'|annual');}
function verifiedScopus(j){return j.indexings.some(i=>i.system==='Scopus'&&i.status==='listed'&&i.evidenceLevel==='database');}
function indexingName(i){return i.system==='WoS'?'WoS '+(i.collection??'chưa rõ bộ chỉ mục'):i.system;}
function indexingBadges(j){
 const entries=j.indexings.filter(i=>i.status==='listed');
 if(!entries.length)return '<span class="badge pending">Chưa đối chiếu</span>';
 return '<div class="badge-list">'+entries.map(i=>`<span class="badge ${i.evidenceLevel==='database'?'verified':''}" title="${esc((i.evidenceLevel==='database'?'Đối chiếu cơ sở dữ liệu':i.evidenceLevel==='vast'?'VAST công bố':'Website tạp chí công bố')+'; kiểm tra '+date(i.checkedAt))}">${esc(indexingName(i))}${i.evidenceLevel==='database'?'':'*'}</span>`).join('')+'</div>';
}
function readState(){
 const p=new URLSearchParams(location.search),years=dashboard.outputYears;
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
 set('q',state.q,'');set('year',String(state.year),String(dashboard.defaultOutputYear));set('subject',state.subject,'all');set('index',state.index,'all');set('sort',state.sort,'default');set('metric',state.metric,'citescore');
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
 const cells=[['Tạp chí trong danh mục',journals.length,'Hồ sơ và nguồn đối chiếu riêng'],['Scopus đã đối chiếu',journals.filter(verifiedScopus).length,'Bản đối chiếu '+date(scopus.reportDate)],['Bài xuất bản '+state.year,papers.length?number(totalPapers):'—',papers.length+'/12 tạp chí đủ nguồn · '+period],['Kỳ xuất bản '+state.year,issues.length?number(totalIssues):'—',issues.length+'/12 tạp chí đã đối chiếu']];
 $('#summary-strip').innerHTML=cells.map(([label,value,detail])=>`<div class="summary-item"><span class="summary-label">${esc(label)}</span><strong class="summary-value">${esc(value)}</strong><span class="summary-detail">${esc(detail)}</span></div>`).join('');
 const year=scopus.annualYears.at(-1),previous=year-1;
 const comparable=journals.filter(j=>Number.isFinite(scopusRecord(j,year)?.value)&&Number.isFinite(scopusRecord(j,previous)?.value));
 const growing=comparable.filter(j=>scopusRecord(j,year).value>scopusRecord(j,previous).value);
 const remarks=[`${growing.length} trong ${comparable.length} tạp chí có số liệu so sánh tăng CiteScore năm ${year} so với ${previous}.`,`${papers.length}/12 tạp chí đã có số bài được đối chiếu đầy đủ cho ${state.year}${state.year===Number(dashboard.collectedAt.slice(0,4))?' đến ngày chốt':''}. Tổng sản lượng chỉ bao gồm nhóm này.`,`Tracker ${scopus.trackerYear} cập nhật tại nguồn ngày ${date(scopus.records.find(r=>r.type==='tracker').lastUpdated)}; đây là chỉ số tạm thời, không phải CiteScore năm đã chốt.`];
 $('#remarks').innerHTML=remarks.map(text=>`<li>${esc(text)}</li>`).join('');
 $('#coverage-copy').textContent='Danh mục gồm 12 tạp chí; CiteScore hiện có trong bản đối chiếu của '+scopus.journals.length+' tạp chí. “Chưa đối chiếu” không đồng nghĩa với không được lập chỉ mục. Kỳ đo và mức độ xác minh được ghi riêng cho từng nguồn.';
}
function renderPortfolio(){
 const year=scopus.annualYears.at(-1),tracker=scopus.trackerYear;
 $('#annual-column').textContent='CiteScore '+year;$('#tracker-column').innerHTML='Tracker '+tracker+`<small>${date(scopus.records.find(r=>r.type==='tracker').lastUpdated)}</small>`;$('#output-column').innerHTML=`Bài / kỳ ${state.year}<small>${state.year===Number(dashboard.collectedAt.slice(0,4))?'Đến '+date(dashboard.collectedAt):'Cả năm'}</small>`;
 const list=filteredJournals();
 $('#portfolio-body').innerHTML=list.map(j=>{const a=annualRecord(j),t=scopusRecord(j,tracker),o=output(j,state.year);const papers=o?.coverage==='complete'?o.papers:null;return `<tr><th scope="row"><a href="#journal/${encodeURIComponent(j.id)}">${esc(fullName(j))}</a><small>${esc(j.subject)} · ${esc(j.titleVi)}</small></th><td class="index-cell">${indexingBadges(j)}</td><td data-label="CiteScore ${year}" title="${Number.isFinite(a?.value)?'CiteScore năm đã công bố':a?.status==='scopus_na'?'Scopus hiển thị N/A':'Chưa đối chiếu trong nguồn Scopus'}"><strong class="${Number.isFinite(a?.value)?'':'neutral'}">${score(a?.value)}</strong></td><td data-label="Tracker ${tracker}"><strong class="${Number.isFinite(t?.value)?'':'neutral'}">${score(t?.value)}</strong></td><td data-label="Bài / kỳ ${state.year}"><strong class="${Number.isFinite(papers)?'':'neutral'}">${number(papers)}</strong><small>${Number.isFinite(o?.issues)?number(o.issues)+' kỳ':'Chưa đối chiếu kỳ'}</small></td><td class="updated-cell"><time datetime="${esc(checkedAt(j))}">${date(checkedAt(j))}</time><small>Hồ sơ / nguồn</small></td></tr>`;}).join('');
 $('#results-count').textContent=list.length+' / '+journals.length+' tạp chí';$('#portfolio-empty').hidden=list.length!==0;
}
function detailMetric(label,value,detail){return `<div><span class="summary-label">${esc(label)}</span><strong class="summary-value">${esc(value)}</strong><span class="summary-detail">${esc(detail)}</span></div>`;}
function renderDetail(id){
 const j=journals.find(item=>item.id===id),panel=$('#detail-panel');
 if(!j){panel.innerHTML='<h2 id="detail-heading">Không tìm thấy tạp chí</h2><p>Địa chỉ hồ sơ không nằm trong danh mục đã đối chiếu.</p><a href="#journals">Trở lại danh mục</a>';return;}
 const a=annualRecord(j),t=scopusRecord(j,scopus.trackerYear),o=output(j,state.year),profileRows=[['Tên tiếng Việt',j.titleVi],['Lĩnh vực',j.subject],['ISSN bản in',j.issn??'Chưa xác minh'],['ISSN điện tử',j.eissn??'Chưa xác minh'],['Đơn vị xuất bản',j.publisher??'Chưa xác minh'],['Kỳ hạn công bố',j.frequency?.issuesPerYear?j.frequency.issuesPerYear+' kỳ/năm (theo website)':'Chưa xác minh'],['Ngày đối chiếu',date(checkedAt(j))]];
 const ownRecords=scopus.records.filter(r=>r.journal===j.code);
 const categories=j.scopusCategories??[];
 const metricRows=ownRecords.map(r=>`<tr><th scope="row">${r.year}${r.type==='tracker'?' · Tracker':''}</th><td>${score(r.value)}</td><td>${number(r.citations)}</td><td>${number(r.documents)}</td></tr>`).join('');
 const outputRows=j.outputs.map(row=>`<tr><th scope="row">${row.year}${row.periodKind==='ytd'?' · đến '+date(row.asOf):''}</th><td>${row.coverage==='complete'?number(row.papers):'—'}</td><td>${number(row.issues)}</td><td>${row.coverage==='complete'?'Đã đối chiếu':'Chưa đủ số bài'}</td></tr>`).join('');
 const indexRows=j.indexings.map(i=>`<li><strong>${esc(indexingName(i))}</strong> · ${i.status==='listed'?'Có tên theo nguồn':i.status==='not_listed'?'Nguồn ghi chưa thuộc danh mục':'Chưa xác minh'}<small>${i.evidenceLevel==='database'?'Đối chiếu trực tiếp cơ sở dữ liệu':i.evidenceLevel==='vast'?'Thông báo VAST':'Công bố trên website tạp chí'} · ${date(i.checkedAt)}${i.coverage?' · Phạm vi '+esc(i.coverage):''}</small>${external(i.sourceUrl,'Mở nguồn đối chiếu')}</li>`).join('');
 const issueGroups=j.outputs.map(row=>`<section class="detail-section"><h3>Nguồn sản lượng ${row.year}</h3><p class="detail-note">${row.coverage==='complete'?'Đã đối chiếu bài đủ điều kiện trong các số đã phát hành.':'Chưa đủ bằng chứng để chốt tổng số bài; không suy từ số trang hay kỳ hạn xuất bản.'}${row.periodKind==='ytd'?' Số liệu đến '+date(row.asOf)+'.':''}</p><ul class="source-evidence">${row.issueItems.map(issue=>`<li>${external(issue.url,issue.title)}<small>${issue.published?'Phát hành '+date(issue.published)+' · ':''}${issue.paperKeys.length?issue.paperKeys.length+' bài được liệt kê':'Nguồn số đã phát hành'}</small></li>`).join('')}</ul></section>`).join('');
 panel.innerHTML=`<a class="detail-back" href="#journals">Trở lại danh mục tạp chí</a><h2 id="detail-heading" class="detail-heading">${esc(fullName(j))}</h2><p class="detail-subtitle">${esc(j.titleVi)} · ${esc(j.subject)}</p><div class="detail-metrics">${detailMetric('CiteScore '+scopus.annualYears.at(-1),score(a?.value),a?'Nguồn Scopus':'Chưa đối chiếu Scopus')}${detailMetric('Tracker '+scopus.trackerYear,score(t?.value),t?'Cập nhật '+date(t.lastUpdated):'Chưa có bản đối chiếu')}${detailMetric('Bài xuất bản '+state.year,o?.coverage==='complete'?number(o.papers):'—',Number.isFinite(o?.issues)?o.issues+' kỳ đã phát hành':'Chưa đủ nguồn sản lượng')}</div><div class="detail-grid"><div><section class="detail-section"><h3>Hồ sơ tạp chí</h3><dl class="profile-list">${profileRows.map(([label,value])=>`<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>${j.formerTitles?.length?`<p class="detail-note">Tên / ISSN trước đây: ${j.formerTitles.map(v=>esc(v.title)+(v.issn?' ('+esc(v.issn)+')':'')).join('; ')}.</p>`:''}<div class="detail-links">${external(j.website,'Website chính thức')}<a href="#trends" data-trend-journal="${j.id}">Xem xu hướng tạp chí</a></div></section><section class="detail-section"><h3>Sản lượng xuất bản</h3><div class="detail-table-scroll"><table class="detail-table"><thead><tr><th scope="col">Kỳ dữ liệu</th><th scope="col">Bài</th><th scope="col">Số / kỳ</th><th scope="col">Đối chiếu</th></tr></thead><tbody>${outputRows}</tbody></table></div><p class="detail-note">Đếm bài trong số đã phát hành, khác số tài liệu trong cửa sổ tính CiteScore. Không tính tăng/giảm giữa một năm chưa kết thúc và cả năm trước.</p></section>${ownRecords.length?`<section class="detail-section"><h3>Lịch sử Scopus</h3><div class="detail-table-scroll"><table class="detail-table"><thead><tr><th scope="col">Năm</th><th scope="col">CiteScore</th><th scope="col">Trích dẫn</th><th scope="col">Tài liệu</th></tr></thead><tbody>${metricRows}</tbody></table></div><p class="detail-note">Trích dẫn / tài liệu thuộc cửa sổ tính CiteScore của từng năm; Tracker là tạm thời. “—” là nguồn chưa có giá trị, không phải 0.</p></section>`:'<p class="detail-note">Chưa có lịch sử CiteScore trong bộ dữ liệu Scopus đã đối chiếu của dashboard.</p>'}${categories.length?`<section class="detail-section"><h3>Phân vị theo nhóm ngành Scopus</h3><ul class="source-evidence">${categories.map(c=>`<li>${esc(c.name)} · ${c.year}<small>Phân vị ${number(c.percentile)} · Hạng ${number(c.rank)}/${number(c.total)}</small>${external(c.sourceUrl,'Nguồn Scopus')}</li>`).join('')}</ul></section>`:''}</div><div><section class="detail-section"><h3>Tình trạng chỉ mục</h3><ul class="source-evidence">${indexRows||'<li>Chưa có trạng thái chỉ mục được đối chiếu.</li>'}</ul></section><section class="detail-section"><h3>Kỳ phát hành mới nhất</h3>${j.latestIssue?`<p>${external(j.latestIssue.url,j.latestIssue.title)}</p><p class="detail-note">${j.latestIssue.published?'Phát hành '+date(j.latestIssue.published):'Chưa xác minh ngày phát hành'}</p>`:'<p class="detail-note">Chưa xác minh kỳ phát hành mới nhất.</p>'}</section>${issueGroups}<section class="detail-section"><h3>Nguồn hồ sơ</h3><ol class="reference-list" role="list">${j.profileSources.map(url=>`<li><p>${external(url)}. Truy cập ngày ${date(checkedAt(j))}.</p></li>`).join('')}</ol></section></div></div>`;
 if(j.localCitation)panel.querySelector('.detail-grid>div').insertAdjacentHTML('beforeend',localCitationSection(j));
}
function localCitationSection(j){
 const local=j.localCitation,years=[...new Set([...local.citationSeries,...local.selfCalculatedSeries].map(r=>r.year))].filter(y=>y>=2015&&y<=Number(dashboard.collectedAt.slice(0,4))).sort((a,b)=>a-b);
 const rows=years.map(year=>{const c=local.citationSeries.find(r=>r.year===year),s=local.selfCalculatedSeries.find(r=>r.year===year);return `<tr><th scope="row">${year}</th><td>${number(c?.citingDocuments)}</td><td>${number(c?.confirmedCitationEdges)}</td><td title="${s?esc(s.window+': '+s.numerator+' / '+s.denominator):'Chưa có giá trị'}">${ratio(s?.value)}</td></tr>`;}).join('');
 return `<section class="detail-section"><h3>Trích dẫn từ bộ số liệu đã thu thập</h3><p class="detail-note">Xử lý ngày ${date(local.processedAt)}.${local.sourceExportDate?' Xuất Scopus ngày '+date(local.sourceExportDate)+'.':' Bộ dữ liệu chưa ghi ngày xuất Scopus.'} Chỉ đếm tài liệu và lượt trích dẫn đã khớp với danh mục bài.</p><div class="detail-table-scroll"><table class="detail-table"><thead><tr><th scope="col">Năm</th><th scope="col">Tài liệu trích dẫn</th><th scope="col">Lượt trích dẫn</th><th scope="col">Chỉ số 4 năm<br>tự tính</th></tr></thead><tbody>${rows}</tbody></table></div><p class="detail-note">Năm là năm của tài liệu trích dẫn. Chỉ số tự tính = lượt trích dẫn trong cửa sổ 4 năm tới bài xuất bản trong cùng cửa sổ / số bài trong danh mục của cửa sổ; không phải CiteScore hay Tracker chính thức. Phạm vi bị giới hạn bởi bộ thu thập và quy tắc khớp bài; không thay thế số liệu Scopus.</p>${local.publicSourceUrl?external(local.publicSourceUrl,'Nguồn thống kê tạp chí'):''}</section>`;
}
function renderUpdates(){
 $('#snapshot-history').innerHTML=dashboard.history.map(h=>`<li><time datetime="${h.date}">${date(h.date)}</time><h4>${esc(h.title)}</h4><p>${esc(h.description)}</p>${h.url?`<a href="${esc(h.url)}">Mở bản dữ liệu đã lưu</a>`:''}</li>`).join('');
 $('#source-links').innerHTML=journals.map(j=>{const original=scopus.journals.find(v=>v.code===j.code);return `<li><p><cite>${esc(fullName(j))}</cite>. ${external(j.website)}. Đối chiếu ngày ${date(checkedAt(j))}.${original?' Scopus Source Details: '+external('https://www.scopus.com/sourceid/'+original.sourceId,'nguồn chỉ số')+'.':''} <a href="#journal/${j.id}">Nguồn từng số / kỳ</a>.</p></li>`;}).join('');
}
function route(moveFocus=false){
 const hash=location.hash.slice(1)||'overview',detail=hash.startsWith('journal/'),view=detail?'detail':['overview','journals','trends','updates'].includes(hash)?hash:'overview';
 $('#overview-panel').hidden=view!=='overview';$('#portfolio-panel').hidden=!['overview','journals'].includes(view);$('#trends-panel').hidden=view!=='trends';$('#updates-panel').hidden=view!=='updates';$('#detail-panel').hidden=view!=='detail';
 for(const tab of document.querySelectorAll('.tabs a')){if(tab.dataset.view===(detail?'journals':view))tab.setAttribute('aria-current','page');else tab.removeAttribute('aria-current');}
 if(detail){let id;try{id=decodeURIComponent(hash.slice(8));}catch{id='';}renderDetail(id);document.title=(journals.find(j=>j.id===id)?.code??'Hồ sơ')+' · VAST';}
 else document.title=({'overview':'Tổng quan','journals':'Danh mục','trends':'Xu hướng','updates':'Nguồn & cập nhật'}[view])+' · VAST';
 if(view==='trends')renderChart();else closeDetails();
 if(moveFocus){const target=view==='detail'?$('#detail-heading'):$('#main-content');target.tabIndex=-1;target.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}
}
function renderLegend(){
 $('#chart-legend').innerHTML=journals.map(j=>{const s=styles[j.id],isTrackerOnly=j.code==='CIP'&&state.metric==='citescore';const mark=isTrackerOnly?`<path d="M14 1 L19 6 L14 11 L9 6 Z" fill="var(--paper)" stroke="${s.color}" stroke-width="2"/>`:`<line x1="0" y1="6" x2="28" y2="6" stroke="${s.color}" stroke-width="2"${s.dash?` stroke-dasharray="${s.dash}"`:''}/>`;return `<button class="journal-toggle" type="button" data-journal="${j.id}" aria-pressed="${state.series.has(j.id)}" aria-label="${esc(fullName(j))}" title="${esc(fullName(j))}"><svg viewBox="0 0 28 12" aria-hidden="true">${mark}</svg><span class="legend-label" translate="no">${j.code}</span></button>`;}).join('');
}
function niceScale(maximum){
 const target=Math.max(1,maximum*1.12),rough=target/5,power=10**Math.floor(Math.log10(rough));
 let step=[1,2,2.5,5,10].find(n=>n>=rough/power)*power;
 if(!metricInfo[state.metric].decimals)step=Math.max(1,step);
 return {step,max:Math.ceil(target/step)*step};
}
function renderChart(){
 if(!dashboard)return;
 const width=chartWidth,height=matchMedia('(max-width:767px)').matches?270:360,left=48,right=26,top=32,bottom=34;
 const years=availableYears().filter(y=>y>=state.from&&y<=state.to),start=years[0],end=years.at(-1),plotWidth=width-left-right,plotHeight=height-top-bottom;
 const values=journals.flatMap(j=>years.map(y=>observation(j,state.metric,y).value)).filter(Number.isFinite),scale=niceScale(Math.max(0,...values));
 const x=year=>years.length===1?left+plotWidth/2:left+(year-start)/(end-start)*plotWidth,y=value=>top+(1-value/scale.max)*plotHeight;
 plot={width,height,left,right,top,bottom,plotWidth,years,start,end,x,y};
 const chart=$('#trend-chart');chart.setAttribute('viewBox',`0 0 ${width} ${height}`);
 const currentYear=Number(dashboard.collectedAt.slice(0,4)),provisional=years.includes(currentYear);
 let svg=`<title id="chart-title">${esc(metricInfo[state.metric].label)} ${start}–${end}</title><desc id="chart-description">Đọc số liệu theo năm bằng chuột, chạm hoặc bàn phím. Giá trị chưa có nguồn không được vẽ thành 0. Năm ${currentYear} là ${metricInfo[state.metric].scopus?'Tracker tạm thời':'năm chưa kết thúc'}.</desc>`;
 if(provisional){const boundary=years.length===1?left:(x(currentYear-1)+x(currentYear))/2;svg+=`<rect x="${boundary}" y="${top-8}" width="${width-boundary}" height="${plotHeight+8}" fill="var(--surface)"/><text x="${width-6}" y="16" text-anchor="end" fill="var(--muted)" font-size="11">${metricInfo[state.metric].scopus?'Tracker':metricInfo[state.metric].local?'Chưa đủ năm':'Đến ngày chốt'}</text>`;}
 for(let i=0;i<=Math.round(scale.max/scale.step);i++){const v=i*scale.step;svg+=`<line x1="${left}" y1="${y(v)}" x2="${width}" y2="${y(v)}" stroke="var(--line)"/><text x="${left-10}" y="${y(v)+4}" text-anchor="end" fill="var(--muted)" font-size="11">${integer.format(v)}</text>`;}
 const tickStep=years.length<=8&&width>=600?1:years.length<=4?1:width<600?3:2;
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
 $('#chart-caption').textContent=metricInfo[state.metric].local?`Nguồn: bộ số liệu đã thu thập 09–09h, xử lý ${processingPeriod}. Tài liệu / lượt trích dẫn được tính theo năm của tài liệu trích dẫn và chỉ gồm tập đã xác nhận. Chỉ số 4 năm là tự tính, không phải CiteScore/Tracker chính thức. Hình thoi, nét đứt: năm chưa kết thúc; ngày xuất nguồn ghi trong từng hồ sơ.`:metricInfo[state.metric].scopus?`Điểm tròn: số liệu năm trong cửa sổ tính CiteScore. Hình thoi, nét đứt: Tracker ${scopus.trackerYear}, cập nhật ${date(scopus.records.find(r=>r.type==='tracker').lastUpdated)}. Trích dẫn / tài liệu không phải sản lượng xuất bản của riêng năm đó.`:`Bài / kỳ trong các số đã phát hành. ${currentYear} là số liệu đến ${date(dashboard.collectedAt)}, không tương đương một năm đầy đủ. Giá trị thiếu nguồn không được thay bằng 0.`;
}
function updateSeries(animate=false){
 for(const button of document.querySelectorAll('.journal-toggle'))button.setAttribute('aria-pressed',String(state.series.has(button.dataset.journal)));
 let points=0;for(const group of document.querySelectorAll('.journal-series')){const on=state.series.has(group.dataset.journal),wasHidden=group.hasAttribute('hidden');group.toggleAttribute('hidden',!on);group.classList.remove('is-muted');if(on)points+=group.querySelectorAll('.chart-point').length;if(on&&wasHidden&&animate&&!reduced.matches)group.animate([{opacity:0},{opacity:1}],{duration:180,easing:'cubic-bezier(.23,1,.32,1)'});}
 $('#show-all').disabled=state.series.size===journals.length;$('#chart-empty')?.toggleAttribute('hidden',points!==0);
 const selected=[...state.series].map(id=>journals.find(j=>j.id===id)).filter(Boolean),withData=selected.filter(j=>plot.years.some(y=>Number.isFinite(observation(j,state.metric,y).value))).length;
 $('#chart-scope').textContent=`${selected.length} tạp chí được chọn; ${withData} có giá trị trong khoảng năm này.`+(selected.length>4?' Có thể chọn 2–4 tạp chí để dễ đối chiếu.':'');
 if(!points)closeDetails();else if(selectedYear!==null)showYear(selectedYear,true);
}
function closeDetails(announce=false){selectedYear=null;pinned=false;$('#chart-tooltip').hidden=true;$('#chart-hover')?.setAttribute('hidden','');if(announce)$('#chart-announcement').textContent='Đã đóng bảng số liệu.';}
function showYear(year,force=false,announce=false){
 if(!state.series.size||!plot.years.includes(year))return;if(year===selectedYear&&!force)return;selectedYear=year;
 const rows=journals.filter(j=>state.series.has(j.id)).map(j=>({j,o:observation(j,state.metric,year)})),provisional=year===Number(dashboard.collectedAt.slice(0,4));
 const heading=metricInfo[state.metric].short+' '+year+(provisional?(metricInfo[state.metric].scopus?' · Tracker':metricInfo[state.metric].local?' · chưa đủ năm':' · đến ngày chốt'):'');$('#tooltip-year').textContent=heading;
 $('#tooltip-values').innerHTML=rows.map(({j,o})=>`<div class="tooltip-row"><dt><span class="tooltip-dot" style="background:${styles[j.id].color}" aria-hidden="true"></span><span title="${esc(fullName(j))}" translate="no">${j.code}</span></dt><dd class="${Number.isFinite(o.value)?'':'neutral'}" title="${esc(Number.isFinite(o.value)?'':o.reason)}">${metricValue(o.value)}</dd></div>`).join('');
 $('#tooltip-note').textContent=metricInfo[state.metric].local?'Tập số liệu đã thu thập; không phải tổng trích dẫn hay chỉ số chính thức của Scopus. “—”: chưa có nguồn.':provisional?(metricInfo[state.metric].scopus?'Chỉ số tạm thời. Nguồn cập nhật '+date(scopus.records.find(r=>r.type==='tracker').lastUpdated)+'.':'Năm chưa kết thúc; đối chiếu đến '+date(dashboard.collectedAt)+'.'):'“—”: chưa có giá trị được đối chiếu cho kỳ này.';
 const px=plot.x(year),tipWidth=Math.min(300,plot.width-24);$('#chart-tooltip').style.left=Math.max(12,px+16+tipWidth<=plot.width-12?px+16:px-tipWidth-16)+'px';$('#chart-tooltip').hidden=false;
 const hover=$('#chart-hover');hover.removeAttribute('hidden');hover.innerHTML=`<line x1="${px}" y1="${plot.top}" x2="${px}" y2="${plot.height-plot.bottom}" stroke="var(--muted)" stroke-dasharray="3 4"/>`+rows.filter(r=>Number.isFinite(r.o.value)).map(({j,o})=>`<circle cx="${px}" cy="${plot.y(o.value)}" r="5" fill="var(--paper)" stroke="${styles[j.id].color}" stroke-width="2.5"/>`).join('');
 if(announce)$('#chart-announcement').textContent=heading+'. '+rows.map(({j,o})=>j.code+': '+metricValue(o.value)).join('; ')+'.';
}
function yearFromPointer(event){const bounds=$('#trend-chart').getBoundingClientRect(),px=(event.clientX-bounds.left)*plot.width/bounds.width;return plot.years.length===1?plot.start:Math.max(plot.start,Math.min(plot.end,Math.round(plot.start+(px-plot.left)/plot.plotWidth*(plot.end-plot.start))));}
function bindEvents(){
 $('.skip-link').addEventListener('click',event=>{event.preventDefault();$('#main-content').focus();$('#main-content').scrollIntoView({block:'start'});});
 $('#portfolio-filters').addEventListener('submit',e=>e.preventDefault());
 for(const [selector,key]of[['#journal-search','q'],['#publication-year','year'],['#subject-filter','subject'],['#index-filter','index'],['#sort-order','sort']])$(selector).addEventListener(key==='q'?'input':'change',event=>{state[key]=key==='year'?Number(event.target.value):event.target.value;saveState();renderPortfolio();renderOverview();});
 $('#reset-filters').addEventListener('click',()=>{Object.assign(state,{q:'',subject:'all',index:'all',sort:'default',year:dashboard.defaultOutputYear});syncInputs();saveState();renderPortfolio();renderOverview();});
 $('#trend-metric').addEventListener('change',event=>{state.metric=event.target.value;const years=availableYears();state.from=years[0];state.to=years.at(-1);closeDetails();syncInputs();saveState();renderLegend();renderChart();});
 $('#trend-from').addEventListener('change',event=>{state.from=Number(event.target.value);if(state.to<state.from)state.to=state.from;closeDetails();syncInputs();saveState();renderChart();});
 $('#trend-to').addEventListener('change',event=>{state.to=Number(event.target.value);if(state.from>state.to)state.from=state.to;closeDetails();syncInputs();saveState();renderChart();});
 $('#show-all').addEventListener('click',event=>{for(const j of journals)state.series.add(j.id);saveState();updateSeries(event.detail>0);});
 $('#reset-series').addEventListener('click',event=>{state.series=new Set(defaultSeries);saveState();updateSeries(event.detail>0);});
 $('#chart-legend').addEventListener('click',event=>{const button=event.target.closest('button[data-journal]');if(!button)return;const id=button.dataset.journal;if(state.series.has(id))state.series.delete(id);else state.series.add(id);saveState();updateSeries(event.detail>0);});
 $('#chart-legend').addEventListener('pointerover',event=>{const b=event.target.closest('button[data-journal]');if(event.pointerType==='mouse'&&b&&state.series.has(b.dataset.journal))for(const g of document.querySelectorAll('.journal-series'))g.classList.toggle('is-muted',g.dataset.journal!==b.dataset.journal);});
 $('#chart-legend').addEventListener('pointerleave',()=>{for(const g of document.querySelectorAll('.journal-series'))g.classList.remove('is-muted');});
 $('#trend-chart').addEventListener('pointermove',e=>{if(e.pointerType!=='touch'&&!pinned)showYear(yearFromPointer(e));});
 $('.chart-area').addEventListener('pointerleave',()=>{if(!pinned)closeDetails();});
 $('#trend-chart').addEventListener('click',e=>{const year=yearFromPointer(e);if(pinned&&selectedYear===year){closeDetails();return;}pinned=true;showYear(year,true,true);});
 $('#trend-chart').addEventListener('keydown',e=>{if(e.key==='Escape'){closeDetails(true);return;}if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();let year=selectedYear;if(e.key==='Home')year=plot.start;else if(e.key==='End')year=plot.end;else if(e.key==='ArrowLeft')year=year===null?plot.end:Math.max(plot.start,year-1);else year=year===null?plot.start:Math.min(plot.end,year+1);pinned=true;showYear(year,true,true);});
 $('#close-tooltip').addEventListener('click',e=>{closeDetails(true);if(e.detail===0)$('#trend-chart').focus({preventScroll:true});});
 $('#detail-panel').addEventListener('click',event=>{const link=event.target.closest('[data-trend-journal]');if(!link)return;const j=journals.find(v=>v.id===link.dataset.trendJournal);state.series=new Set([j.id]);state.metric=scopus.journals.some(v=>v.code===j.code)?'citescore':'papers';const years=availableYears();state.from=years[0];state.to=years.at(-1);closeDetails();syncInputs();saveState();renderLegend();});
 window.addEventListener('hashchange',()=>route(true));
 window.addEventListener('popstate',()=>{closeDetails();readState();syncInputs();renderOverview();renderPortfolio();renderLegend();route();});
 new ResizeObserver(entries=>{const width=Math.round(entries[0].contentRect.width);if(width<=0||width===chartWidth)return;chartWidth=width;renderChart();}).observe($('.chart-area'));
}
async function start(){
 try{
 [dashboard,scopus]=await Promise.all([fetchJson('data/dashboard.json'),fetchJson('data-scopus.json')]);
 journals=dashboard.journals;
 if(journals.length!==12||new Set(journals.map(j=>j.id)).size!==12)throw new Error('Danh mục tạp chí không hợp lệ.');
 recordIndex=new Map(scopus.records.map(r=>[r.journal+'|'+r.year+'|'+r.type,r]));styles=Object.fromEntries(journals.map((j,i)=>[j.id,{color:seriesPalette[i][0],dash:seriesPalette[i][1]}]));
 readState();$('#snapshot-date').dateTime=dashboard.collectedAt;$('#snapshot-date').textContent=date(dashboard.collectedAt);
 $('#publication-year').innerHTML=dashboard.outputYears.map(y=>`<option value="${y}">${y}${y===Number(dashboard.collectedAt.slice(0,4))?' · đến ngày chốt':''}</option>`).join('');
 const subjects=[...new Set(journals.map(j=>j.subject))].sort((a,b)=>a.localeCompare(b,'vi'));$('#subject-filter').insertAdjacentHTML('beforeend',subjects.map(s=>`<option value="${esc(s)}">${esc(s)}</option>`).join(''));
 syncInputs();renderOverview();renderPortfolio();renderUpdates();renderLegend();renderChart();bindEvents();route();$('#load-status').hidden=true;
 const days=Math.floor((Date.now()-Date.parse(dashboard.collectedAt+'T00:00:00Z'))/86400000);
 if(days>dashboard.reviewAfterDays){$('#freshness-notice').textContent='Bản dữ liệu được đối chiếu đến '+date(dashboard.collectedAt)+'. Các nguồn cần được kiểm tra lại theo chu kỳ cập nhật.';$('#freshness-notice').hidden=false;}
 }catch(error){console.error(error);$('#load-status').hidden=true;$('#load-error').hidden=false;}
}
$('#retry-load').addEventListener('click',()=>location.reload());
start();
