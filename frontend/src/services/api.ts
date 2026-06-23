// Dynamically select base URL. Supports VITE_API_URL environment variable.
const getBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  let url = envUrl || 'https://campus-sync-backend-rp4d.onrender.com/api';
  
  // Auto-correct http to https for Render deployment domains to prevent Mixed Content blocks
  if (url.startsWith('http://') && url.includes('.onrender.com')) {
    url = url.replace('http://', 'https://');
  }
  return url;
};

const BASE_URL = getBaseUrl();

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Setup abort controller for a 50-second timeout (accommodates Render free tier cold starts)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 50000);

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMsg = 'An error occurred';
      try {
        const data = await response.json();
        errorMsg = data.message || errorMsg;
      } catch {
        errorMsg = response.statusText || errorMsg;
      }
      throw new Error(errorMsg);
    }

    return response.json() as Promise<T>;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Backend request timed out. Please verify the Flask server is running.');
    }
    throw new Error(err.message || 'Failed to connect to the backend server. Verify your API configuration.');
  }
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, body: any) => request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(endpoint: string, body: any) => request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
};
