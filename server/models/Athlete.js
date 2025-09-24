const mongoose = require('mongoose');

const athleteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  sport: {
    type: String,
    required: true,
    enum: ['basketball', 'soccer', 'football', 'baseball', 'tennis', 'swimming', 'track', 'volleyball', 'other']
  },
  position: {
    type: String,
    trim: true
  },
  age: {
    type: Number,
    min: 8,
    max: 100
  },
  height: {
    feet: Number,
    inches: Number
  },
  weight: {
    type: Number,
    min: 0
  },
  team: {
    name: String,
    level: {
      type: String,
      enum: ['recreational', 'competitive', 'elite', 'professional']
    },
    season: String
  },
  coach: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  parents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Sport-specific stats structure
  sportStats: {
    basketball: {
      gamesPlayed: { type: Number, default: 0 },
      pointsPerGame: { type: Number, default: 0 },
      fieldGoalPercentage: { type: Number, default: 0 },
      threePointPercentage: { type: Number, default: 0 },
      freeThrowPercentage: { type: Number, default: 0 },
      reboundsPerGame: { type: Number, default: 0 },
      assistsPerGame: { type: Number, default: 0 },
      stealsPerGame: { type: Number, default: 0 },
      blocksPerGame: { type: Number, default: 0 },
      turnoversPerGame: { type: Number, default: 0 }
    },
    soccer: {
      gamesPlayed: { type: Number, default: 0 },
      goals: { type: Number, default: 0 },
      assists: { type: Number, default: 0 },
      shots: { type: Number, default: 0 },
      shotsOnGoal: { type: Number, default: 0 },
      passes: { type: Number, default: 0 },
      passAccuracy: { type: Number, default: 0 },
      tackles: { type: Number, default: 0 },
      interceptions: { type: Number, default: 0 }
    },
    football: {
      gamesPlayed: { type: Number, default: 0 },
      passingYards: { type: Number, default: 0 },
      rushingYards: { type: Number, default: 0 },
      receivingYards: { type: Number, default: 0 },
      touchdowns: { type: Number, default: 0 },
      interceptions: { type: Number, default: 0 },
      tackles: { type: Number, default: 0 },
      sacks: { type: Number, default: 0 }
    }
  },
  // Fitness metrics
  fitnessMetrics: {
    sprintTime: Number, // 40-yard dash or similar
    verticalJump: Number,
    benchPress: Number,
    squat: Number,
    deadlift: Number,
    mileTime: Number,
    maxHeartRate: Number,
    restingHeartRate: Number
  },
  // Personal records
  personalRecords: [{
    exercise: String,
    value: Number,
    unit: String,
    date: Date,
    notes: String
  }],
  // Preferences
  preferences: {
    metricUnits: { type: Boolean, default: false },
    notifications: {
      goalReminders: { type: Boolean, default: true },
      progressUpdates: { type: Boolean, default: true },
      weeklyReports: { type: Boolean, default: true }
    }
  },
  // Subscription info
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'premium', 'coach'],
      default: 'free'
    },
    startDate: Date,
    endDate: Date,
    isActive: { type: Boolean, default: true }
  }
}, {
  timestamps: true
});

// Index for efficient queries
athleteSchema.index({ user: 1, sport: 1 });
athleteSchema.index({ coach: 1 });

// Virtual for full name
athleteSchema.virtual('fullName').get(function() {
  return `${this.user.firstName} ${this.user.lastName}`;
});

module.exports = mongoose.model('Athlete', athleteSchema);
