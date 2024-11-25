const API_BASE_URL = 'http://localhost:5000/api';

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
}
