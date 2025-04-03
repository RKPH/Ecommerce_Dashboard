import axios from "axios";
import { toast } from "react-toastify";

// Base URL for API requests
const BASE_URL = 'https://backend.d2f.io.vn/api/v1';

// Function to get the token from localStorage
const getToken = () => localStorage.getItem("token");
const getReToken = () => localStorage.getItem("refreshToken");

// Create an Axios instance for authenticated requests
const authAxios = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
});

// Create an Axios instance for public requests
const publicAxios = axios.create({
    baseURL: BASE_URL,
});

// Create an Axios instance for normal requests (without credentials)
const normalAxios = axios.create({
    baseURL: BASE_URL,
    withCredentials: false,
});

const refreshTokenAxios = axios.create({
    baseURL: BASE_URL,  // Ensure BASE_URL is defined
    withCredentials: true // Include cookies with requests
});

// **Attach token to headers for all authenticated requests**
authAxios.interceptors.request.use(
    (config) => {
        const token = getToken();
        if (token) {
            config.headers["Authorization"] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);


refreshTokenAxios.interceptors.request.use(
    (config) => {
        const refreshToken = getReToken(); // Ensure this function returns a valid token

        if (refreshToken) {
            config.headers["Authorization"] = `Bearer ${refreshToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// **Handle session expiration and retry logic**
authAxios.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Check if the error is due to an expired token (401 Unauthorized) and retry has not been attempted
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true; // Mark request as retried to avoid infinite loop

            try {
                // Send request to refresh the token
                const response = await refreshTokenAxios.post("/auth/refresh-token");
                const { token: newToken, refreshToken: newRefreshToken } = response.data;

                // Update tokens in local storage
                localStorage.setItem("token", newToken);
                localStorage.setItem("refreshToken", newRefreshToken);

                // Update Authorization header for the retried request
                originalRequest.headers["Authorization"] = `Bearer ${newToken}`;

                // Retry the original request with the new token
                return authAxios(originalRequest);
            } catch (refreshError) {
                console.error("Error refreshing session:", refreshError);

                try {
                    // Call logout API before clearing tokens
                    await authAxios.post("/auth/logout", {
                        refreshToken: localStorage.getItem("refreshToken"),
                    });
                } catch (logoutError) {
                    console.error("Logout API call failed:", logoutError);
                }

                // Clear stored tokens and session data
                localStorage.removeItem("token");
                localStorage.removeItem("refreshToken");
                localStorage.removeItem("isAuthenticated");

                // Redirect user to login page
                window.location.href = "/login";

                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);


export default { authAxios, publicAxios, normalAxios , refreshTokenAxios };
