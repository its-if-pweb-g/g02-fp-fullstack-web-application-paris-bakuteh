'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  id: string;
  username: string;
  exp: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('All'); // Menggunakan useState untuk filter

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded: DecodedToken = jwtDecode(token);
        const currentTime = Math.floor(Date.now() / 1000);

        if (decoded.exp < currentTime) {
          // Token expired, redirect to login
          localStorage.removeItem('token');
          router.push('/login');
        }
      } catch (error) {
        // Invalid token, redirect to login
        localStorage.removeItem('token');
        router.push('/login');
      }
    } else {
      // No token, redirect to login
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="dashboard">
      {/* Navbar Atas */}
      <div className="navbar">
        <div className="title">Chat</div>
        <button className="add-button" onClick={() => alert('Add someone to chat')}>
          Add Someone
        </button>
      </div>

      {/* Navbar Bawah untuk Sorting */}
      <div className="sort-navbar">
        {['All', 'Unread', 'Archived'].map((filter) => (
          <button
            key={filter}
            className={`sort-button ${activeFilter === filter ? 'active' : ''}`}
            onClick={() => setActiveFilter(filter)}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="content">
        <h3>{activeFilter} Chats</h3>
        <p>Here you will see the list of {activeFilter.toLowerCase()} chats...</p>
      </div>

      {/* Styles */}
      <style jsx>{`
        .dashboard {
          display: flex;
          flex-direction: column;
          height: 100vh;
          font-family: Arial, sans-serif;
        }

        .navbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: #075e54;
          color: white;
          padding: 10px 15px;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
        }

        .title {
          font-size: 18px;
          font-weight: bold;
        }

        .add-button {
          background-color: #25d366;
          color: white;
          border: none;
          padding: 5px 10px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .add-button:hover {
          background-color: #1da851;
        }

        .sort-navbar {
          display: flex;
          justify-content: space-around;
          background-color: #f8f9fa;
          border-bottom: 1px solid #ddd;
        }

        .sort-button {
          flex: 1;
          padding: 10px 0;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 16px;
          color: #555;
        }

        .sort-button.active {
          font-weight: bold;
          color: #075e54;
          border-bottom: 3px solid #075e54;
        }

        .content {
          flex-grow: 1;
          padding: 20px;
          background-color: #f0f0f0;
        }
      `}</style>
    </div>
  );
}