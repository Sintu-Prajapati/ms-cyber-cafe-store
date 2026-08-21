const express = require("express");
const bcrypt = require("bcrypt");

const router = express.Router();

const DeliveryPerson =
    require("../models/DeliveryPerson");

const Order = require("../models/order");
const deliveryAuth = require("../middleware/deliveryAuth");


// ==========================================
// DELIVERY LOGIN PAGE
// ==========================================

router.get("/login", (req, res) => {

    // Already logged in
    if (req.session.deliveryPersonId) {

        return res.redirect(
            "/delivery/dashboard"
        );

    }

    res.render(
        "delivery/login",
        {
            error: null
        }
    );

});


// ==========================================
// DELIVERY LOGIN
// ==========================================

router.post("/login", async (req, res) => {

    try {

        const {
            username,
            password
        } = req.body;


        // Empty check

        if (
            !username ||
            !password
        ) {

            return res.render(
                "delivery/login",
                {
                    error:
                        "Username aur password dono enter karein."
                }
            );

        }


        // Find delivery person

        const deliveryPerson =
            await DeliveryPerson.findOne({
                username:
                    username.trim()
            });


        if (!deliveryPerson) {

            return res.render(
                "delivery/login",
                {
                    error:
                        "Invalid username ya password."
                }
            );

        }


        // Check active

        if (
            deliveryPerson.active === false
        ) {

            return res.render(
                "delivery/login",
                {
                    error:
                        "Aapka delivery account inactive hai."
                }
            );

        }


        // Password check

        const passwordMatch =
            await bcrypt.compare(
                password,
                deliveryPerson.password
            );


        if (!passwordMatch) {

            return res.render(
                "delivery/login",
                {
                    error:
                        "Invalid username ya password."
                }
            );

        }


        // ==================================
        // CREATE SESSION
        // ==================================

        req.session.deliveryPersonId =
            deliveryPerson._id.toString();

        req.session.deliveryPersonName =
            deliveryPerson.name;

        req.session.deliveryPersonNumber =
            deliveryPerson.number;


        // Dashboard

        res.redirect(
            "/delivery/dashboard"
        );


    } catch (error) {

        console.error(
            "DELIVERY LOGIN ERROR:",
            error
        );

        res.render(
            "delivery/login",
            {
                error:
                    "Something went wrong. Please try again."
            }
        );

    }

});


// ==========================================
// DELIVERY LOGOUT
// ==========================================

router.get("/logout", (req, res) => {

    req.session.deliveryPersonId = null;

    req.session.deliveryPersonName = null;

    req.session.deliveryPersonNumber = null;


    res.redirect(
        "/delivery/login"
    );

});



// ==========================================
// DELIVERY DASHBOARD
// ==========================================

router.get(
    "/dashboard",
    deliveryAuth,
    async (req, res) => {

        try {

            const deliveryPersonId =
                req.session.deliveryPersonId;


            // Sirf assigned orders

            const orders =
                await Order.find({
                    deliveryPerson:
                        deliveryPersonId
                })
                    .populate(
                        "customer",
                        "name number"
                    )
                    .sort({
                        createdAt: -1
                    });


            // COUNTS

            const totalOrders =
                orders.length;


            const pendingOrders =
                orders.filter(order =>
                    [
                        "Pending",
                        "Accepted",
                        "Preparing",
                        "Ready for Delivery"
                    ].includes(
                        order.orderStatus
                    )
                ).length;


            const outForDelivery =
                orders.filter(order =>
                    order.orderStatus ===
                    "Out for Delivery"
                ).length;


            const deliveredOrders =
                orders.filter(order =>
                    order.orderStatus ===
                    "Delivered"
                ).length;


            // COD AMOUNT

            const codAmount =
                orders
                    .filter(order =>
                        order.paymentMethod === "COD" &&
                        order.paymentStatus === "Pending"
                    )
                    .reduce(
                        (total, order) =>
                            total +
                            Number(
                                order.grandTotal || 0
                            ),
                        0
                    );


            // RECENT ORDERS

            const recentOrders =
                orders.slice(0, 5);


            res.render(
                "delivery/dashboard",
                {
                    orders,
                    recentOrders,
                    totalOrders,
                    pendingOrders,
                    outForDelivery,
                    deliveredOrders,
                    codAmount,
                    session: req.session
                }
            );


        } catch (error) {

            console.error(
                "DELIVERY DASHBOARD ERROR:",
                error
            );

            res.status(500).send(
                "Dashboard load nahi ho paya."
            );

        }

    }
);


// ==========================================
// MY DELIVERY ORDERS
// ==========================================

router.get(
    "/orders",
    deliveryAuth,
    async (req, res) => {

        try {

            const deliveryPersonId =
                req.session.deliveryPersonId;

            const orders =
                await Order.find({
                    deliveryPerson:
                        deliveryPersonId
                })
                    .populate(
                        "customer",
                        "name number email"
                    )
                    .sort({
                        createdAt: -1
                    });

            res.render(
                "delivery/orders",
                {
                    orders,
                    success:
                        req.query.success || ""
                }
            );

        } catch (error) {

            console.error(
                "DELIVERY ORDERS ERROR:",
                error
            );

            res.status(500).send(
                "Orders load nahi ho paye."
            );
        }

    }
);


// ==========================================
// DELIVERY ORDER DETAILS
// ==========================================

router.get(
    "/orders/:id",
    deliveryAuth,
    async (req, res) => {

        try {

            const deliveryPersonId =
                req.session.deliveryPersonId;

            const order =
                await Order.findOne({

                    _id: req.params.id,

                    deliveryPerson:
                        deliveryPersonId

                })
                    .populate(
                        "customer",
                        "name number email"
                    )
                    .populate(
                        "deliveryPerson",
                        "name number"
                    );


            if (!order) {

                return res.redirect(
                    "/delivery/orders"
                );

            }


            res.render(
                "delivery/order-details",
                {
                    order
                }
            );

        } catch (error) {

            console.error(
                "DELIVERY ORDER DETAILS ERROR:",
                error
            );

            res.status(500).send(
                "Order details load nahi ho paye."
            );
        }

    }
);


// ==========================================
// MARK COD PAYMENT RECEIVED
// ==========================================

router.post(
    "/orders/:id/payment",
    deliveryAuth,
    async (req, res) => {

        try {

            const deliveryPersonId =
                req.session.deliveryPersonId;


            const order =
                await Order.findOne({
                    _id: req.params.id,
                    deliveryPerson:
                        deliveryPersonId
                });


            if (!order) {

                return res.redirect(
                    "/delivery/orders"
                );

            }


            // Sirf COD order ke liye

            if (
                order.paymentMethod !== "COD"
            ) {

                return res.redirect(
                    `/delivery/orders/${order._id}`
                );

            }


            // Already paid hai to kuch nahi karna

            if (
                order.paymentStatus === "Paid"
            ) {

                return res.redirect(
                    `/delivery/orders/${order._id}`
                );

            }


            // Payment received

            order.paymentStatus = "Paid";

            order.paymentAmount =
                order.grandTotal;


            await order.save();


            res.redirect(
                `/delivery/orders/${order._id}`
            );


        } catch (error) {

            console.error(
                "PAYMENT RECEIVE ERROR:",
                error
            );

            res.status(500).send(
                "Payment status update nahi ho paya."
            );

        }

    }
);


// ==========================================
// MARK ORDER DELIVERED
// ==========================================

router.post(
    "/orders/:id/delivered",
    deliveryAuth,
    async (req, res) => {

        try {

            const deliveryPersonId =
                req.session.deliveryPersonId;

            const order =
                await Order.findOne({
                    _id: req.params.id,
                    deliveryPerson:
                        deliveryPersonId
                });

            if (!order) {

                return res.redirect(
                    "/delivery/orders"
                );

            }


            // COD hai aur payment pending hai
            // to delivered nahi karne denge

            if (
                order.paymentMethod === "COD" &&
                order.paymentStatus !== "Paid"
            ) {

                return res.redirect(
                    `/delivery/orders/${order._id}?error=payment`
                );

            }


            order.orderStatus =
                "Delivered";

            await order.save();


            // Success message ke saath orders page

            res.redirect(
                "/delivery/orders?success=delivered"
            );


        } catch (error) {

            console.error(
                "DELIVER ORDER ERROR:",
                error
            );

            res.status(500).send(
                "Order delivered update nahi ho paya."
            );

        }

    }
);


// ==========================================
// ASSIGNED ORDER COUNT API
// ==========================================

router.get(
    "/pending-order-count",
    deliveryAuth,
    async (req, res) => {

        try {

            const deliveryPersonId =
                req.session.deliveryPersonId;

            const pendingOrders =
                await Order.countDocuments({

                    deliveryPerson:
                        deliveryPersonId,

                    orderStatus: {
                        $in: [
                            "Ready for Delivery",
                            "Out for Delivery"
                        ]
                    }

                });

            res.json({
                success: true,
                pendingOrders
            });

        } catch (error) {

            console.error(
                "DELIVERY ORDER COUNT ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                pendingOrders: 0
            });

        }

    }
);


module.exports = router;
