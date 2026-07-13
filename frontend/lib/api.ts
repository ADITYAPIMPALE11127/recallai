interface FetchOptions extends RequestInit {
  token?: string;
  skipAuth?: boolean;
}

// Extend Window interface to include Clerk
declare global {
  interface Window {
    Clerk?: {
      session?: {
        getToken: () => Promise<string | null>;
      };
    };
  }
}

// Django API base URL
const DJANGO_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const apiFetch = async (
  url: string,
  options: FetchOptions = {}
): Promise<Response> => {
  // Check if URL contains 'undefined' - this happens when a variable is undefined
  if (url && url.includes('undefined')) {
    console.error('apiFetch called with URL containing "undefined":', url);
    return Promise.reject(new Error(`Invalid URL: ${url}`));
  }

  // Get token from localStorage
  let token: string | null = localStorage.getItem("access_token");

  // If no token and skipAuth is false, try to get from Clerk global
  if (!token && !options.skipAuth && typeof window !== "undefined") {
    try {
      if (window.Clerk?.session) {
        const sessionToken = await window.Clerk.session.getToken();
        if (sessionToken) {
          token = sessionToken;
          localStorage.setItem("access_token", token);
          console.log("Token refreshed from Clerk");
        }
      }
    } catch (error) {
      console.error("Failed to get Clerk token:", error);
    }
  }

  // Debug: Log token status
  if (!token) {
    console.warn(`No token found for request to ${url}`);
  } else {
    console.log(`API Request to ${url}:`, {
      hasToken: true,
      tokenPreview: `${token.substring(0, 20)}...`,
      method: options.method || "GET",
    });
  }

  // Set headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (token && !options.skipAuth) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Build full URL - use Django API directly
  let fullUrl = url;
  if (!url.startsWith('http')) {
    fullUrl = `${DJANGO_API_URL}${url}`;
  }

  console.log(`Making request to: ${fullUrl}`);

  const response = await fetch(fullUrl, {
    ...options,
    headers,
  });

  // If unauthorized, try to refresh token
  if (response.status === 401 || response.status === 403) {
    console.warn(`Unauthorized request (${response.status}), clearing token`);
    localStorage.removeItem("access_token");

    if (typeof window !== "undefined") {
      try {
        if (window.Clerk?.session) {
          const newToken = await window.Clerk.session.getToken();
          if (newToken) {
            localStorage.setItem("access_token", newToken);
            console.log("Token refreshed after 403/401");
            return apiFetch(url, options);
          }
        }
      } catch (error) {
        console.error("Failed to refresh token:", error);
      }
    }
  }

  return response;
};

// Convenience methods
export const apiGet = (url: string, options?: FetchOptions): Promise<Response> => {
  return apiFetch(url, { ...options, method: "GET" });
};

export const apiPost = (
  url: string,
  data?: any,
  options?: FetchOptions
): Promise<Response> => {
  return apiFetch(url, {
    ...options,
    method: "POST",
    body: data ? JSON.stringify(data) : undefined,
  });
};

export const apiPatch = (
  url: string,
  data?: any,
  options?: FetchOptions
): Promise<Response> => {
  return apiFetch(url, {
    ...options,
    method: "PATCH",
    body: data ? JSON.stringify(data) : undefined,
  });
};

export const apiDelete = (url: string, options?: FetchOptions): Promise<Response> => {
  return apiFetch(url, { ...options, method: "DELETE" });
};