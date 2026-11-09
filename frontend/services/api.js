/**
 * CLINOVA API Client
 * Facilitates REST communication between React frontend and Python backend.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export async function fetchHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.warn('API Health Check Error:', error);
    return {
      status: 'offline',
      database: 'disconnected',
      storage: 'unavailable',
      engine: 'unreachable',
      error: error.message,
    };
  }
}

export async function fetchSystemInfo() {
  try {
    const response = await fetch(`${API_BASE_URL}/info`);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.warn('System Info Fetch Error:', error);
    return null;
  }
}

