
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, addDoc, collection, serverTimestamp, deleteDoc, updateDoc, runTransaction } from "firebase/firestore";

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
    await setDoc(userDoc, { 
      ...data, 
      lastSynced: serverTimestamp() 
    }, { merge: true });
    return true;
  } catch (error) {
    console.error("Cloud sync failed:", error);
    throw error;
  }
};

export const redeemBetaCode = async (userId: string, code: string) => {
  try {
    const result = await runTransaction(db, async (transaction) => {
      const configDocRef = doc(db, "metadata", "beta_config");
      const configSnap = await transaction.get(configDocRef);

      // Default fallback if doc doesn't exist yet (for first run)
      if (!configSnap.exists()) {
        const initialData = { validCode: "GUARDIAN-2025", currentUses: 0, maxUses: 40 };
        transaction.set(configDocRef, initialData);
        if (code !== initialData.validCode) throw new Error("Invalid Code");
      } else {
        const data = configSnap.data();
        if (code.toUpperCase() !== data.validCode) throw new Error("Invalid Code");
        if (data.currentUses >= data.maxUses) throw new Error("Beta Full");
      }

      const userDocRef = doc(db, "users", userId);
      transaction.update(userDocRef, { isPremium: true });
      transaction.update(configDocRef, { currentUses: (configSnap.data()?.currentUses || 0) + 1 });
      
      return true;
    });
    return result;
  } catch (error: any) {
    console.error("Redemption failed:", error.message);
    throw error;
  }
};

export const saveFeedback = async (userId: string, email: string, category: string, message: string) => {
  try {
    const feedbackCol = collection(db, "feedback");
    await addDoc(feedbackCol, {
      userId,
      userEmail: email,
      category,
      message,
      timestamp: serverTimestamp(),
      targetNotification: "jsn.benjamin@gmail.com" 
    });
    return true;
  } catch (error) {
    console.error("Feedback submission failed:", error);
    return false;
  }
};

export const clearUserData = async (userId: string) => {
  try {
    const userDoc = doc(db, "users", userId);
    await setDoc(userDoc, { _deleted: true, lastSynced: serverTimestamp() });
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
    if (snap.exists() && snap.data()._deleted) return null;
    return snap.exists() ? snap.data() : null;
  } catch (error) {
    console.error("Fetch failed:", error);
    return null;
  }
};
