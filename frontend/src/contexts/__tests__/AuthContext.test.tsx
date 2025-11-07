import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { apiService } from '@/services/api.service';
import { StaffRole } from '@/types/admin.types';
import type { User } from '@/types/admin.types';

// Mock API service
jest.mock('@/services/api.service');

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

const mockUser = {
  id: 'user-1',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  role: StaffRole.MANAGER,
  permissions: ['appointments:read', 'appointments:write', 'clients:read'],
  business_id: 'business-1',
  tenant_id: 'tenant-1',
};

const mockOwnerUser = {
  ...mockUser,
  id: 'user-2',
  role: StaffRole.OWNER,
  permissions: [],
};

const mockStaffUser = {
  ...mockUser,
  id: 'user-3',
  role: StaffRole.STAFF,
  permissions: ['appointments:read'],
};

const createWrapper = () => {
  return ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.clear();
    (apiService.setToken as jest.Mock).mockImplementation(() => {});
  });

  describe('Initialization', () => {
    it('initializes with no user when no token exists', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it('loads user automatically when token exists', async () => {
      mockLocalStorage.setItem('access_token', 'valid-token');
      (apiService.get as jest.Mock).mockResolvedValue({ data: mockUser });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(apiService.get).toHaveBeenCalledWith('/auth/me');
    });

    it('removes invalid token and sets loading to false', async () => {
      mockLocalStorage.setItem('access_token', 'invalid-token');
      (apiService.get as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(mockLocalStorage.getItem('access_token')).toBeNull();
    });
  });

  describe('Login', () => {
    it('logs in successfully and sets user', async () => {
      (apiService.post as jest.Mock).mockResolvedValue({
        data: {
          access_token: 'new-token',
          user: mockUser,
        },
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.login('john@example.com', 'password123');
      });

      expect(apiService.post).toHaveBeenCalledWith('/auth/login', {
        email: 'john@example.com',
        password: 'password123',
      });

      expect(apiService.setToken).toHaveBeenCalledWith('new-token');
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('throws error on failed login', async () => {
      const loginError = new Error('Invalid credentials');
      (apiService.post as jest.Mock).mockRejectedValue(loginError);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await expect(async () => {
        await act(async () => {
          await result.current.login('wrong@example.com', 'wrongpassword');
        });
      }).rejects.toThrow('Invalid credentials');

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Logout', () => {
    it('logs out and clears user state', async () => {
      // First log in
      mockLocalStorage.setItem('access_token', 'valid-token');
      (apiService.get as jest.Mock).mockResolvedValue({ data: mockUser });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      // Then logout
      act(() => {
        result.current.logout();
      });

      expect(apiService.setToken).toHaveBeenCalledWith(null);
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Permission Checking', () => {
    it('returns false when user is not authenticated', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      expect(result.current.hasPermission('appointments:read')).toBe(false);
    });

    it('returns true for owner regardless of permission', async () => {
      mockLocalStorage.setItem('access_token', 'owner-token');
      (apiService.get as jest.Mock).mockResolvedValue({ data: mockOwnerUser });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockOwnerUser);
      });

      expect(result.current.hasPermission('any:permission')).toBe(true);
      expect(result.current.hasPermission('appointments:delete')).toBe(true);
    });

    it('returns true for admin regardless of permission', async () => {
      const adminUser = { ...mockUser, role: StaffRole.ADMIN };
      mockLocalStorage.setItem('access_token', 'admin-token');
      (apiService.get as jest.Mock).mockResolvedValue({ data: adminUser });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(adminUser);
      });

      expect(result.current.hasPermission('any:permission')).toBe(true);
    });

    it('checks permissions correctly for regular users', async () => {
      mockLocalStorage.setItem('access_token', 'manager-token');
      (apiService.get as jest.Mock).mockResolvedValue({ data: mockUser });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      // User has these permissions
      expect(result.current.hasPermission('appointments:read')).toBe(true);
      expect(result.current.hasPermission('appointments:write')).toBe(true);
      expect(result.current.hasPermission('clients:read')).toBe(true);

      // User doesn't have these permissions
      expect(result.current.hasPermission('appointments:delete')).toBe(false);
      expect(result.current.hasPermission('clients:write')).toBe(false);
    });

    it('returns false for staff without specific permission', async () => {
      mockLocalStorage.setItem('access_token', 'staff-token');
      (apiService.get as jest.Mock).mockResolvedValue({ data: mockStaffUser });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockStaffUser);
      });

      expect(result.current.hasPermission('appointments:read')).toBe(true);
      expect(result.current.hasPermission('appointments:write')).toBe(false);
    });
  });

  describe('Role Checking', () => {
    it('returns false when user is not authenticated', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      expect(result.current.hasRole(StaffRole.MANAGER)).toBe(false);
    });

    it('checks single role correctly', async () => {
      mockLocalStorage.setItem('access_token', 'manager-token');
      (apiService.get as jest.Mock).mockResolvedValue({ data: mockUser });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      expect(result.current.hasRole(StaffRole.MANAGER)).toBe(true);
      expect(result.current.hasRole(StaffRole.OWNER)).toBe(false);
      expect(result.current.hasRole(StaffRole.STAFF)).toBe(false);
    });

    it('checks multiple roles correctly', async () => {
      mockLocalStorage.setItem('access_token', 'manager-token');
      (apiService.get as jest.Mock).mockResolvedValue({ data: mockUser });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      // User is MANAGER, check array including MANAGER
      expect(result.current.hasRole([StaffRole.OWNER, StaffRole.MANAGER])).toBe(true);

      // User is MANAGER, check array not including MANAGER
      expect(result.current.hasRole([StaffRole.OWNER, StaffRole.ADMIN])).toBe(false);
    });

    it('handles array with single role', async () => {
      mockLocalStorage.setItem('access_token', 'staff-token');
      (apiService.get as jest.Mock).mockResolvedValue({ data: mockStaffUser });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockStaffUser);
      });

      expect(result.current.hasRole([StaffRole.STAFF])).toBe(true);
      expect(result.current.hasRole([StaffRole.MANAGER])).toBe(false);
    });
  });

  describe('isAuthenticated', () => {
    it('is false when no user', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isAuthenticated).toBe(false);
    });

    it('is true when user is logged in', async () => {
      mockLocalStorage.setItem('access_token', 'valid-token');
      (apiService.get as jest.Mock).mockResolvedValue({ data: mockUser });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });
    });

    it('becomes false after logout', async () => {
      mockLocalStorage.setItem('access_token', 'valid-token');
      (apiService.get as jest.Mock).mockResolvedValue({ data: mockUser });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      act(() => {
        result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Loading State', () => {
    it('is true during initial load', () => {
      mockLocalStorage.setItem('access_token', 'valid-token');
      (apiService.get as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: mockUser }), 100))
      );

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('becomes false after loading completes', async () => {
      mockLocalStorage.setItem('access_token', 'valid-token');
      (apiService.get as jest.Mock).mockResolvedValue({ data: mockUser });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('becomes false after loading fails', async () => {
      mockLocalStorage.setItem('access_token', 'invalid-token');
      (apiService.get as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Hook Error', () => {
    it('throws error when used outside provider', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = jest.fn();

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      console.error = originalError;
    });
  });

  describe('Edge Cases', () => {
    it('handles concurrent login attempts', async () => {
      (apiService.post as jest.Mock).mockResolvedValue({
        data: {
          access_token: 'token-1',
          user: mockUser,
        },
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      // Attempt multiple logins concurrently
      await act(async () => {
        await Promise.all([
          result.current.login('john@example.com', 'password123'),
          result.current.login('john@example.com', 'password123'),
        ]);
      });

      // Should have user set
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('handles logout when not logged in', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      // Should not throw error
      expect(() => {
        act(() => {
          result.current.logout();
        });
      }).not.toThrow();

      expect(result.current.user).toBeNull();
    });

    it('handles permission check with empty permissions array', async () => {
      const userWithNoPermissions = {
        ...mockStaffUser,
        permissions: [],
      };
      mockLocalStorage.setItem('access_token', 'staff-token');
      (apiService.get as jest.Mock).mockResolvedValue({ data: userWithNoPermissions });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(userWithNoPermissions);
      });

      expect(result.current.hasPermission('any:permission')).toBe(false);
    });
  });
});
