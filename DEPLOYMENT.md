# BiiAMind Platform Deployment Guide

This document provides instructions for deploying the BiiAMind educational platform to production environments.

## Prerequisites

- Node.js 18.x or later
- npm 8.x or later
- Git

## Local Build & Test

Before deploying to a production environment, it's recommended to build and test the application locally:

```bash
# Install dependencies
npm install

# Build the production version
npm run build

# Start the production server
npm run start
```

The application should be accessible at http://localhost:3000

## Deployment Options

### 1. Vercel (Recommended)

Vercel is the easiest and most optimized platform for deploying Next.js applications.

1. Create an account on [Vercel](https://vercel.com/)
2. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```
3. Login to Vercel:
   ```bash
   vercel login
   ```
4. Deploy from the project root:
   ```bash
   vercel --prod
   ```

### 2. AWS Amplify

AWS Amplify provides a continuous deployment and hosting service.

1. Create an AWS account if you don't have one
2. Navigate to AWS Amplify in the AWS console
3. Click "New app" > "Host web app"
4. Connect to your Git repository
5. Configure build settings:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```
6. Click "Save and deploy"

### 3. Docker Deployment

For containerized deployments, you can use Docker:

1. Create a `Dockerfile` in the project root:
   ```Dockerfile
   FROM node:18-alpine AS base
   
   # Install dependencies only when needed
   FROM base AS deps
   WORKDIR /app
   COPY package.json package-lock.json ./
   RUN npm ci
   
   # Rebuild the source code only when needed
   FROM base AS builder
   WORKDIR /app
   COPY --from=deps /app/node_modules ./node_modules
   COPY . .
   RUN npm run build
   
   # Production image, copy all the files and run next
   FROM base AS runner
   WORKDIR /app
   
   ENV NODE_ENV production
   
   COPY --from=builder /app/public ./public
   COPY --from=builder /app/.next ./.next
   COPY --from=builder /app/node_modules ./node_modules
   COPY --from=builder /app/package.json ./package.json
   
   EXPOSE 3000
   
   CMD ["npm", "run", "start"]
   ```

2. Build the Docker image:
   ```bash
   docker build -t biialab:latest .
   ```

3. Run the container:
   ```bash
   docker run -p 3000:3000 biialab:latest
   ```

### 4. Traditional Hosting

For traditional hosting environments:

1. Build the application:
   ```bash
   npm run build
   ```

2. Package the following files/directories for deployment:
   - `.next/`
   - `public/`
   - `package.json`
   - `package-lock.json`
   - `next.config.js`

3. On the server, install dependencies:
   ```bash
   npm ci --production
   ```

4. Start the application:
   ```bash
   npm run start
   ```

## Environment Variables

The following environment variables should be set in your production environment:

- `NODE_ENV=production` - Ensures optimized production build
- `NEXT_PUBLIC_API_URL` - URL of your backend API (if applicable)
- `DATABASE_URL` - Database connection string (if applicable)

## SSL Configuration

For production deployments, always ensure SSL is properly configured. If using a reverse proxy like Nginx, configure it to handle SSL termination.

## Monitoring

Consider setting up monitoring tools like:
- [Sentry](https://sentry.io/) for error tracking
- [New Relic](https://newrelic.com/) for application performance monitoring
- [Datadog](https://www.datadoghq.com/) for comprehensive monitoring

## Backup Strategy

Ensure regular backups of user data, course content, and database information are configured in your production environment.

## Additional Resources

- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [AWS Amplify Documentation](https://docs.aws.amazon.com/amplify/) 