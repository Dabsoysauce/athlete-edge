const mongoose = require('mongoose');

const statSchema = new mongoose.Schema({
  athlete: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Athlete',
    required: true
  },
  gameDate: {
    type: Date,
    required: true
  },
  sport: {
    type: String,
    required: true,
    enum: ['basketball', 'soccer', 'football', 'baseball', 'tennis', 'swimming', 'track', 'volleyball']
  },
  gameType: {
    type: String,
    enum: ['game', 'practice', 'scrimmage', 'tournament'],
    default: 'game'
  },
  opponent: {
    type: String,
    trim: true
  },
  teamScore: Number,
  opponentScore: Number,
  minutesPlayed: Number,
  
  // Basketball stats
  basketball: {
    points: { type: Number, default: 0 },
    fieldGoalsMade: { type: Number, default: 0 },
    fieldGoalsAttempted: { type: Number, default: 0 },
    threePointersMade: { type: Number, default: 0 },
    threePointersAttempted: { type: Number, default: 0 },
    freeThrowsMade: { type: Number, default: 0 },
    freeThrowsAttempted: { type: Number, default: 0 },
    rebounds: { type: Number, default: 0 },
    offensiveRebounds: { type: Number, default: 0 },
    defensiveRebounds: { type: Number, default: 0 },
    assists: { type: Number, default: 0 },
    steals: { type: Number, default: 0 },
    blocks: { type: Number, default: 0 },
    turnovers: { type: Number, default: 0 },
    personalFouls: { type: Number, default: 0 }
  },
  
  // Soccer stats
  soccer: {
    goals: { type: Number, default: 0 },
    assists: { type: Number, default: 0 },
    shots: { type: Number, default: 0 },
    shotsOnGoal: { type: Number, default: 0 },
    passes: { type: Number, default: 0 },
    passesCompleted: { type: Number, default: 0 },
    tackles: { type: Number, default: 0 },
    interceptions: { type: Number, default: 0 },
    fouls: { type: Number, default: 0 },
    yellowCards: { type: Number, default: 0 },
    redCards: { type: Number, default: 0 }
  },
  
  // Football stats
  football: {
    passingYards: { type: Number, default: 0 },
    passingAttempts: { type: Number, default: 0 },
    passingCompletions: { type: Number, default: 0 },
    passingTouchdowns: { type: Number, default: 0 },
    interceptions: { type: Number, default: 0 },
    rushingYards: { type: Number, default: 0 },
    rushingAttempts: { type: Number, default: 0 },
    rushingTouchdowns: { type: Number, default: 0 },
    receivingYards: { type: Number, default: 0 },
    receptions: { type: Number, default: 0 },
    receivingTouchdowns: { type: Number, default: 0 },
    tackles: { type: Number, default: 0 },
    sacks: { type: Number, default: 0 },
    forcedFumbles: { type: Number, default: 0 }
  },
  
  // Fitness/Performance stats
  performance: {
    sprintTime: Number,
    verticalJump: Number,
    agilityTime: Number,
    enduranceScore: Number,
    strengthScore: Number,
    flexibilityScore: Number
  },
  
  // Additional notes and context
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  
  // Weather conditions (for outdoor sports)
  weather: {
    temperature: Number,
    conditions: String,
    windSpeed: Number
  },
  
  // Verification (for competitive integrity)
  verified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: Date
}, {
  timestamps: true
});

// Indexes for efficient queries
statSchema.index({ athlete: 1, gameDate: -1 });
statSchema.index({ sport: 1, gameDate: -1 });
statSchema.index({ gameDate: -1 });

// Virtual for calculated percentages
statSchema.virtual('basketball.fieldGoalPercentage').get(function() {
  if (this.basketball.fieldGoalsAttempted > 0) {
    return (this.basketball.fieldGoalsMade / this.basketball.fieldGoalsAttempted) * 100;
  }
  return 0;
});

statSchema.virtual('basketball.threePointPercentage').get(function() {
  if (this.basketball.threePointersAttempted > 0) {
    return (this.basketball.threePointersMade / this.basketball.threePointersAttempted) * 100;
  }
  return 0;
});

statSchema.virtual('basketball.freeThrowPercentage').get(function() {
  if (this.basketball.freeThrowsAttempted > 0) {
    return (this.basketball.freeThrowsMade / this.basketball.freeThrowsAttempted) * 100;
  }
  return 0;
});

statSchema.virtual('soccer.passAccuracy').get(function() {
  if (this.soccer.passes > 0) {
    return (this.soccer.passesCompleted / this.soccer.passes) * 100;
  }
  return 0;
});

statSchema.virtual('football.passCompletionPercentage').get(function() {
  if (this.football.passingAttempts > 0) {
    return (this.football.passingCompletions / this.football.passingAttempts) * 100;
  }
  return 0;
});

// Ensure virtual fields are serialized
statSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Stat', statSchema);
