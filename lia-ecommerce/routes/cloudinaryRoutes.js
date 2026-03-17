const express = require('express');
const router = express.Router();
const { generateSignature, deleteImage } = require('../controllers/cloudinaryController');

router.post('/sign', generateSignature);
router.post('/delete', deleteImage);

module.exports = router;
