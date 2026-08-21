const express = require("express");
const router = express.Router();

const Product = require("../models/Product");
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
router.post("/add", async (req, res) => {
    try {
        const { name, category, unit, printPrice, sellingPrice, stock } = req.body;

        await Product.create({
            name,
            category,
            unit,
            printPrice: Number(printPrice),
            sellingPrice: Number(sellingPrice),
            stock
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

router.put(
    "/:id/image",
    upload.single("image"),
    async (req, res) => {

        try {

            if (!req.file) {

                return res.json({
                    success: false,
                    message: "Image select kare."
                });

            }


            await Product.findByIdAndUpdate(
                req.params.id,
                {
                    image: "/uploads/products/" + req.file.filename
                }
            );


            res.json({
                success: true
            });


        } catch (error) {

            console.error(error);

            res.status(500).json({
                success: false,
                message: "Image update failed."
            });

        }

    }
);


module.exports = router;