import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Truck, 
  Package, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp
} from 'lucide-react';
import { authService } from '../../Services/authService';
import { getDeliveryAgentStats } from '../../Services/deliveryAgentapi';
import { useToast } from '../../context/ToastContext';

interface DeliveryStats {
  pendingRequests: number;
  acceptedDeliveries: number;
  completedDeliveries: number;
  totalEarnings: number;
  rating: number;
}

const AgentHomePage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [stats, setStats] = useState<DeliveryStats>({
    pendingRequests: 0,
    acceptedDeliveries: 0,
    completedDeliveries: 0,
    totalEarnings: 0,
    rating: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
    
    // Fetch real stats from API
    const fetchStats = async () => {
      try {
        const agentId = user?.user_id || user?.id;
        if (agentId) {
          const apiStats = await getDeliveryAgentStats(agentId);
          setStats({
            pendingRequests: apiStats.pending_requests,
            acceptedDeliveries: apiStats.accepted_deliveries,
            completedDeliveries: apiStats.completed_deliveries,
            totalEarnings: apiStats.total_earnings,
            rating: 0 // Rating can be calculated separately if needed
          });
        }
      } catch (error) {
        console.error('Error fetching delivery agent stats:', error);
        
        // Handle authentication errors
        if (error instanceof Error && error.message.includes('Authentication')) {
          showToast('Authentication required. Please login again.', 'error');
          navigate('/login');
          return;
        }
        
        // Fallback to mock data if API fails
        showToast('Unable to fetch real-time stats, showing sample data.', 'info');
        setStats({
          pendingRequests: 5,
          acceptedDeliveries: 3,
          completedDeliveries: 47,
          totalEarnings: 1250.50,
          rating: 4.8
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const agentId = currentUser?.user_id || currentUser?.id;

  const quickActions = [
    {
      title: "Order Requests",
      description: "View and accept new delivery requests",
      icon: <Package className="w-8 h-8" />,
      link: `/pending-requests/${agentId}`,
      color: "bg-blue-500",
      hoverColor: "hover:bg-blue-600",
      count: stats.pendingRequests
    },
    {
      title: "Accepted Deliveries",
      description: "Manage your accepted delivery orders",
      icon: <CheckCircle className="w-8 h-8" />,
      link: `/accepted-deliveries/${agentId}`,
      color: "bg-green-500",
      hoverColor: "hover:bg-green-600",
      count: stats.acceptedDeliveries
    }
  ];

  const statsCards = [
    {
      title: "Completed Deliveries",
      value: stats.completedDeliveries,
      icon: <Truck className="w-6 h-6" />,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      title: "Total Earnings",
      value: `$${stats.totalEarnings.toFixed(2)}`,
      icon: <TrendingUp className="w-6 h-6" />,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Truck className="w-12 h-12" />
              <h1 className="text-4xl font-bold">
                Welcome back, {currentUser?.first_name || 'Agent'}!
              </h1>
            </div>
            <p className="text-xl opacity-90 mb-8">
              Your delivery agent dashboard - manage orders, track earnings, and grow your business
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
            <AlertCircle className="w-6 h-6 text-orange-600" />
            Current Tasks
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loading ? (
              // Loading skeleton for current tasks
              Array.from({ length: 2 }).map((_, index) => (
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
                      <p className="text-gray-600 text-sm font-medium">Pending Requests</p>
                      <p className="text-3xl font-bold text-blue-600 mt-1">{stats.pendingRequests}</p>
                    </div>
                    <Package className="w-8 h-8 text-blue-500" />
                  </div>
                  <p className="text-gray-500 text-xs mt-2">New delivery requests awaiting your response</p>
                </div>
                
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Accepted Deliveries</p>
                      <p className="text-3xl font-bold text-green-600 mt-1">{stats.acceptedDeliveries}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <p className="text-gray-500 text-xs mt-2">Deliveries you've accepted and need to complete</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Clock className="w-6 h-6 text-blue-600" />
            Agent Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
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
                  {action.count !== undefined && action.count > 0 && (
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

export default AgentHomePage;
