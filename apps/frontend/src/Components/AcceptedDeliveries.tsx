import React, { useEffect, useState, useCallback } from "react";
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
  payment_method: "cash" | "online";
  product: Product;
  status: "accepted" | "completed";
}

const AcceptedDeliveries: React.FC = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  const [inProgress, setInProgress] = useState<DeliveryRequest[]>([]);
  const [completed, setCompleted] = useState<DeliveryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"inProgress" | "completed">(
    "inProgress"
  );
  const { showToast } = useToast();

  const fetchDeliveries = useCallback(async () => {
    try {
      // Get headers with stored CSRF token
      const headers = authService.getDeliveryAgentHeaders();
      if (!headers) {
        showToast("Authentication required. Please login again.", "error");
        navigate("/login");
        return;
      }

      const response = await fetch(
        `${baseUrl}/delivery-agent/accepted-deliveries/${agentId}`,
        {
          method: "GET",
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
        throw new Error("Failed to fetch deliveries");
      }

      const data = await response.json();
      const accepted = data.filter(
        (d: DeliveryRequest) => d.status === "accepted"
      );
      const done = data.filter(
        (d: DeliveryRequest) => d.status === "completed"
      );
      setInProgress(accepted);
      setCompleted(done);
      if (accepted.length === 0 && done.length === 0) {
        showToast("No deliveries found.", "info");
      }
    } catch (error) {
      console.error("Error loading deliveries:", error);
      showToast("Error loading deliveries. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }, [agentId, baseUrl]);

  useEffect(() => {
    if (agentId) {
      fetchDeliveries();
    } else {
      setLoading(false);
    }
  }, [agentId]);

  const totalEarnings = completed.reduce((sum, d) => sum + d.delivery_fee, 0);

  // Navigate to delivery details page
  const handleViewDetails = (requestId: number) => {
    navigate(`/delivery-details/${requestId}`);
  };

  // const markAsCompleted = async (request_id: number) => {
  //   try {
  //     // Get headers with stored CSRF token
  //     const headers = authService.getDeliveryAgentHeaders();
  //     if (!headers) {
  //       showToast("Authentication required. Please login again.", "error");
  //       navigate("/login");
  //       return;
  //     }

  //     const response = await fetch(`${baseUrl}/delivery-agent/update-status/${request_id}`, {
  //       method: "POST",
  //       headers,
  //       body: JSON.stringify({ status: "completed" }),
  //       credentials: "include",
  //     });
  //     if (!response.ok) throw new Error("Failed to update status");

  //     const delivery = inProgress.find(d => d.request_id === request_id);
  //     if (delivery) {
  //       setInProgress(prev => prev.filter(d => d.request_id !== request_id));
  //       setCompleted(prev => [...prev, { ...delivery, status: "completed" }]);
  //       setActiveTab("completed");
  //       // showToast("Delivery marked as completed", "success"); // intentionally commented
  //     }
  //   } catch (error) {
  //     console.error("Error updating delivery status:", error);
  //     showToast("Error updating delivery status. Please try again.", "error");
  //   }
  // };

  const Card = ({
    delivery,
  }: // showCompleteBtn,
  {
    delivery: DeliveryRequest;
    showCompleteBtn?: boolean;
  }) => (
    <div
      className="bg-white rounded-lg shadow-md p-5 flex items-center space-x-6 hover:shadow-lg transition cursor-pointer max-w-full"
      style={{ minHeight: "100px" }}
    >
      {delivery.product.image_urls[0] ? (
        <img
          src={delivery.product.image_urls[0]}
          alt={delivery.product.name}
          className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
          loading="lazy"
          onClick={() => navigate(`/product/${delivery.product.product_id}`)}
          style={{ cursor: "pointer" }}
        />
      ) : (
        <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 flex-shrink-0">
          No Image
        </div>
      )}

      <div className="flex-grow">
        <h3
          className="text-xl font-semibold text-gray-900 cursor-pointer"
          onClick={() => navigate(`/product/${delivery.product.product_id}`)}
        >
          {delivery.product.name}
        </h3>
        <p className="text-gray-500">{delivery.product.category_name}</p>
        <p className="text-gray-700">
          Price:{" "}
          <span className="font-medium">
            ${delivery.product.price.toFixed(2)}
          </span>
        </p>
        <p className="text-blue-600 font-semibold">
          Delivery Fee: ${delivery.delivery_fee.toFixed(2)}
        </p>
        <p className="inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          Paid Online
        </p>
        
        {/* View Details Button moved to bottom left of content */}
        <div className="mt-4">
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click event
              handleViewDetails(delivery.request_id);
            }}
            className="bg-[#3A1078] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#2d0a5e] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) return <div className="text-center p-10">Loading...</div>;

  if (inProgress.length === 0 && completed.length === 0)
    return <div className="text-center p-10">No deliveries found.</div>;

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-900">
        My Deliveries
      </h1>

      <div className="flex justify-center space-x-6 mb-8 border-b-2 border-gray-200">
        <button
          onClick={() => setActiveTab("inProgress")}
          className={`pb-2 text-xl font-semibold ${
            activeTab === "inProgress"
              ? "border-b-4 border-yellow-500 text-yellow-600"
              : "text-gray-400"
          }`}
        >
          In Progress
        </button>
        <button
          onClick={() => setActiveTab("completed")}
          className={`pb-2 text-xl font-semibold ${
            activeTab === "completed"
              ? "border-b-4 border-green-500 text-green-600"
              : "text-gray-400"
          }`}
        >
          Completed
        </button>
      </div>

      {activeTab === "inProgress" && (
        <>
          {inProgress.length === 0 ? (
            <p className="text-gray-500 text-center">
              No deliveries in progress.
            </p>
          ) : (
            <div className="flex flex-col space-y-6">
              {inProgress.map((d) => (
                <Card key={d.request_id} delivery={d} showCompleteBtn={true} />
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === "completed" && (
        <>
          {completed.length === 0 ? (
            <p className="text-gray-500 text-center">
              No completed deliveries.
            </p>
          ) : (
            <>
              <p className="mb-6 text-center text-purple-700 text-lg font-semibold">
                Total Earnings: ${totalEarnings.toFixed(2)}
              </p>
              <div className="flex flex-col space-y-6">
                {completed.map((d) => (
                  <Card key={d.request_id} delivery={d} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default AcceptedDeliveries;