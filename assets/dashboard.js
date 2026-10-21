const $=selector=>document.querySelector(selector);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const integer=new Intl.NumberFormat('vi-VN');
const decimal=new Intl.NumberFormat('vi-VN',{minimumFractionDigits:1,maximumFractionDigits:1});
const ratioFormatter=new Intl.NumberFormat('vi-VN',{minimumFractionDigits:2,maximumFractionDigits:2});
const dateFormatter=new Intl.DateTimeFormat('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'UTC'});
const date=iso=>!iso?'—':/^\d{4}-\d{2}$/.test(iso)?iso.slice(5)+'/'+iso.slice(0,4):dateFormatter.format(new Date(iso.slice(0,10)+'T00:00:00Z'));
const number=value=>Number.isFinite(value)?integer.format(value):'—';
const score=value=>Number.isFinite(value)?decimal.format(value):'—';
const ratio=value=>Number.isFinite(value)?ratioFormatter.format(value):'—';
const safeUrl=url=>/^https?:\/\//i.test(url)?url:'#';
const external=(url,text)=>`<a href="${esc(safeUrl(url))}" target="_blank" rel="noopener noreferrer">${esc(text??url)}</a>`;
const fullName=j=>j.title+' ('+j.code+')';
const reduced=matchMedia('(prefers-reduced-motion: reduce)');

const fontPresets={
 artcraft:['"Archivo",system-ui,sans-serif','"Inter","Geist",system-ui,sans-serif','"JetBrains Mono",monospace','Archivo + Inter + JetBrains Mono'],
 nature:['"Source Serif 4",Georgia,serif','"Geist",system-ui,sans-serif','"Geist",sans-serif','Source Serif 4 + Geist'],
 economist:['"Merriweather",Georgia,serif','"IBM Plex Sans",system-ui,sans-serif','"IBM Plex Sans",sans-serif','Merriweather + IBM Plex Sans'],
 ft:['"Playfair Display","Source Serif 4",Georgia,serif','"IBM Plex Sans",system-ui,sans-serif','"Source Serif 4",Georgia,serif','Playfair Display + IBM Plex'],
 scopus:['"Plus Jakarta Sans",system-ui,sans-serif','"Plus Jakarta Sans",system-ui,sans-serif','"JetBrains Mono",monospace','Plus Jakarta Sans + JetBrains Mono'],
 clarivate:['"Outfit",system-ui,sans-serif','"Plus Jakarta Sans",system-ui,sans-serif','"Outfit",sans-serif','Outfit + Plus Jakarta Sans'],
 science:['"Oswald",system-ui,sans-serif','"IBM Plex Sans",system-ui,sans-serif','"Oswald",sans-serif','Oswald In hoa + IBM Plex'],
 wiley:['"Newsreader",Georgia,serif','"Plus Jakarta Sans",system-ui,sans-serif','"Newsreader",Georgia,serif','Newsreader + Plus Jakarta Sans'],
 nytimes:['"Playfair Display",Georgia,serif','"Newsreader",Georgia,serif','"IBM Plex Sans",sans-serif','Playfair Display + Newsreader'],
 mono:['"JetBrains Mono",monospace','"JetBrains Mono",monospace','"JetBrains Mono",monospace','100% JetBrains Mono'],
 ibm:['"IBM Plex Sans",system-ui,sans-serif','"IBM Plex Sans",system-ui,sans-serif','"JetBrains Mono",monospace','IBM Plex Sans + Mono']
};
const palettes={
 artcraft:['#1858e8','#e84518','#0f8a5f','#7c3aed','#d97706','#0284c7','#be185d','#4f46e5','#15803d','#b45309','#9333ea','#334155'],
 academic:['#356b91','#737373','#26786c','#986d26','#a32638','#505a61','#1f6f8b','#8c4a27','#2e6f40','#5e4b8b','#9a3b5a','#3b5266'],
 economist:['#006ba2','#e3120b','#379a8b','#b86b11','#9a607f','#4c5966','#1f78b4','#a65628','#2b8a3e','#6a3d9a','#b10026','#334155'],
 ft:['#0f5499','#990f3d','#0d7680','#b85a00','#593380','#59524c','#008066','#8c3f00','#1e6b3b','#4b3b75','#a1284b','#3d4c53'],
 vibrant:['#0056d6','#ff6c00','#008075','#6b4c9a','#c92a2a','#3b5166','#007398','#a64d00','#2b7258','#4c3c8c','#b8255f','#22384d'],
 royal:['#5e33bf','#0077c8','#008a63','#c7511f','#a62669','#4a4e69','#2563eb','#9a3412','#15803d','#6d28d9','#be185d','#334155'],
 scarlet:['#c5001a','#1d4ed8','#047857','#b45309','#6d28d9','#374151','#0369a1','#9a3412','#166534','#5b21b6','#9f1239','#1f2937'],
 emerald:['#00594f','#123d6b','#b85400','#7a287c','#9e2a2b','#49615e','#1f6f8b','#8c4a27','#2e6f40','#5e4b8b','#9a3b5a','#2b4440'],
 neon:['#00b8ff','#ff8000','#2ee59d','#ff4d6d','#b388ff','#ffd166','#4cc9f0','#f77f00','#52b788','#c77dff','#ff758f','#90e0ef']
};
const layoutNames={
 'artcraft-grid':'Lưới Kiến trúc ArtCraft',
 'journal':'Tạp chí Khoa học 2 cột',
 'split-hero':'Hero Chia đôi & Đảo Cột',
 'broadsheet':'Nhật báo Chính tâm',
 'bento-2x2':'Lưới Bento 2×2 Biểu đồ',
 'portal-full':'Banner Gradient & Lưới 2 Cột',
 'magazine-alt':'Brutalist Đổ bóng & Đan xen',
 'portal-boxed':'Cổng Học thuật & Bảng Sọc',
 'soft-cards':'Thẻ Bo tròn & Hàng Nổi',
 'tufte-print':'Báo in Đa cột Tufte',
 'terminal-matrix':'Ma trận Terminal <GO>'
};
const chartStyleNames={
 'line':'Đường chuẩn (Polyline)',
 'smooth':'Đường cong mượt (Cubic Curve)',
 'smooth-area':'Đường cong + Vùng phủ màu (Area)',
 'step':'Đường bậc thang (Step-Line)',
 'column':'Biểu đồ Cột nhóm (Grouped Columns)',
 'lollipop':'Biểu đồ Kẹo mút (Lollipop Pins)',
 'dot-band':'Dải điểm + Nhãn trực tiếp (Dot-Band)'
};
const groupTitles=[
 'Nhóm I (1–10) · ArtCraft & Xuất bản Khoa học Quốc tế',
 'Nhóm II (11–20) · Đại học Tinh hoa & Viện Nghiên cứu',
 'Nhóm III (21–30) · Báo chí Dữ liệu & Tài chính Toàn cầu',
 'Nhóm IV (31–40) · Tổ chức Dữ liệu Thế giới & Tư vấn',
 'Nhóm V (41–50) · Nền tảng Công nghệ & BI Hiện đại'
];

const rawThemes=[
 // Group 0 (1-10): ArtCraft (Default #1) + Scientific Publishers & Indexers
 ['artcraft','ArtCraft Studio (Mặc định)',0,'artcraft-grid','smooth-area','full-matrix','dual-bar','artcraft','artcraft','#f2f1ee','#faf9f6','#101014','#5c5b57','#d8d5cc','#1858e8','#101014',2,false],
 ['nature','Nature Portfolio',0,'journal','line','minimal','dual-bar','nature','academic','#ffffff','#f4f5f5','#20252a','#606b70','#dde2e3','#a31d32','#142538',3,false],
 ['science','Science (AAAS)',0,'magazine-alt','column','full-matrix','compact-table','science','scarlet','#ffffff','#f3f4f6','#111827','#4b5563','#111827','#c5001a','#111827',0,false],
 ['cell','Cell Press',0,'soft-cards','smooth-area','banded','kpi-tile','clarivate','vibrant','#f7fafc','#ffffff','#0f2942','#4a6580','#cfe0ee','#0072bc','#0a3254',10,false],
 ['lancet','The Lancet',0,'broadsheet','dot-band','banded','compact-table','ft','royal','#fcfaf7','#f2ece4','#1a1a2e','#5a5a72','#d8cfc4','#00468b','#002b55',2,false],
 ['scopus','Elsevier Scopus',0,'bento-2x2','smooth-area','framed','dual-bar','scopus','vibrant','#eef3f8','#ffffff','#0f2537','#516475','#d2deeb','#ff6c00','#003870',8,false],
 ['clarivate','Clarivate WoS',0,'portal-full','smooth','banded','kpi-tile','clarivate','royal','#f7f5fc','#ece8f8','#1b1534','#5c5675','#dcd5f0','#5e33bf','#211048',10,false],
 ['springer','SpringerLink',0,'portal-boxed','line','full-matrix','dual-bar','economist','academic','#f4f7fa','#e8f0f6','#0f293a','#4e6575','#c9d8e4','#025e8d','#01324b',3,false],
 ['wiley','Wiley Online Library',0,'soft-cards','smooth','banded','kpi-tile','wiley','emerald','#eff7f5','#ffffff','#142826','#526966','#c4ddd7','#00594f','#003831',12,false],
 ['oxford','Oxford Academic (OUP)',0,'broadsheet','step','minimal','lollipop-bar','ft','academic','#f9fafb','#eef1f5','#002147','#4a5d75','#cfd8e3','#002147','#00152e',2,false],

 // Group 1 (11-20): Universities & Learned Societies
 ['ieee','IEEE Xplore',1,'portal-boxed','step','full-matrix','segmented-meter','ibm','vibrant','#f3f6f9','#e5eef5','#0a2239','#49637a','#c4d6e5','#00629b','#002855',3,false],
 ['acm','ACM Digital Library',1,'bento-2x2','column','framed','kpi-tile','scopus','vibrant','#f4f6f8','#ffffff','#182430','#526578','#cfdbe6','#0085ca','#0b2545',6,false],
 ['acs','ACS Publications',1,'portal-boxed','smooth-area','banded','dual-bar','economist','royal','#f7f8fa','#eaeef5','#14213d','#4f5d75','#cdd6e5','#003366','#001d3d',4,false],
 ['iop','IOPscience (Physics)',1,'split-hero','lollipop','full-matrix','lollipop-bar','ibm','scarlet','#f8f9fa','#eceff2','#1b262c','#52616b','#cfd6dc','#d9232a','#1b262c',2,false],
 ['aps','APS Physical Review',1,'tufte-print','step','full-matrix','compact-table','nytimes','academic','#fcfcfa','#f1f1ec','#16191b','#586066','#d2d5d9','#1e56a0','#0d2c54',0,false],
 ['cambridge','Cambridge Core',1,'broadsheet','smooth','minimal','compact-table','ft','emerald','#fbf9f6','#f0ebe3','#1d262d','#5c666f','#d8d0c5','#a31f34','#1d262d',2,false],
 ['mit','MIT Press (Swiss Grid)',1,'magazine-alt','step','full-matrix','segmented-meter','science','scarlet','#f5f5f3','#e8e8e3','#111111','#4d4d4d','#111111','#a31f34','#111111',0,false],
 ['harvard','Harvard Business Review',1,'split-hero','dot-band','banded','compact-table','nytimes','scarlet','#fbfaf8','#f0ede8','#191919','#595959','#d6d1c9','#a51c30','#191919',2,false],
 ['stanford','Stanford HAI',1,'soft-cards','lollipop','banded','kpi-tile','wiley','scarlet','#f9f7f6','#ffffff','#2e2d29','#5f574f','#dcd6d0','#8c1515','#2e2d29',8,false],
 ['cern','CERN Open Data',1,'terminal-matrix','step','full-matrix','segmented-meter','mono','neon','#0a111a','#111d2b','#e2ecf5','#849ab2','#223852','#0095ff','#05090e',2,true],

 // Group 2 (21-30): Data Journalism & Financial Press
 ['economist','The Economist',2,'split-hero','smooth','banded','dual-bar','economist','economist','#f9f8f5','#efede7','#121212','#595959','#d7d4cc','#e3120b','#121212',2,false],
 ['ft','Financial Times',2,'broadsheet','lollipop','banded','lollipop-bar','ft','ft','#fff1e5','#f2dfce','#33302e','#66605c','#e0cbb9','#990f3d','#33302e',2,false],
 ['nytimes','NYT The Upshot',2,'tufte-print','line','minimal','lollipop-bar','nytimes','academic','#fdfdfc','#f4f4ef','#121212','#555555','#d0d0c8','#326891','#121212',0,false],
 ['bloomberg','Bloomberg Terminal',2,'terminal-matrix','step','full-matrix','segmented-meter','mono','neon','#090d12','#121924','#e6edf5','#8fa3ba','#263447','#ff8000','#05080c',2,true],
 ['wsj','Wall Street Journal',2,'broadsheet','line','minimal','compact-table','ft','academic','#fbfaf7','#efeae1','#111111','#555555','#d4cdc3','#005483','#111111',0,false],
 ['reuters','Reuters Graphics',2,'magazine-alt','lollipop','full-matrix','dual-bar','ibm','vibrant','#f7f8f9','#eceff1','#1c252c','#546570','#cfd8dc','#ff6600','#1c252c',3,false],
 ['guardian','The Guardian Datablog',2,'magazine-alt','column','banded','dual-bar','economist','economist','#f6f6f6','#eaeaea','#052962','#505f79','#052962','#c70000','#052962',0,false],
 ['wapo','Washington Post Data',2,'broadsheet','smooth-area','minimal','lollipop-bar','nytimes','royal','#faf9f6','#efede8','#1a1a1a','#595959','#d8d5ce','#1955a5','#1a1a1a',2,false],
 ['fivethirtyeight','FiveThirtyEight',2,'magazine-alt','column','full-matrix','lollipop-bar','mono','scarlet','#f0f0f0','#e2e2e2','#222222','#595959','#222222','#ed713a','#222222',0,false],
 ['quartz','Quartz (Atlas Charts)',2,'split-hero','lollipop','minimal','lollipop-bar','clarivate','royal','#f9f8fb','#eeecf4','#1f1b24','#625b6e','#d9d4e3','#7c3aed','#1f1b24',6,false],

 // Group 3 (31-40): Global Data Orgs & Strategy Firms
 ['owid','Our World in Data',3,'split-hero','smooth','banded','lollipop-bar','economist','economist','#f8f9fa','#eef1f4','#002147','#4f6278','#d0d9e2','#be2623','#002147',3,false],
 ['worldbank','World Bank Data',3,'portal-full','smooth-area','banded','kpi-tile','scopus','vibrant','#f4f8fb','#e7f0f7','#002244','#4a6580','#c9dce9','#009fda','#002244',8,false],
 ['oecd','OECD Data Portal',3,'portal-full','column','banded','dual-bar','scopus','emerald','#f5f8f7','#e6efec','#0d2b3e','#4d6879','#c8dcd6','#0b7189','#0d2b3e',6,false],
 ['imf','IMF DataMapper',3,'portal-boxed','step','full-matrix','compact-table','economist','academic','#f6f8fa','#e9eef4','#00274c','#4d647d','#cbd6e2','#004c97','#00274c',3,false],
 ['who','WHO Health Data',3,'portal-boxed','dot-band','banded','dual-bar','scopus','vibrant','#f4f9fc','#e5f2f9','#003359','#496a82','#c4dfee','#008dc9','#003359',6,false],
 ['nasa','NASA Earthdata',3,'terminal-matrix','smooth-area','full-matrix','segmented-meter','mono','neon','#080c14','#101826','#e8f0f8','#889eb5','#20324c','#fc3d21','#05080e',3,true],
 ['mckinsey','McKinsey Global Inst.',3,'tufte-print','smooth','minimal','kpi-tile','nytimes','royal','#fafbfd','#eef2f8','#051c2c','#4c6070','#cdd8e4','#0070d2','#051c2c',2,false],
 ['bcg','BCG Henderson Inst.',3,'split-hero','dot-band','banded','kpi-tile','clarivate','emerald','#f4f9f6','#e5f2ea','#0f2e22','#48695b','#c3dfd1','#008450','#0f2e22',6,false],
 ['deloitte','Deloitte Insights',3,'terminal-matrix','column','full-matrix','segmented-meter','ibm','neon','#0c1014','#151c24','#e6edf2','#8a9ba8','#283645','#86bc25','#06080a',2,true],
 ['gartner','Gartner Quadrant',3,'portal-full','lollipop','framed','kpi-tile','clarivate','royal','#f5f7fb','#e8ecf5','#002856','#4b607a','#ccd6e6','#004ea8','#002856',8,false],

 // Group 4 (41-50): Tech & Modern BI Systems
 ['apple','Apple HIG (Cupertino)',4,'bento-2x2','smooth-area','minimal','kpi-tile','scopus','vibrant','#f5f5f7','#ffffff','#1d1d1f','#6e6e73','#d2d2d7','#0066cc','#1d1d1f',14,false],
 ['stripe','Stripe Press & BI',4,'bento-2x2','smooth-area','framed','kpi-tile','clarivate','royal','#f6f9fc','#ffffff','#0a2540','#425466','#d6e0ea','#635bff','#0a2540',10,false],
 ['linear','Linear App (Dark)',4,'terminal-matrix','smooth-area','full-matrix','segmented-meter','clarivate','neon','#0b0c10','#14161f','#eef0f6','#8a90a6','#25293a','#5e6ad2','#07080b',6,true],
 ['vercel','Vercel Geist (Dark)',4,'terminal-matrix','step','full-matrix','segmented-meter','mono','neon','#0a0a0a','#141414','#ededed','#888888','#292929','#0070f3','#000000',4,true],
 ['github','GitHub Primer',4,'tufte-print','step','framed','compact-table','ibm','academic','#f6f8fa','#ffffff','#1f2328','#59636e','#d1d9e0','#0969da','#1f2328',6,false],
 ['observable','Observable HQ (D3)',4,'tufte-print','smooth-area','full-matrix','lollipop-bar','ibm','economist','#fcfcfd','#f2f4f8','#1b1e23','#5a6270','#d4dae2','#3b5fc0','#1b1e23',4,false],
 ['tableau','Tableau Public BI',4,'bento-2x2','column','framed','dual-bar','scopus','economist','#f2f4f7','#ffffff','#1e293b','#526071','#cbd5e1','#1f77b4','#1e293b',6,false],
 ['powerbi','Microsoft Power BI',4,'bento-2x2','column','banded','kpi-tile','scopus','vibrant','#f3f2f1','#ffffff','#201f1e','#605e5c','#d8d6d4','#c87d00','#201f1e',6,false],
 ['grafana','Grafana Telemetry',4,'terminal-matrix','smooth-area','full-matrix','segmented-meter','mono','neon','#0b0f17','#141b26','#e5ecf4','#8b9bb0','#243044','#f46800','#070a10',3,true],
 ['notion','Notion Workspace',4,'soft-cards','dot-band','minimal','compact-table','wiley','academic','#fbfbfa','#ffffff','#2f3437','#6b7075','#e3e2de','#2383e2','#2f3437',8,false]
];

const brandThemes=rawThemes.map(([id,label,group,layout,chartStyle,gridStyle,barStyle,fontKey,palKey,paper,surface,ink,muted,line,accent,banner,radius,dark],idx)=>{
 const num=idx+1,[serif,sans,numFont,fontLabel]=fontPresets[fontKey],pal=palettes[palKey];
 return {
  id,num,group,name:`${num}. ${label}`,short:label,layout,chartStyle,gridStyle,barStyle,
  layoutTag:`${layoutNames[layout]} · ${chartStyleNames[chartStyle].split(' (')[0]}`,
  kicker:`00 / HỆ THỐNG TẠP CHÍ KHOA HỌC VAST · ${label.toUpperCase()}`,
  spec:`Font: ${fontLabel} · Bố cục: ${layoutNames[layout]} · Biểu đồ: ${chartStyleNames[chartStyle]}`,
  desc:`${label} — ${layoutNames[layout]} · ${chartStyleNames[chartStyle]}`,
  serif,sans,numFont,paper,surface,ink,muted,line,accent,banner,radius:`${radius}px`,dark,pal
 };
});

const metricInfo={citescore:{label:'CiteScore & Tracker (Nhóm VAST-1)',short:'CiteScore',scopus:true,decimals:1},citations:{label:'Trích dẫn trong cửa sổ CiteScore',short:'Trích dẫn',scopus:true},documents:{label:'Tài liệu trong cửa sổ CiteScore',short:'Tài liệu',scopus:true},papers:{label:'Bài đã xuất bản',short:'Bài xuất bản'},issues:{label:'Kỳ đã xuất bản',short:'Kỳ xuất bản'},localDocs:{label:'Tài liệu trích dẫn theo năm',short:'Tài liệu trích dẫn',local:true},localEdges:{label:'Lượt trích dẫn theo năm',short:'Lượt trích dẫn',local:true},localScore:{label:'CiteScore dự kiến 4 năm (Nhóm VAST-2)',short:'CiteScore dự kiến',local:true,decimals:2}};
const metricValue=value=>state.metric==='localScore'?ratio(value):metricInfo[state.metric].decimals?score(value):number(value);
let dashboard,scopus,journals,recordIndex,state,chartWidth=1000,subChartWidth=680,plot,selectedYear=null,pinned=false,currentTheme='artcraft',activeThemeGroup='active';
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
const activeThemeObj=()=>brandThemes.find(t=>t.id===currentTheme)??brandThemes[0];

async function fetchJson(url){const response=await fetch(url,{cache:'no-cache'});if(!response.ok)throw new Error('Không tải được '+url+' ('+response.status+')');return response.json();}
function output(j,year){return j.outputs.find(o=>o.year===Number(year));}
function scopusRecord(j,year){return recordIndex.get(j.code+'|'+year+'|'+(year===scopus.trackerYear?'tracker':'annual'));}
function verifiedScopus(j){return j.indexings.some(i=>i.system==='Scopus'&&i.status==='listed'&&i.evidenceLevel==='database');}
function observation(j,metric,year){
 if(metric==='localScore'){
  if(verifiedScopus(j))return {value:null,reason:'Tạp chí thuộc nhóm VAST-1; dùng CiteScore Scopus.',updated:null,kind:'annual',verified:false,extra:null};
  const local=j.localCitation,r=local?.selfCalculatedSeries.find(v=>v.year===year);
  return {value:r?.value??null,reason:'Chưa có số liệu cho kỳ này.',updated:null,kind:year===Number(dashboard.collectedAt.slice(0,4))?'ytd':'annual',verified:Boolean(r),extra:r};
 }
 if(metricInfo[metric].local){const local=j.localCitation,r=local?.citationSeries.find(v=>v.year===year);const value=metric==='localDocs'?r?.citingDocuments:r?.confirmedCitationEdges;return {value:value??null,reason:'Chưa có số liệu cho năm này.',updated:null,kind:year===Number(dashboard.collectedAt.slice(0,4))?'ytd':'annual',verified:Boolean(r),extra:r};}
 if(!metricInfo[metric].scopus){const o=output(j,year),value=metric==='papers'&&o?.coverage!=='complete'?null:o?.[metric];return {value:value??null,reason:'Chưa có số liệu cho năm này.',updated:o?.asOf??null,kind:o?.periodKind??'annual',verified:metric==='issues'?Number.isFinite(o?.issues):o?.coverage==='complete',extra:o};}
 const r=scopusRecord(j,year);
 const value=metric==='citescore'?r?.value:r?.[metric];
 return {value:Number.isFinite(value)?value:null,reason:r?.status==='scopus_na'?'Scopus hiển thị N/A.':'Chưa có số liệu cho năm này.',updated:r?.lastUpdated??r?.accessed??null,kind:r?.type??'annual',verified:r?.status==='verified_scopus',extra:r};
}
function annualRecord(j){return recordIndex.get(j.code+'|'+scopus.annualYears.at(-1)+'|annual');}
function indexingName(i){return i.system==='WoS'?'WoS '+(i.collection??''):i.system;}
function indexingBadges(j){
 const groupTag=`<span class="badge ${j.group==='VAST-1'?'verified':''}"><strong>${esc(j.group)}</strong></span>`;
 const entries=j.indexings.filter(i=>i.status==='listed');
 return '<div class="badge-list">'+groupTag+entries.map(i=>`<span class="badge ${i.evidenceLevel==='database'?'verified':''}">${esc(indexingName(i))}${i.evidenceLevel==='database'?'':'*'}</span>`).join('')+'</div>';
}
function institutionBadgeHtml(j,compact=false){
 const inst=j.institution;
 const coImg=inst.coLogo?`<img class="mini-inst-logo" src="${esc(inst.coLogo)}" alt="${esc(inst.coPublisher)}">`:'';
 if(compact)return `<div class="matrix-pub-row"><img class="mini-inst-logo" src="${esc(inst.logo)}" alt="${esc(inst.name)}">${coImg}<span>${esc(inst.name)}${inst.coPublisher?' · '+esc(inst.coPublisher):''}</span></div>`;
 return `<div class="lineup-inst-badge"><div class="lineup-inst-logos"><img src="${esc(inst.logo)}" alt="${esc(inst.name)}">${coImg}</div><span class="lineup-inst-name">${esc(inst.name)}${inst.coPublisher?' & '+esc(inst.coPublisher):''}</span></div>`;
}

function applyTheme(themeId,persist=true){
 const found=brandThemes.find(t=>t.id===themeId)??brandThemes[0];
 currentTheme=found.id;
 const root=document.documentElement;
 root.dataset.theme=found.id;
 root.dataset.layout=found.layout;
 root.dataset.dark=String(found.dark);
 const vars={'--paper':found.paper,'--surface':found.surface,'--ink':found.ink,'--muted':found.muted,'--line':found.line,'--accent':found.accent,'--banner-bg':found.banner,'--serif':found.serif,'--sans':found.sans,'--num-font':found.numFont,'--radius':found.radius,'--positive':found.dark?'#2ee59d':'#0f7b4c','--negative':found.dark?'#ff5c5c':'#d92d20'};
 found.pal.forEach((c,i)=>{vars['--c'+(i+1)]=c;});
 for(const [k,v] of Object.entries(vars))root.style.setProperty(k,v);
 document.querySelector('meta[name="theme-color"]')?.setAttribute('content',found.paper);
 if($('#theme-select'))$('#theme-select').value=currentTheme;
 if($('#theme-active-desc'))$('#theme-active-desc').textContent=found.desc;
 if($('#brand-kicker'))$('#brand-kicker').textContent=found.kicker;
 renderThemePills();
 if(dashboard){
  requestAnimationFrame(()=>{
   const w1=Math.round($('.chart-area')?.getBoundingClientRect().width||0);
   const w2=Math.round($('#candidates-chart-area')?.getBoundingClientRect().width||0);
   if(w1>0)chartWidth=w1;
   if(w2>0)subChartWidth=w2;
   if(!$('#home-view').hidden)renderAllCharts();
   if(!$('#detail-panel').hidden&&location.hash.startsWith('#journal/'))renderDetail(decodeURIComponent(location.hash.slice(9)));
  });
 }
 if(persist){
  try{localStorage.setItem('vast-dashboard-theme',currentTheme);}catch{}
  if(state)saveState();
 }
}
function renderThemeSelect(){
 $('#theme-select').innerHTML=groupTitles.map((title,g)=>`<optgroup label="${esc(title)}">${brandThemes.filter(t=>t.group===g).map(t=>`<option value="${t.id}">${esc(t.name)} (${esc(layoutNames[t.layout])})</option>`).join('')}</optgroup>`).join('');
}
function renderThemePills(){
 if(!$('#theme-pills'))return;
 const current=activeThemeObj();
 const list=activeThemeGroup==='all'?brandThemes:activeThemeGroup==='active'?brandThemes.filter(t=>t.group===current.group):brandThemes.filter(t=>t.group===Number(activeThemeGroup));
 for(const btn of document.querySelectorAll('.theme-group-btn'))btn.setAttribute('aria-selected',String(btn.dataset.group===activeThemeGroup));
 $('#theme-pills').innerHTML=list.map(t=>`<button type="button" class="theme-pill" data-theme="${t.id}" aria-pressed="${t.id===currentTheme}" title="${esc(t.spec)}"><span class="theme-swatch" style="background:linear-gradient(135deg,${t.accent} 55%,${t.paper} 55%)"></span><span class="theme-pill-text"><strong class="theme-pill-name">${esc(t.name)}</strong><small class="theme-pill-sub">${esc(t.layoutTag)}</small></span></button>`).join('');
}

function readState(){
 const p=new URLSearchParams(location.search),years=dashboard.outputYears;
 let savedTheme='artcraft';try{savedTheme=localStorage.getItem('vast-dashboard-theme')||'artcraft';}catch{}
 const requestedTheme=p.get('theme')||savedTheme;
 applyTheme(requestedTheme,false);
 const ids=p.has('series')?p.get('series').split(',').filter(id=>journals.some(j=>j.id===id)):defaultSeries;
 state={q:p.get('q')??'',year:years.includes(Number(p.get('year')))?Number(p.get('year')):dashboard.defaultOutputYear,subject:p.get('subject')??'all',index:p.get('index')??'all',sort:p.get('sort')??'default',metric:Object.hasOwn(metricInfo,p.get('metric'))?p.get('metric'):'citescore',from:Number(p.get('from')),to:Number(p.get('to')),series:new Set(ids)};
 const available=availableYears();
 if(!available.includes(state.from))state.from=available[0];
 if(!available.includes(state.to)||state.to<state.from)state.to=available.at(-1);
 if(!journals.some(j=>j.subject===state.subject))state.subject='all';
 if(!['all','VAST-1','VAST-2','Scopus','WoS','ACI','DOAJ'].includes(state.index))state.index='all';
 if(!['default','name','papers','citescore'].includes(state.sort))state.sort='default';
}
function saveState(){
 const url=new URL(location.href),p=url.searchParams;
 const set=(key,value,defaultValue)=>{if(value===defaultValue)p.delete(key);else p.set(key,value);};
 set('theme',currentTheme,'artcraft');set('q',state.q,'');set('year',String(state.year),String(dashboard.defaultOutputYear));set('subject',state.subject,'all');set('index',state.index,'all');set('sort',state.sort,'default');set('metric',state.metric,'citescore');
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
 const list=journals.filter(j=>!q||folded([j.title,j.code,j.titleVi,j.group,j.issn,j.eissn,j.institution.name,...(j.aliases??[]),...(j.formerTitles??[]).map(t=>t.title)].join(' ')).includes(q)).filter(j=>state.subject==='all'||j.subject===state.subject).filter(j=>state.index==='all'||(state.index==='VAST-1'?j.group==='VAST-1':state.index==='VAST-2'?j.group==='VAST-2':state.index==='Scopus'?verifiedScopus(j):j.indexings.some(i=>i.system===state.index&&i.status==='listed')));
 if(state.sort==='name')list.sort((a,b)=>a.title.localeCompare(b.title,'en'));
 if(state.sort==='papers'){const value=j=>{const o=output(j,state.year);return o?.coverage==='complete'?o.papers:-1;};list.sort((a,b)=>value(b)-value(a));}
 if(state.sort==='citescore')list.sort((a,b)=>(annualRecord(b)?.value??-1)-(annualRecord(a)?.value??-1));
 return list;
}

function renderOverview(){
 const outputs=journals.map(j=>output(j,state.year));
 const papers=outputs.filter(o=>o&&Number.isFinite(o.papers)),issues=outputs.filter(o=>o&&Number.isFinite(o.issues));
 const totalPapers=papers.reduce((sum,o)=>sum+o.papers,0),totalIssues=issues.reduce((sum,o)=>sum+o.issues,0);
 const period=state.year===Number(dashboard.collectedAt.slice(0,4))?'Đến '+date(dashboard.collectedAt):'Năm '+state.year;
 const totalConfirmedCitations=journals.reduce((sum,j)=>sum+(j.localCitation?.totals?.citations??0),0);
 const cells=[['Tạp chí khoa học',journals.length,'7 VAST-1 · 5 VAST-2'],['Bài xuất bản '+state.year,number(totalPapers),period],['Kỳ xuất bản '+state.year,number(totalIssues),'12 tạp chí'],['Tổng lượt trích dẫn',number(totalConfirmedCitations),'Thống kê Scopus']];
 $('#summary-strip').innerHTML=cells.map(([label,value,detail])=>`<div class="summary-item"><span class="summary-label">${esc(label)}</span><strong class="summary-value">${esc(value)}</strong><span class="summary-detail">${esc(detail)}</span></div>`).join('');
 $('#hero-cover-grid').innerHTML=journals.map(j=>`<a class="hero-cover-item" href="#journal/${encodeURIComponent(j.id)}" role="listitem" title="${esc(fullName(j)+' — '+j.institution.name)}"><div class="hero-cover-frame"><img src="${esc(j.cover)}" alt="Bìa ${esc(j.code)}" loading="lazy"><span class="hero-cover-badge ${j.group==='VAST-1'?'is-vast1':''}">${esc(j.group)}</span></div><span class="hero-cover-code" translate="no">${esc(j.code)}</span></a>`).join('');
 const year=scopus.annualYears.at(-1),previous=year-1;
 const comparable=journals.filter(j=>Number.isFinite(scopusRecord(j,year)?.value)&&Number.isFinite(scopusRecord(j,previous)?.value));
 const growing=comparable.filter(j=>scopusRecord(j,year).value>scopusRecord(j,previous).value);
 const remarks=[
  `Nhóm VAST-1 (7 tạp chí Scopus / WoS): ${growing.length}/${comparable.length} tạp chí tăng CiteScore năm ${year} so với ${previous}; dẫn đầu là VJES (5,0 · Q1, phân vị 77%), ANSN (3,9 · Q2) và VJC (3,0 · Q2).`,
  `Nhóm VAST-2 (5 tạp chí): Chỉ số CiteScore dự kiến 2026 của VJMech (1,14) và JCC (1,12) vượt mốc Tracker Scopus 0,7 của CIP; AJB (0,65) và VJMST (0,63) tiệm cận mốc 0,7.`,
  `Quy mô xuất bản năm ${state.year}: ${number(totalPapers)} bài báo khoa học trên ${number(totalIssues)} kỳ phát hành của 12 tạp chí.`
 ];
 $('#remarks').innerHTML=remarks.map(text=>`<li>${esc(text)}</li>`).join('');
 $('#coverage-copy').textContent='11 tạp chí thuộc Nhà xuất bản Khoa học tự nhiên và Công nghệ (hợp tác quốc tế với Springer Nature, IOP Publishing, Wiley-VCH ở VJM, ANSN, VJC); riêng Acta Mathematica Vietnamica (AMV) thuộc Viện Toán học (VAST) hợp tác cùng Springer Nature.';
}

/* PHẦN 01: BẢNG MA TRẬN CITESCORE VAST-1 */
function renderVast1Matrix(){
 const vast1=journals.filter(j=>j.group==='VAST-1');
 const years=scopus.annualYears;
 $('#vast1-citescore-body').innerHTML=vast1.map((j,idx)=>{
  const rec25=scopusRecord(j,2025),rec26=scopusRecord(j,2026),cat=j.scopusCategories?.[0];
  const yearCells=years.map(yr=>{
   const r=scopusRecord(j,yr),isLast=yr===2025;
   return `<td class="${isLast?'matrix-score-annual':''}">${Number.isFinite(r?.value)?score(r.value):'<span class="neutral">—</span>'}</td>`;
  }).join('');
  const windowText=Number.isFinite(rec25?.citations)?`${number(rec25.citations)} / ${number(rec25.documents)}`:Number.isFinite(rec26?.citations)?`${number(rec26.citations)} / ${number(rec26.documents)} (2026)`:'—';
  const catText=cat?`<strong>${cat.percentile}%</strong> (#${cat.rank}/${cat.total})<small>${esc(cat.name)}</small>`:'—';
  return `<tr><th scope="row"><div class="matrix-journal-cell"><a href="#journal/${encodeURIComponent(j.id)}"><img class="matrix-cover" src="${esc(j.cover)}" alt="Bìa ${esc(j.code)}" loading="lazy"></a><div class="matrix-meta"><a href="#journal/${encodeURIComponent(j.id)}">0${idx+1}. ${esc(fullName(j))}</a>${institutionBadgeHtml(j,true)}</div></div></th>${yearCells}<td class="matrix-score-tracker">${Number.isFinite(rec26?.value)?score(rec26.value):'—'}</td><td>${windowText}</td><td>${catText}</td></tr>`;
 }).join('');
}

/* PHẦN 02: DANH MỤC 12 TẠP CHÍ (LƯỚI BÌA ARTCRAFT + BẢNG CHI TIẾT) */
function renderPortfolio(){
 const year=scopus.annualYears.at(-1),tracker=scopus.trackerYear;
 $('#annual-column').innerHTML='CiteScore '+year+'<small>VAST-1 / VAST-2*</small>';$('#tracker-column').innerHTML='Tracker '+tracker+`<small>${date(scopus.records.find(r=>r.type==='tracker').lastUpdated)}</small>`;$('#output-column').innerHTML=`Bài / kỳ ${state.year}<small>${state.year===Number(dashboard.collectedAt.slice(0,4))?'Đến '+date(dashboard.collectedAt):'Cả năm'}</small>`;
 const list=filteredJournals();
 $('#catalog-cards-grid').innerHTML=list.map(j=>{
  const idx=journals.indexOf(j)+1,numStr=String(idx).padStart(2,'0');
  const isScopus=verifiedScopus(j),a=annualRecord(j),t=scopusRecord(j,tracker),o=output(j,state.year);
  const local25=!isScopus?j.localCitation?.selfCalculatedSeries.find(r=>r.year===year):null;
  const local26=!isScopus?j.localCitation?.selfCalculatedSeries.find(r=>r.year===tracker):null;
  const csText=isScopus?(Number.isFinite(a?.value)?score(a.value):'N/A'):(local25?ratio(local25.value)+'*':'—');
  const trText=isScopus?(Number.isFinite(t?.value)?score(t.value):'—'):(local26?ratio(local26.value)+'*':'—');
  const spanText=`${j.annualHistory[0].year}–${j.annualHistory.at(-1).year} (${j.annualHistory.length} năm)`;
  return `<article class="lineup-card" role="listitem"><div class="lineup-card-top"><span class="lineup-num" style="background:${styles[j.id].color}">${numStr}</span><span>${esc(j.group)} · ${esc(j.subject)}</span></div><div class="lineup-stage"><a class="lineup-cover-link" href="#journal/${encodeURIComponent(j.id)}"><img class="lineup-cover" src="${esc(j.cover)}" alt="Bìa ${esc(j.title)}" loading="lazy"></a><div class="lineup-logos">${institutionBadgeHtml(j,false)}</div></div><div class="lineup-body"><div><h3 class="lineup-title"><a href="#journal/${encodeURIComponent(j.id)}">${esc(j.title)} <span class="lineup-code" translate="no">(${esc(j.code)})</span></a></h3><p class="lineup-vi">${esc(j.titleVi)} · Dữ liệu lịch sử: <strong>${spanText}</strong></p><div class="lineup-metrics"><div class="lineup-metric-cell"><span>${isScopus?'CiteScore 25':'Dự kiến 25'}</span><strong>${csText}</strong></div><div class="lineup-metric-cell"><span>${isScopus?'Tracker 26':'Dự kiến 26'}</span><strong>${trText}</strong></div><div class="lineup-metric-cell"><span>Bài / kỳ ${state.year}</span><strong>${number(o?.papers)} / ${number(o?.issues)}</strong></div></div><div class="lineup-tags">${indexingBadges(j)}</div></div><a class="lineup-explore" href="#journal/${encodeURIComponent(j.id)}">XEM BIỂU ĐỒ LỊCH SỬ (${j.annualHistory[0].year}–2026) ↗</a></div></article>`;
 }).join('');

 $('#portfolio-body').innerHTML=list.map(j=>{
  const isScopus=verifiedScopus(j),a=annualRecord(j),t=scopusRecord(j,tracker),o=output(j,state.year),papers=o?.coverage==='complete'?o.papers:null;
  const local25=!isScopus?j.localCitation?.selfCalculatedSeries.find(r=>r.year===year):null;
  const local26=!isScopus?j.localCitation?.selfCalculatedSeries.find(r=>r.year===tracker):null;
  const annualCell=isScopus?(Number.isFinite(a?.value)?`<strong>${score(a.value)}</strong><small>Scopus</small>`:`<strong class="neutral">—</strong><small>N/A</small>`):(local25&&Number.isFinite(local25.value)?`<strong class="neutral">${ratio(local25.value)}*</strong><small>${local25.numerator}/${local25.denominator}</small>`:'<strong class="neutral">—</strong>');
  const trackerCell=isScopus?(Number.isFinite(t?.value)?`<strong>${score(t.value)}</strong><small>Tracker</small>`:'<strong class="neutral">—</strong>'):(local26&&Number.isFinite(local26.value)?`<strong class="neutral">${ratio(local26.value)}*</strong><small>${local26.numerator}/${local26.denominator}</small>`:'<strong class="neutral">—</strong>');
  const span=`${j.annualHistory[0].year}–${j.annualHistory.at(-1).year} (${j.annualHistory.length} năm)`;
  const latest=j.latestIssue?`<strong>${esc(span)}</strong><small>${esc(j.latestIssue.title)} · ${date(j.latestIssue.published)}</small>`:`<strong>${esc(span)}</strong>`;
  return `<tr><th scope="row"><div class="matrix-journal-cell"><a href="#journal/${encodeURIComponent(j.id)}"><img class="matrix-cover" src="${esc(j.cover)}" alt="Bìa ${esc(j.code)}" loading="lazy"></a><div class="matrix-meta"><a href="#journal/${encodeURIComponent(j.id)}">${esc(fullName(j))}</a><small>${esc(j.subject)} · ${esc(j.titleVi)}</small>${institutionBadgeHtml(j,true)}</div></div></th><td class="index-cell">${indexingBadges(j)}</td><td data-label="CiteScore ${year}">${annualCell}</td><td data-label="Tracker ${tracker}">${trackerCell}</td><td data-label="Bài / kỳ ${state.year}"><strong class="${Number.isFinite(papers)?'':'neutral'}">${number(papers)}</strong><small>${Number.isFinite(o?.issues)?number(o.issues)+' kỳ':'—'}</small></td><td class="updated-cell">${latest}</td></tr>`;
 }).join('');
 $('#results-count').textContent=list.length+' / '+journals.length+' tạp chí';
 $('#portfolio-empty').hidden=list.length!==0;
 $('#catalog-cards-grid').hidden=list.length===0;
}

function detailMetric(label,value,detail){return `<div><span class="summary-label">${esc(label)}</span><strong class="summary-value">${esc(value)}</strong><span class="summary-detail">${esc(detail)}</span></div>`;}

/* TRANG CHI TIẾT TỪNG TẠP CHÍ & BỘ 3 BIỂU ĐỒ LỊCH SỬ TOÀN THỜI GIAN (#journal/<id>) */
function renderSingleJournalSvg(svgEl,series,color,label,isDecimals=false,rightSeries=null){
 if(!svgEl||!series.length)return;
 const width=Math.max(320,Math.round(svgEl.parentElement?.getBoundingClientRect().width||820));
 const height=matchMedia('(max-width:767px)').matches?240:280,left=50,right=34,top=30,bottom=32;
 const years=series.map(r=>r.year),start=years[0],end=years.at(-1),plotWidth=width-left-right,plotHeight=height-top-bottom;
 const vals=series.map(r=>r.value).filter(Number.isFinite);
 const scale=niceScale(Math.max(isDecimals?0.5:5,...vals),isDecimals);
 const x=yr=>years.length===1?left+plotWidth/2:left+(yr-start)/(end-start)*plotWidth,y=v=>top+(1-v/scale.max)*plotHeight;
 svgEl.setAttribute('viewBox',`0 0 ${width} ${height}`);
 let svg=`<title>${esc(label)} (${start}–${end})</title>`;
 svg+=drawGridBackdrop({width,height,left,right,top,bottom,plotWidth,plotHeight,years,start,end,x,y,scale,decimals:isDecimals,provisionalLabel:end===2026?'2026 YTD':''});
 const themeChart=activeThemeObj().chartStyle;
 const baseline=top+plotHeight;
 if(themeChart==='column'||series.length>22){
  const colW=Math.max(3,Math.min(22,plotWidth/Math.max(1,series.length)*0.68));
  for(const r of series){
   if(!Number.isFinite(r.value))continue;
   const px=x(r.year)-colW/2,py=y(r.value),h=Math.max(2,baseline-py);
   svg+=`<rect x="${px.toFixed(2)}" y="${py.toFixed(2)}" width="${colW.toFixed(2)}" height="${h.toFixed(2)}" fill="${color}" opacity="${r.year===2026?0.65:0.88}" rx="1"><title>${r.year}: ${isDecimals?ratio(r.value):number(r.value)}${r.sub?' ('+r.sub+')':''}</title></rect>`;
  }
 }
 const pts=series.filter(r=>Number.isFinite(r.value)).map(r=>[x(r.year),y(r.value),r]);
 if(pts.length>1){
  const d=themeChart==='step'?stepPath(pts):smoothPath(pts);
  const areaD=`${d} L${pts.at(-1)[0].toFixed(2)} ${baseline} L${pts[0][0].toFixed(2)} ${baseline} Z`;
  svg+=`<path d="${areaD}" fill="${color}" opacity="0.12"/><path d="${d}" fill="none" stroke="${color}" stroke-width="2.4"/>`;
 }
 for(const [px,py,r] of pts){
  svg+=`<circle cx="${px.toFixed(2)}" cy="${py.toFixed(2)}" r="${series.length>30?2.6:3.6}" fill="${r.year===2026?'var(--paper)':color}" stroke="${color}" stroke-width="2"><title>${r.year}: ${isDecimals?ratio(r.value):number(r.value)}${r.sub?' ('+r.sub+')':''}</title></circle>`;
 }
 if(rightSeries&&rightSeries.length){
  const pts2=rightSeries.filter(r=>Number.isFinite(r.value)).map(r=>[x(r.year),y(r.value),r]);
  if(pts2.length>1){
   const d2='M'+pts2.map(p=>p[0].toFixed(2)+' '+p[1].toFixed(2)).join(' L');
   svg+=`<path d="${d2}" fill="none" stroke="var(--accent)" stroke-width="1.8" stroke-dasharray="4 3"/>`;
  }
 }
 svgEl.innerHTML=svg;
}

function renderDetail(id){
 const j=journals.find(item=>item.id===id),panel=$('#detail-panel');
 if(!j){panel.innerHTML='<div class="detail-top-bar"><a class="detail-back" href="#section-catalog">← Trở lại danh mục tạp chí</a></div><div style="padding:28px"><h2 id="detail-heading">Không tìm thấy tạp chí</h2></div>';return;}
 const isScopus=verifiedScopus(j),a=annualRecord(j),t=scopusRecord(j,scopus.trackerYear);
 const profileRows=[['Phân nhóm VAST',j.group],['Đơn vị chủ quản / xuất bản',j.publisher],['Tên tiếng Việt',j.titleVi],['Lĩnh vực',j.subject],['ISSN bản in',j.issn??'—'],['ISSN điện tử',j.eissn??'—'],['Kỳ hạn xuất bản',j.frequency?.issuesPerYear?j.frequency.issuesPerYear+' kỳ/năm':'—'],['Dải năm dữ liệu lịch sử',`${j.annualHistory[0].year}–${j.annualHistory.at(-1).year} (${j.annualHistory.length} năm)`]];
 const ownRecords=scopus.records.filter(r=>r.journal===j.code);
 const categories=j.scopusCategories??[];
 const local25=!isScopus?j.localCitation?.selfCalculatedSeries.find(r=>r.year===scopus.annualYears.at(-1)):null;
 const local26=!isScopus?j.localCitation?.selfCalculatedSeries.find(r=>r.year===scopus.trackerYear):null;
 const totalHistPapers=j.annualHistory.reduce((s,r)=>s+(r.papers||0),0);
 const totalHistIssues=j.annualHistory.reduce((s,r)=>s+(r.issues||0),0);
 const metricRows=ownRecords.map(r=>`<tr><th scope="row">${r.year}${r.type==='tracker'?' · Tracker':''}</th><td>${score(r.value)}</td><td>${number(r.citations)}</td><td>${number(r.documents)}</td></tr>`).join('');
 const outputRows=j.annualHistory.slice().reverse().map(row=>`<tr><th scope="row">${row.year}${row.periodKind==='ytd'?' · YTD':''}</th><td>${number(row.papers)}</td><td>${number(row.issues)}</td></tr>`).join('');
 const indexRows=j.indexings.filter(i=>i.status==='listed').map(i=>`<li><strong>${esc(indexingName(i))}</strong>${i.coverage?`<small>Phạm vi ${esc(i.coverage)}</small>`:''} ${external(i.sourceUrl,'Liên kết')}</li>`).join('');
 const issueGroups=j.outputs.slice().reverse().map(row=>`<section class="detail-section"><h3>Danh mục số xuất bản ${row.year} (${number(row.papers)} bài / ${number(row.issues)} kỳ)</h3><ul class="source-evidence">${row.issueItems.map(issue=>`<li>${external(issue.url,issue.title)}<small>${issue.published?'Phát hành '+date(issue.published)+' · ':''}${issue.paperKeys.length} bài</small></li>`).join('')}</ul></section>`).join('');
 const card1=isScopus?detailMetric('CiteScore '+scopus.annualYears.at(-1),score(a?.value),'Nhóm VAST-1 · Scopus'):local25?detailMetric('CiteScore dự kiến '+local25.year,ratio(local25.value),`Nhóm VAST-2 (${local25.numerator}/${local25.denominator})`):detailMetric('CiteScore '+scopus.annualYears.at(-1),'—','Nhóm VAST-2');
 const card2=isScopus?detailMetric('Tracker '+scopus.trackerYear,score(t?.value),t?'Cập nhật '+date(t.lastUpdated):'Scopus'):local26?detailMetric('Tracker dự kiến '+local26.year,ratio(local26.value),`Nhóm VAST-2 (${local26.numerator}/${local26.denominator})`):detailMetric('Tracker '+scopus.trackerYear,'—','Nhóm VAST-2');
 const card3=detailMetric(`Tổng số bài (${j.annualHistory[0].year}–2026)`,number(totalHistPapers),`${number(totalHistIssues)} kỳ phát hành · ${j.annualHistory.length} năm`);
 const card4=j.localCitation?.totals?detailMetric('Tổng lượt trích dẫn',number(j.localCitation.totals.citations),`${number(j.localCitation.totals.citingDocs)} bài trích dẫn · h-index ${j.localCitation.totals.hIndex}`):detailMetric('Trích dẫn cửa sổ 2025',number(a?.citations),`${number(a?.documents)} tài liệu (2022–2025)`);
 const inst=j.institution;
 const instHtml=`<div class="detail-inst-row"><img src="assets/images/logos/vast.png" alt="VAST"><img src="${esc(inst.logo)}" alt="${esc(inst.name)}">${inst.coLogo?`<img src="${esc(inst.coLogo)}" alt="${esc(inst.coPublisher)}">`:''}<span><strong>${esc(inst.name)}</strong>${inst.coPublisher?' · Hợp tác xuất bản cùng <strong>'+esc(inst.coPublisher)+'</strong>':''}</span></div>`;

 const histYears=j.annualHistory.map(r=>r.year);
 const yrOptions=histYears.map(y=>`<option value="${y}">${y}</option>`).join('');

 panel.innerHTML=`
 <div class="detail-top-bar">
  <a class="detail-back" href="#section-catalog">← Trở lại danh mục 12 tạp chí</a>
  <span style="font:600 11.5px var(--num-font);color:var(--muted)">HỒ SƠ &amp; BIỂU ĐỒ LỊCH SỬ TOÀN THỜI GIAN (${histYears[0]}–${histYears.at(-1)})</span>
 </div>
 <div class="detail-hero">
  <img class="detail-cover-img" src="${esc(j.cover)}" alt="Bìa ${esc(j.title)}">
  <div>
   <div style="margin-bottom:8px">${indexingBadges(j)}</div>
   <h2 id="detail-heading" class="detail-heading">${esc(fullName(j))}</h2>
   <p class="detail-subtitle">${esc(j.titleVi)} · ${esc(j.subject)}</p>
   ${instHtml}
   <div class="detail-metrics">${card1}${card2}${card3}${card4}</div>
  </div>
 </div>
 <section class="detail-charts-section" id="journal-own-charts" aria-label="Biểu đồ lịch sử riêng của tạp chí">
  <div class="detail-charts-head">
   <div>
    <span class="chart-kicker">Biểu đồ lịch sử riêng của ${esc(j.code)} · Không giới hạn năm</span>
    <h3>Diễn biến xuất bản, trích dẫn và chỉ số của ${esc(j.code)} (${histYears[0]}–${histYears.at(-1)})</h3>
   </div>
   <div class="trend-controls" style="margin:0">
    <div class="field"><label for="j-from-year">Từ năm</label><select id="j-from-year">${yrOptions}</select></div>
    <div class="field"><label for="j-to-year">Đến năm</label><select id="j-to-year">${yrOptions}</select></div>
    <button id="j-reset-years" class="text-button" type="button">Toàn bộ lịch sử (${histYears[0]}–${histYears.at(-1)})</button>
   </div>
  </div>
  <div class="detail-charts-grid">
   <div class="detail-chart-card">
    <h4 id="j-pub-title">1. Số bài đã xuất bản theo năm của ${esc(j.code)} (${histYears[0]}–${histYears.at(-1)})</h4>
    <p>Toàn bộ dải năm thực tế có dữ liệu của tạp chí (${j.annualHistory.length} năm, tổng cộng ${number(totalHistPapers)} bài / ${number(totalHistIssues)} kỳ).</p>
    <div class="chart-area"><svg id="j-pub-chart" class="detail-svg" xmlns="http://www.w3.org/2000/svg"></svg></div>
   </div>
   <div class="detail-chart-card">
    <h4>2. Diễn biến trích dẫn theo năm của ${esc(j.code)}</h4>
    <p>${j.localCitation?'Số lượt trích dẫn (đường liền) và số tài liệu trích dẫn (đường đứt) theo từng năm từ bộ thống kê trích dẫn của tạp chí.':'Số lượt trích dẫn trong cửa sổ 4 năm CiteScore trên Scopus chính thức (2015–2026).'}</p>
    <div class="chart-area"><svg id="j-cit-chart" class="detail-svg" xmlns="http://www.w3.org/2000/svg"></svg></div>
   </div>
   <div class="detail-chart-card">
    <h4>3. ${isScopus?`Diễn biến CiteScore & Tracker chính thức của ${esc(j.code)} (2015–2026)`:`Diễn biến CiteScore dự kiến 4 năm của ${esc(j.code)} (2015–2026)`}</h4>
    <p>${isScopus?'Chỉ số CiteScore năm (2015–2025) và CiteScoreTracker (2026) trên Scopus.':'Chỉ số 4 năm tự tính (lượt trích dẫn trong cửa sổ 4 năm / số bài trong cửa sổ 4 năm) của tạp chí nhóm VAST-2.'}</p>
    <div class="chart-area"><svg id="j-score-chart" class="detail-svg" xmlns="http://www.w3.org/2000/svg"></svg></div>
   </div>
  </div>
 </section>
 <div class="detail-grid"><div><section class="detail-section"><h3>Hồ sơ tạp chí</h3><dl class="profile-list">${profileRows.map(([label,value])=>`<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>${j.formerTitles?.length?`<p class="detail-note">Tên / ISSN trước đây: ${j.formerTitles.map(v=>esc(v.title)+(v.issn?' ('+esc(v.issn)+')':'')).join('; ')}.</p>`:''}<div class="detail-links">${external(j.website,'Website chính thức')}</div></section><section class="detail-section"><h3>Thống kê bài báo &amp; kỳ xuất bản (${histYears[0]}–${histYears.at(-1)})</h3><div class="detail-table-scroll" style="max-height:460px;overflow:auto"><table class="detail-table"><thead><tr><th scope="col">Năm</th><th scope="col">Số bài</th><th scope="col">Số kỳ</th></tr></thead><tbody>${outputRows}</tbody></table></div></section>${ownRecords.length?`<section class="detail-section"><h3>Chỉ số Scopus (Nhóm VAST-1)</h3><div class="detail-table-scroll"><table class="detail-table"><thead><tr><th scope="col">Năm</th><th scope="col">CiteScore</th><th scope="col">Trích dẫn</th><th scope="col">Tài liệu</th></tr></thead><tbody>${metricRows}</tbody></table></div></section>`:''}${categories.length?`<section class="detail-section"><h3>Phân vị theo nhóm ngành Scopus</h3><ul class="source-evidence">${categories.map(c=>`<li>${esc(c.name)} · ${c.year}<small>Phân vị ${number(c.percentile)}% · Hạng ${number(c.rank)}/${number(c.total)}</small>${external(c.sourceUrl,'Scopus')}</li>`).join('')}</ul></section>`:''}</div><div><section class="detail-section"><h3>Chỉ mục khoa học</h3><ul class="source-evidence">${indexRows||'<li>Đang cập nhật.</li>'}</ul></section><section class="detail-section"><h3>Kỳ phát hành mới nhất</h3>${j.latestIssue?`<p>${external(j.latestIssue.url,j.latestIssue.title)}</p><p class="detail-note">${j.latestIssue.published?'Phát hành '+date(j.latestIssue.published):''}</p>`:''}</section>${issueGroups}<section class="detail-section"><h3>Liên kết chính thức</h3><ol class="reference-list" role="list" style="grid-template-columns:1fr;padding:0">${j.profileSources.map(url=>`<li><p>${external(url)}</p></li>`).join('')}</ol></section></div></div>`;
 if(j.localCitation)panel.querySelector('.detail-grid>div').insertAdjacentHTML('beforeend',localCitationSection(j));

 const fromSel=$('#j-from-year'),toSel=$('#j-to-year');
 fromSel.value=String(histYears[0]);
 toSel.value=String(histYears.at(-1));
 const drawOwnCharts=()=>{
  let yFrom=Number(fromSel.value),yTo=Number(toSel.value);
  if(yFrom>yTo){yTo=yFrom;toSel.value=String(yTo);}
  const pubFiltered=j.annualHistory.filter(r=>r.year>=yFrom&&r.year<=yTo).map(r=>({year:r.year,value:r.papers,sub:r.issues+' kỳ'}));
  $('#j-pub-title').textContent=`1. Số bài đã xuất bản theo năm của ${j.code} (${yFrom}–${yTo})`;
  renderSingleJournalSvg($('#j-pub-chart'),pubFiltered,styles[j.id].color,`Số bài xuất bản ${j.code}`,false);
  const citRaw=j.localCitation?j.localCitation.citationSeries.map(r=>({year:r.year,value:r.confirmedCitationEdges,docVal:r.citingDocuments,sub:r.citingDocuments+' bài trích dẫn'})):ownRecords.map(r=>({year:r.year,value:r.citations,docVal:r.documents,sub:r.documents+' tài liệu'}));
  const citDocRaw=j.localCitation?j.localCitation.citationSeries.map(r=>({year:r.year,value:r.citingDocuments})):[];
  renderSingleJournalSvg($('#j-cit-chart'),citRaw,styles[j.id].color,`Trích dẫn ${j.code}`,false,citDocRaw);
  const scoreRaw=isScopus?ownRecords.map(r=>({year:r.year,value:r.value,sub:r.citations!==null?`${r.citations}/${r.documents}`:''})):(j.localCitation?.selfCalculatedSeries??[]).map(r=>({year:r.year,value:r.value,sub:`${r.numerator}/${r.denominator}`}));
  renderSingleJournalSvg($('#j-score-chart'),scoreRaw,styles[j.id].color,`CiteScore ${j.code}`,true);
 };
 fromSel.addEventListener('change',drawOwnCharts);
 toSel.addEventListener('change',drawOwnCharts);
 $('#j-reset-years').addEventListener('click',()=>{fromSel.value=String(histYears[0]);toSel.value=String(histYears.at(-1));drawOwnCharts();});
 requestAnimationFrame(drawOwnCharts);
}

function localCitationSection(j){
 const local=j.localCitation,showSelfScore=!verifiedScopus(j);
 const years=[...new Set([...local.citationSeries,...(showSelfScore?local.selfCalculatedSeries:[])].map(r=>r.year))].filter(y=>y<=Number(dashboard.collectedAt.slice(0,4))).sort((a,b)=>a-b);
 const rows=years.slice().reverse().map(year=>{
  const c=local.citationSeries.find(r=>r.year===year),s=showSelfScore?local.selfCalculatedSeries.find(r=>r.year===year):null;
  const scoreCol=showSelfScore?`<td title="${s?esc(s.window+': '+s.numerator+' / '+s.denominator):''}">${ratio(s?.value)}${s&&s.denominator>0?` <small>(${s.numerator}/${s.denominator})</small>`:''}</td>`:'';
  return `<tr><th scope="row">${year}</th><td>${number(c?.citingDocuments)}</td><td>${number(c?.confirmedCitationEdges)}</td>${scoreCol}</tr>`;
 }).join('');
 const tot=local.totals?`<p class="detail-note"><strong>Tổng hợp:</strong> ${number(local.totals.citations)} lượt trích dẫn · ${number(local.totals.citingDocs)} tài liệu trích dẫn · ${number(local.totals.citedArticles)} bài được trích dẫn · <strong>h-index: ${number(local.totals.hIndex)}</strong>.</p>`:'';
 const heading=showSelfScore?`Thống kê trích dẫn &amp; CiteScore dự kiến (${years[0]}–${years.at(-1)})`:`Thống kê trích dẫn theo năm (${years[0]}–${years.at(-1)})`;
 const colHead=showSelfScore?'<th scope="col">CiteScore dự kiến<br>4 năm (tử/mẫu)</th>':'';
 return `<section class="detail-section"><h3>${heading}</h3>${tot}<div class="detail-table-scroll" style="max-height:420px;overflow:auto"><table class="detail-table"><thead><tr><th scope="col">Năm</th><th scope="col">Tài liệu trích dẫn</th><th scope="col">Lượt trích dẫn</th>${colHead}</tr></thead><tbody>${rows}</tbody></table></div>${local.publicSourceUrl?external(local.publicSourceUrl,'Trang thống kê trích dẫn của tạp chí'):''}</section>`;
}

function renderReferences(){
 $('#source-links').innerHTML=journals.map(j=>{
  const original=scopus.journals.find(v=>v.code===j.code);
  return `<li><p><cite><strong>${esc(fullName(j))}</strong> — Nhóm ${esc(j.group)}</cite> (${esc(j.publisher)}). Website: ${external(j.website)}.${original?' Scopus Source Details: '+external('https://www.scopus.com/sourceid/'+original.sourceId,'sourceid/'+original.sourceId)+'.':''} <a href="#journal/${j.id}">Hồ sơ &amp; Biểu đồ lịch sử (${j.annualHistory[0].year}–2026)</a>.</p></li>`;
 }).join('');
}

function route(moveFocus=false){
 const hash=location.hash.slice(1)||'';
 const detail=hash.startsWith('journal/');
 $('#home-view').hidden=detail;
 $('#detail-panel').hidden=!detail;
 if(detail){
  let id;try{id=decodeURIComponent(hash.slice(8));}catch{id='';}
  renderDetail(id);
  document.title=(journals.find(j=>j.id===id)?.code??'Hồ sơ')+' · VAST';
  closeAllTooltips();
  if(moveFocus){const target=$('#detail-heading');if(target){target.tabIndex=-1;target.focus({preventScroll:true});}window.scrollTo({top:0,behavior:'instant'});}
 }else{
  document.title='VAST · Hệ thống Tạp chí Khoa học';
  requestAnimationFrame(()=>{
   const w1=Math.round($('.chart-area')?.getBoundingClientRect().width||0);
   const w2=Math.round($('#candidates-chart-area')?.getBoundingClientRect().width||0);
   if(w1>0)chartWidth=w1;
   if(w2>0)subChartWidth=w2;
   renderAllCharts();
   if(hash&&document.getElementById(hash)){
    document.getElementById(hash).scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'start'});
   }
  });
 }
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

/* === MULTI-MODE SVG CHART ENGINE === */
function smoothPath(pts){
 if(!pts.length)return '';
 if(pts.length===1)return `M${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`;
 let d=`M${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`;
 for(let i=0;i<pts.length-1;i++){
  const [x0,y0]=pts[i],[x1,y1]=pts[i+1],cx=((x0+x1)/2).toFixed(2);
  d+=` C${cx} ${y0.toFixed(2)},${cx} ${y1.toFixed(2)},${x1.toFixed(2)} ${y1.toFixed(2)}`;
 }
 return d;
}
function stepPath(pts){
 if(!pts.length)return '';
 let d=`M${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`;
 for(let i=0;i<pts.length-1;i++){
  const [x1,y1]=pts[i+1];
  d+=` H${x1.toFixed(2)} V${y1.toFixed(2)}`;
 }
 return d;
}
function drawGridBackdrop({width,height,left,right,top,bottom,plotWidth,plotHeight,years,start,end,x,y,scale,decimals,provisionalLabel}){
 const theme=activeThemeObj(),gridStyle=theme.gridStyle,chartStyle=theme.chartStyle;
 let svg='';
 if(gridStyle==='framed')svg+=`<rect x="${left}" y="${top-8}" width="${plotWidth}" height="${plotHeight+8}" fill="var(--surface)" stroke="var(--line)"/>`;
 if(provisionalLabel&&years.length>1){
  const boundary=(x(end-1)+x(end))/2;
  svg+=`<rect x="${boundary}" y="${top-10}" width="${width-right-boundary}" height="${plotHeight+10}" fill="var(--surface)" opacity="0.85"/><text x="${width-right-4}" y="15" text-anchor="end" fill="var(--muted)" font-size="10.5">${esc(provisionalLabel)}</text>`;
 }
 if(chartStyle==='dot-band'&&years.length>1){
  const stepW=plotWidth/Math.max(1,years.length-1);
  years.forEach((yr,idx)=>{if(idx%2===0)svg+=`<rect x="${Math.max(left,x(yr)-stepW*0.32)}" y="${top}" width="${stepW*0.64}" height="${plotHeight}" fill="var(--surface)" opacity="0.55"/>`;});
 }
 const ticks=Math.round(scale.max/scale.step);
 for(let i=0;i<=ticks;i++){
  const v=+(i*scale.step).toFixed(4),py=y(v);
  if(gridStyle==='banded'&&i<ticks&&i%2===0){
   const nextY=y(+((i+1)*scale.step).toFixed(4));
   svg+=`<rect x="${left}" y="${nextY}" width="${plotWidth}" height="${py-nextY}" fill="var(--surface)" opacity="0.45"/>`;
  }
  svg+=`<line x1="${left}" y1="${py}" x2="${width-right}" y2="${py}" stroke="var(--line)"${gridStyle==='full-matrix'?' stroke-dasharray="2 3"':''}/><text x="${left-10}" y="${py+4}" text-anchor="end" fill="var(--muted)" font-size="11">${formatAxisTick(v,decimals)}</text>`;
 }
 if(gridStyle==='full-matrix'){
  const vStep=years.length>20?5:years.length>12?2:1;
  for(const yr of years)if((yr-start)%vStep===0||yr===end)svg+=`<line x1="${x(yr)}" y1="${top}" x2="${x(yr)}" y2="${top+plotHeight}" stroke="var(--line)" stroke-dasharray="2 3"/>`;
 }
 const tickStep=years.length<=7?1:years.length>28?5:years.length>16?3:width<600?3:2;
 for(const year of years)if((year-start)%tickStep===0||year===end)svg+=`<text x="${x(year)}" y="${height-10}" text-anchor="middle" fill="var(--muted)" font-size="11.5">${year}</text>`;
 return svg;
}
function drawSeriesGeometry({list,activeIds,years,start,end,left,top,plotWidth,plotHeight,x,y,obsFn,seriesAttr,pointClass,formatVal}){
 const theme=activeThemeObj(),chartStyle=theme.chartStyle,baseline=top+plotHeight;
 const activeOrder=list.filter(j=>activeIds.has(j.id)).map(j=>j.id);
 const stepX=years.length>1?plotWidth/(years.length-1):plotWidth*0.4;
 const usedLabelY=[];
 let svg='';
 for(const j of list){
  const style=styles[j.id],on=activeIds.has(j.id),activeIdx=Math.max(0,activeOrder.indexOf(j.id)),activeCount=Math.max(1,activeOrder.length);
  svg+=`<g class="journal-series" ${seriesAttr}="${j.id}"${on?'':' hidden'} aria-hidden="true">`;
  const runs=[];let currentRun=[];
  for(const year of years){
   const o=obsFn(j,year);
   if(!Number.isFinite(o?.value)){if(currentRun.length){runs.push(currentRun);currentRun=[];}continue;}
   const isProv=['tracker','ytd'].includes(o.kind)||year===end;
   if(!isProv){currentRun.push([x(year),y(o.value),year,o]);}
   else{
    if(currentRun.length){runs.push(currentRun);currentRun=[];}
    const prev=obsFn(j,year-1);
    if(year>start&&Number.isFinite(prev?.value)&&chartStyle!=='column'&&chartStyle!=='lollipop'){
     svg+=`<path d="M${x(year-1).toFixed(2)} ${y(prev.value).toFixed(2)} L${x(year).toFixed(2)} ${y(o.value).toFixed(2)}" class="provisional-segment" fill="none" stroke="${style.color}" stroke-width="2" stroke-dasharray="5 4"/>`;
    }
   }
  }
  if(currentRun.length)runs.push(currentRun);

  if(chartStyle==='column'){
   const bandW=Math.min(46,stepX*0.74),colW=Math.max(3,bandW/activeCount-1);
   for(const year of years){
    const o=obsFn(j,year);if(!Number.isFinite(o?.value))continue;
    const px=x(year)-bandW/2+activeIdx*(colW+1),py=y(o.value),h=Math.max(2,baseline-py);
    const isProv=['tracker','ytd'].includes(o.kind)||year===end;
    const attrs=pointClass?`class="${pointClass}" data-journal="${j.id}" data-year="${year}" data-value="${o.value}" data-kind="${o.kind}"`:'';
    svg+=`<rect ${attrs} x="${px.toFixed(2)}" y="${py.toFixed(2)}" width="${colW.toFixed(2)}" height="${h.toFixed(2)}" fill="${style.color}" opacity="${isProv?0.68:0.9}" rx="1"/>`;
   }
  }else if(chartStyle==='lollipop'){
   const spread=Math.min(28,stepX*0.52),offset=activeCount>1?(activeIdx-(activeCount-1)/2)*(spread/Math.max(1,activeCount-1)):0;
   for(const year of years){
    const o=obsFn(j,year);if(!Number.isFinite(o?.value))continue;
    const px=x(year)+offset,py=y(o.value),isProv=['tracker','ytd'].includes(o.kind)||year===end;
    const attrs=pointClass?`class="${pointClass}" data-journal="${j.id}" data-year="${year}" data-value="${o.value}" data-kind="${o.kind}"`:'';
    svg+=`<line x1="${px.toFixed(2)}" y1="${baseline}" x2="${px.toFixed(2)}" y2="${py.toFixed(2)}" stroke="${style.color}" stroke-width="2"${isProv?' stroke-dasharray="3 3"':''}/>`;
    svg+=`<circle ${attrs} cx="${px.toFixed(2)}" cy="${py.toFixed(2)}" r="4.2" fill="${isProv?'var(--paper)':style.color}" stroke="${style.color}" stroke-width="2"/>`;
   }
  }else{
   for(const run of runs){
    const d=chartStyle==='smooth'||chartStyle==='smooth-area'?smoothPath(run):chartStyle==='step'?stepPath(run):'M'+run.map(p=>p[0].toFixed(2)+' '+p[1].toFixed(2)).join(' L');
    if(chartStyle==='smooth-area'&&run.length>1){
     const areaD=`${d} L${run.at(-1)[0].toFixed(2)} ${baseline} L${run[0][0].toFixed(2)} ${baseline} Z`;
     svg+=`<path d="${areaD}" fill="${style.color}" opacity="0.12"/>`;
    }
    svg+=`<path class="chart-series" d="${d}" fill="none" stroke="${style.color}" stroke-width="${chartStyle==='smooth'?2.5:2}"${style.dash&&chartStyle==='line'?` stroke-dasharray="${style.dash}"`:''}/>`;
   }
   for(const year of years){
    const o=obsFn(j,year);if(!Number.isFinite(o?.value))continue;
    const px=x(year),py=y(o.value),isProv=['tracker','ytd'].includes(o.kind)||year===end;
    const attrs=pointClass?`class="${pointClass}" data-journal="${j.id}" data-year="${year}" data-value="${o.value}" data-kind="${o.kind}"`:'';
    if(isProv){
     svg+=`<path ${attrs} d="M${px} ${py-5} L${px+5} ${py} L${px} ${py+5} L${px-5} ${py} Z" fill="var(--paper)" stroke="${style.color}" stroke-width="2"/>`;
    }else if(chartStyle==='step'){
     svg+=`<rect ${attrs} x="${(px-3.2).toFixed(2)}" y="${(py-3.2).toFixed(2)}" width="6.4" height="6.4" fill="${style.color}" stroke="var(--paper)"/>`;
    }else if(chartStyle==='smooth'){
     svg+=`<circle ${attrs} cx="${px}" cy="${py}" r="3.6" fill="var(--paper)" stroke="${style.color}" stroke-width="2.2"/>`;
    }else if(chartStyle==='dot-band'){
     svg+=`<circle ${attrs} cx="${px}" cy="${py}" r="4.2" fill="${style.color}" stroke="var(--paper)" stroke-width="1.5"/>`;
    }else{
     svg+=`<circle ${attrs} cx="${px}" cy="${py}" r="3.25" fill="${style.color}" stroke="var(--paper)"/>`;
    }
   }
   if(chartStyle==='dot-band'&&on){
    const lastYr=[...years].reverse().find(yr=>Number.isFinite(obsFn(j,yr)?.value));
    if(lastYr!==undefined){
     const o=obsFn(j,lastYr);
     let ly=y(o.value)+3.5;
     while(usedLabelY.some(u=>Math.abs(u-ly)<10.5))ly+=10.5;
     usedLabelY.push(ly);
     svg+=`<text x="${(x(lastYr)+7).toFixed(1)}" y="${ly.toFixed(1)}" fill="${style.color}" font-size="10" font-weight="600">${j.code} ${formatVal?formatVal(o.value):o.value}</text>`;
    }
   }
  }
  svg+='</g>';
 }
 return svg;
}

function renderComparisonItems(items,maxVal){
 const barStyle=activeThemeObj().barStyle;
 if(barStyle==='compact-table'){
  return `<table class="compact-score-table"><thead><tr><th>Tạp chí</th><th>${esc(items[0]?.label1??'Kỳ 1')}</th><th>${esc(items[0]?.label2??'Kỳ 2')}</th></tr></thead><tbody>${items.map(it=>`<tr><td><a href="#journal/${it.j.id}">${esc(it.j.code)} · ${esc(it.j.title)}</a>${it.sub?`<small style="display:block;color:var(--muted);font-size:10.5px">${it.sub}</small>`:''}</td><td>${it.val1Text}</td><td><strong>${it.val2Text}</strong></td></tr>`).join('')}</tbody></table>`;
 }
 if(barStyle==='kpi-tile'){
  return `<div class="kpi-tile-grid">${items.map(it=>`<div class="kpi-tile" style="--tile-color:${it.color}"><a href="#journal/${it.j.id}">${esc(it.j.code)} · ${esc(it.j.title)}</a><div class="kpi-tile-num">${it.headline}</div><div class="kpi-tile-sub">${esc(it.label2)}: <strong>${it.val2Text}</strong></div>${it.val1Text?`<div class="kpi-tile-sub">${esc(it.label1)}: ${it.val1Text}</div>`:''}</div>`).join('')}</div>`;
 }
 return items.map(it=>{
  const pct1=Math.min(100,Math.max(0,(it.num1??0)/maxVal*100)),pct2=Math.min(100,Math.max(0,(it.num2??0)/maxVal*100));
  if(barStyle==='lollipop-bar'){
   const row1=it.val1Text?`<div class="bar-row"><span>${esc(it.label1)}</span><div class="lollipop-rail"><div class="lollipop-stem" style="width:${pct1.toFixed(1)}%;background:${it.color};opacity:.5"></div><div class="lollipop-head" style="left:${pct1.toFixed(1)}%;background:var(--paper);border-color:${it.color}"></div></div><span>${it.val1Text}</span></div>`:'';
   return `<div class="bar-item"><div class="bar-top"><div><a href="#journal/${it.j.id}">${esc(it.title)}</a>${it.sub?`<small>${it.sub}</small>`:''}</div><div class="bar-metrics">${it.rightBadge}</div></div><div class="bar-track">${row1}<div class="bar-row"><span>${esc(it.label2)}</span><div class="lollipop-rail"><div class="lollipop-stem" style="width:${pct2.toFixed(1)}%;background:${it.color}"></div><div class="lollipop-head" style="left:${pct2.toFixed(1)}%;background:${it.color}"></div></div><span><strong>${it.val2Text}</strong></span></div></div></div>`;
  }
  if(barStyle==='segmented-meter'){
   const segs=pct=>Array.from({length:12},(_,k)=>`<span class="meter-seg${(k+1)*8.33<=pct+4?' is-on':''}" style="${(k+1)*8.33<=pct+4?`background:${it.color}`:''}"></span>`).join('');
   const row1=it.val1Text?`<div class="bar-row"><span>${esc(it.label1)}</span><div class="meter-grid" style="opacity:.6">${segs(pct1)}</div><span>${it.val1Text}</span></div>`:'';
   return `<div class="bar-item"><div class="bar-top"><div><a href="#journal/${it.j.id}">${esc(it.title)}</a>${it.sub?`<small>${it.sub}</small>`:''}</div><div class="bar-metrics">${it.rightBadge}</div></div><div class="bar-track">${row1}<div class="bar-row"><span>${esc(it.label2)}</span><div class="meter-grid">${segs(pct2)}</div><span><strong>${it.val2Text}</strong></span></div></div></div>`;
  }
  const row1=it.val1Text?`<div class="bar-row"><span>${esc(it.label1)}</span><div class="bar-rail"><div class="bar-fill" style="width:${pct1.toFixed(1)}%;background:${it.color};opacity:.55"></div></div><span>${it.val1Text}</span></div>`:'';
  return `<div class="bar-item"><div class="bar-top"><div><a href="#journal/${it.j.id}">${esc(it.title)}</a>${it.sub?`<small>${it.sub}</small>`:''}</div><div class="bar-metrics">${it.rightBadge}</div></div><div class="bar-track">${row1}<div class="bar-row"><span>${esc(it.label2)}</span><div class="bar-rail"><div class="bar-fill" style="width:${pct2.toFixed(1)}%;background:${it.color}"></div></div><span><strong>${it.val2Text}</strong></span></div></div></div>`;
 }).join('');
}

function renderChart(){
 if(!dashboard)return;
 const isDotBand=activeThemeObj().chartStyle==='dot-band';
 const width=chartWidth,height=matchMedia('(max-width:767px)').matches?270:360,left=48,right=isDotBand?74:34,top=32,bottom=34;
 const years=availableYears().filter(y=>y>=state.from&&y<=state.to),start=years[0],end=years.at(-1),plotWidth=width-left-right,plotHeight=height-top-bottom;
 const values=journals.flatMap(j=>years.map(y=>observation(j,state.metric,y).value)).filter(Number.isFinite),scale=niceScale(Math.max(0,...values),Boolean(metricInfo[state.metric].decimals));
 const x=year=>years.length===1?left+plotWidth/2:left+(year-start)/(end-start)*plotWidth,y=value=>top+(1-value/scale.max)*plotHeight;
 plot={width,height,left,right,top,bottom,plotWidth,years,start,end,x,y};
 const chart=$('#trend-chart');chart.setAttribute('viewBox',`0 0 ${width} ${height}`);
 const currentYear=Number(dashboard.collectedAt.slice(0,4)),provisional=years.includes(currentYear);
 const provLabel=provisional?(metricInfo[state.metric].scopus?'Tracker':metricInfo[state.metric].local?'2026 YTD':'Đến ngày chốt'):'';
 let svg=`<title id="chart-title">${esc(metricInfo[state.metric].label)} ${start}–${end}</title><desc id="chart-description">Biểu đồ tương tác ${start}–${end}.</desc>`;
 svg+=drawGridBackdrop({width,height,left,right,top,bottom,plotWidth,plotHeight,years,start,end,x,y,scale,decimals:Boolean(metricInfo[state.metric].decimals),provisionalLabel:provLabel});
 svg+=drawSeriesGeometry({list:journals,activeIds:state.series,years,start,end,left,top,plotWidth,plotHeight,x,y,obsFn:(j,yr)=>observation(j,state.metric,yr),seriesAttr:'data-journal',pointClass:'chart-point',formatVal:metricValue});
 svg+=`<g id="chart-empty" hidden><text x="${width/2}" y="${height/2-10}" text-anchor="middle" fill="var(--muted)" font-size="13"><tspan x="${width/2}">Chưa có giá trị để vẽ</tspan><tspan x="${width/2}" dy="22">Đổi chỉ số, khoảng năm hoặc chọn tạp chí.</tspan></text></g><g id="chart-hover" aria-hidden="true" pointer-events="none" hidden></g>`;
 chart.innerHTML=svg;updateSeries();
 $('#chart-caption').textContent=state.metric==='localScore'?`Chỉ số CiteScore dự kiến (cửa sổ 4 năm) của 5 tạp chí nhóm VAST-2.`:metricInfo[state.metric].local?`Số liệu trích dẫn thống kê theo năm xuất bản của tài liệu trích dẫn.`:metricInfo[state.metric].scopus?`CiteScore năm (2015–2025) và CiteScoreTracker (${scopus.trackerYear}, cập nhật ${date(scopus.records.find(r=>r.type==='tracker').lastUpdated)}) của nhóm VAST-1.`:`Số lượng công bố trong các số phát hành chính thức từ năm 2020 đến ${date(dashboard.collectedAt)}.`;
}
function updateSeries(animate=false){
 for(const button of document.querySelectorAll('#chart-legend .journal-toggle'))button.setAttribute('aria-pressed',String(state.series.has(button.dataset.journal)));
 let points=0;for(const group of document.querySelectorAll('#trend-chart .journal-series')){const on=state.series.has(group.dataset.journal),wasHidden=group.hasAttribute('hidden');group.toggleAttribute('hidden',!on);group.classList.remove('is-muted');if(on)points+=group.querySelectorAll('.chart-point').length;if(on&&wasHidden&&animate&&!reduced.matches)group.animate([{opacity:0},{opacity:1}],{duration:180,easing:'cubic-bezier(.23,1,.32,1)'});}
 const pool=state.metric==='localScore'?nonScopusIds:journals.map(j=>j.id);
 $('#show-all').disabled=pool.every(id=>state.series.has(id));$('#chart-empty')?.toggleAttribute('hidden',points!==0);
 const selected=pool.filter(id=>state.series.has(id)).map(id=>journals.find(j=>j.id===id)).filter(Boolean);
 $('#chart-scope').textContent=`Đang hiển thị ${selected.length} tạp chí.`;
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
 const heading=metricInfo[state.metric].short+' '+year+(provisional?(metricInfo[state.metric].scopus?' · Tracker':' · YTD'):'');$('#tooltip-year').textContent=heading;
 $('#tooltip-values').innerHTML=rows.map(({j,o})=>`<div class="tooltip-row"><dt><span class="tooltip-dot" style="background:${styles[j.id].color}" aria-hidden="true"></span><span title="${esc(fullName(j))}" translate="no">${j.code}</span></dt><dd class="${Number.isFinite(o.value)?'':'neutral'}" title="${esc(Number.isFinite(o.value)?'':o.reason)}">${metricValue(o.value)}</dd></div>`).join('');
 $('#tooltip-note').textContent=state.metric==='localScore'?'Nhóm VAST-2 (cửa sổ 4 năm).':provisional&&metricInfo[state.metric].scopus?'CiteScoreTracker cập nhật '+date(scopus.records.find(r=>r.type==='tracker').lastUpdated)+'.':'';
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
 const isDotBand=activeThemeObj().chartStyle==='dot-band';
 const width=subChartWidth,height=matchMedia('(max-width:767px)').matches?260:340,left=48,right=isDotBand?74:34,top=34,bottom=34;
 const years=[2015,2016,2017,2018,2019,2020,2021,2022,2023,2024,2025,2026],start=years[0],end=years.at(-1),plotWidth=width-left-right,plotHeight=height-top-bottom;
 const list=candidateIds.map(id=>journals.find(j=>j.id===id));
 const values=list.flatMap(j=>years.map(y=>observation(j,'localScore',y).value)).filter(Number.isFinite);
 const scale=niceScale(Math.max(1.2,...values),true);
 const x=year=>left+(year-start)/(end-start)*plotWidth,y=value=>top+(1-value/scale.max)*plotHeight;
 subState.candidates.plot={width,height,left,right,top,bottom,plotWidth,years,start,end,x,y};
 const cipOfficialTracker=0.7;
 const chart=$('#candidates-chart');chart.setAttribute('viewBox',`0 0 ${width} ${height}`);
 let svg=`<title id="candidates-chart-title">CiteScore dự kiến của nhóm tạp chí VAST-2 (2015–2026)</title><desc id="candidates-chart-desc">Diễn biến chỉ số 4 năm tự tính của 5 tạp chí nhóm VAST-2: VJMech, JCC, AJB, VJMST, VJBT.</desc>`;
 svg+=drawGridBackdrop({width,height,left,right,top,bottom,plotWidth,plotHeight,years,start,end,x,y,scale,decimals:true,provisionalLabel:'Dự kiến 2026'});
 svg+=`<line x1="${left}" y1="${y(cipOfficialTracker)}" x2="${width-right}" y2="${y(cipOfficialTracker)}" stroke="var(--accent)" stroke-width="1.25" stroke-dasharray="4 4"/><text x="${left+6}" y="${y(cipOfficialTracker)-6}" fill="var(--accent)" font-size="11" font-weight="600">Mốc tham chiếu Tracker Scopus 2026 của CIP: 0,7</text>`;
 svg+=drawSeriesGeometry({list,activeIds:candidateSeries,years,start,end,left,top,plotWidth,plotHeight,x,y,obsFn:(j,yr)=>observation(j,'localScore',yr),seriesAttr:'data-candidate-series',pointClass:'',formatVal:ratio});
 svg+=`<g class="sub-hover" aria-hidden="true" pointer-events="none" hidden></g>`;
 chart.innerHTML=svg;
 if(subState.candidates.year!==null)showCandidateYear(subState.candidates.year,true);
 const barRows=candidateIds.map(id=>{
  const j=journals.find(x=>x.id===id),s25=j.localCitation.selfCalculatedSeries.find(r=>r.year===2025),s26=j.localCitation.selfCalculatedSeries.find(r=>r.year===2026);
  return {j,s25,s26};
 }).sort((a,b)=>(b.s26?.value??0)-(a.s26?.value??0));
 const maxBar=Math.max(1.2,...barRows.flatMap(r=>[r.s25?.value??0,r.s26?.value??0]));
 $('#candidates-bars').innerHTML=renderComparisonItems(barRows.map(({j,s25,s26},idx)=>({
  j,color:styles[j.id].color,title:`${idx+1}. ${j.code} · ${j.title}`,sub:'Nhóm VAST-2',
  rightBadge:`<strong>${ratio(s26?.value)}</strong> (2026)`,headline:ratio(s26?.value),
  label1:'2025',num1:s25?.value??0,val1Text:`${ratio(s25?.value)} (${s25?.numerator}/${s25?.denominator})`,
  label2:'2026*',num2:s26?.value??0,val2Text:`${ratio(s26?.value)} (${s26?.numerator}/${s26?.denominator})`
 })),maxBar);
}
function showCandidateYear(year,force=false){
 const p=subState.candidates.plot;if(!p||!candidateSeries.size||!p.years.includes(year))return;
 if(subState.candidates.year===year&&!force)return;subState.candidates.year=year;
 const rows=candidateIds.filter(id=>candidateSeries.has(id)).map(id=>{const j=journals.find(x=>x.id===id);return {j,o:observation(j,'localScore',year)};});
 $('#candidates-tooltip-year').textContent='CiteScore dự kiến '+year+(year===2026?' · Tracker dự kiến':'');
 $('#candidates-tooltip-values').innerHTML=rows.map(({j,o})=>`<div class="tooltip-row"><dt><span class="tooltip-dot" style="background:${styles[j.id].color}"></span><span>${j.code}</span></dt><dd class="${Number.isFinite(o.value)?'':'neutral'}">${ratio(o.value)}${o.extra&&o.extra.denominator>0?` (${o.extra.numerator}/${o.extra.denominator})`:''}</dd></div>`).join('');
 $('#candidates-tooltip-note').textContent=`Cửa sổ 4 năm (${year-3}–${year}) của nhóm VAST-2.`;
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
 const isDotBand=activeThemeObj().chartStyle==='dot-band';
 const width=subChartWidth,height=matchMedia('(max-width:767px)').matches?260:340,left=52,right=isDotBand?74:34,top=34,bottom=34;
 const years=[2015,2016,2017,2018,2019,2020,2021,2022,2023,2024,2025,2026],start=years[0],end=years.at(-1),plotWidth=width-left-right,plotHeight=height-top-bottom;
 const list=poolIds.map(id=>journals.find(j=>j.id===id));
 const activeList=list.filter(j=>citationSeriesSet.has(j.id));
 const values=(activeList.length?activeList:list).flatMap(j=>years.map(y=>citationObs(j,y).value)).filter(Number.isFinite);
 const scale=niceScale(Math.max(10,...values),false);
 const x=year=>left+(year-start)/(end-start)*plotWidth,y=value=>top+(1-value/scale.max)*plotHeight;
 subState.citations.plot={width,height,left,right,top,bottom,plotWidth,years,start,end,x,y,poolIds};
 const modeTitle=citationMode==='localEdges'?'Lượt trích dẫn theo năm (2015–2026)':citationMode==='localDocs'?'Tài liệu trích dẫn theo năm (2015–2026)':'Trích dẫn trong cửa sổ CiteScore 4 năm (2015–2026)';
 const chart=$('#citations-chart');chart.setAttribute('viewBox',`0 0 ${width} ${height}`);
 let svg=`<title id="citations-chart-title">${esc(modeTitle)}</title><desc id="citations-chart-desc">Biểu đồ diễn biến trích dẫn của các tạp chí VAST giai đoạn 2015–2026.</desc>`;
 svg+=drawGridBackdrop({width,height,left,right,top,bottom,plotWidth,plotHeight,years,start,end,x,y,scale,decimals:false,provisionalLabel:citationMode==='scopusCitations'?'Tracker 2026':'2026 YTD'});
 svg+=drawSeriesGeometry({list,activeIds:citationSeriesSet,years,start,end,left,top,plotWidth,plotHeight,x,y,obsFn:(j,yr)=>citationObs(j,yr),seriesAttr:'data-citation-series',pointClass:'',formatVal:number});
 svg+=`<g class="sub-hover" aria-hidden="true" pointer-events="none" hidden></g>`;
 chart.innerHTML=svg;
 $('#citations-caption').textContent=citationMode==='scopusCitations'?'Tổng trích dẫn trong cửa sổ 4 năm CiteScore của 7 tạp chí nhóm VAST-1.':'Số liệu trích dẫn theo năm xuất bản của tài liệu trích dẫn.';
 if(subState.citations.year!==null)showCitationYear(subState.citations.year,true);
 if(citationMode==='scopusCitations'){
  $('#citations-bar-heading').textContent='Trích dẫn cửa sổ 4 năm CiteScore — Nhóm VAST-1';
  $('#citations-bar-sub').textContent='So sánh tổng trích dẫn trong cửa sổ 4 năm trên Scopus (7 tạp chí VAST-1).';
  const rows=scopusIds.map(id=>{const j=journals.find(x=>x.id===id);return {j,c25:scopusRecord(j,2025)?.citations??null,c26:scopusRecord(j,2026)?.citations??null};}).sort((a,b)=>(b.c26??0)-(a.c26??0));
  const maxVal=Math.max(10,...rows.flatMap(r=>[r.c25??0,r.c26??0]));
  $('#citations-bars').innerHTML=renderComparisonItems(rows.map(({j,c25,c26})=>({
   j,color:styles[j.id].color,title:`${j.code} · ${j.title}`,sub:'',
   rightBadge:`<strong>${number(c26)}</strong> (Tracker 2026)`,headline:number(c26),
   label1:'2025',num1:c25??0,val1Text:`${number(c25)} trích dẫn`,
   label2:'2026',num2:c26??0,val2Text:`${number(c26)} trích dẫn`
  })),maxVal);
 }else{
  $('#citations-bar-heading').textContent='Tổng hợp trích dẫn & h-index theo tạp chí';
  $('#citations-bar-sub').textContent='Lũy kế số lượt trích dẫn, số bài trích dẫn, số bài được trích dẫn và h-index của từng tạp chí.';
  const rows=localIds.map(id=>journals.find(x=>x.id===id)).sort((a,b)=>(b.localCitation.totals.citations)-(a.localCitation.totals.citations));
  const maxCit=Math.max(10,...rows.map(j=>j.localCitation.totals.citations));
  $('#citations-bars').innerHTML=renderComparisonItems(rows.map(j=>{
   const t=j.localCitation.totals;
   return {
    j,color:styles[j.id].color,title:`${j.code} (${j.group}) · ${j.title}`,sub:`h-index: <strong>${number(t.hIndex)}</strong> · ${number(t.citedArticles)} bài được trích dẫn`,
    rightBadge:`<strong>${number(t.citations)}</strong> lượt`,headline:number(t.citations)+' lượt',
    label1:'Bài TD',num1:t.citingDocs,val1Text:`${number(t.citingDocs)} bài trích dẫn`,
    label2:'Lượt TD',num2:t.citations,val2Text:`${number(t.citations)} lượt`
   };
  }),maxCit);
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
 $('#citations-tooltip-note').textContent='';
 const px=p.x(year),tipWidth=Math.min(300,p.width-24),tip=$('#citations-tooltip');
 tip.style.left=Math.max(12,px+16+tipWidth<=p.width-12?px+16:px-tipWidth-16)+'px';tip.hidden=false;
 const hover=$('#citations-chart .sub-hover');hover.removeAttribute('hidden');
 hover.innerHTML=`<line x1="${px}" y1="${p.top}" x2="${px}" y2="${p.height-p.bottom}" stroke="var(--muted)" stroke-dasharray="3 4"/>`+rows.filter(r=>Number.isFinite(r.o.value)).map(({j,o})=>`<circle cx="${px}" cy="${p.y(o.value)}" r="5" fill="var(--paper)" stroke="${styles[j.id].color}" stroke-width="2.5"/>`).join('');
}

function renderPapersChart(){
 if(!dashboard)return;
 const allIds=journals.map(j=>j.id);
 $('#papers-legend').innerHTML=legendButtonsHtml(allIds,paperSeriesSet,'data-paper-journal');
 const isDotBand=activeThemeObj().chartStyle==='dot-band';
 const width=subChartWidth,height=matchMedia('(max-width:767px)').matches?260:340,left=48,right=isDotBand?74:34,top=40,bottom=34;
 const years=dashboard.outputYears,start=years[0],end=years.at(-1),plotWidth=width-left-right,plotHeight=height-top-bottom;
 const activeList=journals.filter(j=>paperSeriesSet.has(j.id));
 const values=(activeList.length?activeList:journals).flatMap(j=>years.map(y=>output(j,y)?.papers)).filter(Number.isFinite);
 const scale=niceScale(Math.max(20,...values),false);
 const x=year=>left+(year-start)/(end-start)*plotWidth,y=value=>top+(1-value/scale.max)*plotHeight;
 subState.papers.plot={width,height,left,right,top,bottom,plotWidth,years,start,end,x,y};
 const yearTotals=years.map(yr=>({year:yr,papers:activeList.reduce((s,j)=>s+(output(j,yr)?.papers??0),0),issues:activeList.reduce((s,j)=>s+(output(j,yr)?.issues??0),0)}));
 const chart=$('#papers-chart');chart.setAttribute('viewBox',`0 0 ${width} ${height}`);
 let svg=`<title id="papers-chart-title">Số bài đã xuất bản của 12 tạp chí (2020–2026)</title><desc id="papers-chart-desc">Diễn biến số bài nghiên cứu đã phát hành chính thức của 12 tạp chí VAST từ 2020 đến 2026.</desc>`;
 svg+=drawGridBackdrop({width,height,left,right,top,bottom,plotWidth,plotHeight,years,start,end,x,y,scale,decimals:false,provisionalLabel:'2026 YTD'});
 for(const {year,papers} of yearTotals){
  if(activeList.length>1)svg+=`<text x="${x(year)}" y="${top-4}" text-anchor="middle" fill="var(--ink)" font-size="10.5" font-weight="600">Σ ${integer.format(papers)}</text>`;
 }
 svg+=drawSeriesGeometry({list:journals,activeIds:paperSeriesSet,years,start,end,left,top,plotWidth,plotHeight,x,y,obsFn:(j,yr)=>{const o=output(j,yr);return {value:o?.papers??null,kind:o?.periodKind??'annual'};},seriesAttr:'data-paper-series',pointClass:'',formatVal:number});
 svg+=`<g class="sub-hover" aria-hidden="true" pointer-events="none" hidden></g>`;
 chart.innerHTML=svg;
 const tot25=yearTotals.find(t=>t.year===2025),tot26=yearTotals.find(t=>t.year===2026);
 $('#papers-caption').textContent=`Tổng số bài xuất bản của nhóm đang chọn: năm 2025 đạt ${number(tot25?.papers)} bài (${number(tot25?.issues)} kỳ); năm 2026 đến 21/10/2026 đạt ${number(tot26?.papers)} bài (${number(tot26?.issues)} kỳ).`;
 if(subState.papers.year!==null)showPaperYear(subState.papers.year,true);
 const focusYear=papersFocusYear;
 $('#papers-bar-heading').textContent=`Số bài & kỳ xuất bản theo tạp chí (${focusYear} & 2026 YTD)`;
 $('#papers-bar-sub').textContent=`Sắp xếp theo số bài xuất bản năm ${focusYear}.`;
 const rows=journals.map(j=>({j,oFocus:output(j,focusYear),o26:output(j,2026)})).sort((a,b)=>(b.oFocus?.papers??0)-(a.oFocus?.papers??0));
 const maxPapers=Math.max(20,...rows.flatMap(r=>[r.oFocus?.papers??0,r.o26?.papers??0]));
 $('#papers-bars').innerHTML=renderComparisonItems(rows.map(({j,oFocus,o26})=>({
  j,color:styles[j.id].color,title:`${j.code} (${j.group}) · ${j.title}`,sub:'',
  rightBadge:`<strong>${number(oFocus?.papers)}</strong> bài (${number(oFocus?.issues)} kỳ)`,headline:`${number(oFocus?.papers)} bài`,
  label1:focusYear===2026?'':'2026*',num1:o26?.papers??0,val1Text:focusYear===2026?'':`${number(o26?.papers)} bài (${number(o26?.issues)} kỳ)`,
  label2:`${focusYear}${focusYear===2026?'*':''}`,num2:oFocus?.papers??0,val2Text:`${number(oFocus?.papers)} bài (${number(oFocus?.issues)} kỳ)`
 })),maxPapers);
}
function showPaperYear(year,force=false){
 const p=subState.papers.plot;if(!p||!p.years.includes(year))return;
 const active=journals.filter(j=>paperSeriesSet.has(j.id));if(!active.length)return;
 if(subState.papers.year===year&&!force)return;subState.papers.year=year;
 const rows=active.map(j=>({j,o:output(j,year)}));
 const totalPapers=rows.reduce((s,r)=>s+(r.o?.papers??0),0),totalIssues=rows.reduce((s,r)=>s+(r.o?.issues??0),0);
 $('#papers-tooltip-year').textContent='Số bài xuất bản '+year+(year===2026?' · đến 21/10/2026':'');
 $('#papers-tooltip-values').innerHTML=rows.map(({j,o})=>`<div class="tooltip-row"><dt><span class="tooltip-dot" style="background:${styles[j.id].color}"></span><span>${j.code}</span></dt><dd>${number(o?.papers)} bài (${number(o?.issues)} kỳ)</dd></div>`).join('')+`<div class="tooltip-row" style="border-top:1px solid var(--line);margin-top:4px;padding-top:4px"><dt><strong>Tổng (${rows.length} tạp chí)</strong></dt><dd><strong>${number(totalPapers)} bài (${number(totalIssues)} kỳ)</strong></dd></div>`;
 $('#papers-tooltip-note').textContent='';
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
function stepTheme(delta){
 const idx=brandThemes.findIndex(t=>t.id===currentTheme);
 const next=brandThemes[(idx+delta+brandThemes.length)%brandThemes.length];
 applyTheme(next.id,true);
}
function bindEvents(){
 $('.skip-link').addEventListener('click',event=>{event.preventDefault();$('#main-content').focus();$('#main-content').scrollIntoView({block:'start'});});
 $('#theme-select').addEventListener('change',e=>applyTheme(e.target.value,true));
 $('#theme-prev').addEventListener('click',()=>stepTheme(-1));
 $('#theme-next').addEventListener('click',()=>stepTheme(1));
 $('#theme-groups').addEventListener('click',e=>{const b=e.target.closest('button[data-group]');if(!b)return;activeThemeGroup=b.dataset.group;renderThemePills();});
 $('#theme-pills').addEventListener('click',e=>{const b=e.target.closest('button[data-theme]');if(b)applyTheme(b.dataset.theme,true);});
 document.addEventListener('click',event=>{
  const scrollLink=event.target.closest('[data-scroll-to]');
  if(!scrollLink)return;
  event.preventDefault();
  const targetId=scrollLink.dataset.scrollTo;
  if(location.hash.startsWith('#journal/'))history.pushState(null,'','#'+targetId);
  route(false);
  const el=document.getElementById(targetId);
  if(el)el.scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'start'});
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

 window.addEventListener('hashchange',()=>route(true));
 window.addEventListener('popstate',()=>{closeAllTooltips();readState();syncInputs();renderOverview();renderVast1Matrix();renderPortfolio();renderLegend();route();});
 new ResizeObserver(entries=>{const width=Math.round(entries[0].contentRect.width);if(width<=0||width===chartWidth)return;chartWidth=width;renderChart();}).observe($('.chart-area'));
 new ResizeObserver(entries=>{const width=Math.round(entries[0].contentRect.width);if(width<=0||width===subChartWidth)return;subChartWidth=width;renderCandidatesChart();renderCitationsChart();renderPapersChart();}).observe($('#candidates-chart-area'));
}
async function start(){
 try{
  renderThemeSelect();
  renderThemePills();
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
  syncInputs();renderOverview();renderVast1Matrix();renderPortfolio();renderReferences();renderLegend();bindEvents();route();$('#load-status').hidden=true;
 }catch(error){console.error(error);$('#load-status').hidden=true;$('#load-error').hidden=false;}
}
$('#retry-load').addEventListener('click',()=>location.reload());
start();
