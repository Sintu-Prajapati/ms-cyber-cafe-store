const express = require("express");
const router = express.Router();

const Product = require("../models/product");
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
router.post("/add", upload.array("images", 4), async (req, res) => {
    try {
        const { name, category, unit, printPrice, sellingPrice, stock } = req.body;
        const images = (req.files || []).map(
            file => "/uploads/products/" + file.filename
        );

        await Product.create({
            name,
            category,
            unit,
            printPrice: Number(printPrice),
            sellingPrice: Number(sellingPrice),
            stock,
            images
        });

        res.redirect("/products");
    } catch (error) {
        console.error(error);
        res.status(500).send("that product can't be added");
    }
});

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

            if (
                !req.files ||
                req.files.length === 0
            ) {

                return res.json({

                    success: false,

                    message:
                        "Kam se kam 1 photo select karein."

                });

            }


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


            // New uploaded photos
            const newImages =
                req.files.map(
                    file =>
                        "/uploads/products/" +
                        file.filename
                );


            // Existing images
            const oldImages =
                Array.isArray(
                    product.images
                )
                    ? product.images.filter(
                        Boolean
                    )
                    : [];


            // Old products ke liye
            // single image support
            const legacyImage =
                product.image &&
                !oldImages.includes(
                    product.image
                )
                    ? [
                        product.image
                    ]
                    : [];


            const existingImages = [

                ...oldImages,

                ...legacyImage

            ];


            // Total maximum 4 photos
            const finalImages = [

                ...existingImages,

                ...newImages

            ].slice(0, 4);


            product.images =
                finalImages;


            // Backward compatibility
            product.image =
                finalImages[0] ||
                null;


            await product.save();


            return res.json({

                success: true,

                images:
                    finalImages

            });


        } catch (error) {

            console.error(
                "MULTIPLE IMAGE UPDATE ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Photos update failed."

            });

        }

    }
);



module.exports = router;
