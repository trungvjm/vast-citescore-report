import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

const root=fileURLToPath(new URL('../',import.meta.url));
const workspace=path.resolve(root,'../..');
const baselineHash='113f67b7de073007741f9bb3a1a2f4948df7098f520a434649d151bb2be10d89';
const order=['vjm','amv','ansn','vjc','vjes','vjst','cip','vjmech','jcc','ajb','vjmst','vjbt'];
const codes=['VJM','AMV','ANSN','VJC','VJES','VJST','CIP','VJMech','JCC','AJB','VJMST','VJBT'];
const subjects={vjm:'Toán học',amv:'Toán học',ansn:'Vật liệu và công nghệ nano',vjc:'Hóa học',vjes:'Khoa học Trái đất',vjst:'Khoa học và công nghệ',cip:'Vật lý',vjmech:'Cơ học',jcc:'Tin học và điều khiển học',ajb:'Sinh học',vjmst:'Khoa học và công nghệ biển',vjbt:'Công nghệ sinh học'};
const volOffsets={cip:1990,vjst:1962,vjes:1978,ajb:1978,vjbt:2002,jcc:1984,vjmst:2000};
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const readJson=async file=>JSON.parse(await readFile(file,'utf8'));
const profileFiles=['evidence/dashboard-publishers.json','evidence/dashboard-vjs-core.json','evidence/dashboard-vjs-other.json'];
const auditFiles=['evidence/dashboard-local-core.json','evidence/dashboard-local-chem-earth.json','evidence/dashboard-local-other.json'];
const baselineBytes=await readFile(path.join(root,'data-scopus.json'));
assert.equal(sha(baselineBytes),baselineHash,'Original official Scopus snapshot changed. Do not overwrite this historical baseline.');
const scopus=JSON.parse(baselineBytes);
assert.equal(scopus.records.length,84,'Baseline must retain all 84 observations.');
assert.equal(new Set(scopus.records.map(r=>r.journal+'|'+r.year+'|'+r.type)).size,84,'Duplicate official observations.');
const evidence=await Promise.all(profileFiles.map(f=>readJson(path.join(root,f))));
const audits=await Promise.all(auditFiles.map(f=>readJson(path.join(root,f))));
const [histIntl,histOjs,media]=await Promise.all([
 readJson(path.join(root,'evidence/dashboard-history-intl.json')),
 readJson(path.join(root,'evidence/dashboard-history-ojs.json')),
 readJson(path.join(root,'evidence/dashboard-media.json'))
]);
const collectedAt=evidence[0].collectedAt,currentYear=Number(collectedAt.slice(0,4)),outputYears=Array.from({length:currentYear-2019},(_,i)=>2020+i);
assert(evidence.every(e=>e.collectedAt===collectedAt),'Profile evidence dates must agree.');
const profiles=evidence.flatMap(e=>e.journals),localAudits=audits.flatMap(a=>a.journals);
const historyMap=new Map([...histIntl.journals,...histOjs.journals].map(j=>[j.id,j]));
assert.deepEqual(profiles.map(j=>j.id).sort(),[...order].sort(),'Need exactly the 12 agreed journal profiles.');
assert.equal(new Set(localAudits.map(j=>j.id)).size,9,'Need nine distinct user collections.');

function validateOutput(j,o){
 assert.equal(o.asOf,collectedAt,j.code+': output cutoff differs from snapshot.');
 assert(['complete','partial','unverified'].includes(o.coverage),j.code+': invalid coverage.');
 assert.equal(o.periodKind,o.year===currentYear?'ytd':'annual',j.code+': current year must remain YTD.');
 assert(o.sourceUrls.length>0&&o.sourceUrls.every(url=>/^https?:\/\//.test(url)),j.code+': publication count needs valid http(s) sources.');
 assert.equal(o.issues,o.issueItems.length,j.code+': issued-issue count does not reconcile.');
 assert.equal(new Set(o.issueItems.map(i=>i.id)).size,o.issueItems.length,j.code+': duplicate issue ID.');
 const allKeys=[];
 for(const issue of o.issueItems){
  assert(issue.id&&issue.title&&/^https?:\/\//.test(issue.url),j.code+': issue needs stable identity and URL.');
  if(issue.published)assert(/^\d{4}-\d{2}(-\d{2})?$/.test(issue.published)&&issue.published<=collectedAt,j.code+': future or invalid issue publication date.');
  for(const key of issue.paperKeys){assert(/^(doi:10\.|url:https?:\/\/)/.test(key),j.code+': invalid paper identifier.');allKeys.push(key.toLowerCase());}
 }
 assert.equal(new Set(allKeys).size,allKeys.length,j.code+': duplicate paper identifier across issues.');
 if(o.papers!==null)assert.equal(o.papers,allKeys.length,j.code+': papers must reconcile to eligible issue keys.');
 if(o.coverage==='complete')assert(Number.isInteger(o.papers)&&o.papers>=0,j.code+': complete coverage requires an exact paper count.');
 delete o.note;
}

async function localCollection(audit,isScopusIndexed){
 const statsSource=audit.sourceFiles.find(s=>s.path.endsWith('-stats.json'));
 const catSource=audit.sourceFiles.find(s=>s.path.endsWith('_ojs_catalog.json'));
 assert(statsSource&&catSource,audit.code+': missing stats or catalog input.');
 for(const input of audit.sourceFiles){
  assert(input.path.startsWith('2026/09')&&!input.path.includes('..'),audit.code+': unexpected input path.');
  assert.equal(sha(await readFile(path.join(workspace,input.path))),input.sha256,audit.code+': source changed after audit: '+input.path);
 }
 const raw=await readJson(path.join(workspace,statsSource.path));
 const cat=await readJson(path.join(workspace,catSource.path));
 assert.equal(raw.meta.officialScopusMetric,false,audit.code+': local data must not be labeled official.');
 assert.equal(raw.meta.updatedAt,audit.processedAt,audit.code+': wrong processing date.');
 const citationSeries=raw.citingSeries.filter(r=>r.year<=currentYear&&(r.docs>0||r.occurrences>0||r.year>=2015)).map(r=>{
  assert(Number.isInteger(r.year)&&Number.isInteger(r.docs)&&r.docs>=0&&Number.isInteger(r.occurrences)&&r.occurrences>=r.docs,audit.code+': invalid confirmed citation counts.');
  return {year:r.year,citingDocuments:r.docs,confirmedCitationEdges:r.occurrences};
 });
 const selfCalculatedSeries=isScopusIndexed?[]:raw.citeScoreSeries.filter(r=>r.year<=currentYear).map(r=>{
  assert(Number.isInteger(r.cs4_num)&&r.cs4_num>=0&&Number.isInteger(r.cs4_den)&&r.cs4_den>=0,audit.code+': invalid four-year components.');
  if(r.cs4_den>0)assert(Math.abs(r.cs4-r.cs4_num/r.cs4_den)<=0.005001,audit.code+': rounded four-year ratio does not reconcile.');
  return {year:r.year,value:r.cs4_den>0?r.cs4:null,numerator:r.cs4_num,denominator:r.cs4_den,window:r.window};
 });
 for(const series of [citationSeries,selfCalculatedSeries])assert.equal(new Set(series.map(r=>r.year)).size,series.length,audit.code+': duplicate year.');
 const totals={citingDocs:raw.meta.totalCitingDocs,citations:raw.meta.totalCitations,citedArticles:raw.meta.totalCitedArticles,hIndex:raw.meta.hIndex};
 return {local:{processedAt:audit.processedAt,publicSourceUrl:audit.publicSourceUrl,officialScopusMetric:false,totals,citationSeries,selfCalculatedSeries},cat};
}

function buildAnnualHistory(j,hist,cat,verifiedOutputs){
 const byYear=new Map();
 if(j.id==='vjc'&&hist.ojsArchiveSeries){
  for(const r of hist.ojsArchiveSeries)if(r.year<2018&&r.papers>0)byYear.set(r.year,{year:r.year,papers:r.papers,issues:r.issues,periodKind:'annual'});
  for(const r of hist.annualSeries)if(r.year>=2018&&r.year<2020)byYear.set(r.year,{year:r.year,papers:r.papers,issues:r.issues,periodKind:'annual'});
 }else if(['vjm','amv','ansn','vjmech'].includes(j.id)){
  for(const r of hist.annualSeries)if(r.year<2020&&r.papers>0)byYear.set(r.year,{year:r.year,papers:r.papers,issues:r.issues,periodKind:'annual'});
 }else if(cat&&volOffsets[j.id]){
  const offset=volOffsets[j.id],counts=new Map(),issueMap=new Map((hist?.annualSeries??[]).map(r=>[r.year,r.issues]));
  for(const a of cat.articles){
   if(a.isOnlineFirst)continue;
   let vol=Number(a.volume);
   if(!vol&&a.doi){const m=String(a.doi).match(/10\.15625\/[^/]+\/(\d{1,2})\//);if(m)vol=Number(m[1]);}
   const yr=(vol&&vol>=1&&vol<=70)?(vol+offset):Number(a.year);
   if(yr&&yr>=1985&&yr<2020&&(j.id!=='ajb'||yr>=2005))counts.set(yr,(counts.get(yr)||0)+1);
  }
  for(const [yr,papers] of [...counts.entries()].sort((a,b)=>a[0]-b[0])){
   if(papers>0)byYear.set(yr,{year:yr,papers,issues:issueMap.get(yr)??4,periodKind:'annual'});
  }
 }
 for(const o of verifiedOutputs)byYear.set(o.year,{year:o.year,papers:o.papers,issues:o.issues,periodKind:o.periodKind});
 const citMap=new Map((j.localCitation?.citationSeries||hist?.fullCitationSeries||[]).map(c=>[c.year,c]));
 const csMap=new Map((j.localCitation?.selfCalculatedSeries||[]).map(c=>[c.year,c]));
 return [...byYear.values()].sort((a,b)=>a.year-b.year).map(r=>{
  const cit=citMap.get(r.year);
  const cs=csMap.get(r.year);
  return {
   ...r,
   citingDocs:cit?(cit.citingDocuments??cit.docs??null):null,
   citationEdges:cit?(cit.confirmedCitationEdges??cit.occurrences??null):null,
   selfCalcScore:cs?(cs.value??cs.score??null):null,
   selfCalcNum:cs?(cs.numerator??null):null,
   selfCalcDen:cs?(cs.denominator??null):null
  };
 });
}

const categories={VJM:['General Mathematics',72,115,414],AMV:['General Mathematics',18,338,414],ANSN:['Industrial and Manufacturing Engineering',61,164,425],VJC:['General Chemistry',43,227,402],VJES:['Earth and Planetary Sciences (miscellaneous)',77,45,201],VJST:['Electrical and Electronic Engineering',20,821,1030]};
const coPublishers={vjm:['Springer Nature','assets/images/logos/springer.svg'],amv:['Springer Nature','assets/images/logos/springer.svg'],ansn:['IOP Publishing','assets/images/logos/iop.svg'],vjc:['Wiley-VCH','assets/images/logos/wiley.svg']};
const journals=[];
for(let index=0;index<order.length;index++){
 const j=structuredClone(profiles.find(p=>p.id===order[index]));
 assert.equal(j.code,codes[index],'Unexpected journal code.');
 j.subject=subjects[j.id];j.checkedAt=collectedAt;j.aliases=j.id==='amv'?['AVM']:[];
 j.profileSources=[...new Set([j.website,...j.profileSources])];
 assert(j.profileSources.every(url=>/^https?:\/\//.test(url)),j.code+': profileSources must use http(s) URLs.');
 const original=scopus.journals.find(s=>s.code===j.code);
 j.order=index+1;
 j.group=original?'VAST-1':'VAST-2';
 j.scopusSourceId=original?.sourceId??null;
 j.archiveUrl=j.profileSources.find(u=>u!==j.website)||j.website;
 j.cover='assets/images/covers/'+j.id+'.png';
 j.coverImage=j.cover;
 assert(media.covers[j.id]?.path===j.cover,j.code+': missing verified cover asset.');
 const co=coPublishers[j.id];
 j.institution=j.id==='amv'
  ?{name:'Viện Toán học (VAST)',logo:'assets/images/logos/im-vast.png',coPublisher:co[0],coLogo:co[1]}
  :{name:'NXB Khoa học tự nhiên và Công nghệ',logo:'assets/images/logos/nxb.png',coPublisher:co?.[0]??null,coLogo:co?.[1]??null};
 j.publisher=j.id==='amv'?'Viện Toán học (VAST) & Springer Nature':co?`NXB Khoa học tự nhiên và Công nghệ (VAST) & ${co[0]}`:'NXB Khoa học tự nhiên và Công nghệ, Viện Hàn lâm Khoa học và Công nghệ Việt Nam';
 if(original){
  assert.equal(j.title,original.title,j.code+': journal title differs from verified Scopus identity.');
  for(const key of ['issn','eissn'])if(original[key])assert.equal(j[key],original[key],j.code+': identity conflict.');
  j.indexings=j.indexings.filter(i=>i.system!=='Scopus');
  j.indexings.unshift({system:'Scopus',collection:null,status:'listed',evidenceLevel:'database',sourceUrl:'https://www.scopus.com/sourceid/'+original.sourceId,checkedAt:scopus.reportDate,coverage:original.coverage});
 }
 for(const i of j.indexings){assert(['listed','not_listed','unverified'].includes(i.status),j.code+': invalid indexing status.');assert(['database','journal','vast'].includes(i.evidenceLevel),j.code+': invalid evidence level.');assert(/^https?:\/\//.test(i.sourceUrl),j.code+': indexing needs a source URL.');}
 assert.deepEqual(j.outputs.map(o=>o.year),outputYears,j.code+': need 2020-2026 reporting periods.');
 for(const o of j.outputs)validateOutput(j,o);
 const category=categories[j.code];
 if(category){const r=scopus.records.find(r=>r.journal===j.code&&r.type==='annual'&&r.year===2025);assert(r.evidenceQuote.includes(category[1]+'%')&&r.evidenceQuote.includes(category[2]+'/'+category[3]),j.code+': percentile not supported by baseline quote.');j.scopusCategories=[{year:2025,name:category[0],percentile:category[1],rank:category[2],total:category[3],sourceUrl:'https://www.scopus.com/sourceid/'+original.sourceId}];}
 const audit=localAudits.find(a=>a.id===j.id);
 let cat=null;
 if(audit){const res=await localCollection(audit,Boolean(original));j.localCitation=res.local;cat=res.cat;}
 j.annualHistory=buildAnnualHistory(j,historyMap.get(j.id),cat,j.outputs);
 j.historyStartYear=j.annualHistory[0]?.year??2020;
 j.historyEndYear=j.annualHistory.at(-1)?.year??2026;
 assert(j.annualHistory.length>=7,j.code+': annualHistory must include at least 2020-2026.');
 journals.push(j);
}
const snapshotId=collectedAt+'-v1',snapshotPath='data/snapshots/'+snapshotId+'.json';
const dataset={schemaVersion:1,snapshotId,collectedAt,reviewAfterDays:45,outputYears,defaultOutputYear:currentYear-1,logos:{vast:'assets/images/logos/vast.png',nxb:'assets/images/logos/nxb.png',im:'assets/images/logos/im-vast.png'},officialScopus:{path:'data-scopus.json',sha256:baselineHash,observations:84,reportDate:scopus.reportDate,trackerSourceUpdatedAt:scopus.records.find(r=>r.type==='tracker').lastUpdated},history:[{date:collectedAt,title:'Danh mục 12 tạp chí VAST (Nhóm VAST-1 & VAST-2)',description:'Tổng hợp hồ sơ, bìa tạp chí, đơn vị xuất bản, chỉ mục, chuỗi số bài xuất bản lịch sử toàn thời gian và thống kê trích dẫn của 12 tạp chí.',url:snapshotPath},{date:scopus.reportDate,title:'Bản đối chiếu Scopus của 7 tạp chí nhóm VAST-1',description:'Giữ nguyên 84 bản ghi: CiteScore 2015–2025 và Tracker 2026; Tracker cập nhật tại nguồn ngày 05/10/2026.',url:'data-scopus.json'}],journals};
const serialized=JSON.stringify(dataset,null,2)+'\n';
if(process.argv.includes('--write')){
 await mkdir(path.join(root,'data/snapshots'),{recursive:true});
 await writeFile(path.join(root,'data/dashboard.json'),serialized);
 await writeFile(path.join(root,snapshotPath),serialized);
 console.log('Wrote '+snapshotId+'; '+Buffer.byteLength(serialized)+' bytes.');
}else{
 assert.equal(await readFile(path.join(root,'data/dashboard.json'),'utf8'),serialized,'Curated dashboard is out of sync with its verified inputs.');
 assert.equal(await readFile(path.join(root,snapshotPath),'utf8'),serialized,'Dated snapshot is out of sync.');
 console.log('Validated '+snapshotId+' against original inputs and dated snapshot.');
}
for(const j of journals){console.log(`${j.code} (${j.group}): history ${j.annualHistory[0].year}-${j.annualHistory.at(-1).year} (${j.annualHistory.length} yrs) · inst: ${j.institution.name}`);}
