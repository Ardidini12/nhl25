import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import User from '../models/user.model.js';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../config/env.js'

export const signUp = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { name, email, password, gamerTag } = req.body;

    // Check if a user already exists with email or gamerTag
    const existingUser = await User.findOne({
      $or: [{ email }, { gamerTag }]
    });

    if(existingUser) {
      const error = new Error('User with this email or gamerTag already exists');
      error.statusCode = 409;
      throw error;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUsers = await User.create([{ 
      name, 
      email, 
      password: hashedPassword, 
      gamerTag 
    }], { session });

    const token = jwt.sign({ userId: newUsers[0]._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        token,
        user: {
          _id: newUsers[0]._id,
          name: newUsers[0].name,
          email: newUsers[0].email,
          gamerTag: newUsers[0].gamerTag,
          role: newUsers[0].role
        },
      }
    })
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
}

export const signIn = async (req, res, next) => {
  try {
    const { emailOrGamerTag, password } = req.body;
    
    // Find user by either email or gamerTag
    const user = await User.findOne({
      $or: [
        { email: emailOrGamerTag },
        { gamerTag: emailOrGamerTag }
      ]
    });

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      const error = new Error('Invalid password');
      error.statusCode = 401;
      throw error;
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.status(200).json({
      success: true,
      message: 'User signed in successfully',
      data: {
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          gamerTag: user.gamerTag,
          role: user.role
        },
      }
    });
  } catch (error) {
    next(error);
  }
}

export const getMe = async (req, res, next) => {
  try {
    const userId = req.userId; // This comes from the auth middleware
    
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
}

export const signOut = async (req, res, next) => {
  try {
    // In a stateless JWT system, we just return success
    // The client should remove the token
    res.status(200).json({
      success: true,
      message: 'User signed out successfully'
    });
  } catch (error) {
    next(error);
  }
}