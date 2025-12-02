const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');

const itemsRouter = require('./routes/items');
const corsMiddleware = require('./middleware/cors');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// CORS middleware
app.use(corsMiddleware);

// Routes
app.use('/api/items', itemsRouter);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
