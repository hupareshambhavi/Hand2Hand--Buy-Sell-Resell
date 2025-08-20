import { API_BASE_URL } from '../config';
import { authService } from './authService';

// Interface for delivery agent stats
export interface DeliveryAgentStats {
  pending_requests: number;
  accepted_deliveries: number;
  completed_deliveries: number;
  total_earnings: number;
}

export const getDeliveryAgentStats = async (agentId: number): Promise<DeliveryAgentStats> => {
  // Get headers with CSRF token and authentication
  const headers = authService.getDeliveryAgentHeaders();
  if (!headers) {
    throw new Error('Authentication required. Please login again.');
  }

  const response = await fetch(`${API_BASE_URL}/delivery-agent/stats/${agentId}`, {
    method: 'GET',
    headers,
    credentials: 'include',
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Authentication expired. Please login again.');
    }
    throw new Error('Failed to fetch delivery agent stats');
  }
  return response.json();
};

// Other delivery agent API functions can be added here as needed
export const getPendingRequests = async (agentId: number) => {
  // Get headers with CSRF token and authentication
  const headers = authService.getDeliveryAgentHeaders();
  if (!headers) {
    throw new Error('Authentication required. Please login again.');
  }

  const response = await fetch(`${API_BASE_URL}/delivery-agent/pending-requests/${agentId}`, {
    method: 'GET',
    headers,
    credentials: 'include',
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Authentication expired. Please login again.');
    }
    throw new Error('Failed to fetch pending requests');
  }
  return response.json();
};

export const getAcceptedDeliveries = async (agentId: number) => {
  // Get headers with CSRF token and authentication
  const headers = authService.getDeliveryAgentHeaders();
  if (!headers) {
    throw new Error('Authentication required. Please login again.');
  }

  const response = await fetch(`${API_BASE_URL}/delivery-agent/accepted-deliveries/${agentId}`, {
    method: 'GET',
    headers,
    credentials: 'include',
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Authentication expired. Please login again.');
    }
    throw new Error('Failed to fetch accepted deliveries');
  }
  return response.json();
};

export const getPreviousDeliveries = async (agentId: number) => {
  // Get headers with CSRF token and authentication
  const headers = authService.getDeliveryAgentHeaders();
  if (!headers) {
    throw new Error('Authentication required. Please login again.');
  }

  const response = await fetch(`${API_BASE_URL}/delivery-agent/previous-deliveries/${agentId}`, {
    method: 'GET',
    headers,
    credentials: 'include',
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Authentication expired. Please login again.');
    }
    throw new Error('Failed to fetch previous deliveries');
  }
  return response.json();
};
