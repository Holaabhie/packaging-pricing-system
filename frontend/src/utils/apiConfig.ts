/**
 * Centralized API configuration.
 * Uses VITE_API_URL env variable in production, falls back to localhost for dev.
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
    const url = `${API_BASE_URL}${path}`;
    return fetch(url, options);
}

export { API_BASE_URL };
