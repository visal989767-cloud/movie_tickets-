
      const mongoose = require('mongoose');
      const bookingSchema = new mongoose.Schema({
        id: { type: String, unique: true },
        userId: { type: String, required: true },
        user: { type: String, required: true },
        movieId: { type: String },
        movieTitle: { type: String, required: true },
        movie: { type: String, required: true },
        poster: { type: String },
        date: { type: String, required: true },
        time: { type: String, required: true },
        theater: { type: String, required: true },
        format: { type: String, default: 'Standard 2D' },
        seats: { type: String, required: true },
        total: { type: Number, required: true },
        status: { type: String, default: 'Confirmed' },
        paymentMethod: { type: String },
        bookingDate: { type: Date, default: Date.now }
      });
      module.exports = mongoose.model('MyBooking', bookingSchema);
    