# NewGamma Backend API

Backend API server for the NewGamma AI Presentation Builder, built with Express.js and Supabase.

## 🚀 Features

- **User Authentication**: JWT-based authentication with bcrypt password hashing
- **Presentation Management**: CRUD operations for user presentations
- **Supabase Integration**: PostgreSQL database with Row Level Security
- **Security**: Helmet, CORS, rate limiting, and input validation
- **File Upload**: Support for image and asset uploads
- **AI Integration**: OpenAI and Ideogram API integration

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT + bcrypt
- **Security**: Helmet, CORS, rate limiting
- **File Handling**: Multer

## 📦 Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   PORT=3002
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   JWT_SECRET=your-super-secret-jwt-key
   SUPABASE_URL=your-supabase-project-url
   SUPABASE_ANON_KEY=your-supabase-anon-key
   OPENAI_API_KEY=your-openai-api-key
   BRAVE_API_KEY=your-brave-api-key
   ```

3. **Set up Supabase database**
   - Create a new Supabase project
   - Run the SQL schema from `supabase-schema.sql` in your Supabase SQL editor
   - Copy your project URL and anon key to `.env`

## 🗄️ Database Schema

### Tables

- **users**: User accounts and authentication
- **presentations**: User presentations with slides and metadata
- **slides**: Individual slides with content and layout
- **assets**: Images and other files

### Row Level Security (RLS)

All tables have RLS enabled with policies ensuring users can only access their own data.

## 🚀 Development

### Start development server
```bash
npm run dev
```

### Start production server
```bash
npm start
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (protected)
- `PUT /api/auth/profile` - Update user profile (protected)

### Presentations
- `POST /api/presentations` - Create presentation (protected)
- `GET /api/presentations` - Get user presentations (protected)
- `GET /api/presentations/:id` - Get specific presentation (protected)
- `PUT /api/presentations/:id` - Update presentation (protected)
- `DELETE /api/presentations/:id` - Delete presentation (protected)

### Health Check
- `GET /health` - Server health status

### Legacy Endpoints (for backward compatibility)
- `POST /api/generate` - Generate slides (placeholder)
- `POST /api/generate-image` - Generate images (placeholder)

## 🔐 Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── supabase.js          # Supabase configuration
│   ├── controllers/
│   │   ├── authController.js     # Authentication logic
│   │   └── presentationController.js # Presentation CRUD
│   ├── middleware/
│   │   └── auth.js              # JWT authentication middleware
│   ├── models/
│   │   ├── User.js              # User model
│   │   └── Presentation.js      # Presentation model
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   └── presentations.js     # Presentation routes
│   └── server.js                # Main server file
├── uploads/                      # File uploads directory
├── supabase-schema.sql          # Database schema
├── env.example                  # Environment variables template
├── package.json                 # Dependencies and scripts
└── README.md                    # This file
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 3002) |
| `NODE_ENV` | Environment | No (default: development) |
| `FRONTEND_URL` | Frontend URL for CORS | No (default: http://localhost:5173) |
| `JWT_SECRET` | JWT signing secret | Yes |
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `OPENAI_API_KEY` | OpenAI API key | No |
| `IDEOGRAM_API_KEY` | Ideogram API key | No |

## 🚀 Deployment

### Railway
1. Connect your GitHub repository
2. Set environment variables
3. Deploy automatically

### Render
1. Create a new Web Service
2. Connect your repository
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add environment variables

### Vercel
1. Import your repository
2. Set build command: `npm install`
3. Set start command: `npm start`
4. Add environment variables

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **CORS Protection**: Configured for frontend origin
- **Rate Limiting**: Prevents abuse
- **Helmet**: Security headers
- **Input Validation**: Request validation
- **Row Level Security**: Database-level security

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run with coverage
npm run test:coverage
```

## 📝 API Documentation

### Request/Response Examples

#### Register User
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe"
}
```

#### Login User
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

#### Create Presentation
```bash
POST /api/presentations
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "title": "My Presentation",
  "theme": "modern-blue",
  "slides": [...],
  "metadata": {...}
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License. 