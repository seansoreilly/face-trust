# FaceTrust

**FaceTrust** is an AI-powered web application that analyzes facial images to provide trustworthiness scores. Using advanced machine learning algorithms, it evaluates perceived trustworthiness, honesty, and reliability based on facial features and expressions.

## 🌟 Features

- **AI-Powered Analysis**: Upload a photo and get instant trustworthiness scores
- **Multi-Metric Evaluation**: Provides scores for overall trust, honesty, and reliability
- **Interactive UI**: Modern, responsive interface with animated score reveals
- **Secure Processing**: Client-side image processing with secure API communication
- **Google Analytics Integration**: Track usage and performance metrics
- **Real-time Results**: Fast analysis with detailed explanations

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **Analytics**: Google Analytics integration
- **Development**: ESLint, TypeScript ESLint
- **Deployment**: Vercel-ready configuration

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <YOUR_GIT_URL>
   cd face-trust
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory and add your API keys:
   ```bash
   # Add your AI service API keys here
   VITE_GOOGLE_ANALYTICS_ID=your_ga_measurement_id
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   Visit `http://localhost:5173` to see the application

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint for code quality

## 📱 How to Use

1. **Upload Image**: Click or drag to upload a clear photo of a face
2. **Analyze**: Click the "Analyze" button to process the image
3. **View Results**: Get detailed trustworthiness scores and explanations
4. **Try Again**: Upload different photos to compare results

## 🎯 Score Categories

- **85-100**: Highly Trustworthy 🌟
- **70-85**: Very Trustworthy 😊
- **55-70**: Trustworthy 🙂
- **40-55**: Neutral 😐
- **0-40**: Guarded 🤔

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Main application pages
│   ├── Index.tsx       # Upload and analysis page
│   ├── Results.tsx     # Results display page
│   └── NotFound.tsx    # 404 error page
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and configs
└── App.tsx             # Main application component
```

## 🔧 Configuration

The application uses Vite for build configuration and includes:

- TypeScript configuration for type safety
- Tailwind CSS for styling
- ESLint for code quality
- Vercel deployment configuration

## 🚢 Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy the `dist` folder to your hosting service

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Disclaimer

This application is for entertainment and research purposes only. The trustworthiness scores are based on AI algorithms analyzing facial features and should not be used for making important decisions about individuals. Results may vary and should not be considered as definitive assessments of character or trustworthiness.

## 🔗 Links

- **Live Demo**: [FaceTrust App](https://your-deployment-url.vercel.app)
- **Repository**: [GitHub](https://github.com/your-username/face-trust)

---

*Built with ❤️ using React, TypeScript, and modern web technologies*
