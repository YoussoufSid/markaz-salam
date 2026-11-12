// إعدادات قاعدة البيانات السحابية — انظر «طريقة_التثبيت.txt»
// اتركها null ليعمل التطبيق محليًا على كل جهاز وحده.
window.FIREBASE_CONFIG = null;
/* بعد إنشاء مشروع Firebase الصق إعداداته هكذا (احذف علامتي التعليق):
window.FIREBASE_CONFIG = {
  apiKey: "....",
  authDomain: "....firebaseapp.com",
  projectId: "....",
  storageBucket: "....appspot.com",
  messagingSenderId: "....",
  appId: "...."
};
*/
// بريد المالك (صاحب الصلاحية الكاملة) — يجب أن يطابق ما في firestore.rules
window.OWNER_EMAIL = "owner@example.invalid";
