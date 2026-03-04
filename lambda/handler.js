/**
 * OmniStudy Lambda Handler
 * Processes image/audio uploads, extracts text, simplifies with Bedrock, and generates audio
 * 
 * AWS Services Used:
 * - Textract: Extract text from images
 * - Transcribe: Convert speech to text
 * - Bedrock: LLM for simplifying concepts
 * - Polly: Text-to-speech conversion
 * - S3: Store and cache audio files
 */

const { S3Client, PutObjectCommand, HeadObjectCommand } = require("@aws-sdk/client-s3");
const { TextractClient, DetectDocumentTextCommand } = require("@aws-sdk/client-textract");
const { TranscribeClient, StartTranscriptionJobCommand, GetTranscriptionJobCommand } = require("@aws-sdk/client-transcribe");
const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");
const { PollyClient, SynthesizeSpeechCommand } = require("@aws-sdk/client-polly");
const crypto = require("crypto");
const https = require("https");

// ==================== CONFIGURATION ====================

const REGION = process.env.AWS_REGION || "us-east-1";
const S3_BUCKET = process.env.S3_BUCKET;
const BEDROCK_MODEL_ID = process.env.BEDROCK_MODEL_ID || "anthropic.claude-3-haiku-20240307-v1:0";
const POLLY_VOICE_ID = process.env.POLLY_VOICE_ID || "Aditi"; // Aditi = Hindi female voice
const TRANSCRIBE_LANGUAGE = process.env.TRANSCRIBE_LANGUAGE || "hi-IN"; // Hindi India

// Initialize AWS SDK v3 clients
const s3Client = new S3Client({ region: REGION });
const textractClient = new TextractClient({ region: REGION });
const transcribeClient = new TranscribeClient({ region: REGION });
const bedrockClient = new BedrockRuntimeClient({ region: REGION });
const pollyClient = new PollyClient({ region: REGION });

// ==================== BEDROCK PROMPT TEMPLATES ====================

/**
 * Prompt templates for different class levels and languages
 * {{text}} will be replaced with the extracted concept
 * {{level}} will be replaced with class level (5, 8, 10)
 */
const PROMPT_TEMPLATES = {
  hindi_rural: `तुम एक अनुभवी शिक्षक हो जो ग्रामीण भारत के छात्रों को पढ़ाते हो।

निम्नलिखित अवधारणा को कक्षा {{level}} के छात्र के लिए सरल हिंदी में समझाओ।
रोजमर्रा के उदाहरणों का उपयोग करो जो गाँव के बच्चे समझ सकें।

अवधारणा: {{text}}

केवल सरल व्याख्या दो। तकनीकी शब्दों से बचो। 3-4 वाक्यों में समझाओ।`,

  english_simple: `You are a patient teacher explaining concepts to a Class {{level}} student.

Explain the following concept in simple English using everyday examples:

Concept: {{text}}

Keep it to 3-4 sentences. Use analogies a child would understand. Avoid jargon.`,

  hinglish: `You are explaining to a Class {{level}} student in Hinglish (mix of Hindi and English).

Is concept ko simple language mein samjhao:

Concept: {{text}}

Everyday examples use karo. 3-4 sentences mein explain karo, jaise friend ko bata rahe ho.`
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Generate SHA-256 hash for caching
 * @param {string} text - Text to hash
 * @returns {string} Hex hash
 */
function hashText(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

/**
 * Wait/sleep utility
 * @param {number} ms - Milliseconds to wait
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Download file from URL
 * @param {string} url - File URL
 * @returns {Promise<Buffer>} File buffer
 */
function downloadFile(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => resolve(Buffer.concat(chunks)));
      response.on("error", reject);
    }).on("error", reject);
  });
}

// ==================== S3 OPERATIONS ====================

/**
 * Check if file exists in S3 cache
 * @param {string} key - S3 object key
 * @returns {Promise<string|null>} Public URL if exists, null otherwise
 */
async function checkS3Cache(key) {
  try {
    await s3Client.send(new HeadObjectCommand({
      Bucket: S3_BUCKET,
      Key: key
    }));
    
    // File exists, return public URL
    return `https://${S3_BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
  } catch (error) {
    if (error.name === "NotFound") {
      return null; // File doesn't exist
    }
    throw error;
  }
}

/**
 * Upload audio buffer to S3
 * @param {Buffer} audioBuffer - MP3 audio data
 * @param {string} key - S3 object key
 * @returns {Promise<string>} Public S3 URL
 */
async function uploadToS3(audioBuffer, key) {
  await s3Client.send(new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: audioBuffer,
    ContentType: "audio/mpeg",
    // Note: For public access, ensure bucket policy allows public reads
  }));

  return `https://${S3_BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
}

// ==================== TEXT EXTRACTION ====================

/**
 * Extract text from image using Amazon Textract
 * @param {Buffer} imageBuffer - Image data
 * @returns {Promise<string>} Extracted text
 */
async function extractTextFromImage(imageBuffer) {
  console.log("Extracting text from image using Textract...");
  
  const command = new DetectDocumentTextCommand({
    Document: {
      Bytes: imageBuffer
    }
  });

  const response = await textractClient.send(command);
  
  // Combine all detected text blocks
  const lines = response.Blocks
    .filter(block => block.BlockType === "LINE")
    .map(block => block.Text)
    .join(" ");

  console.log(`Textract extracted ${lines.length} characters`);
  return lines;
}

/**
 * Extract text from audio using Amazon Transcribe
 * @param {Buffer} audioBuffer - Audio data
 * @returns {Promise<string>} Transcribed text
 */
async function extractTextFromAudio(audioBuffer) {
  console.log("Transcribing audio using Amazon Transcribe...");
  
  // Transcribe requires S3 input, so upload temporarily
  const tempKey = `transcribe-temp/${Date.now()}.mp3`;
  await uploadToS3(audioBuffer, tempKey);
  
  const jobName = `omnistudy-${Date.now()}`;
  const s3Uri = `s3://${S3_BUCKET}/${tempKey}`;

  // Start transcription job
  await transcribeClient.send(new StartTranscriptionJobCommand({
    TranscriptionJobName: jobName,
    LanguageCode: TRANSCRIBE_LANGUAGE,
    MediaFormat: "mp3",
    Media: {
      MediaFileUri: s3Uri
    },
    OutputBucketName: S3_BUCKET
  }));

  console.log(`Transcription job started: ${jobName}`);

  // Poll for completion (max 2 minutes)
  let attempts = 0;
  const maxAttempts = 24; // 24 * 5 seconds = 2 minutes

  while (attempts < maxAttempts) {
    await sleep(5000); // Wait 5 seconds between checks
    
    const statusResponse = await transcribeClient.send(new GetTranscriptionJobCommand({
      TranscriptionJobName: jobName
    }));

    const status = statusResponse.TranscriptionJob.TranscriptionJobStatus;
    console.log(`Transcription status: ${status}`);

    if (status === "COMPLETED") {
      // Fetch transcript from S3
      const transcriptUri = statusResponse.TranscriptionJob.Transcript.TranscriptFileUri;
      const transcriptData = await downloadFile(transcriptUri);
      const transcript = JSON.parse(transcriptData.toString());
      
      return transcript.results.transcripts[0].transcript;
    } else if (status === "FAILED") {
      throw new Error("Transcription job failed");
    }

    attempts++;
  }

  throw new Error("Transcription timeout after 2 minutes");
}

// ==================== BEDROCK LLM ====================

/**
 * Simplify concept using Amazon Bedrock (Claude)
 * @param {string} text - Text to simplify
 * @param {string} classLevel - Class level (5, 8, 10)
 * @param {string} language - Language template to use
 * @returns {Promise<string>} Simplified explanation
 */
async function simplifyWithBedrock(text, classLevel, language = "hindi_rural") {
  console.log(`Simplifying with Bedrock (${BEDROCK_MODEL_ID})...`);

  // Select prompt template
  const template = PROMPT_TEMPLATES[language] || PROMPT_TEMPLATES.hindi_rural;
  const prompt = template
    .replace("{{text}}", text)
    .replace("{{level}}", classLevel);

  let payload;
  
  // Check model type and prepare appropriate payload
  if (BEDROCK_MODEL_ID.includes("amazon.titan")) {
    // Titan API format
    payload = {
      inputText: prompt,
      textGenerationConfig: {
        maxTokenCount: 400,
        temperature: 0.7,
        topP: 0.9
      }
    };
  } else if (BEDROCK_MODEL_ID.includes("deepseek")) {
    // DeepSeek API format
    payload = {
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 400,
      temperature: 0.7,
      top_p: 0.9
    };
  } else {
    // Claude/Anthropic API format
    payload = {
      anthropic_version: "bedrock-2024-10-01",
      max_tokens: 400,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt
            }
          ]
        }
      ],
      temperature: 0.7,
      top_p: 0.9
    };
  }

  const command = new InvokeModelCommand({
    modelId: BEDROCK_MODEL_ID,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify(payload)
  });

  const response = await bedrockClient.send(command);
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));

  // Extract response based on model type
  let simplifiedText;
  if (BEDROCK_MODEL_ID.includes("amazon.titan")) {
    // Titan response format
    simplifiedText = responseBody.results[0].outputText;
  } else if (BEDROCK_MODEL_ID.includes("deepseek")) {
    // DeepSeek response format
    simplifiedText = responseBody.choices[0].message.content;
  } else {
    // Claude response format
    simplifiedText = responseBody.content[0].text;
  }
  
  console.log(`Bedrock response: ${simplifiedText.substring(0, 100)}...`);

  return simplifiedText;
}

// ==================== TEXT-TO-SPEECH ====================

/**
 * Convert text to speech using Amazon Polly
 * @param {string} text - Text to convert
 * @param {string} languageCode - Language code (hi-IN, en-US)
 * @returns {Promise<Buffer>} MP3 audio buffer
 */
async function textToSpeech(text, languageCode = "hi-IN") {
  console.log(`Generating speech with Polly (${POLLY_VOICE_ID})...`);

  const command = new SynthesizeSpeechCommand({
    Text: text,
    OutputFormat: "mp3",
    VoiceId: POLLY_VOICE_ID,
    LanguageCode: languageCode,
    Engine: "standard" // Using standard engine for broader compatibility
  });

  const response = await pollyClient.send(command);
  
  // Convert stream to buffer
  const chunks = [];
  for await (const chunk of response.AudioStream) {
    chunks.push(chunk);
  }

  const audioBuffer = Buffer.concat(chunks);
  console.log(`Generated ${audioBuffer.length} bytes of audio`);

  return audioBuffer;
}

// ==================== MAIN HANDLER ====================

/**
 * Lambda handler function
 * @param {Object} event - API Gateway event
 * @returns {Promise<Object>} API Gateway response
 */
exports.handler = async (event) => {
  console.log("OmniStudy Lambda invoked", JSON.stringify(event));

  try {
    // Parse request body
    const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
    const { 
      type,           // "image", "audio", or "text"
      fileUrl,        // URL of uploaded file (for image/audio)
      text,           // Direct text input (for text type)
      classLevel,     // "5", "8", or "10"
      language        // "hindi_rural", "english_simple", "hinglish"
    } = body;

    // Validate input
    if (!type || !classLevel) {
      return errorResponse(400, "Missing required fields: type, classLevel");
    }

    if ((type === "image" || type === "audio") && !fileUrl) {
      return errorResponse(400, "fileUrl required for image/audio type");
    }

    if (type === "text" && !text) {
      return errorResponse(400, "text required for text type");
    }

    // Step 1: Extract text from source
    let extractedText;
    
    if (type === "text") {
      extractedText = text;
      console.log("Using direct text input");
    } else if (type === "image") {
      const imageBuffer = await downloadFile(fileUrl);
      extractedText = await extractTextFromImage(imageBuffer);
    } else if (type === "audio") {
      const audioBuffer = await downloadFile(fileUrl);
      extractedText = await extractTextFromAudio(audioBuffer);
    } else {
      return errorResponse(400, "Invalid type. Must be: text, image, or audio");
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return errorResponse(400, "No text could be extracted from input");
    }

    console.log(`Extracted text: ${extractedText.substring(0, 200)}...`);

    // Step 2: Simplify with Bedrock
    const simplifiedText = await simplifyWithBedrock(
      extractedText,
      classLevel,
      language || "hindi_rural"
    );

    // Step 3: Check cache using hash of simplified text
    const cacheKey = `simplified-audio/${hashText(`${classLevel}:${language}:${simplifiedText}`)}.mp3`;
    const cachedUrl = await checkS3Cache(cacheKey);

    if (cachedUrl) {
      console.log("Cache HIT - returning existing audio");
      return successResponse(cachedUrl, true);
    }

    console.log("Cache MISS - generating new audio");

    // Step 4: Generate speech with Polly
    const audioLanguage = language === "english_simple" ? "en-US" : "hi-IN";
    const audioBuffer = await textToSpeech(simplifiedText, audioLanguage);

    // Step 5: Upload to S3
    const audioUrl = await uploadToS3(audioBuffer, cacheKey);

    console.log(`Success! Audio uploaded to: ${audioUrl}`);

    return successResponse(audioUrl, false);

  } catch (error) {
    console.error("Lambda error:", error);
    return errorResponse(500, `Internal error: ${error.message}`);
  }
};

// ==================== RESPONSE HELPERS ====================

function successResponse(audioUrl, cached) {
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*", // Enable CORS
    },
    body: JSON.stringify({
      success: true,
      audioUrl: audioUrl,
      cached: cached,
      timestamp: new Date().toISOString()
    })
  };
}

function errorResponse(statusCode, message) {
  return {
    statusCode: statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify({
      success: false,
      error: message,
      timestamp: new Date().toISOString()
    })
  };
}
