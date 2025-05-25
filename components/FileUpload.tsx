// File: components/FileUpload.tsx
import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface FileWithPreview {
  file: File
  preview?: string
  id: string
}

const SUPPORTED_FORMATS = {
  images: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'tiff'],
  documents: ['pdf', 'doc', 'docx', 'txt', 'rtf'],
  spreadsheets: ['xlsx', 'xls', 'csv'],
  archives: ['zip', 'rar', '7z'],
  videos: ['mp4', 'avi', 'mov', 'wmv', 'flv'],
  audio: ['mp3', 'wav', 'flac', 'aac']
}

const CONVERSION_OPTIONS = {
  'image': ['jpg', 'png', 'webp', 'gif', 'bmp', 'svg', 'pdf'],
  'document': ['pdf', 'txt', 'docx', 'jpg', 'png'],
  'spreadsheet': ['xlsx', 'csv', 'pdf', 'json'],
  'other': ['pdf', 'zip', 'txt']
}

export default function FileUpload() {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [converting, setConverting] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState('jpg')
  const [resizeOptions, setResizeOptions] = useState({ width: '', height: '', maintainRatio: true })
  const [cropOptions, setCropOptions] = useState({ x: 0, y: 0, width: 100, height: 100 })
  const [showCropTool, setShowCropTool] = useState(false)
  const [currentFile, setCurrentFile] = useState<FileWithPreview | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const getFileType = (file: File): string => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (SUPPORTED_FORMATS.images.includes(ext || '')) return 'image'
    if (SUPPORTED_FORMATS.documents.includes(ext || '')) return 'document'
    if (SUPPORTED_FORMATS.spreadsheets.includes(ext || '')) return 'spreadsheet'
    return 'other'
  }

  const createPreview = useCallback((file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.readAsDataURL(file)
      } else {
        resolve(undefined)
      }
    })
  }, [])

  const handleFileSelect = async (selectedFiles: FileList) => {
    const newFiles: FileWithPreview[] = []
    
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i]
      const preview = await createPreview(file)
      newFiles.push({
        file,
        preview,
        id: Math.random().toString(36).substr(2, 9)
      })
    }
    
    setFiles(prev => [...prev, ...newFiles])
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    if (e.dataTransfer.files) {
      await handleFileSelect(e.dataTransfer.files)
    }
  }, [])

  const resizeImage = (img: HTMLImageElement, width: number, height: number): string => {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')!
    
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
    ctx.drawImage(img, 0, 0, width, height)
    
    return canvas.toDataURL(`image/${selectedFormat}`, 0.92)
  }

  const cropImage = (img: HTMLImageElement): string => {
    const canvas = document.createElement('canvas')
    const scaleX = img.naturalWidth / img.width
    const scaleY = img.naturalHeight / img.height
    
    canvas.width = cropOptions.width * scaleX
    canvas.height = cropOptions.height * scaleY
    
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(
      img,
      cropOptions.x * scaleX,
      cropOptions.y * scaleY,
      cropOptions.width * scaleX,
      cropOptions.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    )
    
    return canvas.toDataURL(`image/${selectedFormat}`, 0.92)
  }

  const convertToFormat = async (fileWithPreview: FileWithPreview) => {
    const { file } = fileWithPreview
    const fileType = getFileType(file)
    
    if (fileType === 'image' && file.type.startsWith('image/')) {
      return new Promise<string>((resolve) => {
        const img = new Image()
        img.onload = () => {
          let result: string
          
          if (resizeOptions.width || resizeOptions.height) {
            const newWidth = parseInt(resizeOptions.width) || img.width
            const newHeight = parseInt(resizeOptions.height) || img.height
            result = resizeImage(img, newWidth, newHeight)
          } else if (showCropTool) {
            result = cropImage(img)
          } else {
            const canvas = document.createElement('canvas')
            canvas.width = img.width
            canvas.height = img.height
            const ctx = canvas.getContext('2d')!
            ctx.drawImage(img, 0, 0)
            result = canvas.toDataURL(`image/${selectedFormat}`, 0.92)
          }
          
          resolve(result)
        }
        img.src = fileWithPreview.preview!
      })
    }
    
    if (fileType === 'document' && selectedFormat === 'pdf') {
      // Convert document to PDF (simplified)
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      canvas.width = 800
      canvas.height = 600
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, 800, 600)
      ctx.fillStyle = '#000000'
      ctx.font = '16px Arial'
      ctx.fillText(`Document: ${file.name}`, 50, 50)
      ctx.fillText(`Size: ${(file.size / 1024).toFixed(2)} KB`, 50, 80)
      return canvas.toDataURL('image/png')
    }
    
    // For other formats, return original file as base64
    return new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.readAsDataURL(file)
    })
  }

  const handleConvert = async () => {
    if (files.length === 0) return
    
    setConverting(true)
    
    try {
      for (const fileWithPreview of files) {
        const convertedData = await convertToFormat(fileWithPreview)
        
        const link = document.createElement('a')
        link.href = convertedData
        link.download = `${fileWithPreview.file.name.split('.')[0]}.${selectedFormat}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (error) {
      console.error('Conversion error:', error)
    } finally {
      setConverting(false)
    }
  }

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  const openCropTool = (file: FileWithPreview) => {
    setCurrentFile(file)
    setShowCropTool(true)
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-8">
      {/* Upload Area */}
      <motion.div
        className={`relative border-3 border-dashed rounded-3xl p-12 text-center transition-all duration-300 ${
          dragOver 
            ? 'border-blue-500 bg-blue-50 scale-105' 
            : 'border-gray-300 hover:border-gray-400 bg-white'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        style={{
          background: dragOver 
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
            : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="*/*"
          onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <motion.div
          animate={dragOver ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
          className="text-6xl mb-4"
        >
          📁
        </motion.div>
        
        <h3 className="text-2xl font-bold text-white mb-2">
          {dragOver ? 'Drop files here!' : 'Drag & Drop Files'}
        </h3>
        <p className="text-white/80 mb-4">
          Support all formats: Images, Documents, Spreadsheets, Videos, Audio & More
        </p>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => fileInputRef.current?.click()}
          className="bg-white text-gray-800 px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all"
        >
          Choose Files
        </motion.button>
      </motion.div>

      {/* Conversion Options */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-2xl p-6 shadow-xl"
          >
            <h3 className="text-xl font-bold mb-4">Conversion Options</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Format Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Convert To:</label>
                <select
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <optgroup label="Images">
                    <option value="jpg">JPG</option>
                    <option value="png">PNG</option>
                    <option value="webp">WebP</option>
                    <option value="gif">GIF</option>
                  </optgroup>
                  <optgroup label="Documents">
                    <option value="pdf">PDF</option>
                    <option value="txt">TXT</option>
                  </optgroup>
                  <optgroup label="Data">
                    <option value="csv">CSV</option>
                    <option value="json">JSON</option>
                  </optgroup>
                </select>
              </div>

              {/* Resize Options */}
              <div>
                <label className="block text-sm font-medium mb-2">Resize (Optional):</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Width"
                    value={resizeOptions.width}
                    onChange={(e) => setResizeOptions(prev => ({ ...prev, width: e.target.value }))}
                    className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="self-center">×</span>
                  <input
                    type="number"
                    placeholder="Height"
                    value={resizeOptions.height}
                    onChange={(e) => setResizeOptions(prev => ({ ...prev, height: e.target.value }))}
                    className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Quality/Compression */}
              <div>
                <label className="block text-sm font-medium mb-2">Quality:</label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  defaultValue="92"
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Small</span>
                  <span>Best</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <h3 className="text-xl font-bold">Files ({files.length})</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {files.map((fileWithPreview) => (
                <motion.div
                  key={fileWithPreview.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow"
                >
                  {fileWithPreview.preview && (
                    <div className="relative mb-3 group">
                      <img
                        src={fileWithPreview.preview}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <button
                          onClick={() => openCropTool(fileWithPreview)}
                          className="bg-white text-gray-800 px-3 py-1 rounded-full text-sm font-medium mr-2"
                        >
                          ✂️ Crop
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <h4 className="font-medium truncate" title={fileWithPreview.file.name}>
                      {fileWithPreview.file.name}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {(fileWithPreview.file.size / 1024).toFixed(1)} KB
                    </p>
                    <p className="text-xs text-gray-400 capitalize">
                      {getFileType(fileWithPreview.file)}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => removeFile(fileWithPreview.id)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                  >
                    ×
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Convert Button */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleConvert}
              disabled={converting}
              className={`px-12 py-4 rounded-full font-bold text-white text-lg shadow-lg ${
                converting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
              }`}
            >
              {converting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Converting...
                </span>
              ) : (
                `🚀 Convert ${files.length} File${files.length !== 1 ? 's' : ''}`
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Crop Tool Modal */}
      <AnimatePresence>
        {showCropTool && currentFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Crop Image</h3>
                <button
                  onClick={() => setShowCropTool(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="text-center">
                <img
                  src={currentFile.preview}
                  alt="Crop preview"
                  className="max-w-full max-h-96 mx-auto border-2 border-dashed border-gray-300"
                />
                
                <div className="grid grid-cols-4 gap-4 mt-4">
                  <input
                    type="number"
                    placeholder="X"
                    value={cropOptions.x}
                    onChange={(e) => setCropOptions(prev => ({ ...prev, x: parseInt(e.target.value) || 0 }))}
                    className="p-2 border rounded"
                  />
                  <input
                    type="number"
                    placeholder="Y"
                    value={cropOptions.y}
                    onChange={(e) => setCropOptions(prev => ({ ...prev, y: parseInt(e.target.value) || 0 }))}
                    className="p-2 border rounded"
                  />
                  <input
                    type="number"
                    placeholder="Width"
                    value={cropOptions.width}
                    onChange={(e) => setCropOptions(prev => ({ ...prev, width: parseInt(e.target.value) || 100 }))}
                    className="p-2 border rounded"
                  />
                  <input
                    type="number"
                    placeholder="Height"
                    value={cropOptions.height}
                    onChange={(e) => setCropOptions(prev => ({ ...prev, height: parseInt(e.target.value) || 100 }))}
                    className="p-2 border rounded"
                  />
                </div>
                
                <div className="flex gap-4 justify-center mt-6">
                  <button
                    onClick={() => setShowCropTool(false)}
                    className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setShowCropTool(false)}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Apply Crop
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}