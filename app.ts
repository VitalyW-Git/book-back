import express, { Express } from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import itemsRouter from './routes/items';
import corsMiddleware from './middleware/cors';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';

const app: Express = express();

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

export default app;

