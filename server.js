import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import cors from 'cors';
import {
  useBodyParser,
  useMorgan,
  useHelmet,
  useCompression,
  useRateLimit,
  errorHandler,
} from './middlewares.js';
import routes from './routes.js';
import router from './auth.js';
import Option from './models/options.js';
import Image from './models/image.js';
import InventoryItem from './models/inventoryItem.js'; // Ensure this import is here

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.mongodbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(error => console.error('Error connecting to MongoDB:', error.message));

// Set up storage engine for multer
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    const itemId = req.params.itemId; // Use itemId from URL parameters
    console.log('Received itemId:', itemId);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const extension = path.extname(file.originalname);
    cb(null, `${itemId}-${uniqueSuffix}${extension}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10000000 },
  fileFilter: (req, file, cb) => {
    checkFileType(file, cb);
  }
}).array('photos', 10);

function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|gif|webp/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb('Error: Images Only!');
  }
}

// Use CORS middleware for all routes
const allowedOrigins = [
  'http://localhost:5173',
  'http://192.168.0.36:5173',
  'http://165.227.123.35/',
  'https://inventorymanagement-xkjy.onrender.com',
  // Add more origins if necessary
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Use other middlewares
app.use(...useBodyParser);
app.use(useMorgan);
app.use(useHelmet);
app.use(useCompression);
app.use(useRateLimit);

// Serve static files with CORS enabled
app.use('/uploads', express.static('./uploads', {
  setHeaders: (res) => {
    res.set('Access-Control-Allow-Origin', '*');
  }
}));

// Image upload endpoint
app.post('/upload/:itemId', (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error('Error during file upload:', err);
      res.status(400).json({ success: false, message: err });
    } else {
      if (!req.files || req.files.length === 0) {
        console.error('No file selected');
        res.status(400).json({ success: false, message: 'No file selected' });
      } else {
        const itemId = req.params.itemId; // Use itemId from URL parameters
        console.log('Received itemId in /upload:', itemId);
        const fileInfos = req.files.map(file => ({
          itemId: itemId,
          filePath: `/uploads/${file.filename}`
        }));
        try {
          const savedImages = await Image.insertMany(fileInfos);
          console.log('Files uploaded and associated:', savedImages);

          // Update the InventoryItem to include these photos
          const imageIds = savedImages.map(image => image._id);
          await InventoryItem.findByIdAndUpdate(itemId, {
            $push: { photos: { $each: imageIds } }
          });

          res.status(200).json({
            success: true,
            message: 'Files uploaded',
            files: fileInfos
          });
        } catch (error) {
          console.error('Error saving file info to database:', error);
          res.status(500).json({ success: false, message: error.message });
        }
      }
    }
  });
});

// Use routes
app.use('/', routes);
app.use('/login', routes);
app.use('/register', routes);
app.use('/inventory', routes);
app.use('/logout', routes);
app.use('/auth', router);

// API routes for options
app.get('/api/options', async (req, res) => {
  try {
    const options = await Option.find();
    res.json(options);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/options', async (req, res) => {
  const { type, value } = req.body;

  try {
    let option = await Option.findOne({ type });

    if (option) {
      option.values.push(value);
      await option.save();
    } else {
      option = new Option({ type, values: [value] });
      await option.save();
    }

    res.status(201).json(option);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
