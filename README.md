Chat Application Backend

Welcome to the backend of my messaging application! This is the server-side powerhouse that handles everything from user authentication to real-time messaging, built with Node.js and PostgreSQL as required for the Relatim challenge.

# What This Backend Does

This is a comprehensive real-time messaging API that powers a modern chat application. It handles user management, real-time messaging, file uploads, friend requests, and much more. Think of it as the brain behind a WhatsApp-style application, but with some extra features that make it more robust for a production environment.

# Tech Stack & Architecture Decisions

Core Framework:

Node.js + Express.js - Fast, lightweight, and perfect for real-time applications
PostgreSQL - As required! More robust than MongoDB for complex relationships between users, chats, and messages
Prisma ORM - Makes database operations type-safe and much easier to manage than raw SQL

Real-time Communication:

Socket.io - Handles all the real-time magic (instant messaging, typing indicators, online status)

Authentication & Security:

JWT (JSON Web Tokens) - Stateless authentication that scales well
Google OAuth 2.0 - Social login integration
Helmet - Security headers
CORS - Cross-origin request handling
express-rate-limit - API rate limiting to prevent abuse

File Management:

Cloudinary - Cloud-based file storage and image processing
Multer - File upload handling middleware

Database & Validation:

PostgreSQL - Relational database for complex data relationships
Prisma - Modern ORM with great TypeScript support and migrations
express-validator - Request validation and sanitization

Features Implemented
Core Requirements

User Management - Registration, login, profile management
Real-time Messaging - Instant message delivery and receipt
Chat Management - Create, update, delete conversations
Contact System - Add and manage contacts

# Advanced Features I Added

# Authentication System:

Email/password authentication with secure hashing
Google OAuth integration for social login
JWT token management with proper expiration
Session management and logout functionality
Password strength validation

# Real-time Features:

Instant message delivery via Socket.io
Typing indicators ("User is typing...")
Online/offline status tracking
Real-time notification system
Connection state management

# Messaging System:

Text messages with rich formatting support
File uploads (images, documents, videos, audio)
Message threading and conversation management
Message search functionality
Message deletion and editing capabilities

# Social Features:

Friend request system
User discovery and search
Contact management
User profiles with avatars and bio

# File Upload & Media:

Cloudinary integration for reliable file storage
Image compression and optimization
File type validation and size limits
Support for multiple file formats

# Security & Performance:

Rate limiting on all endpoints
Input validation and sanitization
SQL injection prevention via Prisma
CORS configuration for cross-origin requests
Security headers via Helmet
Request compression
Error handling and logging

# Environment Setup

Create these environment files:
.env.development (for local development):

NODE_ENV=development
PORT=5000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/chatapp_db"
JWT_SECRET=cdmcsdnkidosisdijsdci12122nsax
SESSION_SECRET=67890
CLIENT_URL=http://localhost:3000
BASE_URL=http://localhost:5000

CLOUDINARY_CLOUD_NAME=dsjgl0cbj
CLOUDINARY_API_KEY=956924216256782
CLOUDINARY_API_SECRET=4MvuvIbM9zTzcnCHJCBVzLiA870

# How to Run This Project

Prerequisites

Node.js 18+
PostgreSQL 14+ running locally or accessible remotely
npm or yarn

# Installation & Development

Clone and install dependencies:

git clone - https://github.com/Abishek0612/Chat-Application-Server.git

npm install (Instal node modules)

Set up environment variables in root directory:

.env.development

# Set up the database:

Generate Prisma client
npx prisma generate

# Run database migrations

npx prisma migrate dev

# Seed with sample data (optional)

npm run seed

# Start the development server:

npm run dev or npm start

# The server will start on http://localhost:5000 with hot reload enabled.
