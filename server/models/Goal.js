const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  athlete: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Athlete',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  category: {
    type: String,
    required: true,
    enum: ['performance', 'fitness', 'skill', 'team', 'personal', 'academic']
  },
  sport: {
    type: String,
    required: true,
    enum: ['basketball', 'soccer', 'football', 'baseball', 'tennis', 'swimming', 'track', 'volleyball', 'general']
  },
  targetMetric: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    currentValue: {
      type: Number,
      default: 0
    },
    targetValue: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      required: true,
      trim: true
    },
    direction: {
      type: String,
      enum: ['increase', 'decrease', 'maintain'],
      default: 'increase'
    }
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  targetDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'paused', 'cancelled', 'overdue'],
    default: 'active'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  progress: {
    percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    milestones: [{
      title: String,
      targetValue: Number,
      achievedValue: Number,
      achieved: { type: Boolean, default: false },
      achievedDate: Date,
      notes: String
    }],
    updates: [{
      date: { type: Date, default: Date.now },
      value: Number,
      notes: String,
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }]
  },
  // Who created this goal
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Who can modify this goal
  permissions: {
    canEdit: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    canView: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  // Reminder settings
  reminders: {
    enabled: { type: Boolean, default: true },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'biweekly', 'monthly'],
      default: 'weekly'
    },
    lastReminder: Date,
    nextReminder: Date
  },
  // Tags for organization
  tags: [String],
  
  // Completion details
  completedAt: Date,
  completionNotes: String,
  
  // Coach feedback
  coachFeedback: [{
    date: { type: Date, default: Date.now },
    feedback: String,
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    coach: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }]
}, {
  timestamps: true
});

// Indexes for efficient queries
goalSchema.index({ athlete: 1, status: 1, targetDate: 1 });
goalSchema.index({ createdBy: 1, status: 1 });
goalSchema.index({ targetDate: 1 });

// Virtual for days remaining
goalSchema.virtual('daysRemaining').get(function() {
  const now = new Date();
  const target = new Date(this.targetDate);
  const diffTime = target - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
});

// Virtual for is overdue
goalSchema.virtual('isOverdue').get(function() {
  return this.status === 'active' && new Date() > new Date(this.targetDate);
});

// Method to update progress
goalSchema.methods.updateProgress = function(newValue, notes, updatedBy) {
  this.targetMetric.currentValue = newValue;
  
  // Calculate percentage progress
  const { currentValue, targetValue, direction } = this.targetMetric;
  let percentage;
  
  if (direction === 'increase') {
    percentage = Math.min(100, (currentValue / targetValue) * 100);
  } else if (direction === 'decrease') {
    percentage = Math.min(100, ((targetValue - currentValue) / targetValue) * 100);
  } else {
    // For maintain goals, progress is based on how close to target
    const difference = Math.abs(currentValue - targetValue);
    percentage = Math.max(0, 100 - (difference / targetValue) * 100);
  }
  
  this.progress.percentage = Math.round(percentage);
  
  // Add progress update
  this.progress.updates.push({
    date: new Date(),
    value: newValue,
    notes,
    updatedBy
  });
  
  // Check if goal is completed
  if (this.progress.percentage >= 100 && this.status === 'active') {
    this.status = 'completed';
    this.completedAt = new Date();
  }
  
  // Check if overdue
  if (new Date() > new Date(this.targetDate) && this.status === 'active') {
    this.status = 'overdue';
  }
  
  return this.save();
};

// Static method to get goals by athlete with filters
goalSchema.statics.getGoalsByAthlete = function(athleteId, filters = {}) {
  const query = { athlete: athleteId };
  
  if (filters.status) {
    query.status = filters.status;
  }
  
  if (filters.category) {
    query.category = filters.category;
  }
  
  if (filters.sport) {
    query.sport = filters.sport;
  }
  
  return this.find(query)
    .populate('createdBy', 'firstName lastName')
    .populate('permissions.canEdit', 'firstName lastName')
    .sort({ createdAt: -1 });
};

module.exports = mongoose.model('Goal', goalSchema);
