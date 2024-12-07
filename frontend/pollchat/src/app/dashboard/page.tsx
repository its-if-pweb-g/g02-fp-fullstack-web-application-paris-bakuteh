'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import Image from 'next/image';
import { TransitionLink } from '@/components/utils/TransitionLink';
import Link from 'next/link';
import { fetchUserDetails } from '../../../services/api';

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
    <nav className="bg-white border-gray-200 dark:bg-gray-900">
      {/* Navbar */}
      <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
        <TransitionLink href="/dashboard" className="flex items-center space-x-3 rtl:space-x-reverse">
          <Image 
          src="https://flowbite.com/docs/images/logo.svg" 
          className="h-8" 
          alt="Flowbite Logo" 
          width={50}
          height={50}
          />
          <span className="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">Pollchat</span>
        </TransitionLink>

        {/* Hamburger menu (for mobile) */}
        <button
        type="button"
        className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden"
        onClick={toggleMenu}
        aria-label="Open menu"
        >
          <span className="sr-only">Open Menu</span>
          <svg
          className="w-5 h-5"
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          >
            <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 6h16M4 12h16M4 18h16"
            ></path>
          </svg>
        </button>

        {/* Profile Dropdown */}
        <div className="relative flex items-center md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">
          <button 
          type="button" 
          className="flex text-sm bg-gray-800 rounded-full md:me-0 focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600" 
          onClick={toggleDropdown}
          >
            <span className="sr-only">Open user menu</span>
            <Image 
            className="w-8 h-8 rounded-full" 
            src="/globe.svg" 
            alt="user photo" 
            width={50}
            height={50}
            />
          </button>

          {/*Dropdown Menu*/}
          <div 
            className={`absolute right-0 z-10 w-48 ${isDropdownOpen ? 'block' : 'hidden'} top-full mt-2 text-base bg-white divide-y divide-gray-100 rounded-lg shadow dark:bg-gray-700 dark:divide-gray-600`}
          >
            <div className="px-4 py-3">
              <span className="block text-sm text-gray-900 dark:text-white">{user?.username || 'Loading...'}</span>
              <span className="block text-sm  text-gray-500 truncate dark:text-gray-400">{user?.email || 'Loading...'}</span>
            </div>
            <ul className="py-2">
              <li>
                <button
                onClick={handleLogout}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white"
                >
                  Log Out
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Main Navbar */}
        <div className={`items-center justify-between w-full md:flex md:w-auto md:order-1 ${menuOpen ? 'block' : 'hidden'} md:block`}>
          <ul className="flex flex-col font-medium p-4 md:p-0 mt-4 border border-gray-100 rounded-lg bg-gray-50 md:space-x-8 rtl:space-x-reverse md:flex-row md:mt-0 md:border-0 md:bg-white dark:bg-gray-800 md:dark:bg-gray-900 dark:border-gray-700">
            <li>
              <Link href="#" className="block py-2 px-3 text-white bg-blue-700 rounded md:bg-transparent md:text-blue-700 md:p-0 md:dark:text-blue-500" aria-current="page">Home</Link>
            </li>
            <li>
              <TransitionLink href="/chat" className="block py-2 px-3 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 md:p-0 dark:text-white md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700">Chats</TransitionLink>
            </li>
            <li>
              <TransitionLink href="/polls" className="block py-2 px-3 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 md:p-0 dark:text-white md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700">Polls</TransitionLink>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}