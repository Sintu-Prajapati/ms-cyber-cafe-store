const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({

    destination: function (req, file, cb) {
        cb(null, "public/uploads/products");
    },

    filename: function (req, file, cb) {

        const uniqueName =
            Date.now() +
            "-" +
            Math.round(Math.random() * 1E9) +
            path.extname(file.originalname);

        cb(null, uniqueName);
    }

});

const fileFilter = function (req, file, cb) {

    const allowedTypes = /jpeg|jpg|png|webp/;

    const extname =
        allowedTypes.test(
            path.extname(file.originalname).toLowerCase()
        );

    const mimetype =
        allowedTypes.test(file.mimetype);

    if (extname && mimetype) {

        cb(null, true);

    } else {

        cb(
            new Error(
                "Sirf JPG, JPEG, PNG aur WEBP image allowed hai."
            )
        );

    }

};

const upload = multer({

    storage: storage,

    fileFilter: fileFilter,

    limits: {
        fileSize: 5 * 1024 * 1024
    }

});

module.exports = upload;