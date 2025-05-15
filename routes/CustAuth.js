const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { body, validationResult } = require("express-validator");

const router = express.Router();
const JWT_SECRET = "1234"; // Change this to a secure key

// Customer Registration
router.post("/register", [
    body("Customer_Name").notEmpty(),
    body("Customer_email").isEmail(), 
    body("Customer_Password").isLength({ min: 6 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { Customer_Name, Customer_email, Customer_Password, Customer_phone, Customer_address } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(Customer_Password, 10);
        
        const [result] = await db.query(
            "INSERT INTO Customer (Customer_Name, Customer_email, Customer_Password, Customer_phone, Customer_address) VALUES (?, ?, ?, ?, ?)",
            [Customer_Name, Customer_email, hashedPassword, Customer_phone, Customer_address]
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
            "SELECT * FROM Customer WHERE Customer_email = ?", 
            [Customer_email]
        );

        if (results.length === 0) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(Customer_Password, results[0].Customer_Password);
        
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const token = jwt.sign(
            { id: results[0].Customer_ID }, 
            JWT_SECRET, 
            { expiresIn: "1h" }
        );

        res.json({ 
            message: "Login successful", 
            token, 
            Customer_ID: results[0].Customer_ID 
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
