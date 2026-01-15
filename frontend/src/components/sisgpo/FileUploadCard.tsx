import { ChangeEvent, useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import Button from '../ui/Button';

interface FileUploadCardProps {
  title: string;
  description?: string;
  onUpload: (file: File) => Promise<void> | void;
  isLoading?: boolean;
  lastUploadLabel?: string | null;
}

const FileUploadCard = ({
  title,
  description,
  onUpload,
  isLoading = false,
  lastUploadLabel,
}: FileUploadCardProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setSelectedFile(file ?? null);
  };

  const handleUpload = async () => {
    if (!selectedFile || isLoading) {
      return;
    }
    await onUpload(selectedFile);
    setSelectedFile(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-text-strong">{title}</h3>
          {description && <p className="text-sm text-text">{description}</p>}
          {lastUploadLabel && (
            <p className="text-xs text-text mt-1">Ultimo upload: {lastUploadLabel}</p>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            ref={inputRef}
            type="file"
            className="text-sm text-text"
            onChange={handleFileChange}
            disabled={isLoading}
          />
          <Button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || isLoading}
            className="flex items-center gap-2"
          >
            <Upload size={16} /> {isLoading ? 'Enviando...' : 'Enviar'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FileUploadCard;
