const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { body, validationResult } = require("express-validator");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET; // Change this to a secure key

// Customer Registration
router.post("/register", [
    body("User_Name").notEmpty(),
    body("User_Email").isEmail(), 
    body("User_Password").isLength({ min: 6 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    let {User_Name, User_email, User_Password, User_phone, User_address, isPicker } = req.body;
    isPicker = (isPicker == "on" ? 0 : 1)
    try {
        const hashedPassword = await bcrypt.hash(User_Password, 10);
        
        const [result] = await db.query(
            "INSERT INTO _user (User_Name, User_Email, User_Password, User_phone, User_address, isPicker) VALUES (?, ?, ?, ?, ?, ?)",
            [User_Name, User_email, User_Password, User_phone, User_address, isPicker]
        );

        res.json({ message: "Customer registered successfully", id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Customer Login
router.post("/login", async (req, res) => {
    try {
        const { Customer_email, Customer_Password } = req.body;
        
        const [results] = await db.query(
            "SELECT * FROM _user WHERE User_email = ?", 
            [Customer_email]
        );

        if (results.length === 0) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(Customer_Password, results[0].User_Password);
        
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const token = jwt.sign(
            { id: results[0].User_ID }, 
            JWT_SECRET, 
            { expiresIn: "1h" }
        );

        res.json({ 
            message: "Login successful", 
            token, 
            Customer_ID: results[0].User_ID 
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
