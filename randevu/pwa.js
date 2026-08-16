(()=>{
  const API_URL='https://script.google.com/macros/s/AKfycbwg4JbCvLdtQgIQeU0mWdxnCRIvmzLAPg5RVK8RaX5GxBGb9ndyQBuM6aau_VyTcD2WKA/exec';
  const FIREBASE_CONFIG={apiKey:'AIzaSyDJOJNVCnhYXCHrmaMlbJsCff8EE9F_fy8',authDomain:'furkansimsekbarber.firebaseapp.com',projectId:'furkansimsekbarber',storageBucket:'furkansimsekbarber.firebasestorage.app',messagingSenderId:'448367241152',appId:'1:448367241152:web:cdf8e6ab09ab5033dcca25'};
  const VAPID_PUBLIC_KEY='BMX27-o4fyFHuSlGiplsYv5gg-lbeYDuCVcAbPvZo94Gzapl2_KTCClTnKysGmdWHZnVzDGvVSLYe-5kxhWblQU';
  let firebasePromise=null;
  let messagingPromise=null;

  async function getFirebase(){
    if(!firebasePromise){
      firebasePromise=Promise.all([
        import('https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/12.17.1/firebase-messaging.js')
      ]).then(([app,messaging])=>({app,messaging}));
    }
    return firebasePromise;
  }

  async function getMessaging(){
    if(!messagingPromise){
      messagingPromise=(async()=>{
        const {app,messaging}=await getFirebase();
        const firebaseApp=app.initializeApp(FIREBASE_CONFIG,'barber-web');
        const messagingInstance=messaging.getMessaging(firebaseApp);
        return {messagingModule:messaging,messagingInstance:messagingInstance};
      })();
    }
    return messagingPromise;
  }

  async function registerFirebaseToken(){
    if(!window.isSecureContext||!('Notification'in window)||!('serviceWorker'in navigator))
      return {ok:false,error:'Bu cihazda web bildirimleri desteklenmiyor.'};

    const permission=await Notification.requestPermission();
    if(permission!=='granted')return {ok:false,error:'Bildirim izni verilmedi.'};

    const {messagingModule,messagingInstance}=await getMessaging();
    const registration=await navigator.serviceWorker.register('/furkan-simsek-barber/firebase-messaging-sw.js',{scope:'/furkan-simsek-barber/'});
    await navigator.serviceWorker.ready;

    const token=await messagingModule.getToken(messagingInstance,{vapidKey:VAPID_PUBLIC_KEY,serviceWorkerRegistration:registration});
    if(!token)return {ok:false,error:'Firebase bildirim tokenı alınamadı.'};
    return {ok:true,token:token};
  }

  async function saveFcmToken(token,type='customer',bookingId=''){
    try{
      const response=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'save_fcm_token',token:token,type:type,bookingId:String(bookingId||'')})});
      const data=await response.json();
      return data.ok?{ok:true,token:token}:{ok:false,error:data.error||'Bildirim tokenı kaydedilemedi.'};
    }catch(error){
      console.error('FCM token kaydetme hatası:',error);
      return {ok:false,error:'Bildirim tokenı sunucuya kaydedilemedi.'};
    }
  }

  async function enableBarberNotifications(){
    try{
      const result=await registerFirebaseToken();
      if(!result.ok)return result;
      const saved=await saveFcmToken(result.token,'customer','');
      if(!saved.ok)return saved;
      localStorage.setItem('barber_fcm_token',result.token);
      return {ok:true,token:result.token};
    }catch(error){
      console.error('Bildirim kurulumu hatası:',error);
      return {ok:false,error:error.message||'Bildirimler açılamadı.'};
    }
  }

  async function registerPushForBooking(bookingId){
    try{
      const result=await registerFirebaseToken();
      if(!result.ok)return result;
      const saved=await saveFcmToken(result.token,'customer',bookingId);
      if(saved.ok)localStorage.setItem('barber_fcm_token',result.token);
      return saved;
    }catch(error){
      console.error('Randevu bildirim kurulumu hatası:',error);
      return {ok:false,error:error.message||'Randevu bildirimi kurulamadı.'};
    }
  }

  window.enableBarberNotifications=enableBarberNotifications;
  window.registerBarberPushForBooking=registerPushForBooking;

  if('serviceWorker'in navigator){
    navigator.serviceWorker.register('/furkan-simsek-barber/randevu/service-worker.js').catch(console.error);
  }
})();
