/**
 * API Configuration
 * Uses environment variables from .env file
 *
 * Required .env variables:
 * - NEXT_PUBLIC_API_URL: Backend API base URL (default: http://localhost:8181/api/v1)
 * - NEXT_PUBLIC_BACKEND_HEALTH_CHECK: Health check endpoint (default: http://localhost:8181/testServer)
 */
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8181/api",
  HEALTH_CHECK:
    process.env.NEXT_PUBLIC_BACKEND_HEALTH_CHECK ||
    "http://localhost:8181/testServer",
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

/**
 * API Endpoints
 * All endpoints are relative to API_CONFIG.BASE_URL
 */
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    SEND_OTP_REGISTER: "/auth/send-otp-register",
    REGISTER: "/auth/register",
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    REFRESH: "/auth/refresh",
    ME: "/auth/me",
    VERIFY_OTP: "/auth/verify-otp",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
    VERIFY_EMAIL: "/auth/verify-email",
  },

  // Users
  USERS: {
    LIST: "/users",
    GET_BY_ID: (id: string) => `/users/${id}`,
    UPDATE: (id: string) => `/users/${id}`,
    DELETE: (id: string) => `/users/${id}`,
    PROFILE: "/users/profile",
    UPDATE_PROFILE: "/users/profile",
    CHANGE_PASSWORD: "/users/change-password",
  },

  // Courses
  COURSES: {
    LIST: "/courses",
    GET_BY_ID: (id: string) => `/courses/${id}`,
    CREATE: "/courses",
    UPDATE: (id: string) => `/courses/${id}`,
    DELETE: (id: string) => `/courses/${id}`,
    ENROLL: (id: string) => `/courses/${id}/enroll`,
    MY_COURSES: "/courses/my-courses",
    STATS: "/courses/stats",
  },

  // Lessons
  LESSONS: {
    LIST: (courseId: string) => `/courses/${courseId}/lessons`,
    GET_BY_ID: (id: string) => `/lessons/${id}`,
    COMPLETE: (id: string) => `/lessons/${id}/complete`,
  },
};

/**
 * Health Check Function
 * Checks if backend server is running
 */
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(API_CONFIG.HEALTH_CHECK);
    return response.ok;
  } catch (error) {
    console.error("Backend health check failed:", error);
    return false;
  }
};
