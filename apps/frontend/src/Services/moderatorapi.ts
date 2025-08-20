import { API_BASE_URL } from '../config';

// Interface for moderator stats
export interface ModeratorStats {
  total_users: number;
  total_listings: number;
  pending_listings: number;
  active_reports: number;
  pending_agents: number;
}

export const getPendingAgents = async () => {
  const response = await fetch(`${API_BASE_URL}/moderator/pending-agents`);
  if (!response.ok) {
    throw new Error('Failed to fetch pending agents');
  }
  return response.json();
};

export const approveAgent = async (agentId: number) => {
  const response = await fetch(`${API_BASE_URL}/moderator/approve-agents/${agentId}`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Failed to approve agent');
  }
  return response.json();
};

export const rejectAgent = async (agentId: number) => {
  const response = await fetch(`${API_BASE_URL}/moderator/reject-agents/${agentId}`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Failed to reject agent');
  }
  return response.json();
};

export const getModeratorStats = async (): Promise<ModeratorStats> => {
  const response = await fetch(`${API_BASE_URL}/moderator/stats`);
  if (!response.ok) {
    throw new Error('Failed to fetch moderator stats');
  }
  return response.json();
};
