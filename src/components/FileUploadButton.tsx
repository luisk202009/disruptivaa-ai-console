import { useRef, forwardRef } from "react";
import { Paperclip, X, FileText, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadButtonProps {
  onFilesSelected: (files: File[]) => void;
  attachedFiles: File[];
  onRemoveFile: (index: number) => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = ".pdf,.xlsx,.xls,.csv";

const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return FileText;
  if (['xlsx', 'xls', 'csv'].includes(ext || '')) return FileSpreadsheet;
  return FileText;
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const FileUploadButton = forwardRef<HTMLDivElement, FileUploadButtonProps>(({
  onFilesSelected,
  attachedFiles,
  onRemoveFile,
  disabled = false,
}, ref) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      if (file.size > MAX_FILE_SIZE) {
        console.warn(`File ${file.name} exceeds 10MB limit`);
        return false;
      }
      return true;
    });
    
    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
    
    // Reset input to allow selecting the same file again
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div ref={ref} className="flex flex-col gap-2">
      {/* File previews */}
      {attachedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 px-2">
          {attachedFiles.map((file, index) => {
            const FileIcon = getFileIcon(file.name);
            return (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border text-sm"
              >
                <FileIcon size={14} className="text-primary shrink-0" />
                <span className="text-foreground truncate max-w-[120px]">
                  {file.name}
                </span>
                <span className="text-muted-foreground text-xs">
                  ({formatFileSize(file.size)})
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveFile(index)}
                  className="p-0.5 rounded-full hover:bg-destructive/20 transition-colors"
                >
                  <X size={12} className="text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload button */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        multiple
        onChange={handleChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-xl transition-colors",
          disabled
            ? "bg-muted text-muted-foreground cursor-not-allowed"
            : "bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary"
        )}
        title="Adjuntar archivo (PDF, Excel, CSV)"
      >
        <Paperclip size={18} />
      </button>
    </div>
  );
});

FileUploadButton.displayName = "FileUploadButton";

export default FileUploadButton;
