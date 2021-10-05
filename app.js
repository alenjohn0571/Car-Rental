const express = require('express');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const session =require('express-session');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const bcrypt= require('bcryptjs');
const app= express();
const mongoose = require('mongoose');

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());
//config for authentication
app.use(cookieParser());
app.use(session({
    secret: 'mysecret',
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

const{requireLogin,ensureGuest} = require('./helpers/authHelper');

require('./passport/local');

app.use((req,res,next) => {
    res.locals.user = req.user || null;
    next();
});

const keys = require('./config/keys');

const User = require('./models/user');

const Contact = require('./models/contact');
const { response } = require('express');

mongoose.connect(keys.MongoDB,() => {
    console.log('MongoDB is connected');
}).catch((err) => {
    console.log(err);
});

app.engine('handlebars',exphbs({
    defaultLayout: 'main'
}));
app.set('view engine','handlebars');

app.use(express.static('public'));

const port = process.env.PORT || 3000;

app.get('/',ensureGuest,(req,res) => {
    res.render('home');

});
app.get('/about',ensureGuest,(req,res) => {
    res.render('about',{
        title: 'About'
    });
});
app.get('/contact',requireLogin,(req,res) => {
    res.render('contact',{
        title:'Contact Us'
    });
});
app.post('/contact', (req,res) => {
    console.log(req.body);
    const newContact = {
        name: req.user._id,
        message: req.body.message,
    }
    new Contact(newContact).save((err,user) => {
        if(err) {
            throw err;
        }else{
            console.log('Received a message from user',user);
        }
    });
});
app.get('/signup',ensureGuest,(req,res) => {
    res.render('signupForm',{
        title:'Register'
    });
});
app.post('/signup', ensureGuest,(req,res) => {
    console.log(req.body);
    let errors =[];
    if (req.body.password !== req.body.password2){
        errors.push({text: 'Password does not match'});
    }
    if (req.body.password.length < 5){
        errors.push({text:'Password must be atleast 5 characters!'});
    }
    if (errors.length > 0) {
        res.render('signupForm',{
            errors:errors,
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            password:req.body.passsword,
            password2:req.body.password2,
            email: req.body.email
        })
    }else{
        User.findOne({email:req.body.email})
        .then((user) => {
            if (user) {
                let errors = [];
                errors.push({text: 'Email already exists'});
                res.render('signupForm',{
                    errors:errors,
                    firstname: req.body.firstname,
                    lastname: req.body.lastname,
                    password:req.body.passsword,
                    password2:req.body.password2,
                    email: req.body.email
                });
            }else{
                //encrypt pass
                let salt = bcrypt.genSaltSync(10);
                let hash = bcrypt.hashSync(req.body.password,salt);                
                const newUser = {
                    firstname: req.body.firstname,
                    lastname: req.body.lastname,
                    email: req.body.email,
                    password: hash
                }
                new User(newUser).save((err,user) => {
                    if (err) {
                      throw err;
                    }
                    if (user)  {
                        let success = [];
                        success.push({text: 'You have successfully created an account'});
                        res.render('loginForm',{
                            success:success
                        })
                    }
                })
            }
        })
    }
});
app.get('/displayLoginForm' ,ensureGuest,(req,res) => {
    res.render('loginForm', {
        title: 'Login'
    });
});
app.post('/login',passport.authenticate('local',{
    successRedirect: '/profile', 
    failureRedirect: '/loginErrors'
}));
//display profile
app.get('/profile',requireLogin,(req,res) =>{
    User.findById({_id:req.user._id})
    .then((user) => {
        res.render('profile' ,{
            user:user,
            title:'Profile'
        });
    });
});
app.get('/loginErrors',(req,res) => {
    let errors =[];
    errors.push({text: 'User not found or Password Incorrect'});
    res.render('loginForm', {
        errors:errors,
        title: 'Error'
    });
});
app.get('/logout', (req,res) => {
    User.findById({_id:req.user._id})
    .then((user) => {
         user.online = false;
         user.save((err,user) => {
             if (err) {
                 throw err; 
             }
             if (user) {
                 req.logout();
                 res.redirect('/');
             }
         });
    });
});
app.listen(port,() => {
    console.log(`Server is running on port ${port}`);
});
