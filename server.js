// ==========================
// Cake Bakery Backend Server
// ==========================
// This Express.js server provides backend APIs for a cake bakery website.
// It handles user authentication, profile management, wishlist, contact form, and order processing.
// MongoDB is used for data storage via Mongoose ODM.

// --------------------------
// Import Dependencies
// --------------------------
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();

// --------------------------
// Middleware Configuration
// --------------------------
// Parses incoming JSON requests, enables CORS, and serves static files from 'public' directory.
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// --------------------------
// MongoDB Connection
// --------------------------
// Connects to MongoDB Atlas using the MONGODB_URI environment variable.
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// --------------------------
// Mongoose Schemas & Models
// --------------------------
// Defines data models for users, contacts, and orders.

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  wishlist: [
    {
      name: String,
      quantity: { type: Number, default: 1 }
    }
  ],
});
const User = mongoose.model('User', userSchema);

const contactSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  message: String,
});
const Contact = mongoose.model('Contact', contactSchema);

const orderSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  items: [
    {
      name: String,
      quantity: { type: Number, default: 1 }
    }
  ],
  status: { type: String, default: 'Pending' },
});
const Order = mongoose.model('Order', orderSchema);

// --------------------------
// Authentication Routes
// --------------------------
// Handles user login and signup functionality.

// User Login: Verifies email and password.
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email, password });
    if (user) return res.send({ success: true, user });
    res.status(401).send({ success: false, message: 'Invalid credentials' });
  } catch (err) {
    res.status(500).send({ success: false, message: 'Server error', error: err.message });
  }
});

// User Signup: Registers a new user if email is not already taken.
app.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.send({ success: false, message: 'User already exists' });

    const newUser = new User({ name, email, password });
    await newUser.save();
    res.send({ success: true, user: newUser });
  } catch (err) {
    res.status(500).send({ success: false, message: 'Server error', error: err.message });
  }
});

// --------------------------
// Profile Routes
// --------------------------
// Serves user profile page and provides user profile data via API.

// Serve Profile HTML Page
app.get('/profile/:userId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

// Get User Profile Data (API)
app.get('/api/profile/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).send({ success: false, message: 'User not found' });
    res.send({ success: true, user });
  } catch (err) {
    res.status(500).send({ success: false, message: 'Server error', error: err.message });
  }
});

// --------------------------
// Wishlist Routes
// --------------------------
// Allows users to add, view, and remove items from their wishlist.

// Add Item to Wishlist
app.post('/wishlist/add', async (req, res) => {
  const { userId, item } = req.body;
  if (!userId || !item || !item.name) {
    return res.status(400).send({ success: false, message: 'Invalid data' });
  }
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).send({ success: false, message: 'User not found' });

    if (!user.wishlist.some(wishlistItem => wishlistItem.name === item.name)) {
      user.wishlist.push(item);
      await user.save();
    }
    res.send({ success: true, message: 'Item added to wishlist', wishlist: user.wishlist });
  } catch (err) {
    res.status(500).send({ success: false, message: 'Server error', error: err.message });
  }
});

// Get Wishlist Items (API)
app.get('/api/wishlist/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).send({ success: false, message: 'User not found' });

    res.send({ success: true, wishlist: user.wishlist });
  } catch (err) {
    res.status(500).send({ success: false, message: 'Server error', error: err.message });
  }
});

// Remove Item from Wishlist
app.post('/wishlist/remove', async (req, res) => {
  const { userId, itemName } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).send({ success: false, message: 'User not found' });

    user.wishlist = user.wishlist.filter(item => item.name !== itemName);
    await user.save();

    res.send({ success: true, message: 'Item removed from wishlist', wishlist: user.wishlist });
  } catch (err) {
    res.status(500).send({ success: false, message: 'Server error', error: err.message });
  }
});

// Update quantity of a wishlist item
app.put('/wishlist/quantity', async (req, res) => {
  const { userId, itemName, quantity } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).send({ success: false, message: 'User not found' });
    const item = user.wishlist.find(i => i.name === itemName);
    if (!item) return res.status(404).send({ success: false, message: 'Item not found in wishlist' });
    item.quantity = quantity;
    await user.save();
    res.send({ success: true, wishlist: user.wishlist });
  } catch (err) {
    res.status(500).send({ success: false, message: 'Server error' });
  }
});

// Serve Wishlist HTML Page
app.get('/wishlist/:userId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'wishlist.html'));
});

// --------------------------
// Contact Form Route
// --------------------------
// Handles contact form submissions and saves messages to the database.

app.post('/contact', async (req, res) => {
  const { name, email, phone, message } = req.body;
  try {
    const newContact = new Contact({ name, email, phone, message });
    await newContact.save();
    res.send({ success: true, message: 'Message sent successfully!' });
  } catch (err) {
    res.status(500).send({ success: false, message: 'Server error', error: err.message });
  }
});

// --------------------------
// Order Routes
// --------------------------
// Allows users to place orders and view their order history.

// Place a New Order
app.post('/order', async (req, res) => {
  const { userId, items } = req.body;
  if (!userId || !items || items.length === 0) {
    return res.status(400).send({ success: false, message: 'Invalid data' });
  }
  try {
    const newOrder = new Order({ userId, items });
    await newOrder.save();
    res.send({ success: true, message: 'Order placed successfully!' });
  } catch (err) {
    res.status(500).send({ success: false, message: 'Server error', error: err.message });
  }
});

// Get All Orders for a User (API)
app.get('/api/orders/:userId', async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId });
    res.send({ success: true, orders });
  } catch (err) {
    res.status(500).send({ success: false, message: 'Server error', error: err.message });
  }
});

// --------------------------
// Delete Order by ID (for Remove button in orders.html)
// --------------------------
app.delete('/api/orders/:orderId', async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.orderId);
    res.send({ success: true });
  } catch (err) {
    res.status(500).send({ success: false, message: 'Server error' });
  }
});

// --------------------------
// Update quantity of an item in an order
// --------------------------
app.put('/api/orders/:orderId/item', async (req, res) => {
  const { itemName, quantity } = req.body;
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).send({ success: false, message: 'Order not found' });

    const item = order.items.find(i => i.name === itemName);
    if (!item) return res.status(404).send({ success: false, message: 'Item not found in order' });

    item.quantity = quantity;
    await order.save();
    res.send({ success: true, order });
  } catch (err) {
    res.status(500).send({ success: false, message: 'Server error' });
  }
});

// Serve Orders HTML Page
app.get('/orders/:userId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'orders.html'));
});

// --------------------------
// Start the Server
// --------------------------
// The server listens on port 3000 and logs a message when running.

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});