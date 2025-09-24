const express = require('express');
const { body, validationResult } = require('express-validator');
const Stat = require('../models/Stat');
const Athlete = require('../models/Athlete');
const { auth, requireAthlete, requireRole } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/stats
// @desc    Add new stat entry
// @access  Private
router.post('/', [
  auth,
  body('gameDate').isISO8601(),
  body('sport').isIn(['basketball', 'soccer', 'football', 'baseball', 'tennis', 'swimming', 'track', 'volleyball']),
  body('gameType').optional().isIn(['game', 'practice', 'scrimmage', 'tournament']),
  body('opponent').optional().trim(),
  body('minutesPlayed').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Get athlete profile
    let athlete;
    if (req.user.role === 'athlete') {
      athlete = await Athlete.findOne({ user: req.user.id });
      if (!athlete) {
        return res.status(404).json({ message: 'Athlete profile not found' });
      }
    } else if (req.user.role === 'coach' || req.user.role === 'admin') {
      // Coach/admin can add stats for their athletes
      if (!req.body.athleteId) {
        return res.status(400).json({ message: 'Athlete ID required for coaches/admins' });
      }
      athlete = await Athlete.findById(req.body.athleteId);
      if (!athlete) {
        return res.status(404).json({ message: 'Athlete not found' });
      }
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }

    const statData = {
      athlete: athlete._id,
      gameDate: req.body.gameDate,
      sport: req.body.sport,
      gameType: req.body.gameType || 'game',
      opponent: req.body.opponent,
      teamScore: req.body.teamScore,
      opponentScore: req.body.opponentScore,
      minutesPlayed: req.body.minutesPlayed,
      notes: req.body.notes,
      verified: req.user.role === 'coach' || req.user.role === 'admin',
      verifiedBy: req.user.role === 'coach' || req.user.role === 'admin' ? req.user.id : undefined,
      verifiedAt: req.user.role === 'coach' || req.user.role === 'admin' ? new Date() : undefined
    };

    // Add sport-specific stats
    if (req.body.basketball) {
      statData.basketball = req.body.basketball;
    }
    if (req.body.soccer) {
      statData.soccer = req.body.soccer;
    }
    if (req.body.football) {
      statData.football = req.body.football;
    }
    if (req.body.performance) {
      statData.performance = req.body.performance;
    }

    const stat = new Stat(statData);
    await stat.save();

    // Populate the response
    const populatedStat = await Stat.findById(stat._id)
      .populate('athlete', 'sport position')
      .populate('athlete.user', 'firstName lastName');

    res.status(201).json({ stat: populatedStat });
  } catch (error) {
    console.error('Add stat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/stats
// @desc    Get stats for athlete
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { 
      athleteId, 
      sport, 
      startDate, 
      endDate, 
      gameType, 
      page = 1, 
      limit = 20 
    } = req.query;

    let query = {};

    // Determine athlete ID
    let targetAthleteId;
    if (req.user.role === 'athlete') {
      const athlete = await Athlete.findOne({ user: req.user.id });
      if (!athlete) {
        return res.status(404).json({ message: 'Athlete profile not found' });
      }
      targetAthleteId = athlete._id;
    } else if (req.user.role === 'coach' || req.user.role === 'admin') {
      if (!athleteId) {
        return res.status(400).json({ message: 'Athlete ID required' });
      }
      targetAthleteId = athleteId;
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }

    query.athlete = targetAthleteId;

    // Apply filters
    if (sport) query.sport = sport;
    if (gameType) query.gameType = gameType;
    
    if (startDate || endDate) {
      query.gameDate = {};
      if (startDate) query.gameDate.$gte = new Date(startDate);
      if (endDate) query.gameDate.$lte = new Date(endDate);
    }

    const stats = await Stat.find(query)
      .populate('athlete', 'sport position')
      .populate('athlete.user', 'firstName lastName')
      .populate('verifiedBy', 'firstName lastName')
      .sort({ gameDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Stat.countDocuments(query);

    res.json({
      stats,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/stats/:id
// @desc    Get single stat entry
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const stat = await Stat.findById(req.params.id)
      .populate('athlete', 'sport position')
      .populate('athlete.user', 'firstName lastName')
      .populate('verifiedBy', 'firstName lastName');

    if (!stat) {
      return res.status(404).json({ message: 'Stat not found' });
    }

    // Check permissions
    const canView = 
      req.user.role === 'admin' ||
      stat.athlete.user._id.toString() === req.user.id ||
      stat.athlete.coach && stat.athlete.coach.toString() === req.user.id;

    if (!canView) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ stat });
  } catch (error) {
    console.error('Get stat by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/stats/:id
// @desc    Update stat entry
// @access  Private
router.put('/:id', [
  auth,
  body('gameDate').optional().isISO8601(),
  body('sport').optional().isIn(['basketball', 'soccer', 'football', 'baseball', 'tennis', 'swimming', 'track', 'volleyball'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const stat = await Stat.findById(req.params.id)
      .populate('athlete', 'user coach');

    if (!stat) {
      return res.status(404).json({ message: 'Stat not found' });
    }

    // Check permissions
    const canEdit = 
      req.user.role === 'admin' ||
      stat.athlete.user._id.toString() === req.user.id ||
      stat.athlete.coach && stat.athlete.coach.toString() === req.user.id;

    if (!canEdit) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update allowed fields
    const allowedUpdates = [
      'gameDate', 'sport', 'gameType', 'opponent', 'teamScore', 'opponentScore',
      'minutesPlayed', 'basketball', 'soccer', 'football', 'performance', 'notes'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        stat[field] = req.body[field];
      }
    });

    await stat.save();

    const updatedStat = await Stat.findById(stat._id)
      .populate('athlete', 'sport position')
      .populate('athlete.user', 'firstName lastName')
      .populate('verifiedBy', 'firstName lastName');

    res.json({ stat: updatedStat });
  } catch (error) {
    console.error('Update stat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/stats/:id
// @desc    Delete stat entry
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const stat = await Stat.findById(req.params.id)
      .populate('athlete', 'user coach');

    if (!stat) {
      return res.status(404).json({ message: 'Stat not found' });
    }

    // Check permissions
    const canDelete = 
      req.user.role === 'admin' ||
      stat.athlete.user._id.toString() === req.user.id ||
      stat.athlete.coach && stat.athlete.coach.toString() === req.user.id;

    if (!canDelete) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Stat.findByIdAndDelete(req.params.id);

    res.json({ message: 'Stat deleted successfully' });
  } catch (error) {
    console.error('Delete stat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/stats/analytics/performance
// @desc    Get performance analytics
// @access  Private
router.get('/analytics/performance', auth, async (req, res) => {
  try {
    const { 
      athleteId, 
      sport, 
      startDate, 
      endDate, 
      metric 
    } = req.query;

    let targetAthleteId;
    if (req.user.role === 'athlete') {
      const athlete = await Athlete.findOne({ user: req.user.id });
      if (!athlete) {
        return res.status(404).json({ message: 'Athlete profile not found' });
      }
      targetAthleteId = athlete._id;
    } else if (req.user.role === 'coach' || req.user.role === 'admin') {
      if (!athleteId) {
        return res.status(400).json({ message: 'Athlete ID required' });
      }
      targetAthleteId = athleteId;
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }

    let query = { athlete: targetAthleteId };
    
    if (sport) query.sport = sport;
    if (startDate || endDate) {
      query.gameDate = {};
      if (startDate) query.gameDate.$gte = new Date(startDate);
      if (endDate) query.gameDate.$lte = new Date(endDate);
    }

    const stats = await Stat.find(query).sort({ gameDate: 1 });

    // Calculate analytics based on sport and metric
    let analytics = {};
    
    if (sport === 'basketball') {
      analytics = {
        totalGames: stats.length,
        averagePoints: stats.reduce((sum, stat) => sum + (stat.basketball.points || 0), 0) / stats.length || 0,
        averageRebounds: stats.reduce((sum, stat) => sum + (stat.basketball.rebounds || 0), 0) / stats.length || 0,
        averageAssists: stats.reduce((sum, stat) => sum + (stat.basketball.assists || 0), 0) / stats.length || 0,
        averageFieldGoalPercentage: stats.reduce((sum, stat) => sum + stat.basketball.fieldGoalPercentage, 0) / stats.length || 0,
        averageThreePointPercentage: stats.reduce((sum, stat) => sum + stat.basketball.threePointPercentage, 0) / stats.length || 0,
        averageFreeThrowPercentage: stats.reduce((sum, stat) => sum + stat.basketball.freeThrowPercentage, 0) / stats.length || 0,
        bestGame: stats.reduce((best, stat) => 
          stat.basketball.points > best.points ? stat : best, 
          { basketball: { points: 0 } }
        )
      };
    } else if (sport === 'soccer') {
      analytics = {
        totalGames: stats.length,
        totalGoals: stats.reduce((sum, stat) => sum + (stat.soccer.goals || 0), 0),
        totalAssists: stats.reduce((sum, stat) => sum + (stat.soccer.assists || 0), 0),
        averagePassAccuracy: stats.reduce((sum, stat) => sum + stat.soccer.passAccuracy, 0) / stats.length || 0,
        averageShots: stats.reduce((sum, stat) => sum + (stat.soccer.shots || 0), 0) / stats.length || 0
      };
    }

    // Add trend data for charts
    analytics.trendData = stats.map(stat => ({
      date: stat.gameDate,
      points: stat.basketball?.points || 0,
      rebounds: stat.basketball?.rebounds || 0,
      assists: stat.basketball?.assists || 0,
      goals: stat.soccer?.goals || 0,
      passAccuracy: stat.soccer?.passAccuracy || 0
    }));

    res.json({ analytics });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
