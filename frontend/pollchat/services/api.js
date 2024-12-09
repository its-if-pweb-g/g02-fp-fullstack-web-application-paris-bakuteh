import axios from 'axios';

const API_URL = 'http://localhost:5000/api';
const WS_URL = 'ws://localhost:5000';

const getToken = () => {
  return localStorage.getItem('token');
};

export const api = {
  registerUser: async (userData) => {
    try{
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      if(!response.ok){
        const data = await response.json();
        throw new Error(data.message || 'Registration failed.');
      }
      
      return await response.json();
    }
    catch(error){
      throw error;
    }
  },

  loginUser: async (userData) => {
    try{
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if(!response.ok){
        const data = await response.json();
        throw new Error(data.message || 'Login Failed.');
      }

      return await response.json();
    }
    catch(error){
      throw error;
    }
  },

  getUserId: async () => {
    const token = getToken();

    if(!token){
      throw new Error('No token found');
    }

    try {
      const response = await fetch(`${API_URL}/validate-token`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to fetch user ID');
      }

      const data = await response.json();
      return data.userId; // Return the user ID
    } 
    catch (error) {
      throw error;
    }
  },

  fetchUserDetails: async (userId) => {
    if(!userId){
      throw new Error('User ID is required to fetch user details.');
    }

    try{
      const response = await fetch(`${API_URL}/singleUser/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if(!response.ok){
        const data = await response.json();
        throw new Error(data.message || 'Failed to fetch user details.');
      }

      return await response.json();
    }
    catch(error){
      throw error;
    }
    
  },

  getUsers: async (token) => {
    const response = await axios.get(`${API_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  searchUsers: async (query, token) => {
    const response = await axios.get(`${API_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { q: query }, // Assuming a backend search implementation
    });
    return response.data;
  },

  fetchChatMessages: async (user1Id, user2Id) => {
    const token = getToken();

    if (!user1Id || !user2Id) {
      throw new Error('Both user IDs are required');
    }

    try {
      const response = await fetch(`${API_URL}/chats/${user1Id}/${user2Id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to fetch chat messages');
      }

      return await response.json(); // Return messages from the backend
    } catch (error) {
      throw error;
    }
  },

  createPoll: async (pollData) => {
    const token = getToken();
    const response = await fetch(`${API_URL}/polls`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(pollData),
    });
    if (!response.ok) throw new Error('Failed to create poll');
  },

  getPolls: async () => {
    const response = await fetch(`${API_URL}/polls`);
    if (!response.ok) throw new Error('Failed to fetch polls');
    return response.json();
  },

  votePoll: async (pollId, optionIndex) => {
    const token = getToken();
    const response = await fetch(`${API_URL}/polls/${pollId}/vote`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ optionIndex }),
    });
    if (!response.ok) throw new Error('Failed to vote');
  },
};