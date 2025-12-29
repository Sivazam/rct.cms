import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rudra-store';

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  // If MongoDB URI is not set or is localhost, assume we're not using MongoDB
  if (!MONGODB_URI || MONGODB_URI.includes('localhost') && process.env.NODE_ENV !== 'test') {
    console.log('MongoDB not configured or not available - skipping MongoDB connection');
    return null;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    console.error('MongoDB connection failed:', e);
    cached.promise = null;
    // Don't throw the error, just return null so the app can continue
    return null;
  }

  return cached.conn;
}

export default connectDB;