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
const subjects={vjm:'Toán học',amv:'Toán học',ansn:'Vật liệu và công nghệ nano',vjc:'Hóa học',vjes:'Khoa học Trái đất',vjst:'Khoa học và công nghệ',cip:'Vật lý',vjmech:'Cơ học',jcc:'Tin học và điều khiển',ajb:'Sinh học',vjmst:'Khoa học và công nghệ biển',vjbt:'Công nghệ sinh học'};
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
const collectedAt=evidence[0].collectedAt,currentYear=Number(collectedAt.slice(0,4)),outputYears=Array.from({length:currentYear-2019},(_,i)=>2020+i);
assert(evidence.every(e=>e.collectedAt===collectedAt),'Profile evidence dates must agree.');
const profiles=evidence.flatMap(e=>e.journals),localAudits=audits.flatMap(a=>a.journals);
assert.deepEqual(profiles.map(j=>j.id).sort(),[...order].sort(),'Need exactly the 12 agreed journal profiles.');
assert.equal(new Set(localAudits.map(j=>j.id)).size,9,'Need nine distinct user collections.');
const sources=[];
for(const file of [...profileFiles,...auditFiles])sources.push({path:file,sha256:sha(await readFile(path.join(root,file)))});
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
 assert(statsSource,audit.code+': no decoded stats input.');
 for(const input of audit.sourceFiles){
  assert(input.path.startsWith('2026/09')&&!input.path.includes('..'),audit.code+': unexpected input path.');
  assert.equal(sha(await readFile(path.join(workspace,input.path))),input.sha256,audit.code+': source changed after audit: '+input.path);
 }
 const raw=await readJson(path.join(workspace,statsSource.path));
 assert.equal(raw.meta.officialScopusMetric,false,audit.code+': local data must not be labeled official.');
 assert.equal(raw.meta.updatedAt,audit.processedAt,audit.code+': wrong processing date.');
 const citationSeries=raw.citingSeries.filter(r=>r.year<=currentYear).map(r=>{
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
 return {processedAt:audit.processedAt,publicSourceUrl:audit.publicSourceUrl,officialScopusMetric:false,totals,citationSeries,selfCalculatedSeries};
}
const categories={VJM:['General Mathematics',72,115,414],AMV:['General Mathematics',18,338,414],ANSN:['Industrial and Manufacturing Engineering',61,164,425],VJC:['General Chemistry',43,227,402],VJST:['Electrical and Electronic Engineering',20,821,1030]};
const journals=[];
for(let index=0;index<order.length;index++){
 const j=structuredClone(profiles.find(p=>p.id===order[index]));
 assert.equal(j.code,codes[index],'Unexpected journal code.');
 j.subject=subjects[j.id];j.checkedAt=collectedAt;j.aliases=j.id==='amv'?['AVM']:[];
 j.profileSources=[...new Set([j.website,...j.profileSources])];
 assert(j.profileSources.every(url=>/^https?:\/\//.test(url)),j.code+': profileSources must use http(s) URLs.');
 const original=scopus.journals.find(s=>s.code===j.code);
 j.group=original?'VAST-1':'VAST-2';
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
 if(category){const r=scopus.records.find(r=>r.journal===j.code&&r.type==='annual'&&r.year===2025);assert(r.evidenceQuote.includes(category[0])&&r.evidenceQuote.includes(category[1]+'%')&&r.evidenceQuote.includes(category[2]+'/'+category[3]),j.code+': percentile not supported by baseline quote.');j.scopusCategories=[{year:2025,name:category[0],percentile:category[1],rank:category[2],total:category[3],sourceUrl:'https://www.scopus.com/sourceid/'+original.sourceId}];}
 const audit=localAudits.find(a=>a.id===j.id);
 if(audit)j.localCitation=await localCollection(audit,Boolean(original));
 journals.push(j);
}
const snapshotId=collectedAt+'-v1',snapshotPath='data/snapshots/'+snapshotId+'.json';
const dataset={schemaVersion:1,snapshotId,collectedAt,reviewAfterDays:45,outputYears,defaultOutputYear:currentYear-1,officialScopus:{path:'data-scopus.json',sha256:baselineHash,observations:84,reportDate:scopus.reportDate,trackerSourceUpdatedAt:scopus.records.find(r=>r.type==='tracker').lastUpdated},history:[{date:collectedAt,title:'Danh mục 12 tạp chí VAST (Nhóm VAST-1 & VAST-2, 2020–2026)',description:'Tổng hợp hồ sơ, chỉ mục, sản lượng xuất bản giai đoạn 2020–2026 của 12 tạp chí (7 tạp chí nhóm VAST-1 thuộc Scopus/WoS và 5 tạp chí nhóm VAST-2), kèm thống kê trích dẫn và CiteScore dự kiến cho nhóm VAST-2.',url:snapshotPath},{date:scopus.reportDate,title:'Bản đối chiếu Scopus của 7 tạp chí nhóm VAST-1',description:'Giữ nguyên 84 bản ghi: CiteScore 2015–2025 và Tracker 2026; Tracker cập nhật tại nguồn ngày 05/10/2026.',url:'data-scopus.json'}],journals};
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
for(const year of dataset.outputYears){const outputs=journals.map(j=>j.outputs.find(o=>o.year===year)),complete=outputs.filter(o=>o.coverage==='complete');console.log(year+': '+complete.length+'/12 complete paper inventories; '+complete.reduce((sum,o)=>sum+o.papers,0)+' papers in that covered group; '+outputs.reduce((sum,o)=>sum+o.issues,0)+' verified issued issues.');}
console.log('Official Scopus: 84 records byte-preserved. Local citation collections: '+journals.filter(j=>j.localCitation).length+'. Future-year observations excluded; zero-denominator ratios unavailable.');
