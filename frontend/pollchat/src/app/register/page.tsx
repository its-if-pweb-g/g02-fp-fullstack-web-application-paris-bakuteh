'use client'

import React, {useState} from "react";
import {registerUser} from '../../../services/api';
import styles from '../../components/Register.module.css';
import { useRouter } from 'next/navigation';
import { motion } from "motion/react";


export default function RegisterPage(){
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: ''
    });

    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const router = useRouter();

    //Handle input change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prevState => ({ ...prevState, [name]: value }));
    };

    //Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await registerUser(formData);
        
            if (response) {
              setSuccess('Registration successful! Redirecting to Login page...');
              setError(null);

              setTimeout(() => {
                router.push('/login');
              }, 2000) //Delay for 2 seconds before redirecting
            }
          } 
        catch (err: any) {
            setError(err.message || 'Registration failed.');
            setSuccess(null);
          }
    };

    return(
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
            <motion.div
                className="w-full max-w-xs"
                initial={{opacity: 0, x: 25}}
                animate={{opacity: 1, x: 0}}
                transition={{ duration: 1, ease: 'easeInOut'}}
            >
                <h1 className="text-center text-2xl font-bold mb-4 text-white">Register</h1>
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
                        <label className="block text-gray-700 text-sm font-bold mb-2">Email:</label>
                        <input
                        type="email" 
                        name="email" 
                        placeholder="Email"
                        value={formData.email} 
                        onChange={handleChange} 
                        required 
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
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
                        <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">Register</button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}