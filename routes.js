import express from 'express';
import { authenticateToken } from './middlewares.js';
import InventoryItem from './models/inventoryItem.js';
import Image from './models/image.js';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Public routes
router.get('/', (req, res) => {
  res.json({ message: 'Home Page, if logged in display some sort of dashboard information, if !logged in then display the login page.' });
});

router.get('/login', (req, res) => {
  res.json({ message: 'Login Page' });
});

router.get('/register', (req, res) => {
  res.json({ message: 'Register Page' });
});

router.get('/logout', (req, res) => {
  res.json({ message: 'Logout Page' });
});

// Protected routes
router.get('/inventory', authenticateToken, async (req, res) => {
  try {
    const inventoryItems = await InventoryItem.find().populate('photos');
    console.log('Fetched inventory items:', inventoryItems);
    res.json(inventoryItems);
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    res.status(500).json({ message: 'Error fetching inventory items' });
  }
});

router.get('/inventory/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const inventoryItem = await InventoryItem.findById(id).populate('photos');
    if (!inventoryItem) {
      console.log('Item not found for id:', id);
      return res.status(404).json({ message: 'Item not found' });
    }
    console.log('Fetched item with images:', inventoryItem);
    res.json(inventoryItem);
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    res.status(500).json({ message: 'Error fetching inventory item' });
  }
});

router.delete('/images/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const image = await Image.findByIdAndDelete(id);
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Define the file path as a string
    const filePath = path.join('uploads', path.basename(image.filePath));
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error('Error deleting file:', err);
        return res.status(500).json({ message: 'Error deleting file' });
      }
      res.status(204).end();
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

router.put('/inventory/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, quantity, price, category, manufacturer, machine, description } = req.body;

    const updatedItem = await InventoryItem.findByIdAndUpdate(id, {
      name,
      quantity,
      price,
      category,
      manufacturer,
      machine,
      description
    }, { new: true });

    if (!updatedItem) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json(updatedItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/inventory', authenticateToken, async (req, res) => {
  try {
    const { name, quantity, price, category, manufacturer, machine, description } = req.body;
    const newItem = new InventoryItem({ name, quantity, price, category, manufacturer, machine, description });
    await newItem.save();
    res.status(201).json(newItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/inventory/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedItem = await InventoryItem.findByIdAndDelete(id);
    if (!deletedItem) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/profile', authenticateToken, (req, res) => {
  res.json({ message: 'Profile Page' });
});

export default router;
