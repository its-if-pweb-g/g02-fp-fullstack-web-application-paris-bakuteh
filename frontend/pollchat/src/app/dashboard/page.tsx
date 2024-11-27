'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  id: string;
  username: string;
  exp: number;
}

export default function DashboardPage() {
  const router = useRouter();

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
    <div>
        Welcome to the Dashboard!
    </div>
  );
}
