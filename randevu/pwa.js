(()=>{
  if(!('serviceWorker'in navigator))return;
  const API_URL='https://script.google.com/macros/s/AKfycbwg4JbCvLdtQgIQeU0mWdxnCRIvmzLAPg5RVK8RaX5GxBGb9ndyQBuM6aau_VyTcD2WKA/exec';
  const VAPID_PUBLIC_KEY='BMX27-o4fyFHuSlGiplsYv5gg-lbeYDuCVcAbPvZo94Gzapl2_KTCClTnKysGmdWHZnVzDGvVSLYe-5kxhWblQU';
  const urlBase64ToUint8Array=b=>{const p='='.repeat((4-b.length%4)%4),r=atob((b+p).replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from([...r].map(c=>c.charCodeAt(0)))};
 async function registerPush(){
  if(!window.isSecureContext||!('PushManager'in window)||!('Notification'in window))
    return{ok:false,error:'Bu cihazda web push desteklenmiyor.'};

  const permission=await Notification.requestPermission();
  if(permission!=='granted')
    return{ok:false,error:'Bildirim izni verilmedi.'};

  const reg=await navigator.serviceWorker.ready;

  let subscription=await reg.pushManager.getSubscription();

  // Eski VAPID anahtarıyla oluşturulmuş aboneliği kaldır
  if(subscription){
    try{
      await subscription.unsubscribe();
    }catch(e){
      console.warn('Eski Push aboneliği silinemedi:',e);
    }
  }

  subscription=await reg.pushManager.subscribe({
    userVisibleOnly:true,
    applicationServerKey:urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
  });

  return{
    ok:true,
    subscription:subscription.toJSON()
  };
}
  async function savePushSubscription(bookingId){
    if(!bookingId)return{ok:false,error:'Randevu kodu bulunamadı.'};
    const result=await registerPush();
    if(!result.ok)return result;
    try{
      const response=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'subscribe',bookingId:String(bookingId),subscription:result.subscription})});
      const data=await response.json();
      return data.ok?{ok:true}:{ok:false,error:data.error||'Bildirim aboneliği kaydedilemedi.'};
    }catch(error){console.error('Push abonelik hatası:',error);return{ok:false,error:'Bildirim aboneliği sunucuya kaydedilemedi.'};}
  }
  window.enableBarberNotifications=registerPush;
  window.registerBarberPushForBooking=savePushSubscription;
  navigator.serviceWorker.register('/furkan-simsek-barber/randevu/service-worker.js').catch(console.error);
})();
