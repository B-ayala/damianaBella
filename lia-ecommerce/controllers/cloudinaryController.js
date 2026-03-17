const crypto = require('crypto');
const https = require('https');

const generateSignature = (req, res) => {
  try {
    // Widget sends the exact params it wants to sign in the request body
    // e.g. { folder: 'productos', timestamp: 1234567890, upload_preset: 'Liastore', source: 'uw', ... }
    const paramsToSign = req.body;

    if (!paramsToSign || Object.keys(paramsToSign).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionaron parámetros para firmar',
      });
    }

    // Cloudinary signature: sort keys alphabetically, concatenate "key=value&...", append API_SECRET
    const apiSecret = (process.env.CLOUDINARY_API_SECRET || '').replace(/^['"]|['"]$/g, '');
    const signatureString =
      Object.keys(paramsToSign)
        .sort()
        .map((key) => `${key}=${paramsToSign[key]}`)
        .join('&') + apiSecret;

    // SHA1 hash
    const signature = crypto
      .createHash('sha1')
      .update(signatureString)
      .digest('hex');

    console.log('Signature generated for params:', Object.keys(paramsToSign).sort().join(', '));
    console.log('Signature:', signature);

    res.json({
      success: true,
      data: {
        signature,
      },
    });
  } catch (error) {
    console.error('Cloudinary signature error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteImage = async (req, res) => {
  try {
    const { publicId } = req.body;

    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: 'El publicId es requerido',
      });
    }

    // Create auth string for Cloudinary API
    const apiSecret = (process.env.CLOUDINARY_API_SECRET || '').replace(/^['"]|['"]$/g, '');
    const auth = Buffer.from(
      `${process.env.CLOUDINARY_API_KEY}:${apiSecret}`
    ).toString('base64');

    // Prepare POST data for Cloudinary deletion
    const postData = `public_ids%5B%5D=${encodeURIComponent(publicId)}`;

    const options = {
      hostname: 'api.cloudinary.com',
      path: `/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/resources/image/destroy`,
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const request = https.request(options, (response) => {
      let data = '';

      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        try {
          const result = JSON.parse(data);
          res.json({
            success: true,
            data: result,
          });
        } catch (parseError) {
          console.error('Parse error:', parseError);
          res.status(500).json({
            success: false,
            message: 'No se pudo analizar la respuesta de Cloudinary',
          });
        }
      });
    });

    request.on('error', (error) => {
      console.error('Cloudinary delete error:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    });

    request.write(postData);
    request.end();
  } catch (error) {
    console.error('Delete handler error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = { generateSignature, deleteImage };
