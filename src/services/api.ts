// Mock API service with placeholder endpoints
const API_BASE = '/api';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  status: number;
}

async function mockRequest<T>(data: T, shouldFail = false, delayMs = 800): Promise<ApiResponse<T>> {
  await delay(delayMs);
  if (shouldFail) {
    return { error: 'Something went wrong. Please try again.', status: 500 };
  }
  return { data, status: 200 };
}

export const authApi = {
  login: async (email: string, _password: string): Promise<ApiResponse<{ token: string; user: { id: string; email: string; username: string; avatar: string } }>> => {
    // POST /api/auth/login
    console.log(`[Mock API] POST ${API_BASE}/auth/login`, { email });
    return mockRequest({
      token: 'mock-jwt-token-' + Date.now(),
      user: {
        id: '1',
        email,
        username: email.split('@')[0],
        avatar: '',
      },
    });
  },

  signup: async (email: string, _password: string, username: string): Promise<ApiResponse<{ message: string }>> => {
    // POST /api/auth/signup
    console.log(`[Mock API] POST ${API_BASE}/auth/signup`, { email, username });
    return mockRequest({ message: 'Verification code sent to your email' });
  },

  verifyEmail: async (email: string, code: string): Promise<ApiResponse<{ token: string; user: { id: string; email: string; username: string; avatar: string } }>> => {
    // POST /api/auth/verify-email
    console.log(`[Mock API] POST ${API_BASE}/auth/verify-email`, { email, code });
    return mockRequest({
      token: 'mock-jwt-token-' + Date.now(),
      user: {
        id: '1',
        email,
        username: email.split('@')[0],
        avatar: '',
      },
    });
  },

  forgotPassword: async (email: string): Promise<ApiResponse<{ message: string }>> => {
    // POST /api/auth/forgot-password
    console.log(`[Mock API] POST ${API_BASE}/auth/forgot-password`, { email });
    return mockRequest({ message: 'Password reset link sent to your email' });
  },

  resetPassword: async (_token: string, _password: string): Promise<ApiResponse<{ message: string }>> => {
    // POST /api/auth/reset-password
    console.log(`[Mock API] POST ${API_BASE}/auth/reset-password`);
    return mockRequest({ message: 'Password reset successfully' });
  },

  googleAuth: async (): Promise<void> => {
    // GET /api/auth/google
    console.log(`[Mock API] GET ${API_BASE}/auth/google — would redirect to Google OAuth`);
  },

  githubAuth: async (): Promise<void> => {
    // GET /api/auth/github
    console.log(`[Mock API] GET ${API_BASE}/auth/github — would redirect to GitHub OAuth`);
  },

  validateToken: async (token: string): Promise<ApiResponse<{ user: { id: string; email: string; username: string; avatar: string } }>> => {
    // GET /api/auth/validate
    console.log(`[Mock API] GET ${API_BASE}/auth/validate`, { token: token.slice(0, 10) + '...' });
    return mockRequest({
      user: {
        id: '1',
        email: 'user@example.com',
        username: 'user',
        avatar: '',
      },
    });
  },
};
