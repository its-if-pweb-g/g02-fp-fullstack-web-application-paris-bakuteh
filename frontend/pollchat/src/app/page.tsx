'use client'

import React, { useEffect, useState } from 'react';
import { getHelloMessage } from '../../services/api.js';

export default function Home() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    getHelloMessage().then(setMessage);
  }, []);

  return (
    <div>
      <h1>Next.js Frontend</h1>
      <p>Message from Backend: {message}</p>
    </div>
  );
}
