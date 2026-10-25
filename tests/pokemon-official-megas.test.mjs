import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const megaCode=readFileSync(new URL('../pokemon-official-megas.js',import.meta.url),'utf8');
const mathCode=readFileSync(new URL('../pokemon-math.js',import.meta.url),'utf8');
const bundled=mathCode.replace(/\bexport\s+(?=(async\s+)?(const|function)\b)/g,'')+'\n'+
 megaCode.replace(/^import .*;\s*$/gm,'').replace(/\bexport\s+(?=(async\s+)?(const|function)\b)/g,'');
const {discoverOfficialMegas,mergeMegaOptions,megaDisplayName}=
 new Function(bundled+'\nreturn {discoverOfficialMegas,mergeMegaOptions,megaDisplayName}')();

function payload(name,stat,types,ability){
 return {name,stats:Object.entries(stat).map(([name,base_stat])=>({stat:{name},base_stat})),
  types:types.map((name,i)=>({slot:i+1,type:{name}})),abilities:[{ability:{name:ability}}],
  sprites:{other:{'official-artwork':{front_default:'https://example.org/'+name+'.png'}}}};
}
const x={hp:78,attack:130,defense:111,'special-attack':130,'special-defense':85,speed:100};
const y={hp:78,attack:104,defense:78,'special-attack':159,'special-defense':115,speed:100};
async function mockFetch(url) {
 let value;
 if(url.endsWith('/pokemon-species/charizard/'))value={varieties:[
  {pokemon:{name:'charizard'}},{pokemon:{name:'charizard-mega-x'}},{pokemon:{name:'charizard-mega-y'}},{pokemon:{name:'charizard-gmax'}}]};
 if(url.endsWith('/pokemon/charizard-mega-x/'))value=payload('charizard-mega-x',x,['fire','dragon'],'tough-claws');
 if(url.endsWith('/pokemon/charizard-mega-y/'))value=payload('charizard-mega-y',y,['fire','flying'],'drought');
 return {ok:!!value,status:value?200:404,json:async()=>value};
}
test('automatically discovers X and Y, excluding Gigantamax varieties',async()=>{
 const forms=await discoverOfficialMegas('charizard',mockFetch);
 assert.deepEqual(forms.map(f=>f.name),['Mega Charizard X','Mega Charizard Y']);
 assert.equal(forms[0].baseSpeciesKey,'charizard');
 assert.equal(forms[1].baseStats.specialAttack,159);
 assert.equal(forms[0].source,'official');
});
test('registered custom Mega Z coexists and GM overrides win',async()=>{
 const official=await discoverOfficialMegas('charizard',mockFetch);
 const z={slug:'mega-charizard-z',name:'Mega Charizard Z',baseSpeciesKey:'charizard',source:'custom'};
 assert.deepEqual(mergeMegaOptions(official,[z]).map(x=>x.name),['Mega Charizard X','Mega Charizard Y','Mega Charizard Z']);
 const revised={...official[0],slug:'mega-charizard-x',ability:'reworked-claws'};
 assert.equal(mergeMegaOptions(official,[revised,z]).find(x=>x.name==='Mega Charizard X').ability,'reworked-claws');
 assert.equal(megaDisplayName('lucario-mega'),'Mega Lucario');
});
test('unavailable external API surfaces an error without relying on Firebase writes',async()=>{
 await assert.rejects(discoverOfficialMegas('charizard',async()=>({ok:false,status:503})),/Species lookup failed/);
 assert.deepEqual(await discoverOfficialMegas('custom:spinotroleum',mockFetch),[]);
});
