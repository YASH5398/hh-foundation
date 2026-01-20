<<<<<<< HEAD
export {};
=======
/**
 * Cloudinary Upload API Route (Server-Side)
 * 
 * This endpoint handles signed uploads from the backend
 * API credentials are kept secure on the server
 */

import express from "express";
import cloudinary from "../cloudinaryConfig.js";

const router = express.Router();

router.post("/upload", async (req, res) => {
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "No image data provided" });
    }

    const result = await cloudinary.uploader.upload(imageBase64, {
      folder: "epinScreenshots",
    });

    res.json({ url: result.secure_url });
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
