const express = require('express');
const exphbs = require('express-handlebars');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

const keys = require('./config/keys');

const User = require('./models/user');

const Contact = require('./models/contact');

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

app.get('/',(req,res) => {
    res.render('home');

});
app.get('/about',(req,res) => {
    res.render('about',{
        title: 'About'
    });
});
app.get('/contact',(req,res) => {
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
app.get('/signup',(req,res) => {
    res.render('signupForm',{
        title:'Register'
    });
});

app.listen(port,() => {
    console.log('server is up on port' + port);

});