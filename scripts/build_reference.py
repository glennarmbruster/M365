"""Build the searchable catalog from the unmodified Microsoft documentation sources.

Usage: python3 scripts/build_reference.py ../m365-docs
See REFERENCE-SOURCES.md for source directories and licensing.
"""
import collections
import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCES = Path(sys.argv[1]).resolve()
DATE = '2026-11-17'

def plain(text):
    text = re.sub(r'\[([^\]]+)\]\([^)]*\)', r'\1', text)
    text = re.sub(r'<https?://[^>]+>', '', text)
    text = re.sub(r'\[!(NOTE|IMPORTANT|WARNING|TIP|CAUTION)\]', r'\1:', text)
    text = re.sub(r'(?m)^>\s?', '', text)
    return re.sub(r'[*`]', '', text).strip()

def section(text, title):
    m = re.search(r'^## '+re.escape(title)+r'\s*\n(.*?)(?=^## |\Z)', text, re.M|re.S|re.I)
    return m[1].strip() if m else ''

def blocks(text):
    return re.findall(r'```[^\n]*\n(.*?)```', text, re.S)

def clean_code(code):
    return re.sub(r'(?m)^\s*PS(?: [^>\n]*)?>\s*', '', code).strip()

configs = [
    ('office/exchange/exchange-ps/ExchangePowerShell','exchangepowershell','Exchange PowerShell','MicrosoftDocs/office-docs-powershell','exchange/exchange-ps/ExchangePowerShell'),
    ('office/teams/teams-ps/MicrosoftTeams','microsoftteams','Teams','MicrosoftDocs/office-docs-powershell','teams/teams-ps/MicrosoftTeams'),
    ('sharepoint/sharepoint/sharepoint-ps/Microsoft.Online.SharePoint.PowerShell','microsoft.online.sharepoint.powershell','SharePoint Online','MicrosoftDocs/OfficeDocs-SharePoint-PowerShell','sharepoint/sharepoint-ps/Microsoft.Online.SharePoint.PowerShell'),
    ('ad','activedirectory','Active Directory','MicrosoftDocs/windows-powershell-docs','docset/winserver2025-ps/ActiveDirectory'),
    ('azuread/azureadps-2.0/AzureAD','azuread','AzureAD (legacy)','Azure/azure-docs-powershell-azuread','azureadps-2.0/AzureAD'),
    ('azuread/azureadps-2.0-preview/AzureADPreview','azureadpreview','AzureADPreview (legacy)','Azure/azure-docs-powershell-azuread','azureadps-2.0-preview/AzureADPreview'),
]
rows=[]
details={}
source_counts={}
for folder,module,default_area,repo,repo_path in configs:
    count=0
    for file in sorted((SOURCES/folder).glob('*.md')):
        name=file.stem
        if not re.fullmatch(r'[A-Za-z]+-[A-Za-z0-9]+',name):
            continue
        raw=file.read_text(encoding='utf-8-sig')
        synopsis=section(raw,'SYNOPSIS')
        if not synopsis:
            synopsis=section(raw,'DESCRIPTION').split('\n\n')[0] or 'Consult the Microsoft reference for this command.'
        count+=1
        meta={k.lower():v.strip() for k,v in re.findall(r'^([^:\n]+):\s*([^\n]*)$',raw.split('---',2)[1],re.M)}
        applicable=meta.get('applicable','')
        description=plain(section(raw,'DESCRIPTION'))
        source='https://github.com/'+repo+'/blob/main/'+repo_path+'/'+file.name
        task=plain(synopsis)
        paragraphs=task.split('\n\n')
        substantive=[p for p in paragraphs if not p.startswith(('This cmdlet is available','For information about the parameter sets'))]
        task=re.sub(r'\s+',' ',substantive[0] if substantive else task)
        areas=[default_area]
        session=''
        status='Reference'
        if module=='exchangepowershell':
            areas=[]
            if 'Exchange Server' in applicable: areas.append('Exchange Server')
            if 'Exchange Online' in applicable: areas.append('Exchange Online')
            if 'Security & Compliance' in applicable: areas.append('Security & Compliance (IPPS)')
            if 'only in the Exchange Online PowerShell module' in synopsis or name in ['Connect-ExchangeOnline','Disconnect-ExchangeOnline','Connect-IPPSSession','Get-ConnectionInformation']:
                areas.append('Exchange Online module (V2/V3)')
            if name=='Connect-IPPSSession' and 'Security & Compliance (IPPS)' not in areas: areas.append('Security & Compliance (IPPS)')
            if not areas: raise ValueError('Missing Exchange applicability: '+name)
            session='; '.join({'Exchange Server':'Exchange Management Shell','Exchange Online':'Connect-ExchangeOnline','Security & Compliance (IPPS)':'Connect-IPPSSession','Exchange Online module (V2/V3)':'ExchangeOnlineManagement module'}[a] for a in areas)+'. Select the session for the documented environment.'
            if areas==['Exchange Server'] and 'Exchange Server 2019' not in applicable and 'Exchange Server SE' not in applicable: status='Older Exchange versions'
        elif module=='microsoftteams': session='Connect-MicrosoftTeams.'
        elif module=='activedirectory':
            session='Import-Module ActiveDirectory (RSAT), with access to your directory.'
            applicable='Windows Server 2025 ActiveDirectory reference; check your installed RSAT/module version.'
        elif module=='microsoft.online.sharepoint.powershell':
            session='Connect-SPOService -Url https://contoso-admin.sharepoint.com'
            applicable=applicable or 'SharePoint Online'
            if re.search(r'OneDrive|personal\s+sites?|SPSPERS',raw,re.I) or name in ['Connect-SPOService','Disconnect-SPOService']:
                areas.append('OneDrive')
        else:
            status='Legacy / deprecated'
            session='Legacy AzureAD module reference only. AzureAD and AzureADPreview are deprecated; do not assume these commands remain operational.'
            applicable=default_area
        area='Exchange Server + Online' if 'Exchange Server' in areas and 'Exchange Online' in areas else areas[0]
        verb=name.split('-')[0]
        operation='Read' if verb in ['Get','Find','Search','Test','Compare','Measure'] else 'Change' if verb in ['Add','Set','New','Remove','Enable','Disable','Grant','Revoke','Update','Clear','Reset','Start','Stop','Suspend','Resume','Restore','Move','Rename','Unlock','Revoke','Approve','Deny','Request','Submit','Publish','Unpublish','Complete','Undo','Invoke','Install','Uninstall','Sync','Convert','Import','Mount','Dismount'] else 'Check reference'
        parameter_section=section(raw,'PARAMETERS')
        parameters=[]
        for match in re.finditer(r'^### -([^\n]+)\n(.*?)(?=^### |\Z)',parameter_section,re.M|re.S):
            pname=match[1].strip()
            body=match[2].strip()
            body=re.sub(r'```yaml.*?```','',body,flags=re.S)
            metadata='\n\n'.join(blocks(match[2]))
            parameters.append({'name':pname,'description':plain(body),'metadata':metadata})
        examples=[]
        for part in re.split(r'^### ',section(raw,'EXAMPLES'),flags=re.M)[1:]:
            title,_,body=part.partition('\n')
            code=blocks(body)
            if code:
                explanation=plain(re.sub(r'```.*?```','',body,flags=re.S))
                examples.append({'title':plain(title),'code':'\n\n'.join(clean_code(c) for c in code),'description':explanation})
        syntax='\n\n'.join(clean_code(c) for c in blocks(section(raw,'SYNTAX')))
        url=meta.get('online version','')
        if not url.startswith('https://learn.microsoft.com/'):
            url=source if module.startswith('azuread') else 'https://learn.microsoft.com/powershell/module/'+module+'/'+name.lower()
        if module=='activedirectory': url='https://learn.microsoft.com/powershell/module/activedirectory/'+name.lower()+'?view=windowsserver2025-ps'
        ident=module+'/'+name.lower()
        # Index the complete descriptive text, parameter names and example prose.
        search=re.sub(r'\s+',' ',description+' '+plain(section(raw,'EXAMPLES')))
        row={'id':ident,'name':name,'module':module,'area':area,'areas':areas,'task':task,'parameters':[p['name'] for p in parameters],'operation':operation,'url':url,'source':source,'applicable':applicable,'session':session,'status':status,'search':search,'example':clean_code(examples[0]['code']) if examples and len(examples[0]['code'])<1600 else 'Get-Help '+name+' -Full'}
        rows.append(row)
        details[ident]={'synopsis':plain(synopsis),'description':description,'syntax':syntax,'parameters':parameters,'examples':examples,'source':source}
    source_counts[module]=count

rows.sort(key=lambda r:(r['name'].lower(),r['module']))
assert len({r['id'] for r in rows})==len(rows)
out=ROOT/'assets/reference'
out.mkdir(parents=True,exist_ok=True)
for old in out.glob('*.json'): old.unlink()
for start in range(0,len(rows),80):
    group=rows[start:start+80]
    content=json.dumps({r['id']:details[r['id']] for r in group},ensure_ascii=False,separators=(',',':'))
    filename=f'commands-{start//80:02d}-'+hashlib.sha256(content.encode()).hexdigest()[:10]+'.json'
    (out/filename).write_text(content)
    for r in group:r['detailFile']=filename
(ROOT/'app/reference-index.json').write_text(json.dumps(rows,ensure_ascii=False,separators=(',',':')))
stats={'indexedDate':DATE,'entries':len(rows),'uniqueNames':len({r['name'].lower() for r in rows}),'modules':source_counts,'workloads':dict(sorted(collections.Counter(a for r in rows for a in r['areas']).items())),'primaryAreas':dict(sorted(collections.Counter(r['area'] for r in rows).items()))}
(ROOT/'app/reference-stats.json').write_text(json.dumps(stats,indent=2)+'\n')
print(json.dumps(stats,indent=2))
print('Index bytes:',(ROOT/'app/reference-index.json').stat().st_size,'Detail bytes:',sum(p.stat().st_size for p in out.glob('*.json')))
