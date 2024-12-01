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
