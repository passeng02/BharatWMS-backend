const express = require("express");
const db = require("../db");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Place an order (authenticated)
router.post("/placeOrder", authMiddleware, (req, res) => {
    const {Product_Name, SKU_Name, Quantity} = req.body; // Default to 'Received'
    const customerId = req.customer.id;

    let createdAt = new Date();
    
    // Add 1 extra day
    let ship_by = new Date();
    ship_by.setDate(ship_by.getDate() + 1);

    const formattedCreatedAt = createdAt.toISOString().slice(0, 19).replace("T", " ");
    const formattedShipBy = ship_by.toISOString().slice(0, 19).replace("T", " ");
    SKU_ID= '';
    db.query("SELECT SKU_ID from SKU where SKU_Name = ? ;", SKU_Name, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        SKU_ID = results[0].SKU_ID;
        console.log(results)

        console.log(SKU_ID);
        SKU_ID = parseInt(SKU_ID);

    let Result = '';
    Shipment_ID = 0;
    db.query("INSERT INTO `outbound_shipment` (SKU_ID, created_at, ship_by, S_Status, Customer_ID ) VALUES (?, ?, ?, ?, ?) ;",
        [SKU_ID, formattedCreatedAt, formattedShipBy, "Received", customerId ],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            
            Result = result;
            Shipment_ID = result.insertId;
            console.log(Result);
            console.log(SKU_ID);
            db.query("INSERT INTO `SKU_Shipment` (Shipment_ID, SKU_ID, Quantity) VALUES (?, ?, ?);",
                [Shipment_ID, SKU_ID, Quantity],
                (err, result) => {
                    if (err) return res.status(500).json({ error: err.message });
                    res.json({ message: "Order placed successfully", id: Shipment_ID , shipBy: ship_by});
                }
            );
        
        });
        
        }

        
    );
    
    });
    

   
module.exports = router;
