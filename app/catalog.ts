import referenceIndex from './reference-index.json';
import stats from './reference-stats.json';

export const catalogStats=stats;
export const workloads=['Exchange Online','Exchange Online module (V2/V3)','Exchange Server','Active Directory','Teams','SharePoint Online','OneDrive','Security & Compliance (IPPS)','AzureAD (legacy)','AzureADPreview (legacy)'];
const keywords:Record<string,string>={
 'Add-RecipientPermission':'grant assign give add send as send-as sendas permission delegation mailbox distribution group',
 'Add-ADPermission':'grant assign give add send as send-as sendas permission delegation onprem hybrid',
 'Get-RecipientPermission':'read check view send as sendas delegation permissions',
 'Get-ADPermission':'read check view send as sendas delegation permissions onprem hybrid',
 'Remove-RecipientPermission':'remove revoke send as sendas delegation permission',
 'Remove-ADPermission':'remove revoke send as sendas delegation permission onprem hybrid',
 'Add-MailboxPermission':'grant add full access fullaccess shared mailbox delegation',
 'Get-MailboxPermission':'read check full access fullaccess shared mailbox delegation',
 'Get-EXOMailboxPermission':'read check full access fullaccess shared mailbox delegation',
 'Remove-MailboxPermission':'remove revoke full access fullaccess shared mailbox delegation',
 'Set-Mailbox':'grant add send on behalf sendonbehalf shared mailbox convert forwarding hide address list',
 'Set-RemoteMailbox':'hybrid onprem remote shared mailbox convert routing address',
 'Set-DistributionGroup':'grant add send on behalf sendonbehalf owner manager distribution list dl',
 'Get-DistributionGroup':'distribution list dl owners managers email proxy addresses',
 'Get-DistributionGroupMember':'distribution list dl members membership',
 'Add-DistributionGroupMember':'grant add distribution list dl member membership',
 'Get-MessageTraceV2':'email mail flow delivery trace message tracking',
 'Get-MessageTraceDetailV2':'email mail flow delivery trace events message tracking',
 'Connect-IPPSSession':'connect ippssession ipps session purview security compliance powershell',
 'Get-InboxRule':'mailbox inbox outlook rules forwarding junk',
 'Get-MailboxJunkEmailConfiguration':'junk spam safe blocked senders',
 'Request-SPOPersonalSite':'create provision onedrive personal site',
 'Get-SPOSite':'onedrive personal sites storage quota sharepoint',
 'Set-SPOSite':'onedrive personal site storage quota owner sharing',
 'Set-ADAccountPassword':'reset change active directory user password',
 'Unlock-ADAccount':'unlock active directory user account',
};
const examples:Record<string,string>={
 'Add-RecipientPermission':'Add-RecipientPermission -Identity shared@contoso.com -Trustee delegate@contoso.com -AccessRights SendAs -WhatIf',
 'Add-ADPermission':'Get-Recipient -Identity shared@contoso.com | Add-ADPermission -User "CONTOSO\\delegate" -ExtendedRights "Send As" -WhatIf',
 'Get-RecipientPermission':'Get-RecipientPermission -Identity shared@contoso.com',
 'Add-MailboxPermission':'Add-MailboxPermission -Identity shared@contoso.com -User delegate@contoso.com -AccessRights FullAccess -InheritanceType All -WhatIf',
 'Get-EXOMailbox':'Get-EXOMailbox -Identity shared@contoso.com',
 'Get-MessageTraceV2':'Get-MessageTraceV2 -RecipientAddress user@contoso.com -StartDate (Get-Date).AddDays(-2) -EndDate (Get-Date)',
 'Get-MessageTraceDetailV2':'Get-MessageTraceDetailV2 -MessageTraceId $traceId -RecipientAddress user@contoso.com',
};
export const catalog=referenceIndex.map(c=>({...c,keywords:keywords[c.name]||'',example:examples[c.name]||c.example}));
export type Command=typeof catalog[number];
export type ReferenceDetail={synopsis:string;description:string;syntax:string;parameters:{name:string;description:string;metadata:string}[];examples:{title:string;code:string;description:string}[];source:string};

export function normalizeSearch(value:string):string {
 return value.replace(/send[\s\-–—]*on[\s\-–—]*behalf(?:[\s\-–—]*of)?/gi,' sendonbehalf ')
  .replace(/send[\s\-–—]*as/gi,' sendas ').replace(/full[\s\-–—]*access/gi,' fullaccess ')
  .replace(/one[\s-]+drive/gi,' onedrive ').replace(/on[\s-]*prem(?:ises)?/gi,' onprem ')
  .replace(/([a-z0-9])([A-Z])/g,'$1 $2').toLowerCase()
  .replace(/[^a-z0-9]+/g,' ').trim().split(/\s+/)
  .map(w=>({grand:'add',grant:'add',assign:'add',give:'add',revoke:'remove',delete:'remove',create:'new',list:'get',show:'get'}[w]||w)).join(' ');
}
const searchIndex=catalog.map(command=>({command,text:normalizeSearch([command.name,command.name.toLowerCase().replaceAll('-',''),command.task,command.keywords,command.areas.join(' '),command.module,command.parameters.join(' '),command.parameters.join(' ').toLowerCase(),command.search,command.example].join(' '))}));
export function searchCatalog(query:string,area='All workloads',operation='All operations'):Command[] {
 const normalized=normalizeSearch(query),terms=normalized.split(' ').filter(Boolean);
 const nameQuery=query.toLowerCase().replace(/[^a-z0-9]/g,'');
 return searchIndex.filter(({command:c,text})=>(area==='All workloads'||c.areas.includes(area))&&(operation==='All operations'||c.operation===operation)&&terms.every(term=>text.includes(term)))
  .map(({command:c})=>({c,score:!query.trim()?0:c.name.toLowerCase().replace('-','')===nameQuery?1000:c.name.toLowerCase().replace('-','').startsWith(nameQuery)?300:terms.filter(t=>normalizeSearch(c.name+' '+c.keywords+' '+c.task).includes(t)).length*10+(normalizeSearch(c.name.split('-')[0])===terms[0]?5:0)}))
  .sort((a,b)=>b.score-a.score||a.c.name.localeCompare(b.c.name)||a.c.module.localeCompare(b.c.module)).map(x=>x.c);
}
const detailCache=new Map<string,Promise<Record<string,ReferenceDetail>>>();
export async function loadReference(command:Command):Promise<ReferenceDetail>{
 let request=detailCache.get(command.detailFile);
 if(!request){request=fetch(new URL('assets/reference/'+command.detailFile,document.baseURI)).then(r=>{if(!r.ok)throw Error('Reference details could not load. Use the Microsoft reference link or retry.');return r.json()}).catch(e=>{detailCache.delete(command.detailFile);throw e});detailCache.set(command.detailFile,request)}
 const details=await request;
 if(!details[command.id])throw Error('Reference entry is missing. Open the Microsoft reference link.');
 return details[command.id];
}
