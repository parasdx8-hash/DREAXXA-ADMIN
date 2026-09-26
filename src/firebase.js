import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAWfmbqH55fUzN3rN0i9EV_qHLgchRoDHo",
  authDomain: "dreaxxa-mod.firebaseapp.com",
  databaseURL: "https://dreaxxa-mod-default-rtdb.firebaseio.com",
  projectId: "dreaxxa-mod",
  storageBucket: "dreaxxa-mod.firebasestorage.app",
  messagingSenderId: "185411391985",
  appId: "1:185411391985:web:1e8e537e31d12f1af73450",
  measurementId: "G-8WCV5W2JJQ"
};

const app = initializeApp(firebaseConfig);

export const database = getDatabase(app);
export const auth = getAuth(app);