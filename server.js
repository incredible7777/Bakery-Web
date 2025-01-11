const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/cakebakery', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Schemas and Models
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    wishlist: { type: Array, default: [] },
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
    items: Array,
    status: { type: String, default: 'Pending' },
});
const Order = mongoose.model('Order', orderSchema);

// Routes
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

app.get('/profile/:userId', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

app.get('/api/profile/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).send({ success: false, message: 'User not found' });

        res.send({ success: true, user });
    } catch (err) {
        res.status(500).send({ success: false, message: 'Server error', error: err.message });
    }
});

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

app.get('/api/wishlist/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).send({ success: false, message: 'User not found' });

        res.send({ success: true, wishlist: user.wishlist });
    } catch (err) {
        res.status(500).send({ success: false, message: 'Server error', error: err.message });
    }
});

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

app.get('/wishlist/:userId', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'wishlist.html'));
});

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

app.get('/api/orders/:userId', async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.params.userId });
        res.send({ success: true, orders });
    } catch (err) {
        res.status(500).send({ success: false, message: 'Server error', error: err.message });
    }
});

app.get('/orders/:userId', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'orders.html'));
});

// Server Setup
app.listen(3000, () => console.log('Server running on http://localhost:3000'));
