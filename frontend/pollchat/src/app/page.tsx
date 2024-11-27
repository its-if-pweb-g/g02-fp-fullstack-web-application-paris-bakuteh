'use client'

import React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { TransitionLink } from '@/components/utils/TransitionLink';

export default function Home() {
  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-screen p-5 bg-gray-100"
      initial={{opacity: 0, x: 25}}
      animate={{opacity: 1, x: 0}}
      transition={{ duration: 1, ease: 'easeInOut'}}
    >
      <h1 className="text-4xl font-bold text-gray-800 mb-4">Welcome to Pollchat!</h1>
      <p className="text-lg text-gray-600 mb-8">Engage in polls and chat with friends. Create your account or log in to get started.</p>

      <div className="flex space-x-4">
        <Link href="/register">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
          >
            Register
          </motion.button>
        </Link>
        <Link href="/login">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full"
          >
            Login
          </motion.button>
        </Link>
      </div>
    </motion.div>
  );
}
