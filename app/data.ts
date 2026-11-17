export const categories=['Distribution-group migrations','Shared-mailbox conversions','Mail-flow improvements','PowerShell administration tools','Security policies','Deprecations','Hybrid troubleshooting'];
export const stages=['Intake','Triage','Analysis','Action','ServiceNow summary'];
export const environments=['Hybrid','Cloud-only','Both'];
export const validations=['Needs confirmation','Independent validation needed','Verified'];
export const statuses=['Open','In progress','Blocked','Completed'];
export const fields={title:'Title',category:'Workstream',environment:'Environment impact',owner:'Owner',stage:'Workflow stage',status:'Status',validation:'Validation state',effective:'Effective date',announced:'Announcement date',next:'Next action',evidence:'Evidence or validation results',verifier:'Verified by',verifiedDate:'Verification date',blocker:'Blocker',notes:'Notes',checks:'Related scripts or checks',source:'Official Microsoft update URL',intake:'Request and scope',triage:'Priority and missing information',analysis:'Findings and checks',action:'Implementation, rollback and outcome'};
export type Item=Record<keyof typeof fields|string,string>;
export function blank():Item{return {...Object.fromEntries(Object.keys(fields).map(k=>[k,''])),id:'',title:'',category:categories[0],environment:'Hybrid',owner:'Glenn',stage:'Intake',status:'Open',validation:validations[0]}}
const seeds=[
 ['Distribution-group migration reconciliation','Check owners, membership and legacy addresses against the source export.','Get-DistributionGroupMember'],
 ['Shared-mailbox conversion pilot','Confirm the pilot scope and capture pre-conversion permissions.','Get-RemoteMailbox'],
 ['Message trace investigation workflow','Review delivery events and reconcile them with mailbox evidence.','Get-MessageTraceV2'],
 ['Exchange admin console session handling','Confirm how the launcher shares the active Exchange Online connection.','Get-ConnectionInformation'],
 ['EWS application access review','Capture the current organization configuration and confirm approved applications.','Get-OrganizationConfig'],
 ['Exchange deprecation review','Review official notices and confirm applicable dates for each tenant.',''],
 ['Hybrid recipient attribute review','Compare the on-premises recipient with its cloud representation.','Get-RemoteMailbox']
];
export const initial={items:seeds.map(([title,next,checks],i)=>({...blank(),id:'EX-'+(101+i),title,category:categories[i],next,checks,environment:[2,4].includes(i)?'Cloud-only':i===5?'Both':'Hybrid',notes:'Starter record. Confirm current project status and attach evidence.'})),history:[] as {when:string,title:string,text:string}[]};
