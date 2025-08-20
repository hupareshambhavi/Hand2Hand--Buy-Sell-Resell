import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastProvider } from "./context/ToastContext";
import Navbar from "./Components/Navbar";
import Footer from "./Components/Footer";
import HomePage from "./Pages/User/HomePage";
import AddProduct from "./Pages/User/AddProduct";
import Login from "./Pages/User/Login";
import SignUp from "./Pages/User/SignUp";
import ModeratorHomepage from "./Pages/Moderator/ModeratorHomePage"; // Add this import
import AgentHomePage from "./Pages/DeliveryAgent/AgentHomePage"; // Add this import
import AcceptedDeliveries from "./Components/AcceptedDeliveries";
import PendingRequest from "./Components/PendingRequest";
import ApproveAgents from "./Pages/Moderator/ApproveAgents";
import TwoFALogin from "./Pages/User/TwoFALogin";
import PostWantedPage from "./Components/Wanted";

import {
  ADD_PRODUCT,
  HOME,
  LOGIN,
  PRODUCT_DETAILS,
  SIGNUP,
  FAVORITE,
  PREVIOUS_ORDERS,
  MY_LISTINGS,
  EDIT_LISTING,
  BOOK_DELIVERY,
  MODERATOR_APPROVE_AGENTS,
  TWOFA_LOGIN_VERIFY,
} from "./routes";

import ProductDetailPage from "./Pages/User/ProductDetailPage";
import PreviousOrders from "./Pages/User/PreviousOrders";
import Favorites from "./Pages/User/Favourite";
import ChatList from "./Pages/User/ChatList";
import ChatRoom from "./Pages/User/ChatRoom";
import MyListings from "./Pages/User/MyListings";
import OrderDetails from "./Pages/User/OrderDetails";
import ReportedProducts from "./Pages/Moderator/ReportedProduct";
import Listings from "./Pages/Moderator/Listings";
import EditProfile from "./Pages/User/EditProfile";
import ModeratorEditProfile from "./Pages/Moderator/ModeratorEditProfile";

import EditProduct from "./Pages/User/EditProduct";
import BookDeliveryPage from "./Pages/Delivery/BookDeliveryPage";
import DeliveryDetails from "./Pages/DeliveryAgent/DeliveryDetail";
import SearchWantedPage from "./Components/SearchWanted";

// Layout component that provides consistent background styling
const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 to-gray-50 flex flex-col">
      <main className="pt-6 px-4 sm:px-6 lg:px-8 flex-grow">{children}</main>
    </div>
  );
};

// Role-based Home Component
const RoleBasedHome = () => {
  const getCurrentUser = () => {
    try {
      const currentUser = localStorage.getItem("currentUser");
      return currentUser ? JSON.parse(currentUser) : null;
    } catch (error) {
      return null;
    }
  };

  const currentUser = getCurrentUser();
  const token = localStorage.getItem("token");

  // If no user or token, show regular home page
  if (!currentUser || !token) {
    return <HomePage />;
  }

  // Redirect based on user role
  const userRole = currentUser.user_type || currentUser.role_name;
  if (userRole === "moderator") {
    return <ModeratorHomepage />;
  } else if (userRole === "delivery_agent") {
    return <AgentHomePage />;
  } else {
    return <HomePage />;
  }
};

// Protected Route Component for authentication
const ProtectedRoute = ({
  children,
  requiredRole,
}: {
  children: React.ReactNode;
  requiredRole?: string;
}) => {
  const getCurrentUser = () => {
    try {
      const currentUser = localStorage.getItem("currentUser");
      return currentUser ? JSON.parse(currentUser) : null;
    } catch (error) {
      return null;
    }
  };

  const getJwtToken = () => {
    return localStorage.getItem("token");
  };

  const currentUser = getCurrentUser();
  const token = getJwtToken();

  // If no user or token, redirect to login
  if (!currentUser || !token) {
    return <Login />;
  }

  // If specific role is required, check for it
  if (requiredRole) {
    const userRole = currentUser.user_type || currentUser.role_name;
    if (userRole !== requiredRole) {
      // If user doesn't have required role, redirect to appropriate home
      if (userRole === "moderator") {
        return <ModeratorHomepage />;
      } else if (userRole === "delivery_agent") {
        return <AgentHomePage />;
      } else {
        return <HomePage />;
      }
    }
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <Router>
      <ToastProvider>
        <Navbar />
        <Layout>
          <Routes>
            {/* Public Routes */}
            <Route path={HOME} element={<RoleBasedHome />} />
            <Route path={SIGNUP} element={<SignUp />} />
            <Route path={LOGIN} element={<Login />} />
            <Route path={PRODUCT_DETAILS} element={<ProductDetailPage />} />
            <Route path={TWOFA_LOGIN_VERIFY} element={<TwoFALogin />} />

            {/* Protected User Routes */}
            <Route
              path={ADD_PRODUCT}
              element={
                <ProtectedRoute requiredRole="user">
                  <AddProduct />
                </ProtectedRoute>
              }
            />
            <Route
              path={PREVIOUS_ORDERS}
              element={
                <ProtectedRoute requiredRole="user">
                  <PreviousOrders />
                </ProtectedRoute>
              }
            />
            <Route path="/order-details/:orderId" element={<OrderDetails />} />
            <Route
              path={FAVORITE}
              element={
                <ProtectedRoute requiredRole="user">
                  <Favorites />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chats"
              element={
                <ProtectedRoute requiredRole="user">
                  <ChatList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat/:roomName"
              element={
                <ProtectedRoute requiredRole="user">
                  <ChatRoom />
                </ProtectedRoute>
              }
            />
            <Route
              path="/search-wanted"
              element={
                <ProtectedRoute requiredRole="user">
                  <SearchWantedPage />
                </ProtectedRoute>
              }
            />
            <Route path="/post-wanted" element={<PostWantedPage />} />
            {/* Protected Moderator Routes */}
            <Route
              path="/moderator"
              element={
                <ProtectedRoute requiredRole="moderator">
                  <ModeratorHomepage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/moderator/listings"
              element={
                <ProtectedRoute requiredRole="moderator">
                  {/* Create this component or use ModeratorHomepage */}
                  <Listings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/moderator/reports"
              element={
                <ProtectedRoute requiredRole="moderator">
                  {/* Create a ModeratorReports component */}
                  <ReportedProducts />
                </ProtectedRoute>
              }
            />
            <Route
              path={MODERATOR_APPROVE_AGENTS}
              element={
                <ProtectedRoute requiredRole="moderator">
                  {/* Create a ModeratorApproveAgents component */}
                  <ApproveAgents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/moderator/profile"
              element={
                <ProtectedRoute requiredRole="moderator">
                  {/* Create a ModeratorProfile component */}
                  <ModeratorEditProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/moderator/settings"
              element={
                <ProtectedRoute requiredRole="moderator">
                  {/* Create a ModeratorSettings component */}
                  <ModeratorHomepage />
                </ProtectedRoute>
              }
            />

            {/* Add other user routes as needed */}
            <Route
              path="/post-items"
              element={
                <ProtectedRoute requiredRole="user">
                  {/* Create PostItems component */}
                  <HomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/search-items"
              element={
                <ProtectedRoute requiredRole="user">
                  {/* Create SearchItems component */}
                  <HomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/book-delivery"
              element={
                <ProtectedRoute requiredRole="user">
                  <BookDeliveryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/track-delivery"
              element={
                <ProtectedRoute requiredRole="user">
                  {/* Create TrackDelivery component */}
                  <HomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/edit-profile"
              element={
                <ProtectedRoute requiredRole="user">
                  {/* Create EditProfile component */}
                  <EditProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path={MY_LISTINGS}
              element={
                <ProtectedRoute requiredRole="user">
                  <MyListings />
                </ProtectedRoute>
              }
            />

            <Route
              path={EDIT_LISTING}
              element={
                <ProtectedRoute requiredRole="user">
                  <EditProduct />
                </ProtectedRoute>
              }
            />

            <Route
              path="/accepted-deliveries/:agentId"
              element={<AcceptedDeliveries />}
            />
            <Route
              path="/delivery-details/:requestId"
              element={<DeliveryDetails />}
            />
              
            <Route
              path="/pending-requests/:agentId"
              element={<PendingRequest />}
            />

            <Route path={BOOK_DELIVERY} element={<BookDeliveryPage />} />
            

            {/* Delivery Agent Routes */}
            <Route
              path="/delivery-agent"
              element={
                <ProtectedRoute requiredRole="delivery_agent">
                  <AgentHomePage />
                </ProtectedRoute>
              }
            />

            {/* Fallback route */}
            <Route path="*" element={<HomePage />} />
            <Route path="/chats" element={<ChatList />} />
            <Route path="/chat/:roomName" element={<ChatRoom />} />
          </Routes>
        </Layout>
        <Footer />
      </ToastProvider>
    </Router>
  );
}
