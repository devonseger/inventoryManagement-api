import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  filePath: {
    type: String,
    required: true
  }
});

const Image = mongoose.model('Image', imageSchema);

export default Image;
