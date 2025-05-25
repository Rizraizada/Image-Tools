

// File: pages/index.tsx
import Head from 'next/head'
import { useState, useEffect } from 'react'
import FileUpload from '../components/FileUpload'

export default function Home() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
      <Head>
        <title>FileForge - Ultimate File Converter & Editor</title>
        <meta name="description" content="Convert any file format, resize images, crop photos, create PDFs - all in your browser. Free, fast, and private." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <main className="relative z-10 py-10 px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-4 animate-pulse">
            🔥 FileForge
          </h1>
          <p className="text-xl text-gray-700 mb-2 max-w-2xl mx-auto">
            Ultimate File Converter & Editor - Transform any file format instantly
          </p>
          <p className="text-gray-600 max-w-3xl mx-auto">
            Convert images, documents, spreadsheets, videos & more. Resize, crop, compress - all in your browser. 
            <span className="font-semibold text-purple-600"> 100% Free & Private</span>
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-12">
          {[
            { icon: '🖼️', title: 'Images', desc: 'JPG, PNG, WebP, GIF' },
            { icon: '📄', title: 'Documents', desc: 'PDF, DOC, TXT' },
            { icon: '📊', title: 'Spreadsheets', desc: 'XLSX, CSV, JSON' },
            { icon: '🎬', title: 'Media', desc: 'MP4, MP3, MOV' }
          ].map((feature, i) => (
            <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 text-center hover:bg-white/90 transition-all hover:scale-105 shadow-lg">
              <div className="text-3xl mb-2">{feature.icon}</div>
              <h3 className="font-bold text-gray-800">{feature.title}</h3>
              <p className="text-sm text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Main Upload Component */}
        <FileUpload />

        {/* Footer */}
        <div className="text-center mt-16 text-gray-600">
          <p className="mb-2">✨ No uploads to servers - everything happens in your browser</p>
          <p className="text-sm">🔐 Your files never leave your device</p>
        </div>
      </main>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}

// File: package.json - Add these dependencies
/*
{
  "dependencies": {
    "next": "latest",
    "react": "latest",
    "react-dom": "latest",
    "framer-motion": "^10.16.4",
    "pdf-lib": "^1.17.1",
    "xlsx": "^0.18.5",
    "jspdf": "^2.5.1"
  },
  "devDependencies": {
    "@types/react": "latest",
    "@types/node": "latest",
    "typescript": "latest",
    "tailwindcss": "latest",
    "autoprefixer": "latest",
    "postcss": "latest"
  }
}
*/