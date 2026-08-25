import admin from "firebase-admin";

admin.initializeApp();
export const bucket = admin.storage().bucket();

