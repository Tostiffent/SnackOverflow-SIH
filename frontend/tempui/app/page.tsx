'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, useAnimation } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { GraduationCap, Book, Users, MessageCircle, Menu, X, Clock, Database, Mic, Sun, Moon } from 'lucide-react'
import { Button } from "@nextui-org/button"

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const controls = useAnimation()
  const [ref, inView] = useInView()

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
  }

  useEffect(() => {
    if (inView) {
      controls.start('visible')
    }
  }, [controls, inView])

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  const staggerChildren = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  }

  const pulseAnimation = {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }

  return (
    <div className={`min-h-screen flex flex-col w-full ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <nav className="bg-gradient-to-r  from-purple-600 to-indigo-800 bg-opacity-10 opacity-95 backdrop-filter backdrop-blur-3xl p-4 fixed top-0 left-0 right-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold flex items-center text-white">
            <motion.div
              animate={pulseAnimation}
              className="flex items-center"
            >
              <GraduationCap className="mr-2" />
              EduMitra
            </motion.div>
          </Link>
          
          
                
          <Button
            onClick={toggleTheme}
            className="ml-4 p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors duration-200 text-white"
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? <Sun size={25} /> : <Moon size={25} />}
          </Button>
        </div>
      </nav>
      <main className="flex-grow flex flex-col items-center justify-center text-center px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          <motion.h1 
            className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6"
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.5 }}
          >
            EduMitra - Your 24/7 Virtual Admission Assistant
          </motion.h1>
          <motion.p 
            className="text-lg sm:text-xl md:text-2xl mb-12"
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Simplify your journey into Rajasthan's prestigious engineering and polytechnic institutes with AI-powered guidance.
          </motion.p>
          <motion.div 
            className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center"
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link href="/chatbot" className="bg-purple-600 text-white hover:bg-purple-700 font-bold py-3 px-8 rounded-full transition-colors duration-200 flex items-center justify-center">
                <MessageCircle className="mr-2" />
                Chat with EduMitra now!
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </main>
      <section className="w-full px-4 py-16" ref={ref}>
        <div className="max-w-7xl mx-auto">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold mb-12 text-center"
            initial="hidden"
            animate={controls}
            variants={fadeIn}
          >
            Why Choose EduMitra?
          </motion.h2>
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
            initial="hidden"
            animate={controls}
            variants={staggerChildren}
          >
            {[
              { icon: <MessageCircle className="w-16 h-16 mb-4" />, title: "Instant Information Access", description: "Get real-time information on admissions, eligibility, fees, scholarships, and placements." },
              { icon: <Users className="w-16 h-16 mb-4" />, title: "Personalized Guidance", description: "Receive tailored recommendations based on past trends and your goals." },
              { icon: <Mic className="w-16 h-16 mb-4" />, title: "Voice-Based Assistance", description: "Ask questions and get responses in natural language, including regional languages." },
              { icon: <Clock className="w-16 h-16 mb-4" />, title: "24/7 Availability", description: "Access important information anytime, anywhere, without contacting multiple colleges." },
              { icon: <Database className="w-16 h-16 mb-4" />, title: "Data-Driven Insights", description: "Benefit from continuous improvements based on user interactions and trends." },
              { icon: <Book className="w-16 h-16 mb-4" />, title: "Comprehensive Information", description: "Get details on admission processes, curricula, placements, and more." },
            ].map((feature, index) => (
              <motion.div 
                key={feature.title}
                className={`p-6 rounded-lg text-center flex flex-col items-center ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}
                variants={fadeIn}
                whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
              >
                <motion.div
                  animate={pulseAnimation}
                  className="text-purple-600"
                >
                  {feature.icon}
                </motion.div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p>{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
      <footer className={`py-8 w-full ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>&copy; 2024 EduMitra. All rights reserved.</p>
          <p className="mt-2">Empowering Education, Simplifying Admissions!</p>
        </div>
      </footer>
    </div>
  )
}