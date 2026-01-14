import { Course, Instructor, User, Certificate, Module, Lesson, Resource, Quiz } from './types';

export const instructors: Instructor[] = [
  {
    id: '1',
    name: 'John Smith',
    title: 'AI Specialist & Data Scientist',
    avatar: 'https://picsum.photos/400/400?random=1',
    bio: 'John is a leading expert in artificial intelligence with over 15 years of experience in the field.'
  },
  {
    id: '2',
    name: 'Maria Rodriguez',
    title: 'Quantum Computing Researcher',
    avatar: 'https://picsum.photos/400/400?random=2',
    bio: 'Maria has pioneered research in quantum algorithms and their applications in machine learning.'
  },
  {
    id: '3',
    name: 'David Chen',
    title: 'Neuroinformatics Professor',
    avatar: 'https://picsum.photos/400/400?random=3',
    bio: 'David combines neuroscience and computer science to develop brain-inspired AI systems.'
  },
  {
    id: '4',
    name: 'Sarah Johnson',
    title: 'Robotics Engineer & Educator',
    avatar: 'https://picsum.photos/400/400?random=4',
    bio: 'Sarah specializes in human-robot interaction and autonomous systems design.'
  }
];

// Add sample lessons and modules for the first course
const courseOneLessons: Lesson[] = [
  {
    id: 'lesson-1-1',
    title: 'Introduction to Storytelling',
    description: 'Learn the foundations of effective storytelling and why it matters for your business.',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    duration: '12:34',
    resources: [
      {
        id: 'resource-1-1',
        title: 'Storytelling Framework PDF',
        type: 'pdf',
        url: '/resources/storytelling-framework.pdf'
      },
      {
        id: 'resource-1-2',
        title: 'Additional Reading',
        type: 'link',
        url: 'https://www.example.com/storytelling-resources'
      }
    ]
  },
  {
    id: 'lesson-1-2',
    title: 'Finding Your Narrative Voice',
    description: 'Discover your unique storytelling style and how to leverage it for maximum impact.',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    duration: '15:22',
    resources: [
      {
        id: 'resource-2-1',
        title: 'Voice Worksheet',
        type: 'pdf',
        url: '/resources/voice-worksheet.pdf'
      }
    ]
  },
  {
    id: 'lesson-1-3',
    title: 'Story Structure Fundamentals',
    description: 'Master the classic structure that makes stories compelling and memorable.',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    duration: '18:45',
    quizzes: [
      {
        id: 'quiz-1',
        title: 'Story Structure Quiz',
        questions: [
          {
            id: 'q1',
            question: 'What is the typical three-act structure?',
            options: [
              'Beginning, middle, end',
              'Setup, confrontation, resolution',
              'Intro, body, conclusion',
              'Hook, build, payoff'
            ],
            correctOptionIndex: 1
          },
          {
            id: 'q2',
            question: 'Which element is most crucial for creating tension?',
            options: [
              'Strong protagonist',
              'Detailed setting',
              'Clear conflict',
              'Surprise ending'
            ],
            correctOptionIndex: 2
          }
        ]
      }
    ]
  }
];

const courseTwoLessons: Lesson[] = [
  {
    id: 'lesson-2-1',
    title: 'Building a Profitable Brand Story',
    description: 'Learn how to craft a brand narrative that resonates with your audience and drives sales.',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    duration: '14:50'
  },
  {
    id: 'lesson-2-2',
    title: 'Case Studies: Stories That Sold Millions',
    description: 'Analyze real-world examples of storytelling that translated directly to business success.',
    videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
    duration: '22:18',
    isLocked: true
  }
];

const courseThreeLessons: Lesson[] = [
  {
    id: 'lesson-3-1',
    title: 'Advanced Narrative Techniques',
    description: 'Take your storytelling to the next level with sophisticated techniques used by the pros.',
    videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
    duration: '20:15'
  },
  {
    id: 'lesson-3-2',
    title: 'Storytelling for Different Platforms',
    description: 'Adapt your stories for various media channels while maintaining a consistent message.',
    videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
    duration: '16:42',
    isLocked: true
  },
  {
    id: 'lesson-3-3',
    title: 'Measuring Storytelling ROI',
    description: 'Learn frameworks for quantifying the business impact of your storytelling efforts.',
    videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
    duration: '19:30',
    isLocked: true
  }
];

// Create modules for the first course
const courseOneModules: Module[] = [
  {
    id: 'module-1',
    title: 'Storytelling Foundations',
    lessons: courseOneLessons
  },
  {
    id: 'module-2',
    title: 'Profitable Storytelling',
    lessons: courseTwoLessons
  },
  {
    id: 'module-3',
    title: 'Advanced Techniques',
    lessons: courseThreeLessons
  }
];

export const courses: Course[] = [
  {
    id: '1',
    title: 'Tell Stories, Make Money',
    description: 'Learn how to tell stories that make money, from the basics to the advanced.',
    instructor: instructors[0],
    thumbnail: 'https://picsum.photos/800/450?random=101',
    category: 'Storytelling',
    duration: '8 weeks',
    lessons: 8, // Total across all modules
    level: 'Advanced',
    isFeatured: true,
    modules: courseOneModules
  },
  {
    id: '2',
    title: 'Quantum Computing for AI',
    description: 'Discover how quantum computing is revolutionizing artificial intelligence through quantum algorithms and machine learning.',
    instructor: instructors[1],
    thumbnail: 'https://picsum.photos/800/450?random=102',
    category: 'Quantum Computing',
    duration: '10 weeks',
    lessons: 30,
    level: 'Advanced',
    isFeatured: true
  },
  {
    id: '3',
    title: 'Neural Networks & Deep Learning',
    description: 'Master the theory and practice of neural networks, from single neurons to complex architectures like CNNs and RNNs.',
    instructor: instructors[2],
    thumbnail: 'https://picsum.photos/800/450?random=103',
    category: 'Deep Learning',
    duration: '12 weeks',
    lessons: 36,
    level: 'Intermediate',
    isFeatured: true
  },
  {
    id: '4',
    title: 'Robotics & Embodied Intelligence',
    description: 'Explore how AI systems interact with the physical world through robotics, sensors, and motor control systems.',
    instructor: instructors[3],
    thumbnail: 'https://picsum.photos/800/450?random=104',
    category: 'Robotics',
    duration: '9 weeks',
    lessons: 27,
    level: 'Intermediate'
  },
  {
    id: '5',
    title: 'Natural Language Processing',
    description: 'Learn how computers understand, interpret, and generate human language using statistical methods and deep learning.',
    instructor: instructors[0],
    thumbnail: 'https://picsum.photos/800/450?random=105',
    category: 'Natural Language Processing',
    duration: '8 weeks',
    lessons: 24,
    level: 'Intermediate'
  },
  {
    id: '6',
    title: 'Computer Vision Systems',
    description: 'Discover the techniques that allow computers to see, interpret, and understand the visual world.',
    instructor: instructors[2],
    thumbnail: 'https://picsum.photos/800/450?random=106',
    category: 'Computer Vision',
    duration: '10 weeks',
    lessons: 30,
    level: 'Intermediate'
  }
];

export const currentUser: User = {
  id: 'u1',
  name: 'Gustavo Carreno',
  email: 'gustavo@biialab.org',
  avatar: 'https://media.licdn.com/dms/image/v2/C4D03AQEhVY4uN8-tVw/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1517549956819?e=1752105600&v=beta&t=QFra5iGMep_Q2For-ZPGaeG8vsBkCrZEAwRfkbyecY4',
  progress: [
    {
      courseId: '1',
      progress: 100,
      completed: true,
      completedDate: '2024-11-15',
      certificateId: 'cert-001',
      completedLessons: ['lesson-1-1', 'lesson-1-2', 'lesson-1-3', 'lesson-2-1', 'lesson-2-2', 'lesson-3-1', 'lesson-3-2', 'lesson-3-3'],
      currentLessonId: 'lesson-3-3'
    },
    {
      courseId: '3',
      progress: 65,
      completed: false,
      completedLessons: [],
      currentLessonId: undefined
    },
    {
      courseId: '5',
      progress: 25,
      completed: false,
      completedLessons: [],
      currentLessonId: undefined
    }
  ]
};

export const certificates: Certificate[] = [
  {
    id: 'cert-001',
    userId: 'u1',
    courseId: '1',
    completedDate: '2023-11-15',
    pdfUrl: '/certificates/cert-001.pdf'
  }
]; 