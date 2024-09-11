'use client';
import Link from 'next/link';
import React, { useState } from 'react';

const LandingPage: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="bg-gray-900 text-white flex flex-col min-h-full">
      <nav className="bg-gray-800 p-4 fixed top-0 left-0 right-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-xl font-bold">Museum Site</div>
          <div className="md:hidden" onClick={toggleMenu}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5m-16.5 3h16.5m-16.5 3h16.5" />
            </svg>
          </div>
          <ul className={`md:flex md:space-x-4 ${isMenuOpen ? 'md:flex' : 'hidden'}`}>
            <li>
              <Link href="/">Home</Link>
            </li>
            <li>
              <Link href="/exhibitions">Exhibitions</Link>
            </li>
            <li>
              <Link href="/about">About</Link>
            </li>
            <li>
              <Link href="/contact">Contact</Link>
            </li>
          </ul>
        </div>
      </nav>
      <div className="mt-20 container mx-auto flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to the Museum</h1>
        <p className="text-lg mb-8">Explore the rich history and culture</p>
        <Link href="/login" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Get Started
        </Link>
      </div>
      <div className='mt-10 container mx-auto flex flex-col items-center justify-center'>
        <Link href='/chatbot' className='bg-red-600 hover:bg-red-400 text-white font-bold py-2 px-4 rounded-mdcd'>Chatbot</Link>
      </div>
    </div>
  );
};

export default LandingPage;