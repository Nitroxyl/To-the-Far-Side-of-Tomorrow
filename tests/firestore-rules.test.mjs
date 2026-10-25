import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const rules=readFileSync(new URL('../firestore.rules',import.meta.url),'utf8');

test('Firebase validators and catalog matches are complete',()=>{
 assert.ok(rules.includes("value.matches('^data:image/webp;base64,[A-Za-z0-9+/=]+$')"));
 assert.ok(rules.includes("value.matches('^https://.+$')"));
 assert.ok(rules.includes("d.slug.matches('^[a-z0-9-]{2,70}$')"));
 assert.ok(rules.includes('match /santara_custom_moves/{slug}'));
 assert.ok(rules.includes('match /santara_custom_abilities/{slug}'));
 assert.equal((rules.match(/allow read, write: if false;/g)||[]).length,1);
});

test('Security rules have balanced braces, parentheses and quoted strings',()=>{
 const stack=[],matching={')':'(',']':'[','}':'{'};
 let mode='code',quote='',line=1;
 for(let i=0;i<rules.length;i++){
  const c=rules[i],n=rules[i+1];
  if(c==='\n')line++;
  if(mode==='lineComment'){if(c==='\n')mode='code';continue}
  if(mode==='blockComment'){if(c==='*'&&n==='/'){mode='code';i++}continue}
  if(mode==='string'){if(c==='\\'){i++;continue}if(c===quote)mode='code';continue}
  if(c==='/'&&n==='/'){mode='lineComment';i++;continue}
  if(c==='/'&&n==='*'){mode='blockComment';i++;continue}
  if(c==='"'||c==="'"){mode='string';quote=c;continue}
  if('([{'.includes(c))stack.push({c,line});
  if(')]}'.includes(c)){
   const prior=stack.pop();
   assert.equal(prior?.c,matching[c],`Mismatched ${c} at line ${line}`);
  }
 }
 assert.notEqual(mode,'string','Unclosed rule string');
 assert.notEqual(mode,'blockComment','Unclosed comment');
 assert.deepEqual(stack,[],'Unclosed Firestore rule expression');
});
