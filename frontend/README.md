# OmniStudy Frontend

Next.js 14 (App Router) frontend with Tailwind CSS.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Edit .env.local with your API Gateway URL
# NEXT_PUBLIC_API_URL=https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/process

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration

### API Gateway URL

After deploying Lambda and setting up API Gateway, copy your endpoint URL:

```
https://abcd1234.execute-api.us-east-1.amazonaws.com/process
```

Add it to `.env.local`:

```env
NEXT_PUBLIC_API_URL=https://abcd1234.execute-api.us-east-1.amazonaws.com/process
```

### File Upload

Currently uses Cloudinary for temporary file hosting (demo). For production:

1. **Option A: Presigned S3 URLs**
   - Create API endpoint to generate presigned upload URLs
   - Upload directly from browser to S3
   - Pass S3 URL to Lambda

2. **Option B: Base64 Encoding**
   - Encode file as base64 in browser
   - Send in request body to Lambda
   - Decode in Lambda (increases payload size)

## 🎨 Customization

### Change Colors

Edit `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: '#3B82F6',  // Change to your brand color
      secondary: '#10B981',
    },
  },
}
```

### Add Languages

Edit `app/page.tsx` to add more language options:

```typescript
const languages = [
  { value: 'hindi_rural', label: 'Hindi (Rural)' },
  { value: 'english_simple', label: 'English (Simple)' },
  { value: 'hinglish', label: 'Hinglish' },
  { value: 'tamil', label: 'Tamil' },  // Add new language
];
```

Then add corresponding prompt template in Lambda `handler.js`.

## 📦 Build for Production

```bash
# Build static site
npm run build

# Test production build
npm run start

# Export static HTML (optional)
next export
```

Deploy to:
- **Vercel** (recommended): `vercel deploy`
- **AWS Amplify**: Connect GitHub repo
- **Netlify**: `netlify deploy`
- **S3 + CloudFront**: Manual upload after `npm run build`

## 🧪 Testing

**Test API connection:**

```javascript
// In browser console
fetch('https://YOUR-API.execute-api.us-east-1.amazonaws.com/process', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'text',
    text: 'Test concept',
    classLevel: '5',
    language: 'english_simple'
  })
}).then(r => r.json()).then(console.log);
```

## 📱 Mobile Responsive

App is fully responsive with Tailwind breakpoints:
- Mobile: 320px+
- Tablet: 768px+
- Desktop: 1024px+

Test with browser DevTools responsive mode.

## ♿ Accessibility

- Semantic HTML
- Keyboard navigation
- ARIA labels (to be added)
- Audio controls for screen readers

## 🐛 Common Issues

### CORS Error

```
Access to fetch at '...' from origin 'http://localhost:3000' has been blocked by CORS
```

**Solution:** Enable CORS in API Gateway (see AWS-SETUP-GUIDE.md Step 5.5)

### API URL Not Found

```
API URL not configured
```

**Solution:** Create `.env.local` and add `NEXT_PUBLIC_API_URL`

### File Upload Fails

**Solution:** Update Cloudinary credentials or implement S3 presigned URLs

---

Built with Next.js 14, TypeScript, and Tailwind CSS
