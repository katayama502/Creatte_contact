const admin = require('firebase-admin');

// Initialize Firebase Admin using a service account or default credentials
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault()
    });
}

const db = admin.firestore();

module.exports = { admin, db };
