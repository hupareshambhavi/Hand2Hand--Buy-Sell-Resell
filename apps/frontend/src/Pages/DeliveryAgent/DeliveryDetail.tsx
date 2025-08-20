import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authService } from '../../Services/authService';
import { useToast } from '../../context/ToastContext';

// Define the type for delivery details
interface DeliveryDetails {
  pickup_location: string;
  dropoff_location: string;
  delivery_date: string;
  delivery_time: string;
}

// Define status type - matching backend allowed statuses
type DeliveryStatus = 'out_for_delivery' | 'on_the_way' | 'delivered';

const DeliveryDetails = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [deliveryDetails, setDeliveryDetails] = useState<DeliveryDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<DeliveryStatus>('out_for_delivery');
  const [updating, setUpdating] = useState(false);
  const [success, setSuccess] = useState('');
  
  // Popup state
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    if (requestId) {
      fetchDeliveryDetails();
    } else {
      setError('No request ID found');
      setLoading(false);
    }
  }, [requestId]);

  // Auto-hide popup after 3 seconds
  useEffect(() => {
    if (showPopup) {
      const timer = setTimeout(() => {
        setShowPopup(false);
        setError('');
        setSuccess('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showPopup]);

  const fetchDeliveryDetails = async () => {
    if (!requestId) return;
    
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
      
      // Get headers with stored CSRF token
      const headers = authService.getDeliveryAgentHeaders();
      if (!headers) {
        showToast("Authentication required. Please login again.", "error");
        navigate("/login");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/delivery-agent/accepted-delivery-details/${requestId}`, {
        method: "GET",
        headers,
        credentials: "include",
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          showToast("Authentication expired. Please login again.", "error");
          navigate("/login");
          return;
        }
        throw new Error(`Failed to fetch delivery details: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setDeliveryDetails(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching delivery details:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch delivery details');
      setLoading(false);
    }
  };

  const handleStatusChange = (status: DeliveryStatus) => {
    setSelectedStatus(status);
  };

  const handleUpdate = async () => {
    if (!requestId) return;
    
    setUpdating(true);
    setError('');
    setSuccess('');
    
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
      
      // Get headers with stored CSRF token
      const headers = authService.getDeliveryAgentHeaders();
      if (!headers) {
        showToast("Authentication required. Please login again.", "error");
        navigate("/login");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/delivery-agent/update-status/${requestId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ status: selectedStatus }),
        credentials: "include",
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          showToast("Authentication expired. Please login again.", "error");
          navigate("/login");
          return;
        }
        throw new Error('Failed to update status');
      }
      
      showToast(`Status updated to: ${selectedStatus.replace('-', ' ').toUpperCase()}`, "success");
    } catch (err) {
      console.error('Error updating status:', err);
      showToast('Failed to update status', "error");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading delivery details...</p>
        </div>
      </div>
    );
  }

  if (error && !showPopup) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg max-w-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-lg rounded-2xl overflow-hidden">
          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-center text-gray-800 mb-4">Delivery Details</h1>
            </div>

            {/* Error/Success Messages */}
            {error && !showPopup && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            
            {success && !showPopup && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-600">{success}</p>
              </div>
            )}

            {/* Delivery Information */}
            {deliveryDetails ? (
              <div className="space-y-6 mb-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pickup Location
                  </label>
                  <span className="text-gray-800 text-lg">{deliveryDetails.pickup_location}</span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Drop-off Location
                  </label>
                  <span className="text-gray-800 text-lg">{deliveryDetails.dropoff_location}</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery Date
                    </label>
                    <span className="text-gray-800 text-lg">{deliveryDetails.delivery_date}</span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery Time
                    </label>
                    <span className="text-gray-800 text-lg">{deliveryDetails.delivery_time}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 mb-8 text-center py-8">No delivery details available</div>
            )}

            {/* Status Selection */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Update Delivery Status
              </label>
              <div className="space-y-4">
                <div 
                  className="flex items-center cursor-pointer p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={() => handleStatusChange('out_for_delivery')}
                >
                  <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
                    selectedStatus === 'out_for_delivery' 
                      ? 'border-blue-500 bg-blue-500' 
                      : 'border-gray-300 bg-white'
                  }`}>
                    {selectedStatus === 'out_for_delivery' && (
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    )}
                  </div>
                  <span className="text-gray-800 font-medium">Out for Delivery</span>
                </div>

                <div 
                  className="flex items-center cursor-pointer p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={() => handleStatusChange('on_the_way')}
                >
                  <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
                    selectedStatus === 'on_the_way' 
                      ? 'border-blue-500 bg-blue-500' 
                      : 'border-gray-300 bg-white'
                  }`}>
                    {selectedStatus === 'on_the_way' && (
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    )}
                  </div>
                  <span className="text-gray-800 font-medium">On the way</span>
                </div>

                <div 
                  className="flex items-center cursor-pointer p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={() => handleStatusChange('delivered')}
                >
                  <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
                    selectedStatus === 'delivered' 
                      ? 'border-blue-500 bg-blue-500' 
                      : 'border-gray-300 bg-white'
                  }`}>
                    {selectedStatus === 'delivered' && (
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    )}
                  </div>
                  <span className="text-gray-800 font-medium">Delivered</span>
                </div>
              </div>
            </div>

            {/* Update Button */}
            <button 
              onClick={handleUpdate}
              disabled={updating}
              className="w-full bg-[#3A1078] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#2d0a5e] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {updating ? 'Updating Status...' : 'Update Status'}
            </button>
          </div>
        </div>
      </div>

      {/* Simple Popup */}
      {showPopup && (
        <div className="fixed top-4 right-4 bg-[#3A1078] text-white px-6 py-3 rounded-lg shadow-lg z-50">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{success ? '✓' : '✗'}</span>
            <span>{success || error}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryDetails;