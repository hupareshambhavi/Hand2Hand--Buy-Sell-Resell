import { API_BASE_URL } from "../config";

interface AuthTokens {
  token: string;
  refresh_token: string;
}

interface UserData {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  user_type: string;
  role_name?: string;
  [key: string]: any;
}

class AuthService {
  private static instance: AuthService;
  private refreshPromise: Promise<AuthTokens> | null = null;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  setAuthData(tokens: AuthTokens, userData: UserData): void {
    localStorage.setItem('token', tokens.token);
    localStorage.setItem('refresh_token', tokens.refresh_token);
    localStorage.setItem('currentUser', JSON.stringify(userData));
    localStorage.setItem('userId', userData.user_id.toString());
    localStorage.setItem('userType', userData.user_type);
  }

  // Set CSRF token for delivery agent
  setCsrfToken(csrfToken: string): void {
    localStorage.setItem('csrf_token', csrfToken);
  }

  // Get CSRF token
  getCsrfToken(): string | null {
    return localStorage.getItem('csrf_token');
  }

  // Fetch and store CSRF token
  async fetchAndStoreCsrfToken(): Promise<string> {
    try {
      const response = await fetch(`${API_BASE_URL}/delivery-agent/csrf-token`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to get CSRF token');
      }

      const data = await response.json();
      const csrfToken = data.csrf_token;
      
      if (!csrfToken) {
        throw new Error('CSRF token not found in response');
      }

      this.setCsrfToken(csrfToken);
      return csrfToken;
    } catch (error) {
      console.error('Error getting CSRF token:', error);
      throw error;
    }
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  getCurrentUser(): UserData | null {
    const userData = localStorage.getItem('currentUser');
    return userData ? JSON.parse(userData) : null;
  }

  clearAuthData(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userId');
    localStorage.removeItem('csrf_token'); // Also clear CSRF token
  }

  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getCurrentUser();
  }

  async refreshToken(): Promise<AuthTokens> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const refresh_token = this.getRefreshToken();
    if (!refresh_token) {
      throw new Error('No refresh token available');
    }

    this.refreshPromise = fetch(`${API_BASE_URL}/users/token/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token }),
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Failed to refresh token');
        }
        const data = await response.json();
        this.setAuthData(
          { token: data.access_token, refresh_token: data.refresh_token },
          this.getCurrentUser()!
        );
        return {
          token: data.access_token,
          refresh_token: data.refresh_token,
        };
      })
      .finally(() => {
        this.refreshPromise = null;
      });

    return this.refreshPromise;
  }

  async getAuthHeader(): Promise<{ Authorization: string }> {
    const token = this.getToken();
    if (!token) {
      throw new Error('No token available');
    }

    try {
      return { Authorization: `Bearer ${token}` };
    } catch (error) {
      const newTokens = await this.refreshToken();
      return { Authorization: `Bearer ${newTokens.token}` };
    }
  }

  // Get headers for delivery agent API calls (includes CSRF token)
  getDeliveryAgentHeaders(): { Authorization: string; 'X-CSRFToken': string; 'Content-Type': string } | null {
    const token = this.getToken();
    const csrfToken = this.getCsrfToken();
    
    if (!token || !csrfToken) {
      return null;
    }

    return {
      'Authorization': `Bearer ${token}`,
      'X-CSRFToken': csrfToken,
      'Content-Type': 'application/json',
    };
  }
}

export const authService = AuthService.getInstance(); 