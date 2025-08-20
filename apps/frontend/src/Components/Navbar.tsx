import React, { useEffect, useState, useRef } from "react";
import { ChevronDown, User, Shield, Truck } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Logo from "../assets/Images/logo.png";
import { HOME } from "../routes";
import { authService } from "../Services/authService";

// LocalStorage utility functions
const getCurrentUser = (): any | null => {
  try {
    const currentUser = localStorage.getItem("currentUser");
    return currentUser ? JSON.parse(currentUser) : null;
  } catch (error) {
    console.error("Error parsing currentUser from localStorage:", error);
    return null;
  }
};


// Logout function
const useLogoutHandler = (closeDropdowns?: () => void) => {
  const navigate = useNavigate();
  
  return async () => {
    // Close any open dropdowns first
    if (closeDropdowns) {
      closeDropdowns();
    }
    
    // Clear authentication data using authService
    await authService.clearAuthData();
    
    // Check if user is already on homepage
    const currentPath = window.location.pathname;
    if (currentPath === HOME || currentPath === '/') {
      // Force a page refresh to update the homepage content
      window.location.reload();
    } else {
      // Navigate to home page
      navigate(HOME);
    }
  };
};

// Guest Navbar Component
const GuestNavbar: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <header className="bg-[#3A1078] shadow-lg border-b border-blue-900">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center hover:opacity-80 transition-opacity"
          >
            <img
              src={Logo}
              alt="Logo"
              className="w-12 h-12 rounded-full mr-3 shadow-md"
            />
            <h1 className="text-2xl font-bold text-white">Hand2Hand</h1>
          </Link>

          {/* Guest Navigation */}
          <div className="flex items-center gap-4">
            {/* Show Register button only if not on signup page */}
            {currentPath !== "/signup" && (
              <Link
                to="/signup"
                className="px-4 py-2 text-white hover:text-[#1E3A8A] hover:bg-[#E0E7FF] rounded-lg transition-all font-medium"
              >
                Register
              </Link>
            )}

            {/* Show Login button only if not on login page */}
            {currentPath !== "/login" && (
              <Link
                to="/login"
                className="px-4 py-2 text-white hover:text-[#1E3A8A] hover:bg-[#E0E7FF] rounded-lg transition-all font-medium"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

// User Navbar Component
const UserNavbar: React.FC = () => {
  const [showWantedDropdown, setShowWantedDropdown] = useState(false);
  const [showDeliveryDropdown, setShowDeliveryDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeChatCount, setActiveChatCount] = useState(0);

  // Refs for dropdown containers
  const wantedDropdownRef = useRef<HTMLDivElement>(null);
  const deliveryDropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // You can adjust this API base URL to match your backend
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);

    // Fetch active chat count when user is loaded
    if (user && user.user_id) {
      fetchActiveChatCount(user.user_id);
    }
  }, []);

  // Click outside functionality
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wantedDropdownRef.current && !wantedDropdownRef.current.contains(event.target as Node)) {
        setShowWantedDropdown(false);
      }
      if (deliveryDropdownRef.current && !deliveryDropdownRef.current.contains(event.target as Node)) {
        setShowDeliveryDropdown(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };

    // Add event listener when any dropdown is open
    if (showWantedDropdown || showDeliveryDropdown || showProfileDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Cleanup event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showWantedDropdown, showDeliveryDropdown, showProfileDropdown]);

  const fetchActiveChatCount = async (userId: string | number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/chats/count/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setActiveChatCount(data.active_chats_count || 0);
      }
    } catch (err) {
      console.error("Error fetching chat count:", err);
      // Keep the default count of 3 if API fails
      setActiveChatCount(3);
    }
  };

  const closeAllDropdowns = () => {
    setShowWantedDropdown(false);
    setShowDeliveryDropdown(false);
    setShowProfileDropdown(false);
  };

  const handleLogout = useLogoutHandler(closeAllDropdowns);

  return (
    <header className="bg-[#3A1078] shadow-lg border-b border-blue-900">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo - Now clickable */}
          <Link
            to="/"
            className="flex items-center hover:opacity-80 transition-opacity"
            onClick={closeAllDropdowns}
          >
            <img
              src={Logo}
              alt="Logo"
              className="w-12 h-12 rounded-full mr-3 shadow-md"
            />
            <h1 className="text-2xl font-bold text-white">Hand2Hand</h1>
          </Link>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2">
            {/* Wanted Dropdown */}
            <div className="relative" ref={wantedDropdownRef}>
              <button
                onClick={() => {
                  setShowWantedDropdown(!showWantedDropdown);
                  setShowDeliveryDropdown(false);
                  setShowProfileDropdown(false);
                }}
                className="flex items-center gap-1 px-4 py-2 text-white hover:text-[#1E3A8A] hover:bg-[#E0E7FF] rounded-lg transition-all font-medium"
              >
                Wanted
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    showWantedDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showWantedDropdown && (
                <div className="absolute top-full mt-2 left-0 bg-white border border-gray-200 rounded-lg shadow-xl py-2 min-w-40 z-20">
                  <Link
                    to="/post-wanted"
                    className="block px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-[#004AAD] transition-colors font-medium"
                    onClick={closeAllDropdowns}
                  >
                    Post Items
                  </Link>
                  <Link
                    to="/search-wanted"
                    className="block px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-[#004AAD] transition-colors font-medium"
                    onClick={closeAllDropdowns}
                  >
                    Search Items
                  </Link>
                </div>
              )}
            </div>

            {/* Add Product */}
            <Link
              to="/add-product"
              className="px-4 py-2 text-white hover:text-[#1E3A8A] hover:bg-[#E0E7FF]  rounded-lg transition-all font-medium"
            >
              Add Product
            </Link>

            {/* Delivery Dropdown */}
            <div className="relative" ref={deliveryDropdownRef}>
              <button
                onClick={() => {
                  setShowDeliveryDropdown(!showDeliveryDropdown);
                  setShowWantedDropdown(false);
                  setShowProfileDropdown(false);
                }}
                className="flex items-center gap-1 px-4 py-2 text-white hover:text-[#1E3A8A] hover:bg-[#E0E7FF] rounded-lg transition-all font-medium"
              >
                Delivery
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    showDeliveryDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showDeliveryDropdown && (
                <div className="absolute top-full mt-2 left-0 bg-white border border-gray-200 rounded-lg shadow-xl py-2 min-w-40 z-20">
                  <Link
                    to="/book-delivery"
                    className="block px-4 py-3 text-gray-700 hover:text-[#1E3A8A] hover:bg-[#E0E7FF] transition-colors font-medium"
                    onClick={closeAllDropdowns}
                  >
                    Book Delivery
                  </Link>
                  <Link
                    to="/previous-orders"
                    className="block px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-[#004AAD] transition-colors font-medium"
                    onClick={closeAllDropdowns}
                  >
                    My Orders
                  </Link>
                </div>
              )}
            </div>

            {/* Enhanced Chat with Dynamic Count */}
            <Link
              to="/chats"
              className="relative px-4 py-2 text-white hover:text-[#1E3A8A] hover:bg-[#E0E7FF] rounded-lg transition-all font-medium"
              onClick={closeAllDropdowns}
            >
              Chat
              {activeChatCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md">
                  {activeChatCount > 99 ? "99+" : activeChatCount}
                </span>
              )}
            </Link>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={() => {
                  setShowProfileDropdown(!showProfileDropdown);
                  setShowWantedDropdown(false);
                  setShowDeliveryDropdown(false);
                }}
                className="flex items-center gap-2 px-4 py-2 text-white hover:text-[#1E3A8A] hover:bg-[#E0E7FF] rounded-lg transition-all font-medium"
              >
                <User className="w-4 h-4" />
                {currentUser?.first_name
                  ? `${currentUser.first_name}`
                  : "My Profile"}
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    showProfileDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showProfileDropdown && (
                <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-xl py-2 min-w-44 z-20">
                  <Link
                    to="/edit-profile"
                    className="block px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-[#004AAD] transition-colors font-medium"
                    onClick={closeAllDropdowns}
                  >
                    Edit Profile
                  </Link>
                  <Link
                    to="/my-listings"
                    className="block px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-[#004AAD] transition-colors font-medium"
                    onClick={closeAllDropdowns}
                  >
                    My Listings
                  </Link>
                  <Link
                    to="/favorites"
                    className="block px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-[#004AAD] transition-colors font-medium"
                    onClick={closeAllDropdowns}
                  >
                    Favorites
                  </Link>

                  <hr className="my-2 border-gray-200" />
                  <button
                    className="block px-4 w-full py-3 text-red-600 hover:bg-red-50 transition-colors font-medium text-left"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

// Delivery Agent Navbar Component
const DeliveryAgentNavbar: React.FC = () => {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Ref for dropdown container
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
  }, []);

  // Click outside functionality
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };

    if (showProfileDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileDropdown]);

  const closeAllDropdowns = () => {
    setShowProfileDropdown(false);
  };

  const handleLogout = useLogoutHandler(closeAllDropdowns);
   const agentId = currentUser?.user_id || currentUser?.id;

  return (
    <header className="bg-[#3A1078] shadow-lg border-b border-blue-900">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo - Now clickable */}
          <Link
            to="/"
            className="flex items-center hover:opacity-80 transition-opacity"
            onClick={closeAllDropdowns}
          >
            <img
              src={Logo}
              alt="Logo"
              className="w-12 h-12 rounded-full mr-3 shadow-md"
            />
            <h1 className="text-2xl font-bold text-white">Hand2Hand</h1>
          </Link>

          {/* Delivery Agent Navigation */}
          <div className="flex items-center gap-2">
            {/* Order Requests */}
            <Link
              to={`/pending-requests/${agentId}`}
              className="px-4 py-2 text-white hover:text-[#1E3A8A] hover:bg-[#E0E7FF] rounded-lg transition-all font-medium"
            >
              Order Requests
            </Link>
                
            {/* Accepted Requests */}
            <Link
              to={`/accepted-deliveries/${agentId}`}
              className="px-4 py-2 text-white hover:text-[#1E3A8A] hover:bg-[#E0E7FF] rounded-lg transition-all font-medium"
            >
              Accepted Requests
            </Link>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={() => {
                  setShowProfileDropdown(!showProfileDropdown);
                }}
                className="flex items-center gap-2 px-4 py-2 text-blue-800 bg-blue-100 hover:bg-blue-300 rounded-lg transition-all font-medium"
              >
                <Truck className="w-4 h-4" />
                {currentUser?.first_name
                  ? `${currentUser.first_name} (Agent)`
                  : "My Profile"}
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    showProfileDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showProfileDropdown && (
                <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-xl py-2 min-w-48 z-20">
               

                  <button
                    className="block px-4 w-full py-3 text-red-600 hover:bg-red-50 transition-colors font-medium text-left"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

// Moderator Navbar Component
const ModeratorNavbar: React.FC = () => {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Ref for dropdown container
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
  }, []);

  // Click outside functionality
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };

    if (showProfileDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileDropdown]);

  const closeAllDropdowns = () => {
    setShowProfileDropdown(false);
  };

  const handleLogout = useLogoutHandler(closeAllDropdowns);

  return (
    <header className="bg-[#3A1078] shadow-lg border-b border-blue-900">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center hover:opacity-80 transition-opacity"
            onClick={closeAllDropdowns}
          >
            <img
              src={Logo}
              alt="Logo"
              className="w-12 h-12 rounded-full mr-3 shadow-md"
            />
            <h1 className="text-2xl font-bold text-white">Hand2Hand</h1>
          </Link>

          {/* Moderator Navigation */}
          <div className="flex items-center gap-2">
            {/* Listings */}
            <Link
              to="/moderator/listings"
              className="px-4 py-2 text-white hover:text-[#1E3A8A] hover:bg-[#E0E7FF] rounded-lg transition-all font-medium"
            >
              Listings
            </Link>

            {/* Reports */}
            <Link
              to="/moderator/reports"
              className="px-4 py-2 text-white hover:text-[#1E3A8A] hover:bg-[#E0E7FF] rounded-lg transition-all font-medium"
            >
              Reports
            </Link>

            {/* Approve Agents */}
            <Link
              to="/moderator/approve-agents"
              className="px-4 py-2 text-white hover:text-[#1E3A8A] hover:bg-[#E0E7FF] rounded-lg transition-all font-medium"
            >
              Approve Agents
            </Link>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={() => {
                  setShowProfileDropdown(!showProfileDropdown);
                }}
                className="flex items-center gap-2 px-4 py-2 text-green-800 bg-green-100 hover:bg-green-300 rounded-lg transition-all font-medium"
              >
                <Shield className="w-4 h-4" />
                {currentUser?.first_name
                  ? `${currentUser.first_name} (Moderator)`
                  : "Moderator"}
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    showProfileDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showProfileDropdown && (
                <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-xl py-2 min-w-48 z-20">
                  <Link
                    to="/moderator/profile"
                    className="block px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-[#004AAD] transition-colors font-medium"
                    onClick={closeAllDropdowns}
                  >
                    Edit Profile
                  </Link>

                  <hr className="my-2 border-gray-200" />
                  <button
                    className="block px-4 w-full py-3 text-red-600 hover:bg-red-50 transition-colors font-medium text-left"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

// Main Navbar Component with Real-time Authentication
const Navbar: React.FC = () => {
  const [userType, setUserType] = useState<"guest" | "user" | "moderator" | "delivery_agent">(
    "guest"
  );
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status and user type
  const checkAuthStatus = () => {
    const currentUser = authService.getCurrentUser();
    const token = authService.getToken();

    if (!currentUser || !token) {
      setUserType("guest");
      setIsLoading(false);
      return;
    }

    // Check user type - flexible approach to handle different property names
    const userRole = currentUser.user_type || currentUser.role_name;

    if (userRole === "moderator") {
      setUserType("moderator");
    } else if (userRole === "delivery_agent") {
      setUserType("delivery_agent");
    } else if (userRole === "user") {
      setUserType("user");
    } else {
      // If user type is unclear but user has token, treat as regular user
      setUserType("user");
    }

    setIsLoading(false);
  };

  // Check auth status on component mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Listen for localStorage changes (for real-time updates)
  useEffect(() => {
    const handleStorageChange = () => {
      checkAuthStatus();
    };

    // Listen for storage events (when localStorage changes in other tabs)
    window.addEventListener("storage", handleStorageChange);

    // Check periodically for changes in the same tab
    const interval = setInterval(() => {
      checkAuthStatus();
    }, 1000); // Check every second

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Show loading state briefly
  if (isLoading) {
    return (
      <header className="bg-[#3A1078] shadow-lg border-b border-blue-900">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full mr-3 bg-gray-300 animate-pulse"></div>
              <div className="w-32 h-8 bg-gray-300 animate-pulse rounded"></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-8 bg-gray-300 animate-pulse rounded"></div>
              <div className="w-20 h-8 bg-gray-300 animate-pulse rounded"></div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  // Render appropriate navbar based on user type
  switch (userType) {
    case "moderator":
      return <ModeratorNavbar />;
    case "delivery_agent":
      return <DeliveryAgentNavbar />;
    case "user":
      return <UserNavbar />;
    case "guest":
    default:
      return <GuestNavbar />;
  }
};

export default Navbar;