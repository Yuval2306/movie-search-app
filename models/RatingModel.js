const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
    linkId: { type: mongoose.Schema.Types.ObjectId, ref: 'Link', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    review: String
}, { timestamps: true });

module.exports = mongoose.model('Rating', ratingSchema);