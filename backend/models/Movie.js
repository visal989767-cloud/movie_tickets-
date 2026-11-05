
      const mongoose = require('mongoose');
      const movieSchema = new mongoose.Schema({
        id: { type: Number, unique: true },
        title: { type: String, required: true },
        year: { type: String, required: true },
        genre: { type: String, required: true },
        rating: { type: String, required: true },
        description: { type: String },
        poster: { type: String, required: true },
        trailer: { type: String },
        director: { type: String },
        duration: { type: String },
        featured: { type: Boolean, default: false },
        newRelease: { type: Boolean, default: false },
        popularity: { type: Number, default: 0 }
      });
      module.exports = mongoose.model('Movie', movieSchema);
    