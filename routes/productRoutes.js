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

// Create a new product and corresponding SKUs
router.post("/", async (req, res) => {
    try {     
        const { Product_Name, Product_Description, Product_Category, SKUs } = req.body;
        // Check if product with the same Product_name already exists
        const [existingProducts] = await db.query(
            "SELECT * FROM Product WHERE Product_name = ?",
            [Product_Name]
        );
        if (existingProducts.length > 0) {
            // Product exists, check if SKUs exist with given SKU_Name
            if (SKUs.length === 0) {
                return res.status(400).json({ error: "Product already exists and no SKUs provided" });
            }
            // Check for each SKU_Name if it exists for this product
            const productId = existingProducts[0].Product_ID;
            for (const sku of SKUs) {
                const [existingSKUs] = await db.query(
                    "SELECT * FROM SKU WHERE SKU_Name = ? AND Product_ID = ?",
                    [sku.SKU_Name, productId]
                );
                if (existingSKUs.length > 0) {
                    throw new Error(`SKU with name '${sku.SKU_Name}' already exists for this product`);
                }
                else {
                await db.query(
                    "INSERT INTO SKU (SKU_Name, Quantity_Available, Minimum_Stock_Level, Maximum_Stock_Level, Reorder_Point, Product_ID) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    [
                        sku.SKU_Name,
                        sku.Quantity_Available,
                        sku.Minimum_Stock_Level,
                        sku.Maximum_Stock_Level,
                        sku.Reorder_Point,
                        productId,
                    ]
                );
                await db.query(
                    "UPDATE Location SET OCCUPIED = 1 WHERE Location_ID = ?",
                    [LocationID]
                );
            }
            }
        }
        else {

            const [result] = await db.query(
                "INSERT INTO Product (Product_name, Product_Description, Product_Category) VALUES (?, ?, ?)",
                [Product_Name, Product_Description, Product_Category]
            );
            for (const sku of SKUs) {
                await db.query(
                    "INSERT INTO SKU (SKU_Name, Quantity_Available, Minimum_Stock_Level, Maximum_Stock_Level, Reorder_Point, Product_ID) VALUES (?, ?, ?, ?, ?, ?)",
                    [
                     sku.SKU_Name,
                     sku.Quantity_Available,
                     sku.Minimum_Stock_Level,
                     sku.Maximum_Stock_Level,
                     sku.Reorder_Point,
                     result.insertId                   
                    ]
                );
            }
            res.json({ message: "Product added", id: result.insertId });
        }
    } catch (err) {
        console.error("Error creating product:", err);
        res.status(500).json({ error: err.message || "Internal server error" });
    }
});

router.post("/checkIn", async (req, res) => {
    try {
        const { SKU_ID, Quantity } = req.body;

        // Validate input
        if (!SKU_ID || !Quantity || Quantity <= 0) {
            return res.status(400).json({ error: "Invalid input. SKU_ID and positive Quantity are required." });
        }
        // Update the SKU's available quantity
        const [result] = await db.query(
            "UPDATE SKU SET Quantity_Available = Quantity_Available + ? WHERE SKU_ID = ?",
            [Quantity, SKU_ID]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "SKU not found" });
        }
        res.json({ message: "Stock updated successfully" });
    } catch (err) {
        console.error("Error updating stock:", err);
        res.status(500).json({ error: err.message || "Internal server error" });
    }
});


module.exports = router;