const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { body, validationResult } = require("express-validator");

const router = express.Router();
const JWT_SECRET = "your_secret_key"; // Change this to a secure key

// Customer Registration
router.post("/register", [
    body("Customer_Name").notEmpty(),
    body("Customer_email").isEmail(),
    body("Password").isLength({ min: 6 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { Customer_Name, Customer_email, Password, Customer_phone, Customer_address } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(Password, 10);
        db.query("INSERT INTO Customer (Customer_Name, Customer_email, Password, Customer_phone, Customer_address) VALUES (?, ?, ?, ?, ?)",
            [Customer_Name, Customer_email, hashedPassword, Customer_phone, Customer_address],
            (err, result) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: "Customer registered successfully", id: result.insertId });
            }
        );
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Customer Login
router.post("/login", async (req, res) => {
    const { Customer_email, Password } = req.body;

    db.query("SELECT * FROM Customer WHERE Customer_email = ?", [Customer_email], async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(401).json({ error: "Invalid email or password" });

        const isMatch = await bcrypt.compare(Password, results[0].Password);
        if (!isMatch) return res.status(401).json({ error: "Invalid email or password" });

        const token = jwt.sign({ id: results[0].Customer_ID }, JWT_SECRET, { expiresIn: "1h" });
        res.json({ message: "Login successful", token });
    });
});

module.exports = router;
