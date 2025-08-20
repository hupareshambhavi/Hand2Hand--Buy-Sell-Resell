import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  Users, 
  AlertTriangle, 
  Package, 
  Clock,
  UserCheck
} from 'lucide-react';
import { authService } from '../../Services/authService';
import { getModeratorStats } from '../../Services/moderatorapi';

interface ModeratorStats {
  totalUsers: number;
  pendingListings: number;
  activeReports: number;
  pendingAgents: number;
  resolvedToday: number;
  totalListings: number;
}

const ModeratorHomePage: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [stats, setStats] = useState<ModeratorStats>({
    totalUsers: 0,
    pendingListings: 0,
    activeReports: 0,
    pendingAgents: 0,
    resolvedToday: 0,
    totalListings: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
    
    // Fetch real stats from API
    const fetchStats = async () => {
      try {
        const apiStats = await getModeratorStats();
        setStats({
          totalUsers: apiStats.total_users,
          pendingListings: apiStats.pending_listings,
          activeReports: apiStats.active_reports,
          pendingAgents: apiStats.pending_agents,
          resolvedToday: 0, // This can be calculated separately if needed
          totalListings: apiStats.total_listings
        });
      } catch (error) {
        console.error('Error fetching moderator stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const quickActions = [
    {
      title: "Manage Listings",
      description: "Review and moderate product listings",
      icon: <Package className="w-8 h-8" />,
      link: "/moderator/listings",
      color: "bg-blue-500",
      hoverColor: "hover:bg-blue-600",
      count: stats.pendingListings
    },
    {
      title: "Review Reports",
      description: "Handle user reports and complaints",
      icon: <AlertTriangle className="w-8 h-8" />,
      link: "/moderator/reports",
      color: "bg-red-500",
      hoverColor: "hover:bg-red-600",
      count: stats.activeReports
    },
    {
      title: "Approve Agents",
      description: "Review and approve delivery agent applications",
      icon: <UserCheck className="w-8 h-8" />,
      link: "/moderator/approve-agents",
      color: "bg-green-500",
      hoverColor: "hover:bg-green-600",
      count: stats.pendingAgents
    }
  ];

  const statsCards = [
    {
      title: "Total Listings",
      value: stats.totalListings.toLocaleString(),
      icon: <Package className="w-6 h-6" />,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      title: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      icon: <Users className="w-6 h-6" />,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Intro Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Shield className="w-12 h-12" />
              <h1 className="text-4xl font-bold">
                Welcome back, {currentUser?.first_name || 'Moderator'}!
              </h1>
            </div>
            <p className="text-xl opacity-90 mb-8">
              Your moderation dashboard - keep the platform safe and running smoothly
            </p>
            
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="flex justify-center mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
            {loading ? (
              // Loading skeleton
              Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div>
                      <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                    </div>
                    <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                  </div>
                </div>
              ))
            ) : (
              statsCards.map((stat, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
                    </div>
                    <div className={`${stat.bgColor} ${stat.color} p-3 rounded-full`}>
                      {stat.icon}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pending Tasks Overview */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
            Pending Tasks
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loading ? (
              // Loading skeleton for pending tasks
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-28 mb-2 animate-pulse"></div>
                      <div className="h-8 bg-gray-200 rounded w-12 animate-pulse"></div>
                    </div>
                    <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-36 mt-2 animate-pulse"></div>
                </div>
              ))
            ) : (
              <>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Pending Listings</p>
                      <p className="text-3xl font-bold text-blue-600 mt-1">{stats.pendingListings}</p>
                    </div>
                    <Package className="w-8 h-8 text-blue-500" />
                  </div>
                  <p className="text-gray-500 text-xs mt-2">Products awaiting approval</p>
                </div>
                
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Active Reports</p>
                      <p className="text-3xl font-bold text-red-600 mt-1">{stats.activeReports}</p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                  </div>
                  <p className="text-gray-500 text-xs mt-2">Reports requiring review</p>
                </div>
                
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Pending Agents</p>
                      <p className="text-3xl font-bold text-green-600 mt-1">{stats.pendingAgents}</p>
                    </div>
                    <UserCheck className="w-8 h-8 text-green-500" />
                  </div>
                  <p className="text-gray-500 text-xs mt-2">Agent applications to review</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Clock className="w-6 h-6 text-green-600" />
            Moderation Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.link}
                className={`${action.color} ${action.hoverColor} text-white rounded-xl p-8 transition-all duration-200 hover:shadow-lg hover:scale-105 group relative`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="text-white opacity-90 group-hover:opacity-100 transition-opacity">
                    {action.icon}
                  </div>
                  {action.count > 0 && (
                    <div className="bg-red-500 text-white px-3 py-1 rounded-lg font-bold text-xs animate-pulse shadow-lg">
                      TODO
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-bold mb-2">{action.title}</h3>
                <p className="text-white text-opacity-90 text-sm mb-3">{action.description}</p>
                
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModeratorHomePage;