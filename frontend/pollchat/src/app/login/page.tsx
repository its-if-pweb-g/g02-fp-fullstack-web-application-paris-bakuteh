'use client'

import React, { useState } from "react";
import {loginUser} from '../../../services/api';

export default function LoginPage(){
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await loginUser(formData);

      if (response) {
        setSuccess('Login successful!');
        setError(null);
        localStorage.setItem('token', response.token);
      }
    } 
    catch (err: any) {
      setError(err.message || 'Login failed.');
      setSuccess(null);
    }
  };

  return (
    <div>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Username:</label>
          <input
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          required
          />
        </div>
        <div>
          <label>Password:</label>
          <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          />
        </div>
        <button type="submit">Login</button>
      </form>

      {error && <p style={{color: 'red'}}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}
    </div>
  )
}