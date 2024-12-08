'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link'; // Menggunakan bawaan Link dari Next.js

interface NavbarProps {
  currentPath: string; // Menunjukkan halaman yang sedang aktif
  currentUsername: string;
  currentEmail: string;
}

const Navbar: React.FC<NavbarProps> = ({ currentPath, currentUsername, currentEmail }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <nav className="bg-white border-gray-200 dark:bg-gray-900">
      <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
        {/* Logo & Navigation ke Dashboard */}
        <Link href="/dashboard" className="flex items-center space-x-3">
          <Image
            src="https://flowbite.com/docs/images/logo.svg"
            className="h-8"
            alt="Logo"
            width={50}
            height={50}
          />
          <span className="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">
            Pollchat
          </span>
        </Link>

        {/* Hamburger menu */}
        <button
          type="button"
          className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden"
          onClick={toggleMenu}
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>

        {/* Profile Dropdown */}
        <div className="relative flex items-center md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">
          <button
            type="button"
            className="flex text-sm bg-gray-800 rounded-full focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600"
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
              <span className="block text-sm text-gray-900 dark:text-white">{currentUsername || 'Loading...'}</span>
              <span className="block text-sm  text-gray-500 truncate dark:text-gray-400">{currentEmail || 'Loading...'}</span>
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
        <div
          className={`items-center justify-between w-full md:flex md:w-auto md:order-1 ${
            menuOpen ? 'block' : 'hidden'
          }`}
        >
          <ul className="flex flex-col p-4 mt-4 border border-gray-100 rounded-lg bg-gray-50 md:space-x-8 md:flex-row md:mt-0 md:border-0 md:bg-white dark:bg-gray-800">
            <li>
              <Link
                href="/dashboard"
                className={`block py-2 px-3 rounded ${
                  currentPath === '/dashboard' ? 'bg-blue-700 text-white' : 'text-gray-900'
                }`}
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                href="/chat"
                className={`block py-2 px-3 rounded ${
                  currentPath === '/chat' ? 'bg-blue-700 text-white' : 'text-gray-900'
                }`}
              >
                Chats
              </Link>
            </li>
            <li>
              <Link
                href="/polls"
                className={`block py-2 px-3 rounded ${
                  currentPath === '/polls' ? 'bg-blue-700 text-white' : 'text-gray-900'
                }`}
              >
                Polls
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
