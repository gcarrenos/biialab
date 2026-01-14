import Image from 'next/image';
import Link from 'next/link';

export default function PartnershipsPage() {
  // University partners
  const universityPartners = [
    { name: 'Imperial College London', logo: '/images/partnerships/imperial.svg' },
    { name: 'University of Michigan', logo: '/images/partnerships/michigan.svg' },
    { name: 'Yale University', logo: '/images/partnerships/yale.svg' },
    { name: 'University of Pennsylvania', logo: '/images/partnerships/penn.svg' },
    { name: 'Indian Institute of Technology', logo: '/images/partnerships/iit.svg' },
    { name: 'Illinois', logo: '/images/partnerships/illinois.svg' },
  ];

  // Industry partners
  const industryPartners = [
    { name: 'Google', logo: '/images/partnerships/google.svg' },
    { name: 'IBM', logo: '/images/partnerships/ibm.svg' },
    { name: 'Meta', logo: '/images/partnerships/meta.svg' },
    { name: 'DeepLearning.AI', logo: '/images/partnerships/deeplearning.svg' },
  ];

  return (
    <div className="bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background-light to-background overflow-hidden">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-text-primary mb-6">
            Partner with BiiAMind. Teach the World.
          </h1>
          <p className="text-lg md:text-xl text-text-secondary max-w-3xl mx-auto mb-12">
            Create and deliver world-class online degrees and career training programs to learners worldwide.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-background-light p-8 rounded-lg border border-gray-800">
              <h3 className="text-xl font-bold text-text-primary mb-2">University Partnerships</h3>
              <p className="text-text-secondary">
                Bring your degrees to learners worldwide while building brand visibility, reaching new audiences, and expanding impact.
              </p>
            </div>
            <div className="bg-background-light p-8 rounded-lg border border-gray-800">
              <h3 className="text-xl font-bold text-text-primary mb-2">Industry Partnerships</h3>
              <p className="text-text-secondary">
                Extend your reach, diversify your talent pipelines, and help learners reach their career goals with in-demand training and certifications.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Partners Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
            Our Partners
          </h2>
          <p className="text-text-secondary max-w-3xl mx-auto mb-12">
            Representing over 350+ leading universities and companies who are transforming lives through learning.
          </p>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8 max-w-5xl mx-auto">
            {[...universityPartners, ...industryPartners].map((partner) => (
              <div key={partner.name} className="flex items-center justify-center h-16 bg-background-light rounded-lg p-4 grayscale hover:grayscale-0 transition-all">
                <div className="h-12 w-full relative">
                  <Image 
                    src={partner.logo} 
                    alt={partner.name} 
                    fill
                    className="object-contain"
                    unoptimized={true}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background-light border-y border-gray-800">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-6 text-center">
            Benefits of partnership
          </h2>
          <p className="text-text-secondary max-w-3xl mx-auto mb-12 text-center">
            Leverage the BiiAMind platform to reach millions of learners, educators, and institutions across more than 190 countries with your world-class content.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-background p-8 rounded-lg border border-gray-800 text-center">
              <div className="text-4xl font-bold text-accent mb-2">162M+</div>
              <div className="text-text-primary font-medium mb-1">Registered learners</div>
              <div className="text-text-secondary text-sm">Learning and prospering</div>
            </div>
            <div className="bg-background p-8 rounded-lg border border-gray-800 text-center">
              <div className="text-4xl font-bold text-accent mb-2">7,500+</div>
              <div className="text-text-primary font-medium mb-1">Institutions</div>
              <div className="text-text-secondary text-sm">Transforming talent</div>
            </div>
            <div className="bg-background p-8 rounded-lg border border-gray-800 text-center">
              <div className="text-4xl font-bold text-accent mb-2">350+</div>
              <div className="text-text-primary font-medium mb-1">Educator partners</div>
              <div className="text-text-secondary text-sm">Teaching the world</div>
            </div>
          </div>
        </div>
      </section>

      {/* University Partnerships Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
                University Partnerships
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
                Bring your degrees to learners worldwide
              </h2>
              <p className="text-text-secondary mb-8">
                Join a global community of top universities offering online degrees and courses that build brand visibility, reach new audiences, and expand your impact.
              </p>
              
              <ul className="space-y-4">
                <li className="flex">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-accent/10 flex items-center justify-center mr-3">
                    <svg className="h-4 w-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-text-secondary">Reach a global community of dedicated learners.</span>
                </li>
                <li className="flex">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-accent/10 flex items-center justify-center mr-3">
                    <svg className="h-4 w-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-text-secondary">Create reusable, stackable, and scalable degree content to optimize return on investment.</span>
                </li>
                <li className="flex">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-accent/10 flex items-center justify-center mr-3">
                    <svg className="h-4 w-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-text-secondary">Utilize data insights from more than 200 million course enrollments to drive teaching and learning success.</span>
                </li>
              </ul>
            </div>
            <div className="relative h-64 md:h-96 w-full rounded-lg overflow-hidden">
              <Image 
                src="/images/partnerships/university.jpg" 
                alt="University Partnerships" 
                fill
                className="object-cover"
                unoptimized={true}
              />
            </div>
          </div>

          {/* University Testimonial */}
          <div className="mt-16 bg-background-light p-8 rounded-lg border border-gray-800">
            <blockquote className="text-lg text-text-secondary italic mb-6">
              &quot;Our online degree is being taken by people in over 100 countries. The learners are a different demographic from our on-campus programs. [...] I feel I&apos;m genuinely creating an opportunity for people with the content we create on BiiAMind.&quot;
            </blockquote>
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center text-white text-xl font-bold mr-4">
                MY
              </div>
              <div>
                <p className="text-text-primary font-medium">Dr. Matthew Yee-King</p>
                <p className="text-text-secondary text-sm">Programme Director, Goldsmiths, University of London</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Industry Partnerships Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background-light border-y border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 relative h-64 md:h-96 w-full rounded-lg overflow-hidden">
              <Image 
                src="/images/partnerships/industry.jpg" 
                alt="Industry Partnerships" 
                fill
                className="object-cover"
                unoptimized={true}
              />
            </div>
            <div className="order-1 md:order-2">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
                Industry Partnerships
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
                Extend your reach and build talent pipelines
              </h2>
              <p className="text-text-secondary mb-8">
                Join leading companies offering career-relevant training and certifications that help learners achieve their career goals while building your talent pipeline.
              </p>
              
              <ul className="space-y-4">
                <li className="flex">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-accent/10 flex items-center justify-center mr-3">
                    <svg className="h-4 w-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-text-secondary">Build a diversified and highly-qualified talent pipeline of learners trained on the latest technologies.</span>
                </li>
                <li className="flex">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-accent/10 flex items-center justify-center mr-3">
                    <svg className="h-4 w-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-text-secondary">Drive awareness and adoption of your products and services.</span>
                </li>
                <li className="flex">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-accent/10 flex items-center justify-center mr-3">
                    <svg className="h-4 w-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-text-secondary">Deliver your learning content to more than 7,000 enterprise, government, and higher education institutions.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Industry Testimonial */}
          <div className="mt-16 bg-background p-8 rounded-lg border border-gray-800">
            <blockquote className="text-lg text-text-secondary italic mb-6">
              &quot;As a Somalian refugee, the ability to take the courses on my own schedule gave me the opportunity and motivation to pursue my dream of working in data and technology.&quot;
            </blockquote>
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center text-white text-xl font-bold mr-4">
                ZA
              </div>
              <div>
                <p className="text-text-primary font-medium">Zackriya A.</p>
                <p className="text-text-secondary text-sm">Learner from IBM Data Analyst Professional Certificate</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
              Get support every step of the way
            </h2>
            <p className="text-text-secondary max-w-3xl mx-auto">
              Partnering with BiiAMind is a collaborative experience. Our team of experts will help you:
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-16">
            <div className="bg-background-light p-8 rounded-lg border border-gray-800 text-center">
              <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center text-accent mx-auto mb-4">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-text-primary mb-2">Determine which programs to offer</h3>
              <p className="text-text-secondary text-sm">
                We'll help you identify the right courses and degrees based on market demand and your strengths.
              </p>
            </div>
            <div className="bg-background-light p-8 rounded-lg border border-gray-800 text-center">
              <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center text-accent mx-auto mb-4">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-text-primary mb-2">Market your programs effectively</h3>
              <p className="text-text-secondary text-sm">
                Our marketing team will collaborate with you to promote your content to relevant audiences.
              </p>
            </div>
            <div className="bg-background-light p-8 rounded-lg border border-gray-800 text-center">
              <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center text-accent mx-auto mb-4">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-text-primary mb-2">Ensure successful learner outcomes</h3>
              <p className="text-text-secondary text-sm">
                We provide ongoing support to optimize completion rates and learner satisfaction.
              </p>
            </div>
          </div>
          
          {/* Support Testimonial */}
          <div className="bg-background-light p-8 rounded-lg border border-gray-800 max-w-4xl mx-auto">
            <blockquote className="text-lg text-text-secondary italic mb-6">
              &quot;We have a fantastic partnership team at BiiAMind who have guided us on everything we can do to support our course marketing efforts.&quot;
            </blockquote>
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center text-white text-xl font-bold mr-4">
                SS
              </div>
              <div>
                <p className="text-text-primary font-medium">Sandhya Simhan</p>
                <p className="text-text-secondary text-sm">Director of Marketing and Communications, DeepLearning.AI</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-accent/5">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
            Ready to partner with BiiAMind?
          </h2>
          <p className="text-text-secondary max-w-2xl mx-auto mb-8">
            Join our growing community of education and industry leaders who are helping transform lives through learning.
          </p>
          <Link 
            href="/contact" 
            className="inline-flex items-center px-6 py-3 bg-accent text-white font-medium rounded-md hover:bg-accent/90 transition-colors"
          >
            Become a Partner
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
} 