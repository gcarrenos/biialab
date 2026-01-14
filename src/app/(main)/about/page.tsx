'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { getPlaceholderImage } from '@/lib/imageUtils';
import { instructors } from '@/lib/data';

export default function AboutPage() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.4, 0.9, 1], [1, 0.8, 0.6, 0.4, 0]);
  
  const [stats, setStats] = useState([
    { value: 0, label: 'Learners', target: 100000 },
    { value: 0, label: 'Courses', target: 50 },
    { value: 0, label: 'Instructors', target: 25 },
    { value: 0, label: 'Countries', target: 120 },
  ]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => 
        prev.map(stat => {
          // If we haven't reached the target yet, increment
          if (stat.value < stat.target) {
            const increment = Math.max(1, Math.floor(stat.target / 100));
            return { 
              ...stat, 
              value: Math.min(stat.value + increment, stat.target) 
            };
          }
          return stat;
        })
      );
    }, 30);
    
    // Clean up the interval when the component unmounts
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="relative bg-background text-text-primary">
      {/* Hero Section with Parallax */}
      <section className="relative h-[80vh] overflow-hidden">
        <motion.div 
          style={{ y, opacity }}
          className="absolute inset-0 z-0"
        >
          <Image
            src={getPlaceholderImage(1920, 1080, 'about-hero')}
            alt="BiiAMind Innovation"
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background"></div>
        </motion.div>
        
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Redefining <span className="text-accent">Education</span> for the Digital Age
            </h1>
            <p className="text-xl md:text-2xl text-text-secondary mb-8">
              BiiAMind is where technology meets transformative learning.
            </p>
            <Link
              href="/courses"
              className="inline-flex items-center px-8 py-4 bg-accent text-white rounded-md font-semibold text-lg hover:bg-accent/90 transition-colors"
            >
              Explore Our Courses
            </Link>
          </motion.div>
        </div>
      </section>
      
      {/* Mission Section */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
                <p className="text-text-secondary text-lg mb-6">
                  At BiiAMind, we're on a mission to democratize access to cutting-edge knowledge and skills in artificial intelligence, quantum computing, and advanced technologies.
                </p>
                <p className="text-text-secondary text-lg mb-6">
                  We believe that transformative education should be accessible, engaging, and tailored to the needs of modern learners. By connecting experts and enthusiasts, we're building a community committed to shaping the future of technology and innovation.
                </p>
                <p className="text-text-secondary text-lg">
                  Our platform offers immersive learning experiences designed to empower individuals from all backgrounds to thrive in an increasingly digital world.
                </p>
              </motion.div>
            </div>
            
            <div className="relative h-[500px] rounded-lg overflow-hidden">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="h-full w-full"
              >
                <Image 
                  src={getPlaceholderImage(800, 1000, 'about-mission')}
                  alt="Our mission visualization"
                  fill
                  className="object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-accent/20 rounded-lg"></div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Stats Section */}
      <section className="py-24 bg-background-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-16">BiiAMind by the Numbers</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="p-6 bg-background rounded-lg shadow-lg">
                  <div className="text-4xl md:text-5xl font-bold text-accent mb-2">
                    {stat.value.toLocaleString()}+
                  </div>
                  <div className="text-lg text-text-secondary">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Values */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold mb-6">Our Core Values</h2>
            <p className="text-text-secondary text-lg max-w-3xl mx-auto">
              The principles that guide everything we do at BiiAMind
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                ),
                title: "Innovation",
                description: "We constantly push boundaries, embracing new technologies and methodologies to deliver cutting-edge educational experiences."
              },
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                ),
                title: "Community",
                description: "We believe in the power of collaboration and connection, fostering a supportive environment where learners and experts thrive together."
              },
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ),
                title: "Excellence",
                description: "We are committed to quality in everything we create, from course content to user experience, ensuring the highest standards of educational value."
              }
            ].map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-background-light p-8 rounded-lg text-center"
              >
                <div className="flex justify-center mb-4">
                  {value.icon}
                </div>
                <h3 className="text-xl font-bold mb-4">{value.title}</h3>
                <p className="text-text-secondary">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Team */}
      <section className="py-24 bg-background-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold mb-6">Our Expert Instructors</h2>
            <p className="text-text-secondary text-lg max-w-3xl mx-auto">
              Learn from industry leaders and academic pioneers at the forefront of technology and innovation
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {instructors.map((instructor, index) => (
              <motion.div
                key={instructor.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-background p-6 rounded-lg shadow-lg"
              >
                <div className="relative h-48 w-48 mx-auto mb-6 overflow-hidden rounded-full">
                  <Image 
                    src={instructor.avatar} 
                    alt={instructor.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <h3 className="text-xl font-bold mb-2">{instructor.name}</h3>
                <p className="text-accent mb-4">{instructor.title}</p>
                <p className="text-text-secondary text-sm">{instructor.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Join Us CTA */}
      <section className="py-24 bg-background relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20">
          <Image
            src={getPlaceholderImage(1920, 1080, 'about-cta')}
            alt="Background pattern"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Unlock Your Potential?
            </h2>
            <p className="text-xl text-text-secondary mb-10 max-w-2xl mx-auto">
              Join BiiAMind today and embark on a journey of discovery, growth, and innovation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/courses"
                className="inline-flex items-center justify-center px-8 py-4 bg-accent text-white rounded-md font-semibold text-lg hover:bg-accent/90 transition-colors"
              >
                Explore Courses
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-4 border border-accent text-accent rounded-md font-semibold text-lg hover:bg-accent/10 transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
} 