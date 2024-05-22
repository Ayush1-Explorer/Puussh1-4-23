const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const AWS = require('aws-sdk');
const winston = require('winston');
const LokiTransport = require('winston-loki');
const morgan = require('morgan');
const axios = require('axios');

const app = express();
const port = 3000;

// Configure AWS SDK
AWS.config.update({
  region: 'us-east-1', // Specify your AWS region
  accessKeyId: 'your-access-key-id', // Specify your AWS access key ID
  secretAccessKey: 'your-secret-access-key', // Specify your AWS secret access key
});

// Create DynamoDB instance
const dynamoDB = new AWS.DynamoDB();

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

// Handle user signup
app.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;
  logger.info(`User signup requested with username: ${username}`);

  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save the user to DynamoDB
    const params = {
      TableName: 'your-table-name', // Specify your DynamoDB table name
      Item: {
        'username': { S: username },
        'email': { S: email },
        'password': { S: hashedPassword },
      },
    };
    await dynamoDB.putItem(params).promise();

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
  // Implement login functionality using DynamoDB
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
