// API Configuration
const API_CONFIG = {
  development: {
    baseURL: 'http://localhost:8080/api/v1',
    timeout: 10000
  },
  production: {
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080/api/v1',
    timeout: 10000
  }
};

const environment = process.env.NODE_ENV || 'development';
export const apiConfig = API_CONFIG[environment];

// Export API endpoints for consistency
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    SIGN_IN: '/auth/sign-in',
    SIGN_UP: '/auth/sign-up',
    SIGN_OUT: '/auth/sign-out',
    ME: '/auth/me'
  },
  
  // Admin endpoints
  ADMIN: {
    USERS: '/admin/users',
    LEAGUES: '/admin/leagues',
    SEASONS: '/admin/seasons',
    CLUBS: '/admin/clubs',
    PLAYERS: '/admin/players',
    SEASON_MANAGEMENT: '/admin/season-management'
  },
  
  // Public endpoints
  PUBLIC: {
    LEAGUES: '/public/leagues',
    CLUBS: '/public/clubs',
    PLAYERS: '/public/players',
    SEASONS: (leagueId) => `/public/leagues/${leagueId}/seasons`,
    SEASON_CLUBS: (seasonId) => `/public/seasons/${seasonId}/clubs`,
    SEASON_PLAYERS: (seasonId) => `/public/seasons/${seasonId}/players`
  },
  
  // Health check
  HEALTH: '/health'
};

export default apiConfig;