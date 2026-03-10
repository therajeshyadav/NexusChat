import axios from "axios";
import { API_CONFIG } from "@/config/api";

export const api = axios.create({
  baseURL: API_CONFIG.chatApiUrl,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});