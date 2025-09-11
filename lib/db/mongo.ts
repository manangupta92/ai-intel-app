import mongoose from 'mongoose';

// TypeScript declarations for global mongoose cache
declare global {
  var _mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  } | null;
}

// Global cache for mongoose connection
let cached = global._mongoose || { conn: null, promise: null };
if (!global._mongoose) global._mongoose = cached;

// Get MongoDB URI from environment variables
const MONGODB_URI: string = process.env.MONGODB_URI || '';
if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

export async function connectToDatabase() {
  if (cached.conn) {
    console.log('✅ Using cached MongoDB connection');
    return cached.conn;
  }

  if (!cached.promise) {
    const mongooseOpts: mongoose.ConnectOptions = {
      bufferCommands: true,
      maxPoolSize: 10,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
    };

    console.log('🔄 Connecting to MongoDB...');
    console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
    console.log('📍 URI:', MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//[HIDDEN_CREDENTIALS]@'));

    // Clear any existing connection
    if (mongoose.connection.readyState !== 0) {
      console.log('🔄 Closing existing connection...');
      await mongoose.disconnect();
    }

    mongoose.connection.removeAllListeners();

    mongoose.connection.on('connected', () => {
      console.log('✅ MongoDB connected successfully');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
      cached.conn = null;
      cached.promise = null;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('❌ MongoDB disconnected');
      cached.conn = null;
      cached.promise = null;
    });

    cached.promise = mongoose.connect(MONGODB_URI, mongooseOpts).then((mongoose) => {
      console.log('✅ New MongoDB connection established');
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e: any) {
    cached.conn = null;
    cached.promise = null;

    console.error('❌ MongoDB connection error:', {
      name: e.name,
      message: e.message,
      code: e.code,
    });

    if (e.name === 'MongoServerSelectionError') {
      throw new Error('Could not connect to MongoDB. Please check if the database server is running and accessible.');
    } else if (e.name === 'MongooseServerSelectionError') {
      throw new Error('MongoDB authentication failed. Please check your credentials.');
    } else {
      throw new Error(`Failed to connect to MongoDB: ${e.message}`);
    }
  }

  return cached.conn;
}
