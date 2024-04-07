const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
// const { MongoClient } = require('mongodb'); // Commented out for now
const winston = require('winston');
require('dotenv').config();

const app = express();
const port = 3000;

// Configure Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Middleware
app.use(express.static(path.join(__dirname, '')));
app.use(bodyParser.urlencoded({ extended: true }));

// Serve index.html as the home page
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: __dirname + '/' });
  logger.info(`[${new Date().toISOString()}] Home page served - IP: ${req.ip}, User-Agent: ${req.headers['user-agent']}`);
});

// Handle user signup
app.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;
  logger.info(`[${new Date().toISOString()}] User signup requested with username: ${username}`);

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    logger.info(`[${new Date().toISOString()}] User registered successfully - Username: ${username}`);

    res.redirect('/');
  } catch (error) {
    logger.error(`[${new Date().toISOString()}] Error registering user:`, error);
    res.status(500).send('Error registering user');
  }
});

// Handle user login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  logger.info(`[${new Date().toISOString()}] User login requested with username: ${username}`);

  try {
    logger.info(`[${new Date().toISOString()}] User logged in successfully - Username: ${username}`);
    res.redirect('/');
  } catch (error) {
    logger.error(`[${new Date().toISOString()}] Error logging in:`, error);
    res.status(500).send('Error logging in');
  }
});

// Error Handling
process.on('unhandledRejection', (reason, promise) => {
  logger.error(`[${new Date().toISOString()}] Unhandled Rejection:`, reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error(`[${new Date().toISOString()}] Uncaught Exception:`, error);
  process.exit(1);
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  logger.info(`[${new Date().toISOString()}] Server is running on http://localhost:${port}`);
});
