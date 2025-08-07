const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('connect-flash');
const bcrypt = require('bcryptjs');
const User = require('./models/user.js');
const Note = require('./models/note.js');
const app = express();

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));


app.use(session({
    secret: 'noteSecret',
    resave: false,
    saveUninitialized: false
}));
app.use(flash());

// Flash message middleware
app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.user = req.session.user;
    next();
});

main()
.then(() => console.log("Sucess DB"))
.catch((err) => console.log(err));

async function main(){
    await mongoose.connect("mongodb://127.0.0.1:27017/notekeeper");
}



// --------------------------Routes--------------------------------

// Home
app.get('/', (req, res) => {
    res.render('index');
});


// Register
app.get('/signup', (req, res) => {
    res.render('signup');
});
app.post('/signup', async (req, res) => {
    const { username, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    await User.create({ username, password: hashed });
    req.flash('success', 'Registered successfully!');
    res.redirect('/login');
});

// Login
app.get('/login', (req, res) => {
    res.render('login');
});
app.post('/login', async (req, res) => {
    const user = await User.findOne({ username: req.body.username });
    if (!user) {
        req.flash('error', 'Invalid username');
        return res.redirect('/login');
    }
    const match = await bcrypt.compare(req.body.password, user.password);
    if (!match) {
         req.flash('error', 'Wrong password');
        return res.redirect('/login');
    }
    req.flash('success', 'Login successfully!');
    req.session.user = user;
    res.redirect('/dashboard');
});

app.get("/logout",(req,res)=>{
    req.session.destroy();
    res.redirect("/");
})

function isLoginedin(req,res,next){
    // console.log(req.body)
    if(!req.session.user){
        req.flash('Error','You are not Login');
        res.redirect("/login");
    }
    // console.log(req.body)
    next();
}

// ---------------Wrork with notes ------------------------------
app.get("/dashboard",isLoginedin,async(req,res)=>{
    const notes = await Note.find({ user: req.session.user._id });
    res.render('dashboard', { notes });
})

// app.post('/notes',isLoginedin,async (req,res)=>{
//     await Note.create({
//         title : req.body.title,
//         content : req.body.content,
//         user : req.session.user._id
//     })
//     console.log("jell");
//     req.flash('success', 'Note created!');
//     res.redirect('/dashboard');
// })


app.post('/notes', isLoginedin, async (req, res) => {
    const { title, content } = req.body;
    console.log("Received data:", { title, content }); // Check what data is being received
    
    // Add validation to ensure title and content are not empty
    if (!title || !content) {
        req.flash('error', 'Title and content are required.');
        return res.redirect('/dashboard');
    }
    
    try {
        const note = await Note.create({
            title,
            content,
            user: req.session.user._id
        });
        console.log("Note created:", note);
        req.flash('success', 'Note created!');
        res.redirect('/dashboard');
    } catch (err) {
        console.error("Error creating note:", err);
        req.flash('error', 'An error occurred while creating the note.');
        res.redirect('/dashboard');
    }
});

app.use((req,res)=>{
    res.send("Hello");
})

app.listen(8080,()=> console.log("Success"))