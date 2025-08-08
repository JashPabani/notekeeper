const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const bcrypt = require('bcryptjs');
const User = require('./models/user');
const Note = require('./models/note');
const app = express();
require('dotenv').config();

// MongoDB connection
mongoose.connect(process.env.ATLASDB, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// Session store
app.use(session({
    secret: process.env.SESSION_SECRET || 'noteSecret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.ATLASDB,
        crypto: { secret: 'mysuper' },
        touchAfter: 24 * 3600
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
}));

// Middleware
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(flash());

app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.user = req.session.user;
    next();
});

// Auth middleware
function isLoggedIn(req, res, next) {
    if (!req.session.user) {
        req.flash('error', 'You must be logged in.');
        return res.redirect('/login');
    }
    next();
}

// Routes
app.get('/', (req, res) => res.render('index'));

app.get('/signup', (req, res) => res.render('signup'));
app.post('/signup', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        req.flash('error', 'All fields are required.');
        return res.redirect('/signup');
    }
    const hashed = await bcrypt.hash(password, 10);
    await User.create({ username, password: hashed });
    req.flash('success', 'Registered successfully!');
    res.redirect('/login');
});

app.get('/login', (req, res) => res.render('login'));
app.post('/login', async (req, res) => {
    const user = await User.findOne({ username: req.body.username });
    if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
        req.flash('error', 'Invalid credentials.');
        return res.redirect('/login');
    }
    req.session.user = user;
    req.flash('success', 'Logged in successfully!');
    res.redirect('/dashboard');
});

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) console.error(err);
        res.redirect('/');
    });
});

// Notes
app.get('/dashboard', isLoggedIn, async (req, res) => {
    const notes = await Note.find({ user: req.session.user._id });
    res.render('dashboard', { notes });
});

app.post('/notes', isLoggedIn, async (req, res) => {
    const { title, content } = req.body;
    if (!title || !content) {
        req.flash('error', 'Title and content are required.');
        return res.redirect('/dashboard');
    }
    await Note.create({ title, content, user: req.session.user._id });
    req.flash('success', 'Note created!');
    res.redirect('/dashboard');
});

app.get('/notes/edit/:id', isLoggedIn, async (req, res) => {
    const note = await Note.findOne({ _id: req.params.id, user: req.session.user._id });
    if (!note) return res.redirect('/dashboard');
    res.render('edit', { note });
});

app.post('/notes/edit/:id', isLoggedIn, async (req, res) => {
    await Note.findOneAndUpdate(
        { _id: req.params.id, user: req.session.user._id },
        { title: req.body.title, content: req.body.content }
    );
    req.flash('success', 'Note updated!');
    res.redirect('/dashboard');
});

app.post('/notes/delete/:id', isLoggedIn, async (req, res) => {
    await Note.deleteOne({ _id: req.params.id, user: req.session.user._id });
    req.flash('success', 'Note deleted!');
    res.redirect('/dashboard');
});

// Fallback route
app.use((req, res) => res.status(404).send("Page not found"));

app.listen(8080, () => console.log("🚀 Server running on port 8080"));
