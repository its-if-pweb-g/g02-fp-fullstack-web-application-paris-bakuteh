'use client'

import React from 'react';
import Link from 'next/link';
import styles from '../components/Home.module.css'

export default async function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-5 bg-gray-100">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">Welcome to Pollchat!</h1>
      <p className="text-lg text-gray-600 mb-8">Engage in polls and chat with friends. Create your account or log in to get started.</p>

      <div className="flex space-x-4">
        <Link href="/register">
          <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full">Register</button>
        </Link>
        <Link href="/login">
          <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full">Login</button>
        </Link>
      </div>
    </div>
  );
}
