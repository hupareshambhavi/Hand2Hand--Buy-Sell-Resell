import type { Product } from "./productapi";
import { API_BASE_URL } from "../config";


// Fetch product list for currently logged in user
export const fetchUserListings = async (userId: number): Promise<Product[]> => {
    try {
      const url = `${API_BASE_URL}/users/my-listings/${userId}`;
  
      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const userListings = await response.json()
      return userListings
    } catch (error) {
      console.error("Fetch Error:", error);
      throw new Error(error instanceof Error ? error.message : "Unexpected fetch error");
    }
  };

// Make 2FA setup request for user
export const setup2FA = async (userId: number): Promise<{ provisioning_uri: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/2fa/setup?user_id=${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || "Failed to setup 2FA");
    }
    
    return await response.json();
  } catch (error) {
    console.error("2FA Setup Error:", error);
    throw new Error(error instanceof Error ? error.message : "Unexpected setup error");
  }
};

// Make 2FA verification request for user
export const verify2FA = async (userId: number, code: string): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/2fa/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, code }),
    });
    
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || "Invalid 2FA code");
    }
    
    return await response.json();
  } catch (error) {
    console.error("2FA Verification Error:", error);
    throw new Error(error instanceof Error ? error.message : "Unexpected verification error");
  }
};