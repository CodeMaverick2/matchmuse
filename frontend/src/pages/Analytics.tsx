import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Users, Briefcase, Zap, TrendingUp, Clock, MapPin, DollarSign } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { Card } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useAppStore } from '../stores/useAppStore';
import { analyticsApi } from '../services/api';
import type { Analytics } from '../types';

export const AnalyticsPage: React.FC = () => {
  const { analytics, setAnalytics, isLoading, setIsLoading } = useAppStore();
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      const data = await analyticsApi.getAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !analytics) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Prepare chart data with safety checks
  const categoryData = Object.entries(analytics.categoryDistribution || {}).map(([category, count]) => ({
    category,
    count,
    percentage: ((count / analytics.totalTalents) * 100).toFixed(1)
  }));

  const budgetData = Object.entries(analytics.budgetRanges || {}).map(([range, count]) => ({
    range,
    count,
    percentage: ((count / analytics.totalGigs) * 100).toFixed(1)
  }));

  const locationData = Object.entries(analytics.locationInsights || {}).map(([location, count]) => ({
    location,
    count,
    percentage: ((count / analytics.totalTalents) * 100).toFixed(1)
  })).slice(0, 8); // Top 8 locations

  const chartColors = ['#3B82F6', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'];

  const stats = [
    {
      name: 'Total Talents',
      value: analytics.totalTalents,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      change: '+12%',
      changeType: 'positive'
    },
    {
      name: 'Total Clients',
      value: analytics.totalClients,
      icon: Briefcase,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      change: '+8%',
      changeType: 'positive'
    },
    {
      name: 'Active Gigs',
      value: analytics.totalGigs,
      icon: Zap,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      change: '+23%',
      changeType: 'positive'
    },
    {
      name: 'Match Success Rate',
      value: `${analytics.matchSuccessRate}%`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      change: '+5%',
      changeType: 'positive'
    },
    {
      name: 'Avg Processing Time',
      value: `${analytics.avgProcessingTime}ms`,
      icon: Clock,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      change: '-15%',
      changeType: 'positive'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
            <p className="text-white/70 mt-2">
              Insights into your platform performance and usage patterns
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-8 h-8 text-blue-400" />
          </div>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-white/70">{stat.name}</p>
                    <div className="flex items-center">
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                      <span className={`ml-2 text-sm font-medium ${
                        stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stat.change}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Category Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <h3 className="text-lg font-semibold text-white mb-4">
              Talent by Category
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="category" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#ffffff'
                  }}
                  labelStyle={{ color: '#ffffff' }}
                  formatter={(value: any, name: any) => [`${value} gigs`, 'Gig Count']}
                />
                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* Budget Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <h3 className="text-lg font-semibold text-white mb-4">
              Project Budget Ranges (₹)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={budgetData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ range, percentage }) => `${range}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {budgetData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#ffffff'
                  }}
                  labelStyle={{ color: '#ffffff' }}
                  formatter={(value: any, name: any) => [`${value} projects`, 'Project Count']}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      </div>

      {/* Location Insights */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-8"
      >
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            Top Locations
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={locationData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="location" type="category" width={100} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#ffffff'
                }}
                labelStyle={{ color: '#ffffff' }}
                formatter={(value: any, name: any) => [`${value} talents`, 'Talent Count']}
              />
              <Bar dataKey="count" fill="#F59E0B" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </motion.div>

      {/* Performance Metrics */}
      <div className="grid md:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <h3 className="text-lg font-semibold text-white mb-4">
              Platform Health
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-white/70">System Status</span>
                <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm font-medium">
                  Healthy
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70">API Response Time</span>
                <span className="font-semibold text-white">{analytics.avgProcessingTime}ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70">Uptime</span>
                <span className="font-semibold text-white">99.9%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70">Active Connections</span>
                <span className="font-semibold text-white">1,247</span>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <h3 className="text-lg font-semibold text-white mb-4">
              Recent Activity
            </h3>
            <div className="space-y-3">
              {[
                { action: 'New talent registered', time: '2 minutes ago', type: 'talent' },
                { action: 'Match generated', time: '5 minutes ago', type: 'match' },
                { action: 'Gig created', time: '12 minutes ago', type: 'gig' },
                { action: 'Client onboarded', time: '1 hour ago', type: 'client' },
                { action: 'Project completed', time: '2 hours ago', type: 'project' }
              ].map((activity, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'talent' ? 'bg-blue-500' :
                    activity.type === 'match' ? 'bg-purple-500' :
                    activity.type === 'gig' ? 'bg-green-500' :
                    activity.type === 'client' ? 'bg-orange-500' :
                    'bg-gray-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm text-white">{activity.action}</p>
                    <p className="text-xs text-white/60">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};