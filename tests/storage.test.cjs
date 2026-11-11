const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const source=readFileSync(require('node:path').join(__dirname,'../app.js'),'utf8');
const storageCode=source.slice(source.indexOf("const fallbackKey="),source.indexOf('function navigate('));
const picture='data:image/jpeg;base64,AAAA';
const word=(id)=>({id,name:id+'.jpg',answer:id,image:picture});
function setup({stored={},fallback=null,failRead=false,failWrite=false}={}){
  const local=new Map(fallback?[['kalima-library-backup-v1',JSON.stringify(fallback)]]:[]);
  const db={transaction(){const tx={error:new Error('quota'),objectStore:()=>({put(value,key){stored[key]=value}})};queueMicrotask(()=>failWrite?tx.onabort():tx.oncomplete());return tx}};
  const state={words:[],history:[],db:null,persistent:true,savedAt:null,storageMode:'indexeddb',storageProtected:false};
  const sandbox={state,navigator:{storage:{persisted:async()=>false,persist:async()=>false}},localStorage:{getItem:k=>local.get(k)||null,setItem:(k,v)=>local.set(k,v),removeItem:k=>local.delete(k)},openDB:async()=>{if(failRead)throw new Error('unavailable');return db},dbGet:async key=>stored[key],toast:()=>{},Date,Map,Error,Promise};
  vm.createContext(sandbox);vm.runInContext(storageCode+';this.api={collectionSnapshot,restoreCollection,persist,loadCollection}',sandbox);
  return {state,api:sandbox.api,local,stored,db};
}
test('history pictures are deduplicated and deleted or edited word snapshots restore intact',()=>{
 const {state,api}=setup();state.words=[word('new')];state.history=[{id:'round',results:[{word:word('old'),answer:'wrong',correct:false},{word:word('old'),answer:'old',correct:true}]}];
 const saved=api.collectionSnapshot();assert.equal(saved.historyImages.length,1);assert.equal(saved.history[0].results[0].word.image,undefined);
 state.words=[];state.history=[];api.restoreCollection(saved);
 assert.equal(state.words[0].answer,'new');assert.equal(state.history[0].results[0].word.answer,'old');assert.equal(state.history[0].results[0].word.image,picture);assert.equal(state.history[0].results[0].correct,false);
});
test('a collection saved long ago has no application expiry',async()=>{
 const {state,api}=setup({stored:{words:[word('old')],history:[],savedAt:'2020-01-01T00:00:00.000Z'}});
 await api.loadCollection();assert.equal(state.words.length,1);assert.equal(state.words[0].id,'old');assert.equal(state.savedAt,'2020-01-01T00:00:00.000Z');
});
test('failed IndexedDB writes fall back to localStorage and survive reopening',async()=>{
 const first=setup({failWrite:true});first.state.db=first.db;first.state.words=[word('earlier'),word('added-after-rounds')];first.state.history=[{id:'played',results:[{word:word('earlier'),answer:'wrong',correct:false}]}];
 assert.equal(await first.api.persist(),true);assert.equal(first.state.storageMode,'localstorage');
 const saved=JSON.parse(first.local.get('kalima-library-backup-v1'));
 const reopened=setup({failRead:true,fallback:saved});await reopened.api.loadCollection();
 assert.equal(reopened.state.words.length,2);assert.equal(reopened.state.words[0].answer,'earlier');assert.equal(reopened.state.history[0].results[0].word.image,picture);
});
test('a newer fallback is recovered into IndexedDB instead of loading stale words',async()=>{
 const x=setup({stored:{words:[word('old')],history:[],savedAt:'2020-01-01T00:00:00.000Z'},fallback:{words:[word('old'),word('new')],history:[],historyImages:[],savedAt:'2026-11-11T00:00:00.000Z'}});
 await x.api.loadCollection();assert.equal(x.state.words.length,2);assert.equal(x.stored.words.length,2);assert.equal(x.state.storageMode,'indexeddb');assert.equal(x.local.has('kalima-library-backup-v1'),false);
});
