// ============================================
// COMPLETE DATABASE SCHEMA - LEGEND CINEMA
// ============================================

const mongoose = require("mongoose");

// ──────────────────────────────────────────────
// 1. SHOWTIME SUB-SCHEMA
// ──────────────────────────────────────────────
const ShowtimeSchema = new mongoose.Schema({
    time: { type: String, required: true }, // e.g., "10:00 AM", "7:00 PM"
    hall: { type: String, required: true }, // e.g., "Hall 1", "IMAX"
    price: { type: Number, required: true, default: 3.00 }, // Ticket price
    availableSeats: { type: Number, default: 56 }, // Total seats available
    bookedSeats: [{ type: String }] // Array of booked seat IDs like "A1", "B3"
}, {
    _id: false
});

// ──────────────────────────────────────────────
// 2. MOVIE SCHEMA
// ──────────────────────────────────────────────
const MovieSchema = new mongoose.Schema({
    // Basic movie information
    title: { type: String, required: true, index: true },
    genre: { type: String, required: true },
    year: { type: Number },
    director: { type: String },
    duration: { type: String }, // e.g., "2h 32min"
    release: { type: String }, // Release date
    classification: { type: String }, // e.g., "PG-13", "R"
    
    // Media
    poster: { type: String, default: "" },
    image: { type: String, default: "" }, // Alternative field
    trailer: { type: String, default: "" },
    
    // Ratings and metadata
    rating: { type: Number, default: 0, min: 0, max: 10 },
    popularity: { type: Number, default: 0 },
    description: { type: String, default: "" },
    
    // Flags
    featured: { type: Boolean, default: false },
    newRelease: { type: Boolean, default: false },
    
    // Showtimes with pricing
    showtimes: [ShowtimeSchema],
    
    // Base price (can be overridden per showtime)
    basePrice: { type: Number, default: 3.00 },
    
    // Additional pricing tiers
    pricing: {
        standard: { type: Number, default: 3.00 },
        vip: { type: Number, default: 5.00 },
        student: { type: Number, default: 2.50 },
        child: { type: Number, default: 2.00 }
    },
    
    // Available dates (YYYY-MM-DD format)
    showDates: [{ type: String }],
    
    // Theater information
    theater: { type: String, default: "Main Hall" },
    
    // Timestamps
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    versionKey: false,
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

// ─── INDEXES ───
MovieSchema.index({ title: 'text', genre: 1 });
MovieSchema.index({ showDates: 1 });
MovieSchema.index({ 'showtimes.time': 1 });
MovieSchema.index({ rating: -1, popularity: -1 });

// ─── METHODS ───

// Check seat availability
MovieSchema.methods.isSeatAvailable = function(date, time, seatId) {
    const showtime = this.showtimes.find(st => st.time === time);
    if (!showtime) return false;
    return !showtime.bookedSeats.includes(seatId);
};

// Book seats
MovieSchema.methods.bookSeats = function(date, time, seatIds) {
    const showtime = this.showtimes.find(st => st.time === time);
    if (!showtime) {
        return { success: false, message: "Showtime not found" };
    }
    
    const available = seatIds.every(seat => !showtime.bookedSeats.includes(seat));
    if (!available) {
        return { success: false, message: "Some seats are already booked" };
    }
    
    showtime.bookedSeats.push(...seatIds);
    showtime.availableSeats -= seatIds.length;
    return { success: true, bookedSeats: seatIds };
};

// Get available seats for a showtime
MovieSchema.methods.getAvailableSeats = function(time) {
    const showtime = this.showtimes.find(st => st.time === time);
    if (!showtime) return [];
    
    const allSeats = [];
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    rows.forEach(row => {
        for (let i = 1; i <= 8; i++) {
            const seatId = row + i;
            allSeats.push({
                id: seatId,
                booked: showtime.bookedSeats.includes(seatId)
            });
        }
    });
    return allSeats;
};

// Get price for a specific showtime
MovieSchema.methods.getShowtimePrice = function(time) {
    const showtime = this.showtimes.find(st => st.time === time);
    return showtime ? showtime.price : this.basePrice || 3.00;
};

// ─── VIRTUALS ───

// Get pricing tiers
MovieSchema.virtual('getPricing').get(function() {
    return {
        standard: this.pricing?.standard || this.basePrice || 3.00,
        vip: this.pricing?.vip || 5.00,
        student: this.pricing?.student || 2.50,
        child: this.pricing?.child || 2.00
    };
});

// Get total seats available across all showtimes
MovieSchema.virtual('totalSeatsAvailable').get(function() {
    return this.showtimes.reduce((total, st) => total + st.availableSeats, 0);
});

// Ensure virtuals are included in JSON output
MovieSchema.set('toJSON', { virtuals: true });
MovieSchema.set('toObject', { virtuals: true });

// ─── MIDDLEWARE ───
MovieSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// ──────────────────────────────────────────────
// 3. BOOKING SCHEMA
// ──────────────────────────────────────────────
const BookingSchema = new mongoose.Schema({
    // User information
    userId: { type: String, required: true, index: true },
    userName: { type: String, default: "MovieFan" },
    userEmail: { type: String },
    
    // Movie information
    movieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie' },
    movieTitle: { type: String, required: true },
    movieGenre: { type: String },
    moviePoster: { type: String },
    
    // Booking details
    date: { type: String, required: true }, // YYYY-MM-DD
    time: { type: String, required: true },
    theater: { type: String, required: true },
    hall: { type: String },
    seats: [{ type: String }], // Array of seat IDs
    seatCount: { type: Number, default: 0 },
    
    // Pricing
    ticketPrice: { type: Number, default: 3.00 },
    subtotal: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    
    // Payment
    paymentMethod: { type: String, required: true }, // "ABA Bank", "Wing Money", etc.
    paymentStatus: { 
        type: String, 
        enum: ['Pending', 'Paid', 'Failed', 'Refunded'], 
        default: 'Paid' 
    },
    transactionId: { type: String },
    paymentDate: { type: Date, default: Date.now },
    
    // QR Code reference
    qrCodeData: { type: String },
    
    // Status
    status: { 
        type: String, 
        enum: ['Confirmed', 'Cancelled', 'Completed'], 
        default: 'Confirmed' 
    },
    
    // Timestamps
    bookingDate: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    versionKey: false,
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

// ─── INDEXES ───
BookingSchema.index({ userId: 1, bookingDate: -1 });
BookingSchema.index({ movieId: 1, date: 1 });
BookingSchema.index({ status: 1, paymentStatus: 1 });
BookingSchema.index({ transactionId: 1 });

// ─── METHODS ───

// Generate booking ID
BookingSchema.methods.generateBookingId = function() {
    return 'BK-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();
};

// Calculate total with tax
BookingSchema.methods.calculateTotal = function() {
    this.subtotal = this.seatCount * this.ticketPrice;
    this.tax = this.subtotal * 0.10; // 10% tax
    this.total = this.subtotal + this.tax;
    return this.total;
};

// ─── MIDDLEWARE ───
BookingSchema.pre('save', function(next) {
    if (this.seats && this.seats.length > 0) {
        this.seatCount = this.seats.length;
    }
    if (!this.transactionId) {
        this.transactionId = this.generateBookingId();
    }
    if (this.total === 0 && this.seatCount > 0) {
        this.calculateTotal();
    }
    next();
});

// ─── STATIC METHODS ───

// Get user's booking history
BookingSchema.statics.getUserHistory = function(userId, limit = 10) {
    return this.find({ userId })
        .sort({ bookingDate: -1 })
        .limit(limit)
        .populate('movieId', 'title genre poster rating');
};

// Get revenue by date range
BookingSchema.statics.getRevenue = function(startDate, endDate) {
    return this.aggregate([
        {
            $match: {
                bookingDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
                paymentStatus: 'Paid',
                status: 'Confirmed'
            }
        },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: '$total' },
                totalBookings: { $sum: 1 },
                totalSeats: { $sum: '$seatCount' },
                averageTicketPrice: { $avg: '$ticketPrice' }
            }
        }
    ]);
};

// Get booking statistics by movie
BookingSchema.statics.getMovieStats = function() {
    return this.aggregate([
        { $match: { status: 'Confirmed', paymentStatus: 'Paid' } },
        {
            $group: {
                _id: '$movieTitle',
                totalBookings: { $sum: 1 },
                totalSeats: { $sum: '$seatCount' },
                totalRevenue: { $sum: '$total' }
            }
        },
        { $sort: { totalRevenue: -1 } }
    ]);
};

// ──────────────────────────────────────────────
// 4. PAYMENT SCHEMA
// ──────────────────────────────────────────────
const PaymentSchema = new mongoose.Schema({
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    userId: { type: String, required: true, index: true },
    
    // Payment details
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    method: { type: String, required: true }, // "ABA Bank", "Wing Money", "ACLEDA Bank", "QR Code"
    
    // Payment status
    status: { 
        type: String, 
        enum: ['Pending', 'Processing', 'Completed', 'Failed', 'Refunded'], 
        default: 'Pending' 
    },
    
    // Transaction details
    transactionId: { type: String, unique: true },
    referenceNumber: { type: String },
    paymentDate: { type: Date, default: Date.now },
    
    // QR Code
    qrCode: { type: String },
    qrExpiry: { type: Date },
    
    // Additional metadata
    metadata: { type: mongoose.Schema.Types.Mixed },
    
    // Timestamps
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    versionKey: false,
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

// ─── INDEXES ───
PaymentSchema.index({ transactionId: 1 });
PaymentSchema.index({ userId: 1, paymentDate: -1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ method: 1 });

// ─── METHODS ───

// Generate transaction ID
PaymentSchema.methods.generateTransactionId = function() {
    return 'PAY-' + Date.now() + '-' + Math.random().toString(36).substr(2, 8).toUpperCase();
};

// Generate QR code data
PaymentSchema.methods.generateQRCode = function() {
    const data = {
        transactionId: this.transactionId,
        amount: this.amount,
        method: this.method,
        timestamp: Date.now()
    };
    return Buffer.from(JSON.stringify(data)).toString('base64');
};

// ─── MIDDLEWARE ───
PaymentSchema.pre('save', function(next) {
    if (!this.transactionId) {
        this.transactionId = this.generateTransactionId();
    }
    if (!this.qrCode) {
        this.qrCode = this.generateQRCode();
    }
    if (!this.qrExpiry) {
        this.qrExpiry = new Date(Date.now() + 15 * 60000); // 15 minutes expiry
    }
    next();
});

// ─── STATIC METHODS ───

// Get payment stats by method
PaymentSchema.statics.getMethodStats = function() {
    return this.aggregate([
        { $match: { status: 'Completed' } },
        {
            $group: {
                _id: '$method',
                totalAmount: { $sum: '$amount' },
                count: { $sum: 1 }
            }
        },
        { $sort: { totalAmount: -1 } }
    ]);
};

// ──────────────────────────────────────────────
// 5. EXPORT MODELS
// ──────────────────────────────────────────────
const Movie = mongoose.model("Movie", MovieSchema);
const Booking = mongoose.model("Booking", BookingSchema);
const Payment = mongoose.model("Payment", PaymentSchema);

// ──────────────────────────────────────────────
// 6. SEED DATA (for testing)
// ──────────────────────────────────────────────
const sampleMovies = [
    {
        title: "The Dark Knight",
        year: 2008,
        genre: "Action",
        rating: 9.0,
        director: "Christopher Nolan",
        duration: "2h 32min",
        release: "18 Jul 2008",
        classification: "PG-13",
        poster: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
        basePrice: 4.00,
        pricing: {
            standard: 4.00,
            vip: 6.50,
            student: 3.00,
            child: 2.50
        },
        showDates: ["2026-07-14", "2026-07-15", "2026-07-16", "2026-07-17", "2026-07-18"],
        showtimes: [
            { time: "10:00 AM", hall: "Hall 1", price: 4.00, availableSeats: 56, bookedSeats: [] },
            { time: "1:00 PM", hall: "Hall 1", price: 4.00, availableSeats: 56, bookedSeats: [] },
            { time: "4:00 PM", hall: "Hall 1", price: 4.00, availableSeats: 56, bookedSeats: [] },
            { time: "7:00 PM", hall: "Hall 1", price: 4.00, availableSeats: 56, bookedSeats: ["A1", "A2"] },
            { time: "10:00 PM", hall: "Hall 1", price: 4.00, availableSeats: 56, bookedSeats: [] }
        ],
        featured: true,
        newRelease: false,
        theater: "Main Hall"
    },
    {
        title: "Oppenheimer",
        year: 2023,
        genre: "Drama",
        rating: 8.9,
        director: "Christopher Nolan",
        duration: "3h 0min",
        release: "21 Jul 2023",
        classification: "R",
        poster: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
        basePrice: 5.00,
        pricing: {
            standard: 5.00,
            vip: 7.50,
            student: 3.50,
            child: 3.00
        },
        showDates: ["2026-07-14", "2026-07-15", "2026-07-16", "2026-07-17"],
        showtimes: [
            { time: "11:00 AM", hall: "IMAX", price: 5.00, availableSeats: 56, bookedSeats: [] },
            { time: "3:00 PM", hall: "IMAX", price: 5.00, availableSeats: 56, bookedSeats: [] },
            { time: "7:00 PM", hall: "IMAX", price: 5.00, availableSeats: 56, bookedSeats: [] }
        ],
        featured: true,
        newRelease: true,
        theater: "IMAX Theater"
    },
    {
        title: "Inception",
        year: 2010,
        genre: "Sci-Fi",
        rating: 8.8,
        director: "Christopher Nolan",
        duration: "2h 28min",
        release: "16 Jul 2010",
        classification: "PG-13",
        poster: "https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
        basePrice: 3.50,
        pricing: {
            standard: 3.50,
            vip: 6.00,
            student: 2.50,
            child: 2.00
        },
        showDates: ["2026-07-14", "2026-07-15", "2026-07-16"],
        showtimes: [
            { time: "12:00 PM", hall: "Hall 2", price: 3.50, availableSeats: 56, bookedSeats: [] },
            { time: "3:30 PM", hall: "Hall 2", price: 3.50, availableSeats: 56, bookedSeats: [] },
            { time: "7:00 PM", hall: "Hall 2", price: 3.50, availableSeats: 56, bookedSeats: ["B3", "B4"] },
            { time: "10:00 PM", hall: "Hall 2", price: 3.50, availableSeats: 56, bookedSeats: [] }
        ],
        featured: false,
        newRelease: false,
        theater: "Main Hall"
    },
    {
        title: "Dune: Part Two",
        year: 2024,
        genre: "Sci-Fi",
        rating: 8.6,
        director: "Denis Villeneuve",
        duration: "2h 46min",
        release: "01 Mar 2024",
        classification: "PG-13",
        poster: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
        basePrice: 5.50,
        pricing: {
            standard: 5.50,
            vip: 8.00,
            student: 4.00,
            child: 3.50
        },
        showDates: ["2026-07-14", "2026-07-15", "2026-07-16", "2026-07-17", "2026-07-18"],
        showtimes: [
            { time: "10:30 AM", hall: "IMAX", price: 5.50, availableSeats: 56, bookedSeats: [] },
            { time: "2:00 PM", hall: "IMAX", price: 5.50, availableSeats: 56, bookedSeats: [] },
            { time: "6:30 PM", hall: "IMAX", price: 5.50, availableSeats: 56, bookedSeats: [] }
        ],
        featured: true,
        newRelease: true,
        theater: "IMAX Theater"
    },
    {
        title: "John Wick: Chapter 4",
        year: 2023,
        genre: "Action",
        rating: 8.2,
        director: "Chad Stahelski",
        duration: "2h 49min",
        release: "24 Mar 2023",
        classification: "R",
        poster: "https://image.tmdb.org/t/p/w500/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg",
        basePrice: 4.00,
        pricing: {
            standard: 4.00,
            vip: 6.50,
            student: 3.00,
            child: 2.50
        },
        showDates: ["2026-07-14", "2026-07-15", "2026-07-16"],
        showtimes: [
            { time: "1:00 PM", hall: "Hall 3", price: 4.00, availableSeats: 56, bookedSeats: [] },
            { time: "4:30 PM", hall: "Hall 3", price: 4.00, availableSeats: 56, bookedSeats: [] },
            { time: "8:00 PM", hall: "Hall 3", price: 4.00, availableSeats: 56, bookedSeats: [] }
        ],
        featured: false,
        newRelease: false,
        theater: "Main Hall"
    },
    {
        title: "Spider-Man: Across the Spider-Verse",
        year: 2023,
        genre: "Animation",
        rating: 8.9,
        director: "Joaquim Dos Santos",
        duration: "2h 20min",
        release: "02 Jun 2023",
        classification: "PG",
        poster: "https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj3mJ6l.jpg",
        basePrice: 3.00,
        pricing: {
            standard: 3.00,
            vip: 5.00,
            student: 2.00,
            child: 1.50
        },
        showDates: ["2026-07-14", "2026-07-15"],
        showtimes: [
            { time: "11:00 AM", hall: "Hall 4", price: 3.00, availableSeats: 56, bookedSeats: [] },
            { time: "2:30 PM", hall: "Hall 4", price: 3.00, availableSeats: 56, bookedSeats: [] },
            { time: "6:00 PM", hall: "Hall 4", price: 3.00, availableSeats: 56, bookedSeats: [] }
        ],
        featured: false,
        newRelease: false,
        theater: "Kids Theater"
    }
];

// ──────────────────────────────────────────────
// 7. SEED FUNCTION
// ──────────────────────────────────────────────
async function seedDatabase() {
    try {
        await Movie.deleteMany({});
        await Booking.deleteMany({});
        await Payment.deleteMany({});
        
        const inserted = await Movie.insertMany(sampleMovies);
        console.log(`✅ Seeded ${inserted.length} movies successfully`);
        
        // Create a sample booking
        const sampleBooking = new Booking({
            userId: 'user_test_123',
            userName: 'Test User',
            userEmail: 'test@cinema.com',
            movieId: inserted[0]._id,
            movieTitle: inserted[0].title,
            movieGenre: inserted[0].genre,
            moviePoster: inserted[0].poster,
            date: '2026-07-14',
            time: '7:00 PM',
            theater: 'Main Hall',
            hall: 'Hall 1',
            seats: ['A3', 'A4', 'A5'],
            seatCount: 3,
            ticketPrice: 4.00,
            subtotal: 12.00,
            tax: 1.20,
            total: 13.20,
            paymentMethod: 'ABA Bank',
            paymentStatus: 'Paid',
            status: 'Confirmed',
            transactionId: 'BK-TEST-001'
        });
        
        await sampleBooking.save();
        console.log('✅ Created sample booking');
        
        // Create a sample payment
        const samplePayment = new Payment({
            bookingId: sampleBooking._id,
            userId: 'user_test_123',
            amount: 13.20,
            method: 'ABA Bank',
            status: 'Completed',
            transactionId: 'PAY-TEST-001'
        });
        
        await samplePayment.save();
        console.log('✅ Created sample payment');
        
        console.log('🎬 Database seeding completed successfully!');
    } catch (error) {
        console.error('❌ Error seeding database:', error);
    }
}

// ──────────────────────────────────────────────
// 8. EXPORT ALL
// ──────────────────────────────────────────────
module.exports = {
    Movie,
    Booking,
    Payment,
    seedDatabase,
    sampleMovies
};