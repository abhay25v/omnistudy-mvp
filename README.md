# 🎓 OmniStudy - AI-Powered Learning Assistant

**Hackathon Project** | Built with AWS Services | Next.js + Lambda

Transform complex concepts into simple, audio-based explanations in Hindi, English, or Hinglish!

---

## ✨ Features

- 📝 **Text Input**: Paste any concept
- 🖼️ **Image Upload**: Extract text from diagrams/notes (AWS Textract)
- 🎤 **Audio Upload**: Transcribe lectures (AWS Transcribe)
- 🤖 **AI Simplification**: Claude 3 via Amazon Bedrock
- 🔊 **Text-to-Speech**: Natural-sounding audio (Amazon Polly)
- ⚡ **Smart Caching**: S3-based caching saves costs
- 🌍 **Multi-language**: Hindi (rural), English (simple), Hinglish

---

## 🏗️ Architecture

```
┌──────────────┐
│   Next.js    │  User uploads image/audio/text
│   Frontend   │  Selects class level + language
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ API Gateway  │  HTTPS endpoint with CORS
│  (HTTP API)  │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────────────┐
│              Lambda (Node.js 18)                 │
│  ┌──────────────────────────────────────────┐   │
│  │ 1. Extract text (Textract/Transcribe)    │   │
│  │ 2. Simplify with Bedrock (Claude 3)      │   │
│  │ 3. Check S3 cache (SHA-256 hash)         │   │
│  │ 4. Generate audio (Polly)                │   │
│  │ 5. Upload MP3 to S3                      │   │
│  │ 6. Return public URL                     │   │
│  └──────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
       │
       ▼
┌──────────────┐
│  S3 Bucket   │  Public audio files + cache
└──────────────┘
```

---

## 📂 Project Structure

```
omnistudy-mvp/
├── AWS-SETUP-GUIDE.md          # Complete AWS setup instructions
├── lambda/                      # Backend (Node.js 18)
│   ├── handler.js              # Main Lambda function
│   ├── package.json            # AWS SDK v3 dependencies
│   ├── test-local.js           # Local testing script
│   └── README.md               # Lambda documentation
├── frontend/                    # Frontend (Next.js 14)
│   ├── app/
│   │   ├── page.tsx            # Main UI component
│   │   ├── layout.tsx          # Root layout
│   │   └── globals.css         # Tailwind styles
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── .env.example            # Environment template
├── deploy-lambda.sh            # Deployment script (Unix)
├── deploy-lambda.ps1           # Deployment script (Windows)
└── README.md                   # This file
```

---

## 🚀 Quick Start

### Prerequisites

1. **AWS Account** (free tier eligible)
2. **Node.js 18+** installed
3. **AWS CLI** configured with credentials
4. **Git** (optional)

### Step 1: AWS Setup (15-20 minutes)

**📘 NEW: Use the simplified 2026 guide:** [SETUP-STEPS-SIMPLIFIED.md](SETUP-STEPS-SIMPLIFIED.md)

**Or follow the detailed guide:** [AWS-SETUP-GUIDE.md](AWS-SETUP-GUIDE.md)

1. Create S3 bucket
2. ~~Enable Bedrock model access~~ (auto-enabled in 2026!)
3. Create IAM role for Lambda
4. Create Lambda function
5. Create API Gateway
6. Configure environment variables

**Important:** Complete ALL steps in the guide before proceeding!

### Step 2: Deploy Lambda Backend

**Windows (PowerShell):**
```powershell
cd lambda
npm install
cd ..
.\deploy-lambda.ps1
```

**Mac/Linux:**
```bash
cd lambda
npm install
cd ..
chmod +x deploy-lambda.sh
./deploy-lambda.sh
```

**Manual ZIP upload (if scripts fail):**
```bash
cd lambda
npm install --production
zip -r function.zip .
# Upload function.zip via AWS Console → Lambda → Code → Upload from .zip file
```

### Step 3: Configure Frontend

```bash
cd frontend
npm install

# Create environment file
cp .env.example .env.local

# Edit .env.local and add your API Gateway URL
# NEXT_PUBLIC_API_URL=https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/process
```

### Step 4: Run Frontend

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🧪 Testing

### Test Lambda Locally

```bash
cd lambda
node test-local.js
```

Expected output:
```
✅ Success!
Status Code: 200
Response: { audioUrl: "https://...", cached: false }
```

### Test Lambda via AWS Console

1. Go to Lambda → Test tab
2. Create test event:

```json
{
  "body": "{\"type\":\"text\",\"text\":\"The Sun is a star at the center of our solar system\",\"classLevel\":\"5\",\"language\":\"hindi_rural\"}"
}
```

3. Click Test
4. Check response has `audioUrl`
5. Open URL in browser to verify audio plays

### Test API Gateway

```bash
curl -X POST https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/process \
  -H "Content-Type: application/json" \
  -d '{
    "type": "text",
    "text": "Gravity pulls objects toward Earth",
    "classLevel": "5",
    "language": "english_simple"
  }'
```

---

## 🎯 Environment Variables

### Lambda (AWS Console → Configuration → Environment variables)

| Variable | Example | Required |
|----------|---------|----------|
| `S3_BUCKET` | `omnistudy-audio-prod-2026` | ✅ |
| `BEDROCK_MODEL_ID` | `anthropic.claude-3-haiku-20240307-v1:0` | ✅ |
| `POLLY_VOICE_ID` | `Aditi` (Hindi) or `Joanna` (English) | No |
| `TRANSCRIBE_LANGUAGE` | `hi-IN` | No |

### Frontend (`.env.local`)

```env
NEXT_PUBLIC_API_URL=https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/process
```

---

## 💡 Usage Examples

### Example 1: Text Input

```json
{
  "type": "text",
  "text": "E=mc² means energy equals mass times the speed of light squared",
  "classLevel": "10",
  "language": "english_simple"
}
```

### Example 2: Image Upload

```json
{
  "type": "image",
  "fileUrl": "https://example.com/science-diagram.jpg",
  "classLevel": "8",
  "language": "hindi_rural"
}
```

### Example 3: Audio Lecture

```json
{
  "type": "audio",
  "fileUrl": "https://example.com/lecture.mp3",
  "classLevel": "5",
  "language": "hinglish"
}
```

---

## 📊 Cost Estimation (AWS Free Tier)

**Per Request (without cache):**
- Textract: $0.0015 per page
- Transcribe: $0.024 per minute
- Bedrock (Claude Haiku): $0.00025 per 1K tokens
- Polly: $0.004 per 1000 characters
- S3: $0.000023 per MB/month
- Lambda: $0.0000008 per invocation

**Total:** ~$0.02-0.03 per request

**With 50% cache hit rate:** ~$0.01 per request

**Free Tier Limits:**
- Lambda: 1M requests/month FREE
- S3: 5GB storage FREE
- Bedrock: Varies by model
- Polly: 5M characters/month FREE (first 12 months)

---

## 🔧 Customization

### Change Polly Voice

Hindi voices:
- `Aditi` (Female, Hindi)
- `Kajal` (Female, Hindi - Neural)

English voices:
- `Joanna` (Female, US)
- `Matthew` (Male, US)
- `Amy` (Female, British)

[Full voice list](https://docs.aws.amazon.com/polly/latest/dg/voicelist.html)

### Add New Prompt Template

Edit `lambda/handler.js`:

```javascript
const PROMPT_TEMPLATES = {
  // ... existing templates
  
  my_custom: `You are a teacher for Class {{level}} students.
  
  Explain this concept: {{text}}
  
  Use simple examples.`
};
```

### Change Bedrock Model

In Lambda environment variables:
- `anthropic.claude-3-haiku-20240307-v1:0` (Fastest, cheapest)
- `anthropic.claude-3-sonnet-20240229-v1:0` (Balanced)
- `anthropic.claude-3-opus-20240229-v1:0` (Most capable, expensive)

---

## 🐛 Troubleshooting

### Error: "AccessDeniedException: User is not authorized"

- Check IAM role has all required policies
- Verify Bedrock model access is granted (AWS Console → Bedrock → Model access)

### Error: "NoSuchBucket"

- Check S3 bucket name matches `S3_BUCKET` environment variable
- Verify bucket exists in same region as Lambda

### Error: "Task timed out after 3 seconds"

- Increase Lambda timeout to 300 seconds (5 minutes)
- Transcribe jobs can take 30-60 seconds

### Frontend can't reach API

- Check CORS is enabled in API Gateway
- Verify `NEXT_PUBLIC_API_URL` is correct (must include `/process` path)

### Audio not playing

- Check browser console for CORS errors
- Verify S3 bucket policy allows public read
- Try opening audio URL directly in browser

---

## 📚 Resources

- [AWS Setup Guide](AWS-SETUP-GUIDE.md) - Complete beginner tutorial
- [Lambda README](lambda/README.md) - Backend documentation
- [AWS SDK v3 Docs](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [Bedrock User Guide](https://docs.aws.amazon.com/bedrock/latest/userguide/)
- [Next.js Documentation](https://nextjs.org/docs)

---

## 🔒 Security Best Practices

✅ **Implemented:**
- IAM roles (no hardcoded credentials)
- CORS configured
- Input validation in Lambda
- Environment variables for secrets

⚠️ **For Production:**
- Add rate limiting (API Gateway)
- Use CloudFront + presigned URLs instead of public S3
- Implement authentication (Cognito)
- Enable CloudTrail logging
- Add WAF rules
- Sanitize user inputs more rigorously

---

## 📝 License

MIT License - Feel free to use for hackathons and learning!

---

## 🙏 Acknowledgments

- **AWS** for amazing cloud services
- **Anthropic** for Claude models on Bedrock
- **Next.js** team for the framework
- **Hackathon organizers** for the opportunity

---

## 📧 Support

If you encounter issues:

1. Check [AWS-SETUP-GUIDE.md](AWS-SETUP-GUIDE.md) troubleshooting section
2. Review CloudWatch Logs in AWS Console
3. Verify all environment variables are set correctly
4. Ensure IAM permissions are complete

---

**Built with ❤️ for accessible education**

🎓 Making learning accessible to everyone, everywhere!
