import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';

const root=fileURLToPath(new URL('../',import.meta.url));
const compiled=await build({absWorkingDir:root,entryPoints:['app/catalog.ts'],bundle:true,platform:'node',format:'esm',write:false});
const {catalog,catalogStats,searchCatalog,workloads,loadReference}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
assert.equal(catalog.length,catalogStats.entries);
assert.equal(new Set(catalog.map(c=>c.id)).size,catalog.length);
assert.equal(new Set(catalog.map(c=>c.name.toLowerCase())).size,catalogStats.uniqueNames);
for(const [module,count] of Object.entries(catalogStats.modules))assert.equal(catalog.filter(c=>c.module===module).length,count,module);
for(const area of workloads)assert.equal(searchCatalog('',area).length,catalogStats.workloads[area],area);
for(const query of ['grant send-as','grand send-as','grant send as','assign sendas']){
 assert.equal(searchCatalog(query,'Exchange Online')[0].name,'Add-RecipientPermission',query);
 assert.equal(searchCatalog(query,'Exchange Server')[0].name,'Add-ADPermission',query);
 assert.ok(!searchCatalog(query,'Exchange Online').some(c=>c.name==='Add-ADPermission'));
}
for(const [query,area,wanted] of [
 ['full access','Exchange Online','Add-MailboxPermission'],
 ['reset AD password','Active Directory','Set-ADAccountPassword'],
 ['onedrive storage','OneDrive','Get-SPOSite'],
 ['send on behalf','Exchange Online','Set-Mailbox'],
 ['compliance search','Security & Compliance (IPPS)','Get-ComplianceSearch'],
 ['Get-EXOMailbox','Exchange Online module (V2/V3)','Get-EXOMailbox'],
 ['get-aduser','Active Directory','Get-ADUser'],
 ['IncludePersonalSite','OneDrive','Get-SPOSite'],
 ['Connect-IPPSSession','Security & Compliance (IPPS)','Connect-IPPSSession'],
 ['Get-AzureADUser','AzureAD (legacy)','Get-AzureADUser'],
 ['Get-CsTeamsMeetingPolicy','Teams','Get-CsTeamsMeetingPolicy'],
])assert.ok(searchCatalog(query,area).slice(0,6).some(c=>c.name===wanted),query+' → '+wanted);
assert.equal(searchCatalog('zzzz-no-such-command-zzzz').length,0);
assert.ok(searchCatalog('grant send-as','Exchange Online','Change').every(c=>c.operation==='Change'));
assert.ok(catalog.filter(c=>c.module.startsWith('azuread')).every(c=>c.status==='Legacy / deprecated'));
// Every indexed command has its own detail entry; no missing or orphaned references.
const details=new Map();
for(const file of new Set(catalog.map(c=>c.detailFile))){
 const data=JSON.parse(await readFile(root+'assets/reference/'+file,'utf8'));
 for(const [id,detail] of Object.entries(data)){assert.ok(!details.has(id));details.set(id,detail)}
}
assert.equal(details.size,catalog.length);
for(const c of catalog){
 const detail=details.get(c.id);assert.ok(detail,c.id);
 assert.deepEqual(detail.parameters.map(p=>p.name),c.parameters,c.id+' parameters');
 assert.ok(c.source.startsWith('https://github.com/'));
 assert.ok(/^https:\/\/(learn.microsoft.com|github.com)\//.test(c.url));
}
assert.ok(details.get('exchangepowershell/add-recipientpermission').syntax.includes('-AccessRights'));
assert.ok(details.get('exchangepowershell/add-recipientpermission').parameters.find(p=>p.name==='AccessRights').metadata.includes('Required: True'));
assert.ok(details.get('microsoftteams/get-team').examples.length);
// Check GitHub Pages subpath loading, cache reuse and recovery from a failed fetch.
const originalFetch=globalThis.fetch;
globalThis.document={baseURI:'https://example.test/M365/'};
let calls=0,shouldFail=true;
globalThis.fetch=async url=>{
 calls++;assert.ok(String(url).startsWith('https://example.test/M365/assets/reference/'));
 if(shouldFail){shouldFail=false;return {ok:false}}
 return {ok:true,json:async()=>JSON.parse(await readFile(root+new URL(url).pathname.replace('/M365/',''),'utf8'))};
};
const cmd=catalog.find(c=>c.name==='Add-RecipientPermission');
await assert.rejects(loadReference(cmd),/could not load/);
assert.ok((await loadReference(cmd)).syntax.includes('-Trustee'));
await loadReference(cmd);assert.equal(calls,2);
globalThis.fetch=originalFetch;delete globalThis.document;
console.log('PASS: '+catalog.length+' catalog entries; search, filters, counts, detail integrity, subpath loading and retry/cache behavior.');
