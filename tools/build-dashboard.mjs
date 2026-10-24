import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
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
const volOffsets={cip:1990,vjst:1962,vjes:1978,ajb:1978,vjbt:2002,jcc:1984,vjmst:2000,vjmech:1978};
function publicationYearOf(a,offset){
 let vol=Number(a.volume);
 if(!vol&&a.doi){const m=String(a.doi).match(/10\.15625\/[^/]+\/(\d{1,2})\//);if(m)vol=Number(m[1]);}
 return (vol&&vol>=1&&vol<=70)?(vol+offset):Number(a.year);
}
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const readJson=async file=>JSON.parse(await readFile(file,'utf8'));
// Manifest paths are data, not code: keep every read inside its base directory and expected prefix.
function contained(base,rel,prefix){
 assert(typeof rel==='string'&&rel.startsWith(prefix)&&!rel.includes('..')&&!path.isAbsolute(rel),'Unsafe manifest path: '+rel);
 const full=path.resolve(base,rel),back=path.relative(base,full);
 assert(back&&!back.startsWith('..')&&!path.isAbsolute(back),'Path escapes base directory: '+rel);
 return full;
}
const profileFiles=['evidence/dashboard-publishers.json','evidence/dashboard-vjs-core.json','evidence/dashboard-vjs-other.json'];
const auditFiles=['evidence/dashboard-local-core.json','evidence/dashboard-local-chem-earth.json','evidence/dashboard-local-other.json'];
const baselineBytes=await readFile(path.join(root,'data-scopus.json'));
assert.equal(sha(baselineBytes),baselineHash,'Original official Scopus snapshot changed. Do not overwrite this historical baseline.');
const scopus=JSON.parse(baselineBytes);
assert.equal(scopus.records.length,84,'Baseline must retain all 84 observations.');
assert.equal(new Set(scopus.records.map(r=>r.journal+'|'+r.year+'|'+r.type)).size,84,'Duplicate official observations.');
const officialAnnualCodes=new Set(scopus.records.filter(r=>r.type==='annual'&&Number.isFinite(r.value)).map(r=>r.journal));
const evidence=await Promise.all(profileFiles.map(f=>readJson(path.join(root,f))));
const audits=await Promise.all(auditFiles.map(f=>readJson(path.join(root,f))));
const [histIntl,histOjs,media,jcrData,scopusCatData,originData,hdgsnnData,scopusCitedByData,localExtracted]=await Promise.all([
 readJson(path.join(root,'evidence/dashboard-history-intl.json')),
 readJson(path.join(root,'evidence/dashboard-history-ojs.json')),
 readJson(path.join(root,'evidence/dashboard-media.json')),
 readJson(path.join(root,'evidence/dashboard-jcr.json')),
 readJson(path.join(root,'evidence/scopus-categories.json')),
 readJson(path.join(root,'evidence/dashboard-journal-origins.json')),
 readJson(path.join(root,'evidence/dashboard-hdgsnn-2025.json')),
 readJson(path.join(root,'evidence/scopus-cited-by.json')),
 readJson(path.join(root,'evidence/dashboard-local-extracted.json'))
]);
for(const logo of Object.values(media.logos)){
 if(!logo.darkVariant)continue;
 assert.equal(logo.darkVariant.sourceSha256,logo.sha256,'Dark artwork must reference its original logo.');
 assert.equal(sha(await readFile(contained(root,logo.darkVariant.path,'assets/images/logos/'))),logo.darkVariant.sha256,'Dark logo asset differs from its manifest.');
}
for(const cover of Object.values(media.covers)){
 assert(cover.webpVariant,cover.path+': missing webpVariant in media manifest.');
 assert.equal(cover.webpVariant.sourceSha256,cover.sha256,'WebP derivative must reference its original PNG cover.');
 const rawWebp=await readFile(contained(root,cover.webpVariant.path,'assets/images/covers/webp/'));
 assert.equal(rawWebp.length,cover.webpVariant.bytes,'WebP byte count differs from manifest.');
 assert.equal(sha(rawWebp),cover.webpVariant.sha256,'WebP asset differs from its manifest.');
}
assert.equal(localExtracted.schemaVersion,1,'dashboard-local-extracted.json schemaVersion must be 1.');
assert(localExtracted.sourceFileHashes&&typeof localExtracted.sourceFileHashes==='object','Missing sourceFileHashes map in extracted local data.');
assert(Array.isArray(localExtracted.journals)&&localExtracted.journals.length===9,'Need exactly 9 extracted local journal records.');
const localExtractedMap=new Map(localExtracted.journals.map(j=>[j.id,j]));
const collectedAt=evidence[0].collectedAt,currentYear=Number(collectedAt.slice(0,4)),outputYears=Array.from({length:currentYear-2019},(_,i)=>2020+i);
assert(evidence.every(e=>e.collectedAt===collectedAt),'Profile evidence dates must agree.');
const profiles=evidence.flatMap(e=>e.journals),localAudits=audits.flatMap(a=>a.journals);
for(const a of localAudits){
 const ex=localExtractedMap.get(a.id);
 assert(ex,a.code+': missing extracted local record.');
 assert.equal(ex.code,a.code,a.code+': code mismatch in extracted local data.');
 assert.equal(ex.processedAt,a.processedAt,a.code+': processedAt mismatch in extracted local data.');
 assert.equal(ex.publicSourceUrl,a.publicSourceUrl,a.code+': publicSourceUrl mismatch in extracted local data.');
 for(const input of a.sourceFiles){
  assert.equal(localExtracted.sourceFileHashes[input.path],input.sha256,a.code+': recorded hash differs for '+input.path);
 }
}
let hasWorkspace=true;
try{
 for(const a of localAudits){
  for(const input of a.sourceFiles){
   await access(contained(workspace,input.path,'2026/09'));
  }
 }
}catch{
 hasWorkspace=false;
}
const historyMap=new Map([...histIntl.journals,...histOjs.journals].map(j=>[j.id,j]));
const jcrMap=new Map((jcrData.journals||[]).map(j=>[j.id,j]));
const scopusCatMap=new Map((scopusCatData.journals||[]).map(j=>[j.id,j.categories]));
const scopusCitedByMap=new Map((scopusCitedByData.journals||[]).map(j=>[j.id,j]));
const originMap=new Map(originData.journals.map(j=>[j.id,j]));
const originSourceIds=new Set(originData.sources.map(s=>s.id));
const hdgsnnMap=new Map((hdgsnnData.journals||[]).map(j=>[j.id,j]));
assert.deepEqual([...hdgsnnMap.keys()].sort(),[...order].sort(),'Need 2025 HĐGSNN scoring for all 12 journals.');
assert.equal(hdgsnnData.councils?.length,17,'Need exact 17 HĐGSNN 2025 councils.');
for(const journal of hdgsnnData.journals){
 assert.equal(journal.councilsCount,journal.scores.length,journal.code+': council count differs from sourced records.');
 for(const score of journal.scores){
  const council=hdgsnnData.councils.find(c=>c.officialNumber===score.councilNumber);
  assert(council&&score.sourceUrl===council.sourceUrl&&score.officialUrl===council.officialUrl,journal.code+': score must cite its council document.');
  assert(Number.isInteger(score.sourcePage)&&score.sourcePage>0&&Number.isInteger(score.sourceRow)&&score.sourceRow>0&&score.sourceQuote?.trim(),journal.code+': score needs a document page, row and quotation.');
 }
}
assert.deepEqual([...originMap.keys()].sort(),[...order].sort(),'Need sourced histories for all 12 journals.');
assert.deepEqual([...jcrMap.keys()].sort(),['amv','ansn','vjc','vjes','vjm'],'Need exact 5 JCR 2025 journal entries.');
assert.deepEqual([...scopusCatMap.keys()].sort(),['amv','ansn','cip','vjc','vjes','vjm','vjst'],'Need exact 7 VAST-1 Scopus category entries.');
for(const journal of scopusCatData.journals){
 assert(officialAnnualCodes.has(journal.code)||journal.categories.length===0,journal.code+': Scopus category rankings require a published official annual CiteScore; Tracker alone is insufficient.');
}
assert.equal(scopusCitedByData.schemaVersion,1,'scopus-cited-by.json schemaVersion must be 1.');
assert.equal(scopusCitedByData.metric,'distinct-citing-documents-by-publication-year','Unexpected scopus-cited-by metric.');
assert(/^\d{4}-\d{2}-\d{2}$/.test(scopusCitedByData.collectedAt)&&Number.isFinite(Date.parse(scopusCitedByData.collectedAt)),'Invalid scopus-cited-by collection date.');
assert.deepEqual([...scopusCitedByMap.keys()].sort(),['amv','ansn','cip','vjc','vjes','vjm','vjst'],'Need exact 7 VAST-1 Scopus cited-by entries.');
for(const cb of scopusCitedByMap.values()){
 assert(Number.isInteger(cb.sourceDocuments)&&cb.sourceDocuments>0,cb.code+': invalid sourceDocuments.');
 assert(Number.isInteger(cb.citingDocuments)&&cb.citingDocuments>=0,cb.code+': invalid citingDocuments.');
 assert(Array.isArray(cb.sourceReferencedEids)&&cb.sourceReferencedEids.length===cb.sourceDocuments,cb.code+': sourceReferencedEids count must match sourceDocuments.');
 const sumDocs=cb.citationSeries.reduce((s,r)=>s+r.citingDocuments,0);
 assert.equal(sumDocs,cb.citingDocuments,cb.code+': distinct citing docs sum mismatch with citingDocuments.');
 const years=new Set();
 for(const r of cb.citationSeries){
  assert(Number.isInteger(r.year)&&r.year>=1950&&r.year<=currentYear+1,cb.code+': invalid citation year '+r.year);
  assert(Number.isInteger(r.citingDocuments)&&r.citingDocuments>=0,cb.code+': invalid annual citingDocuments count.');
  assert(!years.has(r.year),cb.code+': duplicate year in citationSeries: '+r.year);
  years.add(r.year);
 }
 assert.equal(cb.export?.path,'evidence/scopus-cited-by/'+scopusCitedByData.collectedAt+'/'+cb.id+'-analyze-year.csv',cb.code+': original export path required.');
 const rawExport=await readFile(contained(root,cb.export.path,'evidence/scopus-cited-by/'));
 assert.equal(rawExport.length,cb.export.bytes,cb.code+': export bytes mismatch.');
 assert.equal(sha(rawExport),cb.export.sha256,cb.code+': export sha256 mismatch.');
 const exportText=rawExport.toString('utf8');
 assert(/^"YEAR",\s*$/m.test(exportText),cb.code+': export must use the YEAR dimension.');
 const exportSeries=exportText.split(/\r?\n/).flatMap(line=>{
  const row=line.match(/^"(\d{4})","([\d,]+)"\s*$/);
  return row?[{year:Number(row[1]),citingDocuments:Number(row[2].replaceAll(',',''))}]:[];
 });
 const sortYears=rows=>[...rows].sort((a,b)=>a.year-b.year);
 assert.deepEqual(sortYears(cb.citationSeries),sortYears(exportSeries),cb.code+': annual counts differ from original CSV.');
 const exportEids=[...new Set(exportText.match(/2-s2\.0-\d+/g))].sort();
 assert.equal(exportEids.length,cb.sourceDocuments,cb.code+': CSV must reference every selected source document.');
 assert.deepEqual([...cb.sourceReferencedEids].sort(),exportEids,cb.code+': referenced source EIDs differ from original CSV.');
 assert.equal(cb.sourceQuery,'SOURCE-ID ( '+cb.sourceId+' )',cb.code+': unexpected source query.');
}
for(const jr of jcrMap.values()){
 assert.equal(jr.metricYear,2025,jr.code+': JCR metricYear must be 2025.');
 assert.equal(jr.wosCollection,'ESCI',jr.code+': JCR 2025 edition must be ESCI.');
 assert(jr.jifDenominator>0&&Math.abs(jr.jif-jr.jifNumerator/jr.jifDenominator)<=0.05001,jr.code+': JIF ratio does not reconcile.');
 assert(Array.isArray(jr.categories)&&jr.categories.length>=1,jr.code+': JCR categories required.');
 assert.equal(typeof jr.source?.sha256,'string',jr.code+': JCR source sha256 required.');
}
assert.deepEqual(profiles.map(j=>j.id).sort(),[...order].sort(),'Need exactly the 12 agreed journal profiles.');
assert.equal(new Set(localAudits.map(j=>j.id)).size,9,'Need nine distinct user collections.');
const checkedPortraits=new Set();
for(const journal of originMap.values()){
 assert(journal.summary&&journal.events.length&&journal.editors.length,journal.id+': history, milestones and editors required.');
 for(const item of [...journal.events,...journal.editors.flatMap(e=>e.appointments)]){
  assert(originSourceIds.has(item.sourceId),journal.id+': unknown history source.');
  assert(Array.isArray(item.sourceParagraphs)&&item.sourceParagraphs.every(p=>Number.isInteger(p)&&p>0),journal.id+': invalid source paragraphs.');
  if(item.sourceId==='anniversary-2026')assert(item.sourceParagraphs.length,journal.id+': book claim needs a paragraph locator.');
 }
 for(const editor of journal.editors){
  assert(editor.name&&editor.appointments.length,journal.id+': editor identity and role required.');
  const portrait=editor.portrait;
  if(!portrait||checkedPortraits.has(portrait.path))continue;
  assert(portrait.path.startsWith('assets/images/editors/')&&portrait.width>0&&portrait.height>0,journal.id+': invalid portrait asset.');
  assert.equal(sha(await readFile(contained(root,portrait.path,'assets/images/editors/'))),portrait.sha256,journal.id+': portrait asset differs from its manifest.');
  checkedPortraits.add(portrait.path);
 }
}

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
 const ex=localExtractedMap.get(audit.id);
 assert(ex,audit.code+': missing extracted record.');
 let raw,cat;
 if(hasWorkspace){
  const statsSource=audit.sourceFiles.find(s=>s.path.endsWith('-stats.json'));
  const catSource=audit.sourceFiles.find(s=>s.path.endsWith('_ojs_catalog.json'));
  assert(statsSource&&catSource,audit.code+': missing stats or catalog input.');
  for(const input of audit.sourceFiles){
   assert.equal(sha(await readFile(contained(workspace,input.path,'2026/09'))),input.sha256,audit.code+': source changed after audit: '+input.path);
  }
  raw=await readJson(contained(workspace,statsSource.path,'2026/09'));
  cat=await readJson(contained(workspace,catSource.path,'2026/09'));
  assert.deepEqual(raw.meta,ex.meta,audit.code+': live meta differs from extracted.');
  assert.deepEqual(raw.citingSeries,ex.citingSeries,audit.code+': live citingSeries differs from extracted.');
  assert.deepEqual(raw.citeScoreSeries,ex.citeScoreSeries,audit.code+': live citeScoreSeries differs from extracted.');
  if(!isScopusIndexed){
   const livePubYear=publicationYearNumerators(raw,cat,volOffsets[audit.id],audit.code);
   assert.deepEqual(livePubYear,ex.publicationYearNumerators,audit.code+': live publication-year numerators differ from extracted.');
  }
 }else{
  for(const input of audit.sourceFiles){
   assert.equal(localExtracted.sourceFileHashes[input.path],input.sha256,audit.code+': hash differs for '+input.path);
  }
  raw={meta:ex.meta,citingSeries:ex.citingSeries,citeScoreSeries:ex.citeScoreSeries};
  cat=null;
 }
 assert.equal(raw.meta.officialScopusMetric,false,audit.code+': local data must not be labeled official.');
 assert.equal(raw.meta.updatedAt,audit.processedAt,audit.code+': wrong processing date.');
 const citationSeries=raw.citingSeries.filter(r=>r.year<=currentYear&&(r.docs>0||r.occurrences>0||r.year>=2015)).map(r=>{
  assert(Number.isInteger(r.year)&&Number.isInteger(r.docs)&&r.docs>=0&&Number.isInteger(r.occurrences)&&r.occurrences>=r.docs,audit.code+': invalid confirmed citation counts.');
  return {year:r.year,citingDocuments:r.docs,confirmedCitationEdges:r.occurrences};
 });
 let publicationYearNumeratorsSeries=[];
 if(!isScopusIndexed){
  publicationYearNumeratorsSeries=ex.publicationYearNumerators;
  assert(Array.isArray(publicationYearNumeratorsSeries)&&publicationYearNumeratorsSeries.every(r=>Number.isInteger(r.year)&&Number.isInteger(r.numerator)&&r.numerator>=0),audit.code+': missing publication-year numerators.');
 }
 assert.equal(new Set(citationSeries.map(r=>r.year)).size,citationSeries.length,audit.code+': duplicate year.');
 const totals={citingDocs:raw.meta.totalCitingDocs,citations:raw.meta.totalCitations,citedArticles:raw.meta.totalCitedArticles,hIndex:raw.meta.hIndex};
 return {local:{processedAt:audit.processedAt,publicSourceUrl:audit.publicSourceUrl,officialScopusMetric:false,totals,citationSeries,selfCalculatedSeries:[]},numerators:publicationYearNumeratorsSeries,cat};
}

// Self-calculated CiteScore counts each OJS article in its publication (volume) year, never its OJS upload year.
function publicationYearNumerators(raw,cat,offset,code){
 assert(Number.isInteger(offset),code+': missing volume-year offset.');
 const citingYears=[];
 for(const [y,n] of raw.yc)for(let i=0;i<n;i++)citingYears.push(y);
 assert.equal(citingYears.length,raw.ci.length,code+': citing-year runs do not cover every citing document.');
 const byId=new Map(cat.articles.map(a=>[String(a.id),a]));
 const pubYears=raw.vjm.id.map(id=>{const a=byId.get(String(id));assert(a,code+': cited article '+id+' missing from catalog.');return publicationYearOf(a,offset);});
 const count=(years,target)=>{
  let n=0;
  raw.ci.forEach((list,k)=>{
   const cy=citingYears[k];
   if(cy<target-3||cy>target)return;
   for(const idx of list){const y=years[idx];if(y>=target-3&&y<=target)n++;}
  });
  return n;
 };
 for(const r of raw.citeScoreSeries)assert.equal(count(raw.vjm.y,r.year),r.cs4_num,code+': cannot reproduce archived OJS-year numerator for '+r.year);
 return raw.citeScoreSeries.filter(r=>r.year<=currentYear).map(r=>({year:r.year,numerator:count(pubYears,r.year)}));
}

function publicationYearCiteScore(history,numerators){
 const papers=new Map(history.map(r=>[r.year,r.papers]));
 return numerators.map(({year,numerator})=>{
  let denominator=0;
  for(let y=year-3;y<=year;y++)denominator+=Number.isFinite(papers.get(y))?papers.get(y):0;
  return {year,value:denominator>0?Math.round(numerator/denominator*100)/100:null,numerator,denominator,window:`${year-3}-${year}`};
 });
}

function buildAnnualHistory(j,hist,cat,verifiedOutputs){
 const byYear=new Map();
 if(j.id==='vjc'&&hist.ojsArchiveSeries){
  for(const r of hist.ojsArchiveSeries)if(r.year<2018&&r.papers>0)byYear.set(r.year,{year:r.year,papers:r.papers,issues:r.issues,periodKind:'annual'});
  for(const r of hist.annualSeries)if(r.year>=2018&&r.year<2020)byYear.set(r.year,{year:r.year,papers:r.papers,issues:r.issues,periodKind:'annual'});
 }else if(['vjm','amv','ansn','vjmech'].includes(j.id)){
  for(const r of hist.annualSeries)if(r.year<2020&&r.papers>0)byYear.set(r.year,{year:r.year,papers:r.papers,issues:r.issues,periodKind:'annual'});
 }else if(cat&&volOffsets[j.id]){
  const offset=volOffsets[j.id],counts=new Map(),issueSets=new Map(),issueMap=new Map((hist?.annualSeries??[]).map(r=>[r.year,r.issues]));
  for(const a of cat.articles){
   if(a.isOnlineFirst)continue;
   const yr=publicationYearOf(a,offset);
   if(yr&&yr>=1985&&yr<2020&&(j.id!=='ajb'||yr>=2005)){
    counts.set(yr,(counts.get(yr)||0)+1);
    if(!issueSets.has(yr))issueSets.set(yr,new Set());
    issueSets.get(yr).add(String(a.issue??a.issueId??'1'));
   }
  }
  const livePre2020=[];
  for(const [yr,papers] of [...counts.entries()].sort((a,b)=>a[0]-b[0])){
   if(papers>0)livePre2020.push({year:yr,papers,issues:issueMap.get(yr)??issueSets.get(yr)?.size??null,periodKind:'annual'});
  }
  const ex=localExtractedMap.get(j.id);
  if(ex?.pre2020CatalogHistory)assert.deepEqual(livePre2020,ex.pre2020CatalogHistory,j.code+': live pre2020 catalog history differs from extracted.');
  for(const r of livePre2020)byYear.set(r.year,{year:r.year,papers:r.papers,issues:r.issues,periodKind:r.periodKind});
 }else if(!cat&&volOffsets[j.id]){
  const ex=localExtractedMap.get(j.id);
  assert(ex?.pre2020CatalogHistory,j.code+': missing pre2020CatalogHistory in extracted local data.');
  for(const r of ex.pre2020CatalogHistory)byYear.set(r.year,{year:r.year,papers:r.papers,issues:r.issues,periodKind:r.periodKind});
 }
 for(const o of verifiedOutputs)byYear.set(o.year,{year:o.year,papers:o.papers,issues:o.issues,periodKind:o.periodKind});
 const citMap=new Map((j.scopusCitedBy?.citationSeries||j.localCitation?.citationSeries||hist?.fullCitationSeries||[]).map(c=>[c.year,c]));
 return [...byYear.values()].sort((a,b)=>a.year-b.year).map(r=>{
  const cit=citMap.get(r.year);
  return {
   ...r,
   citingDocs:cit?(cit.citingDocuments??cit.docs??null):null,
   citationEdges:j.scopusCitedBy?null:(cit?(cit.confirmedCitationEdges??cit.occurrences??null):null),
   selfCalcScore:null,
   selfCalcNum:null,
   selfCalcDen:null
  };
 });
}

const top2025Check={VJM:[72,115,414],AMV:[18,338,414],ANSN:[61,164,425],VJC:[43,227,402],VJES:[77,45,201],VJST:[20,821,1030]};
const coPublishers={vjm:['Springer Nature','assets/images/logos/springer.png'],amv:['Springer Nature','assets/images/logos/springer.png'],ansn:['IOP Publishing','assets/images/logos/iop.png'],vjc:['Wiley-VCH','assets/images/logos/wiley.png']};
const archiveUrls={
 vjm:'https://link.springer.com/journal/10013/volumes-and-issues',
 amv:'https://link.springer.com/journal/40306/volumes-and-issues',
 ansn:'https://iopscience.iop.org/journal/2043-6262',
 vjc:'https://onlinelibrary.wiley.com/loi/25728288',
 vjes:'https://vjs.ac.vn/index.php/jse/issue/archive',
 vjst:'https://vjs.ac.vn/index.php/jst/issue/archive',
 cip:'https://vjs.ac.vn/index.php/cip/issue/archive',
 vjmech:'https://vjs.ac.vn/index.php/vjmech/issue/archive',
 jcc:'https://vjs.ac.vn/index.php/jcc/issue/archive',
 ajb:'https://vjs.ac.vn/index.php/vjbio/issue/archive',
 vjmst:'https://vjs.ac.vn/index.php/jmst/issue/archive',
 vjbt:'https://vjs.ac.vn/index.php/vjbt/issue/archive'
};
const journals=[];
for(let index=0;index<order.length;index++){
 const j=structuredClone(profiles.find(p=>p.id===order[index]));
 assert.equal(j.code,codes[index],'Unexpected journal code.');
 j.subject=subjects[j.id];j.checkedAt=collectedAt;j.aliases=j.id==='amv'?['AVM']:[];
 j.archiveUrl=archiveUrls[j.id]||j.profileSources.find(u=>u!==j.website)||j.website;
 if(j.id==='amv'){
  j.additionalArchives=[
   {label:'Viện Toán học — mục lục AMV từ 1976',url:'https://math.ac.vn/acta/home'},
   {label:'Viện Toán học — các số truy cập mở 1976–2012',url:'https://math.ac.vn/acta/open-access-issues'}
  ];
 }else if(j.id==='vjc'){
  j.additionalArchives=[
   {label:'Kho lưu trữ OJS VJS (các số 2014–2017)',url:'https://vjs.ac.vn/index.php/vjchem/issue/archive'}
  ];
 }
 j.profileSources=[...new Set([j.website,j.archiveUrl,...j.profileSources,...(j.additionalArchives||[]).map(a=>a.url)])];
 assert(j.profileSources.every(url=>/^https?:\/\//.test(url)),j.code+': profileSources must use http(s) URLs.');
 const original=scopus.journals.find(s=>s.code===j.code);
 j.order=index+1;
 j.group=original?'VAST-1':'VAST-2';
 j.scopusSourceId=original?.sourceId??null;
 j.jcr=jcrMap.get(j.id)?structuredClone(jcrMap.get(j.id)):null;
 j.journalHistory=structuredClone(originMap.get(j.id));
 j.hdgsnn2025=structuredClone(hdgsnnMap.get(j.id).scores);
 j.cover='assets/images/covers/'+j.id+'.png';
 j.coverImage=j.cover;
 j.coverWebp='assets/images/covers/webp/'+j.id+'.webp';
 assert(media.covers[j.id]?.path===j.cover,j.code+': missing verified cover asset.');
 assert(media.covers[j.id]?.webpVariant?.path===j.coverWebp,j.code+': missing verified webp cover asset.');
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
 for(const i of j.indexings.filter(i=>i.system==='WoS')){
  const source=new URL(i.sourceUrl);
  assert.equal(source.hostname,'mjl.clarivate.com',j.code+': WoS proof must link to Clarivate MJL.');
  assert.equal(source.pathname,'/search-results',j.code+': WoS link must open journal search results.');
  assert(source.searchParams.get('issn'),j.code+': WoS link needs a journal identifier.');
 }
 assert.deepEqual(j.outputs.map(o=>o.year),outputYears,j.code+': need 2020-2026 reporting periods.');
 for(const o of j.outputs)validateOutput(j,o);
 const scopusQuarter=p=>p>=75?'Q1':(p>=50?'Q2':(p>=25?'Q3':'Q4'));
 const scats=scopusCatMap.get(j.id);
 if(scats){
  assert(Array.isArray(scats)&&(!officialAnnualCodes.has(j.code)||scats.length>=1),j.code+': missing Scopus categories for a published official annual CiteScore.');
  for(const c of scats){
   assert.equal(c.quartile,scopusQuarter(c.percentile),j.code+' '+c.name+': Scopus quartile mismatch.');
   if(c.annual2025)assert.equal(c.annual2025.quartile,scopusQuarter(c.annual2025.percentile),j.code+' '+c.name+': 2025 Scopus quartile mismatch.');
   if(c.tracker2026)assert.equal(c.tracker2026.quartile,scopusQuarter(c.tracker2026.percentile),j.code+' '+c.name+': 2026 Scopus quartile mismatch.');
   for(const h of (c.history||[]))assert.equal(h.quartile,scopusQuarter(h.percentile),j.code+' '+c.name+' '+h.year+': historical Scopus quartile mismatch.');
  }
  const topExpected=top2025Check[j.code];
  if(topExpected){
   const r=scopus.records.find(r=>r.journal===j.code&&r.type==='annual'&&r.year===2025);
   assert(r.evidenceQuote.includes(topExpected[0]+'%')&&r.evidenceQuote.includes(topExpected[1]+'/'+topExpected[2]),j.code+': percentile not supported by baseline quote.');
   assert.equal(scats[0].percentile,topExpected[0],j.code+': top Scopus category percentile mismatch.');
   assert.equal(scats[0].rank,topExpected[1],j.code+': top Scopus category rank mismatch.');
   assert.equal(scats[0].total,topExpected[2],j.code+': top Scopus category total mismatch.');
  }
  j.scopusCategories=structuredClone(scats);
 }
 const audit=localAudits.find(a=>a.id===j.id);
 let cat=null;
 let numerators=[];
 if(audit){const res=await localCollection(audit,Boolean(original));j.localCitation=res.local;cat=res.cat;numerators=res.numerators;}
 if(scopusCitedByMap.has(j.id)){
  const scb=scopusCitedByMap.get(j.id);
  j.scopusCitedBy={
   sourceId:scb.sourceId,
   sourceUrl:scb.sourceUrl,
   sourceDocuments:scb.sourceDocuments,
   citingDocuments:scb.citingDocuments,
   analysisYearFrom:scb.analysisYearFrom,
   analysisYearTo:scb.analysisYearTo,
   collectedAt:scopusCitedByData.collectedAt,
   citationSeries:scb.citationSeries
  };
 }
 j.annualHistory=buildAnnualHistory(j,historyMap.get(j.id),cat,j.outputs);
 if(numerators.length){
  j.localCitation.selfCalculatedSeries=publicationYearCiteScore(j.annualHistory,numerators);
  const csByYear=new Map(j.localCitation.selfCalculatedSeries.map(c=>[c.year,c]));
  for(const r of j.annualHistory){
   const cs=csByYear.get(r.year);
   if(cs){r.selfCalcScore=cs.value;r.selfCalcNum=cs.numerator;r.selfCalcDen=cs.denominator;}
  }
 }
 j.historyStartYear=j.annualHistory[0]?.year??2020;
 j.historyEndYear=j.annualHistory.at(-1)?.year??2026;
 assert(j.annualHistory.length>=7,j.code+': annualHistory must include at least 2020-2026.');
 delete j.outputs;
 delete j.latestIssue;
 delete j.profileSources;
 delete j.checkedAt;
 delete j.coverImage;
 if(j.jcr){delete j.jcr.source;delete j.jcr.notes;}
 if(j.journalHistory){
  delete j.journalHistory.cautions;
  delete j.journalHistory.sourceId;
  j.journalHistory.events=j.journalHistory.events.map(ev=>({dateLabel:ev.dateLabel,year:ev.year,text:ev.text}));
  j.journalHistory.editors=j.journalHistory.editors.map(ed=>({
   name:ed.name,
   appointments:ed.appointments.map(ap=>({role:ap.role,tenure:ap.tenure})),
   portrait:ed.portrait?{path:ed.portrait.path,width:ed.portrait.width,height:ed.portrait.height}:null
  }));
 }
 if(j.hdgsnn2025){
  j.hdgsnn2025=j.hdgsnn2025.map(s=>({
   councilNumber:s.councilNumber,
   council:s.council,
   councilShort:s.councilShort,
   score:s.score,
   maxScore:s.maxScore,
   conditions:s.conditions,
   sourceUrl:s.sourceUrl
  }));
 }
 j.indexings=j.indexings.filter(i=>i.status==='listed').map(i=>({system:i.system,status:i.status,collection:i.collection??null,evidenceLevel:i.evidenceLevel??null,coverage:i.coverage??null,sourceUrl:i.sourceUrl}));
 journals.push(j);
}
const snapshotId='2026-10-24-publication-year-v1',snapshotPath='data/snapshots/'+snapshotId+'.json';
// Public payload: only fields read by assets/dashboard.js. Audit trails stay in evidence/ (excluded from Pages by _config.yml).
const trackerUpdatedAt=scopus.records.find(r=>r.type==='tracker').lastUpdated;
const dataset={
 schemaVersion:1,
 collectedAt,
 officialScopus:{reportDate:scopus.reportDate,trackerSourceUpdatedAt:trackerUpdatedAt},
 scopusCitedBy:{collectedAt:scopusCitedByData.collectedAt},
 scopus:{
  annualYears:scopus.annualYears,
  trackerYear:scopus.trackerYear,
  journals:scopus.journals.map(s=>({code:s.code})),
  records:scopus.records.map(r=>({journal:r.journal,year:r.year,type:r.type,value:r.value,citations:r.citations??null,documents:r.documents??null,window:r.window??null}))
 },
 journals
};
dataset.historySources=originData.sources.filter(s=>/^https:\/\//i.test(s.url||'')&&s.kind!=='published-photograph').map(s=>({id:s.id,kind:s.kind,title:s.title,author:s.author||null,url:s.url}));
dataset.hdgsnn={
 year:hdgsnnData.year,
 collectedAt:hdgsnnData.collectedAt,
 decision:{
  number:hdgsnnData.decision.number,
  issuedAt:hdgsnnData.decision.issuedAt,
  title:hdgsnnData.decision.title,
  pdfUrl:hdgsnnData.decision.pdfUrl,
  mirrorIndexUrl:hdgsnnData.decision.mirrorIndexUrl
 },
 councils:hdgsnnData.councils.map(c=>({officialNumber:c.officialNumber,shortName:c.shortName,name:c.name,sourceUrl:c.sourceUrl}))
};
const serialized=JSON.stringify(dataset)+'\n';
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
