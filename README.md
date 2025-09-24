# AthleteEdge - Player Development Tracker

A comprehensive digital platform for athletes to track skills, stats, fitness, and progress over time. Coaches can monitor development, set goals, and share insights with players and parents.

## 🚀 Features

### Phase 1 MVP (Implemented)
- ✅ **Core Athlete Profile** - Basic info, sport, position, age, team
- ✅ **Performance Tracker** - Manual stat entry with sport-specific metrics
- ✅ **Goal Setting** - Athletes and coaches can set and track goals
- ✅ **Progress Analytics** - Charts and insights showing improvement over time
- ✅ **Exportable Reports** - PDF generation for recruitment and progress summaries
- ✅ **Multi-sport Support** - Basketball, Soccer, Football, and more
- ✅ **Role-based Access** - Athletes, Coaches, and Admins

### Upcoming Features
- 🔄 Video Analysis (AI-Powered)
- 🔄 Drill Library
- 🔄 Team Dashboard
- 🔄 Wearable Integration
- 🔄 Leaderboards & Gamification
- 🔄 Recruiter Access Portal

## 🛠 Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** Authentication
- **Puppeteer** for PDF generation
- **Express Validator** for input validation
- **Helmet** for security

### Frontend
- **React 18** with functional components
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Heroicons** for icons
- **Recharts** for data visualization
- **React Hook Form** for form handling
- **React Hot Toast** for notifications

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd athlete-edge
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Update `.env` with your configuration:
   ```env
   MONGODB_URI=mongodb://localhost:27017/athlete-edge
   JWT_SECRET=your-super-secret-jwt-key-here
   PORT=5000
   NODE_ENV=development
   CLIENT_URL=http://localhost:3000
   ```

4. **Start the application**
   ```bash
   # Development mode (both frontend and backend)
   npm run dev
   
   # Or start separately:
   npm run server  # Backend only
   npm run client  # Frontend only
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 📊 Database Schema

### Users
- Authentication and basic profile information
- Role-based access (athlete, coach, admin)
- Password hashing with bcrypt

### Athletes
- Extended profile with sport-specific data
- Fitness metrics and personal records
- Team and coach associations

### Stats
- Game performance data
- Sport-specific metrics (basketball, soccer, football)
- Performance analytics and trends

### Goals
- Target setting and progress tracking
- Milestones and coach feedback
- Reminder system and notifications

## 🔐 Authentication & Authorization

- **JWT-based authentication** with 7-day expiration
- **Role-based access control** (RBAC)
- **Protected routes** for different user types
- **Password hashing** with bcrypt
- **Input validation** and sanitization

## 📈 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/password` - Change password

### Athletes
- `GET /api/athletes/profile` - Get athlete profile
- `PUT /api/athletes/profile` - Update athlete profile
- `GET /api/athletes` - List athletes (coaches/admins)
- `GET /api/athletes/stats/summary` - Performance summary

### Stats
- `POST /api/stats` - Add game statistics
- `GET /api/stats` - Get athlete statistics
- `PUT /api/stats/:id` - Update statistics
- `DELETE /api/stats/:id` - Delete statistics
- `GET /api/stats/analytics/performance` - Performance analytics

### Goals
- `POST /api/goals` - Create goal
- `GET /api/goals` - Get goals
- `PUT /api/goals/:id` - Update goal
- `PUT /api/goals/:id/progress` - Update progress
- `DELETE /api/goals/:id` - Delete goal

### Reports
- `GET /api/reports/athlete/:id` - Generate athlete report
- `GET /api/reports/team/:teamId` - Generate team report

## 🎨 UI Components

- **Responsive design** with Tailwind CSS
- **Modern component library** with consistent styling
- **Loading states** and error handling
- **Form validation** with real-time feedback
- **Interactive charts** with Recharts
- **Mobile-first** approach

## 🔧 Development

### Project Structure
```
athlete-edge/
├── server/                 # Backend API
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── middleware/        # Custom middleware
│   └── index.js          # Server entry point
├── client/               # React frontend
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── contexts/     # React contexts
│   │   └── services/     # API services
│   └── public/
└── package.json          # Root package.json
```

### Scripts
- `npm run dev` - Start both frontend and backend
- `npm run server` - Start backend only
- `npm run client` - Start frontend only
- `npm run build` - Build for production
- `npm run install-all` - Install all dependencies

## 🚀 Deployment

### Backend Deployment (Heroku/Railway/DigitalOcean)
1. Set environment variables
2. Configure MongoDB Atlas connection
3. Deploy with `npm start`

### Frontend Deployment (Vercel/Netlify)
1. Build the project: `npm run build`
2. Deploy the `build` folder
3. Configure environment variables

### Environment Variables
```env
# Production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/athlete-edge
JWT_SECRET=your-production-secret
NODE_ENV=production
CLIENT_URL=https://your-frontend-domain.com
```

## 📱 Future Enhancements

### Phase 2 (6-12 months)
- AI-powered video analysis
- Comprehensive drill library
- Advanced team dashboard
- Mobile app development

### Phase 3 (12-18 months)
- Wearable device integration
- Gamification features
- Recruiter portal
- Advanced analytics with ML

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation

---

**AthleteEdge** - Empowering athletes to reach their full potential through data-driven insights and goal-oriented training.
