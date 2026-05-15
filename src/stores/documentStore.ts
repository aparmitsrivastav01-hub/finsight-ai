import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { deleteDocument, fetchDocuments, uploadPDF } from '@/lib/api';

export type FinDocument = {
  id: string;
  name: string;
  size: number;
  uploadedAt: string;
  type: string;
};

type DocumentState = {
  documents: FinDocument[];
  activeDocumentId: string | null;
  isLoading: boolean;
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
  setActiveDocument: (id: string | null) => void;
  fetchDocuments: () => Promise<void>;
  uploadDocument: (file: File) => Promise<void>;
  removeDocument: (id: string) => Promise<void>;
  clearError: () => void;
};

function mergeDocuments(local: FinDocument[], remote: FinDocument[]): FinDocument[] {
  const map = new Map<string, FinDocument>();
  for (const doc of local) map.set(doc.id, doc);
  for (const doc of remote) map.set(doc.id, doc);
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );
}

export const useDocumentStore = create<DocumentState>()(
  persist(
    (set, get) => ({
      documents: [],
      activeDocumentId: null,
      isLoading: false,
      isUploading: false,
      uploadProgress: 0,
      error: null,

      setActiveDocument: (id) => set({ activeDocumentId: id }),

      clearError: () => set({ error: null }),

      fetchDocuments: async () => {
        set({ isLoading: true, error: null });
        try {
          const remote = await fetchDocuments();
          set((state) => {
            const documents = mergeDocuments(state.documents, remote);
            const activeStillExists =
              state.activeDocumentId &&
              documents.some((d) => d.id === state.activeDocumentId);
            return {
              documents,
              activeDocumentId: activeStillExists
                ? state.activeDocumentId
                : documents[0]?.id ?? null,
              isLoading: false,
            };
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Failed to load documents';
          set({ isLoading: false, error: msg });
        }
      },

      uploadDocument: async (file) => {
        set({ isUploading: true, uploadProgress: 0, error: null });
        try {
          const res = await uploadPDF(file, {
            onProgress: (pct) => set({ uploadProgress: pct }),
          });
          const doc: FinDocument =
            res.document ?? {
              id: res.filename ?? file.name,
              name: res.filename ?? file.name,
              size: file.size,
              uploadedAt: new Date().toISOString(),
              type: file.type || 'application/pdf',
            };

          set((state) => ({
            documents: mergeDocuments([doc], state.documents),
            activeDocumentId: doc.id,
            isUploading: false,
            uploadProgress: 0,
          }));

          await get().fetchDocuments();
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Upload failed';
          set({ isUploading: false, uploadProgress: 0, error: msg });
          throw err;
        }
      },

      removeDocument: async (id) => {
        set({ error: null });
        try {
          await deleteDocument(id);
          set((state) => {
            const documents = state.documents.filter((d) => d.id !== id);
            const activeDocumentId =
              state.activeDocumentId === id
                ? documents[0]?.id ?? null
                : state.activeDocumentId;
            return { documents, activeDocumentId };
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Delete failed';
          set({ error: msg });
          throw err;
        }
      },
    }),
    {
      name: 'finsight-documents',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        documents: s.documents,
        activeDocumentId: s.activeDocumentId,
      }),
    }
  )
);

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatUploadedAt(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function selectActiveDocument(state: DocumentState): FinDocument | null {
  if (!state.activeDocumentId) return null;
  return state.documents.find((d) => d.id === state.activeDocumentId) ?? null;
}
