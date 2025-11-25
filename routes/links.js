const express = require('express');
const router = express.Router();
const Link = require('../models/LinkModel');
const Rating = require('../models/RatingModel');
const mongoose = require('mongoose');

router.get('/:movieId/links', async (req, res) => {
   try {
       const { movieId } = req.params;
       const page = parseInt(req.query.page) || 1;
       const limit = parseInt(req.query.limit) || 10;
       const sort = req.query.sort || 'rating';
       const userId = req.session.user.id;

       const query = {
           movieId,
           $or: [
               { userId },
               { isPrivate: false }
           ]
       };

       const links = await Link.find(query)
           .populate('userId', 'name email')
           .sort(sort === 'rating' ? { averageRating: -1 } : { clicks: -1 })
           .skip((page - 1) * limit)
           .limit(limit);

       const total = await Link.countDocuments(query);

       res.json({
           links,
           totalPages: Math.ceil(total / limit),
           currentPage: page
       });
   } catch (error) {
       res.status(500).json({ error: error.message });
   }
});

router.post('/:movieId/links', async (req, res) => {
   try {
       const { movieId } = req.params;
       const { url, name, description, isPrivate } = req.body;
       const userId = req.session.user.id;

       const link = new Link({
           movieId,
           userId,
           url,
           name,
           description,
           isPrivate,
           clicks: 0,
           averageRating: 0
       });

       await link.save();
       res.json(link);
   } catch (error) {
       res.status(500).json({ error: error.message });
   }
});

router.put('/:movieId/links/:linkId', async (req, res) => {
   try {
       const { linkId } = req.params;
       const userId = req.session.user.id;
       const updates = {
           name: req.body.name,
           url: req.body.url,
           description: req.body.description,
           isPrivate: req.body.isPrivate
       };

       const link = await Link.findOneAndUpdate(
           { _id: linkId, userId },
           updates,
           { new: true }
       );

       if (!link) {
           return res.status(404).json({ error: 'Link not found or unauthorized' });
       }

       res.json(link);
   } catch (error) {
       res.status(500).json({ error: error.message });
   }
});

router.delete('/:movieId/links/:linkId', async (req, res) => {
   try {
       const { linkId } = req.params;
       const userId = req.session.user.id;

       const link = await Link.findOneAndDelete({ _id: linkId, userId });
       if (!link) {
           return res.status(404).json({ error: 'Link not found or unauthorized' });
       }

       
       await Rating.deleteMany({ linkId });

       res.json({ message: 'Link and associated ratings deleted successfully' });
   } catch (error) {
       res.status(500).json({ error: error.message });
   }
});

router.post('/:movieId/links/:linkId/rate', async (req, res) => {
    try {
        const { linkId } = req.params;
        const { rating, review } = req.body;
        const userId = req.session.user.id;

        const link = await Link.findById(linkId);
        if (!link) {
            return res.status(404).json({ error: 'Link not found' });
        }

        link.ratings = link.ratings.filter(r => r.userId.toString() !== userId);
        
        link.ratings.push({ userId, rating, review });
        
        link.averageRating = link.ratings.reduce((acc, curr) => acc + curr.rating, 0) / link.ratings.length;
        link.totalRatings = link.ratings.length;
        
        await link.save();
        res.json(link);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/:movieId/links/:linkId/click', async (req, res) => {
   try {
       const { linkId } = req.params;
       const link = await Link.findByIdAndUpdate(
           linkId,
           { $inc: { clicks: 1 } },
           { new: true }
       );

       if (!link) {
           return res.status(404).json({ error: 'Link not found' });
       }

       res.json(link);
   } catch (error) {
       res.status(500).json({ error: error.message });
   }
});
router.get('/api/best-links', async (req, res) => {
    try {
        const links = await Link.find({ isPrivate: false })
            .sort({ averageRating: -1 }) 
            .limit(10); 

        res.json({ links });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;