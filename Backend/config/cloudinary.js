const { v2: cloudinary } = require('cloudinary');

const pickEnv = (...keys) => {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
};

const parseCloudinaryUrl = (value) => {
  if (!value) {
    return null;
  }

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'cloudinary:') {
      return null;
    }

    return {
      cloudName: parsed.hostname || '',
      apiKey: decodeURIComponent(parsed.username || ''),
      apiSecret: decodeURIComponent(parsed.password || ''),
    };
  } catch {
    return null;
  }
};

const ensureCloudinaryConfig = () => {
  const cloudinaryUrl = pickEnv(
    'CLOUDINARY_URL',
    'CLOUDANARY_URL',
    'CLAUDINARY_URL',
    'CLAODANARY_URL',
    'CLAODINARY_URL'
  );
  const parsedFromUrl = parseCloudinaryUrl(cloudinaryUrl);

  const cloudName =
    pickEnv(
      'CLOUDINARY_CLOUD_NAME',
      'CLOUDANARY_CLOUD_NAME',
      'CLAUDINARY_CLOUD_NAME',
      'CLAODANARY_CLOUD_NAME',
      'CLAODINARY_CLOUD_NAME'
    ) || parsedFromUrl?.cloudName || '';
  const apiKey =
    pickEnv(
      'CLOUDINARY_API_KEY',
      'CLOUDANARY_API_KEY',
      'CLAUDINARY_API_KEY',
      'CLAODANARY_API_KEY',
      'CLAODINARY_API_KEY'
    ) || parsedFromUrl?.apiKey || '';
  const apiSecret =
    pickEnv(
      'CLOUDINARY_API_SECRET',
      'CLOUDANARY_API_SECRET',
      'CLAUDINARY_API_SECRET',
      'CLAODANARY_API_SECRET',
      'CLAODINARY_API_SECRET'
    ) || parsedFromUrl?.apiSecret || '';

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.');
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
};

const uploadAvatarBuffer = async (buffer, userId) => {
  ensureCloudinaryConfig();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'flexora/avatars',
        resource_type: 'image',
        public_id: `avatar-${userId}-${Date.now()}`,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result?.secure_url || '');
      }
    );

    stream.end(buffer);
  });
};

module.exports = {
  ensureCloudinaryConfig,
  uploadAvatarBuffer,
};
