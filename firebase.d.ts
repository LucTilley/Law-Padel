declare module "firebase/auth" {
  export interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
  }
  export function getAuth(app: unknown): {
    onAuthStateChanged(cb: (user: User | null) => void): () => void;
  };
  export function signInWithPopup(auth: unknown, provider: unknown): Promise<{ user: User }>;
  export function signOut(auth: unknown): Promise<void>;
  export class GoogleAuthProvider {}
}

declare module "firebase/firestore";
declare module "firebase/storage";
declare module "firebase/app";
