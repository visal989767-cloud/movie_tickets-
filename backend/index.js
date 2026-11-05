const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const app = express();

// Enable CORS for frontend
app.use(cors());

// Ensure models directory exists
const modelsDir = path.join(__dirname, 'models');
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
}

// Create models if they don't exist
const createModels = () => {
  const models = {
    'Movie': `
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
    `,
    
    'MyBooking': `
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
    `,
    
    'User': `
      const mongoose = require('mongoose');
      const userSchema = new mongoose.Schema({
        id: { type: Number, unique: true },
        username: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        role: { type: String, default: 'user' },
        avatar: { type: String },
        membership: { type: String, default: 'standard' },
        favoriteGenres: [{ type: String }],
        createdAt: { type: Date, default: Date.now }
      });
      module.exports = mongoose.model('User', userSchema);
    `
  };

  Object.keys(models).forEach(modelName => {
    const modelPath = path.join(modelsDir, `${modelName}.js`);
    if (!fs.existsSync(modelPath)) {
      fs.writeFileSync(modelPath, models[modelName]);
      console.log(`✅ Created ${modelName} model`);
    }
  });
};

// Create models
createModels();

// Import models
let Movie, MyBooking, User;
let dbConnected = false;

try {
  Movie = require('./models/Movie');
  MyBooking = require('./models/MyBooking');
  User = require('./models/User');
} catch (error) {
  console.log('⚠️ Models not yet created, will retry after DB connection');
}

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const frontendDir = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendDir));

// MongoDB connection with retry logic
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/CINEMA_PROJECT';
const mongooseOptions = {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

console.log('\n🎬 Starting Cinema Server...');
console.log(`📀 Attempting to connect to: ${MONGODB_URI}\n`);

function connectWithRetry() {
  mongoose.connect(MONGODB_URI, mongooseOptions)
    .then(() => {
      console.log('✅ Connected to MongoDB successfully');
      console.log(`📀 Database: ${mongoose.connection.name}`);
      console.log(`🔗 Connection URL: ${MONGODB_URI.replace(/\/\/.*@/, '//***:***@')}\n`);
      dbConnected = true;
      
      try {
        Movie = require('./models/Movie');
        MyBooking = require('./models/MyBooking');
        User = require('./models/User');
        console.log('✅ Models loaded successfully');
      } catch (error) {
        console.log('⚠️ Models loaded with warning');
      }
    })
    .catch(err => {
      console.error('❌ MongoDB connection error:', err.message);
      console.log('\n⚠️  MONGODB TROUBLESHOOTING:');
      console.log('   1️⃣  Make sure MongoDB is installed');
      console.log('   2️⃣  Start MongoDB service:');
      console.log('       - Windows: net start MongoDB');
      console.log('       - Mac: brew services start mongodb-community');
      console.log('       - Linux: sudo systemctl start mongod');
      console.log('   3️⃣  Or create a free MongoDB Atlas account');
      console.log('   4️⃣  Set environment variable: MONGODB_URI=your_connection_string');
      console.log('\n💡 Running with LOCAL STORAGE MODE (bookings saved to memory)\n');
      dbConnected = false;
      
      setTimeout(connectWithRetry, 10000);
    });
}

connectWithRetry();

mongoose.connection.on('error', err => {
  console.error('❌ MongoDB error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected');
  dbConnected = false;
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
  dbConnected = true;
});

// ========== HIGH QUALITY MOVIE POSTERS (Optimized for fast loading) ==========
// Using optimized image URLs with proper dimensions and fast CDN
const moviePosters = {
  darkKnight: 'https://image.tmdb.org/t/p/w342/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
  inception: 'https://image.tmdb.org/t/p/w342/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
  interstellar: 'https://image.tmdb.org/t/p/w342/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
  oppenheimer: 'https://image.tmdb.org/t/p/w342/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
  johnWick4: 'https://image.tmdb.org/t/p/w342/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg',
  deadpool: 'https://image.tmdb.org/t/p/w342/8cdWjvZQUExUHTz63uQKuKqyvO7.jpg',
  barbie: 'https://image.tmdb.org/t/p/w342/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg',
  spiderverse: 'https://image.tmdb.org/t/p/w342/stmYfCUGd8Iy6kAMBr6AmWqx8Bq.jpg',
  dune2: 'https://i.pinimg.com/1200x/c7/28/4b/c7284bceb60a8e3a6dc5c3985a3475c4.jpg',
  gladiator2: 'https://image.tmdb.org/t/p/w342/2Fk1k8gcKmmPBs2TGGDML54j4N4.jpg',
  joker2: 'https://image.tmdb.org/t/p/w342/if8QiqCI7WfIm0HisFPPJ2XpP49.jpg',
  venom3: 'https://image.tmdb.org/t/p/w342/aAoIhU2Nv2E3vCPQb6E9U2VXcO2.jpg'
};

// In-memory storage for demo mode (with high quality posters)
let memoryMovies = [
  { id: 1, title: "The Dark Knight", genre: "Action", rating: "9.0", year: "2008", poster: moviePosters.darkKnight, director: "Christopher Nolan", duration: "2h 32m", description: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice." },
  { id: 2, title: "Inception", genre: "Sci-Fi", rating: "8.8", year: "2010", poster: moviePosters.inception, director: "Christopher Nolan", duration: "2h 28m", description: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O., but his tragic past may doom the project and his team to disaster." },
  { id: 3, title: "Interstellar", genre: "Sci-Fi", rating: "8.7", year: "2014", poster: moviePosters.interstellar, director: "Christopher Nolan", duration: "2h 49m", description: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival." },
  { id: 4, title: "Oppenheimer", genre: "Drama", rating: "8.9", year: "2023", poster: moviePosters.oppenheimer, director: "Christopher Nolan", duration: "3h 0m", description: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb." },
  { id: 5, title: "John Wick 4", genre: "Action", rating: "8.2", year: "2023", poster: moviePosters.johnWick4, director: "Chad Stahelski", duration: "2h 49m", description: "John Wick uncovers a path to defeating The High Table. But before he can earn his freedom, Wick must face off against a new enemy with powerful alliances across the globe." },
  { id: 6, title: "Deadpool 3", genre: "Action", rating: "8.5", year: "2024", poster: moviePosters.deadpool, director: "Shawn Levy", duration: "2h 10m", description: "Wolverine is recovering from his injuries when he crosses paths with the loudmouth, Deadpool. They team up to defeat a common enemy." },
  { id: 7, title: "Barbie", genre: "Comedy", rating: "7.8", year: "2023", poster: moviePosters.barbie, director: "Greta Gerwig", duration: "1h 54m", description: "Barbie and Ken are having the time of their lives in the colorful and seemingly perfect world of Barbie Land. However, when they get a chance to go to the real world, they soon discover the joys and perils of living among humans." },
  { id: 8, title: "Spider-Man: Across the Spider-Verse", genre: "Animation", rating: "8.9", year: "2023", poster: moviePosters.spiderverse, director: "Joaquim Dos Santos", duration: "2h 20m", description: "Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence." },
  { id: 9, title: "Dune: Part Two", genre: "Sci-Fi", rating: "9.0", year: "2024", poster: moviePosters.dune2, director: "Denis Villeneuve", duration: "2h 46m", description: "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family." }
];

let memoryBookings = [
  { id: "BK1001", userId: "john@example.com", user: "john@example.com", movie: "The Dark Knight", movieTitle: "The Dark Knight", seats: "A5, A6", date: "2025-05-15", time: "7:00 PM", theater: "IMAX Hall 1", total: 30, status: "Confirmed" },
  { id: "BK1002", userId: "jane@example.com", user: "jane@example.com", movie: "Inception", movieTitle: "Inception", seats: "B2, B3", date: "2025-05-16", time: "4:00 PM", theater: "4K Luxe Hall", total: 30, status: "Confirmed" },
  { id: "BK1003", userId: "mike@example.com", user: "mike@example.com", movie: "Interstellar", movieTitle: "Interstellar", seats: "C1, C2", date: "2025-05-17", time: "10:00 PM", theater: "IMAX Hall 1", total: 30, status: "Confirmed" }
];

// ========== MOVIE ROUTES (FULL CRUD FOR ADMIN) ==========

// Get all movies (with faster response caching)
app.get('/api/movies', async (req, res) => {
  // Set cache headers for faster subsequent loads
  res.set('Cache-Control', 'private, max-age=300');
  
  if (!dbConnected || !Movie) {
    return res.json(memoryMovies);
  }
  try {
    const movies = await Movie.find().lean(); // Use lean() for faster performance
    res.json(movies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get featured movies (for homepage - optimized)
app.get('/api/movies/featured', async (req, res) => {
  res.set('Cache-Control', 'private, max-age=600');
  
  if (!dbConnected || !Movie) {
    const featured = memoryMovies.slice(0, 6);
    return res.json(featured);
  }
  try {
    const featured = await Movie.find({ featured: true }).limit(6).lean();
    res.json(featured);
  } catch (error) {
    const featured = memoryMovies.slice(0, 6);
    res.json(featured);
  }
});

// Get trending movies
app.get('/api/movies/trending', async (req, res) => {
  res.set('Cache-Control', 'private, max-age=600');
  
  if (!dbConnected || !Movie) {
    const trending = [...memoryMovies].sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating)).slice(0, 8);
    return res.json(trending);
  }
  try {
    const trending = await Movie.find().sort({ popularity: -1 }).limit(8).lean();
    res.json(trending);
  } catch (error) {
    const trending = [...memoryMovies].sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating)).slice(0, 8);
    res.json(trending);
  }
});

// Get new releases
app.get('/api/movies/new-releases', async (req, res) => {
  res.set('Cache-Control', 'private, max-age=600');
  
  if (!dbConnected || !Movie) {
    const newReleases = [...memoryMovies].sort((a, b) => parseInt(b.year) - parseInt(a.year)).slice(0, 4);
    return res.json(newReleases);
  }
  try {
    const newReleases = await Movie.find({ newRelease: true }).limit(4).lean();
    res.json(newReleases);
  } catch (error) {
    const newReleases = [...memoryMovies].sort((a, b) => parseInt(b.year) - parseInt(a.year)).slice(0, 4);
    res.json(newReleases);
  }
});

// Get single movie by ID
app.get('/api/movies/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  res.set('Cache-Control', 'private, max-age=3600');
  
  if (!dbConnected || !Movie) {
    const movie = memoryMovies.find(m => m.id === id);
    if (movie) return res.json(movie);
    return res.status(404).json({ error: 'Movie not found' });
  }
  try {
    const movie = await Movie.findOne({ id: id }).lean();
    if (movie) res.json(movie);
    else res.status(404).json({ error: 'Movie not found' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new movie
app.post('/api/movies', async (req, res) => {
  const { title, genre, rating, year, poster, director, duration, description } = req.body;
  
  if (!title || !genre) {
    return res.status(400).json({ error: 'Title and genre are required' });
  }
  
  // Use optimized poster URL or create a placeholder
  let posterUrl = poster;
  if (!posterUrl) {
    // Use a high-quality placeholder service
    posterUrl = `https://placehold.co/342x513/1a1a2e/e0b354?text=${encodeURIComponent(title.substring(0, 15))}`;
  }
  
  const newMovie = {
    id: Date.now(),
    title,
    genre,
    rating: rating || "N/A",
    year: year || "2024",
    poster: posterUrl,
    director: director || "Various",
    duration: duration || "2h",
    description: description || ""
  };
  
  if (!dbConnected || !Movie) {
    memoryMovies.push(newMovie);
    return res.json({ message: 'Movie added successfully', movie: newMovie });
  }
  
  try {
    const movie = await new Movie({
      id: newMovie.id,
      title,
      year: year,
      genre,
      rating: rating,
      description: description || "",
      poster: posterUrl,
      director,
      duration
    }).save();
    res.json({ message: 'Movie added successfully', movie });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update movie
app.put('/api/movies/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { title, genre, rating, year, poster, director, duration } = req.body;
  
  if (!dbConnected || !Movie) {
    const index = memoryMovies.findIndex(m => m.id === id);
    if (index !== -1) {
      memoryMovies[index] = { ...memoryMovies[index], title, genre, rating, year, poster, director, duration };
    }
    return res.json({ message: 'Movie updated successfully' });
  }
  
  try {
    await Movie.findOneAndUpdate({ id: id }, { title, year, genre, rating, poster, director, duration });
    res.json({ message: 'Movie updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete movie
app.delete('/api/movies/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  
  if (!dbConnected || !Movie) {
    memoryMovies = memoryMovies.filter(m => m.id !== id);
    return res.json({ message: 'Movie deleted successfully' });
  }
  
  try {
    await Movie.findOneAndDelete({ id: id });
    res.json({ message: 'Movie deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== BOOKING ROUTES (FULL CRUD FOR ADMIN) ==========

// Get ALL bookings (for admin dashboard)
app.get('/api/bookings', async (req, res) => {
  res.set('Cache-Control', 'no-cache');
  
  if (!dbConnected || !MyBooking) {
    return res.json(memoryBookings);
  }
  try {
    const bookings = await MyBooking.find().sort({ bookingDate: -1 }).lean();
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get bookings for a specific user
app.get('/api/bookings/user/:userId', async (req, res) => {
  const userId = req.params.userId;
  res.set('Cache-Control', 'no-cache');
  
  if (!dbConnected || !MyBooking) {
    const userBookings = memoryBookings.filter(b => b.user === userId || b.userId === userId);
    return res.json(userBookings);
  }
  
  try {
    const bookings = await MyBooking.find({ $or: [{ userId: userId }, { user: userId }] }).sort({ bookingDate: -1 }).lean();
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single booking by ID
app.get('/api/bookings/:id', async (req, res) => {
  const bookingId = req.params.id;
  
  if (!dbConnected || !MyBooking) {
    const booking = memoryBookings.find(b => b.id === bookingId);
    if (booking) return res.json(booking);
    return res.status(404).json({ error: 'Booking not found' });
  }
  
  try {
    const booking = await MyBooking.findOne({ id: bookingId }).lean();
    if (booking) res.json(booking);
    else res.status(404).json({ error: 'Booking not found' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new booking
app.post('/api/bookings', async (req, res) => {
  console.log('📝 Received booking request:', req.body);
  
  const { userId, user, movieId, movieTitle, movie, poster, date, time, theater, seats, total, paymentMethod, id } = req.body;
  
  const finalUserId = userId || user;
  const finalMovie = movieTitle || movie;
  const bookingId = id || 'BK' + Date.now() + Math.floor(Math.random() * 1000);
  
  // Get poster URL if not provided
  let posterUrl = poster;
  if (!posterUrl && finalMovie) {
    const foundMovie = memoryMovies.find(m => m.title === finalMovie);
    if (foundMovie) {
      posterUrl = foundMovie.poster;
    } else {
      posterUrl = moviePosters.darkKnight;
    }
  }
  
  if (!finalUserId) {
    return res.status(400).json({ error: 'User ID is required' });
  }
  
  if (!finalMovie) {
    return res.status(400).json({ error: 'Movie title is required' });
  }
  
  if (!seats) {
    return res.status(400).json({ error: 'Seats are required' });
  }
  
  const bookingData = {
    id: bookingId,
    userId: finalUserId,
    user: finalUserId,
    movieId: movieId || 'unknown',
    movieTitle: finalMovie,
    movie: finalMovie,
    poster: posterUrl,
    date: date || new Date().toISOString().split('T')[0],
    time: time || '7:00 PM',
    theater: theater || 'IMAX Hall 1',
    seats: seats,
    total: parseFloat(total) || 30,
    paymentMethod: paymentMethod || 'Credit Card',
    status: 'Confirmed',
    bookingDate: new Date()
  };
  
  if (!dbConnected || !MyBooking) {
    memoryBookings.push(bookingData);
    console.log(`✅ Booking saved in memory. Total: ${memoryBookings.length}`);
    return res.json({ message: 'Booking created successfully', booking: bookingData, bookingId: bookingId });
  }
  
  try {
    const booking = await new MyBooking(bookingData).save();
    console.log(`✅ Booking saved to MongoDB! ID: ${booking._id}`);
    res.json({ message: 'Booking created successfully', booking: booking, bookingId: booking._id });
  } catch (error) {
    console.error('❌ Error saving booking:', error);
    memoryBookings.push(bookingData);
    res.json({ message: 'Booking created (fallback)', booking: bookingData, bookingId: bookingId });
  }
});

// Update booking (Admin edit)
app.put('/api/bookings/:id', async (req, res) => {
  const bookingId = req.params.id;
  const { user, movie, seats, date, time, theater, total, status } = req.body;
  
  console.log(`📝 Updating booking ${bookingId}:`, req.body);
  
  if (!dbConnected || !MyBooking) {
    const index = memoryBookings.findIndex(b => b.id === bookingId);
    if (index !== -1) {
      if (user) memoryBookings[index].user = user;
      if (movie) memoryBookings[index].movie = movie;
      if (seats) memoryBookings[index].seats = seats;
      if (date) memoryBookings[index].date = date;
      if (time) memoryBookings[index].time = time;
      if (theater) memoryBookings[index].theater = theater;
      if (total) memoryBookings[index].total = total;
      if (status) memoryBookings[index].status = status;
    }
    return res.json({ message: 'Booking updated successfully' });
  }
  
  try {
    await MyBooking.findOneAndUpdate({ id: bookingId }, { user, movieTitle: movie, seats, date, time, theater, total, status });
    res.json({ message: 'Booking updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete booking
app.delete('/api/bookings/:id', async (req, res) => {
  const bookingId = req.params.id;
  
  if (!dbConnected || !MyBooking) {
    memoryBookings = memoryBookings.filter(b => b.id !== bookingId);
    return res.json({ message: 'Booking deleted successfully' });
  }
  
  try {
    await MyBooking.findOneAndDelete({ id: bookingId });
    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== USER ROUTES ==========

// Get all users (for admin)
app.get('/api/users', async (req, res) => {
  const usersList = [
    { id: 1, username: "Visal", email: "admin@cinema.com", role: "admin", createdAt: "2024-01-01", bookings: 15, avatar: "https://ui-avatars.com/api/?background=ffd700&color=0a0e17&bold=true&name=Visal" },
    { id: 2, username: "MovieFan", email: "moviefan@example.com", role: "user", createdAt: "2024-02-15", bookings: 8, avatar: "https://ui-avatars.com/api/?name=MovieFan&background=c9a86a&color=fff" },
    { id: 3, username: "JohnDoe", email: "john@example.com", role: "user", createdAt: "2024-03-10", bookings: 3, avatar: "https://ui-avatars.com/api/?name=JohnDoe&background=c9a86a&color=fff" },
    { id: 4, username: "JaneSmith", email: "jane@example.com", role: "user", createdAt: "2024-03-20", bookings: 5, avatar: "https://ui-avatars.com/api/?name=JaneSmith&background=c9a86a&color=fff" }
  ];
  res.json(usersList);
});

// Get user profile
app.get('/api/users/profile/:userId', async (req, res) => {
  const userId = req.params.userId;
  
  // Demo user profiles
  const userProfiles = {
    'admin_visal': { id: 1, username: "Visal", email: "admin@cinema.com", role: "admin", membership: "premium", avatar: "https://ui-avatars.com/api/?background=ffd700&color=0a0e17&bold=true&name=Visal", joinedDate: "2024-01-01" },
    'moviefan@example.com': { id: 2, username: "MovieFan", email: "moviefan@example.com", role: "user", membership: "premium", avatar: "https://ui-avatars.com/api/?name=MovieFan&background=c9a86a&color=fff", joinedDate: "2024-02-15" }
  };
  
  const profile = userProfiles[userId] || userProfiles['moviefan@example.com'];
  res.json(profile);
});

// User login
app.post('/api/users/login', async (req, res) => {
  const { email, password } = req.body;
  console.log(`🔐 Login attempt: ${email}`);
  
  // Admin hardcoded credentials
  if ((email === 'admin@cinema.com' || email === 'admin') && password === 'admin123') {
    console.log(`✅ Admin login successful`);
    return res.json({
      message: 'Login successful',
      userId: 'admin_visal',
      role: 'admin',
      redirectTo: '/admindashboard',
      user: { 
        username: 'Visal', 
        email: 'admin@cinema.com',
        role: 'admin',
        avatar: 'https://ui-avatars.com/api/?background=ffd700&color=0a0e17&bold=true&name=Visal',
        membership: 'premium'
      }
    });
  }
  
  // Regular user demo login
  const userId = email;
  const username = email.split('@')[0];
  console.log(`✅ Login successful for: ${email}`);
  return res.json({
    message: 'Login successful',
    userId: userId,
    role: 'user',
    redirectTo: '/home',
    user: { 
      username: username, 
      email: email,
      role: 'user',
      avatar: `https://ui-avatars.com/api/?name=${username}&background=c9a86a&color=fff`,
      membership: 'premium'
    }
  });
});

// User registration
app.post('/api/users/register', async (req, res) => {
  const { username, email, password } = req.body;
  const userId = email;
  
  console.log(`📝 Registering user: ${email}`);
  
  res.json({
    message: 'User registered successfully',
    userId: userId,
    role: 'user',
    redirectTo: '/home',
    user: { 
      username: username || email.split('@')[0], 
      email: email,
      role: 'user',
      avatar: `https://ui-avatars.com/api/?name=${username || email.split('@')[0]}&background=c9a86a&color=fff`,
      membership: 'premium'
    }
  });
});

// ========== SEED DATA ==========

app.post('/api/seed-data', async (req, res) => {
  memoryMovies = [
    { id: 1, title: "The Dark Knight", genre: "Action", rating: "9.0", year: "2008", poster: moviePosters.darkKnight, director: "Christopher Nolan", duration: "2h 32m", description: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice." },
    { id: 2, title: "Inception", genre: "Sci-Fi", rating: "8.8", year: "2010", poster: moviePosters.inception, director: "Christopher Nolan", duration: "2h 28m", description: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O." },
    { id: 3, title: "Interstellar", genre: "Sci-Fi", rating: "8.7", year: "2014", poster: moviePosters.interstellar, director: "Christopher Nolan", duration: "2h 49m", description: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival." },
    { id: 4, title: "Oppenheimer", genre: "Drama", rating: "8.9", year: "2023", poster: moviePosters.oppenheimer, director: "Christopher Nolan", duration: "3h 0m", description: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb." },
    { id: 5, title: "John Wick 4", genre: "Action", rating: "8.2", year: "2023", poster: moviePosters.johnWick4, director: "Chad Stahelski", duration: "2h 49m", description: "John Wick uncovers a path to defeating The High Table." },
    { id: 6, title: "Deadpool 3", genre: "Action", rating: "8.5", year: "2024", poster: moviePosters.deadpool, director: "Shawn Levy", duration: "2h 10m", description: "Wolverine crosses paths with the loudmouth, Deadpool." },
    { id: 7, title: "Barbie", genre: "Comedy", rating: "7.8", year: "2023", poster: moviePosters.barbie, director: "Greta Gerwig", duration: "1h 54m", description: "Barbie and Ken discover the joys and perils of living among humans." },
    { id: 8, title: "Spider-Man: Across the Spider-Verse", genre: "Animation", rating: "8.9", year: "2023", poster: moviePosters.spiderverse, director: "Joaquim Dos Santos", duration: "2h 20m", description: "Miles Morales encounters a team of Spider-People across the Multiverse." },
    { id: 9, title: "Dune: Part Two", genre: "Sci-Fi", rating: "9.0", year: "2024", poster: moviePosters.dune2, director: "Denis Villeneuve", duration: "2h 46m", description: "Paul Atreides unites with Chani and the Fremen while seeking revenge." },
    { id: 10, title: "Joker: Folie à Deux", genre: "Drama", rating: "7.5", year: "2024", poster: moviePosters.joker2, director: "Todd Phillips", duration: "2h 18m", description: "The sequel to the 2019 film Joker." },
    { id: 11, title: "Venom: The Last Dance", genre: "Action", rating: "7.8", year: "2024", poster: moviePosters.venom3, director: "Kelly Marcel", duration: "1h 50m", description: "Eddie Brock and Venom face their greatest challenge yet." },
    { id: 12, title: "Gladiator II", genre: "Action", rating: "8.0", year: "2024", poster: moviePosters.gladiator2, director: "Ridley Scott", duration: "2h 35m", description: "The legacy of Maximus continues in ancient Rome." }
  ];
  
  memoryBookings = [
    { id: "BK1001", userId: "john@example.com", user: "john@example.com", movie: "The Dark Knight", movieTitle: "The Dark Knight", seats: "A5, A6", date: "2025-05-15", time: "7:00 PM", theater: "IMAX Hall 1", total: 30, status: "Confirmed" },
    { id: "BK1002", userId: "jane@example.com", user: "jane@example.com", movie: "Inception", movieTitle: "Inception", seats: "B2, B3", date: "2025-05-16", time: "4:00 PM", theater: "4K Luxe Hall", total: 30, status: "Confirmed" },
    { id: "BK1003", userId: "mike@example.com", user: "mike@example.com", movie: "Interstellar", movieTitle: "Interstellar", seats: "C1, C2", date: "2025-05-17", time: "10:00 PM", theater: "IMAX Hall 1", total: 30, status: "Confirmed" },
    { id: "BK1004", userId: "sarah@example.com", user: "sarah@example.com", movie: "Oppenheimer", movieTitle: "Oppenheimer", seats: "D4, D5", date: "2025-05-18", time: "2:00 PM", theater: "ScreenX", total: 35, status: "Confirmed" }
  ];
  
  res.json({ 
    message: '✅ Demo data seeded successfully!', 
    moviesCount: memoryMovies.length,
    bookingsCount: memoryBookings.length,
    admin: { email: 'admin@cinema.com', password: 'admin123' },
    user: { email: 'moviefan@example.com', password: 'password123' }
  });
});

// ========== SERVE HTML PAGES ==========

const pageFiles = {
  login: 'login.html',
  home: 'Home.html',
  movie: 'Movie.html',
  trending: 'Trending.html',
  mybooking: 'mybooking.html',
  profile: 'Profile.html',
  setting: 'Settting.html',
  admindashboard: 'AdminDashboard.html'
};

const sendPage = (req, res, fileName) => {
  const filePath = path.join(frontendDir, fileName);
  if (fs.existsSync(filePath)) {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.sendFile(filePath);
  } else {
    res.status(404).send(`<h1>404 - Page Not Found</h1><p>The file ${fileName} does not exist in the Public folder.</p>`);
  }
};

app.get(['/', '/login'], (req, res) => sendPage(req, res, pageFiles.login));
app.get('/home', (req, res) => sendPage(req, res, pageFiles.home));
app.get('/movie', (req, res) => sendPage(req, res, pageFiles.movie));
app.get('/trending', (req, res) => sendPage(req, res, pageFiles.trending));
app.get('/mybooking', (req, res) => sendPage(req, res, pageFiles.mybooking));
app.get('/profile', (req, res) => sendPage(req, res, pageFiles.profile));
app.get('/setting', (req, res) => sendPage(req, res, pageFiles.setting));
app.get('/admindashboard', (req, res) => sendPage(req, res, pageFiles.admindashboard));

// 404 handler
app.use((req, res) => {
  if (!req.path.startsWith('/api/')) {
    res.status(404).send('<h1>404 - Page Not Found</h1>');
  } else {
    res.status(404).json({ error: 'API endpoint not found' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🎬 CINEMA SERVER STARTED SUCCESSFULLY!`);
  console.log(`🚀 Server running at: http://localhost:${PORT}`);
  console.log(`✅ API endpoints available at: http://localhost:${PORT}/api/`);
  console.log(`📀 Database status: ${dbConnected ? 'CONNECTED ✅' : 'NOT CONNECTED ⚠️ (Using memory storage)'}`);
  
  console.log('\n📋 Available pages:');
  console.log(`   🔐 LOGIN PAGE: http://localhost:${PORT}/`);
  console.log(`   🏠 USER HOME: http://localhost:${PORT}/home`);
  console.log(`   👑 ADMIN DASHBOARD: http://localhost:${PORT}/admindashboard`);
  console.log(`   🎬 MOVIE PAGE: http://localhost:${PORT}/movie`);
  console.log(`   👤 PROFILE: http://localhost:${PORT}/profile`);
  console.log(`   📅 MY BOOKINGS: http://localhost:${PORT}/mybooking`);
  
  console.log('\n🔐 LOGIN CREDENTIALS:');
  console.log('   👑 ADMIN ACCESS (goes to AdminDashboard.html):');
  console.log('      Email: admin@cinema.com');
  console.log('      Password: admin123');
  console.log('   👤 USER ACCESS (goes to Home.html):');
  console.log('      Email: moviefan@example.com');
  console.log('      Password: password123');
  console.log('   📝 Or register a new account\n');
  
  console.log('💡 API ENDPOINTS FOR ADMIN:');
  console.log('   GET    /api/movies        - Get all movies');
  console.log('   GET    /api/movies/featured   - Get featured movies (fast)');
  console.log('   GET    /api/movies/trending   - Get trending movies');
  console.log('   POST   /api/movies        - Add new movie');
  console.log('   PUT    /api/movies/:id    - Update movie');
  console.log('   DELETE /api/movies/:id    - Delete movie');
  console.log('   GET    /api/bookings      - Get all bookings');
  console.log('   PUT    /api/bookings/:id  - Update booking');
  console.log('   DELETE /api/bookings/:id  - Delete booking');
  
  console.log('\n🖼️  IMAGE OPTIMIZATION:');
  console.log('   • Using TMDB CDN for fast poster loading');
  console.log('   • Posters are 342px width (optimized size)');
  console.log('   • Browser caching enabled (5-10 minutes)');
  console.log('   • Lazy loading recommended on frontend\n');
  
  if (!dbConnected) {
    console.log('⚠️  MongoDB not connected. Using MEMORY STORAGE.');
    console.log('   💡 To enable permanent storage:');
    console.log('   1️⃣  Install MongoDB from https://www.mongodb.com/try/download/community');
    console.log('   2️⃣  Start MongoDB service');
    console.log('   3️⃣  Or use MongoDB Atlas cloud\n');
  } else {
    console.log('✅ MongoDB is connected! Data will be saved permanently.\n');
  }
});