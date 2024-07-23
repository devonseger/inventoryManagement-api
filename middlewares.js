import cors from 'cors';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';

export const useCors = cors();

// Body parsing middleware
export const useBodyParser = [
  bodyParser.json(),
  bodyParser.urlencoded({ extended: true }),
];

// Logging middleware
export const useMorgan = morgan('combined');

// Security middleware
export const useHelmet = helmet();

// Compression middleware
export const useCompression = compression();

// Rate limiting middleware
export const useRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

// Authentication middleware
export const authenticateToken = (req, res, next) => {
  console.log(`Request to: ${req.originalUrl} from ${req.ip} with method ${req.method}`);
  const authHeader = req.headers['authorization'];
  console.log('Authorization Header:', authHeader); // Log the Authorization header for debugging

  const token = authHeader && authHeader.split(' ')[1];
  console.log('Token:', token); // Log the token for debugging

  if (!token) {
    return res.status(401).json({ message: 'Access token is missing or invalid' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Error handling middleware
export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ error: 'Something went wrong!' });
};
