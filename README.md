# BiiAMind Educational Platform

BiiAMind is a modern, Masterclass-inspired educational platform for high-quality courses in AI, technology, and professional development.

![BiiAMind Platform](public/images/readme-screenshot.png)

## Features

- **Comprehensive Course Library**: Browse and filter courses by category and difficulty level
- **Immersive Learning Experience**: Video lessons with supplemental resources
- **User Progress Tracking**: Track completed lessons and course progress
- **Certificates**: Earn certificates upon course completion
- **Responsive Design**: Optimized for mobile, tablet, and desktop devices
- **Dark Mode Interface**: Modern, eye-friendly dark theme

## Pages & Functionality

- **Home**: Featured courses and platform introduction
- **Courses**: Browsable catalog with filtering capabilities
- **Course Detail**: In-depth course information and curriculum
- **Lesson Player**: Video player with resources and progress tracking
- **Account**: User profile and course progress management
- **Admin Dashboard**: Course, user and content management
- **Social Impact**: Information about educational initiatives
- **Partnerships**: University and industry partnership opportunities

## Tech Stack

- **Frontend Framework**: Next.js 15.3 with TypeScript
- **Styling**: Tailwind CSS 4
- **Icons**: Heroicons, React Icons
- **PDF Generation**: React PDF Renderer
- **Animation**: Framer Motion

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm 8.x or later

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/biialab.git
cd biialab

# Install dependencies
npm install

# Start the development server with Turbopack
npm run dev
```

The application will be available at http://localhost:3000

### Building for Production

```bash
# Create an optimized production build
npm run build

# Start the production server
npm run start
```

## Deployment

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md)

## Project Structure

```
biialab/
├── public/             # Static assets
├── src/
│   ├── app/            # Pages and routes
│   ├── components/     # Reusable UI components
│   ├── lib/            # Utilities and data
│   └── types/          # TypeScript type definitions
├── .eslintrc.json      # ESLint configuration
├── next.config.js      # Next.js configuration
└── tailwind.config.js  # Tailwind CSS configuration
```

## License

This project is proprietary software.

## Contact

For inquiries, please contact [your-email@example.com](mailto:your-email@example.com)
