const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const connectDB = require('./config/database');

const authRoutes = require('./routes/auth');
const movieRoutes = require('./routes/movies');
const favoriteRoutes = require('./routes/favorites');
const linkRoutes = require('./routes/links');

connectDB();

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'Client')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: 'mongodb://127.0.0.1:27017/movieSearchApp',
        ttl: 24 * 60 * 60
    }),
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000
    }
}));

const authMiddleware = (req, res, next) => {
    const publicPaths = ['/login', '/register', '/'];
    if (req.session.user || publicPaths.includes(req.path)) {
        next();
    } else {
        res.redirect('/login');
    }
};

app.use(authMiddleware);

app.get('/', (req, res) => {
    if (req.session.user) {
        res.redirect('/movies/search');
    } else {
        res.redirect('/login');
    }
});

app.use('/', authRoutes);
app.use('/movies', movieRoutes);
app.use('/favorites', favoriteRoutes);
app.use('/api/movies', linkRoutes);  
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}`);
});

module.exports = app;