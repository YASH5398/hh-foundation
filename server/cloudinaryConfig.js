<<<<<<< HEAD
export {};
=======
/**
 * Cloudinary Server-Side Configuration
 * 
 * SECURITY: API KEY and SECRET are loaded from environment variables ONLY
 * NEVER commit actual credentials to version control
 * 
 * Setup: Add these to your .env file at project root:
 * CLOUDINARY_CLOUD_NAME=dq6hzrfxc
 * CLOUDINARY_API_KEY=your_api_key_here
 * CLOUDINARY_API_SECRET=your_api_secret_here
 */

import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Validate required environment variables
if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error("❌ CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET must be set in .env file");
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
