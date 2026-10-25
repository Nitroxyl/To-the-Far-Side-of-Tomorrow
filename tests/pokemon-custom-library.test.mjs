import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const code=readFileSync(new URL('../pokemon-custom-library.js',import.meta.url),'utf8');
const {customContentLibraryUI}=await import('data:text/javascript;charset=utf-8,'+encodeURIComponent(code));
const esc=x=>String(x).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

test('GM library lists all saved kinds and exposes edit, add and delete controls',()=>{
 const html=customContentLibraryUI({
  species:[{slug:'spinotroleum',name:'Spinotroleum',types:['water','rock'],baseStats:{hp:100,attack:130}}],
  megas:[{slug:'mega-charizard-z',name:'Mega Charizard Z',baseSpeciesKey:'charizard',source:'custom'}],
  moves:[{slug:'primordial-crush',name:'Primordial Crush',type:'ground',category:'Physical',description:'Ground tremor'}],
  abilities:[{slug:'apex-predator',name:'Apex Predator',description:'Strong ability'}],esc
 });
 for(const name of ['Spinotroleum','Mega Charizard Z','Primordial Crush','Apex Predator'])
  assert.ok(html.includes(name));
 for(const action of ['library-edit','library-new','library-delete','santara-catalog'])
  assert.ok(html.includes('data-act="'+action+'"'));
});

test('Content filters limit results',()=>{
 const list={species:[{slug:'spinotroleum',name:'Spinotroleum'}],megas:[],moves:[{slug:'crush',name:'Crush'}],abilities:[]};
 const html=customContentLibraryUI({...list,category:'move',search:'crush',esc});
 assert.ok(html.includes('Crush'));
 assert.ok(!html.includes('data-id="spinotroleum"'));
});
