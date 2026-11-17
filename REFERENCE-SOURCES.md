# Cmdlet reference catalog

Snapshot: November 17, 2026. **3,079 module/cmdlet entries; 2,850 distinct cmdlet names.**

| Documentation module | Entries |
| --- | ---: |
| ExchangePowerShell (Exchange Server, Exchange Online, EXO V2/V3 module, Security & Compliance) | 1,438 |
| MicrosoftTeams | 621 |
| Microsoft.Online.SharePoint.PowerShell | 329 |
| ActiveDirectory | 151 |
| AzureAD (legacy) | 230 |
| AzureADPreview (legacy) | 310 |
| **Total** | **3,079** |

Workload filters overlap: 896 Exchange Server, 731 Exchange Online, 35 Exchange Online module-specific commands, 276 Security & Compliance/IPPS, and 40 OneDrive-related SharePoint Online commands. Overlapping workloads are not extra entries. PowerShell names are case-insensitive; AzureAD and AzureADPreview module variants are separate entries with separate documentation and parameters.

## Sources and coverage

Official Microsoft documentation repositories:

- [Exchange and Teams](https://github.com/MicrosoftDocs/office-docs-powershell): `exchange/exchange-ps/ExchangePowerShell` and `teams/teams-ps/MicrosoftTeams`.
- [SharePoint Online](https://github.com/MicrosoftDocs/OfficeDocs-SharePoint-PowerShell): `sharepoint/sharepoint-ps/Microsoft.Online.SharePoint.PowerShell`.
- [Active Directory](https://github.com/MicrosoftDocs/windows-powershell-docs): `docset/winserver2025-ps/ActiveDirectory`.
- [Legacy AzureAD](https://github.com/Azure/azure-docs-powershell-azuread): `azureadps-2.0/AzureAD` and `azureadps-2.0-preview/AzureADPreview` (top-level cmdlet documents, excluding migration articles).

Exact source revision IDs are recorded in `reference-sources.json`. The Exchange, Teams, SharePoint Online and Active Directory inventories were compared, case-insensitively, with their complete Microsoft Learn module indexes; every listed name is present.

The catalog is a documentation snapshot, not a tenant inventory or a guarantee that every documented command still runs. RBAC, module versions, environment, preview availability and retired features affect actual availability. AzureAD/AzureADPreview are marked legacy/deprecated. Older Exchange-only commands retain their documented applicable versions. This catalog does not include SharePoint Server, PnP.PowerShell, Microsoft Graph, MSOnline or unrelated Azure modules.

OneDrive administration shares the SharePoint Online module. Its workload filter includes commands whose source documentation mentions OneDrive, personal sites or SPSPERS, plus session connection commands. There is no invented standalone OneDrive module. EXO V2/V3 are versions of ExchangeOnlineManagement, not duplicate inventories. IPPS uses Connect-IPPSSession; commands shared with Exchange retain all documented workload tags.

## Reference contents and search

Each entry has a description, applicability, session guidance, source links, searchable parameter names and example text. Full syntax, parameter descriptions and metadata, and all documented examples load on demand from content-hashed JSON files. Source formatting is simplified to plain text; code examples retain their documented content. A few common administration tasks have tailored examples and additional search tags. Empty source sections are not filled with invented documentation.

Search normalizes capitalization, spaces and hyphens, understands common action synonyms, and handles the reported `grand send-as` typo. Both workspace search and the cmdlet library use the same search function.

## Rebuild

The checked-in `index.html` and `assets/` work directly on GitHub Pages. Visitors do not need Node.js, PowerShell, or ChatGPT.

For development, run `npm ci`, `npm test`, then `npm run build`.

To regenerate the snapshot, download the source revisions in `reference-sources.json`, extract them under a staging directory with subdirectories `office`, `sharepoint`, `azuread`, and copy the ActiveDirectory markdown files into `ad`. Run:

```text
python3 scripts/build_reference.py /path/to/staging
npm test
npm run build
```

Commit the source JSON, generated detail files, manifest, compiled assets and HTML together. Update the snapshot date and source revisions when refreshing to newer documentation.

## Attribution

Documentation copyright Microsoft Corporation and contributors, adapted under [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/). Examples are under the source repositories' MIT code license. Licenses are included in `licenses/`. Each entry links to its original Microsoft document. Changes include extracted structure, plain-text formatting, workload classification, search tags and explicitly tailored examples.
