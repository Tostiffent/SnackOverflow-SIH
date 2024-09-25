'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, useAnimation } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { GraduationCap, Book, Users, MessageCircle, Menu, X, Clock, Database, Mic } from 'lucide-react'

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const controls = useAnimation()
  const [ref, inView] = useInView()

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
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
    <div className="bg-gradient-to-br from-purple-600 to-indigo-800 text-white min-h-screen flex flex-col w-full">
      <nav className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg p-4 fixed top-0 left-0 right-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold flex items-center">
            <motion.div
              animate={pulseAnimation}
              className="flex items-center"
            >
              <GraduationCap className="mr-2" />
              EduMitra
            </motion.div>
          </Link>
          <div className="md:hidden" onClick={toggleMenu}>
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </div>
          <ul className={`md:flex md:space-x-8 ${isMenuOpen ? 'block absolute top-full left-0 right-0 bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg p-4 md:p-0 md:relative md:bg-transparent' : 'hidden'}`}>
            {['Home', 'Courses', 'About', 'Contact'].map((item) => (
              <motion.li
                key={item}
                className="md:inline-block my-2 md:my-0"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link href={`/${item.toLowerCase()}`} className="hover:text-purple-300 transition-colors duration-200">
                  {item}
                </Link>
              </motion.li>
            ))}
          </ul>
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
              <Link href="/chatbot" className="bg-white text-purple-600 hover:bg-purple-100 font-bold py-3 px-8 rounded-full transition-colors duration-200 flex items-center justify-center">
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
                className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg p-6 rounded-lg text-center flex flex-col items-center"
                variants={fadeIn}
                whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
              >
                <motion.div
                  animate={pulseAnimation}
                  className="text-purple-300"
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
      <section className="w-full px-4 py-16 bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold mb-8"
            initial="hidden"
            animate={controls}
            variants={fadeIn}
          >
            Explore the Future of Education with EduMitra
          </motion.h2>
          <motion.p
            className="text-lg mb-8"
            initial="hidden"
            animate={controls}
            variants={fadeIn}
          >
            Your journey to Rajasthan's top engineering and polytechnic institutes starts here! Experience hassle-free admissions and let EduMitra be your guide.
          </motion.p>
          <motion.div
            initial="hidden"
            animate={controls}
            variants={fadeIn}
          >
            <Link href="/chatbot" className="bg-white text-purple-600 hover:bg-purple-100 font-bold py-3 px-8 rounded-full transition-colors duration-200 inline-flex items-center">
              <MessageCircle className="mr-2" />
              Get Started with EduMitra
            </Link>
          </motion.div>
        </div>
      </section>
      <footer className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg py-8 w-full">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>&copy; 2024 EduMitra. All rights reserved.</p>
          <p className="mt-2">Empowering Education, Simplifying Admissions!</p>
        </div>
      </footer>
    </div>
  )
}