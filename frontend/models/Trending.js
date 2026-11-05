const mongoose = require('mongoose');

const TrendingSchema = new mongoose.Schema({
  movieId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Movie', 
    required: true 
  },
  rank: { type: Number },
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  trendingScore: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
}, {
  versionKey: false 
});

module.exports = mongoose.model('Trending', TrendingSchema);