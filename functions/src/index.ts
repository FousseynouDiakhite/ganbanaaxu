/*
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
import "./types"; // At the top of index.ts
// import {onRequest} from "firebase-functions/v2/https";
// import * as logger from "firebase-functions/logger";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });


import * as functions from "firebase-functions";
import express from "express";
import multer from "multer";
import {initializeApp} from "firebase-admin/app";
import {getStorage} from "firebase-admin/storage";
import {requireAuth} from "@clerk/express";
// import * as path from "path";
// import * as os from "os";
// import * as fs from "fs";
import mime from "mime-types";

initializeApp();

const app = express();
const upload = multer({storage: multer.memoryStorage()});

/* app.post("/upload", requireAuth, upload.single("file"),
async (req: express.Request, res: express.Response) => {

  try {
    const file = req.file;
    if (!file) {
      return res.status(400).send("No file uploaded");
    }

    const bucket = getStorage().bucket();
    const mimeType = file.mimetype;
    const extension = mime.extension(mimeType) || "bin";
    const fileName = `uploads/${Date.now()}.${extension}`;

    const blob = bucket.file(fileName);
    const blobStream = blob.createWriteStream({
      metadata: {
        contentType: mimeType,
      },
    });

    blobStream.on("error", (err) => {
      console.error("Upload error:", err);
      return res.status(500).send("Upload failed");
    });

    blobStream.on("finish", () => {
      const publicUrl = `https://storage.googleapis.com/
      ${bucket.name}/${blob.name}`;
      return res.status(200).json({ url: publicUrl });
    });

    blobStream.end(file.buffer);
  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).send("Internal server error");
  }
});*/

app.post("/upload", requireAuth, upload.single("file"),
  async (req: express.Request, res: express.Response) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).send("No file uploaded");
      }

      const bucket = getStorage().bucket();
      const mimeType = file.mimetype;
      const extension = mime.extension(mimeType) || "bin";
      const fileName = `uploads/${Date.now()}.${extension}`;

      const blob = bucket.file(fileName);
      const blobStream = blob.createWriteStream({
        metadata: {contentType: mimeType},
      });

      blobStream.on("error", (err) => {
        console.error("Upload error:", err);
        // You must send response here only once, don't call res.send twice.
        if (!res.headersSent) {
          res.status(500).send("Upload failed");
        }
      });

      blobStream.on("finish", () => {
        const publicUrl = `https://storage.googleapis.com/
      ${bucket.name}/${blob.name}`;
        if (!res.headersSent) {
          res.status(200).json({url: publicUrl});
        }
      });

      blobStream.end(file.buffer);

      // Return after initiating upload, response will be sent in events above
      return;
    } catch (err) {
      console.error("Unexpected error:", err);
      return res.status(500).send("Internal server error");
    }
  });


// Export the function
export const api = functions.https.onRequest(app);
