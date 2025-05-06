const express = require("express");
const router = express.Router();
const db = require("../db"); // Create a separate database file

// Get all products
router.get("/", (req, res) => {
    db.query("SELECT * FROM Product", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Create a new product
router.post("/", (req, res) => {
    console.log(req.body);
    const {Product_name, Product_Description, Product_Category} = req.body;
    db.query("INSERT INTO Product (Product_name, Product_Description, Product Category) VALUES (?, ?, ?)", 
        [Product_name, Product_Description, Product_Category], 
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Product added", id: result.insertId });
        }
    );
});

module.exports = router;