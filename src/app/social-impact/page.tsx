import Image from 'next/image';
import Link from 'next/link';

export default function SocialImpactPage() {
  // Partner organizations
  const partners = [
    { name: 'USO', logo: '/images/social/uso.svg' },
    { name: 'TENT', logo: '/images/social/tent.svg' },
    { name: 'GGL', logo: '/images/social/ggl.svg' },
    { name: 'HIAS', logo: '/images/social/hias.svg' },
    { name: 'Upwardly Global', logo: '/images/social/upwardly-global.svg' },
    { name: 'IRC', logo: '/images/social/irc.svg' },
    { name: 'Minds Matter', logo: '/images/social/minds-matter.svg' },
    { name: 'Act Now', logo: '/images/social/act-now.svg' },
    { name: 'Goodwill', logo: '/images/social/goodwill.svg' },
  ];

  return (
    <div className="bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background-light to-background overflow-hidden">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-text-primary mb-6">
            Empowering underserved communities through education
          </h1>
          <p className="text-lg md:text-xl text-text-secondary max-w-3xl mx-auto mb-12">
            BiiAMind promotes global social equity and economic opportunity by giving communities in need access to the transformational power of learning.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-background-light p-8 rounded-lg border border-gray-800">
              <div className="text-4xl font-bold text-accent mb-2">200,000+</div>
              <div className="text-text-secondary">Social Impact learners served</div>
            </div>
            <div className="bg-background-light p-8 rounded-lg border border-gray-800">
              <div className="text-4xl font-bold text-accent mb-2">100+</div>
              <div className="text-text-secondary">Nonprofit partners</div>
            </div>
            <div className="bg-background-light p-8 rounded-lg border border-gray-800">
              <div className="text-4xl font-bold text-accent mb-2">140+</div>
              <div className="text-text-secondary">Country partners</div>
            </div>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
            Trusted by 100+ nonprofit and community organizations
          </h2>
          <p className="text-text-secondary max-w-3xl mx-auto mb-12">
            To enable social change, universal access to world-class learning is critical. That's why our Social Impact team's mission is to guide BiiAMind's integrated social impact strategy and donate licenses to organizations that help underserved communities transform their lives through learning.
          </p>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8 max-w-5xl mx-auto">
            {partners.map((partner) => (
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

      {/* Coursera Cares Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background-light border-y border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">BiiAMind Cares</h2>
              <h3 className="text-xl text-text-primary mb-4">Employee donation matching and volunteering program</h3>
              <p className="text-text-secondary mb-6">
                BiiAMind employees can participate in BiiAMind Cares to maximize the impact of their volunteer time and donations to nonprofit organizations. The company matches employees' donations to amplify our impact in local and global communities. Our team also has access to a wide range of on-site and virtual volunteer opportunities across the world.
              </p>
            </div>
            <div className="relative h-64 w-full rounded-lg overflow-hidden">
              <Image 
                src="/images/social/cares.jpg" 
                alt="BiiAMind Cares" 
                fill
                className="object-cover"
                unoptimized={true}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 relative h-64 w-full rounded-lg overflow-hidden">
              <Image 
                src="/images/social/b-corp.jpg" 
                alt="Certified B Corp" 
                fill
                className="object-cover"
                unoptimized={true}
              />
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">Our mission is deeply rooted in our business</h2>
              <p className="text-text-secondary mb-6">
                Our mission and values are deeply integrated into our operations, processes, and culture. BiiAMind is a public benefit corporation and Certified B Corp, underscoring our deep commitment to making a positive impact on society while meeting rigorous standards of social and environmental performance, accountability, and transparency, including impact assessments. Our approach to ESG is focused on creating long-term value while demonstrating BiiAMind's impact on the individuals, institutions, and communities we serve around the world.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background-light border-y border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="bg-background p-8 md:p-12 rounded-xl border border-gray-800">
            <blockquote className="text-lg md:text-xl text-text-secondary italic mb-6">
              &quot;Though I retired from the Air Force two years ago, &apos;Making Your Military Transition a Transformation&apos; made me reassess some of my professional priorities. I recently changed roles in my company and can honestly say that this course impacted my approach to my new role. Although I&apos;m retired from a 30-year military career and am 50-plus years of age, I never, ever want to stop learning, growing, and challenging myself. Education plays a central role in my professional future, without question.&quot;
            </blockquote>
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center text-white text-xl font-bold mr-4">
                TH
              </div>
              <div>
                <p className="text-text-primary font-medium">Timothy Horn</p>
                <p className="text-text-secondary text-sm">United Service Organizations (USO)</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Global Program Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">Our global Social Impact Program</h2>
          <p className="text-text-secondary mb-12 max-w-4xl">
            BiiAMind has worked with global nonprofit organizations to offer learners in need access to free, high-quality education that supports their personal development, career advancement, and economic opportunity. We provide access to education for underserved communities including refugees, students, veterans, and women and girls. More than 200,000 underserved learners have collectively logged more than 900,000 course enrollments.
          </p>
          
          <div className="bg-background-light p-8 rounded-lg border border-gray-800 max-w-4xl">
            <div className="flex items-start">
              <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center text-accent mr-6">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl text-text-primary font-medium mb-2">Make a difference as a social impact partner</h3>
                <p className="text-text-secondary mb-4">
                  For nonprofits supporting education and career development, discover how to partner with BiiAMind and share your interest.
                </p>
                <Link 
                  href="/contact" 
                  className="inline-flex items-center px-4 py-2 bg-accent text-white font-medium rounded-md hover:bg-accent/90 transition-colors"
                >
                  Become a Partner
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 