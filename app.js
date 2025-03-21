const express = require('express');
const app = express();
const path = require("path")
const dotenv = require("dotenv").config();
const session = require("express-session");

const db = require("./config/db");
db()
const userRouter = require('./routes/userRouter')

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(session({
    secret:process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized:true,
    cookie:{
        secure:false,
        httpOnly:true,
        maxAge:72*60*60*1000
    }
}))
app.use((req,res,next)=>{
    res.set('cache-control','no-store')
    next()
});



app.set("view engine", 'ejs');
app.set("views",path.join(__dirname,'views'));
app.use(express.static(path.join(__dirname,"public")));

app.use("/",userRouter);

const PORT = process.env.PORT || 5000 ;
app.listen(process.env.PORT,()=>{
    console.log("Server Running")
    console.log("http://localhost:5000")
})
module.exports = app;