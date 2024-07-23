import express from 'express';
import jwt from 'jsonwebtoken';
import User from './models/user.js';
import bcrypt from 'bcrypt';

const router = express.Router();

// 404 error on register route, probably something to do with req body. first name and last name missing in route

// Register a new user
router.post('/register', async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  console.log(req.body);
  try {
    const user = new User({ firstName, lastName, email, password });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
  
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.json({ token });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

// Logout user
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.sendStatus(200);
  });

export default router;
