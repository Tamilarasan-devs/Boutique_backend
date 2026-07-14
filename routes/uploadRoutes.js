const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer({ dest: 'uploads/' });

router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }
    
    const folder = req.body.folder || 'boutique_crm_quotations';
    
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: folder
    });
    
    // Clean up local file
    fs.unlinkSync(req.file.path);
    
    res.json({ image_url: result.secure_url });
  } catch (error) {
    console.error('Upload Error:', error);
    // Clean up local file in case of error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

module.exports = router;
