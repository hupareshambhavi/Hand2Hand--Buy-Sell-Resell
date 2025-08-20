import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import { API_BASE_URL } from "../../config";

const BookDeliveryPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [formData, setFormData] = useState({
    productId: "",
    pickupAddress: "",
    deliveryAddress: "",
    pickupDate: "",
    pickupTime: "",
    itemDescription: "",
    specialInstructions: "",
    deliveryMode: "standard",
  });

  useEffect(() => {
    const userData = localStorage.getItem("currentUser");
    if (userData) {
      try {
        const parsedUserData = JSON.parse(userData);
        setCurrentUser(parsedUserData);
      } catch (error) {
        showToast("Error loading user data. Please log in again.", "error");
        navigate("/login");
      }
    } else {
      showToast("Please log in to book a delivery.", "error");
      navigate("/login");
    }
  }, [navigate, showToast]);

  // Get today's date in YYYY-MM-DD format using local timezone
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const todayFormatted = `${year}-${month}-${day}`;

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prevState) => {
      const newState = {
        ...prevState,
        [name]: value,
      };
      
      // If pickup date is today, force express delivery
      if (name === "pickupDate" && value === todayFormatted) {
        newState.deliveryMode = "express";
      }
      
      return newState;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser || !currentUser.user_id) {
      showToast("Please log in to book a delivery.", "error");
      return;
    }

    if (!formData.productId) {
      showToast("Product ID is required to book delivery.", "error");
      return;
    }

    setLoading(true);

    try {
      const deliveryDateTime =
        formData.pickupDate && formData.pickupTime
          ? new Date(
              `${formData.pickupDate}T${formData.pickupTime}`
            ).toISOString()
          : null;

      const deliveryFee = formData.deliveryMode === "express" ? 18.0 : 13.0;

      const requestData = {
        product_id: parseInt(formData.productId),
        pickup_location: formData.pickupAddress,
        dropoff_location: formData.deliveryAddress,
        delivery_fee: deliveryFee,
        delivery_date_time: deliveryDateTime,
        buyer_id: currentUser.user_id,
        delivery_notes:
          formData.specialInstructions || formData.itemDescription,
        delivery_mode: formData.deliveryMode,
      };

      const response = await fetch(
        `${API_BASE_URL}/delivery-agent/create-delivery-request`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to create delivery request"
        );
      }

      await response.json();
      showToast("Payment successful!!", "success");
      showToast("Delivery request created successfully!", "success");

      // Redirect to previous orders page
      navigate("/previous-orders");
    } catch (error) {
      console.error("Error creating delivery request:", error);
      showToast(
        error instanceof Error
          ? error.message
          : "Failed to create delivery request. Please try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmModal(true);
  };

  if (!currentUser) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div
          className="fixed inset-0 backdrop-blur-sm bg-black/10 flex items-center justify-center z-50"
          onClick={() => setShowConfirmModal(false)}
        >
          <div
            className="bg-white p-6 rounded-lg max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              Confirm Payment
            </h3>
            <p className="mb-6 text-gray-700">
              Are you sure you want to pay and book this delivery?
            </p>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  handleSubmit(
                    new Event("submit") as unknown as React.FormEvent
                  );
                }}
                className="flex-1 px-4 py-2 bg-[#3A1078] text-white rounded-lg hover:bg-[#2A0A5A] transition"
              >
                Yes, Confirm
              </button>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="bg-white shadow-lg rounded-2xl overflow-hidden">
        <div className="p-8">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-4">
            Book a Delivery
          </h1>

          <form onSubmit={handleConfirmAndSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="productId"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    Product ID*
                  </label>
                  <input
                    type="number"
                    id="productId"
                    name="productId"
                    required
                    min="1"
                    value={formData.productId}
                    onChange={handleChange}
                    className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="Enter product ID"
                  />
                </div>

                <div>
                  <label
                    htmlFor="pickupAddress"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    Pickup Address*
                  </label>
                  <input
                    type="text"
                    id="pickupAddress"
                    name="pickupAddress"
                    required
                    value={formData.pickupAddress}
                    onChange={handleChange}
                    className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  />
                </div>

                <div>
                  <label
                    htmlFor="deliveryAddress"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    Delivery Address*
                  </label>
                  <input
                    type="text"
                    id="deliveryAddress"
                    name="deliveryAddress"
                    required
                    value={formData.deliveryAddress}
                    onChange={handleChange}
                    className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="deliveryMode"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    Delivery Mode*
                  </label>
                  <select
                    id="deliveryMode"
                    name="deliveryMode"
                    required
                    value={formData.deliveryMode}
                    onChange={handleChange}
                    disabled={formData.pickupDate === todayFormatted}
                    className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="standard" disabled={formData.pickupDate === todayFormatted}>
                      Standard
                    </option>
                    <option value="express">Express</option>
                  </select>
                  {formData.pickupDate === todayFormatted && (
                    <p className="text-sm text-blue-600 mt-1">
                      Express delivery is required for same-day pickup
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="pickupDate"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    Pickup Date*
                  </label>
                  <input
                    type="date"
                    id="pickupDate"
                    name="pickupDate"
                    required
                    min={todayFormatted}
                    value={formData.pickupDate}
                    onChange={handleChange}
                    className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  />
                </div>

                <div>
                  <label
                    htmlFor="pickupTime"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    Pickup Time*
                  </label>
                  <input
                    type="time"
                    id="pickupTime"
                    name="pickupTime"
                    required
                    value={formData.pickupTime}
                    onChange={handleChange}
                    className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  />
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="itemDescription"
                className="block mb-1 font-medium text-gray-700"
              >
                Item Description*
              </label>
              <textarea
                id="itemDescription"
                name="itemDescription"
                required
                value={formData.itemDescription}
                onChange={handleChange}
                rows={3}
                className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label
                htmlFor="specialInstructions"
                className="block mb-1 font-medium text-gray-700"
              >
                Special Instructions
              </label>
              <textarea
                id="specialInstructions"
                name="specialInstructions"
                value={formData.specialInstructions}
                onChange={handleChange}
                rows={2}
                className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Delivery Fee Breakdown
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-700">Standard Delivery:</span>
                  <span className="font-medium">€13.00</span>
                </div>
                {formData.deliveryMode === "express" && (
                  <div className="flex justify-between">
                    <span className="text-gray-700">Same-day Delivery:</span>
                    <span className="font-medium">+€5.00</span>
                  </div>
                )}
                <div className="border-t border-gray-300 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-gray-900">
                      Total Delivery Fee:
                    </span>
                    <span className="text-lg font-semibold text-gray-900">
                      {formData.deliveryMode === "express"
                        ? "€18.00"
                        : "€13.00"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-[#3A1078] text-white px-6 py-2 rounded-md hover:bg-[#2A0A5A] focus:outline-none focus:ring-2 focus:ring-[#3A1078] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating..." : "Pay and Book Delivery"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookDeliveryPage;
