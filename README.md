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
│              Lambda (Node.js 20)                 │
│  ┌──────────────────────────────────────────┐   │
│  │ 1. Extract text (Textract/Transcribe)    │   │
│  │ 2. Simplify with Bedrock (Multi-model)   │   │
│  │    - Amazon Titan (Free tier friendly)   │   │
│  │    - Claude 3/4 (High quality)           │   │
│  │    - DeepSeek V3 (Cost effective)        │   │
│  │ 3. Check S3 cache (SHA-256 hash)         │   │
│  │ 4. Generate audio (Polly standard)       │   │
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
2. **Valid Payment Method** on AWS account (required for Bedrock, even with free tier credits)
3. **Node.js 18+** installed
4. **AWS CLI** configured with credentials (optional - can use Console)
5. **Git** (optional)

### Step 1: AWS Setup (15-20 minutes)

**📘 NEW: Use the simplified 2026 guide:** [SETUP-STEPS-SIMPLIFIED.md](SETUP-STEPS-SIMPLIFIED.md)

**⚡ Having issues? Check tested working config:** [TESTED-CONFIG.md](TESTED-CONFIG.md)

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
| `BEDROCK_MODEL_ID` | `amazon.titan-text-express-v1` | ✅ |
| `POLLY_VOICE_ID` | `Aditi` (Hindi) or `Joanna` (English) | No |
| `TRANSCRIBE_LANGUAGE` | `hi-IN` | No |

### ✅ Tested Working Configurations (March 2026)

**For AWS Free Tier / No Payment Method:**
```
BEDROCK_MODEL_ID=amazon.titan-text-express-v1
```
✅ Works immediately  
✅ No payment validation required  
✅ Good quality for student explanations

**For Paid Accounts (with valid payment method):**
```
BEDROCK_MODEL_ID=anthropic.claude-haiku-4-5-20251001-v1:0
```
⚠️ Requires valid credit card on file  
⚡ Better quality than Titan  
💰 Uses free credits first

**DeepSeek (if available in your region):**
```
BEDROCK_MODEL_ID=deepseek.deepseek-v3-2
```
💰 Very cost-effective  
🎯 Good multilingual support

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

### ⚠️ Common Issues (Real-World Tested)

#### 1. "INVALID_PAYMENT_INSTRUMENT" Error

**Error:**
```
AccessDeniedException: Model access is denied due to INVALID_PAYMENT_INSTRUMENT
```

**Solution:**
- Add a **valid credit card** to your AWS account (Billing → Payment methods)
- Wait 2-3 minutes for validation to propagate
- **OR** switch to `amazon.titan-text-express-v1` which doesn't require payment validation

---

#### 2. "Model is marked as Legacy" Error

**Error:**
```
Access denied. This Model is marked by provider as Legacy and you have not been actively using the model
```

**Affected Models (March 2026):**
- `anthropic.claude-3-5-sonnet-*` ❌ Deprecated
- `us.anthropic.claude-3-5-sonnet-*` ❌ Deprecated

**Solution:**
- Use Claude 4.x models: `anthropic.claude-haiku-4-5-20251001-v1:0`
- Use Amazon Titan: `amazon.titan-text-express-v1` ✅ Recommended for free tier
- Use DeepSeek: `deepseek.deepseek-v3-2`

---

#### 3. "Model identifier is invalid" Error

**Error:**
```
ValidationException: The provided model identifier is invalid
```

**Solution:**
1. Go to Bedrock Console → **Foundation models**
2. Find your desired model and **copy the exact Model ID**
3. Paste into Lambda environment variable
4. Ensure you're in the **correct AWS region** (us-east-1 recommended)

**Common Valid IDs:**
- ✅ `amazon.titan-text-express-v1`
- ✅ `anthropic.claude-haiku-4-5-20251001-v1:0`
- ❌ `us.anthropic.claude-haiku-v1:0` (region-specific, may not work in us-east-1)

---

#### 4. "Voice does not support neural engine" Error

**Error:**
```
This voice does not support the selected engine: neural
```

**Solution:**
Code already fixed! Uses `Engine: "standard"` for better compatibility.

If you modified the code, change:
```javascript
Engine: "neural"  // ❌ Doesn't work with all voices
```
To:
```javascript
Engine: "standard"  // ✅ Works with all voices
```

---

#### 5. "Failed to fetch" in Frontend

**Error in Browser Console:**
```
Failed to fetch
CORS policy: No 'Access-Control-Allow-Origin' header
```

**Solution:**
1. Go to **API Gateway** → Your API → **CORS**
2. Click **Configure**
3. Set:
   - **Access-Control-Allow-Origin:** `*`
   - **Access-Control-Allow-Headers:** `content-type`
   - **Access-Control-Allow-Methods:** `POST,OPTIONS`
4. Click **Save**
5. **Restart** your dev server: `npm run dev`

---

#### 6. Lambda Runtime Error: "Cannot find module 'index'"

**Error:**
```
Runtime.ImportModuleError: Cannot find module 'index'
```

**Solution:**
1. Go to Lambda → **Code** → **Runtime settings** → **Edit**
2. Change Handler from `index.handler` to: **`handler.handler`**
3. Click **Save**

---

#### 7. "Task timed out after 3 seconds"

**Solution:**
1. Lambda → **Configuration** → **General configuration** → **Edit**
2. Set **Timeout** to: **300 seconds** (5 minutes)
3. Set **Memory** to: **512 MB** (minimum recommended)
4. Click **Save**

---

#### 8. Audio not playing in browser

**Checklist:**
- ✅ Open audio URL directly in browser tab - does it download/play?
- ✅ Check S3 bucket policy allows public read
- ✅ Check browser console (F12) for CORS errors
- ✅ Verify S3 bucket is in **us-east-1** (same region as Lambda)

---

#### 9. First Bedrock Invocation Fails

**Issue:** 2026 Bedrock models are "auto-enabled on first use"

**Solution:**
1. Go to **Bedrock** → **Playgrounds** → **Chat**
2. Select your model (e.g., Claude Haiku 4.5)
3. Type "Hello" and click **Run**
4. Once you get a response, the model is activated account-wide
5. Go back to Lambda and test again

---

### 🔍 Debugging Tips

**Check CloudWatch Logs:**
1. Lambda → **Monitor** → **View CloudWatch logs**
2. Click latest log stream
3. Look for actual error messages

**Test Lambda Directly:**
1. Lambda → **Test** tab
2. Use this event:
```json
{
  "body": "{\"type\":\"text\",\"text\":\"Test\",\"classLevel\":\"5\",\"language\":\"hindi_rural\"}"
}
```
3. Check response - should be 200 with audioUrl

**Verify IAM Permissions:**
Your Lambda role needs:
- ✅ `AmazonS3FullAccess`
- ✅ `AmazonBedrockFullAccess`
- ✅ `AmazonPollyFullAccess`
- ✅ `AmazonTextractFullAccess`
- ✅ `AmazonTranscribeFullAccess`

---

## 📚 Resources

- **[TESTED-CONFIG.md](TESTED-CONFIG.md)** - ⚡ Verified working configuration (March 2026)
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
