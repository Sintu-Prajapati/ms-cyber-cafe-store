const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        category: {
            type: String,
            required: true,
            trim: true,
            default: "Grocery"
        },

        unit: {
            type: String,
            enum: ["piece", "kg", "gram", "litre", "ml"],
            required: true
        },

        printPrice: {
            type: Number,
            required: true,
            min: 0,
            default: 0
        },

        sellingPrice: {
            type: Number,
            required: true,
            min: 0,
            default: 0
        },

        stock: {
            type: Number,
            required: true,
            min: 0,
            default: 0
        },
        images: {
            type: [String],
            default: []
        },

        // Purane products ke liye backward compatibility
        image: {
            type: String,
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Product", productSchema);