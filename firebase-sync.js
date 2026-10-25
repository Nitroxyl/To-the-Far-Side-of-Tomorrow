// Santara Fieldwork — Firestore live publishing.
// Only player-safe publication bundles are transferred; the GM database stays local.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js';
import { getFirestore, doc, onSnapshot, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';

const bridge = window.SantaraBridge;
const isGM = bridge?.mode === 'gm';
const config = window.SANTARA_FIREBASE_CONFIG;
const configured = config && ['apiKey', 'authDomain', 'projectId', 'appId'].every(k =>
  typeof config[k] === 'string' && config[k].length > 4 && !config[k].includes('PASTE_'));

// This stays outside the dashboard's #app, which is re-rendered after edits.
const panel = document.createElement('aside');
panel.id = 'santara-cloud-panel';
panel.style.cssText = 'position:fixed;z-index:5;bottom:14px;right:14px;width:min(320px,calc(100vw - 28px));padding:12px 14px;background:#142735;color:#e5f4f4;border:1px solid #518b85;border-radius:13px;box-shadow:0 8px 30px #0008;font:13px/1.45 system-ui,sans-serif';
panel.innerHTML = `<div style="font-weight:750;margin-bottom:4px">☁ ${isGM ? 'GM publishing' : 'Live Pokédex'} · Firestore</div><div id="cloud-status" role="status" aria-live="polite" style="color:#b4c9c9">Connecting…</div>${isGM ? '<div style="display:flex;flex-wrap:wrap;gap:7px;margin-top:9px"><button id="cloud-signin" type="button">Sign in with Google</button><button id="cloud-publish" type="button" disabled>Publish visible records</button><button id="cloud-signout" type="button" hidden>Sign out</button></div>' : ''}`;
document.body.append(panel);
for (const button of panel.querySelectorAll('button')) {
  button.style.cssText = 'background:#22605e;border:1px solid #68b8a9;border-radius:7px;color:white;padding:6px 9px;cursor:pointer';
}
const status = message => { panel.querySelector('#cloud-status').textContent = message; };

if (!bridge) {
  status('The dashboard bridge is missing. Check index.html.');
} else if (!configured) {
  status('Offline mode. Fill out firebase-config.js to enable live syncing.');
} else {
  try {
    const app = initializeApp(config);
    const store = getFirestore(app);
    const publishedRef = doc(store, 'santara_publication', 'current');
    if (isGM) {
      const auth = getAuth(app);
      const signInButton = panel.querySelector('#cloud-signin');
      const publishButton = panel.querySelector('#cloud-publish');
      const signOutButton = panel.querySelector('#cloud-signout');
      const ROOT_UID='ctBLgrVgkLOzUJYTyYgU9IwejYx1';
      let currentUser=null,roleAllowed=false,stopRole=null;
      onAuthStateChanged(auth,user=>{
        stopRole?.();stopRole=null;
        currentUser=user;roleAllowed=false;
        signInButton.hidden=Boolean(user);
        signOutButton.hidden=!user;
        publishButton.disabled=true;
        if(!user){status('Sign in with an authorized GM account to publish.');return}
        if(user.uid===ROOT_UID){roleAllowed=true;publishButton.disabled=false;
          status('Founding GM: '+(user.email||user.uid));return}
        if(!user.emailVerified){status('Verify your account email to use delegated GM privileges.');return}
        stopRole=onSnapshot(doc(store,'santara_gm_accounts',user.uid),snap=>{
          const record=snap.exists()?snap.data():null;
          roleAllowed=record?.enabled===true&&record.email===user.email;
          publishButton.disabled=!roleAllowed;
          status(roleAllowed?'Authorized GM: '+user.email:'No GM role for this account. Open Account Access to request authorization.');
        },err=>{roleAllowed=false;publishButton.disabled=true;status('GM authorization check failed: '+err.message)});
      },error=>status('Authentication error: '+error.message));
      signInButton.addEventListener('click', async () => {
        try { await signInWithPopup(auth, new GoogleAuthProvider()); }
        catch (error) { status(`Sign-in failed: ${error.message}`); }
      });
      signOutButton.addEventListener('click', async () => {
        try { await signOut(auth); }
        catch (error) { status(`Sign-out failed: ${error.message}`); }
      });
      publishButton.addEventListener('click', async () => {
        if (!currentUser||!roleAllowed) return;
        const bundle = bridge.publicBundle();
        const count = bundle.sites.length + bundle.requests.length + bundle.sightings.length;
        const estimatedBytes = new TextEncoder().encode(JSON.stringify(bundle)).length;
        if (estimatedBytes > 850000) {
          status(`Publication is ${(estimatedBytes/1024).toFixed(0)} KB, too large for one Firestore document. Remove or reduce some uploaded images before publishing.`);
          return;
        }
        if (!confirm(`Publish ${count} player-safe entries to the shared Pokédex? This replaces the previous publication, including removing entries you have now unpublished.`)) return;
        publishButton.disabled = true;
        status(`Publishing ${count} entries…`);
        try {
          await setDoc(publishedRef, { bundle, updatedAt: serverTimestamp() });
          status(`Published ${count} entries successfully. The Player Pokédex will sync automatically.`);
        } catch (error) {
          status(`Publish failed: ${error.message}. Check Firestore Rules and your GM UID.`);
        } finally {
          publishButton.disabled = !currentUser||!roleAllowed;
        }
      });
    } else {
      let previousVersion = '';
      onSnapshot(publishedRef, snapshot => {
        if (!snapshot.exists()) {
          status('Connected. The GM has not published an update yet.');
          return;
        }
        const bundle = snapshot.data()?.bundle;
        if (!bundle || bundle.kind !== 'santaraPublished' || !['sites', 'requests', 'sightings'].every(k => Array.isArray(bundle[k]))) {
          status('Received an invalid fieldwork publication.');
          return;
        }
        const version = JSON.stringify(bundle);
        if (version === previousVersion) return;
        try {
          const result = bridge.applyPublication(bundle);
          previousVersion = version;
          const count = bundle.sites.length + bundle.requests.length + bundle.sightings.length;
          status(`Synced ${count} published entries (${result.added} new, ${result.updated} refreshed). Personal notes remain on this device.`);
        } catch (error) {
          status(`Could not apply the publication: ${error.message}`);
        }
      }, error => status(`Sync failed: ${error.message}. Check database rules.`));
    }
  } catch (error) {
    status(`Firebase setup error: ${error.message}`);
  }
}
