import { apiService } from '../api.service';

// Mock fetch
global.fetch = jest.fn();

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

describe('ApiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.clear();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Token Management', () => {
    it('initializes with token from localStorage', () => {
      mockLocalStorage.setItem('access_token', 'existing-token');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { test: 'data' } }),
      });

      apiService.get('/test');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer existing-token',
          }),
        })
      );
    });

    it('setToken stores token in localStorage', () => {
      apiService.setToken('new-token');

      expect(mockLocalStorage.getItem('access_token')).toBe('new-token');
    });

    it('setToken removes token when null', () => {
      mockLocalStorage.setItem('access_token', 'old-token');

      apiService.setToken(null);

      expect(mockLocalStorage.getItem('access_token')).toBeNull();
    });

    it('includes Authorization header when token is set', async () => {
      apiService.setToken('test-token');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: {} }),
      });

      await apiService.get('/test');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });

    it('does not include Authorization header when token is null', async () => {
      apiService.setToken(null);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: {} }),
      });

      await apiService.get('/test');

      const callArgs = (global.fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.headers).not.toHaveProperty('Authorization');
    });
  });

  describe('GET requests', () => {
    it('makes GET request to correct endpoint', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: 1, name: 'Test' } }),
      });

      await apiService.get('/users/1');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/1'),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('returns response data', async () => {
      const mockData = { id: 1, name: 'Test User' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockData }),
      });

      const result = await apiService.get('/users/1');

      expect(result).toEqual({ data: mockData });
    });

    it('includes Content-Type header', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: {} }),
      });

      await apiService.get('/test');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });

  describe('POST requests', () => {
    it('makes POST request with body', async () => {
      const postData = { name: 'New User', email: 'user@example.com' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: 1, ...postData } }),
      });

      await apiService.post('/users', postData);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/users'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(postData),
        })
      );
    });

    it('returns created resource', async () => {
      const postData = { name: 'New User' };
      const responseData = { id: 1, ...postData };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: responseData }),
      });

      const result = await apiService.post('/users', postData);

      expect(result).toEqual({ data: responseData });
    });

    it('handles nested objects in body', async () => {
      const complexData = {
        user: { name: 'John', email: 'john@example.com' },
        settings: { notifications: true, theme: 'dark' },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: complexData }),
      });

      await apiService.post('/profile', complexData);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify(complexData),
        })
      );
    });
  });

  describe('PUT requests', () => {
    it('makes PUT request with body', async () => {
      const updateData = { name: 'Updated User' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: 1, ...updateData } }),
      });

      await apiService.put('/users/1', updateData);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/1'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData),
        })
      );
    });

    it('returns updated resource', async () => {
      const updateData = { name: 'Updated User' };
      const responseData = { id: 1, ...updateData };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: responseData }),
      });

      const result = await apiService.put('/users/1', updateData);

      expect(result).toEqual({ data: responseData });
    });
  });

  describe('PATCH requests', () => {
    it('makes PATCH request with partial body', async () => {
      const patchData = { email: 'newemail@example.com' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: 1, ...patchData } }),
      });

      await apiService.patch('/users/1', patchData);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/1'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(patchData),
        })
      );
    });

    it('returns patched resource', async () => {
      const patchData = { status: 'active' };
      const responseData = { id: 1, name: 'User', ...patchData };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: responseData }),
      });

      const result = await apiService.patch('/users/1', patchData);

      expect(result).toEqual({ data: responseData });
    });
  });

  describe('DELETE requests', () => {
    it('makes DELETE request', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { success: true } }),
      });

      await apiService.delete('/users/1');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/1'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('returns deletion confirmation', async () => {
      const responseData = { success: true, message: 'User deleted' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: responseData }),
      });

      const result = await apiService.delete('/users/1');

      expect(result).toEqual({ data: responseData });
    });
  });

  describe('Error Handling', () => {
    it('throws error on HTTP error response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Resource not found' }),
      });

      await expect(apiService.get('/users/999')).rejects.toThrow('Resource not found');
    });

    it('throws error with default message when no message provided', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      await expect(apiService.get('/users/999')).rejects.toThrow('An error occurred');
    });

    it('handles 401 Unauthorized', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      });

      await expect(apiService.get('/protected')).rejects.toThrow('Unauthorized');
    });

    it('handles 403 Forbidden', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ message: 'Forbidden' }),
      });

      await expect(apiService.get('/admin')).rejects.toThrow('Forbidden');
    });

    it('handles 404 Not Found', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Not Found' }),
      });

      await expect(apiService.get('/nonexistent')).rejects.toThrow('Not Found');
    });

    it('handles 500 Internal Server Error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal Server Error' }),
      });

      await expect(apiService.get('/broken')).rejects.toThrow('Internal Server Error');
    });

    it('handles network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(apiService.get('/test')).rejects.toThrow('Network error');
    });

    it('handles timeout errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Request timeout'));

      await expect(apiService.get('/slow')).rejects.toThrow('Request timeout');
    });
  });

  describe('Base URL', () => {
    it('constructs full URL with base URL and endpoint', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: {} }),
      });

      await apiService.get('/users');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/users$/),
        expect.any(Object)
      );
    });

    it('handles endpoints with leading slash', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: {} }),
      });

      await apiService.get('/users');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/users'),
        expect.any(Object)
      );
    });

    it('handles endpoints without leading slash', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: {} }),
      });

      await apiService.get('users');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('users'),
        expect.any(Object)
      );
    });

    it('handles query parameters', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      await apiService.get('/users?page=2&limit=10');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('?page=2&limit=10'),
        expect.any(Object)
      );
    });
  });

  describe('Headers', () => {
    it('includes default Content-Type header', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: {} }),
      });

      await apiService.get('/test');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('includes Authorization header when token is present', async () => {
      apiService.setToken('my-token');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: {} }),
      });

      await apiService.get('/test');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer my-token',
          }),
        })
      );
    });

    it('updates Authorization header when token changes', async () => {
      apiService.setToken('token-1');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: {} }),
      });

      await apiService.get('/test');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer token-1',
          }),
        })
      );

      apiService.setToken('token-2');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: {} }),
      });

      await apiService.get('/test');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer token-2',
          }),
        })
      );
    });
  });

  describe('Response Handling', () => {
    it('parses JSON response', async () => {
      const mockData = { users: [{ id: 1 }, { id: 2 }] };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockData }),
      });

      const result = await apiService.get('/users');

      expect(result).toEqual({ data: mockData });
    });

    it('handles empty response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: null }),
      });

      const result = await apiService.get('/empty');

      expect(result).toEqual({ data: null });
    });

    it('handles array response', async () => {
      const mockArray = [{ id: 1 }, { id: 2 }, { id: 3 }];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockArray }),
      });

      const result = await apiService.get('/items');

      expect(result).toEqual({ data: mockArray });
    });
  });

  describe('Multiple Concurrent Requests', () => {
    it('handles multiple GET requests', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { id: 1 } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { id: 2 } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { id: 3 } }),
        });

      const results = await Promise.all([
        apiService.get('/users/1'),
        apiService.get('/users/2'),
        apiService.get('/users/3'),
      ]);

      expect(results).toHaveLength(3);
      expect(results[0].data).toEqual({ id: 1 });
      expect(results[1].data).toEqual({ id: 2 });
      expect(results[2].data).toEqual({ id: 3 });
    });

    it('handles mixed method requests', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { id: 1 } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { id: 2, name: 'New' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { success: true } }),
        });

      await Promise.all([
        apiService.get('/users/1'),
        apiService.post('/users', { name: 'New' }),
        apiService.delete('/users/3'),
      ]);

      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });
});
