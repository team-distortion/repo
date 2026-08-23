import React, { useCallback, useState } from 'react';
import { UploadCloud, X, File, Image as ImageIcon } from 'lucide-react';

export default function FileUploadDropzone({ onFilesChange, maxFiles = 5, acceptedTypes = 'image/jpeg,image/png,application/pdf', label }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState('');

  const validateFiles = (files) => {
    let validFiles = [];
    let errorMessage = '';

    if (selectedFiles.length + files.length > maxFiles) {
      errorMessage = `You can only upload up to ${maxFiles} files.`;
    }

    Array.from(files).forEach(file => {
      if (!acceptedTypes.includes(file.type)) {
        errorMessage = 'Invalid file type. Only JPG, PNG, and PDF are allowed.';
      } else if (file.size > 5 * 1024 * 1024) { // 5MB limit
        errorMessage = 'File too large. Max size is 5MB.';
      } else if (validFiles.length + selectedFiles.length < maxFiles) {
        validFiles.push(file);
      }
    });

    if (errorMessage) setError(errorMessage);
    else setError('');

    return validFiles;
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const validFiles = validateFiles(e.dataTransfer.files);
      const newFiles = [...selectedFiles, ...validFiles];
      setSelectedFiles(newFiles);
      onFilesChange(newFiles);
    }
  }, [selectedFiles, onFilesChange, maxFiles]);

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const validFiles = validateFiles(e.target.files);
      const newFiles = [...selectedFiles, ...validFiles];
      setSelectedFiles(newFiles);
      onFilesChange(newFiles);
    }
  };

  const removeFile = (indexToRemove) => {
    const newFiles = selectedFiles.filter((_, index) => index !== indexToRemove);
    setSelectedFiles(newFiles);
    onFilesChange(newFiles);
    setError(''); // clear errors if they remove a file
  };

  return (
    <div className="w-full space-y-3">
      <label className="block text-sm font-medium text-slate-300">
        {label || `Attachments (Max ${maxFiles})`}
      </label>
      
      {selectedFiles.length < maxFiles && (
        <div 
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors
            ${isDragOver ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-600 bg-slate-900/50 hover:border-slate-500'}
          `}
        >
          <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-300">Drag and drop files here, or</p>
          <label className="inline-block mt-2 cursor-pointer text-sm text-emerald-400 hover:text-emerald-300 font-medium">
            Browse Files
            <input 
              type="file" 
              multiple 
              accept={acceptedTypes} 
              onChange={handleFileSelect} 
              className="hidden" 
            />
          </label>
          <p className="text-xs text-slate-500 mt-2">JPG, PNG, PDF up to 5MB</p>
        </div>
      )}
      
      {error && <p className="text-red-400 text-sm mt-1">{error}</p>}

      {selectedFiles.length > 0 && (
        <ul className="space-y-2 mt-3">
          {selectedFiles.map((file, idx) => (
            <li key={`${file.name}-${idx}`} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-700">
              <div className="flex items-center space-x-3 overflow-hidden">
                {file.type.startsWith('image/') ? <ImageIcon className="w-5 h-5 text-emerald-400 shrink-0" /> : <File className="w-5 h-5 text-blue-400 shrink-0" />}
                <span className="text-sm text-slate-200 truncate" title={file.name}>
                  {file.name}
                </span>
              </div>
              <button 
                type="button" 
                onClick={() => removeFile(idx)}
                className="text-slate-400 hover:text-red-400 transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
