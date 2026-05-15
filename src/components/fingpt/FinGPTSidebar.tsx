import { useEffect, useRef, useState } from 'react';

import {
  FileText,
  Upload,
  CheckCircle2,
  Clock,
  FilePlus,
  Trash2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { Progress } from '@/components/ui/progress';
import { useNotificationsStore } from '@/stores/notificationsStore';
import {
  formatFileSize,
  formatUploadedAt,
  useDocumentStore,
} from '@/stores/documentStore';

type Props = {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
};

export default function FinGPTSidebar({ mobileOpen = false, onMobileClose }: Props) {
  const documents = useDocumentStore((s) => s.documents);
  const activeDocumentId = useDocumentStore((s) => s.activeDocumentId);
  const isLoading = useDocumentStore((s) => s.isLoading);
  const isUploading = useDocumentStore((s) => s.isUploading);
  const uploadProgress = useDocumentStore((s) => s.uploadProgress);
  const error = useDocumentStore((s) => s.error);
  const setActiveDocument = useDocumentStore((s) => s.setActiveDocument);
  const fetchDocuments = useDocumentStore((s) => s.fetchDocuments);
  const uploadDocument = useDocumentStore((s) => s.uploadDocument);
  const removeDocument = useDocumentStore((s) => s.removeDocument);
  const clearError = useDocumentStore((s) => s.clearError);

  const [uploadHover, setUploadHover] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void fetchDocuments();
  }, [fetchDocuments]);

  const processFile = async (file: File | undefined) => {
    if (!file) return;
    const isPdf =
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      toast.error('Only PDF files are supported');
      useNotificationsStore.getState().add({
        title: 'Upload rejected',
        body: 'Please choose a valid PDF document.',
        type: 'error',
      });
      return;
    }

    try {
      await uploadDocument(file);
      toast.success('PDF uploaded successfully');
      useNotificationsStore.getState().add({
        title: 'Upload successful',
        body: `${file.name} is ready for analysis.`,
        type: 'success',
      });
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Upload failed';
      toast.error(msg);
      useNotificationsStore.getState().add({
        title: 'Upload failed',
        body: msg,
        type: 'error',
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    void processFile(e.target.files?.[0]);
  };

  const selectDoc = (id: string) => {
    setActiveDocument(id);
    onMobileClose?.();
  };

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await removeDocument(id);
      toast.success('Document removed');
      useNotificationsStore.getState().add({
        title: 'Document deleted',
        body: `${name} was removed.`,
        type: 'success',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Delete failed';
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  };

  const historyDocs = documents.slice(1);

  return (
    <aside
      className={`
        flex flex-col flex-shrink-0
        border-r border-border-mist
        bg-deep-slate
        overflow-y-auto overflow-x-hidden
        min-h-0 min-w-0 max-w-full
        w-[min(20rem,calc(100vw-0.5rem))]
        md:relative md:top-auto md:left-auto md:bottom-auto md:right-auto
        md:z-0 md:translate-x-0 md:shadow-none md:w-52 lg:w-64 xl:w-72
        max-md:fixed max-md:z-40 max-md:top-16 max-md:bottom-0 max-md:left-0
        transition-transform duration-300 ease-out
        max-md:shadow-[8px_0_32px_rgba(0,0,0,0.45)]
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}
      aria-label="Document panel"
    >
      <div className="px-4 sm:px-5 pt-5 sm:pt-6 pb-4 border-b border-border-mist flex-shrink-0">
        <div className="flex items-center gap-2 mb-1 min-w-0">
          <FileText className="w-4 h-4 text-teal-core flex-shrink-0" />
          <h2 className="font-sans font-semibold text-sm text-soft-white tracking-wide truncate">
            Documents
          </h2>
        </div>
        <p className="font-body text-xs text-muted-ink pl-6 break-words">
          Upload / view financial filings
        </p>
      </div>

      <div className="flex-1 min-h-0 px-2 sm:px-3 pt-4 pb-4 space-y-2">
        <p className="px-2 font-mono text-[10px] text-muted-ink uppercase tracking-widest mb-3">
          {documents.length > 0
            ? `Reports · ${documents.length}`
            : 'No reports loaded'}
        </p>

        {isLoading && documents.length === 0 && (
          <div className="space-y-2 px-1" aria-busy="true" aria-label="Loading documents">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-[4.5rem] rounded-xl border border-border-mist bg-surface-dark animate-pulse"
              />
            ))}
          </div>
        )}

        {!isLoading && documents.length === 0 && (
          <div className="mx-1 rounded-xl border border-dashed border-border-mist bg-surface-dark/30 px-4 py-8 text-center">
            <FileText className="w-8 h-8 text-muted-ink/40 mx-auto mb-3" />
            <p className="font-sans text-sm text-soft-white/80 mb-1">No documents yet</p>
            <p className="font-body text-xs text-muted-ink leading-relaxed">
              Upload a PDF financial report to start analyzing with FinGPT.
            </p>
          </div>
        )}

        {documents.map((doc) => {
          const isActive = activeDocumentId === doc.id;
          const isDeleting = deletingId === doc.id;

          return (
            <button
              key={doc.id}
              type="button"
              onClick={() => selectDoc(doc.id)}
              disabled={isDeleting}
              className={`
                group w-full max-w-full text-left rounded-xl border
                p-3 sm:p-3.5 transition-all duration-200
                cursor-pointer min-w-0
                disabled:opacity-60 disabled:cursor-wait
                ${
                  isActive
                    ? 'border-teal-core/50 bg-teal-core/8 shadow-teal-glow'
                    : 'border-border-mist bg-surface-dark hover:border-teal-core/30 hover:bg-teal-core/5'
                }
              `}
            >
              <div className="flex items-start gap-2 sm:gap-3 min-w-0">
                <div
                  className={`
                    w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                    ${
                      isActive
                        ? 'bg-teal-core/20 border border-teal-core/40'
                        : 'bg-border-mist/50 border border-border-mist'
                    }
                  `}
                >
                  <FileText
                    className={`w-4 h-4 ${isActive ? 'text-teal-core' : 'text-muted-ink'}`}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-sans font-medium text-sm text-soft-white truncate mb-1">
                    {doc.name}
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                    <span
                      className={`
                        font-mono text-[10px]
                        px-1.5 py-0.5 rounded border flex-shrink-0
                        ${
                          isActive
                            ? 'text-teal-core border-teal-core/40 bg-teal-core/10'
                            : 'text-muted-ink border-border-mist bg-obsidian/40'
                        }
                      `}
                    >
                      PDF
                    </span>
                    <span className="font-body text-[10px] text-muted-ink truncate">
                      {formatFileSize(doc.size)}
                    </span>
                    <span className="font-body text-[10px] text-muted-ink/70 truncate hidden sm:inline">
                      · {formatUploadedAt(doc.uploadedAt)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  {isActive ? (
                    <CheckCircle2 className="w-4 h-4 text-teal-core" />
                  ) : (
                    <Clock className="w-4 h-4 text-muted-ink/40" />
                  )}
                  <button
                    type="button"
                    onClick={(e) => void handleDelete(e, doc.id, doc.name)}
                    disabled={isDeleting}
                    className="p-1 rounded-md text-muted-ink/50 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all"
                    aria-label={`Delete ${doc.name}`}
                  >
                    {isDeleting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {historyDocs.length > 0 && (
        <div className="px-2 sm:px-3 pb-2 flex-shrink-0">
          <div className="h-px bg-border-mist mb-3" />
          <p className="px-2 font-mono text-[10px] text-muted-ink uppercase tracking-widest mb-3">
            History
          </p>
          {historyDocs.map((doc) => (
            <button
              key={`history-${doc.id}`}
              type="button"
              onClick={() => selectDoc(doc.id)}
              className="group w-full max-w-full text-left min-w-0 px-3 py-2.5 rounded-lg flex items-center gap-2.5 text-muted-ink hover:text-soft-white hover:bg-white/5 transition-all duration-200"
            >
              <FileText className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="font-body text-xs truncate flex-1">{doc.name}</span>
              <span className="font-mono text-[9px] text-muted-ink/60 flex-shrink-0">
                {formatUploadedAt(doc.uploadedAt)}
              </span>
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="mx-2 sm:mx-3 mb-2 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="font-body text-[11px] text-red-200/90 flex-1 min-w-0 break-words">
            {error}
          </p>
          <button
            type="button"
            onClick={clearError}
            className="font-mono text-[10px] text-red-300/80 hover:text-red-200 flex-shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="px-2 sm:px-3 pb-4 sm:pb-5 pt-2 flex-shrink-0">
        <div
          className={`rounded-xl transition-all ${
            dragActive ? 'ring-2 ring-teal-core/60 ring-offset-2 ring-offset-deep-slate' : ''
          }`}
          onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragActive(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.currentTarget === e.target) setDragActive(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragActive(false);
            void processFile(e.dataTransfer.files?.[0]);
          }}
        >
          <label
            className={`
            group w-full max-w-full rounded-xl min-w-0
            border-2 border-dashed
            p-3 sm:p-4 flex flex-col
            items-center gap-2
            transition-all duration-300
            cursor-pointer
            ${
              uploadHover || dragActive
                ? 'border-teal-core/60 bg-teal-core/5 shadow-teal-glow'
                : 'border-border-mist bg-surface-dark/40 hover:border-teal-core/40'
            }
          `}
            onMouseEnter={() => setUploadHover(true)}
            onMouseLeave={() => setUploadHover(false)}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={handleUpload}
              disabled={isUploading}
            />

            <div
              className={`
              w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
              ${
                uploadHover || dragActive
                  ? 'bg-teal-core/20 border border-teal-core/40'
                  : 'bg-border-mist/50'
              }
            `}
            >
              <FilePlus
                className={`w-4 h-4 ${
                  uploadHover || dragActive ? 'text-teal-core' : 'text-muted-ink'
                }`}
              />
            </div>

            <div className="text-center min-w-0 px-1 w-full">
              <div
                className={`
                font-sans font-medium text-xs
                ${uploadHover || dragActive ? 'text-teal-core' : 'text-muted-ink'}
              `}
              >
                {isUploading
                  ? `Uploading… ${uploadProgress}%`
                  : dragActive
                    ? 'Drop PDF here'
                    : 'Upload Document'}
              </div>
              <div className="font-body text-[10px] text-muted-ink/60 mt-0.5 break-words">
                PDF · drag & drop or click
              </div>
              {isUploading && (
                <div className="mt-3 w-full">
                  <Progress value={uploadProgress} className="h-1.5 bg-border-mist" />
                </div>
              )}
            </div>

            <Upload
              className={`w-3 h-3 flex-shrink-0 ${
                uploadHover || dragActive ? 'text-teal-core' : 'text-muted-ink/40'
              }`}
            />
          </label>
        </div>
      </div>
    </aside>
  );
}
