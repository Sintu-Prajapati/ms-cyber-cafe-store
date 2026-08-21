const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        mobile: {
            type: String,
            trim: true
        },

        village: {
            type: String,
            trim: true
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
},

        openingBalance: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "Customer",
    customerSchema
);