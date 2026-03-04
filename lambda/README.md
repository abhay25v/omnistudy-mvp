# OmniStudy Lambda Backend

Production-ready AWS Lambda function using Node.js 18 and AWS SDK v3.

## 🏗️ Architecture

```
Input (Image/Audio/Text)
    ↓
Textract/Transcribe (if needed)
    ↓
Extract Text
    ↓
Bedrock (Claude) - Simplify concept
    ↓
Check S3 Cache
    ↓
Polly - Text to Speech
    ↓
Upload MP3 to S3
    ↓
Return Public URL
```

## 📦 Dependencies (AWS SDK v3)

All dependencies are **modular** (tree-shakable) for smaller bundle size:

- `@aws-sdk/client-s3` - S3 operations
- `@aws-sdk/client-textract` - Image text extraction
- `@aws-sdk/client-transcribe` - Audio transcription
- `@aws-sdk/client-bedrock-runtime` - LLM inference
- `@aws-sdk/client-polly` - Text-to-speech

## 🚀 Local Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure AWS Credentials

Create `~/.aws/credentials`:

```ini
[default]
aws_access_key_id = YOUR_ACCESS_KEY
aws_secret_access_key = YOUR_SECRET_KEY
```

### 3. Update test-local.js

Edit environment variables:

```javascript
process.env.S3_BUCKET = "your-bucket-name";
```

### 4. Run Test

```bash
node test-local.js
```

Expected output:
```
✅ Success!
Status Code: 200
Response: { audioUrl: "https://...", cached: false }
```

## 📤 Deployment

### Option 1: ZIP Upload (Recommended)

```bash
# Install production dependencies only
npm install --production

# Create ZIP file
zip -r function.zip . -x '*.git*' 'test-local.js'

# Upload via AWS Console or CLI
aws lambda update-function-code \
  --function-name OmniStudy-ProcessRequest \
  --zip-file fileb://function.zip \
  --region us-east-1
```

### Option 2: AWS SAM (Advanced)

```bash
sam build
sam deploy --guided
```

## 🔧 Environment Variables

Set these in Lambda Console → Configuration → Environment variables:

| Variable | Example | Required |
|----------|---------|----------|
| `AWS_REGION` | `us-east-1` | Auto-set by Lambda |
| `S3_BUCKET` | `omnistudy-audio-prod-2026` | ✅ Yes |
| `BEDROCK_MODEL_ID` | `anthropic.claude-3-haiku-20240307-v1:0` | ✅ Yes |
| `POLLY_VOICE_ID` | `Aditi` (Hindi) or `Joanna` (English) | No (default: Aditi) |
| `TRANSCRIBE_LANGUAGE` | `hi-IN` or `en-US` | No (default: hi-IN) |

## 🧪 Testing

### Test Event 1: Direct Text

```json
{
  "body": "{\"type\":\"text\",\"text\":\"The Earth revolves around the Sun in an elliptical orbit\",\"classLevel\":\"5\",\"language\":\"hindi_rural\"}"
}
```

### Test Event 2: Image URL

```json
{
  "body": "{\"type\":\"image\",\"fileUrl\":\"https://example.com/science-diagram.jpg\",\"classLevel\":\"8\",\"language\":\"english_simple\"}"
}
```

### Test Event 3: Audio URL

```json
{
  "body": "{\"type\":\"audio\",\"fileUrl\":\"https://example.com/lecture.mp3\",\"classLevel\":\"10\",\"language\":\"hinglish\"}"
}
```

## 🎯 Prompt Templates

### Hindi Rural (Default)

Best for students in rural India who need concepts explained in simple Hindi with everyday examples.

```
तुम एक अनुभवी शिक्षक हो जो ग्रामीण भारत के छात्रों को पढ़ाते हो।
```

### English Simple

For English-medium students who need simple explanations without jargon.

```
You are a patient teacher explaining concepts to a Class {{level}} student.
```

### Hinglish

Mix of Hindi and English, perfect for urban Indian students.

```
You are explaining to a Class {{level}} student in Hinglish.
```

## 💾 Caching Strategy

**How it works:**

1. Generate SHA-256 hash: `hash("classLevel:language:simplifiedText")`
2. S3 key: `simplified-audio/{hash}.mp3`
3. Check if exists using `HeadObjectCommand`
4. If exists → Return existing URL (saves Polly cost)
5. If not → Generate → Upload → Return new URL

**Cache hit example:**
```
Input: "Gravity" + Class 5 + Hindi
Hash: a1b2c3d4e5f6...
S3 Check: ✅ simplified-audio/a1b2c3d4e5f6.mp3 exists
Response: Return cached URL (instant, $0.00)
```

**Cache miss example:**
```
Input: "Photosynthesis" + Class 8 + English
Hash: f6e5d4c3b2a1...
S3 Check: ❌ Not found
Generate: Call Polly ($0.004 per 1000 chars)
Upload: Save to S3
Response: Return new URL
```

## 📊 Performance & Costs

| Operation | Time | Cost (approx) |
|-----------|------|---------------|
| Textract (1 page) | ~1s | $0.0015 |
| Transcribe (1 min audio) | ~30s | $0.024 |
| Bedrock (Claude Haiku) | ~2s | $0.00025 per 1K tokens |
| Polly (1000 chars) | ~1s | $0.004 |
| S3 storage (1 MB) | - | $0.000023/month |
| Lambda (512 MB, 30s) | - | $0.000000833 |

**Total cost per request: ~$0.03 (without cache)**

**With 50% cache hit rate: ~$0.015 per request**

## 🐛 Common Errors

### Error: `AccessDeniedException: User is not authorized to perform: bedrock:InvokeModel`

**Solution:** Check IAM role has `AmazonBedrockFullAccess` and model access is granted in Bedrock console.

### Error: `NoSuchBucket: The specified bucket does not exist`

**Solution:** Create S3 bucket and update `S3_BUCKET` environment variable.

### Error: `Task timed out after 3.00 seconds`

**Solution:** Increase Lambda timeout to 300 seconds (Transcribe takes time).

### Error: `Cannot read property 'text' of undefined`

**Solution:** No text extracted. Check input image quality or audio clarity.

## 📝 CloudWatch Logs

Monitor execution:

```bash
# View recent logs
aws logs tail /aws/lambda/OmniStudy-ProcessRequest --follow

# Search for errors
aws logs filter-pattern /aws/lambda/OmniStudy-ProcessRequest --filter-pattern "ERROR"
```

## 🔒 Security Best Practices

✅ **DO:**
- Use IAM roles (never hardcode credentials)
- Enable CloudTrail logging
- Use VPC if accessing private resources
- Implement rate limiting
- Validate all inputs
- Use presigned URLs for sensitive files

❌ **DON'T:**
- Store AWS keys in code
- Make S3 bucket fully public (use presigned URLs)
- Skip input validation
- Log sensitive user data
- Use admin policies (scope down permissions)

## 📚 AWS SDK v3 Migration Notes

If migrating from SDK v2:

```javascript
// ❌ SDK v2 (old)
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
await s3.putObject({...}).promise();

// ✅ SDK v3 (new)
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const s3 = new S3Client({ region: 'us-east-1' });
await s3.send(new PutObjectCommand({...}));
```

**Benefits:**
- Smaller bundle size (modular imports)
- Better TypeScript support
- Middleware stack for customization
- Native async/await (no `.promise()`)

## 🎓 Learning Resources

- [AWS SDK v3 Documentation](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [Bedrock User Guide](https://docs.aws.amazon.com/bedrock/latest/userguide/)
- [Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [Polly Voice List](https://docs.aws.amazon.com/polly/latest/dg/voicelist.html)

---

**Questions?** Check CloudWatch Logs first! 90% of issues are visible there.
