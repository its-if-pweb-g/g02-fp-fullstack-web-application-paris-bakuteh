'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import Image from 'next/image';
import { TransitionLink } from '@/components/utils/TransitionLink';
import Link from 'next/link';
import { fetchUserDetails } from '../../../services/api';
import Navbar from '../../components/Navbar';



interface DecodedToken {
  id: string;
  username: string;
  exp: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [user, setUser] = useState<{ id: string; username: string; email: string} | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

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

        //If token is valid, then fetch user details
        else{
          fetchUserDetails(decoded.id)
          .then((userData) => setUser(userData))
          .catch((err) => {
            console.error(err);
            router.push('/login');
          });
        }
      } catch (error) {
        // Invalid token, redirect to login
        localStorage.removeItem('token');
        router.push('/login');
      }
    } 
    else {
      // No token, redirect to login
      router.push('/login');
    }
  }, [router]);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen); // Toggle mobile menu
  };
  return (
    <>
      <Navbar currentPath="/dashboard" currentUsername={user?.username || ''} currentEmail={user?.email || ''}/>
      <div>
        {/* Konten halaman dashboard */}
      </div>
    </>
  );
}