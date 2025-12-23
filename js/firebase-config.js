// Firebase設定ファイル
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Firebase設定（環境変数から取得する場合は適宜変更してください）
const firebaseConfig = {
  apiKey: "AIzaSyBTrWYJsBVLcQHAA7KyHRZK558fjTH5PJU",
  authDomain: "saikyo-note.firebaseapp.com",
  projectId: "saikyo-note",
  storageBucket: "saikyo-note.firebasestorage.app",
  messagingSenderId: "231327616410",
  appId: "1:231327616410:web:a9b4ca89ed275f0003fe23",
  measurementId: "G-BGBF5LVS58"
};

// Firebaseの初期化
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Googleプロバイダーの設定
const googleProvider = new GoogleAuthProvider();

export {
  auth,
  db,
  signInWithPopup,
  GoogleAuthProvider,
  googleProvider,
  signOut,
  onAuthStateChanged,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where
};
