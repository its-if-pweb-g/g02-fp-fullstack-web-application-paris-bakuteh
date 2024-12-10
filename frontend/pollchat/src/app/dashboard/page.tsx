'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import Image from 'next/image';
import { TransitionLink } from '@/components/utils/TransitionLink';
import Link from 'next/link';
import { api } from '../../../services/api';
import Navbar from '../../components/Navbar';
import { motion } from 'motion/react';
import { useInView } from '@/components/UseInView';


interface DecodedToken {
  id: string;
  username: string;
  exp: number;
}

interface Poll {
  _id: string;
  title: string;
  options: { text: string; votes: number }[];
  createdBy: string;
  createdAt: string;
  expiryDate?: string;
}


export default function DashboardPage() {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [user, setUser] = useState<{ id: string; username: string; email: string} | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [currentDate, setCurrentDate] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');

  const { ref: pollsRef, isInView: pollsInView } = useInView();

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
          api.fetchUserDetails(decoded.id)
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

    api.getPolls()
    .then((pollsData) => setPolls(pollsData))
    .catch((err) => console.error('Failed to fetch polls:', err));

  }, [router]);

  // To update current time
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();

      const formattedDate = now.toLocaleDateString([], {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const formattedTime = now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      setCurrentDate(formattedDate);
      setCurrentTime(formattedTime);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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
      <motion.div
      className="relative isolate overflow-hidden bg-gray-900 py-24 sm:py-32"
      initial={{opacity: 0, x: 25}}
      animate={{opacity: 1, x: 0}}
      transition={{ duration: 1, ease: 'easeInOut'}}
      >
        <Image
        src="/Emoji Background.jpg" 
        alt="Background"
        className="absolute inset-0 -z-10 size-full object-cover object-right md:object-center"
        width={1920}
        height={1080}
        />
        <div 
        className="hidden sm:absolute sm:-top-10 sm:right-1/2 sm:-z-10 sm:mr-10 sm:block sm:transform-gpu sm:blur-3xl" 
        aria-hidden="true"
        >
          <div 
          className="aspect-[1097/845] w-[68.5625rem] bg-gradient-to-tr from-[#ff4694] to-[#776fff] opacity-20" 
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
          />
        </div>
        <div 
        className="absolute -top-52 left-1/2 -z-10 -translate-x-1/2 transform-gpu blur-3xl sm:top-[-28rem] sm:ml-16 sm:translate-x-0 sm:transform-gpu"
        aria-hidden="true"
        >
          <div
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
            className="aspect-[1097/845] w-[68.5625rem] bg-gradient-to-tr from-[#ff4694] to-[#776fff] opacity-20"
          />
        </div>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:mx-0">
            <h2 className="text-5xl font-semibold tracking-tight text-white sm:text-7xl">Welcome back, {user?.username}</h2>
          </div>
        </div>
      </motion.div>

      {/* Current Time */}
      <motion.div
      className="relative isolate overflow-hidden bg-orange-300 py-24 sm:py-32"
      initial={{opacity: 0, x: 25}}
      animate={{opacity: 1, x: 0}}
      transition={{ duration: 1, ease: 'easeInOut'}}
      >
        <div className="text-center text-white">
          <h2 className="text-5xl font-bold mb-10">Current Time</h2>
          <p className="text-4xl font-bold">{currentTime}</p> {/* Time on top */}
          <p className="text-xl mt-2">{currentDate}</p> {/* Date on bottom */}
        </div>
      </motion.div>

      {/* Ongoing polls section */}
      <motion.div
      ref={pollsRef}
      className="relative isolate overflow-hidden bg-orange-400 py-24 sm:py-32"
      initial={{opacity: 0, x: 25}}
      animate={pollsInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 25 } }
      transition={{ duration: 1, ease: 'easeInOut'}}
      >
        <div className="mt-2">
          <h3 className="text-3xl font-semibold text-white">Ongoing Polls</h3>
            {polls.length > 0 ? (
              <ul className="mt-6 space-y-6">
                {polls.map((poll) => (
                  <li key={poll._id} className="bg-white p-6 rounded shadow-md">
                    <h4 className="text-xl font-bold text-gray-900">{poll.title}</h4>
                    <p className="text-sm text-gray-500">Created by: {poll.createdBy}</p>
                    <ul className="mt-4 space-y-2">
                      {poll.options.map((option, index) => (
                        <li key={index} className="flex justify-between">
                          <span>{option.text}</span>
                          <span>{option.votes} votes</span>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-white mt-6">No ongoing polls at the moment.</p>
            )}
          </div>
      </motion.div>
    </>
  );
}