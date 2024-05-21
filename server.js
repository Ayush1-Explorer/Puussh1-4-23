const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const { MongoClient } = require('mongodb');
const winston = require('winston');
const LokiTransport = require('winston-loki');
const morgan = require('morgan');
const axios = require('axios');

const app = express();
const port = 3000;

// MongoDB Connection URL
const mongoURI = 'mongodb://localhost:27017';
const client = new MongoClient(mongoURI);

// Configure Winston logger with Loki transport
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console(),
    new LokiTransport({
      host: 'http://172.25.7.155:3100', // URL of your Loki server
      labels: { job: 'express-app' },
      json: true,
      interval: 1, // send logs every 1 second
    }),
  ],
});

// Middleware to log all requests
app.use(morgan('combined', {
  stream: {
    write: (message) => {
      logger.info(message.trim());
    },
  },
}));

// Middleware
app.use(express.static(path.join(__dirname, '')));
app.use(bodyParser.urlencoded({ extended: true }));

// Serve index.html as the home page
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: __dirname + '/' });
  logger.info('Home page served');
});

// Connect to MongoDB
async function connectToDB() {
  try {
    await client.connect();
    logger.info('Connected to MongoDB');
  } catch (err) {
    logger.error('Error connecting to MongoDB:', err);
  }
}
connectToDB();

// Handle user signup
app.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;
  logger.info(`User signup requested with username: ${username}`);

  try {
    const db = client.db('my-mongodb-database');

    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ username });
    if (existingUser) {
      logger.warn('User already exists');
      return res.status(400).send('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save the user to MongoDB
    await db.collection('users').insertOne({ username, email, password: hashedPassword });
    logger.info('User registered successfully');

    // Redirect to the home page
    res.redirect('/');
  } catch (error) {
    logger.error('Error registering user:', error);
    res.status(500).send('Error registering user');
  }
});

// Handle user login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  logger.info(`User login requested with username: ${username}`);

  try {
    const db = client.db('my-mongodb-database');

    // Find the user by username
    const user = await db.collection('users').findOne({ username });
    if (!user) {
      logger.warn('User not found');
      return res.status(404).send('User not found');
    }

    // Compare passwords
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      logger.warn('Invalid password');
      return res.status(401).send('Invalid password');
    }

    logger.info('User logged in successfully');
    res.redirect('/');
  } catch (error) {
    logger.error('Error logging in:', error);
    res.status(500).send('Error logging in');
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  res.status(err.status || 500).send('Server Error');
});

// Fetch public IP and start the server
axios.get('https://api.ipify.org?format=json')
  .then(response => {
    const publicIp = response.data.ip;
    app.listen(port, () => {
      console.log(`Server is running on http://${publicIp}:${port}`);
      logger.info(`Server is running on http://${publicIp}:${port}`);
    });
  })
  .catch(error => {
    console.error('Error fetching public IP:', error);
    logger.error('Error fetching public IP:', error);
  });
