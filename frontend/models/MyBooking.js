//const mongoose = require('mongoose');

//const MyBookingSchema = new mongoose.Schema({
  //userId: { type: String, required: true },
  //movieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie' },
  //movieTitle: { type: String, required: true },
  //poster: { type: String },
  //date: { type: Date, required: true },
  //time: { type: String, required: true },
  //theater: { type: String, required: true },
  //format: { type: String },
  //seats: [{ type: String }],
  //total: { type: Number, required: true },
  //status: { type: String, default: 'confirmed' }
//}, {
//  versionKey: false 
//});

//module.exports = mongoose.model('MyBooking', MyBookingSchema);


const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema({
    userId: String,
    movieId: String,
    seats: Array,
    date: String
});

module.exports = mongoose.model("Booking", BookingSchema);