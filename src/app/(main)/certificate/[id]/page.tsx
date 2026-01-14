'use client';

import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { certificates, courses, currentUser } from '@/lib/data';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, pdf } from '@react-pdf/renderer';

interface CertificatePageProps {
  params: {
    id: string;
  };
}

// Create styles for PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
  },
  header: {
    marginBottom: 20,
    fontSize: 12,
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: 'bold',
    color: '#e50914',
  },
  content: {
    margin: 30,
    padding: 30,
    borderWidth: 2,
    borderColor: '#e50914',
    borderStyle: 'solid',
  },
  name: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  text: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 1.5,
  },
  courseName: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 30,
    fontWeight: 'bold',
  },
  date: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
  },
  signature: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 60,
    marginLeft: 40,
    marginRight: 40,
  },
  signatureBox: {
    borderTopWidth: 1,
    borderTopColor: '#000000',
    borderTopStyle: 'solid',
    paddingTop: 10,
    width: 150,
    textAlign: 'center',
  },
  signatureText: {
    fontSize: 10,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 10,
    color: '#666666',
  },
});

// Certificate PDF Document
const CertificatePDF = ({ certificate, course, user }: { certificate: any, course: any, user: any }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>BiiAMind</Text>
      <Text style={styles.title}>Certificate of Completion</Text>
      
      <View style={styles.content}>
        <Text style={styles.text}>This is to certify that</Text>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.text}>has successfully completed the course</Text>
        <Text style={styles.courseName}>{course.title}</Text>
        <Text style={styles.text}>With all the rights and privileges thereto appertaining</Text>
        <Text style={styles.date}>Issued on {certificate.completedDate}</Text>
        
        <View style={styles.signature}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureText}>Course Instructor</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureText}>BiiAMind Director</Text>
          </View>
        </View>
      </View>
      
      <Text style={styles.footer}>
        Certificate ID: {certificate.id} • Verify at biiamind.com/verify
      </Text>
    </Page>
  </Document>
);

export default function CertificatePage({ params }: CertificatePageProps) {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const certificate = certificates.find(cert => cert.id === params.id);
  
  if (!certificate) {
    notFound();
  }
  
  const course = courses.find(c => c.id === certificate.courseId);
  
  if (!course) {
    notFound();
  }
  
  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-background-light p-8 rounded-lg">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-text-primary">Certificate of Completion</h1>
            <p className="text-text-secondary mt-2">
              Congratulations on completing the course!
            </p>
          </div>
          
          {/* Certificate Display */}
          <div className="max-w-3xl mx-auto bg-white text-black p-8 rounded-lg shadow-lg">
            <div className="text-center border-4 border-accent p-8">
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-accent">BiiAMind</h2>
                <p className="text-lg mt-2">Certificate of Completion</p>
              </div>
              
              <div className="my-8">
                <p className="text-lg">This is to certify that</p>
                <p className="text-3xl font-bold my-2">{currentUser.name}</p>
                <p className="text-lg">has successfully completed the course</p>
                <p className="text-2xl font-bold my-2">{course.title}</p>
                <p className="text-lg">With all the rights and privileges thereto appertaining</p>
              </div>
              
              <div className="mt-6">
                <p className="text-sm">Issued on {certificate.completedDate}</p>
              </div>
              
              <div className="flex justify-between mt-12 px-10">
                <div className="text-center">
                  <div className="border-t border-black w-40 mx-auto"></div>
                  <p className="text-sm mt-2">Course Instructor</p>
                </div>
                <div className="text-center">
                  <div className="border-t border-black w-40 mx-auto"></div>
                  <p className="text-sm mt-2">BiiAMind Director</p>
                </div>
              </div>
              
              <div className="mt-12 text-xs text-gray-600">
                <p>Certificate ID: {certificate.id}</p>
                <p>Verify at biiamind.com/verify</p>
              </div>
            </div>
          </div>
          
          {/* Download Button */}
          <div className="mt-8 text-center">
            {isClient && (
              <PDFDownloadLink
                document={<CertificatePDF certificate={certificate} course={course} user={currentUser} />}
                fileName={`${currentUser.name.replace(/\s+/g, '_')}_${course.title.replace(/\s+/g, '_')}_Certificate.pdf`}
                className="inline-flex items-center px-4 py-2 bg-accent text-white rounded-md font-medium hover:bg-accent/90 transition-colors"
              >
                {({ blob, url, loading, error }) =>
                  loading ? 'Generating PDF...' : 'Download Certificate'
                }
              </PDFDownloadLink>
            )}
          </div>
          
          <div className="mt-8 text-center">
            <a 
              href="/account"
              className="text-accent hover:underline"
            >
              Back to My Account
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 