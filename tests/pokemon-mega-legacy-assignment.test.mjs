import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const rules=readFileSync(new URL('../firestore.rules',import.meta.url),'utf8');
test('GM can assign a Pokémon without creating a separate Trainer approval',()=>{
 const app=readFileSync(new URL('../pokemon-party.js',import.meta.url),'utf8');
 assert.ok(app.includes('all.set(user.uid,{uid:user.uid,currentGm:true})'));
 assert.ok(app.includes('if(GM_SITE&&user?.uid&&!ownerFilter)ownerFilter=user.uid'));
 assert.ok(app.includes('const selectedMega=megaSlug?megaChoiceFor(d).find'));
});
test('Legacy Pokémon need not contain every newer gimmick field for updates',()=>{
 const pos=rules.indexOf('function pokemonValid(d) {');
 assert.ok(pos>=0);
 const requiredStart=rules.indexOf('&& d.keys().hasAll([',pos);
 const requiredEnd=rules.indexOf('])',requiredStart);
 const required=rules.slice(requiredStart,requiredEnd);
 assert.ok(required.includes("'ownerUid'"));
 for(const key of ['megaForm','teraActive','megaActive','dynamaxTurns','dynamaxUsed','zUsed','teraType'])
  assert.ok(!required.includes("'"+key+"'"),key+' should remain optional');
 const allowedStart=rules.indexOf('d.keys().hasOnly([',pos);
 const allowedEnd=rules.indexOf('])',allowedStart);
 const allowed=rules.slice(allowedStart,allowedEnd);
 assert.ok(allowed.includes("'megaForm'"));
 assert.ok(allowed.includes("'dynamaxTurns'"));
});
test('Existing GM-only Pokemon creation/update protection is retained',()=>{
 const idx=rules.indexOf('match /santara_pokemon/{pokemonId}');
 const tail=rules.slice(idx,idx+2200);
 assert.ok(tail.includes('allow create: if gm() && pokemonValid(request.resource.data)'));
 assert.ok(tail.includes('allow update: if gm() && pokemonValid(request.resource.data)'));
 assert.equal((rules.match(/allow read, write: if false;/g)||[]).length,1);
});
