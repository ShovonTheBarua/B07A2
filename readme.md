# **DevPulse API**

#### A collaborative platform for software teams to report bugs, suggest features, and coordinate resolutions

## Live link

#### URL: https://devpulse-blue.vercel.app/

## Features

- Role based authorization (Contributor and Maintainer)
- JWT authentication
- JWT token generation when login
- Retrieve reporter information with reporter ID
- Global error handler
- Sorting and filtering data based on query parameters
- Role based issue updating access

## Tech Stack

#### Backend

- Node.js
- Express.js
- TypeScript

#### Database

- PostgreSQL

#### Authentication

- Vercel

## Project Setup

#### 1. Clone the repository

git clone url...

#### 2. Install dependencies

npm install

#### 3. Create environment variables

Create a .env file in the root directory:

PORT=5000
DATABASE_URL= database_url
JWT_SECRET= secret_key

#### 4. Run development server

npm run dev

#### 5. Build project

npm run build

#### 6. Start production server

npm start

## API Endpoints

#### Authentication

- POST /api/auth/register
- POST /api/auth/login

#### Create Issue

- POST /api/issues

#### Get All Issues

- GET /api/issues

#### Get single Issues

- GET /api/issues/:id

#### Update Issue

- PATCH /api/issues/:id
