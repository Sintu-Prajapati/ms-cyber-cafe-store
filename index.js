const express = require("express");
const path = require("path");
require("dotenv").config();

const connectDB = require("./config/db");
const session = require("express-session");

const app = express();

connectDB();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

app.use(
    session({
        secret: "ms-cyber-cafe-secret",
        resave: false,
        saveUninitialized: false,
        rolling: true,
        cookie: {
            httpOnly: true,
            sameSite: "lax",
            secure: false,
            maxAge: 7 * 24 * 60 * 60 * 1000
        }
    })
);

const productRoutes = require("./routes/productRoutes");
const billingRoutes = require("./routes/billingRoutes")
const Product = require("./models/Product");;
const Customer = require("./models/Customer");
const Transaction = require("./models/Transaction");
const Order = require("./models/Order");
const customerRoutes =
    require("./routes/customerRoutes");
const customerAuthRoutes =
    require("./routes/customerAuthRoutes");

const adminRoutes =
    require("./routes/adminRoutes");
const adminAuth = require("./middleware/adminAuth");

const deliveryRoutes =
    require("./routes/deliveryRoutes");




app.use("/products", productRoutes);
app.use("/billing", billingRoutes);
app.use(
    "/customers",
    customerRoutes
);
app.use("/customer", customerAuthRoutes);
app.use("/customer", customerRoutes);


app.use(
    "/admin",
    adminRoutes
);

app.use(
    "/delivery",
    deliveryRoutes
);


app.get("/dashboard", async (req, res) => {
    if (!req.session.adminId) {
        return res.redirect("/admin/login");
    }

    try {
        const totalProducts = await Product.countDocuments();
        const totalCustomers = await Customer.countDocuments();
        const totalOrders = await Order.countDocuments();
        const pendingOrders =
            await Order.countDocuments({
                orderStatus: "Pending"
            });
        const products = await Product.find({}, { stock: 1 });
        const totalStock = products.reduce(
            (total, product) => total + Number(product.stock || 0),
            0
        );

        const salesResult = await Order.aggregate([
            { $match: { orderStatus: "Delivered" } },
            { $group: { _id: null, total: { $sum: "$grandTotal" } } }
        ]);

        const totalSales = salesResult.length > 0 ? salesResult[0].total : 0;
        const latestOrders = await Order.find()
            .populate("customer", "name number")
            .sort({ createdAt: -1 })
            .limit(5);
        const lowStockProducts = await Product.find({ stock: { $lte: 5 } })
            .sort({ stock: 1 })
            .limit(5);

        return res.render("dashboard", {
            totalProducts,
            totalCustomers,
            totalOrders,
            totalStock,
            totalSales,
            latestOrders,
            lowStockProducts,
            pendingOrders,
            session: req.session
        });
    } catch (error) {
        console.error(error);
        return res.status(500).send("Something went wrong");
    }
});


app.get("/signup", (req, res) => {
    res.redirect("/customer/signup");
});

app.get("/login", (req, res) => {
    res.redirect("/customer/login");
});

app.get("/", (req, res) => {
    if (req.session.adminId) {
        return res.redirect("/dashboard");
    }

    if (req.session.customerId) {
        return res.redirect("/customer/home");
    }

    return res.redirect("/shop");
});

app.get("/shop", async (req, res) => {
    try {

        const products = await Product.find()
            .sort({ createdAt: -1 });

        res.render("customer-home", {
            products
        });

    } catch (error) {

        console.error(error);

        res.status(500).send(
            "Customer page load nahi ho paya"
        );

    }

});

const PORT = process.env.PORT || 5000;

const start = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`Server running: http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error("Failed to start server:", err);
        process.exit(1);
    }
};

start();