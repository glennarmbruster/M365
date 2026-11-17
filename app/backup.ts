import { blank,fields,stages,statuses,categories,environments,validations } from './data';
import type {Item} from './data';
export type Workspace = {items:Item[],history:{when:string,title:string,text:string}[]};
const format = 'exchange-operations-hub';
export function makeBackup(data:Workspace){
 return {format,version:1,exportedAt:new Date().toISOString(),data};
}
export function readBackup(input:unknown):Workspace{
 const fail=():never=>{throw new Error('Invalid or unsupported workspace backup. Your current workspace is unchanged.')};
 if(!input||typeof input!=='object')return fail();
 const envelope=input as Record<string,unknown>;
 if('format' in envelope&&(envelope.format!==format||envelope.version!==1))return fail();
 const value=('format' in envelope?envelope.data:envelope) as Workspace;
 if(!value||!Array.isArray(value.items)||!Array.isArray(value.history))return fail();
 const ids=new Set<string>();
 const allowed:Record<string,string[]>={stage:stages,status:statuses,category:categories,environment:environments,validation:validations};
 const items=value.items.map(raw=>{
  if(!raw||typeof raw!=='object'||typeof raw.title!=='string'||!raw.title.trim()||!/^EX-[1-9]\d*$/.test(raw.id)||ids.has(raw.id))return fail();
  ids.add(raw.id);
  const item=blank(); item.id=raw.id;
  for(const key of Object.keys(fields)){if(key in raw){if(typeof raw[key]!=='string')return fail();item[key]=raw[key]}}
  if(Object.entries(allowed).some(([key,choices])=>!choices.includes(item[key])))return fail();
  if(item.validation==='Verified'&&(!item.evidence.trim()||!item.verifier.trim()||!item.verifiedDate))return fail();
  return item;
 });
 const history=value.history.map(entry=>{
  if(!entry||!['when','title','text'].every(key=>typeof (entry as Record<string,unknown>)[key]==='string')||!Number.isFinite(Date.parse(entry.when)))return fail();
  return {when:entry.when,title:entry.title,text:entry.text};
 });
 return {items,history};
}
