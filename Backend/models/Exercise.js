const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Exercise name is required'],
      trim: true,
      maxlength: 100,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['AI', 'non-AI'],
      required: true,
    },
    instructions: {
      type: String,
      required: [true, 'Instructions are required'],
      trim: true,
      maxlength: 3000,
    },
    mediaUrl: {
      type: String,
      default: '',
      trim: true,
    },
    targetMuscle: {
      type: [String],
      default: [],
    },
    reps: {
      type: Number,
      min: 1,
      default: null,
    },
    duration: {
      type: Number,
      min: 1,
      default: null,
    },
    postureTips: {
      type: [String],
      default: [],
    },
    caloriesPerMinute: {
      type: Number,
      min: 0,
      default: 6,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

exerciseSchema.pre('validate', function syncSlug(next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  next();
});

module.exports = mongoose.model('Exercise', exerciseSchema);
