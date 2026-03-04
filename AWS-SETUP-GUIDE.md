# OmniStudy - Complete AWS Setup Guide

**For Beginners** | Production-Ready | Hackathon Project

---

## 📋 Table of Contents

1. [AWS Console Setup](#1-aws-console-setup)
2. [IAM Roles & Permissions](#2-iam-roles--permissions)
3. [Project Architecture](#3-project-architecture)
4. [Environment Variables](#4-environment-variables)
5. [Deployment Steps](#5-deployment-steps)
6. [Testing Your Setup](#6-testing-your-setup)
7. [Caching Strategy](#7-caching-strategy)
8. [Common Beginner Mistakes](#8-common-beginner-mistakes)

---

## 1. AWS Console Setup

### Step 1.1: Create S3 Bucket

1. **Login to AWS Console** → Search for **S3**
2. Click **"Create bucket"**
3. **Bucket name**: `omnistudy-audio-prod-{your-unique-id}` (must be globally unique)
   - Example: `omnistudy-audio-prod-2026`
4. **Region**: Select `us-east-1` (or your preferred region - keep consistent)
5. **Object Ownership**: Select "ACLs disabled (recommended)"
6. **Block Public Access settings**: 
   - ⚠️ **UNCHECK** "Block all public access" 
   - Check the acknowledgment box
   - (For production, use CloudFront + presigned URLs instead)
7. **Bucket Versioning**: Enable (optional but recommended)
8. **Encryption**: Enable (Server-side encryption with Amazon S3 managed keys)
9. Click **"Create bucket"**

**After creation:**
- Go to your bucket → **Permissions** tab
- Under **Bucket Policy**, click **Edit** and add this policy (replace `YOUR-BUCKET-NAME`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    }
  ]
}
```

### Step 1.2: Amazon Bedrock (No Setup Needed!)

**Good News (2026 Update):** Bedrock models are now **automatically enabled** when first invoked!

- ✅ No manual model access request needed
- ✅ Models activate instantly on first API call
- ✅ Works across all AWS commercial regions

**Note:** First-time Anthropic Claude users may need to submit use case details. If you get an access error, go to Bedrock console and try invoking Claude in the playground - it will prompt you to complete any required forms.

**Model IDs you'll use:**
- `anthropic.claude-3-sonnet-20240229-v1:0` (Sonnet - balanced)
- `anthropic.claude-3-haiku-20240307-v1:0` (Haiku - fastest, cheapest, **recommended**)

### Step 1.3: Verify Other Services (Pre-enabled)

These AWS services are **enabled by default** (no setup needed):
- ✅ Amazon Polly (Text-to-Speech)
- ✅ Amazon Transcribe (Speech-to-Text)
- ✅ Amazon Textract (Image text extraction)

---

## 2. IAM Roles & Permissions

### Step 2.1: Create Lambda Execution Role

1. Go to **IAM** → **Roles** → **Create role**
2. **Trusted entity type**: AWS service
3. **Use case**: Lambda → Click **Next**
4. **Attach permissions policies** (search and select these):
   - `AWSLambdaBasicExecutionRole` (CloudWatch Logs)
   - `AmazonS3FullAccess` ⚠️ (or custom S3 policy - see below)
   - `AmazonBedrockFullAccess`
   - `AmazonPollyFullAccess`
   - `AmazonTextractFullAccess`
   - `AmazonTranscribeFullAccess`
5. **Role name**: `OmniStudy-Lambda-ExecutionRole`
6. Click **Create role**

### Step 2.2: (Optional) Create Custom S3 Policy for Tighter Security

Instead of `AmazonS3FullAccess`, create inline policy:

1. Go to your role → **Add permissions** → **Create inline policy**
2. **JSON** tab:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::omnistudy-audio-prod-*",
        "arn:aws:s3:::omnistudy-audio-prod-*/*"
      ]
    }
  ]
}
```

3. Name: `OmniStudy-S3-Access`
4. **Create policy**

---

## 3. Project Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│  Next.js    │─────>│ API Gateway  │─────>│   Lambda    │
│  Frontend   │      │  (HTTP API)  │      │  (Node.js)  │
└─────────────┘      └──────────────┘      └─────────────┘
                                                   │
                          ┌────────────────────────┴─────────────────────┐
                          │                                              │
                    ┌─────▼─────┐  ┌──────────┐  ┌─────────┐  ┌────────▼────┐
                    │  Textract │  │ Bedrock  │  │  Polly  │  │ Transcribe  │
                    │  (Image)  │  │  (LLM)   │  │  (TTS)  │  │   (STT)     │
                    └───────────┘  └──────────┘  └─────────┘  └─────────────┘
                                         │
                                    ┌────▼─────┐
                                    │    S3    │
                                    │  Bucket  │
                                    └──────────┘
```

**Flow:**
1. User uploads image/audio → Next.js
2. Next.js calls API Gateway
3. Lambda receives request:
   - **If image**: Textract extracts text
   - **If audio**: Transcribe converts speech to text
4. Lambda sends text to Bedrock with prompt template
5. Bedrock simplifies concept
6. Polly converts simplified text to speech
7. Lambda uploads MP3 to S3 (with caching)
8. Returns public S3 URL to frontend
9. Frontend plays audio

---

## 4. Environment Variables

Lambda needs these environment variables:

| Variable | Example | Description |
|----------|---------|-------------|
| `AWS_REGION` | `us-east-1` | AWS region (auto-set by Lambda) |
| `S3_BUCKET` | `omnistudy-audio-prod-2026` | Your S3 bucket name |
| `BEDROCK_MODEL_ID` | `anthropic.claude-3-haiku-20240307-v1:0` | Bedrock model identifier |
| `POLLY_VOICE_ID` | `Aditi` | Polly voice (Hindi: Aditi, English: Joanna) |
| `TRANSCRIBE_LANGUAGE` | `hi-IN` | Language code (hi-IN for Hindi, en-US for English) |

**Set in Lambda Console:**
1. Go to your Lambda function → **Configuration** tab
2. **Environment variables** → **Edit**
3. Add each variable above
4. Click **Save**

---

## 5. Deployment Steps

### Step 5.1: Create Lambda Function

1. Go to **Lambda** → **Create function**
2. **Author from scratch**
3. **Function name**: `OmniStudy-ProcessRequest`
4. **Runtime**: Node.js 18.x
5. **Architecture**: x86_64
6. **Permissions**: Use existing role → `OmniStudy-Lambda-ExecutionRole`
7. Click **Create function**

### Step 5.2: Configure Lambda

1. **General configuration** → **Edit**:
   - **Memory**: 512 MB (increase if processing large files)
   - **Timeout**: 5 minutes (300 seconds) - Transcribe can be slow
   - **Ephemeral storage**: 512 MB (default is fine)
2. **Save**

3. **Environment variables** (see section 4 above)

### Step 5.3: Deploy Lambda Code

**Option A: Upload ZIP (Recommended for beginners)**

1. In your project, run:
   ```bash
   cd lambda
   npm install
   npm run build  # If using TypeScript
   zip -r function.zip .
   ```

2. In Lambda Console → **Code** tab → **Upload from** → **.zip file**
3. Upload `function.zip`
4. Click **Save**

**Option B: AWS CLI**

```bash
cd lambda
zip -r function.zip .
aws lambda update-function-code \
  --function-name OmniStudy-ProcessRequest \
  --zip-file fileb://function.zip \
  --region us-east-1
```

### Step 5.4: Create API Gateway

1. Go to **API Gateway** → **Create API**
2. Choose **HTTP API** → **Build**
3. **Integrations** → **Add integration**:
   - Type: **Lambda**
   - Region: `us-east-1`
   - Lambda function: `OmniStudy-ProcessRequest`
   - Version: 2.0
4. **API name**: `OmniStudy-API`
5. Click **Next**
6. **Configure routes**:
   - Method: **POST**
   - Resource path: `/process`
   - Integration target: `OmniStudy-ProcessRequest`
7. Click **Next** → **Next** → **Create**

### Step 5.5: Enable CORS

1. In API Gateway console → Your API → **CORS**
2. **Configure**:
   - Access-Control-Allow-Origin: `*` (or your frontend domain)
   - Access-Control-Allow-Headers: `content-type,x-amz-date,authorization,x-api-key`
   - Access-Control-Allow-Methods: `POST,OPTIONS`
3. **Save**

### Step 5.6: Deploy API

1. Click **Deploy** or go to **Stages** → `$default`
2. Copy **Invoke URL**: `https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com`
3. Your endpoint: `https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/process`

---

## 6. Testing Your Setup

### Test 1: Direct Lambda Test

1. Go to Lambda → **Test** tab
2. **Create new test event**:

```json
{
  "body": "{\"type\":\"text\",\"text\":\"Photosynthesis is the process by which plants convert sunlight into energy\",\"classLevel\":\"5\"}"
}
```

3. Click **Test**
4. Check response for `audioUrl`

### Test 2: API Gateway Test

Use **curl** or **Postman**:

```bash
curl -X POST https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/process \
  -H "Content-Type: application/json" \
  -d '{
    "type": "text",
    "text": "Gravity is the force that pulls objects toward each other",
    "classLevel": "5"
  }'
```

Expected response:
```json
{
  "audioUrl": "https://omnistudy-audio-prod-2026.s3.us-east-1.amazonaws.com/simplified-audio/abcd1234.mp3",
  "cached": false
}
```

### Test 3: Frontend Integration

1. Update Next.js `.env.local`:
   ```
   NEXT_PUBLIC_API_URL=https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/process
   ```

2. Run frontend:
   ```bash
   npm run dev
   ```

3. Upload an image or audio file
4. Verify audio playback

---

## 7. Caching Strategy

### How It Works

1. **Generate hash**: SHA-256 hash of `classLevel:simplifiedText`
2. **Check S3**: Look for `simplified-audio/{hash}.mp3`
3. **Cache hit**: Return existing URL (saves Polly costs)
4. **Cache miss**: Generate audio → Upload to S3 → Return new URL

### Benefits

- **Cost savings**: Avoid re-generating same audio (Polly charges per character)
- **Speed**: Instant response for cached content
- **Consistency**: Same input always produces same output

### S3 Folder Structure

```
omnistudy-audio-prod-2026/
├── simplified-audio/          # Cached simplified explanations
│   ├── a1b2c3d4e5f6...mp3
│   ├── f6e5d4c3b2a1...mp3
│   └── ...
├── transcribe-temp/           # Temporary transcription files
│   └── job-xyz.mp3
└── uploads/                   # User uploads (if stored)
    └── ...
```

---

## 8. Common Beginner Mistakes (and How to Avoid)

### ❌ Mistake 1: Wrong AWS Region Mismatch

**Problem**: Lambda in `us-east-1`, S3 in `us-west-2` → Slow performance

**Solution**: Keep ALL resources in same region (us-east-1 recommended for Bedrock)

---

### ❌ Mistake 2: Lambda Handler Misconfigured

**Problem**: `Runtime.ImportModuleError: Cannot find module 'index'`

**Solution**: 
- Go to Lambda → Code tab → Runtime settings → Edit
- Change Handler from `index.handler` to `handler.handler`
- Click Save
- Our file is named `handler.js`, not `index.js`

---

### ❌ Mistake 3: Bedrock Access Issues (2026 Update)

**Problem**: `AccessDeniedException` when calling Bedrock

**Solution (2026)**: 
- Models auto-enable on first use (no manual request needed)
- **First-time Anthropic users:** May need to submit use case details
- Go to Bedrock console → Try invoking Claude in playground
- Complete any required forms if prompted
- Check IAM role has `AmazonBedrockFullAccess` policy

---

### ❌ Mistake 4: IAM Permissions Missing

**Problem**: `AccessDenied` errors in CloudWatch Logs

**Solution**: 
- Check Lambda execution role has ALL required policies
- Use `AmazonBedrockFullAccess`, not just `AmazonBedrockReadOnly`

---

### ❌ Mistake 5: Lambda Timeout Too Short

**Problem**: Function times out after 3 seconds (default)

**Solution**: 
- Increase timeout to 300 seconds (5 minutes)
- Transcribe jobs can take 30-60 seconds for audio files

---

### ❌ Mistake 6: S3 Bucket Not Public for Audio

**Problem**: Audio URL returns 403 Forbidden

**Solution**: 
- Add bucket policy allowing public read (see Step 1.1)
- Or use presigned URLs (more secure)

---

### ❌ Mistake 7: CORS Not Configured

**Problem**: Browser blocks API calls from Next.js

**Solution**: 
- Enable CORS in API Gateway (Step 5.5)
- Add your frontend domain to allowed origins

---

### ❌ Mistake 8: Hardcoding AWS Credentials

**Problem**: ❌ NEVER put AWS keys in code!

```javascript
// ❌ WRONG - NEVER DO THIS
const s3 = new S3Client({
  credentials: {
    accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
    secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
  }
});
```

**Solution**: 
- Lambda uses IAM role automatically
- AWS SDK picks up credentials from environment
- Just use: `new S3Client({ region: 'us-east-1' })`

---

### ❌ Mistake 9: Not Handling Async Errors

**Problem**: Unhandled promise rejections crash Lambda

**Solution**: 
- Always use try/catch with async/await
- Return proper error responses
- Log errors to CloudWatch

---

### ❌ Mistake 10: Large Dependencies in Lambda

**Problem**: Lambda package > 50 MB → Deployment fails

**Solution**: 
- Use Lambda Layers for large dependencies
- Or use Container images instead of ZIP
- Minimize dependencies (AWS SDK v3 is modular)

---

### ❌ Mistake 11: Not Checking CloudWatch Logs

**Problem**: Function fails silently, no idea why

**Solution**: 
- Go to Lambda → Monitor → View CloudWatch logs
- Check for error messages
- Add `console.log()` for debugging

---

## 🎯 Quick Checklist Before Going Live

- [ ] S3 bucket created and public read enabled
- [ ] Bedrock model access granted (check status)
- [ ] IAM role has all 6 required policies
- [ ] Lambda timeout set to 300 seconds
- [ ] Lambda environment variables configured
- [ ] API Gateway CORS enabled
- [ ] Test Lambda directly (success)
- [ ] Test API Gateway endpoint (success)
- [ ] Frontend can call API and play audio
- [ ] CloudWatch Logs show no errors

---

## 📚 Useful AWS Documentation

- [S3 Bucket Policies](https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucket-policies.html)
- [Bedrock Model IDs](https://docs.aws.amazon.com/bedrock/latest/userguide/model-ids.html)
- [Polly Voices](https://docs.aws.amazon.com/polly/latest/dg/voicelist.html)
- [Transcribe Languages](https://docs.aws.amazon.com/transcribe/latest/dg/supported-languages.html)
- [Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)

---

**Next Steps**: See `lambda/` folder for complete backend code and `frontend/` for Next.js app.
