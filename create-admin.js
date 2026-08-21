const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require("dotenv").config();

const Admin = require("./models/Admin");

const MONGODB_URI = process.env.MONGODB_URI;

async function createAdmin() {

    try {

        if (!MONGODB_URI) {
            throw new Error("MONGODB_URI is not set in the environment or .env file.");
        }

        await mongoose.connect(MONGODB_URI);

        console.log("MongoDB Connected");

        const username = "VIJAYRITA001";

        const plainPassword = "MS@@Prajapati";

        const existingAdmin =
            await Admin.findOne({ username });

        if (existingAdmin) {

            console.log("Admin already exists.");

            process.exit();

        }

        const hashedPassword =
            await bcrypt.hash(
                plainPassword,
                10
            );

        await Admin.create({

            username: username,

            password: hashedPassword

        });

        console.log("Admin created successfully.");

        console.log("Username:", username);

        console.log("Password:", plainPassword);

        process.exit();

    } catch (error) {

        console.error(
            "Admin creation error:",
            error
        );

        process.exit(1);

    }

}

createAdmin();