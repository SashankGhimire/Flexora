# Flexora Backend - Authentication API

A simple and clean MERN stack authentication backend for the Flexora Final Year Project.

## Features

✓ User Registration with email validation and password hashing
✓ User Login with JWT token generation
✓ Password security using bcryptjs
✓ MongoDB database with Mongoose ODM
✓ JWT-based authentication
✓ CORS enabled for frontend communication
✓ Error handling and validation
✓ Environment variable configuration

## Tech Stack

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **JWT** - Token-based authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-Origin Resource Sharing

## Project Structure

```
Backend/
├── config/
│   └── db.js                 # MongoDB connection configuration
├── models/
│   └── User.js              # User schema and model
├── controllers/
│   └── authController.js    # Authentication logic (register, login, getMe)
├── routes/
│   └── authRoutes.js        # API route definitions
├── middleware/
│   └── authMiddleware.js    # JWT verification middleware
├── server.js                # Main server file
├── .env.example             # Environment variables template
├── .gitignore               # Git ignore file
├── package.json             # Project dependencies
└── README.md                # This file
```

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Setup Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   - Copy `.env.example` to `.env`
   - Update the following variables:
     ```
     MONGO_URI=your_mongodb_connection_string
     PORT=5000
     JWT_SECRET=your_secret_key
     JWT_EXPIRE=7d
     ```

3. **MongoDB Setup**
   - **Local MongoDB**: Make sure MongoDB is running locally on `mongodb://localhost:27017`
   - **MongoDB Atlas**: Use your connection string from MongoDB Atlas

4. **Start the Server**
   ```bash
   # Development (with auto-reload using nodemon)
   npm run dev

   # Production
   npm start
   ```

   Server will run on `http://localhost:5000`

## API Endpoints

### Public Endpoints

#### 1. User Registration
```
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}

Response (201 Created):
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### 2. User Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

Response (200 OK):
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### Protected Endpoints (Requires JWT Token)

#### 3. Get Current User
```
GET /api/auth/me
Authorization: Bearer <your_jwt_token>

Response (200 OK):
{
  "message": "User data retrieved successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

## Request/Response Examples

### Using cURL

```bash
# Register a new user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'

# Get current user (replace TOKEN with actual JWT token)
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer TOKEN"
```

### Using Postman

1. **Register**: POST http://localhost:5000/api/auth/register
2. **Login**: POST http://localhost:5000/api/auth/login
3. **Get Me**: GET http://localhost:5000/api/auth/me
   - Add header: `Authorization: Bearer <token>`

## Code Organization

### config/db.js
- Handles MongoDB connection using Mongoose
- Loads connection URI from environment variables
- Logs connection status

### models/User.js
- Defines User schema with fields: name, email, password
- Email is unique and validated
- Password is hashed before saving using bcryptjs
- Includes `matchPassword()` method for password comparison
- Uses timestamps for createdAt and updatedAt

### controllers/authController.js
- **register()**: Creates new user, validates input, prevents duplicates
- **login()**: Authenticates user, generates JWT token
- **getMe()**: Returns current user information (protected route)

### middleware/authMiddleware.js
- **protect()**: Verifies JWT token from Authorization header
- Extracts token from "Bearer <token>" format
- Handles token expiration and invalid token errors

### routes/authRoutes.js
- Defines all authentication endpoints
- Applies protection middleware to protected routes

## Error Handling

The API returns appropriate HTTP status codes:

- **201 Created**: Successful registration
- **200 OK**: Successful login or data retrieval
- **400 Bad Request**: Validation errors or missing fields
- **401 Unauthorized**: Failed authentication or expired token
- **404 Not Found**: Route not found
- **500 Internal Server Error**: Server-side errors

## Security Features

✓ Password hashing with bcryptjs (salt rounds: 10)
✓ JWT token-based authentication
✓ Email uniqueness validation
✓ Environment variable protection
✓ CORS enabled for specific origins
✓ Password field excluded from default queries
✓ Token expiration (default: 7 days)

## Environment Variables

Create a `.env` file in the Backend directory:

```
# MongoDB Connection (local or Atlas)
MONGO_URI=mongodb://localhost:27017/flexora

# Server Configuration
PORT=5000

# JWT Configuration
JWT_SECRET=your_secret_key_here_change_in_production
JWT_EXPIRE=7d
```

### Important Security Notes:
- Change `JWT_SECRET` to a strong random string for production
- Never commit `.env` file to version control
- Use `.env.example` as a template for team members

## Development Notes

- This backend is designed for academic submission and is kept intentionally simple
- Code is well-commented for educational purposes
- No advanced features like role-based access control or email verification are included
- Perfect for learning MERN stack fundamentals

## Common Issues and Solutions

### MongoDB Connection Error
- Ensure MongoDB is running
- Check MONGO_URI in .env file
- For MongoDB Atlas, whitelist your IP address

### Port Already in Use
- Change PORT in .env file
- Or kill the process using the port

### Token Verification Fails
- Ensure JWT_SECRET matches in .env
- Check token is sent in correct format: `Authorization: Bearer <token>`
- Verify token hasn't expired

## Next Steps for Frontend

The frontend can consume these APIs by:

1. Sending registration/login requests to `/api/auth/register` and `/api/auth/login`
2. Storing the returned JWT token (typically in localStorage)
3. Sending token in `Authorization` header for protected requests

Example frontend usage:
```javascript
// Register
const response = await fetch('http://localhost:5000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name, email, password })
});
const data = await response.json();
localStorage.setItem('token', data.token);

// Login
const response = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
const data = await response.json();
localStorage.setItem('token', data.token);

// Get User (with token)
const response = await fetch('http://localhost:5000/api/auth/me', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
});
```

## License

ISC

---

**Note**: This is a beginner-friendly authentication backend suitable for Final Year Projects. For production use, consider adding additional features like:
- Email verification
- Password reset functionality
- Rate limiting
- Advanced error handling
- Input sanitization
- Logging system
