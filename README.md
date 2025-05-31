# Lingua Master 🎯

**English Vocabulary Learning Platform**

Lingua Master is a modern, responsive web application designed to help users improve their English vocabulary through interactive multiple-choice quizzes. Built with React and Node.js, it offers a seamless learning experience across all devices.

## 🌟 Features

- **Interactive Quizzes**: Multiple-choice questions with instant feedback
- **Randomized Questions**: Questions and answer options are shuffled for better learning
- **Mobile Responsive**: Optimized for mobile, tablet, and desktop devices
- **User Authentication**: Secure login and registration with Supabase Auth
- **Progress Tracking**: Monitor your learning progress and accuracy (coming soon)
- **Multiple Course Types**: 
  - General Quiz (active)
  - Previous Questions Review (coming soon)
  - Incorrect Questions Practice (coming soon)

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern UI library
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **Supabase** - Database and authentication
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing

### Database
- **Supabase PostgreSQL** - Cloud database
- **Tables**:
  - `questions` - Quiz questions with multiple-choice options
  - Authentication handled by Supabase Auth

## 📁 Project Structure

```
lingua-master/
├── backend/
│   ├── config/
│   │   └── supabase.js          # Supabase configuration
│   ├── controllers/
│   │   └── questionsController.js # Question logic and shuffling
│   ├── middleware/
│   │   └── auth.js              # Authentication middleware
│   ├── routes/
│   │   ├── index.js             # Main routes
│   │   └── questions.js         # Question endpoints
│   ├── package.json
│   └── server.js                # Express server setup
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx       # App layout with header/footer
│   │   │   ├── LoadingSpinner.jsx # Loading states
│   │   │   ├── QuestionCard.jsx # Quiz question display
│   │   │   └── CourseCard.jsx   # Course selection cards
│   │   ├── config/
│   │   │   └── supabase.js      # Frontend Supabase config
│   │   ├── context/
│   │   │   └── AuthContext.jsx  # Authentication state management
│   │   ├── pages/
│   │   │   ├── AuthPage.jsx     # Login/Register page
│   │   │   ├── HomePage.jsx     # Dashboard with courses
│   │   │   └── QuizPage.jsx     # Quiz interface
│   │   ├── services/
│   │   │   └── api.js           # API service layer
│   │   ├── App.jsx              # Main app component
│   │   ├── main.jsx             # App entry point
│   │   └── index.css            # Global styles
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account and project

### 1. Clone the Repository

```bash
git clone <repository-url>
cd lingua-master
```

### 2. Database Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Create the `questions` table with the following schema:

```sql
CREATE TABLE questions (
  id BIGSERIAL PRIMARY KEY,
  word_id INTEGER,
  paragraph TEXT,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Important**: `option_a` always contains the correct answer. The frontend shuffles the options randomly.

### 3. Backend Setup

```bash
cd backend
npm install
```

### 4. Frontend Setup

```bash
cd frontend
npm install
```

### 5. Environment Variables

#### Backend (.env)
Create a `.env` file in the `backend` directory:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
PORT=5000
FRONTEND_URL=http://localhost:3000
```

#### Frontend (.env)
Create a `.env` file in the `frontend` directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:5000/api
```

### 6. Run the Application

#### Development Mode

**Backend** (Terminal 1):
```bash
cd backend
npm run dev
```

**Frontend** (Terminal 2):
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 🌐 Deployment

### Render.com Deployment

Both frontend and backend are configured for deployment on Render.com.

#### Backend Deployment
1. Create a new Web Service on Render
2. Connect your repository
3. Set the following:
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Environment Variables**:
     - `SUPABASE_URL`
     - `SUPABASE_ANON_KEY`
     - `PORT` (automatically set by Render)
     - `FRONTEND_URL` (your frontend URL)

#### Frontend Deployment
1. Create a new Static Site on Render
2. Connect your repository
3. Set the following:
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/dist`
   - **Environment Variables**:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
     - `VITE_API_URL` (your backend API URL)

## 📖 API Documentation

### Authentication
All question endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <supabase_access_token>
```

### Endpoints

#### `GET /api/questions/random`
Get random questions for the general quiz.

**Query Parameters:**
- `limit` (optional): Number of questions (default: 10)

**Response:**
```json
{
  "success": true,
  "count": 10,
  "questions": [
    {
      "id": 1,
      "word_id": 123,
      "paragraph": "Context paragraph...",
      "question_text": "What does 'example' mean?",
      "options": ["shuffled", "answer", "options", "here"],
      "correct_answer_index": 2,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### `POST /api/questions/check`
Check if the selected answer is correct.

**Request Body:**
```json
{
  "questionId": 1,
  "selectedIndex": 2
}
```

**Response:**
```json
{
  "success": true,
  "isCorrect": true,
  "correctAnswerIndex": 2,
  "correctAnswerText": "correct answer"
}
```

## 🎨 Design Features

- **Mobile-First Design**: Responsive layout that works on all screen sizes
- **Modern UI**: Clean, intuitive interface with smooth animations
- **Accessibility**: Proper ARIA labels and keyboard navigation
- **Dark Mode Ready**: Color scheme designed for future dark mode support
- **Progressive Enhancement**: Works even with JavaScript disabled (basic functionality)

## 🔧 Development

### Available Scripts

#### Backend
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

#### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Code Structure

- **Modular Architecture**: Components are organized by feature and reusability
- **Service Layer**: API calls are centralized in the services directory
- **Context Management**: Authentication state is managed with React Context
- **Error Handling**: Comprehensive error handling throughout the application
- **Loading States**: Proper loading indicators for better UX

## 🔐 Security

- **Authentication**: Secure user authentication with Supabase
- **Authorization**: Backend middleware validates all requests
- **Input Validation**: Frontend and backend input validation
- **CORS Protection**: Configured CORS for secure cross-origin requests
- **Helmet**: Security headers for Express.js

## 🎯 Future Enhancements

- [ ] User progress tracking and statistics
- [ ] Previous questions review functionality
- [ ] Incorrect questions practice mode
- [ ] Spaced repetition algorithm
- [ ] Achievement system and badges
- [ ] Social features (leaderboards, sharing)
- [ ] Offline mode support
- [ ] Multiple language support
- [ ] Audio pronunciation features
- [ ] Custom study sets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License. See the LICENSE file for details.

## 🙏 Acknowledgments

- **Supabase** for providing excellent backend-as-a-service
- **Tailwind CSS** for the utility-first CSS framework
- **React Team** for the amazing frontend library
- **Vite** for the lightning-fast build tool

---

**Made with ❤️ for English learners worldwide**

For support or questions, please open an issue on GitHub.