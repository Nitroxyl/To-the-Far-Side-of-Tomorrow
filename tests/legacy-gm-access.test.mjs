import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const rules=readFileSync(new URL('../firestore.rules',import.meta.url),'utf8');
test('GM authority is rooted in an immutable UID and a verified delegated role',()=>{
 assert.ok(rules.includes('function rootGm()'));
 assert.ok(rules.includes('function gm()'));
 assert.ok(rules.includes('request.auth.token.email_verified == true'));
 assert.ok(rules.includes('match /santara_gm_accounts/{uid}'));
 assert.ok(rules.includes('request.auth.uid == uid'));
 assert.ok(rules.includes('get(/databases/$(database)/documents/santara_gm_accounts/$(request.auth.uid)).data.email == request.auth.token.email'));

});
test('only founding GM can create, change or revoke GM roles',()=>{
 const start=rules.indexOf('match /santara_gm_accounts/{uid}');
 const end=rules.indexOf('match /santara_publication/current',start);
 assert.ok(start>=0&&end>start);
 const section=rules.slice(start,end);
 assert.ok(section.includes('allow create, update: if rootGm()'));
 assert.ok(section.includes('allow delete: if rootGm()'));
 assert.ok(section.includes('request.resource.data.grantedAt == request.time'));
 assert.ok(section.includes('santara_access_requests/$(uid)'));
 assert.ok(section.includes('.data.email == request.resource.data.email'));
});
test('Trainer access and member checks preserve existing approvals',()=>{
 assert.ok(rules.includes('function approved()'));
 assert.ok(rules.includes('function member()'));
 assert.ok(rules.includes('return gm() || approved();'));
 assert.equal((rules.match(/allow read, write: if false;/g)||[]).length,1);
});
