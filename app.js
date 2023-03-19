//jshint esversion:6
require("dotenv").config();
const express = require("express");
//hash encryption method
//const md5 = require("md5");
const bodyParser = require("body-parser");
const ejs = require("ejs");
// const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const findOrCreate = require('mongoose-find-or-create')
const passportlocalMongoose = require("passport-local-mongoose");
var GoogleStrategy = require('passport-google-oauth20').Strategy;
// const saltRounds=10;
//const encrypt = require("mongoose-encryption")
const app = express();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine","ejs");
app.use(session({
    secret: 'A little secret',
    resave: false,
    saveUninitialized: false
  }));
app.use(passport.initialize());
mongoose.connect("mongodb://127.0.0.1:27017/userDB",{useNewUrlParser:true});
const userSchema =new mongoose.Schema({
    email : String,
    password : String
});
userSchema.plugin(passportlocalMongoose);
userSchema.plugin(findOrCreate);
//password encryption using mongoose-encryption
//userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields: ['password']});
const user = mongoose.model("user",userSchema);

passport.use(user.createStrategy());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user.id, username: user.username });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  })

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secret",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get("/",(req,res)=>{
    res.render("home");    
});
app.get('/auth/google',
  passport.authenticate('google', { scope: ["profile"] }));
app.get("/register",(req,res)=>{
    res.render("register");    
});
app.get("/auth/google/secret", 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  });
app.get("/login",(req,res)=>{
    res.render("login");    
});
app.get("/secrets",(req,res)=>{
    if(req.isAuthenticated()){
        res.render("secrets");
    }else{
        res.redirect("/login");
    }
});
app.get("/logout",(req,res)=>{
    req.logout(function(err) {
        if (err) { 
            return next(err); 
        }
        res.redirect('/');
    });
})
app.post("/register", (req,res)=>{
    user.register({username:req.body.username},req.body.password,function(err,user){
        if(err){
            console.log(err)
            res.redirect("/register");
        }else{
            passport.authenticate('local', {successRedirect: '/secrets',failureRedirect: '/register'});
        }
    });

    // bcrypt.hash(req.body.password, saltRounds, function(err, hash) 
    //     const newUser= new user({
    //         email: req.body.username,
    //         password: hash
    //     });
    //     newUser.save().then(()=>{
    //         res.render("secrets");
    //     }).catch((err)=>{
    //         console.log(err)
    //     });
    // });
    
});
app.post("/login",(req,res)=>{
    const users = new user({
        username : req.body.username,
        password : req.body.password
    });
    req.login(users,function(err){
        if(err){
            console.log(err);
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets")
            });
        }
    })

    // const username= req.body.username;
    // const password = req.body.password;
    // user.findOne({email:username}).then((foundUser)=>{
    //     if(foundUser){
    //         bcrypt.compare(password, foundUser.password, function(err, result) {
    //             if(result){
    //                 res.render("secrets");
    //             }
    //         });
                
    //         // else{
    //         //     res.send("Invalid Password");
    //         // }
    //     }
    // }).catch((err)=>{
    //     console.log(err);
    // });
});
app.listen(3000,function(){
    console.log("Server started");
});