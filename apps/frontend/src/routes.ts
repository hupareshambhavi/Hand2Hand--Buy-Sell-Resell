// This file defines the routes for the frontend application.

// Backend API routes
export const SEARCH_AND_CREATE_PRODUCTS = '/products';
export const API_PRODUCT_DETAILS = '/products/:id';
export const DELIVERY_AGENT_SIGNUP = '/delivery-agent/signup';



// Frontend UI routes
export const HOME = '/';
export const ADD_PRODUCT = '/add-product';
export const CHAT = '/chats';
export const LOGIN = '/login';
export const SIGNUP = '/signup';
export const PRODUCT_DETAILS = '/product/:id';
export const PRODUCT_DETAILS_GUEST = '/guest/product/:id';
export const FAVORITE='/favorites'
export const PREVIOUS_ORDERS = '/previous-orders';
export const MODERATOR_HOME = '/moderator';
export const DELIVERY_AGENT_HOME = '/delivery-agent';
export const MODERATOR_LISTINGS = '/moderator/listings';
export const MODERATOR_USERS = '/moderator/users';
export const MODERATOR_REPORTS = '/moderator/reports';
export const MODERATOR_APPROVE_AGENTS = '/moderator/approve-agents';

export const ACCEPTED_DELIVERIES = '/accepted-deliveries/:agentId' ;
export const PENDING_DELIVERIES = '/pending-requests/:agentId'

export const MY_LISTINGS = '/my-listings';
export const EDIT_LISTING = '/product/:id/edit';
export const BOOK_DELIVERY = '/book-delivery';
export const TWOFA_LOGIN_VERIFY = '/login/2fa';
