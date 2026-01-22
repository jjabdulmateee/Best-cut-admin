import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  UserCredential,
} from "firebase/auth";
import { auth } from "./config";

export const signInWithEmail = async (
  email: string,
  password: string,
): Promise<UserCredential> => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const signOut = async (): Promise<void> => {
  await firebaseSignOut(auth);
};
