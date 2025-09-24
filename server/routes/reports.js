const express = require('express');
const puppeteer = require('puppeteer');
const Athlete = require('../models/Athlete');
const Stat = require('../models/Stat');
const Goal = require('../models/Goal');
const { auth, requireAthlete, requireRole } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/reports/athlete/:id
// @desc    Generate athlete progress report
// @access  Private
router.get('/athlete/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'json', startDate, endDate } = req.query;

    // Check permissions
    let athlete;
    if (req.user.role === 'athlete') {
      athlete = await Athlete.findOne({ user: req.user.id });
      if (!athlete || athlete._id.toString() !== id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (req.user.role === 'coach' || req.user.role === 'admin') {
      athlete = await Athlete.findById(id);
      if (!athlete) {
        return res.status(404).json({ message: 'Athlete not found' });
      }
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Set date range
    const start = startDate ? new Date(startDate) : new Date();
    start.setMonth(start.getMonth() - 3); // Default to last 3 months
    
    const end = endDate ? new Date(endDate) : new Date();

    // Get athlete data
    const athleteData = await Athlete.findById(id)
      .populate('user', 'firstName lastName email')
      .populate('coach', 'firstName lastName email')
      .populate('parents', 'firstName lastName email');

    // Get stats in date range
    const stats = await Stat.find({
      athlete: id,
      gameDate: { $gte: start, $lte: end }
    }).sort({ gameDate: 1 });

    // Get goals
    const goals = await Goal.find({
      athlete: id,
      $or: [
        { startDate: { $lte: end } },
        { targetDate: { $gte: start } }
      ]
    }).populate('createdBy', 'firstName lastName');

    // Calculate analytics
    const analytics = calculateAnalytics(stats, athlete.sport);
    const goalProgress = calculateGoalProgress(goals);

    const reportData = {
      athlete: {
        name: `${athleteData.user.firstName} ${athleteData.user.lastName}`,
        sport: athleteData.sport,
        position: athleteData.position,
        age: athleteData.age,
        team: athleteData.team,
        coach: athleteData.coach
      },
      reportPeriod: {
        startDate: start,
        endDate: end,
        generatedAt: new Date()
      },
      stats: {
        totalGames: stats.length,
        analytics,
        recentGames: stats.slice(-10)
      },
      goals: {
        total: goals.length,
        active: goals.filter(g => g.status === 'active').length,
        completed: goals.filter(g => g.status === 'completed').length,
        overdue: goals.filter(g => g.status === 'overdue').length,
        progress: goalProgress
      },
      summary: generateSummary(analytics, goalProgress, athlete.sport)
    };

    if (format === 'pdf') {
      const pdfBuffer = await generatePDFReport(reportData);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${athleteData.user.firstName}_${athleteData.user.lastName}_Report.pdf"`
      });
      res.send(pdfBuffer);
    } else {
      res.json({ report: reportData });
    }
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/team/:teamId
// @desc    Generate team progress report (for coaches)
// @access  Private (Coaches/Admins only)
router.get('/team/:teamId', auth, requireRole('coach', 'admin'), async (req, res) => {
  try {
    const { teamId } = req.params;
    const { format = 'json', startDate, endDate } = req.query;

    // Get team athletes
    const athletes = await Athlete.find({ 'team.name': teamId })
      .populate('user', 'firstName lastName')
      .populate('coach', 'firstName lastName');

    if (athletes.length === 0) {
      return res.status(404).json({ message: 'Team not found or no athletes' });
    }

    // Set date range
    const start = startDate ? new Date(startDate) : new Date();
    start.setMonth(start.getMonth() - 1); // Default to last month
    
    const end = endDate ? new Date(endDate) : new Date();

    const teamReport = {
      team: {
        name: teamId,
        athleteCount: athletes.length,
        sport: athletes[0].sport
      },
      reportPeriod: {
        startDate: start,
        endDate: end,
        generatedAt: new Date()
      },
      athletes: []
    };

    // Generate individual reports for each athlete
    for (const athlete of athletes) {
      const stats = await Stat.find({
        athlete: athlete._id,
        gameDate: { $gte: start, $lte: end }
      }).sort({ gameDate: 1 });

      const goals = await Goal.find({
        athlete: athlete._id,
        status: 'active'
      });

      const analytics = calculateAnalytics(stats, athlete.sport);
      const goalProgress = calculateGoalProgress(goals);

      teamReport.athletes.push({
        name: `${athlete.user.firstName} ${athlete.user.lastName}`,
        position: athlete.position,
        totalGames: stats.length,
        analytics,
        goals: {
          total: goals.length,
          averageProgress: goalProgress.averageProgress
        }
      });
    }

    // Calculate team averages
    teamReport.teamAverages = calculateTeamAverages(teamReport.athletes, athletes[0].sport);

    if (format === 'pdf') {
      const pdfBuffer = await generateTeamPDFReport(teamReport);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${teamId}_Team_Report.pdf"`
      });
      res.send(pdfBuffer);
    } else {
      res.json({ report: teamReport });
    }
  } catch (error) {
    console.error('Generate team report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper functions
function calculateAnalytics(stats, sport) {
  if (stats.length === 0) {
    return { totalGames: 0 };
  }

  if (sport === 'basketball') {
    return {
      totalGames: stats.length,
      averagePoints: stats.reduce((sum, stat) => sum + (stat.basketball.points || 0), 0) / stats.length,
      averageRebounds: stats.reduce((sum, stat) => sum + (stat.basketball.rebounds || 0), 0) / stats.length,
      averageAssists: stats.reduce((sum, stat) => sum + (stat.basketball.assists || 0), 0) / stats.length,
      averageFieldGoalPercentage: stats.reduce((sum, stat) => sum + stat.basketball.fieldGoalPercentage, 0) / stats.length,
      averageThreePointPercentage: stats.reduce((sum, stat) => sum + stat.basketball.threePointPercentage, 0) / stats.length,
      averageFreeThrowPercentage: stats.reduce((sum, stat) => sum + stat.basketball.freeThrowPercentage, 0) / stats.length,
      bestGame: stats.reduce((best, stat) => 
        stat.basketball.points > best.points ? stat : best, 
        { basketball: { points: 0 } }
      )
    };
  } else if (sport === 'soccer') {
    return {
      totalGames: stats.length,
      totalGoals: stats.reduce((sum, stat) => sum + (stat.soccer.goals || 0), 0),
      totalAssists: stats.reduce((sum, stat) => sum + (stat.soccer.assists || 0), 0),
      averagePassAccuracy: stats.reduce((sum, stat) => sum + stat.soccer.passAccuracy, 0) / stats.length,
      averageShots: stats.reduce((sum, stat) => sum + (stat.soccer.shots || 0), 0) / stats.length
    };
  }

  return { totalGames: stats.length };
}

function calculateGoalProgress(goals) {
  if (goals.length === 0) {
    return { averageProgress: 0, completedGoals: 0, activeGoals: 0 };
  }

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');
  const averageProgress = goals.reduce((sum, goal) => sum + goal.progress.percentage, 0) / goals.length;

  return {
    totalGoals: goals.length,
    activeGoals: activeGoals.length,
    completedGoals: completedGoals.length,
    averageProgress: Math.round(averageProgress)
  };
}

function calculateTeamAverages(athletes, sport) {
  if (athletes.length === 0) return {};

  const averages = {
    totalGames: athletes.reduce((sum, athlete) => sum + athlete.totalGames, 0) / athletes.length,
    averageGoalProgress: athletes.reduce((sum, athlete) => sum + athlete.goals.averageProgress, 0) / athletes.length
  };

  if (sport === 'basketball') {
    averages.averagePoints = athletes.reduce((sum, athlete) => sum + (athlete.analytics.averagePoints || 0), 0) / athletes.length;
    averages.averageRebounds = athletes.reduce((sum, athlete) => sum + (athlete.analytics.averageRebounds || 0), 0) / athletes.length;
    averages.averageAssists = athletes.reduce((sum, athlete) => sum + (athlete.analytics.averageAssists || 0), 0) / athletes.length;
  } else if (sport === 'soccer') {
    averages.totalGoals = athletes.reduce((sum, athlete) => sum + (athlete.analytics.totalGoals || 0), 0);
    averages.totalAssists = athletes.reduce((sum, athlete) => sum + (athlete.analytics.totalAssists || 0), 0);
  }

  return averages;
}

function generateSummary(analytics, goalProgress, sport) {
  const summary = [];

  // Stats summary
  if (analytics.totalGames > 0) {
    summary.push(`Played ${analytics.totalGames} games in the reporting period.`);
    
    if (sport === 'basketball') {
      summary.push(`Averaged ${analytics.averagePoints?.toFixed(1) || 0} points, ${analytics.averageRebounds?.toFixed(1) || 0} rebounds, and ${analytics.averageAssists?.toFixed(1) || 0} assists per game.`);
    } else if (sport === 'soccer') {
      summary.push(`Scored ${analytics.totalGoals || 0} goals and provided ${analytics.totalAssists || 0} assists.`);
    }
  }

  // Goals summary
  if (goalProgress.totalGoals > 0) {
    summary.push(`Working on ${goalProgress.activeGoals} active goals with ${goalProgress.averageProgress}% average progress.`);
    if (goalProgress.completedGoals > 0) {
      summary.push(`Successfully completed ${goalProgress.completedGoals} goals.`);
    }
  }

  return summary.join(' ');
}

async function generatePDFReport(reportData) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Athlete Progress Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .summary { background-color: #f9f9f9; padding: 15px; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Athlete Progress Report</h1>
        <h2>${reportData.athlete.name}</h2>
        <p>${reportData.athlete.sport} • ${reportData.athlete.position || 'N/A'}</p>
      </div>

      <div class="section">
        <h2>Report Period</h2>
        <p><strong>From:</strong> ${reportData.reportPeriod.startDate.toLocaleDateString()}</p>
        <p><strong>To:</strong> ${reportData.reportPeriod.endDate.toLocaleDateString()}</p>
        <p><strong>Generated:</strong> ${reportData.reportPeriod.generatedAt.toLocaleDateString()}</p>
      </div>

      <div class="section">
        <h2>Performance Statistics</h2>
        <table>
          <tr><th>Metric</th><th>Value</th></tr>
          <tr><td>Total Games</td><td>${reportData.stats.totalGames}</td></tr>
          ${reportData.stats.analytics.averagePoints ? `<tr><td>Average Points</td><td>${reportData.stats.analytics.averagePoints.toFixed(1)}</td></tr>` : ''}
          ${reportData.stats.analytics.averageRebounds ? `<tr><td>Average Rebounds</td><td>${reportData.stats.analytics.averageRebounds.toFixed(1)}</td></tr>` : ''}
          ${reportData.stats.analytics.averageAssists ? `<tr><td>Average Assists</td><td>${reportData.stats.analytics.averageAssists.toFixed(1)}</td></tr>` : ''}
          ${reportData.stats.analytics.totalGoals ? `<tr><td>Total Goals</td><td>${reportData.stats.analytics.totalGoals}</td></tr>` : ''}
          ${reportData.stats.analytics.totalAssists ? `<tr><td>Total Assists</td><td>${reportData.stats.analytics.totalAssists}</td></tr>` : ''}
        </table>
      </div>

      <div class="section">
        <h2>Goal Progress</h2>
        <table>
          <tr><th>Metric</th><th>Value</th></tr>
          <tr><td>Total Goals</td><td>${reportData.goals.total}</td></tr>
          <tr><td>Active Goals</td><td>${reportData.goals.active}</td></tr>
          <tr><td>Completed Goals</td><td>${reportData.goals.completed}</td></tr>
          <tr><td>Overdue Goals</td><td>${reportData.goals.overdue}</td></tr>
        </table>
      </div>

      <div class="section">
        <h2>Summary</h2>
        <div class="summary">
          <p>${reportData.summary}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await page.setContent(html);
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true
  });

  await browser.close();
  return pdfBuffer;
}

async function generateTeamPDFReport(teamReport) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Team Progress Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .athlete { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Team Progress Report</h1>
        <h2>${teamReport.team.name}</h2>
        <p>${teamReport.team.sport} • ${teamReport.team.athleteCount} Athletes</p>
      </div>

      <div class="section">
        <h2>Team Averages</h2>
        <table>
          <tr><th>Metric</th><th>Average</th></tr>
          <tr><td>Games per Athlete</td><td>${teamReport.teamAverages.totalGames?.toFixed(1) || 0}</td></tr>
          <tr><td>Average Goal Progress</td><td>${teamReport.teamAverages.averageGoalProgress?.toFixed(1) || 0}%</td></tr>
          ${teamReport.teamAverages.averagePoints ? `<tr><td>Average Points</td><td>${teamReport.teamAverages.averagePoints.toFixed(1)}</td></tr>` : ''}
          ${teamReport.teamAverages.totalGoals ? `<tr><td>Total Team Goals</td><td>${teamReport.teamAverages.totalGoals}</td></tr>` : ''}
        </table>
      </div>

      <div class="section">
        <h2>Individual Athletes</h2>
        ${teamReport.athletes.map(athlete => `
          <div class="athlete">
            <h3>${athlete.name}</h3>
            <p><strong>Position:</strong> ${athlete.position || 'N/A'}</p>
            <p><strong>Games Played:</strong> ${athlete.totalGames}</p>
            <p><strong>Goal Progress:</strong> ${athlete.goals.averageProgress}%</p>
          </div>
        `).join('')}
      </div>
    </body>
    </html>
  `;

  await page.setContent(html);
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true
  });

  await browser.close();
  return pdfBuffer;
}

module.exports = router;
