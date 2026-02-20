const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
    cloud_name: 'dqa8viqpb',
    api_key: '293325847981982',
    api_secret: 'CEqiNkgMKnr0GQ0qh8BvM_57a6s'
});

const multer = require('multer');

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'field-service-app',
        allowed_formats: ['jpg', 'png', 'jpeg'],
    },
});

const upload = multer({ storage: storage });

const uploadStream = (buffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: 'field-service-app' },
            (error, result) => {
                if (result) {
                    resolve(result);
                } else {
                    reject(error);
                }
            }
        );
        stream.write(buffer);
        stream.end();
    });
};

module.exports = {
    cloudinary,
    storage,
    upload,
    uploadStream
};
