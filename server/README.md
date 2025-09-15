# eWarrants: Backend Architecture

![eWarrants Banner](https://res.cloudinary.com/djni7gwm4/image/upload/v1756023613/EWarrants_white_jntxui.png)

**Version**: 1.0.1
**Status**: Active Development
**Primary Contact**: [cnitheesh7@gmail.com](mailto:cnitheesh7@gmail.com)
* **Backend Repository**: `choppanitheesh/eWarrants/tree/main/server`

---

## 1. Introduction

This document provides a comprehensive overview of the **eWarrants Backend Services**, the server-side component of the eWarrants ecosystem. This backend is a secure, scalable, and robust Node.js application built with the Express framework, designed to serve as the central API and business logic layer for the eWarrants mobile application.

The architecture is designed to support a seamless, offline-first mobile experience by providing reliable data synchronization, secure user authentication, and advanced AI-powered features. It handles all core operations, from data persistence to third-party service integrations.

---

## 2. Technology Stack

The backend is built on a modern, reliable, and scalable technology stack, chosen for performance and developer efficiency.

| Category             | Technology / Library                                       | Purpose                                                                |
| -------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------- |
| **Core Framework** | `Node.js`, `Express.js`                                    | Building the RESTful API and handling HTTP requests.                   |
| **Database** | `MongoDB` with `Mongoose`                                  | NoSQL database for flexible and scalable data persistence.             |
| **Authentication** | `JSON Web Tokens (JWT)`, `bcryptjs`                        | Secure, stateless user authentication and password hashing.            |
| **File & Asset Mgmt**| `Cloudinary`, `Multer`                                     | Cloud-based media storage and handling of multipart/form-data uploads. |
| **AI & Machine Learning** | `@google/generative-ai` (Gemini)                     | Powering receipt data extraction and the intelligent chat assistant.   |
| **Email & Notifications** | `Nodemailer`, `node-cron`                                | Sending transactional emails and scheduling daily notification jobs.   |
| **API Security** | `express-rate-limit`, `express-validator`                  | Brute-force protection on authentication routes and input validation.  |

---

## 3. Architectural Overview

The backend follows a layered, service-oriented architecture, closely resembling the **Model-View-Controller (MVC)** pattern. This separation of concerns ensures that the codebase is organized, maintainable, and easy to scale.

### 3.1. Directory Structure

* **`/controllers`**: This is the core of our business logic. Each controller is responsible for handling the logic for a specific domain (e.g., `authController.js` manages user registration and login, while `warrantyController.js` handles all warranty-related operations, including the AI integrations).
* **`/models`**: Defines the `Mongoose` schemas for our MongoDB collections. The `User.js` and `Warranty.js` models enforce data structure, types, and validation rules at the database level.
* **`/routes`**: Defines all API endpoints. These files map HTTP methods and URI paths to the corresponding controller functions. For security, authentication routes are protected with `express-rate-limit`.
* **`/middleware`**: Contains middleware functions that process requests before they reach the controllers. The `authMiddleware.js` is critical for security, as it validates the JWT on protected routes and attaches the user's data to the request object.
* **`/utils`**: A collection of helper modules for shared functionality, such as custom error classes (`errorResponse.js`) and email templating (`emailTemplate.js`).
* `index.js`: The main entry point for the server. It initializes the Express application, connects to the MongoDB database, applies global middleware, mounts the API routes, and schedules the `node-cron` job.

---

## 4. Core Features & Implementation Details

### 4.1. Authentication & Security Flow

Security is paramount. Our authentication system is built on industry standards to ensure user data is protected.

1.  **Registration**: A new user's password is never stored in plaintext. It is hashed using `bcryptjs` with a salt, a one-way encryption algorithm. A unique verification code is generated and sent to the user's email via `Nodemailer`.
2.  **Authorization**: Upon successful login, a **JSON Web Token (JWT)** is generated and signed with a secret key. This token is sent to the client application.
3.  **Protected Routes**: For any request to a protected endpoint, the client must include the JWT in the `Authorization` header. The `authMiddleware` intercepts this request, verifies the token's signature and expiration, and, if valid, decodes the user's ID from the token payload, making it available for the controller to use.

### 4.2. AI-Powered Services (`warrantyController.js`)

The backend leverages Google's Gemini AI to provide intelligent, value-added features.

* **AI Receipt Scanner**: The `/process-receipt` endpoint accepts an image upload. The image is streamed to **Cloudinary** for storage, and its buffer is simultaneously sent to the Gemini 1.5 Flash model. We use a carefully engineered prompt that instructs the AI to analyze the image and return a structured JSON object containing the `productName`, `purchaseDate`, and `warrantyMonths`. This is a powerful example of **multimodal input processing**.
* **AI Chat with Function Calling**: The `/chat` endpoint implements an advanced AI pattern known as **Function Calling**.
    1.  We define a `getWarranties` function as a "tool" that the Gemini model can use. The tool's schema (name, description, parameters) is sent to the AI along with the user's query.
    2.  If the user asks a question that requires warranty data (e.g., "What expires this month?"), the model doesn't invent an answer. Instead, it returns a `functionCall` payload, requesting that our backend execute the `getWarranties` tool with specific arguments (e.g., `{ "expiringWithinDays": 30 }`).
    3.  Our backend code detects this, runs a secure, user-specific MongoDB query based on the AI-provided arguments, and sends the results *back* to the model in a second API call.
    4.  The model then uses this real data to formulate a final, accurate, and context-aware natural language response. This is a highly secure pattern as it prevents the LLM from having any direct access to the database.

### 4.3. Data Synchronization Support

The backend is designed to support the mobile app's offline-first architecture. The `/api/warranties` GET endpoint accepts an optional `lastPulledAt` query parameter. If this parameter is present, the controller adds a filter to the MongoDB query (`updatedAt: { $gt: new Date(lastPulledAt) }`), ensuring that only records modified since the client's last sync are returned. This **delta-sync** approach significantly reduces data transfer and improves the efficiency of the synchronization process.

### 4.4. Scheduled Email Notifications

The application uses `node-cron` to schedule a daily job that runs every morning at 8:00 AM. This job queries the database for all users who have enabled email notifications and finds any warranties that are set to expire based on their individual notification preferences. If expiring warranties are found, it sends a summary email to the user via Nodemailer.

---

## 5. Setup and Installation

### 5.1. Prerequisites

* Node.js (LTS version recommended)
* npm or Yarn
* A MongoDB database instance (local or cloud-based like MongoDB Atlas)
* API keys for Cloudinary, Google Gemini, and a Gmail account for Nodemailer.

### 5.2. Installation

1.  Navigate to the `server/` directory.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the root of the `server` directory. Use the following template and populate it with your credentials:
    ```
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_jwt_secret
    EMAIL_USER=your_gmail_address
    EMAIL_PASS=your_gmail_app_password
    CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
    CLOUDINARY_API_KEY=your_cloudinary_api_key
    CLOUDINARY_API_SECRET=your_cloudinary_api_secret
    GEMINI_API_KEY=your_google_gemini_api_key
    ```
4.  Start the server:
    ```bash
    npm start
    ```

The server will be running on the port specified in your environment variables or on the default port `3000`.
