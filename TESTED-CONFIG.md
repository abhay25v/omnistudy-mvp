# ✅ Tested Working Configuration (March 2026)

This document contains the **exact configuration** that was tested and verified working on AWS Free Tier.

---

## 🎯 Tested Setup Summary

| Component | Value | Status |
|-----------|-------|--------|
| **AWS Region** | us-east-1 (N. Virginia) | ✅ Working |
| **Node.js Runtime** | 20.x | ✅ Working |
| **Bedrock Model** | `amazon.titan-text-express-v1` | ✅ Working |
| **Polly Engine** | `standard` | ✅ Working |
| **Polly Voice** | `Aditi` (Hindi) | ✅ Working |
| **Lambda Timeout** | 300 seconds | ✅ Required |
| **Lambda Memory** | 512 MB | ✅ Required |
| **Lambda Handler** | `handler.handler` | ✅ Critical |

---

## 📋 Exact Environment Variables

### Lambda Configuration → Environment variables

```
AWS_REGION=us-east-1
S3_BUCKET=omnistudy-audio-us-east-2026
BEDROCK_MODEL_ID=amazon.titan-text-express-v1
POLLY_VOICE_ID=Aditi
TRANSCRIBE_LANGUAGE=hi-IN
```

### Frontend `.env.local`

```
NEXT_PUBLIC_API_URL=https://9lulqy6qc3.execute-api.us-east-1.amazonaws.com/process
```

---

## 🧪 Verified Test Case

**Lambda Test Event:**
```json
{
  "body": "{\"type\":\"text\",\"text\":\"The Earth revolves around the Sun\",\"classLevel\":\"5\",\"language\":\"hindi_rural\"}"
}
```

**Expected Response:**
```json
{
  "statusCode": 200,
  "headers": {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  },
  "body": "{\"success\":true,\"audioUrl\":\"https://omnistudy-audio-us-east-2026.s3.us-east-1.amazonaws.com/simplified-audio/[hash].mp3\",\"cached\":false,\"timestamp\":\"2026-03-04T07:39:34.753Z\"}"
}
```

**Execution Time:** ~3-5 seconds (first run), ~0.5 seconds (cached)

---

## 🔧 Lambda Runtime Settings

**Configuration → General configuration:**

- **Runtime:** Node.js 20.x
- **Architecture:** x86_64
- **Memory:** 512 MB
- **Timeout:** 5 min 0 sec
- **Execution role:** OmniStudyLambdaRole (or your custom role name)

**Configuration → Runtime settings:**

- **Handler:** `handler.handler` ⚠️ **Not** `index.handler`

---

## 🔐 IAM Role Policies (Minimum Required)

Your Lambda execution role needs these managed policies attached:

1. ✅ **AmazonS3FullAccess** (or custom S3 policy for your bucket)
2. ✅ **AmazonBedrockFullAccess**
3. ✅ **AmazonPollyFullAccess**
4. ✅ **AmazonTextractFullAccess** (if using image input)
5. ✅ **AmazonTranscribeFullAccess** (if using audio input)
6. ✅ **CloudWatchLogsFullAccess** (for debugging)

---

## 🌐 API Gateway Configuration

**Type:** HTTP API (not REST API)

**Routes:**
- **Method:** POST
- **Path:** `/process`
- **Integration:** Lambda function (OmniStudyLambda)

**CORS Settings:**
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: content-type
Access-Control-Allow-Methods: POST,OPTIONS
```

**Invoke URL Format:**
```
https://[api-id].execute-api.us-east-1.amazonaws.com/process
```

---

## 📦 S3 Bucket Configuration

**Name:** `omnistudy-audio-us-east-2026` (must be globally unique)

**Region:** us-east-1

**Bucket Policy (for public audio access):**
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::omnistudy-audio-us-east-2026/simplified-audio/*"
        }
    ]
}
```

**CORS Configuration:**
```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": []
    }
]
```

---

## 🎨 Frontend Configuration

**Package.json dependencies (tested versions):**
```json
{
  "dependencies": {
    "next": "14.2.20",
    "react": "^18",
    "react-dom": "^18"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10.0.1",
    "postcss": "^8",
    "tailwindcss": "^3.4.1",
    "typescript": "^5"
  }
}
```

**Next.js Version:** 14.2.20  
**React Version:** 18.x  
**TypeScript Version:** 5.x

---

## 🚀 Deployment Steps (Verified Working)

### 1. Lambda Package Creation

```powershell
cd D:\omnistudy-mvp\lambda
npm install --production
Compress-Archive -Path handler.js,package.json,package-lock.json,node_modules -DestinationPath function.zip -Force
```

**Result:** `function.zip` (~15-20 MB)

### 2. Lambda Upload

**Via AWS Console:**
1. Lambda → Code tab → Upload from → .zip file
2. Select `function.zip`
3. Click Save
4. Wait for upload to complete (~30 seconds)

### 3. Configure Lambda

**Set Handler:**
1. Code → Runtime settings → Edit
2. Handler: `handler.handler`
3. Save

**Set Environment Variables:**
1. Configuration → Environment variables → Edit
2. Add all variables listed above
3. Save

**Set Timeout & Memory:**
1. Configuration → General configuration → Edit
2. Memory: 512 MB
3. Timeout: 5 min 0 sec
4. Save

### 4. Test Lambda

1. Test tab → Create test event
2. Event name: `test1`
3. Paste test JSON (see above)
4. Click Test
5. ✅ Should return `statusCode: 200` with `audioUrl`

### 5. API Gateway Setup

1. Create HTTP API
2. Add POST /process route
3. Configure CORS (see settings above)
4. Copy Invoke URL

### 6. Frontend Setup

```powershell
cd D:\omnistudy-mvp\frontend
npm install
# Edit .env.local with API URL
npm run dev
```

7. Open http://localhost:3000
8. Test with text input
9. ✅ Should generate and play audio

---

## ⚠️ Common Pitfalls (Learned the Hard Way)

### 1. ❌ Wrong Handler Configuration
**Wrong:** `index.handler`  
**Correct:** `handler.handler`

### 2. ❌ Using Claude 3.5 Models in 2026
**Error:** "Model marked as Legacy"  
**Fix:** Use Titan, Claude 4.x, or DeepSeek

### 3. ❌ No Payment Method on Free Tier
**Error:** "INVALID_PAYMENT_INSTRUMENT"  
**Fix:** Add credit card OR use `amazon.titan-text-express-v1`

### 4. ❌ Polly Neural Engine
**Error:** "Voice does not support neural engine"  
**Fix:** Code uses `Engine: "standard"` (already fixed)

### 5. ❌ Missing CORS on API Gateway
**Error:** "Failed to fetch" in browser  
**Fix:** Configure CORS properly (see above)

### 6. ❌ Wrong API URL in Frontend
**Wrong:** `https://api-id.execute-api.us-east-1.amazonaws.com`  
**Correct:** `https://api-id.execute-api.us-east-1.amazonaws.com/process`

### 7. ❌ Lambda Timeout Too Short
**Error:** "Task timed out after 3.00 seconds"  
**Fix:** Set timeout to 300 seconds

### 8. ❌ Insufficient Memory
**Error:** Out of memory errors in CloudWatch  
**Fix:** Set memory to at least 512 MB

---

## 📊 Performance Metrics (Observed)

| Metric | Value | Notes |
|--------|-------|-------|
| **Cold Start** | ~2.5 seconds | First invocation after deploy |
| **Warm Execution** | ~3-5 seconds | Text → Bedrock → Polly → S3 |
| **Cached Response** | ~0.3 seconds | S3 cache hit |
| **Memory Used** | ~100 MB | Out of 512 MB allocated |
| **Bedrock Latency** | ~600ms | Titan model response time |
| **Polly Generation** | ~1.5 seconds | 200-300 character Hindi text |
| **S3 Upload** | ~200ms | MP3 file ~50KB |

---

## 💰 Cost Breakdown (Per Request)

**Without Cache (First Run):**
- Bedrock (Titan): $0.0001 per request
- Polly (Standard): $0.001 per 250 chars
- S3 Storage: $0.000001 per MB
- Lambda: $0.0000002 per request
- **Total:** ~$0.001-0.002 per request

**With Cache (50% hit rate):**
- Average cost: ~$0.0005-0.001 per request
- **1000 requests:** ~$0.50-1.00
- **10,000 requests:** ~$5-10

**Free Tier Covers:**
- Lambda: 1M requests/month FREE
- S3: 5GB storage FREE  
- Polly: 5M chars/month FREE (first 12 months)
- Bedrock Titan: Generous free tier

**Estimated hackathon demo (100-200 requests):** ~$0.10-0.20

---

## 🎓 What We Learned

1. ✅ **Always use us-east-1** for maximum AWS service availability
2. ✅ **Amazon Titan is perfect for free tier** - no payment validation needed
3. ✅ **CORS must be configured** on API Gateway for browser access
4. ✅ **Handler configuration is critical** - wrong value = module not found
5. ✅ **Claude 3.5 models deprecated in 2026** - use Titan or Claude 4.x
6. ✅ **Polly standard engine** works with all voices (neural doesn't)
7. ✅ **300-second timeout required** for Transcribe operations
8. ✅ **512 MB memory minimum** for reliable performance
9. ✅ **Restart dev server** after changing .env.local
10. ✅ **Test Lambda directly** before testing frontend integration

---

## 📝 Deployment Checklist

- [ ] Lambda created with Node.js 20.x runtime
- [ ] Handler set to `handler.handler`
- [ ] All environment variables configured
- [ ] Timeout set to 300 seconds
- [ ] Memory set to 512 MB
- [ ] IAM role has all required policies
- [ ] S3 bucket created with public read policy
- [ ] S3 CORS configured
- [ ] Lambda test returns 200 with audioUrl
- [ ] API Gateway created (HTTP API)
- [ ] POST /process route configured
- [ ] API Gateway CORS configured
- [ ] Frontend .env.local updated with correct API URL
- [ ] Frontend npm install completed
- [ ] Frontend test successful with audio playback

---

**Last Verified:** March 4, 2026  
**AWS Account Type:** Free Tier with $100 credits  
**Region:** us-east-1 (N. Virginia)  
**Status:** ✅ Fully Working

