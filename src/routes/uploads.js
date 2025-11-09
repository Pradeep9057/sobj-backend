import { Router } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { requireAuth, requireAdmin } from '../middlewares/auth.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.post('/image', requireAuth, requireAdmin, upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: 'No file uploaded' });
    const result = await cloudinary.uploader.upload_stream({ folder: 'sonaura' }, (err, result) => {
      if (err) return res.status(500).json({ message: 'Upload failed' });
      return res.json({ url: result.secure_url });
    });
    // Write buffer to stream
    result.end(file.buffer);
  } catch (e) {
    res.status(500).json({ message: 'Upload error' });
  }
});

export default router;


