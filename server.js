const express = require('express');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const exchangeRoutes = require('./routes/exchange');
const postRoutes = require('./routes/post');
const chatRoutes = require('./routes/chat');
const groupRoutes = require('./routes/group')
const cors = require('cors');
const morgan = require('morgan')
require('dotenv').config();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'))

// Serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/exchange', exchangeRoutes);
app.use('/posts', postRoutes);
app.use('/chat',chatRoutes);
app.use('/groups',groupRoutes);

app.use('/group-chat', require('./routes/groupChat'));


// Static HTML routing 
app.use((req, res) => {
    const url = req.url;
    res.header('Content-Security-Policy', "img-src 'self'");
    res.sendFile(path.join(__dirname, 'views', `${url}.html`));
});




app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
