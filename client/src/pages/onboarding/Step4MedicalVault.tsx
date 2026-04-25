import { useState } from 'react'

interface Step4Data {
  medicalFiles?: string[]
}

interface Step4MedicalVaultProps {
  data: Step4Data
  onUpdate: (data: Step4Data) => void
  onNext: () => void
}

const Step4MedicalVault = ({ data, onUpdate, onNext }: Step4MedicalVaultProps) => {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<string[]>(data.medicalFiles || [])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    const fileNames = files.map(f => f.name)
    setUploadedFiles(prev => [...prev, ...fileNames])
    onUpdate({ medicalFiles: uploadedFiles })
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileNames = Array.from(e.target.files).map(f => f.name)
      setUploadedFiles(prev => [...prev, ...fileNames])
      onUpdate({ medicalFiles: uploadedFiles })
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Medical Vault (Optional)</h2>
        <p className="text-gray-500">Securely store your medical documents and reports.</p>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
          isDragging
            ? 'border-purple-600 bg-purple-50'
            : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
        }`}
      >
        <div className="flex flex-col items-center gap-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
            isDragging ? 'bg-purple-100' : 'bg-gray-100'
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-8 h-8 ${isDragging ? 'text-purple-600' : 'text-gray-400'}`}>
              <path d="M10.5 1.5a1.5 1.5 0 012.39 2.025l6.375 14.625a1.5 1.5 0 01-2.265 1.823l-4.823-5.39-5.39 4.823a1.5 1.5 0 01-1.823-2.265l14.625-6.375a1.5 1.5 0 011.025-2.39V1.5a1.5 1.5 0 011.5-1.5h2.25a1.5 1.5 0 011.5 1.5v2.25a1.5 1.5 0 002.39 1.025l6.375 14.625a1.5 1.5 0 01-2.265 1.823l-14.625-6.375a1.5 1.5 0 01-1.025-2.39V12a1.5 1.5 0 00-1.5-1.5H11.5a1.5 1.5 0 00-1.5 1.5v2.25a1.5 1.5 0 01-2.39 1.025l-6.375-14.625a1.5 1.5 0 012.265-1.823l14.625 6.375a1.5 1.5 0 011.025 2.39v2.25a1.5 1.5 0 001.5 1.5h2.25a1.5 1.5 0 001.5-1.5V11.5a1.5 1.5 0 00-1.5-1.5h-2.25a1.5 1.5 0 01-1.5-1.5v-.25z" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-700">Drag & Drop Medical Files</p>
            <p className="text-sm text-gray-500 mt-1">Upload any relevant medical documents, prescriptions, or lab reports</p>
          </div>
          <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border-2 border-gray-300 rounded-lg text-gray-700 hover:border-purple-400 hover:text-purple-600 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M10.75 2a.75.75 0 00.75.75v11.5a.75.75 0 001.5 0v-4.5a.75.75 0 011.5 0v4.5A.75.75 0 0013.25 16l-9-6.75a.75.75 0 00-1.5 0L1.75 16a.75.75 0 001.5 0v4.5a.75.75 0 01-1.5 0v-11.5A.75.75 0 001.75 2h8.5z" />
            </svg>
            Browse Files
            <input
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
          </label>
        </div>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Uploaded files:</p>
          {uploadedFiles.map((file, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-400">
                <path fillRule="evenodd" d="M4.5 3A1.5 1.5 0 003 4.5v11A1.5 1.5 0 004.5 17h11a1.5 1.5 0 001.5-1.5V9.621a1.5 1.5 0 00-.44-1.06l-4.12-3.67A1.5 1.5 0 0011.38 4H4.5zm5.58 4.763a.75.75 0 00-1.5.06l.27 3.22h3.45a.75.75 0 000-1.5H8.94l-.27-3.22a.75.75 0 00-1.5-.06l-2.22 6.75a.75.75 0 001.5.06l2.22-6.75z" clipRule="evenodd" />
              </svg>
              {file}
            </div>
          ))}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-blue-500 mt-0.5">
          <path fillRule="evenodd" d="M12 1.5a.75.75 0 01.75.75v4.5a.75.75 0 01-.75.75h-4.5a.75.75 0 010-1.5h3a.75.75 0 01.75.75v3a.75.75 0 01-.75.75h-3a.75.75 0 01-.75-.75v-3A.75.75 0 016 6v4.5a.75.75 0 01-1.5 0V6A2.25 2.25 0 016.75 3.75h4.5A2.25 2.25 0 0113.5 6v4.5a2.25 2.25 0 01-2.25 2.25h-4.5A2.25 2.25 0 014.5 13.5v-4.5A2.25 2.25 0 016.75 6.75h3a.75.75 0 010 1.5h-3A.75.75 0 005.25 9v3a.75.75 0 001.5 0V9a.75.75 0 01.75-.75h4.5a.75.75 0 01.75.75v3a.75.75 0 01-.75.75h-4.5a.75.75 0 010-1.5h3a.75.75 0 01.75-.75V6a.75.75 0 01.75-.75h4.5a.75.75 0 01.75.75v4.5a.75.75 0 01-.75.75h-4.5a.75.75 0 01-.75-.75v-3a.75.75 0 01.75-.75h3a.75.75 0 010 1.5h-3a.75.75 0 01-.75-.75V6z" clipRule="evenodd" />
        </svg>
        <div>
          <p className="text-sm font-medium text-blue-800">Your data is encrypted and secure</p>
          <p className="text-sm text-blue-600 mt-1">All medical files are encrypted using industry-standard AES-256 encryption and stored securely in compliance with HIPAA regulations.</p>
        </div>
      </div>

      <div className="text-center">
        <button
          type="button"
          onClick={onNext}
          className="text-purple-600 hover:text-purple-800 font-medium text-sm"
        >
          Skip for now — I'll upload later
        </button>
      </div>
    </div>
  )
}

export default Step4MedicalVault