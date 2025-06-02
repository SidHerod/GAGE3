import { initializeApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'; // Firestore

// Your Firebase project configuration
const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyBOmKLaniKArqHiB6dv02XOb6S5VEnjhyk",
  authDomain: "gage-96fd8.firebaseapp.com",
  projectId: "gage-96fd8",
  storageBucket: "gage-96fd8.firebasestorage.app",
  messagingSenderId: "845376705617",
  appId: "1:845376705617:web:44e4cbf480665af3769470",
  measurementId: "G-RHX0ZQXBYV",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase services
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app); // Export Firestore DB

// Utility: Convert image URL to resized/compressed Base64
export const convertUrlToBase64 = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error("Failed to fetch image for base64 conversion:", response.statusText);
      return null;
    }

    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 512;
            const MAX_HEIGHT = 512;
            let { width, height } = img;

            if (width > height && width > MAX_WIDTH) {
              height = Math.round(height * (MAX_WIDTH / width));
              width = MAX_WIDTH;
            } else if (height > MAX_HEIGHT) {
              width = Math.round(width * (MAX_HEIGHT / height));
              height = MAX_HEIGHT;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve(reader.result as string);
              return;
            }

            ctx.drawImage(img, 0, 0, width, height);
            const resizedBase64 = canvas.toDataURL('image/jpeg', 0.8);
            resolve(resizedBase64);
          };

          img.onerror = () => {
            console.error("Failed to load image.");
            resolve(reader.result as string);
          };

          img.src = reader.result as string;
        } else {
          resolve(null);
        }
      };

      reader.onerror = () => {
        console.error("FileReader failed");
        reject(null);
      };

      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error during Base64 conversion:", error);
    return null;
  }
};

export default app;
