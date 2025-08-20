import React, { useState, type FormEvent, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import DeliveryAgentAvailability from "../../Components/DeliveryAgentAvailability";
import DeliveryAgentDetails from "../../Components/DeliveryAgentDetails";
import { DELIVERY_AGENT_SIGNUP } from "../../routes";

import { API_BASE_URL } from "../../config";

interface FormData {
  first_name: string;
  last_name: string;
  user_type: string;
  address: {
    street?: string;
    city?: string;
    state?: string;
    postal_code: string;
  };
  email: string;
  password: string;
  confirm_password: string;
  badge?: string;
  sell_count?: number;
  buy_count?: number;
  joined_date: string;
  profile_pic_url?: string;
  role_id: number;
  phone_number?: string;
  availability?: {
    day: string;
    slots: {
      "08:00-12:00": boolean;
      "12:00-16:00": boolean;
      "16:00-20:00": boolean;
    };
  }[];
  delivery_details?: {
    address: string;
    delivery_items: string;
    transport_mode: string;
    identity_proof: File | null;
  };
  transport_mode?: string;
  category_ids?: string[];
  identity_img_url?: string | null;
  day_of_week?: string[];
  time_slot?: (number | null)[][];
}

interface FormErrors {
  first_name?: string;
  last_name?: string;
  user_type?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
  };
  email?: string;
  password?: string;
  confirm_password?: string;
}

const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [shouldSubmit, setShouldSubmit] = useState(false);

  // Temporary mapping for role_id. Update backend to get the correct role_id.
  const roleMapping: { [key: string]: number } = {
    user: 1, // Assuming role_id for 'user'
    delivery_agent: 2, // Assuming role_id for 'delivery_agent'
  };

  const [formData, setFormData] = useState<FormData>({
    first_name: "",
    last_name: "",
    user_type: "",
    address: {
      street: "",
      city: "",
      state: "",
      postal_code: "",
    },
    email: "",
    password: "",
    confirm_password: "",
    badge: "",
    sell_count: 0,
    buy_count: 0,
    joined_date: new Date().toISOString().split("T")[0],
    profile_pic_url: "",
    role_id: 0,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (shouldSubmit && formData.day_of_week && formData.time_slot) {
      console.log("Form data in useEffect:", formData);
      submitForm();
      setShouldSubmit(false);
    }
  }, [shouldSubmit, formData]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.first_name) {
      newErrors.first_name = "First name is required";
    } else if (formData.first_name.length < 2) {
      newErrors.first_name = "First name must be at least 2 characters";
    }

    if (!formData.last_name) {
      newErrors.last_name = "Last name is required";
    } else if (formData.last_name.length < 2) {
      newErrors.last_name = "Last name must be at least 2 characters";
    }

    if (!formData.user_type) {
      newErrors.user_type = "Role is required";
    }

    if (!formData.address.postal_code) {
      newErrors.address = {
        ...newErrors.address,
        postal_code: "Pincode is required",
      };
    } else if (!/^\d{5}$/.test(formData.address.postal_code)) {
      newErrors.address = {
        ...newErrors.address,
        postal_code: "Pincode must be exactly 5 digits",
      };
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[\w.-]+@([\w-]+\.)?hs-fulda\.de$/.test(formData.email)) {
      newErrors.email =
        "Email is invalid. Please use your university email only.";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password =
        "Password must contain at least one uppercase letter, one lowercase letter, and one number";
    }

    if (!formData.confirm_password) {
      newErrors.confirm_password = "Confirm password is required";
    } else if (formData.confirm_password !== formData.password) {
      newErrors.confirm_password = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDeliveryDetailsSubmit = (details: {
    transport_mode: string;
    category_ids: string[];
    identity_img_url: string | null;
    phone_number: string;
  }) => {
    setFormData((prev) => ({
      ...prev,
      transport_mode: details.transport_mode,
      category_ids: details.category_ids,
      identity_img_url: details.identity_img_url,
      phone_number: details.phone_number,
    }));
    setCurrentStep(3);
  };

  const handleAvailabilitySubmit = (availability: {
    [key: string]: boolean[];
  }) => {
    // Convert availability data to day_of_week and time_slot format
    const availabilityArray = Object.entries(availability)
      .map(([day, slots]) => ({
        day_of_week: day,
        time_slot: slots
          .map((selected, index) => (selected ? index + 1 : null))
          .filter(Boolean),
      }))
      .filter((item) => item.time_slot.length > 0);

    console.log("Converted availability array:", availabilityArray);

    setFormData((prev) => ({
      ...prev,
      day_of_week: availabilityArray.map((item) => item.day_of_week),
      time_slot: availabilityArray.map((item) => item.time_slot),
    }));

    // Set flag to trigger submission after state update
    setShouldSubmit(true);
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name.startsWith("address.")) {
      const addressFieldName = name.split(".")[1] as keyof FormData["address"];
      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [addressFieldName]: value,
        },
      }));
    } else if (name === "user_type") {
      const newRoleId = roleMapping[value] || 0;
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        role_id: newRoleId,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (currentStep === 1) {
      if (validateForm()) {
        if (formData.user_type === "delivery_agent") {
          setCurrentStep(2);
        } else {
          await submitForm();
        }
      }
      return;
    }

    // Handle final submission
    await submitForm();
  };

  const submitForm = async () => {
    setIsSubmitting(true);

    try {
      if (formData.user_type === "delivery_agent") {
        // Create delivery agent specific payload
        const deliveryAgentPayload = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          password: formData.password,
          phone_number: formData.phone_number || "",
          transport_mode: formData.transport_mode || "",
          category_ids: Array.isArray(formData.category_ids)
            ? formData.category_ids
            : [formData.category_ids].filter(Boolean),
          identity_img_url: formData.identity_img_url || null,
          day_of_week: formData.day_of_week || [],
          time_slot: formData.time_slot || [],
        };

        console.log("Delivery Agent Payload:", deliveryAgentPayload);

        const response = await fetch(
          `${API_BASE_URL}${DELIVERY_AGENT_SIGNUP}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(deliveryAgentPayload),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Registration failed");
        }

        showToast(
          "Registration successful! Wait for Moderator approval.",
          "success"
        );
        navigate("/login");
      } else {
        // Keep existing user signup flow unchanged
        const res = await fetch(`${API_BASE_URL}/users/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (!res.ok) {
          const errorData = await res.json();
          showToast(
            errorData.message || "Failed to signup. Please try again.",
            "error"
          );
          return;
        }
        showToast("Signup successful! Please log in.", "success");
        navigate("/login");
      }
    } catch (error) {
      console.error("Registration error:", error);
      showToast(
        error instanceof Error ? error.message : "Registration failed",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (currentStep === 2 && formData.user_type === "delivery_agent") {
    return (
      <DeliveryAgentDetails
        onNext={handleDeliveryDetailsSubmit}
        onBack={handleBack}
      />
    );
  }

  if (currentStep === 3 && formData.user_type === "delivery_agent") {
    return (
      <DeliveryAgentAvailability
        onNext={handleAvailabilitySubmit}
        onBack={handleBack}
      />
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-xl mx-auto mt-8 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="first_name" className="block text-lg mb-1">
              First Name *
            </label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:outline-none focus:border-black"
            />
            {errors.first_name && (
              <p className="text-red-500 text-sm mt-1">{errors.first_name}</p>
            )}
          </div>

          <div>
            <label htmlFor="last_name" className="block text-lg mb-1">
              Last Name *
            </label>
            <input
              type="text"
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:outline-none focus:border-black"
            />
            {errors.last_name && (
              <p className="text-red-500 text-sm mt-1">{errors.last_name}</p>
            )}
          </div>

          <div>
            <label htmlFor="user_type" className="block text-lg mb-1">
              Role *
            </label>
            <select
              id="user_type"
              name="user_type"
              value={formData.user_type}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:outline-none focus:border-black appearance-none bg-white"
            >
              <option value="">Select your role</option>
              <option value="delivery_agent">Delivery Agent</option>
              <option value="user">User</option>
            </select>
            {errors.user_type && (
              <p className="text-red-500 text-sm mt-1">{errors.user_type}</p>
            )}
          </div>

          <div>
            <label htmlFor="street" className="block text-lg mb-1">
              Street
            </label>
            <input
              type="text"
              id="street"
              name="address.street"
              value={formData.address.street}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:outline-none focus:border-black"
            />
            {errors.address?.street && (
              <p className="text-red-500 text-sm mt-1">
                {errors.address.street}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="city" className="block text-lg mb-1">
              City
            </label>
            <input
              type="text"
              id="city"
              name="address.city"
              value={formData.address.city}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:outline-none focus:border-black"
            />
            {errors.address?.city && (
              <p className="text-red-500 text-sm mt-1">{errors.address.city}</p>
            )}
          </div>

          <div>
            <label htmlFor="state" className="block text-lg mb-1">
              State
            </label>
            <input
              type="text"
              id="state"
              name="address.state"
              value={formData.address.state}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:outline-none focus:border-black"
            />
            {errors.address?.state && (
              <p className="text-red-500 text-sm mt-1">
                {errors.address.state}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="postal_code" className="block text-lg mb-1">
              Pincode *
            </label>
            <input
              type="text"
              id="postal_code"
              name="address.postal_code"
              value={formData.address.postal_code}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:outline-none focus:border-black"
            />
            {errors.address?.postal_code && (
              <p className="text-red-500 text-sm mt-1">
                {errors.address.postal_code}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-lg mb-1">
              Email address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:outline-none focus:border-black"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-lg mb-1">
              Password *
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:outline-none focus:border-black"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirm_password" className="block text-lg mb-1">
              Confirm Password *
            </label>
            <input
              type="password"
              id="confirm_password"
              name="confirm_password"
              value={formData.confirm_password}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:outline-none focus:border-black"
            />
            {errors.confirm_password && (
              <p className="text-red-500 text-sm mt-1">
                {errors.confirm_password}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full p-2 mt-4 text-white bg-[#3A1078] rounded hover:opacity-85 focus:outline-none disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting
              ? "Registering..."
              : formData.user_type === "delivery_agent"
              ? "Next"
              : "Register"}
          </button>

          <div className="text-center mt-4">
            Already have an account?{" "}
            <Link to="/login" className="text-[#3A1078] hover:underline">
              Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignUp;
