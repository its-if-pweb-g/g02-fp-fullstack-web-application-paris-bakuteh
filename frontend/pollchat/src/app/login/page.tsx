'use client'

import React, { useEffect, useState } from "react";
import {loginUser} from '../../../services/api';
import Link from "next/link";
import styles from '../../components/Login.module.css';
import { TransitionLink } from "@/components/utils/TransitionLink";
import { motion } from "motion/react";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";

interface DecodedToken {
  id: string;
  username: string;
  exp: number;
}

export default function LoginPage(){
  const router = useRouter();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if(token){
      try{
        const decoded: DecodedToken = jwtDecode(token);
        const currentTime = Math.floor(Date.now() / 1000);

        if(decoded.exp > currentTime){
          // Token is valid, redirect to dashboard
          router.push('/dashboard');
        }
      }
      catch(error){
        console.error("Invalid Token", error);
        localStorage.removeItem('token'); // Remove invalid token
      }
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await loginUser(formData);

      if (response) {
        console.log('Login Response:', response); // Debugging
        setSuccess('Login successful!');
        setError(null);
        localStorage.setItem('token', response.token);

        // Wait briefly to ensure token is saved
        setTimeout(() => {
          router.push('/dashboard');
        }, 100);
      }
    } 
    catch (err: any) {
      console.error('Login Error:', err); // Debugging
      setError(err.message || 'Login failed.');
      setSuccess(null);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
      <motion.div
      className="w-full max-w-xs"
      initial={{opacity: 0, x: 25}}
      animate={{opacity: 1, x: 0}}
      transition={{ duration: 1, ease: 'easeInOut'}}
      >
        <h1 className="text-center text-2xl font-bold mb-4 text-white">Login</h1>
        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 bg-opacity-80 backdrop-blur-md">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Username:</label>
            <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            required
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Password:</label>
            <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div className="mb-4">
            {error && <p className={`${styles.message} ${styles.error}`}>{error}</p>}
            {success && <p className={`${styles.message} ${styles.success}`}>{success}</p>}
          </div>
          <div className="flex items-center justify-between">
            <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">Login</button>
          </div>
          <div>
            <p>Don't have an account?</p>
            <TransitionLink 
            href="/../register"
            className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800"
            >
              Register Here
            </TransitionLink>
          </div>
        </form>
      </motion.div>
    </div>
  )
}