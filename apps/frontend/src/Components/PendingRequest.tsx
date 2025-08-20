import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { authService } from "../Services/authService";

interface Product {
  product_id: number;
  name: string;
  price: number;
  image_urls: string[];
  category_name: string;
}

interface DeliveryRequest {
  request_id: number;
  delivery_fee: number;
  delivery_date: string;
  delivery_notes?: string;
  payment_method: "online";
  pickup_location: string;
  dropoff_location: string;
  product: Product;
}

const PendingRequest: React.FC = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [requests, setRequests] = useState<DeliveryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);

  useEffect(() => {
    if (!agentId) {
      setLoading(false);
      return;
    }

    const fetchRequests = async () => {
      try {
        // Get headers with stored CSRF token
        const headers = authService.getDeliveryAgentHeaders();
        if (!headers) {
          showToast("Authentication required. Please login again.", "error");
          navigate("/login");
          return;
        }

        const response = await fetch(`${baseUrl}/delivery-agent/pending-requests/${agentId}`, {
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
          throw new Error("Failed to fetch requests");
        }

        const data = await response.json();
        setRequests(data);
      } catch (error) {
        console.error("Error loading requests:", error);
        showToast("Failed to load requests", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [agentId, baseUrl, showToast, navigate]);

  const handleAccept = async (requestId: number) => {
    if (!agentId) return;

    setAcceptingId(requestId);

    try {
      // Get headers with stored CSRF token
      const headers = authService.getDeliveryAgentHeaders();
      if (!headers) {
        showToast("Authentication required. Please login again.", "error");
        navigate("/login");
        return;
      }

      const response = await fetch(
        `${baseUrl}/delivery-agent/accept-request/${requestId}/${agentId}`,
        {
          method: "POST",
          headers,
          credentials: "include",
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          showToast("Authentication expired. Please login again.", "error");
          navigate("/login");
          return;
        }
        throw new Error("Accept request failed");
      }

      showToast("Request accepted!", "success");
      navigate(`/accepted-deliveries/${agentId}`);
    } catch (error) {
      console.error("Error accepting request:", error);
      showToast("Failed to accept request", "error");
    } finally {
      setAcceptingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">No Pending Requests</h2>
        <p className="text-gray-500">You're all caught up.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 pb-20">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Pending Requests</h1>

      <div className="space-y-4">
        {requests.map((req) => (
          <div key={req.request_id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 mr-4">
                {req.product.image_urls[0] ? (
                  <img
                    src={req.product.image_urls[0]}
                    alt={req.product.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                    Product
                  </div>
                )}
              </div>

              <div className="flex-grow">
                <h3
                  className="font-bold text-blue-700 hover:underline cursor-pointer"
                  onClick={() => navigate(`/product/${req.product.product_id}`)}
                >
                  {req.product.name}
                </h3>
                <p className="text-sm text-gray-500">{req.product.category_name}</p>

                {req.delivery_notes && (
                  <p className="text-sm text-gray-700 mt-1">
                    <strong>Delivery Notes:</strong> {req.delivery_notes}
                  </p>
                )}

                <div className="mt-2 space-y-1">
                  <div className="text-sm text-gray-700">
                    <strong>Pickup:</strong> {req.pickup_location}
                  </div>
                  <div className="text-sm text-gray-700">
                    <strong>Dropoff:</strong> {req.dropoff_location}
                  </div>
                  <div className="text-sm text-gray-700">
                    <strong>Delivery Date:</strong> {new Date(req.delivery_date).toLocaleDateString()} at {new Date(req.delivery_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>

                <div className="mt-2 text-sm font-semibold text-green-700">
                  Payment Method: Online
                </div>

                <div className="mt-1 text-sm text-gray-800">
                  Collect ${req.delivery_fee.toFixed(2)} as delivery fee.
                </div>
              </div>
            </div>

            <button
              onClick={() => handleAccept(req.request_id)}
              disabled={acceptingId === req.request_id}
              className={`mt-4 w-full py-2 px-4 rounded-lg text-white ${
                acceptingId === req.request_id ? "bg-gray-400 cursor-not-allowed" : "bg-[#3A1078] hover:bg-[#2e0c5f]"
              }`}
            >
              {acceptingId === req.request_id ? "Accepting..." : "Accept Request"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PendingRequest;
