const jwt = require("jsonwebtoken");
const JWT_SECRET = "1234";

module.exports = (req, res, next) => {
    const token = req.header("Authorization");
    if (!token) return res.status(401).json({ error: "Access denied" });

    try {
        const verified = jwt.verify(token.replace("Bearer ", ""), JWT_SECRET);
        req.customer = verified;
        next();
    } catch (err) {
        res.status(400).json({ error: "Invalid token" });
    }
};