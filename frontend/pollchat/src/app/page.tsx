'use client'

import React from 'react';
import Link from 'next/link';
import styles from '../components/Home.module.css'

export default async function Home() {
  return (
    <div className={styles.container}>
      <h1 className={styles.header}>Welcome to Pollchat!</h1>
      <p>Engage in polls and chat with friends. Create your account or log in to get started.</p>

      <div style={{marginTop: '20px'}}>
        <Link href="/register">
          <button className={styles.button}>Register</button>
        </Link>
        <Link href="/login">
          <button className={styles.button}>Login</button>
        </Link>
      </div>
    </div>
  );
}
