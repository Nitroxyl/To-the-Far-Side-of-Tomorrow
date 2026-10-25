import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const catalogSource=readFileSync(new URL('../santara-catalog.js',import.meta.url),'utf8');
const catalog=new Function(catalogSource.replace(/\bexport (const|function)\b/g,'$1')+
 '\nreturn {SANTARA_CATALOG_GROUPS,santaraCatalogEntries}')();
const party=readFileSync(new URL('../pokemon-party.js',import.meta.url),'utf8').replace(/^import .*;\s*$/gm,'');

function harness({deniedRead=null,deniedWrite=null,existing=new Set()}={}){
 const nodes=new Map();
 const node=id=>{
  if(!nodes.has(id))nodes.set(id,{textContent:'',innerHTML:'',addEventListener(){}});
  return nodes.get(id);
 };
 const writes=[],committed=[];
 const denied=()=>Object.assign(new Error('Missing or insufficient permissions.'),{code:'permission-denied'});
 const mock={
  document:{getElementById:node},window:{SANTARA_POKEMON_EDITION:'gm',SANTARA_FIREBASE_CONFIG:{projectId:'test'}},
  console:{warn(){}},initializeApp:()=>({}),getApps:()=>[],getApp:()=>({}),
  getAuth:()=>({}),getFirestore:()=>({}),onAuthStateChanged:()=>()=>{},
  collection:(_,path)=>({path}),doc:(_,path,id)=>({path,id}),query:x=>x,where:()=>({}),
  onSnapshot:()=>()=>{},setDoc:async()=>{},addDoc:async()=>{},
  deleteDoc:async()=>{},updateDoc:async()=>{},
  getDoc:async d=>{if(d.path===deniedRead)throw denied();return {exists:()=>existing.has(d.path+'/'+d.id)};},
  writeBatch:()=>{const operations=[];return {
    set(d,data){operations.push({d,data});writes.push({d,data})},
    async commit(){
      if(operations.some(x=>x.d.path===deniedWrite))throw denied();
      committed.push(...operations);
    }
  };},
  serverTimestamp:()=>({serverTime:true}),confirm:()=>true,
  ...catalog,statKeys:['hp','attack','defense','specialAttack','specialDefense','speed'],statLabels:[],
  validStats:()=>true,maxHpV4Baseline:()=>{},combatSummary:()=>{},fromPokeApi:()=>{},V52_TIERS:[],
  TYPE_NAMES:[],initialUnlocks:()=>({}),megaCompatible:()=>{},effectivePokemon:()=>{},
  TYPES:[],KEYS:[],unlockUI:()=>'',libraryUI:()=>'',editorUI:()=>'',controlsUI:()=>''
 };
 const fn=new Function(...Object.keys(mock),party+
  '\nuser={uid:GM_UID,email:"gm@example.test"};allowed=true;store={};return {importSantaraGroup,santaraImportFailure};');
 return {api:fn(...Object.values(mock)),writes,committed,node};
}

test('Denied reads identify the missing Firestore path and request live rules publish',async()=>{
 const {api,committed}=harness({deniedRead:'santara_mega_forms'});
 await assert.rejects(api.importSantaraGroup('megas'),error=>
  /reading santara_mega_forms\//.test(error.message) &&
  /Firebase Console/.test(error.message) &&
  /Rules on GitHub do not deploy automatically/.test(error.message));
 assert.equal(committed.length,0);
});

test('Denied Mega writes identify the collection and keep the whole Mega batch untouched',async()=>{
 const {api,committed}=harness({deniedWrite:'santara_mega_forms'});
 await assert.rejects(api.importSantaraGroup('megas'),/writing santara_mega_forms \(17 records\)/);
 assert.equal(committed.length,0);
});

test('Separate batches preserve Mega forms even if custom abilities are denied',async()=>{
 const {api,committed}=harness({deniedWrite:'santara_custom_abilities'});
 await assert.rejects(api.importSantaraGroup('megas'),error=>
  /writing santara_custom_abilities \(7 records\)/.test(error.message) &&
  /17 definition\(s\) were imported before this failure/.test(error.message));
 assert.equal(committed.length,17);
 assert.ok(committed.every(x=>x.d.path==='santara_mega_forms'));
});

test('Already existing entries remain untouched',async()=>{
 const existing=new Set(catalog.santaraCatalogEntries('fossils')
  .map(x=>x.collection+'/'+x.id));
 const {api,committed}=harness({existing});
 await api.importSantaraGroup('fossils');
 assert.equal(committed.length,0);
});
