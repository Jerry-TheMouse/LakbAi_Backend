# LakbAi Tourism Microservice Backend

## Overview
This backend powers the **Tourism** features of the Tawi-Tawi Super App ecosystem. It handles tourist destinations, user itineraries, ratings, and analytics. 

As part of a larger Super App architecture, this service runs as an independent microservice but integrates seamlessly with the central **Tawi-Tawi API Gateway** using a secure Backend-to-Backend (B2B) handshake. This allows users of the main app to access tourism features without having to repeatedly log in.

---

## 🏗️ New Architectural Additions: The B2B Handshake

To support the Super App, this backend transitioned from a standalone silo into a connected microservice. 

### 1. Database Schema Updates (server/models/User.js)
Modified the local User schema to include a reference to the central super app account.
* **Added Field:** tawiTawiId (String, unique, sparse)
* **Purpose:** Acts as a foreign key linking the user's local tourism profile to their global Tawi-Tawi Super App identity.

### 2. Internal Security Middleware (server/routes.js)
* **Added Middleware:** internalAuth
* **Purpose:** Prevents public users or malicious actors from hitting the internal B2B endpoints directly. It enforces security by requiring an X-Internal-Gateway-Secret header that must match the GATEWAY_INTERNAL_SECRET defined in the .env file.

---

## Internal API Endpoints

These endpoints are strictly for server-to-server communication with the API Gateway. They are prefixed with /api/internal.

### 1. Verify User Link Status
**Endpoint:** POST /api/internal/verify-user  
**Description:** Checks if the incoming Super App user already has a linked account in the Tourism database.

**Request Body:**

    {
      "tawiTawiUserId": "uuid-string-from-gateway",
      "email": "user@example.com",
      "fullName": "John Doe"
    }

**Response - If Linked (200 OK):**

    {
      "success": true,
      "isLinked": true,
      "requiresRegistration": false,
      "externalUserId": "mongo-object-id",
      "message": "Handshake verified. Access granted."
    }

**Response - If NOT Linked (200 OK):**

    {
      "success": true,
      "isLinked": false,
      "requiresRegistration": true,
      "message": "User not found. Explicit registration required."
    }

### 2. Explicit User Registration
**Endpoint:** POST /api/internal/register-user  
**Description:** Creates a new Tourism profile for the user using the core data from the Gateway plus extra service-specific data collected from the UI. It auto-generates a secure random password to satisfy local schema constraints.

**Request Body:**

    {
      "tawiTawiUserId": "uuid-string-from-gateway",
      "email": "user@example.com",
      "fullName": "John Doe",
      "contactNumber": "09123456789",
      "region": "Mindanao"
    }

**Response (201 Created):**

    {
      "success": true,
      "isLinked": true,
      "externalUserId": "mongo-object-id",
      "message": "Service account created and linked successfully."
    }

---

## The Authentication Flow

1. **The Click:** A user taps the "Tourism" module inside the Tawi-Tawi Super App.
2. **The Verification:** The Gateway securely calls POST /api/internal/verify-user.
    * If the backend finds the tawiTawiId (or matches the email and links it), it returns isLinked: true. The user is instantly granted access.
    * If the backend finds nothing, it returns requiresRegistration: true.
3. **The Form:** The mobile app sees requiresRegistration: true and displays a short onboarding form asking for Tourism-specific fields (e.g., Region, Contact Number).
4. **The Registration:** The Gateway takes that form data and calls POST /api/internal/register-user. The backend creates the account, saves the tawiTawiId, and the user is granted access permanently.

---

## Environment Configuration

To enable the handshake, the following environment variable must be added to the .env file of this backend. 

    # Must exactly match the GATEWAY_INTERNAL_SECRET in the API Gateway .env file
    GATEWAY_INTERNAL_SECRET=your_secure_generated_b2b_secret_key

---

## Core Functionality Summary (Pre-existing)

Aside from the new B2B integration, this backend continues to provide its primary REST services to the frontend via JWT authentication:
* **Auth:** Standard local email/password login and signup (/api/auth/*).
* **Destinations:** CRUD operations for tourist spots, role-based approval systems (pending vs. approved), and ratings (/api/destinations/*).
* **Itineraries:** AI-powered itinerary generation (via Google Gemini) and CRUD operations for user trip plans (/api/itineraries/*, /api/generate-itinerary).
* **Analytics:** Aggregation endpoints for dashboard metrics like visitor counts, peak seasons, and top destinations (/api/analytics).