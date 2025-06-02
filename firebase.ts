import { initializeApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'; // Firestore support

const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyBOmKLaniKArqHiB6dv02XOb6S5VEnjhyk",
  authDomain: "gage-96fd8.firebaseapp.com",
  projectId: "gage-96fd8",
  storageBucket: "gage-96fd8.appspot.com", // Fixed this value
  messagingSenderId: "845376705617",
  appId: "1:845376705617:web:44e4cbf480665af3769470",
  measurementId: "G-RHX0ZQXBYV"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app); // Export Firestore

// Helper: Convert image URL to base64
export const convertUrlToBase64 = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error("Failed to fetch image for conversion:", response.statusText);
      return null;
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result !== 'string') return resolve(null);

        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX = 512;
          let { width, height } = img;

          if (width > height && width > MAX) {
            height = (height * MAX) / width;
            width = MAX;
          } else if (height > width && height > MAX) {
            width = (width * MAX) / height;
            height = MAX;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(reader.result);

          ctx.drawImage(img, 0, 0, width, height);
          const resized = canvas.toDataURL('image/jpeg', 0.8);
          resolve(resized);
        };

        img.onerror = () => resolve(reader.result);
        img.src = reader.result;
      };
      reader.onerror = () => {
        console.error("Base64 conversion failed.");
        reject(null);
      };
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error("Image conversion error:", err);
    return null;
  }
};

export default app;
