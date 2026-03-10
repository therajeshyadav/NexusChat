import axios from "axios";
import { API_CONFIG } from "@/config/api";

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
      const res = await axios.post(`${API_CONFIG.authApiUrl}/login`, {
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
      const res = await axios.post(`${API_CONFIG.authApiUrl}/signup`, {
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
      const res = await axios.post(`${API_CONFIG.authApiUrl}/verify-otp`, {
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
    const res = await axios.post(`${API_CONFIG.authApiUrl}/forgot-password`, { email });
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
      const res = await axios.post(`${API_CONFIG.authApiUrl}/reset-password`, {
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
    window.location.href = `${API_CONFIG.authApiUrl}/google`;
  },

  githubAuth: () => {
    window.location.href = `${API_CONFIG.authApiUrl}/github`;
  },

  validateToken: async (token: string) => {
    const res = await axios.get(`${API_CONFIG.authApiUrl}/validate`, {
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
  axios.get(`${API_CONFIG.authApiUrl}/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }),

  updateProfile: async (
    token: string,
    data: {
      bio?: string;
      status?: string;
      avatar?: File;
      banner?: File;
    }
  ): Promise<{ data?: any; error?: string }> => {
    try {
      const formData = new FormData();
      
      if (data.bio !== undefined) formData.append("bio", data.bio);
      if (data.status !== undefined) formData.append("status", data.status);
      if (data.avatar) formData.append("avatar", data.avatar);
      if (data.banner) formData.append("banner", data.banner);

      // Use smart API URL for profile updates too
      const profileApiUrl = API_CONFIG.authApiUrl.replace('/auth', '/profile');
      const res = await axios.put(
        `${profileApiUrl}/update`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return { data: res.data };
    } catch (err: any) {
      return {
        error: err.response?.data?.message || "Profile update failed",
      };
    }
  },

};
