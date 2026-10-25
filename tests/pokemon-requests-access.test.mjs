import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('Pokémon requests support approved Trainers AND GM accounts',()=>{
 const rules=readFileSync(new URL('../firestore.rules',import.meta.url),'utf8');
 const begin=rules.indexOf('match /santara_pokemon_requests/{requestId}');
 const end=rules.indexOf('match /santara_custom_abilities/{slug}',begin);
 assert.ok(begin>=0&&end>begin);
 const block=rules.slice(begin,end);
 assert.ok(block.includes('allow create: if member()'));
 assert.ok(!block.includes('allow create: if approved()'));
 assert.ok(block.includes('request.resource.data.ownerUid == request.auth.uid'));
 assert.ok(block.includes("request.resource.data.status == 'pending'"));
 assert.ok(block.includes('request.resource.data.createdAt == request.time'));
 assert.ok(block.includes('allow update: if gm()'));
 assert.ok(block.includes('allow delete: if gm()'));
});
test('Members cannot grant themselves a GM role',()=>{
 const rules=readFileSync(new URL('../firestore.rules',import.meta.url),'utf8');
 const i=rules.indexOf('match /santara_gm_accounts/{uid}');
 const j=rules.indexOf('match /santara_publication/current',i);
 assert.ok(i>=0&&j>i);
 assert.ok(rules.slice(i,j).includes('allow create, update: if rootGm()'));
});
