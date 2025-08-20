import React, { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import { HOME } from "../../routes";
import { useNavigate } from "react-router-dom";
import { authService } from "../../Services/authService";
import { API_BASE_URL } from "../../config";

interface FormData {
  email: string;
  password: string;
  isDeliveryAgent: boolean;
}

interface FormErrors {
  email?: string;
  password?: string;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    isDeliveryAgent: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };



  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      setIsSubmitting(true);
      try {
        const endpoint = formData.isDeliveryAgent
          ? "/delivery-agent/login"
          : "/users/login";

        let headers: Record<string, string> = { "Content-Type": "application/json" };
        let fetchOptions: RequestInit = {
          method: "POST",
          headers,
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        };

        // Add CSRF token for delivery agent login
        if (formData.isDeliveryAgent) {
          try {
            const csrfToken = await authService.fetchAndStoreCsrfToken();
            headers["X-CSRFToken"] = csrfToken;
            fetchOptions.credentials = "include";
          } catch (error) {
            showToast("Failed to get security token. Please try again.", "error");
            return;
          }
        }

        const res = await fetch(`${API_BASE_URL}${endpoint}`, fetchOptions);

        if (!res.ok) {
          const errorData = await res.json();
          showToast(
            errorData.detail || "Failed to login. Please try again.",
            "error"
          );
          return;
        }

        const responseData = await res.json();
        const { token, refresh_token, ...userData } = responseData;

        if (token && refresh_token && userData) {
          authService.setAuthData({ token, refresh_token }, userData);
          showToast("Login successful!", "success");
          if (responseData && responseData["twofa_required"] && responseData.user_id) {
          // Store tokens and user data even if 2FA is required to get the userId
          authService.setAuthData({ token: responseData.token, refresh_token: responseData.refresh_token }, responseData);
          navigate("/login/2fa");
          return;
        }
          navigate(HOME);
        } else {
          showToast("Login failed: Missing user data or token.", "error");
        }
      } catch (error) {
        showToast(
          "An unexpected error occurred. Please try again later.",
          "error"
        );
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-md mx-auto mt-20 p-6">
        <h2 className="text-3xl font-normal mb-12 text-center">Login</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-lg mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-3 border-2 rounded focus:outline-none focus:border-black"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-lg mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-3 border-2 rounded focus:outline-none focus:border-black"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isDeliveryAgent"
              name="isDeliveryAgent"
              checked={formData.isDeliveryAgent}
              onChange={handleChange}
              className="h-4 w-4 text-[#3A1078] focus:ring-[#3A1078] border-gray-300 rounded"
            />
            <label
              htmlFor="isDeliveryAgent"
              className="ml-2 block text-sm text-gray-900"
            >
              I am a delivery agent
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full p-3 text-white bg-[#3A1078] rounded hover:opacity-85 focus:outline-none disabled:opacity-50"
          >
            {isSubmitting ? "Logging in..." : "Login"}
          </button>

          <div className="text-center space-y-4">
            <div>
              {/* Todo : How to handle forget password? */}
              {/* <div className=" text-[#3A1078]">
                Forgot Password? Please Contact Support.
              </div> */}

              <Link to="/signup" className="hover:underline text-[#3A1078]">
                Create an account
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
