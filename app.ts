import express, { Express } from "express";
import itemsRouter from "./routes/items";
import corsMiddleware from "./middleware/cors";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler";

const app: Express = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(corsMiddleware);

app.use("/api/items", itemsRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
