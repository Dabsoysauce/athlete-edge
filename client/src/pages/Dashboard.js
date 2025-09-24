import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { athletesAPI, statsAPI, goalsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  ChartBarIcon, 
  TargetIcon, 
  TrendingUpIcon, 
  TrophyIcon,
  PlusIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

function Dashboard() {
  const { user, athlete } = useAuth();
  const [loading, setLoading] = useState(true);
  const [statsSummary, setStatsSummary] = useState(null);
  const [goals, setGoals] = useState([]);
  const [recentStats, setRecentStats] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, goalsResponse] = await Promise.all([
        athletesAPI.getStatsSummary(),
        goalsAPI.getGoals({ status: 'active', limit: 5 })
      ]);

      setStatsSummary(statsResponse.data);
      setGoals(goalsResponse.data.goals);
      setRecentStats(statsResponse.data.recentStats || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getSportIcon = (sport) => {
    const icons = {
      basketball: '🏀',
      soccer: '⚽',
      football: '🏈',
      baseball: '⚾',
      tennis: '🎾',
      swimming: '🏊',
      track: '🏃',
      volleyball: '🏐',
    };
    return icons[sport] || '🏆';
  };

  const formatStatValue = (value, type = 'number') => {
    if (value === null || value === undefined) return '0';
    if (type === 'percentage') return `${value.toFixed(1)}%`;
    return value.toFixed(1);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg shadow-lg text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {getGreeting()}, {user?.firstName}!
            </h1>
            <p className="text-primary-100 mt-2">
              Welcome to your AthleteEdge dashboard
            </p>
            {athlete && (
              <div className="flex items-center mt-3">
                <span className="text-2xl mr-2">{getSportIcon(athlete.sport)}</span>
                <span className="text-primary-100 capitalize">
                  {athlete.sport} • {athlete.position || 'Athlete'}
                </span>
              </div>
            )}
          </div>
          <div className="hidden md:block">
            <div className="text-right">
              <div className="text-4xl font-bold">
                {statsSummary?.totalGames || 0}
              </div>
              <div className="text-primary-100">
                Total Games
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Goals */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TargetIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Goals</p>
              <p className="text-2xl font-semibold text-gray-900">
                {statsSummary?.activeGoals?.length || 0}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <Link
              to="/goals"
              className="text-sm text-primary-600 hover:text-primary-500 font-medium"
            >
              View all goals <ArrowRightIcon className="inline h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>

        {/* Recent Games */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Recent Games</p>
              <p className="text-2xl font-semibold text-gray-900">
                {recentStats.length}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <Link
              to="/stats"
              className="text-sm text-primary-600 hover:text-primary-500 font-medium"
            >
              View all stats <ArrowRightIcon className="inline h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>

        {/* Performance Trend */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUpIcon className="h-8 w-8 text-warning-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Progress</p>
              <p className="text-2xl font-semibold text-gray-900">
                {statsSummary?.averages ? 
                  formatStatValue(statsSummary.averages.pointsPerGame || statsSummary.averages.goalsPerGame || 0) : 
                  '0'
                }
              </p>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-success-600 font-medium">
              ↗️ Improving
            </span>
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrophyIcon className="h-8 w-8 text-warning-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed Goals</p>
              <p className="text-2xl font-semibold text-gray-900">
                {goals.filter(goal => goal.status === 'completed').length}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <Link
              to="/reports"
              className="text-sm text-primary-600 hover:text-primary-500 font-medium"
            >
              View reports <ArrowRightIcon className="inline h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Goals */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Active Goals</h3>
              <Link
                to="/goals"
                className="text-sm text-primary-600 hover:text-primary-500 font-medium"
              >
                View all
              </Link>
            </div>
          </div>
          <div className="px-6 py-4">
            {goals.length > 0 ? (
              <div className="space-y-4">
                {goals.slice(0, 3).map((goal) => (
                  <div key={goal._id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{goal.title}</p>
                      <p className="text-sm text-gray-500">
                        Target: {goal.targetMetric.targetValue} {goal.targetMetric.unit}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {goal.progress.percentage}%
                      </div>
                      <div className="w-16 bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className="bg-primary-600 h-2 rounded-full"
                          style={{ width: `${goal.progress.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <TargetIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No active goals</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Start by setting your first goal to track your progress.
                </p>
                <div className="mt-6">
                  <Link
                    to="/goals"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Set a Goal
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Games */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Recent Games</h3>
              <Link
                to="/stats"
                className="text-sm text-primary-600 hover:text-primary-500 font-medium"
              >
                View all
              </Link>
            </div>
          </div>
          <div className="px-6 py-4">
            {recentStats.length > 0 ? (
              <div className="space-y-4">
                {recentStats.slice(0, 3).map((stat) => (
                  <div key={stat._id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {stat.opponent ? `vs ${stat.opponent}` : 'Game'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(stat.gameDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      {athlete?.sport === 'basketball' && (
                        <div className="text-sm font-medium text-gray-900">
                          {stat.basketball?.points || 0} pts
                        </div>
                      )}
                      {athlete?.sport === 'soccer' && (
                        <div className="text-sm font-medium text-gray-900">
                          {stat.soccer?.goals || 0} goals
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No recent games</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Start tracking your game statistics to see your progress.
                </p>
                <div className="mt-6">
                  <Link
                    to="/stats"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Stats
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/stats"
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Game Stats
          </Link>
          <Link
            to="/goals"
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <TargetIcon className="h-4 w-4 mr-2" />
            Set New Goal
          </Link>
          <Link
            to="/reports"
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <ChartBarIcon className="h-4 w-4 mr-2" />
            Generate Report
          </Link>
          <Link
            to="/profile"
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <TargetIcon className="h-4 w-4 mr-2" />
            Update Profile
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
