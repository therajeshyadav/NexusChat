const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL || "http://localhost:5000";

export const getImageUrl = (path: string | null | undefined): string | undefined => {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  return `${AUTH_API_URL}${path}`;
};
