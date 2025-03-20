// src/config/api.ts
/**
 * API configuration for the application
 * This centralizes all API URL handling to make deployment to different environments easier
 */

// Use the VITE_API_URL environment variable if available, otherwise fall back to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * API endpoint paths
 */
export const API = {
    // Person endpoints
    persons: {
        base: `${API_BASE_URL}/persons`,
        getAll: `${API_BASE_URL}/persons`,
        getById: (id: string) => `${API_BASE_URL}/persons/${id}`,
        create: `${API_BASE_URL}/persons`,
        update: (id: string) => `${API_BASE_URL}/persons/${id}`,
        delete: (id: string) => `${API_BASE_URL}/persons/${id}`,
        events: (id: string) => `${API_BASE_URL}/persons/${id}/events`,
        relationships: (id: string) => `${API_BASE_URL}/persons/${id}/relationships`,
        family: (id: string) => `${API_BASE_URL}/persons/${id}/family`
    },
    
    // Event endpoints
    events: {
        base: `${API_BASE_URL}/events`,
        getAll: `${API_BASE_URL}/events`,
        getById: (id: string) => `${API_BASE_URL}/events/${id}`,
        create: `${API_BASE_URL}/events`,
        update: (id: string) => `${API_BASE_URL}/events/${id}`,
        delete: (id: string) => `${API_BASE_URL}/events/${id}`
    },
    
    // GEDCOM import endpoints
    gedcom: {
        upload: `${API_BASE_URL}/gedcom/upload`
    },
    
    // Export endpoints
    export: {
        all: `${API_BASE_URL}/export/all`,
        person: (id: string) => `${API_BASE_URL}/export/person/${id}`
    },
    
    // Health check
    health: `${API_BASE_URL}/health`
};

// In your API config file (src/config/api.ts or similar)
export const API = {
    // ... other API endpoints
    db: {
      clear: '/api/db/clear'
    }
  };



export default API;