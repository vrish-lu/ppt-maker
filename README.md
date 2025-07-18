# NewGamma - AI Presentation Builder

A modern web application for generating AI-powered presentation slides using React, TypeScript, and Tailwind CSS. Built with GPT-4o-mini for intelligent content generation.

## 🚀 Features

### 🔹 Slide Structuring (AI Content Generation)
- **Topic-based Generation**: Enter any topic and generate 5-7 presentation slides
- **Smart Content**: Each slide includes a title and 3 bullet points (max 7 words each)
- **Twitter-style Language**: Content is generated with relatable, engaging language
- **Inline Editing**: Edit titles and bullet points directly in the interface
- **Regeneration**: Regenerate individual slides with fresh content
- **Real-time Updates**: See changes instantly with smooth transitions

### 🎨 Modern UI/UX
- **Responsive Design**: Works perfectly on desktop and mobile devices
- **Clean Interface**: Intuitive layout with clear visual hierarchy
- **Hover Effects**: Interactive elements with smooth animations
- **Loading States**: Visual feedback during AI generation
- **Accessibility**: Keyboard navigation and screen reader support

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **AI Integration**: OpenAI GPT-4o-mini
- **State Management**: React Hooks
- **Component Architecture**: Atomic Design (Atoms, Molecules, Organisms)

## 📦 Installation

### Quick Setup (Recommended)
```bash
# Clone and setup everything automatically
git clone <repository-url>
cd NewGamma
./setup.sh
```

### Manual Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd NewGamma
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd server
   npm install
   cd ..
   ```

4. **Set up environment variables**
   ```bash
   # Frontend environment
   cp env.example .env.local
   
   # Backend environment
   cp server/env.example server/.env.local
   ```
   
   Edit `server/.env.local` and add your OpenAI API key:
   ```env
   OPENAI_API_KEY=your-openai-api-key-here
   ```

5. **Start the backend server**
   ```bash
   cd server
   npm run dev
   ```

6. **Start the frontend (in a new terminal)**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to `http://localhost:5173`

## 🔧 Configuration

### Backend API Setup
The application now uses a secure backend API to handle OpenAI calls. This protects your API key and provides better control over usage.

### OpenAI API Setup
1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create an account or sign in
3. Generate a new API key
4. Add the key to your `server/.env.local` file

### Environment Variables

#### Frontend (.env.local)
- `VITE_API_URL`: Backend API URL (default: http://localhost:3001/api)

#### Backend (server/.env.local)
- `PORT`: Server port (default: 3001)
- `OPENAI_API_KEY`: Your OpenAI API key (required for AI features)
- `CORS_ORIGIN`: Allowed frontend origin (default: http://localhost:5173)
- `RATE_LIMIT_WINDOW_MS`: Rate limiting window (default: 900000ms = 15 minutes)
- `RATE_LIMIT_MAX_REQUESTS`: Max requests per window (default: 10)

## 📁 Project Structure

```
NewGamma/
├── src/                    # Frontend React application
│   ├── components/
│   │   ├── atoms/          # Basic UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   └── Card.tsx
│   │   ├── molecules/      # Composite components
│   │   │   ├── TopicInput.tsx
│   │   │   └── SlideCard.tsx
│   │   └── organisms/      # Complex components
│   │       └── SlideList.tsx
│   ├── services/
│   │   ├── api.ts          # Backend API integration
│   │   └── openai.ts       # Legacy direct OpenAI calls
│   ├── types/
│   │   └── index.ts        # TypeScript definitions
│   ├── App.tsx             # Main application
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles
├── server/                 # Backend Express API
│   ├── server.js           # Main server file
│   ├── package.json        # Backend dependencies
│   └── env.example         # Backend environment template
├── package.json            # Frontend dependencies
├── vite.config.ts          # Vite configuration
├── tailwind.config.js      # Tailwind CSS config
├── setup.sh                # Automated setup script
└── README.md               # Documentation
```

## 🎯 Usage

### Generating Slides
1. Enter a topic in the input field (e.g., "Explain blockchain to beginners")
2. Click "Generate Slides" or press Enter
3. Wait for AI to create 5-7 slides with engaging content
4. Review and edit the generated slides

### Editing Slides
- **Hover** over any slide to reveal edit options
- **Click "Edit"** to modify title and bullet points inline
- **Click "Regenerate"** to get fresh content for that slide
- **Save** your changes or **Cancel** to revert

### Best Practices
- Use specific, descriptive topics for better results
- Keep bullet points concise (max 7 words)
- Use the regenerate feature to get different perspectives
- Edit content to match your presentation style

## 🔄 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Component Development
The project follows Atomic Design principles:

- **Atoms**: Basic UI components (Button, Input, Card)
- **Molecules**: Composite components (TopicInput, SlideCard)
- **Organisms**: Complex components (SlideList)

### Adding New Features
1. Create components in the appropriate atomic level
2. Add TypeScript types in `src/types/index.ts`
3. Update services for new API integrations
4. Test with mock data before connecting to APIs

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow the prompts

### Deploy to Netlify
1. Build the project: `npm run build`
2. Upload the `dist` folder to Netlify

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- OpenAI for providing the GPT-4o-mini API
- Tailwind CSS for the utility-first styling
- Vite for the fast build tooling
- React team for the amazing framework

## 🆘 Support

If you encounter any issues:
1. Check the browser console for errors
2. Verify your OpenAI API key is correct
3. Ensure you have sufficient API credits
4. Create an issue in the repository

---

**Built with ❤️ using React, TypeScript, and Tailwind CSS** 