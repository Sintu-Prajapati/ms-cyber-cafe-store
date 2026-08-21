const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
    {

        // ==========================================
        // CUSTOMER
        // ==========================================

        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
            required: true
        },


        // ==========================================
        // ORDER ID
        // ==========================================

        orderId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },


        // ==========================================
        // PRODUCTS
        // ==========================================

        products: [
            {

                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                    required: true
                },

                name: {
                    type: String,
                    required: true
                },

                image: {
                    type: String,
                    default: ""
                },

                price: {
                    type: Number,
                    required: true,
                    min: 0
                },

                quantity: {
                    type: Number,
                    required: true,
                    min: 1
                },

                total: {
                    type: Number,
                    required: true,
                    min: 0
                }

            }
        ],


        // ==========================================
        // DELIVERY ADDRESS
        // ==========================================

        deliveryAddress: {

            name: {
                type: String,
                required: true
            },

            number: {
                type: String,
                required: true
            },

            house: {
                type: String,
                required: true
            },

            village: {
                type: String,
                required: true
            },

            district: {
                type: String,
                required: true
            },

            state: {
                type: String,
                required: true
            },

            pincode: {
                type: String,
                required: true
            },


            // ==========================================
            // MAP LOCATION
            // ==========================================

            latitude: {
                type: Number,
                default: null
            },

            longitude: {
                type: Number,
                default: null
            }

        },


        // ==========================================
        // PRICE DETAILS
        // ==========================================

        subtotal: {
            type: Number,
            required: true,
            min: 0
        },

        discount: {
            type: Number,
            default: 0,
            min: 0
        },

        deliveryCharge: {
            type: Number,
            default: 0,
            min: 0
        },

        platformCharge: {
            type: Number,
            default: 4,
            min: 0
        },

        grandTotal: {
            type: Number,
            required: true,
            min: 0
        },


        // ==========================================
        // PAYMENT
        // ==========================================

        paymentMethod: {
            type: String,
            enum: [
                "COD",
                "UPI"
            ],
            default: "COD"
        },

        paymentStatus: {
            type: String,
            enum: [
                "Pending",
                "Paid",
                "Failed",
                "Refunded"
            ],
            default: "Pending"
        },

        paymentAmount: {
            type: Number,
            default: 0,
            min: 0
        },


        // ==========================================
        // ORDER STATUS
        // ==========================================

        orderStatus: {
            type: String,
            enum: [
                "Pending",
                "Accepted",
                "Preparing",
                "Ready for Delivery",
                "Out for Delivery",
                "Delivered",
                "Cancelled"
            ],
            default: "Pending"
        },


        // ==========================================
        // ORDER DATE
        // ==========================================

        orderedAt: {
            type: Date,
            default: Date.now
        },


        // ==========================================  
        // DELIVERY PERSON     
        deliveryPerson: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "DeliveryPerson",
            default: null
        },

        deliveryAssignedAt: {
            type: Date,
            default: null
        }

    },

    {
        timestamps: true
    }
);


module.exports = mongoose.model(
    "Order",
    orderSchema
);