const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
    {
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
            required: true
        },

        type: {
            type: String,
            enum: ["bill", "payment"],
            required: true
        },

        billNumber: {
            type: String,
            default: null
        },

        items: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                    default: null
                },

                name: {
                    type: String,
                    required: true
                },

                quantity: {
                    type: Number,
                    required: true
                },

                unit: {
                    type: String,
                    required: true
                },

                price: {
                    type: Number,
                    required: true
                },

                total: {
                    type: Number,
                    required: true
                }
            }
        ],

        productTotal: {
            type: Number,
            default: 0
        },

        printingCharge: {
            type: Number,
            default: 0
        },

        grandTotal: {
            type: Number,
            default: 0
        },

        paidAmount: {
            type: Number,
            default: 0
        },

        creditAmount: {
            type: Number,
            default: 0
        },

        paymentAmount: {
            type: Number,
            default: 0
        },

        paymentDescription: {
            type: String,
            default: "Payment Received"
        },

        paymentMode: {
            type: String,
            enum: ["cash", "upi", "mixed", null],
            default: null
        },

        date: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "Transaction",
    transactionSchema
);