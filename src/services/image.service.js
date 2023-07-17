// import cloudinary from 'cloudinary';
const { v2 } = require('cloudinary')

const cloudinary = v2;

const Setup = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
};

const base64 = (image_base64) => `data:image/jpeg;base64,${image_base64}`;

const upload = (data, folder) => {
  return cloudinary.uploader.upload(data, { folder: folder });
};

const destroy = (pulic_id) => {
  return cloudinary.uploader.destroy(pulic_id);
};

module.exports = {
  Setup,
  base64,
  upload,
  destroy
}