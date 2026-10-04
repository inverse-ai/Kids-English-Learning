let installEvent=null,registration=null,message='',reloadForUpdate=false;
export const pwaState=()=>({installable:!!installEvent,update:!!registration?.waiting,message,installed:matchMedia('(display-mode: standalone)').matches||navigator.standalone===true});
export function initPwa(onChange){
 window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installEvent=event;onChange();});
 window.addEventListener('appinstalled',()=>{installEvent=null;message='Little English was installed.';onChange();});
 if(!('serviceWorker' in navigator))return;
 navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'}).then(reg=>{registration=reg;onChange();reg.addEventListener('updatefound',()=>{const worker=reg.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed'){message=navigator.serviceWorker.controller?'An update is ready. Save your work and update when ready.':'Ready for offline lessons. Audio becomes available offline after it has been played online.';onChange();}});});reg.update().catch(()=>{});}).catch(()=>{message='Offline support is unavailable in this browser. You can still use the website online.';onChange();});
 let refreshing=false;window.addEventListener('pageshow',()=>registration?.update().catch(()=>{}));
 navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!reloadForUpdate){message='The app is ready. Reopen to use the latest version.';onChange();return;}if(refreshing)return;refreshing=true;location.reload();});
}
export async function installPwa(){if(!installEvent)return;const event=installEvent;installEvent=null;await event.prompt();const choice=await event.userChoice;message=choice.outcome==='accepted'?'Installation accepted.':'You can install later using your browser menu.';}
export function updatePwa(){reloadForUpdate=true;registration?.waiting?.postMessage({type:'ACTIVATE_UPDATE'});}
