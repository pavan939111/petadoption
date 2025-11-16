// Mock API service for development
// Replace with actual backend URLs when ready

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';

// Helper for mock delays
const mockDelay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Mock user data
let currentUser: any = null;

// Mock data storage
const mockData = {
  pets: [] as any[],
  chats: [] as any[],
  notifications: [] as any[],
};

// Initialize with some mock pets
const initMockData = () => {
  if (mockData.pets.length === 0) {
    mockData.pets = [
      {
        id: '1',
        status: 'Listed Found',
        species: 'Dog',
        breed: 'Golden Retriever',
        color: 'Golden',
        distinguishing_marks: 'White patch on chest, friendly demeanor',
        photos: ['https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=800'],
        location: 'Central Park, New York',
        date_found_or_lost: '2024-01-10T10:00:00Z',
        submitted_by: { id: '1', name: 'John Rescuer', contact: 'john@example.com' },
        date_submitted: '2024-01-10T10:30:00Z',
      },
      {
        id: '2',
        status: 'Listed Lost',
        species: 'Cat',
        breed: 'Siamese',
        color: 'Cream with dark points',
        distinguishing_marks: 'Blue eyes, collar with bell',
        photos: ['https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?w=800'],
        location: 'Brooklyn Heights',
        date_found_or_lost: '2024-01-12T14:00:00Z',
        submitted_by: { id: '2', name: 'Sarah Owner', contact: 'sarah@example.com' },
        date_submitted: '2024-01-12T15:00:00Z',
      },
      {
        id: '3',
        status: 'Available for Adoption',
        species: 'Dog',
        breed: 'Mixed Breed',
        color: 'Brown and white',
        distinguishing_marks: 'Playful, good with kids',
        photos: ['https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800'],
        location: 'Animal Shelter NYC',
        date_found_or_lost: '2023-12-01T10:00:00Z',
        submitted_by: { id: '3', name: 'NYC Animal Shelter', contact: 'shelter@nyc.com' },
        date_submitted: '2023-12-01T11:00:00Z',
      },
    ];
  }
};

// Auth API
export const authAPI = {
  async login(email: string, password: string) {
    await mockDelay();
    currentUser = {
      id: '1',
      name: 'Test User',
      email,
      role: email.includes('admin') ? 'admin' : 'user',
    };
    return { token: 'mock-token-123', user: currentUser };
  },

  async register(payload: any) {
    await mockDelay();
    // Basic mock validation
    if (!payload.email || !payload.password) {
      const err: any = { errors: { email: ['Email required'], password: ['Password required'] } };
      const e: any = new Error('Validation');
      e.body = err;
      throw e;
    }
    currentUser = { id: Date.now().toString(), name: payload.name || payload.full_name || 'User', email: payload.email, role: payload.role || 'user', phone: payload.phone };
    return { user: currentUser };
  },

  async getMe() {
    await mockDelay();
    return currentUser;
  },

  logout() {
    currentUser = null;
  },
};

// Pets API
export const petsAPI = {
  async getAll(params: any = {}) {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    if (params.species) queryParams.append('species', params.species);
    if (params.location) queryParams.append('location', params.location);
    if (params.report_type) queryParams.append('report_type', params.report_type);
    
    const url = `${API_URL}/pets${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch pets');
      const data = await response.json();
      return {
        items: data.data || [],
        total: data.pagination?.total || data.data?.length || 0,
      };
    } catch (error) {
      // Fallback to mock
      await mockDelay();
      initMockData();
      
      let filtered = [...mockData.pets];
      
      if (params.status) {
        filtered = filtered.filter(p => p.status === params.status);
      }
      if (params.species) {
        filtered = filtered.filter(p => p.species === params.species);
      }
      if (params.location) {
        filtered = filtered.filter(p => p.location.toLowerCase().includes(params.location.toLowerCase()));
      }
      if (params.report_type) {
        filtered = filtered.filter(p => p.report_type === params.report_type);
      }
      
      return {
        items: filtered,
        total: filtered.length,
      };
    }
  },

  async getById(id: string) {
    await mockDelay();
    initMockData();
    const pet = mockData.pets.find(p => p.id === id);
    if (!pet) throw new Error('Pet not found');
    return pet;
  },

  async create(petData: any) {
    // Determine endpoint based on report_type or status
    const reportType = petData.report_type || (petData.status?.includes('Found') ? 'found' : petData.status?.includes('Lost') ? 'lost' : 'found');
    const endpoint = reportType === 'lost' ? '/pets/lost' : '/pets/found';
    
    // Create FormData for multipart/form-data
    const formData = new FormData();
    
    // Add all text fields
    Object.keys(petData).forEach(key => {
      if (key !== 'photos' && key !== 'report_type' && petData[key] !== undefined && petData[key] !== null) {
        if (typeof petData[key] === 'object') {
          formData.append(key, JSON.stringify(petData[key]));
        } else {
          formData.append(key, petData[key]);
        }
      }
    });
    
    // Add report_type
    formData.append('report_type', reportType);
    
    // Add photos - multer expects field name 'photos' (plural)
    if (petData.photos && Array.isArray(petData.photos)) {
      petData.photos.forEach((photo: any, index: number) => {
        if (photo instanceof File) {
          formData.append('photos', photo); // Field name must match multer field name
        }
      });
    }
    
    try {
      const token = localStorage.getItem('token');
      const url = `${API_URL}${endpoint}`;
      
      console.log('Sending request to:', url);
      console.log('FormData keys:', Array.from(formData.keys()));
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type - browser will set it with boundary for FormData
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to create pet report' }));
        
        // If there are specific validation errors, format them
        if (errorData.errors && typeof errorData.errors === 'object') {
          const errorMessages = Object.entries(errorData.errors)
            .map(([field, message]) => `${field}: ${message}`)
            .join('\n');
          throw new Error(`Validation failed:\n${errorMessages}`);
        }
        
        throw new Error(errorData.message || `Server error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error: any) {
      // Log error for debugging
      console.error('Error creating pet report:', error);
      
      // Provide more specific error messages
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        throw new Error(
          'Cannot connect to server. Please ensure:\n' +
          '1. Backend server is running on http://localhost:8000\n' +
          '2. Check browser console for CORS errors\n' +
          '3. Verify your network connection'
        );
      }
      
      // Re-throw error so frontend can handle it
      throw new Error(error.message || 'Failed to create pet report. Please check your connection and try again.');
    }
  },

  async update(id: string, updates: any) {
    await mockDelay();
    const index = mockData.pets.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Pet not found');
    mockData.pets[index] = { ...mockData.pets[index], ...updates };
    return mockData.pets[index];
  },

  async delete(id: string) {
    await mockDelay();
    mockData.pets = mockData.pets.filter(p => p.id !== id);
    return { success: true };
  },

  async getMatches(species?: string, color?: string, location?: string) {
    await mockDelay(300);
    initMockData();
    
    let matches = mockData.pets.filter(p => p.status === 'Listed Found');
    
    if (species) {
      matches = matches.filter(p => 
        p.species.toLowerCase().includes(species.toLowerCase())
      );
    }
    if (color) {
      matches = matches.filter(p => 
        p.color.toLowerCase().includes(color.toLowerCase())
      );
    }
    if (location) {
      matches = matches.filter(p => 
        p.location.toLowerCase().includes(location.toLowerCase())
      );
    }
    
    return matches;
  },

  async applyForAdoption(id: string, application: any) {
    await mockDelay();
    return { success: true, application };
  },

  async moveToAdoption(id: string) {
    return this.update(id, { status: 'Available for Adoption' });
  },

  async rescuerKeep(id: string) {
    return this.update(id, { status: 'Adopted (by Rescuer)' });
  },
};

// Chat API
export const chatAPI = {
  async createRoom(petId: string, ownerId: string) {
    await mockDelay();
    const roomId = `room-${Date.now()}`;
    mockData.chats.push({
      roomId,
      petId,
      participants: [ownerId, 'rescuer-id', 'admin-id'],
      messages: [],
    });
    return { roomId };
  },

  async getRoom(roomId: string) {
    await mockDelay();
    const room = mockData.chats.find(c => c.roomId === roomId);
    return room || {
      roomId,
      petId: 'unknown',
      participants: ['user1', 'user2', 'admin'],
      messages: [
        {
          id: '1',
          sender: { id: 'user1', name: 'Pet Owner' },
          text: 'Hello, I think this is my pet!',
          timestamp: new Date().toISOString(),
        },
        {
          id: '2',
          sender: { id: 'user2', name: 'Rescuer' },
          text: 'Great! Can you describe any unique features?',
          timestamp: new Date().toISOString(),
        },
      ],
    };
  },

  connectWebSocket(roomId: string) {
    // Mock WebSocket connection
    console.log(`WebSocket connected to ${WS_URL}/chats/${roomId}`);
    return {
      send: (message: any) => console.log('WS Send:', message),
      close: () => console.log('WS Closed'),
      on: (event: string, callback: Function) => console.log('WS Event:', event),
    };
  },
};

// Admin API
export const adminAPI = {
  async getPending(type?: 'found' | 'lost') {
    await mockDelay();
    initMockData();
    // Return pending verification reports
    return mockData.pets.filter(p => p.status === 'Pending Verification');
  },

  async getPendingReports(report_type?: 'found' | 'lost') {
    const url = `${API_URL}/admin/pending${report_type ? `?report_type=${report_type}` : ''}`;
    try {
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) throw new Error('Failed to fetch pending reports');
      const data = await response.json();
      return data.data;
    } catch (error) {
      // Fallback to mock
      return this.getPending(report_type);
    }
  },

  async acceptReport(petId: string, notes?: string, verificationParams?: any) {
    const url = `${API_URL}/admin/pending/${petId}/accept`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          notes,
          verification_params: verificationParams 
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to accept report');
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      // Fallback: simulate acceptance
      await mockDelay();
      const pet = mockData.pets.find(p => p.id === petId);
      if (!pet) throw new Error('Pet not found');
      pet.status = pet.report_type === 'found' ? 'Listed Found' : 'Listed Lost';
      return pet;
    }
  },

  async getPendingAdoptionRequests() {
    const url = `${API_URL}/admin/adoptions/pending`;
    try {
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) throw new Error('Failed to fetch pending adoptions');
      const data = await response.json();
      return data.data;
    } catch (error) {
      // Fallback to mock
      await mockDelay();
      return mockData.pets.filter(p => p.status === 'Pending Adoption');
    }
  },

  async acceptAdoptionRequest(petId: string, notes?: string, verificationParams?: any, adopterId?: string) {
    const url = `${API_URL}/admin/adoptions/${petId}/accept`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          notes,
          verification_params: {
            ...verificationParams,
            adopter_id: adopterId
          }
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to accept adoption request');
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      throw error;
    }
  },

  async rejectReport(petId: string, reason: string) {
    const url = `${API_URL}/admin/pending/${petId}/reject`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) throw new Error('Failed to reject report');
      const data = await response.json();
      return data.data;
    } catch (error) {
      // Fallback: simulate rejection
      await mockDelay();
      const pet = mockData.pets.find(p => p.id === petId);
      if (!pet) throw new Error('Pet not found');
      pet.status = 'Rejected';
      return pet;
    }
  },

  async approvePet(id: string) {
    const pet = mockData.pets.find(p => p.id === id);
    if (!pet) throw new Error('Pet not found');
    
    const newStatus = pet.status.includes('Found') ? 'Listed Found' : 'Listed Lost';
    return petsAPI.update(id, { status: newStatus });
  },

  async getDashboardStats() {
    const url = `${API_URL}/admin/dashboard`;
    try {
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      return data.data;
    } catch (error) {
      // Fallback to mock
      await mockDelay();
      initMockData();
      return {
        pending: {
          lost: 3,
          found: 2,
          total: 5,
        },
        active: {
          lost: 8,
          found: 12,
          total: 20,
        },
        matched: 15,
        reunited: 10,
        users: {
          total: 150,
          regular: 120,
          rescuers: 28,
          admins: 2,
        },
      };
    }
  },

  async getAllUsers(filters?: any) {
    await mockDelay();
    return [
      { _id: '1', name: 'John Doe', email: 'john@example.com', role: 'user', is_active: true, createdAt: new Date() },
      { _id: '2', name: 'Sarah Smith', email: 'sarah@example.com', role: 'rescuer', is_active: true, createdAt: new Date() },
    ];
  },

  async updateUser(userId: string, updates: any) {
    await mockDelay();
    return { success: true, message: 'User updated' };
  },

  async deleteUser(userId: string) {
    await mockDelay();
    return { success: true, message: 'User deactivated' };
  },

  async getAllPets(filters?: any) {
    const url = `${API_URL}/admin/pets${filters ? `?${new URLSearchParams(filters).toString()}` : ''}`;
    try {
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) throw new Error('Failed to fetch pets');
      const data = await response.json();
      return data.data;
    } catch (error) {
      // Fallback to mock
      await mockDelay();
      initMockData();
      return mockData.pets;
    }
  },

  async resolvePet(petId: string) {
    await mockDelay();
    return { success: true, message: 'Pet resolved' };
  },

  async deletePet(petId: string) {
    await mockDelay();
    return { success: true, message: 'Pet deleted' };
  },
};

// Notifications API
export const notificationsAPI = {
  async getAll(isRead?: boolean) {
    const url = `${API_URL}/notifications${isRead !== undefined ? `?is_read=${isRead}` : ''}`;
    try {
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) throw new Error('Failed to fetch notifications');
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      // Fallback to mock
      await mockDelay();
      return mockData.notifications || [];
    }
  },

  async getUnreadCount() {
    const url = `${API_URL}/notifications/unread-count`;
    try {
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) throw new Error('Failed to fetch unread count');
      const data = await response.json();
      return data.count || 0;
    } catch (error) {
      return 0;
    }
  },

  async markRead(id: string) {
    const url = `${API_URL}/notifications/${id}/read`;
    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) throw new Error('Failed to mark notification as read');
      const data = await response.json();
      return data;
    } catch (error) {
      // Fallback to mock
      await mockDelay();
      const notif = mockData.notifications?.find((n: any) => n.id === id);
      if (notif) notif.is_read = true;
      return { success: true };
    }
  },

  async markAllAsRead() {
    const url = `${API_URL}/notifications/read-all`;
    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) throw new Error('Failed to mark all as read');
      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false };
    }
  },

  async delete(id: string) {
    const url = `${API_URL}/notifications/${id}`;
    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) throw new Error('Failed to delete notification');
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  },
};

// Uploads API
export const uploadsAPI = {
  async upload(file: File) {
    await mockDelay();
    // In production, this would upload to S3 or similar
    return {
      url: URL.createObjectURL(file),
    };
  },
};

// Users API (for user profile management)
export const usersAPI = {
  async updateUser(userId: string, updates: any) {
    const url = `${API_URL}/users/${userId}`;
    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to update user' }));
        throw new Error(error.message || 'Failed to update user');
      }
      const data = await response.json();
      return data;
    } catch (error: any) {
      // Fallback to mock
      await mockDelay();
      console.log('User update (mock):', updates);
      return { success: true, message: 'User updated', user: { ...currentUser, ...updates } };
    }
  },

  async getUser(userId: string) {
    const url = `${API_URL}/users/${userId}`;
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch user');
      const data = await response.json();
      return data.user || data;
    } catch (error) {
      // Fallback to mock
      await mockDelay();
      return currentUser;
    }
  },
};
