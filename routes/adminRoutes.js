const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const Admin = require("../models/Admin");
const Customer = require("../models/Customer");
const CustomerAuth = require("../models/CustomerAuth");
const Transaction = require("../models/Transaction");
const Product = require("../models/Product");
const { route } = require("./productRoutes");
const Order = require("../models/Order");
const adminAuth = require("../middleware/adminAuth");
const DeliveryPerson =
    require("../models/DeliveryPerson");


router.get("/", (req, res) => {

    if (!req.session.adminId) {
        return res.redirect("/admin/login");
    }

    return res.redirect("/dashboard");
});





// ==========================================
// ADMIN LOGIN PAGE
// ==========================================

router.get("/login", (req, res) => {

    if (req.session.adminId) {

        return res.redirect("/dashboard");

    }

    res.render(
        "admin/login",
        {
            error: null
        }
    );

});


// ==========================================
// ADMIN LOGIN
// ==========================================

router.post("/login", async (req, res) => {

    try {

        const {
            username,
            password
        } = req.body;


        const admin =
            await Admin.findOne({
                username: username.trim()
            });


        if (!admin) {

            return res.render(
                "admin/login",
                {
                    error:
                        "Invalid Admin ID or Password."
                }
            );

        }


        const passwordMatch =
            await bcrypt.compare(
                password,
                admin.password
            );


        if (!passwordMatch) {

            return res.render(
                "admin/login",
                {
                    error:
                        "Invalid Admin ID or Password."
                }
            );

        }


        // ADMIN SESSION

        req.session.adminId =
            admin._id.toString();

        req.session.adminUsername =
            admin.username;


        return res.redirect("/dashboard");


    } catch (error) {

        console.error(
            "ADMIN LOGIN ERROR:",
            error
        );

        res.render(
            "admin/login",
            {
                error:
                    "Something went wrong. Please try again."
            }
        );

    }

});


// ==========================================
// ADMIN LOGOUT
// ==========================================

router.get("/logout", (req, res) => {

    req.session.destroy(() => {

        res.redirect(
            "/admin/login"
        );

    });

});



// ==========================================
// ADMIN DASHBOARD
// ==========================================

router.get(
    "/dashboard",
    adminAuth,
    async (req, res) => {

        try {

            const totalProducts =
                await Product.countDocuments();

            const totalCustomers =
                await Customer.countDocuments();

            const totalOrders =
                await Order.countDocuments();

                const pendingOrders =
    await Order.countDocuments({
        orderStatus: "Pending"
    });


            // Total stock
            const products =
                await Product.find(
                    {},
                    { stock: 1 }
                );

            const totalStock =
                products.reduce(
                    (total, product) =>
                        total +
                        Number(product.stock || 0),
                    0
                );


            // Total sales
            const salesResult =
                await Order.aggregate([

                    {
                        $match: {
                            orderStatus: "Delivered"
                        }
                    },

                    {
                        $group: {
                            _id: null,

                            total: {
                                $sum: "$grandTotal"
                            }
                        }
                    }

                ]);


            const totalSales =
                salesResult.length > 0
                    ? salesResult[0].total
                    : 0;


            // Latest orders
            const latestOrders =
                await Order.find()
                    .populate(
                        "customer",
                        "name number"
                    )
                    .sort({
                        createdAt: -1
                    })
                    .limit(5);


            // Low stock
            const lowStockProducts =
                await Product.find({
                    stock: {
                        $lte: 5
                    }
                })
                    .sort({
                        stock: 1
                    })
                    .limit(5);


            res.render("dashboard", {
                totalProducts,
                totalCustomers,
                totalOrders,
                pendingOrders,
                totalStock,
                totalSales,
                latestOrders,
                lowStockProducts,
                session: req.session
            });


        } catch (error) {

            console.error(
                "ADMIN DASHBOARD ERROR:",
                error
            );

            res.status(500).send(
                "Dashboard load nahi ho paya."
            );

        }

    }
);



//==========================================
// CUSTOMER LIST
// ==========================================

router.get("/customers", async (req, res) => {

    if (!req.session.adminId) {
        return res.redirect(
            "/admin/login"
        );
    }

    const customers = await Customer.find().sort({ name: 1 });

    const transactions = await Transaction.find();

    let totalUdhar = 0;

    const customerBalances = {};

    transactions.forEach(transaction => {

        const customerId = transaction.customer.toString();

        if (!customerBalances[customerId]) {
            customerBalances[customerId] = 0;
        }

        // Bill se udhar badhega
        if (transaction.type === "bill") {

            customerBalances[customerId] +=
                Number(transaction.creditAmount || 0);

        }

        // Payment se udhar ghatega
        if (transaction.type === "payment") {

            customerBalances[customerId] -=
                Number(transaction.paymentAmount || 0);

        }

    });


    // Customer-wise current balance
    customers.forEach(customer => {

        // Opening balance se start karo
        let balance =
            Number(customer.openingBalance) || 0;

        // Transaction balance add karo
        balance +=
            customerBalances[customer._id.toString()] || 0;

        // Agar payment zyada ho gaya ho to negative balance ko
        // total udhar me count nahi karna
        balance = Math.max(balance, 0);

        customer.currentUdhar = balance;

        totalUdhar += balance;

    });


    res.render("customers", {
        customers,
        totalUdhar
    });

});



// ==========================================
// ADD CUSTOMER
// ==========================================

router.post("/add", async (req, res) => {



    try {

        const {
            name,
            mobile,
            village,
            address,
            openingBalance
        } = req.body;


        await Customer.create({

            name,
            mobile,
            village,
            address,

            openingBalance:
                Number(openingBalance) || 0

        });


        res.redirect("/admin/customers");

    } catch (error) {

        console.error(error);

        res.status(500).send(
            "Customer add nahi ho paya"
        );

    }

});


// ==========================================
// CUSTOMER PASSBOOK
// ==========================================


router.get("/customers/passbook", async (req, res) => {

    if (!req.session.adminId) {

        return res.redirect(
            "/admin/login"
        );

    }

    try {
        const customers = await Customer.find().sort({ name: 1 });
        res.render("customerPassbook", { customers });
    } catch (error) {
        console.error(error);
        res.status(500).send("Something went wrong");
    }
});


router.get("/customers/:id/passbook", async (req, res) => {

    try {

        const customer =
            await Customer.findById(
                req.params.id
            );


        if (!customer) {

            return res.status(404).send(
                "Customer nahi mila"
            );

        }


        const transactions =
            await Transaction.find({
                customer: customer._id
            })
                .sort({ date: 1 });


        // Opening balance
        let balance =
            Number(customer.openingBalance) || 0;


        // Calculate running balance
        const history =
            transactions.map(transaction => {

                if (
                    transaction.type === "bill"
                ) {

                    balance +=
                        Number(
                            transaction.creditAmount
                        );

                }

                if (
                    transaction.type === "payment"
                ) {

                    balance -=
                        Number(
                            transaction.paymentAmount
                        );

                }


                return {
                    transaction,
                    balance
                };

            });


        res.render("passbook", {

            customer,

            history,

            balance

        });

    } catch (error) {

        console.error(error);

        res.status(500).send(
            "Passbook load nahi ho paya"
        );

    }

});


// ==========================================
// ADD PAYMENT
// ==========================================

router.post(
    "/customers/:id/payment",
    async (req, res) => {

        try {

            const {
                amount,
                description,
                paymentMode
            } = req.body;


            const customer =
                await Customer.findById(
                    req.params.id
                );


            if (!customer) {

                return res.status(404).send(
                    "Customer nahi mila"
                );

            }


            const paymentAmount =
                Number(amount);


            if (
                !paymentAmount ||
                paymentAmount <= 0
            ) {

                return res.status(400).send(
                    "Invalid payment amount"
                );

            }


            await Transaction.create({

                customer: customer._id,

                type: "payment",

                paymentAmount,

                paymentMode:
                    paymentMode || "cash",

                paymentDescription:
                    description ||
                    "Payment Received",

                date: new Date()

            });


            res.redirect(
                `/admin/customers/${customer._id}/passbook`
            );

        } catch (error) {

            console.error(error);

            res.status(500).send(
                "Payment save nahi ho paya"
            );

        }

    }
);


// ==========================================
// VIEW BILL
// ==========================================

router.get(
    "/customers/:customerId/bill/:transactionId",
    async (req, res) => {

        try {

            const transaction =
                await Transaction.findOne({

                    _id:
                        req.params.transactionId,

                    customer:
                        req.params.customerId

                });


            if (!transaction) {

                return res.status(404).send(
                    "Bill nahi mila"
                );

            }


            const customer =
                await Customer.findById(
                    req.params.customerId
                );


            res.render("bill", {

                transaction,

                customer

            });

        } catch (error) {

            console.error(error);

            res.status(500).send(
                "Bill load nahi ho paya"
            );

        }

    }
);


// ==========================================
// ONLINE ORDERS
// ==========================================

router.get(
    "/orders",
    adminAuth,
    async (req, res) => {

        try {

            const currentStatus =
                req.query.status || "";


            const filter = {};

            if (currentStatus) {
                filter.orderStatus =
                    currentStatus;
            }


            const orders =
                await Order.find(filter)
                    .populate(
                        "customer",
                        "name number email"
                    )
                    .populate(
                        "deliveryPerson",
                        "name number"
                    )
                    .sort({
                        createdAt: -1
                    });

            const deliveryPersons =
                await DeliveryPerson.find({
                    active: true
                }).sort({
                    name: 1
                });


            res.render(
                "admin/orders",
                {
                    orders,
                    currentStatus,
                    deliveryPersons
                }
            );


        } catch (error) {

            console.error(
                "ADMIN ORDERS ERROR:",
                error
            );

            res.status(500).send(
                "Orders load nahi ho paye."
            );

        }

    }
);

// ==========================================
// CHANGE ORDER STATUS
// ==========================================

router.post(
    "/orders/:id/status",
    adminAuth,
    async (req, res) => {

        try {

            const allowedStatuses = [

                "Pending",

                "Accepted",

                "Preparing",

                "Ready for Delivery",

                "Out for Delivery",

                "Delivered",

                "Cancelled"

            ];


            const newStatus =
                req.body.status;


            if (
                !allowedStatuses.includes(
                    newStatus
                )
            ) {

                return res.redirect(
                    "/admin/orders"
                );

            }


            await Order.findByIdAndUpdate(

                req.params.id,

                {
                    orderStatus:
                        newStatus
                }

            );


            res.redirect(
                "/admin/orders"
            );


        } catch (error) {

            console.error(
                "ORDER STATUS ERROR:",
                error
            );

            res.status(500).send(
                "Order status update nahi ho paya."
            );

        }

    }
);

// ==========================================
// ASSIGN DELIVERY PERSON
// ==========================================

router.post(
    "/orders/:id/assign-delivery",
    adminAuth,
    async (req, res) => {

        try {

            const {
                deliveryPersonId
            } = req.body;


            const deliveryPerson =
                await DeliveryPerson.findOne({
                    _id: deliveryPersonId,
                    active: true
                });


            if (!deliveryPerson) {

                return res.redirect(
                    "/admin/orders"
                );

            }


            await Order.findByIdAndUpdate(

                req.params.id,

                {
                    deliveryPerson:
                        deliveryPerson._id,

                    deliveryAssignedAt:
                        new Date()
                }

            );


            res.redirect(
                "/admin/orders"
            );


        } catch (error) {

            console.error(
                "ASSIGN DELIVERY ERROR:",
                error
            );

            res.status(500).send(
                "Delivery person assign nahi ho paya."
            );

        }

    }
);

// ==========================================
// DELIVERY BOYS
// ==========================================

router.get(
    "/delivery-boys",
    adminAuth,
    async (req, res) => {

        try {

            const deliveryPersons =
                await DeliveryPerson.find()
                    .sort({
                        createdAt: -1
                    });

            res.render(
                "admin/delivery-boys",
                {
                    deliveryPersons,
                    error: null,
                    success: null
                }
            );

        } catch (error) {

            console.error(
                "DELIVERY BOYS ERROR:",
                error
            );

            res.status(500).send(
                "Delivery boys load nahi ho paye."
            );

        }

    }
);


// ==========================================
// ADD DELIVERY BOY
// ==========================================

router.post(
    "/delivery-boys/add",
    adminAuth,
    async (req, res) => {

        try {

            const {
                name,
                number,
                username,
                password
            } = req.body;


            if (
                !name ||
                !number ||
                !username ||
                !password
            ) {

                const deliveryPersons =
                    await DeliveryPerson.find()
                        .sort({
                            createdAt: -1
                        });

                return res.render(
                    "admin/delivery-boys",
                    {
                        deliveryPersons,
                        error:
                            "Sabhi fields fill karein.",
                        success: null
                    }
                );

            }


            const existing =
                await DeliveryPerson.findOne({
                    username:
                        username.trim()
                });


            if (existing) {

                const deliveryPersons =
                    await DeliveryPerson.find()
                        .sort({
                            createdAt: -1
                        });

                return res.render(
                    "admin/delivery-boys",
                    {
                        deliveryPersons,
                        error:
                            "Ye username already exist karta hai.",
                        success: null
                    }
                );

            }


            const hashedPassword =
                await bcrypt.hash(
                    password,
                    10
                );


            await DeliveryPerson.create({

                name:
                    name.trim(),

                number:
                    number.trim(),

                username:
                    username.trim(),

                password:
                    hashedPassword,

                active:
                    true

            });


            res.redirect(
                "/admin/delivery-boys"
            );

        } catch (error) {

            console.error(
                "ADD DELIVERY BOY ERROR:",
                error
            );

            res.status(500).send(
                "Delivery boy add nahi ho paya."
            );

        }

    }
);

// ==========================================
// TOGGLE DELIVERY BOY
// ==========================================

router.post(
    "/delivery-boys/:id/toggle",
    adminAuth,
    async (req, res) => {

        try {

            const person =
                await DeliveryPerson.findById(
                    req.params.id
                );


            if (!person) {

                return res.redirect(
                    "/admin/delivery-boys"
                );

            }


            person.active =
                !person.active;


            await person.save();


            res.redirect(
                "/admin/delivery-boys"
            );

        } catch (error) {

            console.error(
                "TOGGLE DELIVERY BOY ERROR:",
                error
            );

            res.status(500).send(
                "Status update nahi ho paya."
            );

        }

    }
);


// ==========================================
// PENDING ORDER COUNT API
// ==========================================

router.get(
    "/pending-order-count",
    adminAuth,
    async (req, res) => {

        try {

            const pendingOrders =
                await Order.countDocuments({
                    orderStatus: "Pending"
                });


            res.json({
                success: true,
                pendingOrders
            });


        } catch (error) {

            console.error(
                "PENDING ORDER COUNT ERROR:",
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