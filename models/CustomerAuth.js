const mongoose = require("mongoose");

const customerAuthSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        mobile: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        password: {
            type: String,
            required: true
        },

        address: {
            name: String,
            number: String,
            house: String,
            village: String,
            district: String,
            state: String,
            pincode: String,
            latitude: Number,
            longitude: Number
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "CustomerAuth",
    customerAuthSchema
);