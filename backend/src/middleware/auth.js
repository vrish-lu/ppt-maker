import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { supabase, supabaseAnon } from '../config/supabase.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // Always require token
    if (!token) {
      return res.status(401).json({ 
        error: 'Access token required',
        message: 'Please log in to access this resource'
      });
    }

    // If we have a token, try to verify it
    if (token) {
      // First try to verify as Supabase token
      try {
        const { data: { user }, error } = await supabaseAnon.auth.getUser(token);
        
        if (error || !user) {
          throw new Error('Invalid Supabase token');
        }

        // Get user profile from database
        const userProfile = await User.findById(user.id);
        if (!userProfile) {
          return res.status(401).json({ 
            error: 'Invalid token',
            message: 'User not found'
          });
        }

        // Add user to request object
        req.user = userProfile;
        next();
        return;
      } catch (supabaseError) {
        // If Supabase token fails, try custom JWT token
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          
          // Get user from database
          const user = await User.findById(decoded.userId);
          if (!user) {
            return res.status(401).json({ 
              error: 'Invalid token',
              message: 'User not found'
            });
          }

          // Add user to request object
          req.user = user;
          next();
          return;
        } catch (jwtError) {
          throw new Error('Invalid token');
        }
      }
    }
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error.message === 'Invalid token') {
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'Token is invalid or expired'
      });
    }

    return res.status(500).json({ 
      error: 'Authentication failed',
      message: 'Internal server error'
    });
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (user) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
}; 