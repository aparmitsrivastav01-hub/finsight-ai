import axios from 'axios';

import { useAuthStore } from '@/stores/authStore';
import { getResolvedApiBase } from '@/stores/settingsStore';

function authHeaders(): Record<string, string> {
  const token = useAuthStore.getState().accessToken;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export type AskResponse = { query: string; answer: string };

export async function askQuestion(query: string): Promise<AskResponse> {
  const base = getResolvedApiBase();
  const { data } = await axios.get<AskResponse>(`${base}/ask`, {
    params: { query },
    headers: authHeaders(),
  });
  return data;
}

export type FinDocumentDto = {
  id: string;
  name: string;
  size: number;
  uploadedAt: string;
  type: string;
};

export type FinancialHealth = {
  red_flags: number;
  green_flags: number;
  balance_sheet_health: number;
  audit_health: number;
  cashflow_health: number;
  debt_risk: number;
  summary: string[];
  company_name?: string | null;
  altman_z?: number;
  altman_zone?: string;
};

export type UploadResponse = {
  message: string;
  filename?: string;
  document?: FinDocumentDto;
  user_id?: number;
  health?: FinancialHealth;
};

export type DocumentsListResponse = { documents: FinDocumentDto[] };

export async function uploadPDF(
  file: File,
  opts?: { onProgress?: (percent: number) => void }
): Promise<UploadResponse> {
  const base = getResolvedApiBase();
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await axios.post<UploadResponse>(`${base}/upload`, formData, {
    headers: {
      ...authHeaders(),
    },
    onUploadProgress: (evt) => {
      if (!evt.total || !opts?.onProgress) return;
      opts.onProgress(Math.round((evt.loaded * 100) / evt.total));
    },
  });
  return data;
}

export async function fetchDocuments(): Promise<FinDocumentDto[]> {
  const base = getResolvedApiBase();
  const { data } = await axios.get<DocumentsListResponse>(`${base}/documents`, {
    headers: authHeaders(),
  });
  return data.documents ?? [];
}

export async function deleteDocument(documentId: string): Promise<void> {
  const base = getResolvedApiBase();
  const encoded = encodeURIComponent(documentId);
  await axios.delete(`${base}/documents/${encoded}`, {
    headers: authHeaders(),
  });
}

export type AnalysisType = 'investment' | 'risk' | 'analysis';

export type HistoryItem = {
  id: number;
  company_name: string;
  query: string;
  analysis_type: AnalysisType;
  response_summary: string;
  document_id: string | null;
  created_at: string;
};

export type HistoryListResponse = {
  items: HistoryItem[];
  total: number;
  page: number;
  page_size: number;
};

export async function fetchFinancialHealth(): Promise<FinancialHealth> {
  const base = getResolvedApiBase();
  const { data } = await axios.get<FinancialHealth>(`${base}/analysis/health`, {
    headers: authHeaders(),
  });
  return data;
}

export async function fetchHistory(params: {
  page?: number;
  page_size?: number;
  search?: string;
  company?: string;
  analysis_type?: string;
}): Promise<HistoryListResponse> {
  const base = getResolvedApiBase();
  const { data } = await axios.get<HistoryListResponse>(`${base}/history`, {
    params,
    headers: authHeaders(),
  });
  return data;
}

export async function createHistoryEntry(payload: {
  company_name: string;
  query: string;
  analysis_type?: AnalysisType;
  response_summary?: string;
  document_id?: string | null;
}): Promise<HistoryItem> {
  const base = getResolvedApiBase();
  const { data } = await axios.post<HistoryItem>(`${base}/history`, payload, {
    headers: authHeaders(),
  });
  return data;
}

export async function deleteHistoryEntry(id: number): Promise<void> {
  const base = getResolvedApiBase();
  await axios.delete(`${base}/history/${id}`, {
    headers: authHeaders(),
  });
}

export { getResolvedApiBase };

/** Public health check (no auth). */
export async function fetchHealth(): Promise<boolean> {
  try {
    const { data } = await axios.get<{ status?: string }>(`${getResolvedApiBase()}/health`, {
      timeout: 6000,
    });
    return data?.status === 'ok';
  } catch {
    return false;
  }
}
