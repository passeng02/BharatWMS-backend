const express = require("express");
const db = require("../db");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Place an order (authenticated)
router.post("/placeOrder", authMiddleware, async (req, res) => {
    try {
        console.log("Incoming order request body:", JSON.stringify(req.body, null, 2));

        // Validate request body structure
        if (!req.body || typeof req.body !== 'object') {
            return res.status(400).json({ error: "Invalid or missing request body." });
        }

        const { orderItems } = req.body;


        // Process each order item sequentially
        for (const item of orderItems) {
            const { Product_ID, Product_Name, SKU_Name, Quantity, Customer_ID } = item;

            // Get SKU_ID from SKU_Name
            const [skuResults] = await db.query(
                "SELECT SKU_ID FROM SKU WHERE SKU_Name = ?",
                [SKU_Name]
            );

            if (!skuResults.length) {
                throw new Error(`SKU not found: ${SKU_Name}`);
            }

            const SKU_ID = parseInt(skuResults[0].SKU_ID);

            // Calculate dates
            const createdAt = new Date();
            const ship_by = new Date(createdAt);
            ship_by.setDate(ship_by.getDate() + 1);

            const formattedCreatedAt = createdAt.toISOString().slice(0, 19).replace("T", " ");
            const formattedShipBy = ship_by.toISOString().slice(0, 19).replace("T", " ");

            // Update SKU quantity
            await db.query(
                "UPDATE SKU SET Quantity_Available = Quantity_Available - ? WHERE SKU_ID = ?",
                [Quantity, SKU_ID]
            );

            // Create outbound shipment
            const [shipmentResult] = await db.query(
                "INSERT INTO outbound_shipment (SKU_ID, created_at, ship_by, S_Status, Customer_ID) VALUES (?, ?, ?, ?, ?)",
                [SKU_ID, formattedCreatedAt, formattedShipBy, "Received", Customer_ID]
            );

            const Shipment_ID = shipmentResult.insertId;

            // Create SKU shipment record
            await db.query(
                "INSERT INTO sku_shipment (Shipment_ID, SKU_ID, Quantity) VALUES (?, ?, ?)",
                [Shipment_ID, SKU_ID, Quantity]
            );
        }

        res.json({ 
            message: "Order placed successfully", 
            shipBy: new Date(new Date().setDate(new Date().getDate() + 1))
        });

    } catch (err) {
        console.error("Error placing order:", err);
        res.status(500).json({ 
            error: "Failed to place order", 
            details: err.message 
        });
    }
});

module.exports = router;
