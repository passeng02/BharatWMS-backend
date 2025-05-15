const express = require("express");
const router = express.Router();
const db = require("../db");

// Get all products
router.get("/", async (req, res) => {
    try {
        const [results] = await db.query("SELECT * FROM Product");
        res.json(results);
    } catch (err) {
        console.error("Error fetching products:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Get all products with SKUs
router.get("/productNdSKU", async (req, res) => {
    try {
        const [results] = await db.query(`
            SELECT p.*, s.SKU_ID, s.SKU_Name, s.Quantity_Available
            FROM Product p
            LEFT JOIN SKU s ON p.Product_ID = s.Product_ID
        `);
        
        // Group SKUs by product
        const products = results.reduce((acc, row) => {
            const productId = row.Product_ID;
            if (!acc[productId]) {
                acc[productId] = {
                    Product_ID: row.Product_ID,
                    Product_name: row.Product_name,
                    Product_Description: row.Product_Description,
                    Product_Category: row.Product_Category,
                    SKUs: []
                };
            }
            
            // Only add SKU if it exists
            if (row.SKU_ID) {
                acc[productId].SKUs.push({
                    SKU_ID: row.SKU_ID,
                    SKU_Name: row.SKU_Name,
                    SKU_Description: row.SKU_Description,
                    Quantity: row.Quantity_Available,
                });
            }
            
            return acc;
        }, {});
        
        res.json(Object.values(products));
    } catch (err) {
        console.error("Error fetching products with SKUs:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Create a new product
router.post("/", async (req, res) => {
    try {
        const { Product_name, Product_Description, Product_Category } = req.body;
        const [result] = await db.query(
            "INSERT INTO Product (Product_name, Product_Description, Product_Category) VALUES (?, ?, ?)",
            [Product_name, Product_Description, Product_Category]
        );
        res.json({ message: "Product added", id: result.insertId });
    } catch (err) {
        console.error("Error creating product:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;