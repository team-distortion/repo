import { useCallback, useState } from 'react';
import { UploadCloud, X, File, Image as ImageIcon } from 'lucide-react';

export default function FileUploadDropzone({ 
  onFilesChange, 
  maxFiles = 5, 
  acceptedTypes = 'image/jpeg,image/png,application/pdf', 
  label 
}) {
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
      } else if (file.size > 5 * 1024 * 1024) {
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
    setError('');
  };

  return (
    <div className="w-full space-y-2">
      <label className="block text-[13px] font-medium text-[var(--color-text-secondary)]">
        {label || `Attachments (Max ${maxFiles})`}
      </label>
      
      {selectedFiles.length < maxFiles && (
        <div 
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`border border-dashed rounded-xl p-5 text-center transition-colors ${
            isDragOver 
              ? 'border-[var(--color-primary)] bg-[var(--color-primary-tint)]' 
              : 'border-[var(--color-border-strong)] bg-[var(--color-surface-2)] hover:border-[var(--color-text-secondary)]'
          }`}
        >
          <UploadCloud className="w-6 h-6 text-[var(--color-text-secondary)] mx-auto mb-1.5" strokeWidth={1.75} />
          <p className="text-[13px] text-[var(--color-text)]">Drag and drop files here, or</p>
          <label className="inline-block mt-1 cursor-pointer text-[13px] text-[var(--color-primary)] hover:underline font-medium">
            Browse Files
            <input 
              type="file" 
              multiple 
              accept={acceptedTypes} 
              onChange={handleFileSelect} 
              className="hidden" 
            />
          </label>
          <p className="text-[12px] text-[var(--color-text-tertiary)] mt-1">JPG, PNG, PDF up to 5MB</p>
        </div>
      )}
      
      {error && <p className="text-[var(--color-error)] text-[12px] mt-1">{error}</p>}

      {selectedFiles.length > 0 && (
        <ul className="space-y-2 mt-2">
          {selectedFiles.map((file, idx) => (
            <li key={`${file.name}-${idx}`} className="flex items-center justify-between p-2.5 bg-[var(--color-surface-2)] rounded-lg border border-[var(--color-border)]">
              <div className="flex items-center space-x-2.5 overflow-hidden">
                {file.type.startsWith('image/') ? (
                  <ImageIcon className="w-4 h-4 text-[var(--color-primary)] shrink-0" strokeWidth={1.75} />
                ) : (
                  <File className="w-4 h-4 text-[var(--color-primary)] shrink-0" strokeWidth={1.75} />
                )}
                <span className="text-[13px] text-[var(--color-text)] truncate" title={file.name}>
                  {file.name}
                </span>
              </div>
              <button 
                type="button" 
                onClick={() => removeFile(idx)}
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-error)] transition-colors p-1"
                aria-label="Remove attachment"
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
