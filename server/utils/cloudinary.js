const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
    cloud_name: 'dqa8viqpb',
    api_key: '293325847981982',
    api_secret: 'CEqiNkgMKnr0GQ0qh8BvM_57a6s'
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'field-service-app',
        allowed_formats: ['jpg', 'png', 'jpeg'],
    },
});

module.exports = {
    cloudinary,
    storage
};
