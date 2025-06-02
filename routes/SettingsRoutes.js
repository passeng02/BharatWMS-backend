const express = require("express");
const db = require("../db");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();
const {redisClient}= require('../services/redisClient');

router.post('/pickingStrategy', async (req, res) => {
    try {
        const {strategy} = req.body;
        await redisClient.set("pstrategy", String(strategy), {EX: 86400});
    }
    catch(err)
    {
        console.error("Error updating stock:", err);
        res.status(500).json({ error: err.message || "Internal server error" });
    }
});

module.exports = router;