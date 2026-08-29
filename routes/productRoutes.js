const express = require("express");
const fs = require("fs");
const path = require("path");
const Product = require("../models/product");
const router = express.Router();

const upload = require("../config/multer");
const adminAuth =
    require("../middleware/adminAuth");

// Product page
router.get("/", adminAuth, async (req, res) => {

    try {
        const products = await Product.find().sort({ createdAt: -1 });

        res.render("products", {
            products
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Something went wrong");
    }
});

// Add product
router.post(
    "/add",
    upload.array("images", 4),
    async (req, res) => {

        try {

            const {
                name,
                category,
                unit,
                printPrice,
                sellingPrice,
                stock
            } = req.body;

            if (
                Number(sellingPrice) >
                Number(printPrice)
            ) {

                return res.status(400).send(
                    "Selling Price MRP se zyada nahi ho sakta."
                );

            }

            const images = req.files
                ? req.files.map(
                    file =>
                        "/uploads/products/" +
                        file.filename
                )
                : [];

            const product =
                new Product({

                    name,

                    category,

                    unit,

                    printPrice:
                        Number(printPrice),

                    sellingPrice:
                        Number(sellingPrice),

                    stock:
                        Number(stock),

                    images

                });

            await product.save();

            res.redirect("/products");

        } catch (error) {

            console.error(
                "Product add error:",
                error
            );

            res.status(500).send(
                "Product add nahi hua."
            );
        }

    }
);

router.put("/:id/stock", async (req, res) => {

    try {

        const stock = Number(req.body.stock);

        if (stock < 0 || isNaN(stock)) {
            return res.json({
                success: false,
                message: "Invalid stock quantity"
            });
        }

        await Product.findByIdAndUpdate(
            req.params.id,
            {
                stock: stock
            }
        );

        res.json({
            success: true
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Stock update failed"
        });

    }

});

router.put("/:id/price", async (req, res) => {

    try {

        const printPrice =
            Number(req.body.printPrice);

        const sellingPrice =
            Number(req.body.sellingPrice);


        if (
            isNaN(printPrice) ||
            isNaN(sellingPrice) ||
            printPrice < 0 ||
            sellingPrice < 0
        ) {

            return res.json({
                success: false,
                message: "Invalid price"
            });

        }


        if (sellingPrice > printPrice) {

            return res.json({
                success: false,
                message:
                    "Selling Price MRP se zyada nahi ho sakta."
            });

        }


        await Product.findByIdAndUpdate(
            req.params.id,
            {
                printPrice,
                sellingPrice
            }
        );


        res.json({
            success: true
        });


    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Price update failed"
        });

    }

});

// ==========================================
// ADD MORE PRODUCT PHOTOS
// MAX TOTAL = 4
// ==========================================

router.put(
    "/:id/image",
    upload.array("images", 4),
    async (req, res) => {

        try {

            const product =
                await Product.findById(
                    req.params.id
                );

            if (!product) {

                return res.json({

                    success: false,

                    message:
                        "Product nahi mila."

                });

            }

            const currentImages =
                Array.isArray(product.images)
                    ? product.images
                    : (
                        product.image
                            ? [product.image]
                            : []
                    );

            const newImages =
                req.files
                    ? req.files.map(
                        file =>
                            "/uploads/products/" +
                            file.filename
                    )
                    : [];

            if (
                currentImages.length +
                newImages.length >
                4
            ) {

                return res.json({

                    success: false,

                    message:
                        "Ek product me maximum 4 photos ho sakti hain."

                });

            }

            product.images =
                [
                    ...currentImages,
                    ...newImages
                ];

            // Old image field ko remove/ignore
            product.image = null;

            await product.save();

            res.json({

                success: true,

                message:
                    "Product photos updated successfully.",

                images:
                    product.images

            });

        } catch (error) {

            console.error(
                "Image update error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Photos update karne me error aaya."

            });

        }

    }
);


// ==========================================
// DELETE PRODUCT IMAGE
// ==========================================

router.delete("/:id/image/:imageIndex", async (req, res) => {

    try {

        const { id, imageIndex } = req.params;

        const index = Number(imageIndex);

        if (!Number.isInteger(index) || index < 0) {

            return res.status(400).json({
                success: false,
                message: "Invalid image index."
            });

        }

        const product = await Product.findById(id);

        if (!product) {

            return res.status(404).json({
                success: false,
                message: "Product nahi mila."
            });

        }


        // ------------------------------------------
        // NEW MULTIPLE IMAGES
        // ------------------------------------------

        if (
            Array.isArray(product.images) &&
            product.images.length > 0
        ) {

            if (index >= product.images.length) {

                return res.status(400).json({
                    success: false,
                    message: "Image nahi mili."
                });

            }


            const imagePath =
                product.images[index];


            // MongoDB se image remove
            product.images.splice(index, 1);


            // ------------------------------------------
            // LOCAL FILE DELETE
            // ------------------------------------------

            if (
                imagePath &&
                imagePath.startsWith("/uploads/")
            ) {

                const filePath = path.join(
                    __dirname,
                    "..",
                    "public",
                    imagePath
                );


                if (fs.existsSync(filePath)) {

                    fs.unlinkSync(filePath);

                }

            }


            await product.save();


            return res.json({
                success: true,
                message: "Photo delete ho gayi.",
                images: product.images
            });

        }


        // ------------------------------------------
        // OLD SINGLE IMAGE
        // ------------------------------------------

        if (product.image) {

            const imagePath =
                product.image;


            if (
                imagePath &&
                imagePath.startsWith("/uploads/")
            ) {

                const filePath = path.join(
                    __dirname,
                    "..",
                    "public",
                    imagePath
                );


                if (fs.existsSync(filePath)) {

                    fs.unlinkSync(filePath);

                }

            }


            product.image = null;

            await product.save();


            return res.json({
                success: true,
                message: "Photo delete ho gayi.",
                images: []
            });

        }


        return res.status(404).json({
            success: false,
            message: "Product me koi photo nahi hai."
        });


    } catch (error) {

        console.error(
            "Delete image error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Photo delete karne me error aaya."
        });

    }

});



module.exports = router;
