const express = require("express");
const router = express.Router();

const bcrypt = require("bcrypt");

const CustomerAuth = require("../models/CustomerAuth");
const Product = require("../models/product");





router.get("/", async (req, res) => {

    if (!req.session.customerId) {
        return res.redirect("/shop");
    }

    return res.redirect("/customer/home");

});

// =========================
// HOME PAGE
// =========================


router.get("/home", async (req, res) => {

    try {

        const products = await Product.find().sort({ createdAt: -1 });
        const customer = await CustomerAuth.findById(req.session.customerId);

        res.render("customer/home", {
            products,
            customer,
            customerName: req.session.customerName || customer?.name || "Customer",
            customerLoggedIn: true
        });

    } catch (error) {

        console.error("Customer home error:", error);

        res.status(500).send("Customer home page load nahi ho paya");

    }

});


// =========================
// SIGNUP PAGE
// =========================

router.get("/signup", (req, res) => {
     
    res.render("customer/signup");

});


// =========================
// SIGNUP
// =========================

router.post("/signup", async (req, res) => {

    try {

        const {
            name,
            email,
            mobile,
            password
        } = req.body;


        // Check empty fields

        if (
            !name ||
            !email ||
            !mobile ||
            !password
        ) {

            return res.send(
                "Please fill all fields."
            );

        }


        const cleanEmail =
            email.trim().toLowerCase();

        const cleanMobile =
            mobile.trim();


        // Check existing account

        const existingCustomer =
            await CustomerAuth.findOne({
                $or: [
                    {
                        email: cleanEmail
                    },
                    {
                        mobile: cleanMobile
                    }
                ]
            });


        if (existingCustomer) {

            return res.send(
                "Email or mobile number is already registered."
            );

        }


        // Create customer

        const hashedPassword =
    await bcrypt.hash(password, 12);


const customer =
    new CustomerAuth({

        name: name.trim(),

        email: cleanEmail,

        mobile: cleanMobile,

        password: hashedPassword

    });


        await customer.save();


        // Signup successful

        res.redirect("/customer/login");


    } catch (error) {

        console.error(
            "Signup Error:",
            error
        );

        res.status(500).send(
            "Signup failed."
        );

    }

});


// =========================
// LOGIN PAGE
// =========================

router.get("/login", (req, res) => {

    res.render("customer/login");

});


// =========================
// LOGIN
// =========================

router.post("/login", async (req, res) => {

    try {

        const {
            login,
            password
        } = req.body;


        if (!login || !password) {

            return res.send(
                "Please enter login details."
            );

        }


        const loginValue =
            login.trim();


        const customer =
            await CustomerAuth.findOne({

                $or: [

                    {
                        email:
                            loginValue.toLowerCase()
                    },

                    {
                        mobile:
                            loginValue
                    }

                ]

            });


        if (!customer) {

            return res.send(
                "Email or mobile number not found."
            );

        }


        const passwordMatch =
    await bcrypt.compare(
        password,
        customer.password
    );


if (!passwordMatch) {

    return res.send(
        "Incorrect password."
    );

}


        // Save customer login session

        req.session.customerId =
            customer._id.toString();


        req.session.customerName =
            customer.name;


        res.redirect("/customer/home");


    } catch (error) {

        console.error(
            "Login Error:",
            error
        );

        res.status(500).send(
            "Login failed."
        );

    }

});


// =========================
// PROFILE
// =========================

router.get("/profile", async (req, res) => {

    try {

        // Login check

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

            req.session.customerId = null;
            req.session.customerName = "";

            return res.redirect(
                "/customer/login"
            );

        }


        res.render(
            "customer/profile",
            {
                customer
            }
        );


    } catch (error) {

        console.error(
            "Profile Error:",
            error
        );

        res.status(500).send(
            "Unable to load profile."
        );

    }

});


// =========================
// LOGOUT
// =========================

router.get("/logout", (req, res) => {

    req.session.destroy((error) => {

        if (error) {

            console.error(
                "Logout Error:",
                error
            );

            return res.redirect(
                "/"
            );

        }


        res.redirect(
            "/shop"
        );

    });

});


module.exports = router;
