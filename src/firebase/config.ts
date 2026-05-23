
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyBJ93wLi_wcCSglwVFkppoeHo5CKL2LDL8",
  authDomain: "studio-2256525969-6c500.firebaseapp.com",
  projectId: "studio-2256525969-6c500",
  storageBucket: "studio-2256525969-6c500.firebasestorage.app",
  messagingSenderId: "368737757258",
  appId: "1:368737757258:web:0a99465e101868b20e5eb3"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
