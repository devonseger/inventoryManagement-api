import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema({
  type: String,
  values: [String],
});

const Option = mongoose.model('Option', optionSchema);

export default Option;
