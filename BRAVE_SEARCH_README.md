# Brave Search API Integration

This application now uses Brave Search API for image search instead of Ideogram AI for image generation. This provides access to real-world images from the web rather than AI-generated images.

## 🚀 Features

- **Real Image Search**: Search for existing images from the web
- **Multiple Results**: Get multiple image options for each search
- **Random Selection**: Automatically selects a random image from top results for variety
- **Supabase Storage**: Downloaded images are stored in Supabase Storage
- **Local Backup**: Images are also saved locally for PowerPoint export

## 🔧 Setup

### 1. Get Brave Search API Key

1. Visit [Brave Search API](https://api.search.brave.com/app)
2. Sign up for a free account
3. Create a new API key
4. Copy your API key

### 2. Environment Configuration

Add your Brave API key to your environment variables:

**Frontend (.env):**
```env
BRAVE_API_KEY=your-brave-api-key-here
```

**Backend (.env):**
```env
BRAVE_API_KEY=your-brave-api-key-here
```

### 3. API Limits

- **Free Tier**: 10,000 requests per month
- **Paid Plans**: Available for higher usage
- **Rate Limits**: 10 requests per second

## 🔍 How It Works

### Image Search Process

1. **Query Generation**: Combines slide title with image style
2. **API Call**: Searches Brave for relevant images
3. **Result Processing**: Gets up to 5 image results
4. **Random Selection**: Picks a random image from top 3 results
5. **Download**: Downloads the selected image
6. **Storage**: Saves to both local storage and Supabase
7. **URL Return**: Returns the Supabase storage URL

### Search Parameters

```javascript
const params = {
  q: searchQuery,           // Search query (slide title + style)
  count: 5                  // Number of results to return
};
```

## 📡 API Endpoints

### Image Search
- **Method**: GET
- **URL**: `https://api.search.brave.com/res/v1/images/search`
- **Headers**: 
  - `Accept: application/json`
  - `X-Subscription-Token: your-api-key`

### Response Structure

```json
{
  "results": [
    {
      "title": "Image Title",
      "source": "Source Website",
      "image": {
        "url": "https://example.com/image.jpg",
        "width": 800,
        "height": 600
      }
    }
  ]
}
```

## 🧪 Testing

### Test the API

Run the test script to verify your setup:

```bash
cd backend
node test-brave-search-api.js
```

This will:
- Test API connectivity
- Search for sample images
- Download and verify image access
- Display results

### Expected Output

```
Testing Brave Search API for images...
API Key available: true
Searching for images with query: business presentation technology
✅ Brave Search API call successful!
Found 5 image results
✅ Image URLs found:
1. https://example.com/image1.jpg
   Title: Business Technology
   Source: example.com
   Width: 800, Height: 600
---
✅ Image download successful!
Image size: 45678 bytes
Content-Type: image/jpeg
```

## 🔄 Migration from Ideogram

### What Changed

- **API**: Ideogram AI → Brave Search
- **Function**: `generateIdeogramImage()` → `searchBraveImage()`
- **Image Type**: AI-generated → Real web images
- **Response**: Single generated image → Multiple search results

### Code Changes

**Before (Ideogram):**
```javascript
const response = await axios.post('https://api.ideogram.ai/v1/ideogram-v3/generate', {
  prompt: prompt,
  rendering_speed: "TURBO",
  aspect_ratio: "1x1",
  quality: "standard"
}, {
  headers: {
    'Api-Key': process.env.IDEOGRAM_API_KEY,
    'Content-Type': 'application/json'
  }
});
```

**After (Brave Search):**
```javascript
const response = await axios.get(`https://api.search.brave.com/res/v1/images/search?${new URLSearchParams({
  q: searchQuery,
  count: 5
})}`, {
  headers: {
    'Accept': 'application/json',
    'X-Subscription-Token': process.env.BRAVE_API_KEY
  }
});
```

## 🛠️ Troubleshooting

### Common Issues

1. **API Key Not Set**
   ```
   Error: BRAVE_API_KEY environment variable is not set
   ```
   **Solution**: Add your API key to the environment variables

2. **Invalid API Key**
   ```
   Error: Invalid or expired Brave API key
   ```
   **Solution**: Check your API key at https://api.search.brave.com/app

3. **No Results Found**
   ```
   Error: No results found in Brave Search API response
   ```
   **Solution**: Try a different search query or check API limits

4. **Image Download Failed**
   ```
   Error: Image download failed
   ```
   **Solution**: The image URL might be inaccessible, try again

### Debug Mode

Enable detailed logging by setting:
```env
NODE_ENV=development
```

## 📊 Performance

### Advantages

- **Faster**: No AI generation time
- **Real Images**: Actual photos and graphics
- **Variety**: Multiple results per search
- **Cost Effective**: Free tier available

### Considerations

- **Image Quality**: Varies by source
- **Availability**: Images may become unavailable
- **Licensing**: Check image usage rights
- **Consistency**: Less control over style

## 🔗 Resources

- [Brave Search API Documentation](https://api.search.brave.com/app)
- [API Reference](https://api.search.brave.com/res/v1/images/search)
- [Pricing](https://api.search.brave.com/app/dashboard)
- [Support](https://support.brave.com/)
