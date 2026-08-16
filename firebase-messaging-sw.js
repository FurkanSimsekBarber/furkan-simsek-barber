importScripts("https://www.gstatic.com/firebasejs/12.17.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.17.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDJOJNVCnhYXCHrmaMlbJsCff8EE9F_fy8",
  authDomain: "furkansimsekbarber.firebaseapp.com",
  projectId: "furkansimsekbarber",
  storageBucket: "furkansimsekbarber.firebasestorage.app",
  messagingSenderId: "448367241152",
  appId: "1:448367241152:web:cdf8e6ab09ab5033dcca25"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log("[firebase-messaging-sw.js] Background message:", payload);

  const notificationTitle =
    payload.notification?.title || "Furkan Şimşek Barber";

  const notificationOptions = {
    body: payload.notification?.body || "Yeni bir bildiriminiz var.",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    data: payload.data || {}
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
