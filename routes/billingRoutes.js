const express = require("express");
const router = express.Router();

const Product = require("../models/product");
const Customer = require("../models/Customer");
const Transaction = require("../models/Transaction");

router.get("/", async (req, res) => {

    try {

        const products =
            await Product.find()
                .sort({ name: 1 });

        const customers =
            await Customer.find()
                .sort({ name: 1 });


        res.render("billing", {

            products,
            customers

        });

    } catch (error) {

        console.error(error);

        res.status(500).send(
            "Billing page load nahi ho paya"
        );

    }

});



// ==========================================
// SAVE BILL
// ==========================================

router.post("/create", async (req, res) => {

    try {

        const {
            customerId,
            items,
            paidAmount,
            creditAmount,
            paymentMode
        } = req.body;


        // --------------------------------------
        // CUSTOMER CHECK
        // --------------------------------------

        const customer =
            await Customer.findById(customerId);


        if (!customer) {

            return res.status(404).send(
                "Customer nahi mila"
            );

        }


        // --------------------------------------
        // ITEMS JSON
        // --------------------------------------

        let cartItems = items;


        if (typeof items === "string") {

            cartItems = JSON.parse(items);

        }


        if (
            !Array.isArray(cartItems) ||
            cartItems.length === 0
        ) {

            return res.status(400).send(
                "Bill me koi product nahi hai"
            );

        }


        // --------------------------------------
        // CALCULATE PRODUCTS
        // --------------------------------------

        const finalItems = [];

        let productTotal = 0;


        for (const item of cartItems) {

            const product =
                await Product.findById(
                    item.productId
                );


            if (!product) {

                return res.status(404).send(
                    `Product nahi mila: ${item.name}`
                );

            }


            const quantity =
                Number(item.quantity);


            if (
                !quantity ||
                quantity <= 0
            ) {

                return res.status(400).send(
                    "Invalid quantity"
                );

            }


            // Stock check

            if (
                product.stock < quantity
            ) {

                return res.status(400).send(
                    `${product.name} ka stock kam hai`
                );

            }


            const price =
                Number(product.sellingPrice);

            if (!Number.isFinite(price) || price < 0) {
                return res.status(400).send(
                    `${product.name} ka selling price valid nahi hai`
                );
            }


            const total =
                quantity * price;


            productTotal += total;


            finalItems.push({

                productId:
                    product._id,

                name:
                    product.name,

                quantity,

                unit:
                    item.unit ||
                    product.unit ||
                    "pcs",

                price,

                total

            });


            // ----------------------------------
            // STOCK MINUS
            // ----------------------------------

            product.stock -= quantity;

            await product.save();

        }


        // --------------------------------------
        // PRINTING CHARGE
        // --------------------------------------

        const printingCharge = 0;


        const grandTotal =
            productTotal +
            printingCharge;


        // --------------------------------------
        // PAYMENT
        // --------------------------------------

        const paid =
            Number(paidAmount) || 0;


        const udhar =
            Number(creditAmount) || 0;


        // --------------------------------------
        // IMPORTANT VALIDATION
        // --------------------------------------

        const difference =
            paid + udhar;


        if (
            Math.abs(
                difference - grandTotal
            ) > 0.01
        ) {

            return res.status(400).send(
                `Payment galat hai. Bill ₹${grandTotal.toFixed(2)} hai. Paid + Udhar ₹${difference.toFixed(2)} hai.`
            );

        }


        // --------------------------------------
        // BILL NUMBER
        // --------------------------------------

        const billNumber =
            "BILL-" +
            Date.now();


        // --------------------------------------
        // SAVE TRANSACTION
        // --------------------------------------

        const transaction =
            await Transaction.create({

                customer:
                    customer._id,

                type:
                    "bill",

                billNumber,

                items:
                    finalItems,

                productTotal,

                printingCharge,

                grandTotal,

                paidAmount:
                    paid,

                creditAmount:
                    udhar,

                paymentMode:
                    paymentMode || "cash",

                date:
                    new Date()

            });


        // --------------------------------------
        // OPEN BILL RECEIPT
        // --------------------------------------

        res.redirect(
            `/customers/${customer._id}/bill/${transaction._id}`
        );


    } catch (error) {

        console.error(error);

        res.status(500).send(
            "Bill save nahi ho paya"
        );

    }

});


module.exports = router;
