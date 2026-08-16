importScripts('https://www.gstatic.com/firebasejs/12.17.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.17.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:'AIzaSyDJOJNVCnhYXCHrmaMlbJsCff8EE9F_fy8',
  authDomain:'furkansimsekbarber.firebaseapp.com',
  projectId:'furkansimsekbarber',
  storageBucket:'furkansimsekbarber.firebasestorage.app',
  messagingSenderId:'448367241152',
  appId:'1:448367241152:web:cdf8e6ab09ab5033dcca25'
});

const messaging=firebase.messaging();
const DEFAULT_URL='/furkan-simsek-barber/randevu/';

messaging.onBackgroundMessage(function(payload){
  console.log('[firebase-messaging-sw.js] Background message:',payload);

  const title=payload.notification?.title||payload.data?.title||'Furkan Şimşek Barber';
  const body=payload.notification?.body||payload.data?.body||'Yeni bir bildiriminiz var.';
  const url=payload.data?.url||DEFAULT_URL;

  self.registration.showNotification(title,{
    body:body,
    icon:'/furkan-simsek-barber/randevu/icon-192.svg',
    badge:'/furkan-simsek-barber/randevu/icon-192.svg',
    tag:payload.data?.bookingId||'barber-notification',
    renotify:true,
    data:{url:url,bookingId:payload.data?.bookingId||'',status:payload.data?.status||''}
  });
});

self.addEventListener('notificationclick',function(event){
  event.notification.close();
  const url=event.notification.data?.url||DEFAULT_URL;

  event.waitUntil(
    clients.matchAll({type:'window',includeUncontrolled:true}).then(function(clientList){
      for(const client of clientList){
        if('focus' in client){
          if('navigate' in client)client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
