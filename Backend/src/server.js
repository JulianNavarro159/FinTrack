const express = require('express');
const cors = require('cors');
const {
  router,
  auth_router
} = require('./router/index');

const server = express();

server.use(express.json());
server.use(cors());
server.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // update to match the domain you will make the request from
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  next();
});

server.get(['/', '/health', '/ping'], (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'fintrack-backend',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

server.use(router);
server.use(auth_router);

module.exports = server;