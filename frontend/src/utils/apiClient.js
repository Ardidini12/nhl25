import { apiConfig } from '../config/api.js';

// API Client with automatic token refresh and retry logic
class ApiClient {
  constructor(baseURL = apiConfig.baseURL) {
    this.baseURL = baseURL;
    this.retryCount = 3;
    this.retryDelay = 1000; // 1 second
    this.timeout = apiConfig.timeout;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = localStorage.getItem('token');
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    return this.requestWithRetry(url, defaultOptions);
  }

  async requestWithRetry(url, options, attempt = 1) {
    try {
      const response = await fetch(url, options);
      
      // If token is expired, clear it and redirect
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        // Trigger auth context update
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'token',
          oldValue: localStorage.getItem('token'),
          newValue: null
        }));
      }

      return response;
    } catch (error) {
      // Network error - retry if we haven't exceeded retry count
      if (attempt < this.retryCount && this.isNetworkError(error)) {
        console.log(`Request failed, retrying (${attempt}/${this.retryCount})...`);
        await this.delay(this.retryDelay * attempt);
        return this.requestWithRetry(url, options, attempt + 1);
      }
      
      throw error;
    }
  }

  isNetworkError(error) {
    return error.name === 'TypeError' || error.message.includes('fetch');
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Convenience methods
  async get(endpoint, options = {}) {
    return this.request(endpoint, { method: 'GET', ...options });
  }

  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options,
    });
  }

  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options,
    });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { method: 'DELETE', ...options });
  }
}

export const apiClient = new ApiClient();
export default apiClient;