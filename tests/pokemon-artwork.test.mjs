import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const moduleSource=readFileSync(new URL('../pokemon-artwork.js',import.meta.url),'utf8');
const helpers=await import('data:text/javascript,'+encodeURIComponent(moduleSource));
const {artworkEntries,artworkFor,canUpdateArtwork,artworkPropagation}=helpers;

const original={spriteUrl:'',spriteData:''};
const next={spriteUrl:'',spriteData:'data:image/webp;base64,AA=='};
const species={id:'a',source:'custom',speciesKey:'custom:spinotroleum',spriteUrl:'',spriteData:''};
const megaForm={slug:'mega-charizard-z',name:'Mega Charizard Z',
 baseSpeciesKey:'charizard',baseStats:{hp:78,attack:63,defense:72,specialAttack:200,specialDefense:70,speed:151},
 types:['fire','dragon'],ability:"Kingdom's End",spriteData:'',spriteUrl:'',source:'custom'};

test('Artwork list includes imported original forms and Megas in sorted order',()=>{
 const items=artworkEntries([{key:'spinotroleum',name:'Spinotroleum'}, {slug:'rotom-server',name:'Rotom-Server'}],
  [{slug:'mega-charizard-z',name:'Mega Charizard Z',spriteData:next.spriteData}]);
 assert.equal(items.length,3);
 assert.deepEqual(items.map(x=>x.name),['Mega Charizard Z','Rotom-Server','Spinotroleum']);
 assert.equal(artworkFor({kind:'species',id:'spinotroleum'},[{slug:'spinotroleum',name:'Spinotroleum'}],[]).name,'Spinotroleum');
 assert.equal(artworkFor({kind:'mega',id:'mega-charizard-z'},[],[megaForm])?.name,'Mega Charizard Z');
});

test('Empty or inherited artwork can be updated while personal overrides stay unchanged',()=>{
 assert.equal(canUpdateArtwork({spriteData:'',spriteUrl:''},original),true);
 assert.equal(canUpdateArtwork({spriteData:'old',spriteUrl:''},{spriteData:'old',spriteUrl:''}),true);
 assert.equal(canUpdateArtwork({spriteData:'personal',spriteUrl:''},original),false);
 assert.equal(canUpdateArtwork({spriteData:'',spriteUrl:'https://override.example/p.png'},original),false);
});

test('An update to fossil art only changes matching default-art assigned Pokémon',()=>{
 const one={...species};
 const personalized={...species,id:'b',spriteUrl:'https://trainer.example/photo.png'};
 const other={...species,id:'c',speciesKey:'custom:mosasord'};
 const results=artworkPropagation('species','spinotroleum',original,next,[one,personalized,other]);
 assert.deepEqual(results,[{id:'a',patch:next}]);
 assert.equal(personalized.spriteUrl,'https://trainer.example/photo.png');
});

test('Mega artwork propagation updates the snapshot only and preserves battle stats',()=>{
 const mon={id:'mega-1',speciesKey:'charizard',spriteData:'regular-image',spriteUrl:'',
   megaForm};
 const result=artworkPropagation('mega','mega-charizard-z',original,next,[mon]);
 assert.equal(result.length,1);
 assert.equal(result[0].patch.megaForm.spriteData,next.spriteData);
 assert.deepEqual(result[0].patch.megaForm.baseStats,megaForm.baseStats);
 assert.deepEqual(result[0].patch.megaForm.types,megaForm.types);
 assert.equal(result[0].patch.megaForm.ability,"Kingdom's End");
 assert.ok(!('spriteData' in result[0].patch),'Base Charizard artwork must stay unchanged');
 assert.equal(mon.megaForm.spriteData,'','Do not mutate the original snapshot');
});

test('Previously inherited image can be replaced or removed while custom Mega artwork is spared',()=>{
 const previous={spriteData:'data:image/webp;base64,BB==',spriteUrl:''};
 const mons=[
  {id:'old',megaForm:{...megaForm,spriteData:previous.spriteData}},
  {id:'custom',megaForm:{...megaForm,spriteData:'user-custom'}},
  {id:'unrelated',megaForm:{...megaForm,slug:'mega-ceruledge'}}
 ];
 const results=artworkPropagation('mega','mega-charizard-z',previous,original,mons);
 assert.equal(results.length,1);
 assert.equal(results[0].id,'old');
 assert.equal(results[0].patch.megaForm.spriteData,'');
});

function runtime(){
 const party=readFileSync(new URL('../pokemon-party.js',import.meta.url),'utf8')
  .replace(/^import .*;\s*$/gm,'');
 const nodes=new Map();
 const element=id=>{
  if(!nodes.has(id))nodes.set(id,{textContent:'',innerHTML:'',addEventListener(){}});
  return nodes.get(id);
 };
 const writes=[],batched=[];
 const mon={...species};
 const old={slug:'spinotroleum',name:'Spinotroleum',spriteUrl:'',spriteData:'',
  baseStats:{hp:110,attack:140,defense:105,specialAttack:65,specialDefense:100,speed:80},
  types:['water','poison'],abilities:['Apex Predator']};
 const mock={
  document:{getElementById:element},window:{SANTARA_POKEMON_EDITION:'gm',SANTARA_FIREBASE_CONFIG:{projectId:'test'}},
  console:{warn(){}},initializeApp:()=>({}),getApps:()=>[],getApp:()=>({}),getAuth:()=>({}),getFirestore:()=>({}),
  onAuthStateChanged:()=>()=>{},collection:(_,path)=>({path}),doc:(_,path,id)=>({path,id}),query:x=>x,where:()=>({}),onSnapshot:()=>()=>{},
  getDoc:async()=>({exists:()=>true,data:()=>old}),
  setDoc:async()=>{},addDoc:async()=>{},deleteDoc:async()=>{},
  updateDoc:async(d,patch)=>{writes.push({d,patch})},
  writeBatch:()=>({update(d,patch){batched.push({d,patch})},commit:async()=>{}}),
  serverTimestamp:()=>({isServerTimestamp:true}),confirm:()=>true,
  ...helpers,
  SANTARA_CATALOG_GROUPS:[],santaraCatalogEntries:()=>[],
  statKeys:['hp','attack','defense','specialAttack','specialDefense','speed'],statLabels:[],
  validStats:()=>true,maxHpV4Baseline:()=>{},combatSummary:()=>{},fromPokeApi:()=>{},V52_TIERS:[],
  TYPE_NAMES:[],initialUnlocks:()=>({}),megaCompatible:()=>{},effectivePokemon:()=>{},
  TYPES:[],KEYS:[],unlockUI:()=>'',libraryUI:()=>'',editorUI:()=>'',controlsUI:()=>''
 };
 const fn=new Function(...Object.keys(mock),party+
  '\nuser={uid:GM_UID,email:"gm@example.test"};allowed=true;store={};collectionReady=true;pokemon='+JSON.stringify([mon])+
  ';customs=['+JSON.stringify(old)+'];artworkSelected={kind:"species",id:"spinotroleum"};view="artwork-edit";return {updateArtworkRecord,artworkEditorUI,artworkLibraryUI};');
 return {api:fn(...Object.values(mock)),writes,batched};
}
test('Already-synced Pokémon do not incur redundant Firestore updates',()=>{
 const inherited={...species,spriteData:next.spriteData};
 assert.deepEqual(artworkPropagation('species','spinotroleum',next,next,[inherited]),[]);
 const megaSynced={id:'synced-mega',megaForm:{...megaForm,spriteData:next.spriteData}};
 assert.deepEqual(artworkPropagation('mega','mega-charizard-z',next,next,[megaSynced]),[]);
});

test('GM artwork save updates template artwork only and propagates inherited images',async()=>{
 const {api,writes,batched}=runtime();
 const editor=api.artworkEditorUI();
 assert.match(editor,/artwork-upload/);
 assert.match(editor,/syncExisting/);
 assert.match(editor,/Remove artwork/);
 assert.match(editor,/Sync saved image/);
 await api.updateArtworkRecord(next,true);
 assert.equal(writes.length,1);
 assert.equal(writes[0].d.path,'santara_species_overrides');
 assert.deepEqual(Object.keys(writes[0].patch).sort(),['spriteData','spriteUrl','updatedAt']);
 assert.equal(batched.length,1);
 assert.equal(batched[0].d.path,'santara_pokemon');
 assert.equal(batched[0].patch.spriteData,next.spriteData);
});

test('GM saves without sync do not modify existing Pokémon instances',async()=>{
 const {api,writes,batched}=runtime();
 await api.updateArtworkRecord(next,false);
 assert.equal(writes.length,1);
 assert.equal(batched.length,0);
});
