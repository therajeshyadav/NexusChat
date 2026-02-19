import axios from "axios";
const API_BASE = "http://localhost:5000/api";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  status: number;
}

async function mockRequest<T>(
  data: T,
  shouldFail = false,
  delayMs = 800,
): Promise<ApiResponse<T>> {
  await delay(delayMs);
  if (shouldFail) {
    return { error: "Something went wrong. Please try again.", status: 500 };
  }
  return { data, status: 200 };
}

export const authApi = {
  login: async (
    identifier: string,
    password: string,
  ): Promise<{ data?: any; error?: string }> => {
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, {
        identifier,
        password,
      });

      return { data: res.data };
    } catch (err: any) {
      return {
        error: err.response?.data?.message || "Login failed",
      };
    }
  },

  signup: async (
    username: string,
    email: string,
    password: string,
  ): Promise<{ data?: any; error?: string }> => {
    try {
      const res = await axios.post(`${API_BASE}/auth/signup`, {
        username,
        email,
        password,
      });

      return { data: res.data };
    } catch (err: any) {
      return {
        error: err.response?.data?.message || "Signup failed",
      };
    }
  },

  verifyEmail: async (
    email: string,
    otp: string,
  ): Promise<{ data?: any; error?: string }> => {
    try {
      const res = await axios.post(`${API_BASE}/auth/verify-otp`, {
        email,
        otp,
      });

      return { data: res.data };
    } catch (err: any) {
      return {
        error: err.response?.data?.message || "Verification failed",
      };
    }
  },

  forgotPassword: async (
    email: string,
  ): Promise<ApiResponse<{ message: string }>> => {
    const res = await axios.post(`${API_BASE}/auth/forgot-password`, { email });
    return {
      data: res.data,
      status: res.status,
    };
  },

  resetPassword: async (
    token: string,
    password: string,
  ): Promise<{ data?: any; error?: string }> => {
    try {
      const res = await axios.post(`${API_BASE}/auth/reset-password`, {
        token,
        password,
      });

      return { data: res.data };
    } catch (err: any) {
      return {
        error: err.response?.data?.message || "Reset failed",
      };
    }
  },

  googleAuth: () => {
    window.location.href = `${API_BASE}/auth/google`;
  },

  githubAuth: () => {
    window.location.href = `${API_BASE}/auth/github`;
  },

  validateToken: async (token: string) => {
    const res = await axios.get(`${API_BASE}/auth/validate`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return {
      data: res.data,
      status: res.status,
    };
  },

  getMe: (token: string) =>
  axios.get(`${API_BASE}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }),

};
