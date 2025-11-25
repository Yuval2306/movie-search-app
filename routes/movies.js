const express = require('express');
const router = express.Router();
const Link = require('../models/LinkModel');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const apiKey = '174ff52b';
const Rating = require('../models/RatingModel');
router.get('/search', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.render('search', { user: req.session.user });
});

router.get('/details/:id', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.render('details', { user: req.session.user });
});

router.get('/best-links', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.render('best-links', { user: req.session.user });
});

router.get('/admin', (req, res) => {
    if (!req.session.user?.isAdmin) {
        return res.redirect('/movies/search');
    }
    res.render('admin', { user: req.session.user });
});

router.get('/api/best-links', async (req, res) => {
    try {
        const topLinks = await Link.aggregate([
            {
                $sort: { clicks: -1, averageRating: -1 }
            },
            {
                $group: {
                    _id: "$movieId",
                    topLink: { $first: "$$ROOT" }
                }
            }
        ]).exec();

        res.json({ links: topLinks });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching best links' });
    }
});

router.get('/api/admin/links', async (req, res) => {
    try {
        if (!req.session.user?.isAdmin) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const links = await Link.find().populate('userId', 'name');
        
        const linksWithMovies = await Promise.all(
            links.map(async link => {
                try {
                    const response = await fetch(`https://www.omdbapi.com/?apikey=${apiKey}&i=${link.movieId}`);
                    const movie = await response.json();
                    return {
                        userId: link.userId,
                        movieTitle: movie.Title,
                        _id: link._id,
                        name: link.name,
                        clicks: link.clicks,
                        isPrivate: link.isPrivate
                    };
                } catch (error) {
                    console.error('Movie fetch error:', error);
                    return {
                        ...link.toObject(),
                        movieTitle: 'Error loading movie'
                    };
                }
            })
        );

        res.json({ links: linksWithMovies });
    } catch (error) {
        console.error('Admin links error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.delete('/api/admin/links/:linkId', async (req, res) => {
    if (!req.session.user?.isAdmin) {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    try {
        const link = await Link.findById(req.params.linkId);
        if (!link) {
            return res.status(404).json({ error: 'Link not found' });
        }

        if (link.isPrivate) {
            return res.status(403).json({ error: 'Cannot delete private links' });
        }

        await Link.deleteOne({ _id: req.params.linkId });
        await Rating.deleteMany({ linkId: req.params.linkId });
        
        res.json({ message: 'Link deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;