// Pure helpers for the GM artwork library. No Firebase access in this module.
const normalized=(value)=>String(value||'');
export function artworkEntries(customs=[],megaForms=[]){
 const species=customs.map(x=>({kind:'species',id:x.slug||x.key,name:x.name,
   spriteUrl:normalized(x.spriteUrl),spriteData:normalized(x.spriteData)}));
 const megas=megaForms.map(x=>({kind:'mega',id:x.slug,name:x.name,
   spriteUrl:normalized(x.spriteUrl),spriteData:normalized(x.spriteData)}));
 return [...species,...megas].filter(x=>x.id&&x.name)
  .sort((a,b)=>a.name.localeCompare(b.name));
}
export function artworkFor(entry,customs=[],megaForms=[]){
 if(!entry)return null;
 const set=entry.kind==='mega'?megaForms:entry.kind==='species'?customs:[];
 return set.find(x=>(x.slug||x.key)===entry.id)||null;
}
export function canUpdateArtwork(current,previous){
 const currData=normalized(current?.spriteData),currUrl=normalized(current?.spriteUrl);
 const prevData=normalized(previous?.spriteData),prevUrl=normalized(previous?.spriteUrl);
 // Leave independently customized artwork untouched; blank individual images
 // are considered inherited and can safely receive the template image.
 return (!currData&&!currUrl)||(currData===prevData&&currUrl===prevUrl);
}
export function artworkPropagation(kind,id,previous,next,pokemon=[]){
 const results=[];
 if(kind!=='species'&&kind!=='mega')return results;
 for(const mon of pokemon){
  if(!mon.id)continue;
  if(kind==='species'){
   if(mon.source!=='custom'||mon.speciesKey!=='custom:'+id)continue;
   if(!canUpdateArtwork(mon,previous))continue;
   results.push({id:mon.id,patch:{spriteUrl:normalized(next.spriteUrl),
     spriteData:normalized(next.spriteData)}});
  }else{
   const form=mon.megaForm;
   if(!form||form.slug!==id||!canUpdateArtwork(form,previous))continue;
   results.push({id:mon.id,patch:{megaForm:{...form,
     spriteUrl:normalized(next.spriteUrl),spriteData:normalized(next.spriteData)}}});
  }
 }
 return results;
}
