//jshint esversion:6
const express = require( "express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");
require('dotenv').config()


const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
    secret: "ibraheemmawwal",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/timetableDB", {useNewUrlParser: true, useUnifiedTopology: true}); 
mongoose.set("useCreateIndex", true);

const userSchema =  new mongoose.Schema({
    username: String,
    password:String,
    faculty: String,
    email: String,
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema)
 
passport.use(User.createStrategy());
 
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });
  

passport.use(new GoogleStrategy({
    clientID: process.ENV.Client_ID,
    clientSecret: process.ENV.Client_Secret,
    callbackURL: "http://localhost:3000/auth/google/faculty",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ username: profile.emails[0].value, googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get("/", function(req, res){
    res.render("home")
});
app.get("/faculty", function(req, res){
    res.render("faculty") 
});
app.get("/auth/google", 
    passport.authenticate("google", { scope: ["profile", "email"]})
);
app.get('/auth/google/faculty', 
  passport.authenticate('google', { failureRedirect: '/login' }), function(req, res) {
    res.redirect(req.body.faculty);
});


app.get("/login", function(req, res){
    res.render("login")
});
app.get("/register", function(req, res){
    res.render("register")
});
app.get("/engineering", function(req, res){
    if (req.isAuthenticated()){
        res.render("engineering")
    } else {
        res.redirect("/login")
    }
});
app.get("/science", function(req, res){
    if (req.isAuthenticated()){
        res.render("science")
    } else {
        res.redirect("/login")
    }
});
app.get("/medicine", function(req, res){
    if (req.isAuthenticated()){
        res.render("medicine")
    } else {
        res.redirect("/login")
    }
});
app.get("/law", function(req, res){
    if (req.isAuthenticated()){
        res.render("law")
    } else {
        res.redirect("/login")
    }
});
app.post("/register", function(req, res){
    User.register({faculty: req.body.faculty, username: req.body.username,},  req.body.password, function(err, User){
        if(err){
            console.log(err);
            res.redirect("/register")
        } else {
            passport.authenticate("local")(req, res, function(){
                res.redirect(req.body.faculty)
            })
        }
    })
});

app.post("/faculty", function(req, res){
    User.register({faculty: req.body.faculty}, function(err, User){
        if(err){
            console.log(err);
            res.redirect("/register")
        } else {
            passport.authenticate("local")(req, res, function(){
                res.redirect(req.body.faculty)
            })
        }
    })
});

app.post("/login", function(req, res){
   
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    req.login(user, function(err){
        if(err){
            console.log(err);
        } else {
           passport.authenticate("local")(req, res, function(){
            User.findOne({username: user.username }).then(function(response){
                res.redirect(response.faculty)
              }).catch(function(error){
                  console.log("error", error)
              });

             
              
           
           })  
        }
    })
});








app.listen(3000, function() {
    console.log("server started on port 3000")
});