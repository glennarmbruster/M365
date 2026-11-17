import {readBackup,type Workspace} from './backup';

const databaseName='m365-exchange-operations-hub';
type SavedWorkspace={revision:number,data:Workspace|null};
function openDatabase():Promise<IDBDatabase>{
 return new Promise((resolve,reject)=>{
  const request=indexedDB.open(databaseName,1);
  request.onupgradeneeded=()=>request.result.createObjectStore('workspace');
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(new Error('Browser storage is unavailable. Enable site storage and reload.'));
  request.onblocked=()=>reject(new Error('Close other Hub tabs and reload.'));
 });
}
export async function loadBrowserWorkspace():Promise<SavedWorkspace>{
 const db=await openDatabase();
 try{return await new Promise((resolve,reject)=>{
  const transaction=db.transaction('workspace','readonly');
  const request=transaction.objectStore('workspace').get('current');
  transaction.oncomplete=()=>{
   try{resolve(request.result?{revision:request.result.revision,data:readBackup(request.result.data)}:{revision:0,data:null})}
   catch(error){reject(error)}
  };
  transaction.onerror=()=>reject(transaction.error);
 })}finally{db.close()}
}
export async function saveBrowserWorkspace(revision:number,data:Workspace):Promise<number>{
 const checked=readBackup(data);
 const db=await openDatabase();
 try{return await new Promise((resolve,reject)=>{
  const transaction=db.transaction('workspace','readwrite');
  const store=transaction.objectStore('workspace');
  const request=store.get('current');
  let conflict=false;
  request.onsuccess=()=>{
   if((request.result?.revision||0)!==revision){conflict=true;transaction.abort();return}
   store.put({revision:revision+1,data:checked},'current');
  };
  transaction.oncomplete=()=>resolve(revision+1);
  transaction.onabort=()=>reject(new Error(conflict?'Another tab saved newer changes. Copy your edits and reload.':'Could not save in this browser. Export your workspace and check available storage.'));
  transaction.onerror=()=>{};
 })}finally{db.close()}
}
