require("dotenv").config();


const express = require("express");
const productRoutes = require("./routes/productRoutes");
const CustAuthRoutes = require("./routes/CustAuth");
const CustOrderRoutes = require("./routes/CustOrderRoutes");
const SettingsRoutes = require("./routes/SettingsRoutes.js");
const cors = require('cors');
const { redisClient, initRedis } = require('./services/redisClient');
const app = express();
// Use CORS middleware
app.use(cors());
app.use(express.json());
app.use("/api/products", productRoutes);
app.use("/api/CustomerAuth", CustAuthRoutes);
app.use("/api/CustomerOrder", CustOrderRoutes);
app.use("/api/settings", SettingsRoutes);

const PORT = process.env.PORT || 5000;

initRedis()
  .then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT} and connected to redis`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to Redis:', err);
    process.exit(1);
  });
                    


