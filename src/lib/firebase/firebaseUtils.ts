import { auth, db, storage } from "./firebase";
import {
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  setDoc,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Auth functions
export const logoutUser = () => signOut(auth);

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

// Firestore functions
export const addDocument = (collectionName: string, data: any) =>
  addDoc(collection(db, collectionName), data);

export const getDocuments = async (collectionName: string) => {
  const querySnapshot = await getDocs(collection(db, collectionName));
  return querySnapshot.docs.map((doc: { id: string; data(): Record<string, unknown> }) => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const updateDocument = (collectionName: string, id: string, data: any) =>
  updateDoc(doc(db, collectionName, id), data);

export const deleteDocument = (collectionName: string, id: string) =>
  deleteDoc(doc(db, collectionName, id));

const PADEL_COLLECTION = "lawx-padel";
const PAIRS_DOC_ID = "pairs";

export type PairsData = {
  tournament: [string, string][];
  social: [string, string][];
};

export async function getPairs(): Promise<PairsData | null> {
  try {
    const ref = doc(db, PADEL_COLLECTION, PAIRS_DOC_ID);
    const snap = await getDoc(ref);
    const data = snap.data();
    if (!data) return null;
    return {
      tournament: Array.isArray(data.tournament) ? data.tournament : [],
      social: Array.isArray(data.social) ? data.social : [],
    };
  } catch {
    return null;
  }
}

export async function setPairs(pairs: PairsData): Promise<void> {
  const ref = doc(db, PADEL_COLLECTION, PAIRS_DOC_ID);
  await setDoc(ref, pairs);
}

export function subscribePairs(callback: (pairs: PairsData) => void): (() => void) | null {
  try {
    const ref = doc(db, PADEL_COLLECTION, PAIRS_DOC_ID);
    const unsub = onSnapshot(ref, (snap: { data(): Record<string, unknown> | undefined }) => {
      const data = snap.data();
      callback({
        tournament: Array.isArray(data?.tournament) ? data.tournament : [],
        social: Array.isArray(data?.social) ? data.social : [],
      });
    });
    return () => unsub();
  } catch {
    return null;
  }
}

// Storage functions
export const uploadFile = async (file: File, path: string) => {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};
