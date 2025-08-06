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


main()
.then(() => console.log("SUcess"))
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
    // req.flash('success', 'Registered successfully!');
    res.redirect('/login');
});

// Login
app.get('/login', (req, res) => {
    res.render('login');
});
app.post('/login', async (req, res) => {
    const user = await User.findOne({ username: req.body.username });
    if (!user) {
        // req.flash('error', 'Invalid username');
        return res.redirect('/login');
    }
    const match = await bcrypt.compare(req.body.password, user.password);
    if (!match) {
        // req.flash('error', 'Wrong password');
        return res.redirect('/login');
    }
    // req.session.user = user;
    res.redirect('/dashboard');
});


app.use((req,res)=>{
    res.send("Hello");
})

app.listen(8080,()=> console.log("Success"))