
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp, deleteDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBO2ui1QEa9vEHvpknfDJiB7N80hQGBjbk",
  authDomain: "scheduling-app-b2828.firebaseapp.com",
  projectId: "scheduling-app-b2828",
  storageBucket: "scheduling-app-b2828.firebasestorage.app",
  messagingSenderId: "1049100770426",
  appId: "1:1049100770426:web:10614c92942b0c7f55afc3"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const saveUserData = async (userId: string, data: any) => {
  try {
    const userDoc = doc(db, "users", userId);
    // Overwrite the document completely to ensure removed items are gone from cloud
    await setDoc(userDoc, { 
      ...data, 
      lastSynced: serverTimestamp() 
    });
    return true;
  } catch (error) {
    console.error("Cloud sync failed:", error);
    throw error;
  }
};

/**
 * Robust deletion: Overwrites data with empty state before attempting deletion
 * to handle various Firebase Security Rule configurations.
 */
export const clearUserData = async (userId: string) => {
  try {
    const userDoc = doc(db, "users", userId);
    // First, overwrite with empty to kill data even if delete is restricted
    await setDoc(userDoc, { _deleted: true, lastSynced: serverTimestamp() });
    // Then attempt hard delete
    await deleteDoc(userDoc);
    return true;
  } catch (error) {
    console.error("Firebase deletion failed:", error);
    return false;
  }
};

export const fetchUserData = async (userId: string) => {
  try {
    const userDoc = doc(db, "users", userId);
    const snap = await getDoc(userDoc);
    // If the doc has our _deleted flag, treat it as null
    if (snap.exists() && snap.data()._deleted) return null;
    return snap.exists() ? snap.data() : null;
  } catch (error) {
    console.error("Fetch failed:", error);
    return null;
  }
};
