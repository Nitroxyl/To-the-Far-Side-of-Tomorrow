// Regression checks for Santara Firestore rules. Run with: node --test tests/firestore-rules.test.mjs
// These check structural integrity; final compilation is done by Firebase on Publish.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const rules=readFileSync(new URL('../firestore.rules',import.meta.url),'utf8');

test('regex validators are complete',()=>{
  assert.ok(rules.includes("value.matches('^data:image/webp;base64,[A-Za-z0-9+/=]+$')"));
  assert.ok(rules.includes("value.matches('^https://.+$')"));
  assert.ok(rules.includes("d.slug.matches('^[a-z0-9-]{2,70}$')"));
});

test('deny-all catchall exists only once',()=>{
  assert.equal((rules.match(/allow read, write: if false;/g)||[]).length,1);
  assert.equal((rules.match(/match \/\{document=\*\*\} \{/g)||[]).length,1);
});

test('rules have balanced delimiters and closed quoted strings',()=>{
  let mode='code',quoted='',line=1;
  const stack=[],opening={')':'(',']':'[','}':'{'};
  for(let i=0;i<rules.length;i++){
    const c=rules[i],next=rules[i+1];
    if(c==='\n')line++;
    if(mode==='lineComment'){if(c==='\n')mode='code';continue;}
    if(mode==='blockComment'){if(c==='*'&&next==='/'){mode='code';i++;}continue;}
    if(mode==='string'){if(c==='\\'){i++;continue;}if(c===quoted)mode='code';continue;}
    if(c==='/'&&next==='/'){mode='lineComment';i++;continue;}
    if(c==='/'&&next==='*'){mode='blockComment';i++;continue;}
    if(c==='"'||c==="'"){mode='string';quoted=c;continue;}
    if('([{'.includes(c))stack.push({c,line});
    if(')]}'.includes(c)){
      const last=stack.pop();
      assert.equal(last?.c,opening[c],`Mismatched ${c} at line ${line}`);
    }
  }
  assert.notEqual(mode,'string','Unclosed string literal');
  assert.notEqual(mode,'blockComment','Unclosed block comment');
  assert.deepEqual(stack,[],'Unclosed delimiter(s)');
});
