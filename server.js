require("dotenv").config();
const express = require("express");
const productRoutes = require("./routes/productRoutes");
const CustAuthRoutes = require("./routes/CustAuth");
const CustOrderRoutes = require("./routes/CustOrderRoutes")
const app = express();

app.use(express.json());
app.use("/api/products", productRoutes);
app.use("/api/CustomerAuth", CustAuthRoutes);
app.use("/api/CustomerOrder", CustOrderRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});