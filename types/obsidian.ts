export interface VaultItem {
  name: string;
  path: string; // Full relative path from vault root
  type: 'file' | 'directory';
  extension: string | null;
  modified_time: string | null; // ISO 8601
  size: number | null; // bytes
}

export interface VaultBrowseResponse {
  path: string; // The subpath requested
  items: VaultItem[];
  error: string | null; // Error message from backend
} 