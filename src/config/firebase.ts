import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';
import * as dotenv from "dotenv";
dotenv.config();
const serviceAccount = process.env.FIREBASE_CREDENTIALS ? JSON.parse(process.env.FIREBASE_CREDENTIALS): '';


if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount as admin.ServiceAccount)
  });
}

export const db = getFirestore();