require('dotenv').config();
import express from 'express';
import connectDB from './db/connect';
const authRouter = require('./route/auth');
import mongoose from 'mongoose';
// import authRouter from './routes/auth';
import notFound from './middleware/not-found';

const app = express();
app.use(express.json());


app.use('/api/v1/auth', authRouter);

app.use(notFound);
const PORT = process.env.PORT || 5000;

const start = async () => {
    try {
        await connectDB(process.env.MONGO_URI as string);
        console.log('Connected to MongoDB');
        app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
}

start();