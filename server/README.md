# FaceTrust API Server

Express server for facial analysis using AI models.

## Quick Setup

1. **Install dependencies**:

   ```bash
   cd server
   npm install
   ```

2. **Configure API keys**:

   ```bash
   cp config.example.js config.js
   ```

   The file already contains your API keys, ready to use!

3. **Start the server**:

   ```bash
   npm run dev
   ```

4. **Test the server**:
   Visit http://localhost:3001/health to verify it's running.

## API Endpoints

- `GET /health` - Health check
- `POST /api/analyze-face` - Face analysis endpoint
  - Body: `{ "image": "base64_image_data" }`
  - Response: `{ "score": 85, "honesty": 82, "reliability": 88, "explanation": "..." }`

## Available AI Models

The config includes API keys for:

- ✅ **Anthropic Claude** (Currently used)
- 🔄 OpenAI GPT-4 Vision
- 🔄 Perplexity AI
- 🔄 Google Gemini
- 🔄 OpenRouter
- 🔄 Groq

## Development

```bash
# Development with auto-reload
npm run dev

# Production
npm start
```

## Environment Variables

If you prefer using .env files instead of config.js:

```bash
# Create .env file
ANTHROPIC_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
PORT=3001
```

Then update `index.js` to use `dotenv` instead of importing config.js.
