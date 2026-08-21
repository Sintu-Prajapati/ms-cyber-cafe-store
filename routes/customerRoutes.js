const express = require("express");
const router = express.Router();
exports.router = router;

const Customer = require("../models/Ccstomer");
const CustomerAuth = require("../models/CustomerAuth");
const Transaction = require("../models/Transaction");
const { route } = require("./productRoutes");
const Order = require("../models/Order");
const adminAuth =
    require("../middleware/adminAuth");
const Product = require("../models/product");



// ==========================================
// CUSTOMER PROFILE
// ==========================================

router.get("/profile", async (req, res) => {

    try {

        if (!req.session.customerId) {
            return res.redirect("/customer/login");
        }

        const customer =
            await CustomerAuth.findById(
                req.session.customerId
            );

        if (!customer) {
            return res.redirect("/customer/login");
        }

        res.render(
            "customer/profile",
            {
                customer
            }
        );

    } catch (error) {

        console.error(
            "PROFILE ERROR:",
            error
        );

        res.status(500).send(
            "Profile load nahi ho paya."
        );
    }

});



// ==========================================
// DELIVERY ADDRESS PAGE
// ==========================================

router.get("/order", async (req, res) => {

    try {

        if (!req.session.customerId) {

            return res.redirect(
                "/customer/login"
            );

        }


        const customer =
            await CustomerAuth.findById(
                req.session.customerId
            );


        if (!customer) {

            return res.redirect(
                "/customer/login"
            );

        }


        // Address already saved
        if (
            customer.address &&
            customer.address.name &&
            customer.address.number &&
            customer.address.village &&
            customer.address.pincode
        ) {

            // Directly order summary
            return res.redirect(
                "/customer/order-summary"
            );

        }


        // First time address
        res.render(
            "customer/order",
            {

                customerName:
                    customer.name || "",

                address:
                    customer.address || {}

            }
        );


    } catch (error) {

        console.error(
            "ORDER ADDRESS PAGE ERROR:",
            error
        );

        res.status(500).send(
            "Address page load nahi ho paya."
        );

    }

});


router.post("/save-cart", (req, res) => {

    if (!req.session.customerId) {

        return res.status(401).json({

            success: false,

            message: "Please login first."

        });

    }


    const cart =
        Array.isArray(req.body.cart)
            ? req.body.cart
            : [];


    if (cart.length === 0) {

        return res.json({

            success: false,

            message: "Cart is empty."

        });

    }


    req.session.cart = cart;


    res.json({

        success: true

    });

});


// ==========================================
// SAVE / UPDATE CUSTOMER ADDRESS
// ==========================================

router.post("/order", async (req, res) => {

    try {

        // Customer login check
        if (!req.session.customerId) {
            return res.redirect("/customer/login");
        }


        console.log("Customer ID:", req.session.customerId);

        console.log("Address Data:", req.body);


        // Find logged-in customer
        const customer = await CustomerAuth.findById(
            req.session.customerId
        );


        if (!customer) {

            console.log(
                "Customer not found:",
                req.session.customerId
            );

            return res.status(404).send(
                "Customer account nahi mila."
            );
        }


        // Create address object
        const address = {

            name: String(req.body.name || "").trim(),

            number: String(req.body.number || "").trim(),

            house: String(req.body.house || "").trim(),

            village: String(req.body.village || "").trim(),

            district: String(req.body.district || "").trim(),

            state: String(
                req.body.state || "Bihar"
            ).trim(),

            pincode: String(
                req.body.pincode || ""
            ).trim(),

            latitude:
                req.body.latitude
                    ? Number(req.body.latitude)
                    : null,

            longitude:
                req.body.longitude
                    ? Number(req.body.longitude)
                    : null

        };


        // Required fields check
        if (
            !address.name ||
            !address.number ||
            !address.house ||
            !address.village ||
            !address.district ||
            !address.state ||
            !address.pincode
        ) {

            return res.status(400).send(
                "Please complete delivery address."
            );

        }


        // Save address
        customer.address = address;


        // Save customer document
        await customer.save();


        console.log(
            "Address saved successfully:",
            customer.address
        );


        // Go to order summary
        res.redirect(
            "/customer/order-summary"
        );


    } catch (error) {

        console.error(
            "ADDRESS SAVE ERROR:",
            error
        );

        res.status(500).send(
            "Address save nahi ho paya."
        );

    }

});


// ==========================================
// CHANGE ADDRESS
// ==========================================

router.get("/change-address", async (req, res) => {

    try {

        if (!req.session.customerId) {

            return res.redirect(
                "/customer/login"
            );

        }


        const customer =
            await CustomerAuth.findById(
                req.session.customerId
            );


        if (!customer) {

            return res.redirect(
                "/customer/login"
            );

        }


        res.render(
            "customer/order",
            {

                customerName:
                    customer.name || "",

                address:
                    customer.address || {}

            }
        );


    } catch (error) {

        console.error(
            "CHANGE ADDRESS ERROR:",
            error
        );

        res.status(500).send(
            "Address load nahi ho paya."
        );

    }

});


router.get("/order-summary", async (req, res) => {

    if (!req.session.customerId) {
        return res.redirect("/customer/login");
    }

    const customer =
        await CustomerAuth.findById(
            req.session.customerId
        );

    const address = customer?.address || {};

    if (
        !customer ||
        !address ||
        !address.pincode
    ) {
        return res.redirect("/customer/order");
    }

    const cart =
        req.session.cart || [];

    let subtotal = 0;

    cart.forEach(item => {

        subtotal +=
            Number(item.price || 0) *
            Number(item.quantity || 0);

    });

    const discount = 0;

    const deliveryCharge = 0;

    const platformCharge = 4;

    const grandTotal =
        subtotal -
        discount +
        deliveryCharge +
        platformCharge;

    res.render(
        "customer/order-summary",
        {
            customerName:
                req.session.customerName || "",

            cart,

            address:
                customer.address,

            subtotal,

            discount,

            deliveryCharge,

            platformCharge,

            grandTotal
        }
    );

});


// ==========================================
// PAYMENT PAGE
// ==========================================

router.get("/payment", async (req, res) => {

    try {

        if (!req.session.customerId) {

            return res.redirect(
                "/customer/login"
            );

        }


        const customer =
            await CustomerAuth.findById(
                req.session.customerId
            );


        if (!customer) {
            return res.redirect("/customer/login");
        }


        if (
            !customer.address ||
            !customer.address.pincode
        ) {
            return res.redirect("/customer/order");
        }


        const cart =
            req.session.cart || [];


        if (cart.length === 0) {
            return res.redirect("/customer/home");
        }


        let subtotal = 0;


        cart.forEach(item => {

            subtotal +=
                Number(item.price || 0) *
                Number(item.quantity || 0);

        });


        const discount = 0;

        const deliveryCharge = 0;

        const platformCharge = 4;


        const grandTotal =
            subtotal -
            discount +
            deliveryCharge +
            platformCharge;


       res.render(
    "customer/payment",
    {
        customerName:
            customer.name || "",

        cart,

        address:
            customer.address,

        subtotal,

        discount,

        deliveryCharge,

        platformCharge,

        grandTotal,

        error:
            req.query.error || ""
    }
);


    } catch (error) {

        console.error(
            "PAYMENT PAGE ERROR:",
            error
        );

        res.status(500).send(
            "Payment page load nahi ho paya."
        );

    }

});



// ==========================================
// PLACE ORDER
// ==========================================

router.post("/place-order", async (req, res) => {

    try {

        if (!req.session.customerId) {

            return res.redirect(
                "/customer/login"
            );

        }


        const customer =
            await CustomerAuth.findById(
                req.session.customerId
            );


        if (!customer) {
            return res.redirect("/customer/login");
        }


        const cart =
            req.session.cart || [];


        if (cart.length === 0) {

            return res.redirect(
                "/customer/home"
            );

        }

        // ==========================================
        // MINIMUM PRODUCT CHECK
        // ==========================================

        const totalProductQuantity =
            cart.reduce(
                (total, item) =>
                    total +
                    Number(item.quantity || 0),
                0
            );


        if (totalProductQuantity < 3) {

            return res.redirect(
                "/customer/payment?error=min-products"
            );

        }


        // ==========================================
        // MINIMUM ORDER VALUE CHECK
        // ==========================================

        const minimumOrderValue =
            cart.reduce(
                (total, item) =>
                    total +
                    (
                        Number(item.price || 0) *
                        Number(item.quantity || 0)
                    ),
                0
            );


        if (minimumOrderValue < 100) {

            return res.redirect(
                "/customer/payment?error=min-order"
            );

        }


        if (
            !customer.address ||
            !customer.address.pincode
        ) {

            return res.redirect(
                "/customer/order"
            );

        }



        // ==================================
        // CALCULATE TOTAL
        // ==================================

        let subtotal = 0;


        const orderProducts =
            cart.map(item => {

                const price =
                    Number(item.price || 0);

                const quantity =
                    Number(item.quantity || 0);

                const total =
                    price * quantity;


                subtotal += total;


                return {

                    product: item.id,

                    name: item.name,

                    image: item.image || "",

                    price: price,

                    quantity: quantity,

                    total: total

                };

            });


        const discount = 0;

        const deliveryCharge = 0;

        const platformCharge = 4;


        const grandTotal =
            subtotal -
            discount +
            deliveryCharge +
            platformCharge;


        // ==================================
        // PAYMENT METHOD
        // ==================================

        const paymentMethod =
            req.body.paymentMethod === "UPI"
                ? "UPI"
                : "COD";


        const paymentStatus =
            paymentMethod === "COD"
                ? "Pending"
                : "Pending";


        // ==================================
        // ORDER ID
        // ==================================

        const orderId =
            "MS" +
            Date.now();


        // ==================================
        // CREATE ORDER
        // ==================================

        const order =
            new Order({

                customer:
                    customer._id,

                orderId:

                    orderId,

                products:
                    orderProducts,

                deliveryAddress: {

                    name:
                        customer.address.name,

                    number:
                        customer.address.number,

                    house:
                        customer.address.house,

                    village:
                        customer.address.village,

                    district:
                        customer.address.district,

                    state:
                        customer.address.state,

                    pincode:
                        customer.address.pincode,

                    latitude:
                        customer.address.latitude,

                    longitude:
                        customer.address.longitude

                },

                subtotal:
                    subtotal,

                discount:
                    discount,

                deliveryCharge:
                    deliveryCharge,

                platformCharge:
                    platformCharge,

                grandTotal:
                    grandTotal,

                paymentMethod:
                    paymentMethod,

                paymentStatus:
                    paymentStatus,

                paymentAmount:
                    grandTotal,

                orderStatus:
                    "Pending"

            });


        await order.save();


        // ==================================
        // CLEAR CART
        // ==================================

        req.session.cart = [];


        // ==================================
        // SUCCESS PAGE
        // ==================================

        res.redirect(
            "/customer/order-success/" +
            order._id
        );


    } catch (error) {

        console.error(
            "PLACE ORDER ERROR:",
            error
        );

        res.redirect(
            "/customer/order-success/" +
            order._id
        );
    }

});

// ==========================================
// ORDER SUCCESS
// ==========================================

router.get("/order-success/:id", async (req, res) => {

    try {

        if (!req.session.customerId) {
            return res.redirect("/customer/login");
        }


        const order = await Order.findOne({
            _id: req.params.id,
            customer: req.session.customerId
        });


        if (!order) {

            return res.redirect(
                "/customer/orders"
            );

        }


        res.render(
            "customer/order-success",
            {
                order,

                customerName:
                    req.session.customerName || ""
            }
        );


    } catch (error) {

        console.error(
            "ORDER SUCCESS ERROR:",
            error
        );

        res.status(500).send(
            "Order details load nahi ho paya."
        );

    }

});


// ==========================================
// MY ORDERS
// ==========================================

router.get("/orders", async (req, res) => {

    try {

        if (!req.session.customerId) {
            return res.redirect("/customer/login");
        }

        const orders = await Order.find({
            customer: req.session.customerId
        })
            .sort({
                createdAt: -1
            });

        res.render(
            "customer/orders",
            {
                orders
            }
        );

    } catch (error) {

        console.error(
            "MY ORDERS ERROR:",
            error
        );

        res.status(500).send(
            "Orders load nahi ho paye."
        );
    }

});


// ==========================================
// TRACK ORDER
// ==========================================

router.get(
    "/track-order/:id",
    async (req, res) => {

        try {

            if (!req.session.customerId) {

                return res.redirect(
                    "/customer/login"
                );

            }


            const order =
                await Order.findOne({

                    _id: req.params.id,

                    customer:
                        req.session.customerId

                })
                    .populate(
                        "deliveryPerson",
                        "name number"
                    );


            if (!order) {

                return res.redirect(
                    "/customer/orders"
                );

            }


            res.render(
                "customer/track-order",
                {
                    order,
                    success:
                        req.query.success || "",
                    error:
                        req.query.error || ""
                }
            );


        } catch (error) {

            console.error(
                "TRACK ORDER ERROR:",
                error
            );

            res.status(500).send(
                "Order tracking load nahi ho payi."
            );

        }

    }
);


// ==========================================
// CUSTOMER CANCEL ORDER
// ==========================================

// ==========================================
// CUSTOMER CANCEL ORDER
// ==========================================

router.post(
    "/orders/:id/cancel",
    async (req, res) => {

        try {

            // ==================================
            // LOGIN CHECK
            // ==================================

            if (!req.session.customerId) {

                return res.redirect(
                    "/customer/login"
                );

            }


            const customerId =
                req.session.customerId;


            // ==================================
            // FIND CUSTOMER ORDER
            // ==================================

            const order =
                await Order.findOne({

                    _id: req.params.id,

                    customer:
                        customerId

                });


            if (!order) {

                return res.redirect(
                    "/customer/orders"
                );

            }


            // ==================================
            // CHECK CANCEL STATUS
            // ==================================

            const cancellableStatuses = [

                "Pending",

                "Accepted"

            ];


            if (
                !cancellableStatuses.includes(
                    order.orderStatus
                )
            ) {

                return res.redirect(
                    `/customer/track-order/${order._id}?error=cancel-not-allowed`
                );

            }


            // ==================================
            // RESTORE STOCK
            // ==================================

            for (
                const item of order.products
            ) {

                if (!item.product) {
                    continue;
                }


                const product =
                    await Product.findById(
                        item.product
                    );


                if (product) {

                    product.stock =
                        Number(
                            product.stock || 0
                        ) +
                        Number(
                            item.quantity || 0
                        );


                    await product.save();

                }

            }


            // ==================================
            // CANCEL ORDER
            // ==================================

            order.orderStatus =
                "Cancelled";


            // Agar schema me fields hain
            // to ye save honge

            order.cancelledAt =
                new Date();

            order.cancelledBy =
                "Customer";


            await order.save();


            // ==================================
            // SUCCESS
            // ==================================

            return res.redirect(
                `/customer/track-order/${order._id}?success=cancelled`
            );


        } catch (error) {

            console.error(
                "CUSTOMER CANCEL ORDER ERROR:",
                error
            );


            return res.status(500).send(
                "Order cancel nahi ho paya. Please try again."
            );

        }

    }
);

router.get(
    "/about",
    async (req, res) => {

        res.render(
            "customer/about"
        );

    }
);

module.exports = router;
