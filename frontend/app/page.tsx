'use client';

import { useState, useRef } from 'react';

type InputType = 'text' | 'image' | 'audio';
type ClassLevel = '5' | '8' | '10';
type Language = 'hindi_rural' | 'english_simple' | 'hinglish';

export default function Home() {
  const [inputType, setInputType] = useState<InputType>('text');
  const [textInput, setTextInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [classLevel, setClassLevel] = useState<ClassLevel>('5');
  const [language, setLanguage] = useState<Language>('hindi_rural');
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const uploadFileToCloudinary = async (file: File): Promise<string> => {
    // Using Cloudinary as temporary file hosting (free tier)
    // Alternative: Create presigned S3 URLs via your own API
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'omnistudy'); // Create this in Cloudinary dashboard
    
    const response = await fetch(
      'https://api.cloudinary.com/v1_1/demo/upload', // Replace 'demo' with your cloud name
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('File upload failed');
    }

    const data = await response.json();
    return data.secure_url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setAudioUrl(null);
    setLoading(true);

    try {
      let requestBody: any = {
        type: inputType,
        classLevel,
        language,
      };

      // Prepare request based on input type
      if (inputType === 'text') {
        if (!textInput.trim()) {
          throw new Error('Please enter some text');
        }
        requestBody.text = textInput;
      } else {
        // For image/audio, upload file first
        if (!file) {
          throw new Error('Please select a file');
        }

        // Upload file to get public URL
        const fileUrl = await uploadFileToCloudinary(file);
        requestBody.fileUrl = fileUrl;
      }

      // Call Lambda via API Gateway
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error('API URL not configured. Please set NEXT_PUBLIC_API_URL in .env.local');
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API request failed');
      }

      const data = await response.json();
      
      if (data.success) {
        setAudioUrl(data.audioUrl);
        setCached(data.cached || false);
        
        // Auto-play audio
        setTimeout(() => {
          audioRef.current?.play();
        }, 500);
      } else {
        throw new Error(data.error || 'Unknown error');
      }

    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-800 mb-2">
            🎓 OmniStudy
          </h1>
          <p className="text-gray-600 text-lg">
            AI-Powered Learning Assistant - Simplify Any Concept
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Powered by AWS Bedrock, Polly, Textract & Transcribe
          </p>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <form onSubmit={handleSubmit}>
            {/* Input Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                What do you want to learn from?
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'text', label: '📝 Text', icon: '📝' },
                  { value: 'image', label: '🖼️ Image', icon: '🖼️' },
                  { value: 'audio', label: '🎤 Audio', icon: '🎤' },
                ].map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setInputType(type.value as InputType)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      inputType === type.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-3xl mb-1">{type.icon}</div>
                    <div className="text-sm font-medium">{type.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Text Input */}
            {inputType === 'text' && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Enter concept to simplify
                </label>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="e.g., Photosynthesis is the process by which plants convert sunlight into energy..."
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                />
              </div>
            )}

            {/* File Input */}
            {(inputType === 'image' || inputType === 'audio') && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Upload {inputType === 'image' ? 'Image' : 'Audio'} File
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition"
                >
                  {file ? (
                    <div className="text-green-600">
                      ✓ {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </div>
                  ) : (
                    <div className="text-gray-500">
                      Click to upload {inputType === 'image' ? 'image' : 'audio'}
                      <div className="text-xs mt-1">
                        {inputType === 'image' ? 'JPG, PNG (max 5MB)' : 'MP3, WAV (max 10MB)'}
                      </div>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={inputType === 'image' ? 'image/*' : 'audio/*'}
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            )}

            {/* Class Level */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Grade Level
              </label>
              <div className="grid grid-cols-3 gap-3">
                {['5', '8', '10'].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setClassLevel(level as ClassLevel)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      classLevel === level
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    Class {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Language */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Explanation Language
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'hindi_rural', label: 'Hindi (Rural)' },
                  { value: 'english_simple', label: 'English (Simple)' },
                  { value: 'hinglish', label: 'Hinglish' },
                ].map((lang) => (
                  <button
                    key={lang.value}
                    type="button"
                    onClick={() => setLanguage(lang.value as Language)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      language === lang.value
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold py-4 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </span>
              ) : (
                '🚀 Generate Simplified Explanation'
              )}
            </button>
          </form>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
            <div className="flex items-center">
              <span className="text-red-700">❌ {error}</span>
            </div>
          </div>
        )}

        {/* Audio Player */}
        {audioUrl && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                ✨ Simplified Explanation Ready!
              </h2>
              {cached && (
                <span className="inline-block bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full">
                  ⚡ Loaded from cache
                </span>
              )}
            </div>
            
            <audio
              ref={audioRef}
              controls
              className="w-full mb-4"
              src={audioUrl}
            >
              Your browser does not support audio playback.
            </audio>

            <div className="flex gap-3">
              <button
                onClick={() => audioRef.current?.play()}
                className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition"
              >
                ▶️ Play
              </button>
              <button
                onClick={() => audioRef.current?.pause()}
                className="flex-1 bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600 transition"
              >
                ⏸️ Pause
              </button>
              <a
                href={audioUrl}
                download
                className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition text-center"
              >
                ⬇️ Download
              </a>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          Built with Next.js + AWS Lambda + Bedrock + Polly + Transcribe + Textract
        </div>
      </div>
    </main>
  );
}
