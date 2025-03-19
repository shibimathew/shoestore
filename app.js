const express = require('express');
const app = express();
const path = require("path")
const env = require("dotenv").config();
const db = require("./config/db");
db()
const userRouter = require('./routes/userRouter')
app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.set("view engine", 'ejs');
app.set("views",path.join(__dirname,'views'));
app.use(express.static(path.join(__dirname,"public")));

app.use("/",userRouter);

const PORT = process.env.PORT || 7000 ;
app.listen(process.env.PORT,()=>{
    console.log("Server Running")
    console.log("http://localhost:7000")
})
module.exports = app;