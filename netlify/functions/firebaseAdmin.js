import admin from 'firebase-admin';

// Initialize Firebase Admin using a service account or default credentials
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault()
    });
}

export const db = admin.firestore();
export { admin };
