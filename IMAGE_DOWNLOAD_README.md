# Image Generation and Storage

This application generates images using Ideogram AI and stores them locally on the server for use in presentations.

## Architecture

- **Server**: Handles Ideogram API calls, downloads images, and serves them via `/api/images/:filename`
- **Frontend**: Displays images served by the server
- **Storage**: Images are stored in the server's `uploads` directory

## Features

- **Server-side Image Generation**: Images are generated on the server using Ideogram API
- **Local Storage**: Images are downloaded and stored in the server's uploads directory
- **No Fallbacks**: The system throws errors instead of using fallback images
- **Caching**: Images are served with proper cache headers
- **Security**: Images are served through a secure API endpoint

## How It Works

1. **Slide Generation**: When slides are created, the server calls the Ideogram API
2. **Image Download**: The server downloads generated images to the `uploads` directory
3. **Serving**: Images are served via `/api/images/:filename` endpoint
4. **Display**: Frontend displays images using the server-provided URLs

## Environment Setup

### Server Configuration
1. Create a `.env` file in the `server` directory
2. Add your Ideogram API key:
   ```
   IDEOGRAM_API_KEY=your-ideogram-api-key-here
   ```

### Frontend Configuration
1. Create a `.env` file in the root directory
2. Add the API URL:
   ```
   VITE_API_URL=http://localhost:3001/api
   ```

## API Endpoints

### `POST /api/generate-slides`
- Generates slides with content and images
- Returns slides with image URLs pointing to `/api/images/:filename`

### `GET /api/images/:filename`
- Serves locally stored images
- Includes proper cache headers
- Returns 404 if image not found

### `POST /api/regenerate-slide`
- Regenerates content and image for a specific slide
- Returns slide with new image URL

## File Structure

```
server/
├── server.js              # Main server with image generation
├── uploads/               # Directory for stored images
└── .env                   # Server environment variables

src/
├── services/
│   └── api.ts            # Frontend API client
└── components/           # React components
```

## Benefits

- **Centralized Image Management**: All image generation happens on the server
- **Performance**: Images are cached and served efficiently
- **Reliability**: No dependency on external image URLs in frontend
- **Security**: Images are served through controlled API endpoints
- **Scalability**: Easy to add CDN or cloud storage later

## Error Handling

The system is designed to throw errors instead of using fallbacks:
- If Ideogram API fails, an error is thrown
- If image download fails, an error is thrown
- No default/placeholder images are used

This ensures that users are aware when image generation fails and can take appropriate action.

## Development

### Starting the Server
```bash
cd server
npm run dev
```

### Starting the Frontend
```bash
npm run dev
```

### Testing Image Generation
```bash
cd server
node test-ideogram.js
``` 