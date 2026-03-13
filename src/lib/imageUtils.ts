import { API_CONFIG } from "@/config/api";

export const getImageUrl = (path: string | null | undefined): string | undefined => {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  
  // Use the auth API base URL (remove /api/auth to get base URL)
  const baseUrl = API_CONFIG.authApiUrl.replace('/api/auth', '');
  return `${baseUrl}${path}`;
};
