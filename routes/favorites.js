const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const usersFavoritesFile = path.join(__dirname, '../data/usersFavorites.json');

function readUsersFavorites() {
    if (!fs.existsSync(usersFavoritesFile)) {
        fs.writeFileSync(usersFavoritesFile, '{}');
        return {};
    }
    return JSON.parse(fs.readFileSync(usersFavoritesFile, 'utf8'));
}

function writeUsersFavorites(data) {
    fs.writeFileSync(usersFavoritesFile, JSON.stringify(data, null, 2));
}

function getUserFavorites(userEmail) {
    const data = readUsersFavorites();
    return data[userEmail] || { movies: {}, links: {} };
}

router.get('/', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.render('favorites', { user: req.session.user });
});

router.get('/list', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const userFavorites = getUserFavorites(req.session.user.email);
    const moviesList = Object.values(userFavorites.movies);
    res.json(moviesList);
});

router.get('/check/:id', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const userFavorites = getUserFavorites(req.session.user.email);
    res.json({ isFavorite: !!userFavorites.movies[req.params.id] });
});

router.post('/add/:id', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const movieId = req.params.id;
    const movieData = req.body.movieData;
    const data = readUsersFavorites();
    
    if (!data[req.session.user.email]) {
        data[req.session.user.email] = { movies: {}, links: {} };
    }
    
    data[req.session.user.email].movies[movieId] = movieData;
    writeUsersFavorites(data);
    
    res.json({ message: 'Movie added to favorites' });
});

router.post('/remove/:id', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const movieId = req.params.id;
    const data = readUsersFavorites();
    
    if (data[req.session.user.email]?.movies[movieId]) {
        delete data[req.session.user.email].movies[movieId];
        delete data[req.session.user.email].links[movieId];
        writeUsersFavorites(data);
    }
    
    res.json({ message: 'Movie removed from favorites' });
});

router.get('/links/:movieId', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const userFavorites = getUserFavorites(req.session.user.email);
    const links = userFavorites.links[req.params.movieId] || [];
    res.json(links);
});

router.post('/links/add/:movieId', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const { movieId } = req.params;
    const linkData = req.body;
    const data = readUsersFavorites();
    
    if (!data[req.session.user.email].links[movieId]) {
        data[req.session.user.email].links[movieId] = [];
    }
    
    data[req.session.user.email].links[movieId].push(linkData);
    writeUsersFavorites(data);
    
    res.json({ message: 'Link added successfully' });
});

router.post('/links/remove/:movieId/:index', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const { movieId, index } = req.params;
    const data = readUsersFavorites();
    
    if (data[req.session.user.email]?.links[movieId]) {
        data[req.session.user.email].links[movieId].splice(parseInt(index), 1);
        writeUsersFavorites(data);
    }
    
    res.json({ message: 'Link removed successfully' });
});

module.exports = router;