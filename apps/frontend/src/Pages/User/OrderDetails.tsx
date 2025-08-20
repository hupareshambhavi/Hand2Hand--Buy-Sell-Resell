import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import { useToast } from "../../context/ToastContext";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface Product {
  name: string;
  description: string;
  price: number;
  condition: string;
  image_urls: string[];
  seller_id: number;
  category_id: number;
  is_wanted: boolean;
  location: string;
  product_id: number;
  created_at: string;
  updated_at: string;
  category_name: string;
  rejection_reason: string;
}

interface OrderDetails {
  request_id: number;
  agent_id: number;
  product: Product;
  request_date: string;
  seller_id: number;
  dropoff_location: string;
  pickup_location: string;
  status: string;
  delivery_fee: number;
  delivery_rating: number;
  delivery_date: string;
  buyer_id: number;
}

export default function OrderDetails() {
  const { showToast } = useToast();
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [tempRating, setTempRating] = useState(0);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!orderId) {
      setError("Order ID not provided.");
      setLoading(false);
      return;
    }

    if (!token) {
      setError("No auth token found.");
      setLoading(false);
      return;
    }

    const fetchOrderDetails = async () => {
      try {
        const url = `${API_BASE_URL}/users/orders/${orderId}`;
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch order details: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        setOrderDetails(data);
        setRating(data.delivery_rating || 0);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError((err as Error).message);
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, token]);

  const getDeliverySteps = () => {
    if (!orderDetails) return [];

    const status = orderDetails.status;
    
    const steps = [
      {
        step: 1,
        title: "Order Received",
        date: orderDetails.request_date,
        completed: true, // Always completed since order exists
      },
      {
        step: 2,
        title: "Processing",
        date: orderDetails.request_date,
        completed: status !== "pending",
      },
      {
        step: 3,
        title: "Out for Delivery",
        date: orderDetails.request_date,
        completed: ["out_for_delivery", "on_the_way", "delivered", "completed"].includes(status),
      },
      {
        step: 4,
        title: "On the Way",
        date: orderDetails.delivery_date || orderDetails.request_date,
        completed: ["on_the_way", "delivered", "completed"].includes(status),
      },
      {
        step: 5,
        title: "Delivered",
        date: orderDetails.delivery_date,
        completed: ["delivered", "completed"].includes(status),
      },
    ];

    return steps;
  };

  const handleRatingClick = (selectedRating: number) => {
    setRating(selectedRating);
    // Here you would typically send the rating to your API
  };

  const handleReviewSubmit = () => {
    if (!rating) {
      showToast("Please select a rating before submitting.", "error");
      return;
    }
  
    showToast(`Rating submitted: ${rating} star${rating > 1 ? "s" : ""}`, "success");
  };
  
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
        <p className="font-bold">Error</p>
        <p>{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-2 text-blue-600 hover:text-blue-800 underline"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-600">Order not found.</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-blue-600 hover:text-blue-800 underline"
        >
          Go Back
        </button>
      </div>
    );
  }

  const deliverySteps = getDeliverySteps();
  const isDelivered = ["delivered", "completed"].includes(orderDetails.status);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white shadow-lg rounded-2xl overflow-hidden">
          <div className="p-8">
            <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
              Order Information
            </h1>

            {/* Product Information */}
            <div className="flex flex-col md:flex-row gap-8 mb-8">
              {/* Product Image */}
              <div className="flex-shrink-0">
                {orderDetails.product.image_urls && orderDetails.product.image_urls.length > 0 ? (
                  <img
                    src={orderDetails.product.image_urls[0]}
                    alt={orderDetails.product.name}
                    className="w-40 h-40 object-cover rounded-lg bg-gray-200"
                  />
                ) : (
                  <div className="w-40 h-40 bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400 text-5xl">📱</span>
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-3" style={{ color: '#004AAD' }}>
                  {orderDetails.product.name}
                </h2>
                <p className="text-gray-600 mb-4 text-lg">
                  {orderDetails.product.description}
                </p>
                
                <div className="flex gap-3 text-sm items-center flex-wrap mb-4">
                  {orderDetails.product.category_name && (
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                      {orderDetails.product.category_name}
                    </span>
                  )}
                  {orderDetails.product.condition && (
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                      {orderDetails.product.condition}
                    </span>
                  )}
                  {orderDetails.product.location && (
                    <span className="text-gray-500 flex items-center gap-1">
                      📍 {orderDetails.product.location}
                    </span>
                  )}
                </div>

                <div className="mt-6">
                  <span className="text-3xl font-bold" style={{ color: '#F4A300' }}>
                    €{orderDetails.product.price}
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery Information */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">DELIVERY OPTION</h3>
              <p className="text-gray-700 mb-3 text-lg">Standard delivery - Same Day Delivery</p>
              <p className="text-gray-700 mb-2">
                <span className="font-medium">Pickup:</span> 
                <span className="text-gray-500 ml-2 flex items-center gap-1">
                  📍 {orderDetails.pickup_location}
                </span>
              </p>
              <p className="text-gray-700 mb-4">
                <span className="font-medium">Dropoff:</span> 
                <span className="text-gray-500 ml-2 flex items-center gap-1">
                  📍 {orderDetails.dropoff_location}
                </span>
              </p>
              
              {/* Delivery Fee Section */}
              <div className="bg-gray-50 rounded-lg p-4 mt-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-700">Delivery Fee:</span>
                  <span className="text-lg font-bold" style={{ color: '#F4A300' }}>
                    €{orderDetails.delivery_fee}
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery Progress - Horizontal */}
            <div className="mb-8">
              <div className="relative">
                {/* Progress Line */}
                <div className="absolute top-4 left-8 right-8 h-0.5 bg-gray-300 z-0">
                  <div 
                    className="h-full transition-all duration-500"
                    style={{ 
                      backgroundColor: '#3A1078',
                      width: `${(deliverySteps.filter(step => step.completed).length - 1) * 25}%`
                    }}
                  />
                </div>

                {/* Steps Container */}
                <div className="flex justify-between items-start relative z-10">
                  {deliverySteps.map((step) => (
                    <div key={step.step} className="flex flex-col items-center flex-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-2 ${
                        step.completed 
                          ? 'text-white' 
                          : 'bg-gray-300 text-gray-600'
                      }`}
                      style={step.completed ? { backgroundColor: '#3A1078' } : {}}
                      >
                        {step.step}
                      </div>
                      <p className={`text-sm font-medium text-center px-2 leading-tight ${
                        step.completed ? 'text-gray-900' : 'text-gray-500'
                      }`}>
                        {step.title}
                      </p>
                      {step.date && (
                        <p className="text-xs text-gray-500 mt-1 text-center">
                          {new Date(step.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {isDelivered && (
                <div className="text-center mt-8">
                  <p className="font-bold text-lg mb-2" style={{ color: '#3A1078' }}>
                    Your order has been Delivered.
                  </p>
                  <p className="text-gray-600">
                    {orderDetails.delivery_date && new Date(orderDetails.delivery_date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              )}
            </div>

            {/* Rating Section */}
            {isDelivered && (
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-8 h-8 cursor-pointer transition-colors ${
                        star <= (tempRating || rating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                      onMouseEnter={() => setTempRating(star)}
                      onMouseLeave={() => setTempRating(0)}
                      onClick={() => handleRatingClick(star)}
                    />
                  ))}
                </div>
                <button
                  onClick={handleReviewSubmit}
                  className="bg-black text-white px-12 py-3 rounded-md font-medium hover:bg-gray-800 transition-colors"
                >
                  Submit
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-6">
          <button
            onClick={() => navigate(-1)}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Previous Orders
          </button>
        </div>
      </div>
    </div>
  );
}