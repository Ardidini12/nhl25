import mongoose from 'mongoose';
import { DB_URI, NODE_ENV } from '../config/env.js';

if(!DB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.<development/production>.local');
}

const connectToDatabase = async () => {
  try {
    // Connect with database name in options
    await mongoose.connect(DB_URI, {
      dbName: 'XBLADE-APII'
    });

    const dbName = mongoose.connection.name;
    console.log(`Connected to ${dbName} database in ${NODE_ENV} mode`);
    
  } catch (error) {
    console.error('Error connecting to database: ', error);
    process.exit(1);
  }
}

export default connectToDatabase;