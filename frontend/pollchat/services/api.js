const API_BASE_URL = 'http://localhost:5000/api';

const getToken = () => {
  return localStorage.getItem('token');
};

export const registerUser = async (userData) => {
  try{
    const response = await fetch(`${API_BASE_URL}/register`, {
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
};

export const loginUser = async (userData) => {
  try{
    const response = await fetch(`${API_BASE_URL}/login`, {
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
};

export const getUserId = async () => {
  const token = getToken();

  if(!token){
    throw new Error('No token found');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/validate-token`, {
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
};

export const fetchUserDetails = async (userId) => {
  if(!userId){
    throw new Error('User ID is required to fetch user details.');
  }

  try{
    const response = await fetch(`${API_BASE_URL}/singleUser/${userId}`, {
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
  
};
export const createPoll = async (pollData) => {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}/polls`, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(pollData),
  });
  if (!response.ok) throw new Error('Failed to create poll');
};

export const getPolls = async () => {
  const response = await fetch(`${API_BASE_URL}/polls`);
  if (!response.ok) throw new Error('Failed to fetch polls');
  return response.json();
};

export const votePoll = async (pollId, optionIndex) => {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}/polls/${pollId}/vote`, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ optionIndex }),
  });
  if (!response.ok) throw new Error('Failed to vote');
};

