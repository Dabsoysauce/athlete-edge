const express = require('express');
const { body, validationResult } = require('express-validator');
const Athlete = require('../models/Athlete');
const User = require('../models/User');
const { auth, requireAthlete, requireRole } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/athletes/profile
// @desc    Get current athlete's profile
// @access  Private (Athletes only)
router.get('/profile', auth, requireAthlete, async (req, res) => {
  try {
    const athlete = await Athlete.findOne({ user: req.user.id })
      .populate('user', 'firstName lastName email phone profileImage')
      .populate('coach', 'firstName lastName email')
      .populate('parents', 'firstName lastName email');

    res.json({ athlete });
  } catch (error) {
    console.error('Get athlete profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/athletes/profile
// @desc    Update athlete profile
// @access  Private (Athletes only)
router.put('/profile', [
  auth,
  requireAthlete,
  body('sport').optional().isIn(['basketball', 'soccer', 'football', 'baseball', 'tennis', 'swimming', 'track', 'volleyball', 'other']),
  body('position').optional().trim(),
  body('age').optional().isInt({ min: 8, max: 100 }),
  body('height.feet').optional().isInt({ min: 3, max: 8 }),
  body('height.inches').optional().isInt({ min: 0, max: 11 }),
  body('weight').optional().isFloat({ min: 0 }),
  body('team.name').optional().trim(),
  body('team.level').optional().isIn(['recreational', 'competitive', 'elite', 'professional']),
  body('team.season').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const athlete = await Athlete.findOne({ user: req.user.id });
    if (!athlete) {
      return res.status(404).json({ message: 'Athlete profile not found' });
    }

    const allowedUpdates = [
      'sport', 'position', 'age', 'height', 'weight', 'team', 'fitnessMetrics',
      'personalRecords', 'preferences'
    ];

    // Update allowed fields
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        athlete[field] = req.body[field];
      }
    });

    await athlete.save();

    const updatedAthlete = await Athlete.findOne({ user: req.user.id })
      .populate('user', 'firstName lastName email phone profileImage')
      .populate('coach', 'firstName lastName email')
      .populate('parents', 'firstName lastName email');

    res.json({ athlete: updatedAthlete });
  } catch (error) {
    console.error('Update athlete profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/athletes
// @desc    Get athletes (for coaches/admins)
// @access  Private (Coaches/Admins only)
router.get('/', auth, requireRole('coach', 'admin'), async (req, res) => {
  try {
    const { sport, team, page = 1, limit = 20 } = req.query;
    const query = {};

    // Filter by sport
    if (sport) {
      query.sport = sport;
    }

    // Filter by team (if coach is filtering their team)
    if (team) {
      query['team.name'] = new RegExp(team, 'i');
    }

    // If user is a coach, only show their athletes
    if (req.user.role === 'coach') {
      query.coach = req.user._id;
    }

    const athletes = await Athlete.find(query)
      .populate('user', 'firstName lastName email phone profileImage')
      .populate('coach', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Athlete.countDocuments(query);

    res.json({
      athletes,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get athletes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/athletes/:id
// @desc    Get athlete by ID
// @access  Private (Athlete themselves, their coach, or admin)
router.get('/:id', auth, async (req, res) => {
  try {
    const athlete = await Athlete.findById(req.params.id)
      .populate('user', 'firstName lastName email phone profileImage')
      .populate('coach', 'firstName lastName email')
      .populate('parents', 'firstName lastName email');

    if (!athlete) {
      return res.status(404).json({ message: 'Athlete not found' });
    }

    // Check permissions
    const canView = 
      req.user.role === 'admin' ||
      athlete.user._id.toString() === req.user.id ||
      athlete.coach && athlete.coach._id.toString() === req.user.id ||
      athlete.parents.some(parent => parent._id.toString() === req.user.id);

    if (!canView) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ athlete });
  } catch (error) {
    console.error('Get athlete by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/athletes/:id/assign-coach
// @desc    Assign coach to athlete
// @access  Private (Admin only)
router.put('/:id/assign-coach', [
  auth,
  requireRole('admin'),
  body('coachId').isMongoId()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { coachId } = req.body;
    const coach = await User.findById(coachId);
    
    if (!coach || coach.role !== 'coach') {
      return res.status(400).json({ message: 'Invalid coach' });
    }

    const athlete = await Athlete.findByIdAndUpdate(
      req.params.id,
      { coach: coachId },
      { new: true }
    ).populate('user', 'firstName lastName email')
     .populate('coach', 'firstName lastName email');

    if (!athlete) {
      return res.status(404).json({ message: 'Athlete not found' });
    }

    res.json({ athlete });
  } catch (error) {
    console.error('Assign coach error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/athletes/stats/summary
// @desc    Get athlete stats summary
// @access  Private (Athletes only)
router.get('/stats/summary', auth, requireAthlete, async (req, res) => {
  try {
    const Stat = require('../models/Stat');
    const Goal = require('../models/Goal');

    // Get recent stats (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentStats = await Stat.find({
      athlete: req.athlete._id,
      gameDate: { $gte: thirtyDaysAgo }
    }).sort({ gameDate: -1 });

    // Get active goals
    const activeGoals = await Goal.find({
      athlete: req.athlete._id,
      status: 'active'
    });

    // Calculate averages based on sport
    let averages = {};
    if (recentStats.length > 0) {
      const sport = req.athlete.sport;
      
      if (sport === 'basketball') {
        averages = {
          pointsPerGame: recentStats.reduce((sum, stat) => sum + (stat.basketball.points || 0), 0) / recentStats.length,
          reboundsPerGame: recentStats.reduce((sum, stat) => sum + (stat.basketball.rebounds || 0), 0) / recentStats.length,
          assistsPerGame: recentStats.reduce((sum, stat) => sum + (stat.basketball.assists || 0), 0) / recentStats.length,
          fieldGoalPercentage: recentStats.reduce((sum, stat) => sum + stat.basketball.fieldGoalPercentage, 0) / recentStats.length
        };
      } else if (sport === 'soccer') {
        averages = {
          goalsPerGame: recentStats.reduce((sum, stat) => sum + (stat.soccer.goals || 0), 0) / recentStats.length,
          assistsPerGame: recentStats.reduce((sum, stat) => sum + (stat.soccer.assists || 0), 0) / recentStats.length,
          passAccuracy: recentStats.reduce((sum, stat) => sum + stat.soccer.passAccuracy, 0) / recentStats.length
        };
      }
    }

    res.json({
      recentStats: recentStats.slice(0, 10), // Last 10 games
      activeGoals,
      averages,
      totalGames: recentStats.length
    });
  } catch (error) {
    console.error('Get stats summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
