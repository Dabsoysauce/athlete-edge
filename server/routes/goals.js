const express = require('express');
const { body, validationResult } = require('express-validator');
const Goal = require('../models/Goal');
const Athlete = require('../models/Athlete');
const { auth, requireAthlete, requireRole } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/goals
// @desc    Create a new goal
// @access  Private
router.post('/', [
  auth,
  body('title').trim().notEmpty().isLength({ max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('category').isIn(['performance', 'fitness', 'skill', 'team', 'personal', 'academic']),
  body('sport').isIn(['basketball', 'soccer', 'football', 'baseball', 'tennis', 'swimming', 'track', 'volleyball', 'general']),
  body('targetMetric.name').trim().notEmpty(),
  body('targetMetric.targetValue').isNumeric(),
  body('targetMetric.unit').trim().notEmpty(),
  body('targetDate').isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Determine target athlete
    let targetAthleteId;
    if (req.user.role === 'athlete') {
      const athlete = await Athlete.findOne({ user: req.user.id });
      if (!athlete) {
        return res.status(404).json({ message: 'Athlete profile not found' });
      }
      targetAthleteId = athlete._id;
    } else if (req.user.role === 'coach' || req.user.role === 'admin') {
      if (!req.body.athleteId) {
        return res.status(400).json({ message: 'Athlete ID required for coaches/admins' });
      }
      const athlete = await Athlete.findById(req.body.athleteId);
      if (!athlete) {
        return res.status(404).json({ message: 'Athlete not found' });
      }
      targetAthleteId = athlete._id;
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }

    const goalData = {
      athlete: targetAthleteId,
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      sport: req.body.sport,
      targetMetric: {
        name: req.body.targetMetric.name,
        currentValue: req.body.targetMetric.currentValue || 0,
        targetValue: req.body.targetMetric.targetValue,
        unit: req.body.targetMetric.unit,
        direction: req.body.targetMetric.direction || 'increase'
      },
      startDate: req.body.startDate || new Date(),
      targetDate: req.body.targetDate,
      priority: req.body.priority || 'medium',
      createdBy: req.user.id,
      tags: req.body.tags || []
    };

    // Set permissions
    goalData.permissions = {
      canEdit: [req.user.id],
      canView: [req.user.id]
    };

    // If coach created goal, give them edit permissions
    if (req.user.role === 'coach') {
      goalData.permissions.canEdit.push(req.user.id);
      goalData.permissions.canView.push(req.user.id);
    }

    const goal = new Goal(goalData);
    await goal.save();

    const populatedGoal = await Goal.findById(goal._id)
      .populate('athlete', 'sport position')
      .populate('athlete.user', 'firstName lastName')
      .populate('createdBy', 'firstName lastName');

    res.status(201).json({ goal: populatedGoal });
  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/goals
// @desc    Get goals for athlete
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { 
      athleteId, 
      status, 
      category, 
      sport, 
      page = 1, 
      limit = 20 
    } = req.query;

    let query = {};

    // Determine target athlete
    if (req.user.role === 'athlete') {
      const athlete = await Athlete.findOne({ user: req.user.id });
      if (!athlete) {
        return res.status(404).json({ message: 'Athlete profile not found' });
      }
      query.athlete = athlete._id;
    } else if (req.user.role === 'coach' || req.user.role === 'admin') {
      if (athleteId) {
        query.athlete = athleteId;
      } else {
        // Get all athletes coached by this coach
        const athletes = await Athlete.find({ coach: req.user._id }).select('_id');
        query.athlete = { $in: athletes.map(a => a._id) };
      }
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Apply filters
    if (status) query.status = status;
    if (category) query.category = category;
    if (sport) query.sport = sport;

    const goals = await Goal.find(query)
      .populate('athlete', 'sport position')
      .populate('athlete.user', 'firstName lastName')
      .populate('createdBy', 'firstName lastName')
      .populate('permissions.canEdit', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Goal.countDocuments(query);

    res.json({
      goals,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/goals/:id
// @desc    Get single goal
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id)
      .populate('athlete', 'sport position')
      .populate('athlete.user', 'firstName lastName')
      .populate('createdBy', 'firstName lastName')
      .populate('permissions.canEdit', 'firstName lastName')
      .populate('coachFeedback.coach', 'firstName lastName');

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    // Check permissions
    const canView = 
      req.user.role === 'admin' ||
      goal.permissions.canView.some(user => user._id.toString() === req.user.id) ||
      goal.athlete.user._id.toString() === req.user.id;

    if (!canView) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ goal });
  } catch (error) {
    console.error('Get goal by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/goals/:id
// @desc    Update goal
// @access  Private
router.put('/:id', [
  auth,
  body('title').optional().trim().notEmpty().isLength({ max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('targetDate').optional().isISO8601(),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('status').optional().isIn(['active', 'completed', 'paused', 'cancelled', 'overdue'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const goal = await Goal.findById(req.params.id);

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    // Check edit permissions
    const canEdit = 
      req.user.role === 'admin' ||
      goal.permissions.canEdit.some(user => user.toString() === req.user.id);

    if (!canEdit) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update allowed fields
    const allowedUpdates = [
      'title', 'description', 'targetDate', 'priority', 'status', 
      'tags', 'reminders', 'targetMetric.currentValue'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        goal[field] = req.body[field];
      }
    });

    await goal.save();

    const updatedGoal = await Goal.findById(goal._id)
      .populate('athlete', 'sport position')
      .populate('athlete.user', 'firstName lastName')
      .populate('createdBy', 'firstName lastName')
      .populate('permissions.canEdit', 'firstName lastName');

    res.json({ goal: updatedGoal });
  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/goals/:id/progress
// @desc    Update goal progress
// @access  Private
router.put('/:id/progress', [
  auth,
  body('value').isNumeric(),
  body('notes').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const goal = await Goal.findById(req.params.id);

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    // Check edit permissions
    const canEdit = 
      req.user.role === 'admin' ||
      goal.permissions.canEdit.some(user => user.toString() === req.user.id);

    if (!canEdit) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await goal.updateProgress(req.body.value, req.body.notes, req.user.id);

    const updatedGoal = await Goal.findById(goal._id)
      .populate('athlete', 'sport position')
      .populate('athlete.user', 'firstName lastName')
      .populate('createdBy', 'firstName lastName');

    res.json({ goal: updatedGoal });
  } catch (error) {
    console.error('Update goal progress error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/goals/:id
// @desc    Delete goal
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    // Check delete permissions
    const canDelete = 
      req.user.role === 'admin' ||
      goal.permissions.canEdit.some(user => user.toString() === req.user.id) ||
      goal.createdBy.toString() === req.user.id;

    if (!canDelete) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Goal.findByIdAndDelete(req.params.id);

    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/goals/:id/feedback
// @desc    Add coach feedback to goal
// @access  Private (Coaches only)
router.post('/:id/feedback', [
  auth,
  requireRole('coach', 'admin'),
  body('feedback').trim().notEmpty(),
  body('rating').optional().isInt({ min: 1, max: 5 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const goal = await Goal.findById(req.params.id);

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    // Check if coach has access to this athlete
    const athlete = await Athlete.findById(goal.athlete);
    if (req.user.role === 'coach' && athlete.coach.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    goal.coachFeedback.push({
      feedback: req.body.feedback,
      rating: req.body.rating,
      coach: req.user.id
    });

    await goal.save();

    const updatedGoal = await Goal.findById(goal._id)
      .populate('athlete', 'sport position')
      .populate('athlete.user', 'firstName lastName')
      .populate('coachFeedback.coach', 'firstName lastName');

    res.json({ goal: updatedGoal });
  } catch (error) {
    console.error('Add coach feedback error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/goals/analytics/progress
// @desc    Get goal progress analytics
// @access  Private
router.get('/analytics/progress', auth, async (req, res) => {
  try {
    const { athleteId, category, sport } = req.query;

    let query = {};

    // Determine target athlete
    if (req.user.role === 'athlete') {
      const athlete = await Athlete.findOne({ user: req.user.id });
      if (!athlete) {
        return res.status(404).json({ message: 'Athlete profile not found' });
      }
      query.athlete = athlete._id;
    } else if (req.user.role === 'coach' || req.user.role === 'admin') {
      if (athleteId) {
        query.athlete = athleteId;
      } else {
        return res.status(400).json({ message: 'Athlete ID required' });
      }
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (category) query.category = category;
    if (sport) query.sport = sport;

    const goals = await Goal.find(query);

    const analytics = {
      totalGoals: goals.length,
      activeGoals: goals.filter(g => g.status === 'active').length,
      completedGoals: goals.filter(g => g.status === 'completed').length,
      overdueGoals: goals.filter(g => g.status === 'overdue').length,
      averageProgress: goals.reduce((sum, goal) => sum + goal.progress.percentage, 0) / goals.length || 0,
      goalsByCategory: {},
      goalsByStatus: {},
      recentProgress: goals
        .filter(g => g.progress.updates.length > 0)
        .map(g => ({
          title: g.title,
          progress: g.progress.percentage,
          lastUpdate: g.progress.updates[g.progress.updates.length - 1].date
        }))
        .sort((a, b) => new Date(b.lastUpdate) - new Date(a.lastUpdate))
        .slice(0, 10)
    };

    // Count by category
    goals.forEach(goal => {
      analytics.goalsByCategory[goal.category] = (analytics.goalsByCategory[goal.category] || 0) + 1;
      analytics.goalsByStatus[goal.status] = (analytics.goalsByStatus[goal.status] || 0) + 1;
    });

    res.json({ analytics });
  } catch (error) {
    console.error('Get goal analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
