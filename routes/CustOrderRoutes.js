const express = require("express");
const db = require("../db");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Place an order (authenticated)
router.post("/placeOrder", authMiddleware, async (req, res) => {
    try {
        // Expect the request body to be an array directly
        if (!Array.isArray(req.body.orderItems)) {
            throw new Error('Request body must be an array of order items');
        }
        
        // Process each order item sequentially
        for (const item of req.body.orderItems) {
            const { Product_ID, Product_Name, SKU_ID, SKU_Name, Quantity, Customer_ID } = item;

            // Validate required fields
            if (!SKU_ID || !Quantity || !Customer_ID) {
                throw new Error('Missing required fields: SKU_ID, Quantity, and Customer_ID are required');
            }

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

//To get the list of orders from the customer
router.get("/viewOrders", async (req, res) => {
    
    try {
    const customerId = req.query.Customer_Id;
    console.log(customerId)
    // Get all outbound shipments for this customer, including SKU and product info
    const [orders] = await db.query(
        `SELECT 
            os.Shipment_ID,
            os.SKU_ID,
            os.created_at,
            os.ship_by,
            os.S_Status,
            ss.Quantity as Ordered_Quantity,
            s.SKU_Name,
            p.Product_name,
            p.Product_Description,
            p.Product_Category
        FROM outbound_shipment os
        LEFT JOIN sku_shipment ss ON os.Shipment_ID = ss.Shipment_ID
        LEFT JOIN SKU s ON os.SKU_ID = s.SKU_ID
        LEFT JOIN Product p ON s.Product_ID = p.Product_ID
        WHERE os.Customer_ID = ?
        ORDER BY os.created_at ASC`,
        [customerId]
    );
    console.log(orders)
    res.json( orders );
    }
    catch(err){
        console.error("Error placing order:", err);
        res.status(500).json({ 
            error: "Cannot Fetch Orders ", 
            details: err.message 
        });
    }
});

module.exports = router;
