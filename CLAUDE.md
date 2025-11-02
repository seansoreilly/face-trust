# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**FaceTrust** is an AI-powered web application that analyzes facial images to provide trustworthiness scores. The application uses Claude Sonnet 4.5 with facial action coding system (FACS) analysis to evaluate facial features and provide three metrics: overall trustworthiness, honesty, and reliability. Results include detailed psychological explanations based on specific facial features detected.

**Disclaimer**: This application is for entertainment and research purposes only.

## Core Architecture

### Frontend → Backend → Claude API Flow

```
React (Vite) → Vercel Serverless / Express → Anthropic Claude API
     ↓                    ↓                           ↓
  Upload image      analyze-face endpoint      Vision analysis
  Base64 encode     Validate API key           FACS-based scoring
  Send to API       Call Claude API            Return JSON response
                    Parse & return scores
```

### Key Separation

- **Frontend** (`src/`): React + TypeScript + Vite, handles UI, image processing, analytics
- **Backend** (`api/` or `server/`): Validates requests, calls Claude API, returns scores
- **No Database**: Application is stateless; shared images generated client-side only

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + TypeScript + Vite |
| **Styling** | Tailwind CSS + shadcn/ui (35+ Radix UI components) |
| **State** | TanStack Query (React Query) |
| **Routing** | React Router v6 |
| **Icons** | Lucide React |
| **Analytics** | Google Analytics (gtag) |
| **Backend** | Vercel Serverless (primary) or Express.js |
| **AI Model** | Claude Sonnet 4.5 (claude-sonnet-4-5-20250929) |
| **Build** | Vite 5.4.19 |
| **Linting** | ESLint 9.9.0 + TypeScript ESLint |

## Development Commands

```bash
# Frontend Development
npm run dev           # Start Vite dev server (http://localhost:5173)
npm run build         # Production build
npm run build:dev     # Development build
npm run preview       # Preview production build
npm run lint          # Run ESLint

# Backend (Express) Development
cd server
npm run dev           # Start with nodemon (http://localhost:3001)
npm start             # Production start

# Pull Vercel Environment Variables
vercel env pull       # Creates .env.local
```

## Important Files & Locations

| File/Directory | Purpose |
|---|---|
| `src/pages/Index.tsx` | Main upload & analysis page |
| `src/pages/Results.tsx` | Results display with scoring |
| `src/utils/shareImage.ts` | Canvas-based image generation for sharing |
| `api/analyze-face.js` | Vercel serverless function - calls Claude API |
| `server/index.js` | Express backend alternative |
| `src/lib/env.ts` | Centralized environment configuration with validation |
| `src/components/GoogleAnalytics.tsx` | Analytics integration |
| `.env.local` | Local environment variables (gitignored) |
| `vercel.json` | Vercel configuration with function timeouts |

## API Endpoints

### POST /api/analyze-face
- **Purpose**: Analyze facial image for trustworthiness
- **Request**: `{ "image": "data:image/jpeg;base64,..." }`
- **Response**: `{ "score": 0-100, "honesty": 0-100, "reliability": 0-100, "explanation": "..." }`
- **Timeout**: 30 seconds (Vercel)
- **Features**: CORS enabled, error fallback with random scores, JSON validation

### GET /api/test-env (Vercel only)
- **Purpose**: Debug environment variables and configuration
- **Response**: Lists all environment variables and deployment context
- **Timeout**: 10 seconds (Vercel)

## Environment Variables

### Frontend (.env.local)
```env
VITE_GA_MEASUREMENT_ID=G-...              # Google Analytics (optional, has default)
VITE_API_BASE_URL=                        # API endpoint override (optional)
VITE_SITE_URL=facetrust.info              # Site URL for sharing (optional)
VITE_DEV_MODE=false                       # Enable dev mode (optional)
VITE_DEBUG=false                          # Enable debug logging (optional)
```

### Backend (Vercel/Express)
```env
ANTHROPIC_API_KEY=sk-ant-api03-...        # REQUIRED - Claude API key (format: sk-ant-*)
PORT=3001                                 # Express server port (optional)
NODE_ENV=production                       # Environment (optional)
```

**Pull from Vercel**: `vercel env pull` creates `.env.local` with development variables

## Key Technical Patterns

### 1. Facial Analysis System (FACS-Based)
The system prompt evaluates:
- **Eyes & Gaze**: Pupil dilation, gaze direction, eyelid positions, eyebrows
- **Facial Muscle Dynamics**: Smile muscles (zygomatic), eye engagement (orbicularis oculi), forehead tension (frontalis), frowns (corrugator)
- **Structural Symmetry**: Nasal/lip/jaw alignment, cheekbone prominence
- **Micro-expressions**: Subtle muscle twitches, expression incongruity
- **Psychological Indicators**: Skin tone, facial hair, head tilt, tension patterns

Returns **precise measurements** (e.g., "3mm elevation", "4mm depression", "15% stronger")

**Model Settings**:
- `temperature: 0.3` - Low temperature ensures deterministic, precise responses
- `max_tokens: 800` - Sufficient for detailed analysis
- Only `temperature` is specified; `top_p` cannot be used simultaneously

### 2. Robust Error Handling
If Claude response isn't valid JSON:
```javascript
// Fallback to generic response with random variation
score: 45 + Math.random()*30,      // 45-75 range
honesty: 40 + Math.random()*30,    // 40-70 range
reliability: 50 + Math.random()*30 // 50-80 range
```
This ensures app never crashes and always returns valid results.

### 3. Client-Side Image Processing
- **No server storage** - Images processed immediately, never persisted
- **Base64 encoding** - Data URI format for API transmission
- **Format detection** - Auto-detects JPEG vs PNG from data URI
- **Circular preview** - Canvas clipping for circular display
- **Share image generation** - Complete synthesis client-side (no server calls)

### 4. Type-Safe Environment Configuration
Single source of truth in `src/lib/env.ts`:
```typescript
export const env = {
  GA_MEASUREMENT_ID: import.meta.env.VITE_GA_MEASUREMENT_ID || "G-...",
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || "",
  // ... etc
} as const;  // Type inference for IDE support
```

### 5. CORS Configuration
All API endpoints support CORS for cross-origin requests:
```javascript
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
```

## Deployment

### Vercel (Primary)
- Configuration in `vercel.json` specifies function timeouts
- Environment variables configured in Vercel dashboard
- Automatic deployment on push to main branch
- Frontend served as static files, API as serverless functions

### Express (Alternative)
- Manual deployment to any Node.js hosting (Heroku, DigitalOcean, AWS)
- Serve built frontend (dist/) from static directory
- Start Express server on configured port
- Set environment variables on deployment platform

## Common Development Tasks

### Making Changes to API Analysis
1. Modify prompt in `api/analyze-face.js` (line 96-152) or `server/index.js` (line 69-125)
2. Adjust temperature/max_tokens in API request body
3. Test locally: `npm run dev` (frontend) + `cd server && npm run dev` (backend)
4. Verify JSON response structure matches fallback in error handler

### Adding New Pages
1. Create component in `src/pages/YourPage.tsx`
2. Add route in `src/App.tsx`
3. Use `useNavigate()` from React Router for navigation
4. Add analytics events via `useAnalytics()` hook

### Debugging API Issues
1. Check `.env.local` has `ANTHROPIC_API_KEY` starting with `sk-ant-`
2. Use `GET /api/test-env` endpoint to verify environment
3. Check Vercel/Express logs for error details
4. Verify image is valid base64 with correct media type

### Updating Claude Model
1. Change `model` field in API request body (currently: `claude-sonnet-4-5-20250929`)
2. Note: Cannot use both `temperature` and `top_p` - only `temperature` is supported
3. Update in both `api/analyze-face.js` and `server/index.js`

## Debugging Tips

- **Google Analytics**: Check `VITE_GA_MEASUREMENT_ID` format (must be `G-[A-Z0-9]+`)
- **API errors**: Backend returns detailed debug object with environment context
- **Image encoding**: Verify image is properly base64 encoded with correct MIME type
- **CORS issues**: Check that backend CORS headers are set correctly
- **Claude API**: Validate `ANTHROPIC_API_KEY` format starts with `sk-ant-`

## Performance Considerations

- **Vite dev server**: Fast hot reload with HMR
- **TanStack Query**: Handles request caching and deduplication
- **Canvas rendering**: Shareable images generated in-memory, no server processing
- **API timeout**: 30 seconds allows sufficient time for Claude analysis
- **Image compression**: Consider compressing images before upload for faster transmission

## Notes for Future Development

- The application is **stateless** - no database means no user history or persistence
- **Claude Sonnet 4.5** is the current model; newer versions can be substituted by updating the model ID
- **Fallback scoring** provides graceful degradation if Claude API fails
- **Precise FACS measurements** in the prompt improve consistency of responses
- Consider implementing rate limiting if deploying publicly with tight API budgets
