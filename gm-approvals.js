// GM-only review of verified Trainer access requests.
import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import { getFirestore, collection, doc, onSnapshot, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';

const GM_UID='ctBLgrVgkLOzUJYTyYgU9IwejYx1';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let ready=false,isGM=false,requests=[],permissions=[],feedback='Sign in with your GM Google account first.';
let stopRequests=null,stopPermissions=null,stopRole=null,firestore=null;
function count(){return requests.filter(r=>!permissions.find(p=>p.uid===r.uid)?.enabled).length}
function render(){
  const root=document.getElementById('gm-approvals-root');
  if(!root)return;
  if(!isGM){
    root.innerHTML='<section class="hero"><div class="eyebrow">TRAINER REGISTRATION</div><h2>Player approvals</h2><p>Sign into the Firestore panel with your GM Google account to review verified trainers.</p></section>';
    return;
  }
  const rows=requests.map(r=>{
    const p=permissions.find(x=>x.uid===r.uid);
    const active=Boolean(p?.enabled);
    return '<article class="entry"><div class="entry-top"><div><div class="id">'+esc(r.uid)+'</div><h3>'+esc(r.email)+'</h3></div><div>'+ (active?'<span class="pill green">Approved</span>':'<span class="pill gold">Pending / revoked</span>') +'</div></div>'+
      '<p style="color:var(--muted);font-size:13px">Email verified at sign-up · '+(active?'Access granted':'Awaiting GM approval')+'</p>'+
      '<button class="btn '+(active?'ghost':'primary')+' small" type="button" data-approval="'+(active?'revoke':'approve')+'" data-uid="'+esc(r.uid)+'">'+(active?'Revoke access':'Approve Trainer')+'</button></article>';
  }).join('');
  root.innerHTML='<section class="hero"><div class="eyebrow">SANTARA LEAGUE REGISTRATION</div><h2>Trainer access requests</h2><p>Only verified Firebase accounts can request access. Approving a trainer unlocks the Player Pokédex, live research updates and their customizable Trainer Card.</p></section>'+
    '<div class="stats">'+
    '<div class="stat"><div class="val">'+requests.length+'</div><div class="key">Applications</div></div>'+
    '<div class="stat"><div class="val">'+permissions.filter(x=>x.enabled).length+'</div><div class="key">Approved</div></div>'+
    '<div class="stat"><div class="val">'+count()+'</div><div class="key">Pending / revoked</div></div></div>'+
    '<section class="panel"><h3>Trainer applications</h3><p class="muted">Verify the applicant\'s identity yourself before approving. Email verification proves inbox ownership, not that they belong to your campaign.</p><p id="approval-feedback" role="status" style="color:var(--teal)">'+esc(feedback)+'</p>'+
    '<div class="collection">'+(rows||'<div class="empty">No players have requested access yet. Ask them to register and verify their email.</div>')+'</div></section>';
  for(const b of root.querySelectorAll('[data-approval]')){
    b.addEventListener('click',async()=>{
      if(!isGM)return;
      const uid=b.dataset.uid;
      const r=requests.find(x=>x.uid===uid);
      if(!r)return;
      const granting=b.dataset.approval==='approve';
      if(!confirm((granting?'Approve ':'Revoke access for ')+r.email+'?'))return;
      b.disabled=true;
      feedback='Saving '+r.email+'…';render();
      try{
        await setDoc(doc(firestore,'santara_player_access',uid),{
          email:r.email,enabled:granting,approvedAt:serverTimestamp()
        });
        feedback=(granting?'Approved ':'Revoked access for ')+r.email;
      }catch(e){feedback='Could not change access: '+e.message}
      render();
    });
  }
}
window.SantaraApprovals={render};
function stopAll(){
 if(stopRequests)stopRequests();
 if(stopPermissions)stopPermissions();
 if(stopRole)stopRole();
 stopRequests=stopPermissions=stopRole=null;requests=[];permissions=[];
}
const c=window.SANTARA_FIREBASE_CONFIG;
if(c && c.projectId && !c.projectId.includes('PASTE_')){
  try{
    const app=getApps().length?getApp():initializeApp(c);
    firestore=getFirestore(app);
    onAuthStateChanged(getAuth(app),user=>{
      stopAll();isGM=false;
      const activate=()=>{
        isGM=true;feedback='Listening for verified Trainer registrations…';render();
        stopRequests=onSnapshot(collection(firestore,'santara_access_requests'),snapshot=>{
          requests=snapshot.docs.map(d=>({uid:d.id,...d.data()}));
          requests.sort((a,b)=>(a.email||'').localeCompare(b.email||''));
          render();
        },e=>{feedback='Could not load requests: '+e.message;render()});
        stopPermissions=onSnapshot(collection(firestore,'santara_player_access'),snapshot=>{
          permissions=snapshot.docs.map(d=>({uid:d.id,...d.data()}));render();
        },e=>{feedback='Could not load approvals: '+e.message;render()});
      };
      if(!user){feedback='Sign in through the GM publishing panel.';render();return}
      if(user.uid===GM_UID){activate();return}
      if(!user.emailVerified){feedback='Verify your email before using the GM console.';render();return}
      stopRole=onSnapshot(doc(firestore,'santara_gm_accounts',user.uid),snap=>{
        const role=snap.exists()?snap.data():null;
        const granted=role?.enabled===true&&role.email===user.email;
        if(granted&&!isGM){activate();return}
        if(!granted){if(isGM){stopRequests?.();stopPermissions?.();stopRequests=stopPermissions=null;requests=[];permissions=[]}
          isGM=false;feedback='This account has not been granted GM permissions. Use Account Access.';render();}
      },e=>{isGM=false;feedback='Could not verify GM role: '+e.message;render()});
    });
  }catch(e){feedback='Firebase setup error: '+e.message}
}
render();
