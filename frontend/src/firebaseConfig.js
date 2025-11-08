import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCpraac-yQRE3i9HzyW7Att2bUK9uOTES0",
  authDomain: "flywise-b088d.firebaseapp.com",
  projectId: "flywise-b088d",
  storageBucket: "flywise-b088d.firebasestorage.app",
  messagingSenderId: "772851502647",
  appId: "1:772851502647:web:2e0dfb56b36718c6bcb9b2",
  measurementId: "G-ZHNVWR4VSG"
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
