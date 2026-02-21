import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { authApi } from "@/services/api";

interface User {
  id: number;
  email: string;
  username: string;
  avatar?: string;
  bio?: string;
  status?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  signup: (
    username: string,
    email: string,
    password: string,
  ) => Promise<{ error?: string }>;
  verifyEmail: (email: string, code: string) => Promise<{ error?: string }>;
  forgotPassword: (
    email: string,
  ) => Promise<{ error?: string; message?: string }>;
  resetPassword: (
    token: string,
    password: string,
  ) => Promise<{ error?: string }>;
  logout: () => void;
  loginWithGoogle: () => Promise<void>;
  loginWithGithub: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // useEffect(() => {
  //   const stored = localStorage.getItem("auth_token");
  //   if (stored) {
  //     authApi.validateToken(stored).then((res) => {
  //       if (res.data) {
  //         setUser(res.data.user);
  //         setToken(stored);
  //       } else {
  //         localStorage.removeItem("auth_token");
  //       }
  //       setIsLoading(false);
  //     });
  //   } else {
  //     setIsLoading(false);
  //   }
  // }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");

    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    setToken(storedToken);

    authApi
      .getMe(storedToken)
      .then((res) => {
        setUser(res.data);
      })
      .catch(() => {
        localStorage.removeItem("auth_token");
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    const res = await authApi.login(identifier, password);
    if (res.error) return { error: res.error };
    if (res.data) {
      setUser(res.data.user);
      setToken(res.data.token);
      localStorage.setItem("auth_token", res.data.token);
    }
    return {};
  }, []);

  const signup = useCallback(
    async (username: string, email: string, password: string) => {
      const res = await authApi.signup(username, email, password);

      if (res.error) return { error: res.error };
      return {};
    },
    [],
  );

  const verifyEmail = useCallback(async (email: string, code: string) => {
    const res = await authApi.verifyEmail(email, code);
    if (res.error) return { error: res.error };
    return {};
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    const res = await authApi.forgotPassword(email);
    if (res.error) return { error: res.error };
    return { message: res.data?.message };
  }, []);

  const resetPassword = useCallback(
    async (resetToken: string, password: string) => {
      const res = await authApi.resetPassword(resetToken, password);
      if (res.error) return { error: res.error };
      return {};
    },
    [],
  );

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("auth_token");
  }, []);

  const loginWithGoogle = useCallback(async () => {
    await authApi.googleAuth();
  }, []);

  const loginWithGithub = useCallback(async () => {
    await authApi.githubAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        signup,
        verifyEmail,
        forgotPassword,
        resetPassword,
        logout,
        loginWithGoogle,
        loginWithGithub,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
