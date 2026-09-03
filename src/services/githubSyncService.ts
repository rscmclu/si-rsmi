import { dataStorage } from './dataStorage';
import { GitHubSyncConfig, GitHubSyncLog } from '../types/inventory';

// In-memory debounce timer for real-time auto-sync
let autoPushTimer: any = null;
let isCurrentlySyncing = false;

/**
 * Encode string to UTF-8 base64 safely supporting Unicode, Indonesian accents, and emojis
 */
function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Decode UTF-8 base64 string safely
 */
function base64ToUtf8(base64: string): string {
  const cleanBase64 = base64.replace(/\s/g, '');
  const binary = atob(cleanBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

function broadcastSyncStatus(config: GitHubSyncConfig) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('simbars:github-sync-status', {
        detail: config,
      })
    );
  }
}

export const githubSyncService = {
  /**
   * Test connection to GitHub repository and verify Personal Access Token
   */
  testConnection: async (config: GitHubSyncConfig): Promise<{
    success: boolean;
    message: string;
    repoInfo?: {
      fullName: string;
      isPrivate: boolean;
      defaultBranch: string;
      canPush: boolean;
      fileExists: boolean;
      fileSha?: string;
    };
  }> => {
    const owner = config.owner?.trim();
    const repo = config.repo?.trim();
    const token = config.personalAccessToken?.trim();

    if (!owner || !repo) {
      return {
        success: false,
        message: 'Owner (Username/Organisasi) dan Nama Repositori GitHub wajib diisi.',
      };
    }

    if (!token) {
      return {
        success: false,
        message: 'Personal Access Token (PAT) GitHub wajib diisi untuk melakukan sinkronisasi otomatis.',
      };
    }

    try {
      const headers: Record<string, string> = {
        Accept: 'application/vnd.github.v3+json',
        Authorization: `Bearer ${token}`,
      };

      // 1. Check repository access
      const repoUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
      const repoRes = await fetch(repoUrl, { method: 'GET', headers });

      if (repoRes.status === 401) {
        return {
          success: false,
          message: 'Token GitHub tidak valid atau sudah kedaluwarsa (401 Unauthorized). Silakan buat token baru dengan izin "repo" atau "contents:write".',
        };
      }

      if (repoRes.status === 404) {
        return {
          success: false,
          message: `Repositori "${owner}/${repo}" tidak ditemukan (404 Not Found). Periksa kembali username/owner dan nama repositori Anda.`,
        };
      }

      if (!repoRes.ok) {
        const errText = await repoRes.text();
        return {
          success: false,
          message: `Gagal mengakses repositori (${repoRes.status}): ${errText}`,
        };
      }

      const repoData = await repoRes.json();
      const canPush = Boolean(repoData.permissions?.push || repoData.permissions?.admin);

      // 2. Check if the database JSON file already exists on the target branch
      const branch = config.branch?.trim() || repoData.default_branch || 'main';
      const cleanPath = (config.filePath || 'data/simbars-database.json').replace(/^\/+/, '');
      const fileUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${cleanPath}?ref=${encodeURIComponent(branch)}`;

      let fileExists = false;
      let fileSha: string | undefined;

      try {
        const fileRes = await fetch(fileUrl, { method: 'GET', headers });
        if (fileRes.ok) {
          const fileData = await fileRes.json();
          fileExists = true;
          fileSha = fileData.sha;
        }
      } catch {
        // File doesn't exist yet, which is normal for first sync
      }

      return {
        success: true,
        message: `Terhubung ke repositori "${repoData.full_name}" (${repoData.private ? 'Private' : 'Public'})! Branch: ${branch}. Akses commit: ${canPush ? 'Diizinkan' : 'Terbatas'}.`,
        repoInfo: {
          fullName: repoData.full_name,
          isPrivate: repoData.private,
          defaultBranch: repoData.default_branch,
          canPush,
          fileExists,
          fileSha,
        },
      };
    } catch (err: any) {
      console.error('Error testing GitHub connection:', err);
      return {
        success: false,
        message: `Koneksi ke GitHub gagal: ${err.message || 'Periksa koneksi internet Anda.'}`,
      };
    }
  },

  /**
   * Get the current file SHA from GitHub repository (needed to update without conflict)
   */
  getFileSha: async (config: GitHubSyncConfig): Promise<string | null> => {
    const owner = config.owner?.trim();
    const repo = config.repo?.trim();
    const token = config.personalAccessToken?.trim();
    const branch = config.branch?.trim() || 'main';
    const cleanPath = (config.filePath || 'data/simbars-database.json').replace(/^\/+/, '');

    if (!owner || !repo || !token) return null;

    try {
      const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${cleanPath}?ref=${encodeURIComponent(branch)}`;
      const res = await fetch(url, {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        return data.sha || null;
      }
      return null;
    } catch (err) {
      console.warn('Could not fetch file SHA from GitHub:', err);
      return null;
    }
  },

  /**
   * Push current SIMBARS database to GitHub repository
   */
  pushToGitHub: async (
    config: GitHubSyncConfig,
    options?: {
      isAutoSync?: boolean;
      changedKey?: string;
      customMessage?: string;
    }
  ): Promise<{
    success: boolean;
    message: string;
    commitSha?: string;
    commitUrl?: string;
    totalRecords?: number;
  }> => {
    if (isCurrentlySyncing) {
      return {
        success: false,
        message: 'Sinkronisasi lain sedang berlangsung. Mohon tunggu sejenak.',
      };
    }

    const owner = config.owner?.trim();
    const repo = config.repo?.trim();
    const token = config.personalAccessToken?.trim();
    const branch = config.branch?.trim() || 'main';
    const cleanPath = (config.filePath || 'data/simbars-database.json').replace(/^\/+/, '');

    if (!owner || !repo || !token) {
      return {
        success: false,
        message: 'Konfigurasi GitHub belum lengkap (Owner, Repo, atau Personal Access Token kosong).',
      };
    }

    isCurrentlySyncing = true;

    // Update status to syncing
    const syncingConfig: GitHubSyncConfig = {
      ...config,
      lastSyncStatus: 'syncing',
      lastSyncMessage: 'Sedang mengirim data ke GitHub...',
    };
    broadcastSyncStatus(syncingConfig);

    try {
      // 1. Generate full database snapshot
      const snapshot = dataStorage.exportFullDatabaseJson(true);
      const jsonString = JSON.stringify(snapshot, null, 2);
      const base64Content = utf8ToBase64(jsonString);

      // 2. Fetch current file SHA if already exists on GitHub
      const existingSha = await githubSyncService.getFileSha(config);

      // 3. Prepare descriptive commit message
      const timestampStr = new Date().toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
        dateStyle: 'short',
        timeStyle: 'medium',
      });
      const triggerLabel = options?.isAutoSync
        ? `[Auto-Sync Real-time${options.changedKey ? `: ${options.changedKey}` : ''}]`
        : '[Manual Sync]';
      const commitMessage =
        options?.customMessage ||
        `${triggerLabel} Update database SIMBARS - ${snapshot._metadata?.stats?.totalInventaris || 0} Aset (${timestampStr})`;

      // 4. Send PUT request to GitHub Contents API
      const putUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${cleanPath}`;
      const payload: any = {
        message: commitMessage,
        content: base64Content,
        branch: branch,
      };
      if (existingSha) {
        payload.sha = existingSha;
      }

      const res = await fetch(putUrl, {
        method: 'PUT',
        headers: {
          Accept: 'application/vnd.github.v3+json',
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errMsg =
          errorData.message || `HTTP ${res.status}: Gagal menyimpan file ke GitHub.`;
        throw new Error(errMsg);
      }

      const resData = await res.json();
      const commitSha = resData.commit?.sha?.substring(0, 7) || 'HEAD';
      const commitUrl = resData.commit?.html_url || `https://github.com/${owner}/${repo}/commit/${commitSha}`;
      const totalRecords = snapshot._metadata?.stats?.totalInventaris || 0;

      // 5. Create audit sync log
      const newLog: GitHubSyncLog = {
        id: `GHLOG-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: options?.isAutoSync ? 'auto' : 'push',
        status: 'success',
        message: `Berhasil sinkron ke GitHub branch "${branch}" (${commitSha})`,
        commitSha,
        commitUrl,
        itemsCount: totalRecords,
        changedKeys: options?.changedKey ? [options.changedKey] : undefined,
      };

      const existingLogs = config.syncLogs || [];
      const updatedLogs = [newLog, ...existingLogs.slice(0, 49)];

      const updatedConfig: GitHubSyncConfig = {
        ...config,
        lastSyncTime: new Date().toISOString(),
        lastSyncStatus: 'success',
        lastSyncMessage: `Sinkronisasi sukses! Commit: ${commitSha}`,
        lastCommitSha: commitSha,
        lastCommitUrl: commitUrl,
        syncLogs: updatedLogs,
      };

      dataStorage.saveGitHubConfig(updatedConfig);
      broadcastSyncStatus(updatedConfig);

      return {
        success: true,
        message: `Database berhasil disinkronkan ke GitHub (Commit: ${commitSha})! File tersimpan di: ${cleanPath}`,
        commitSha,
        commitUrl,
        totalRecords,
      };
    } catch (err: any) {
      console.error('Error pushing to GitHub:', err);
      const errMsg = err.message || 'Terjadi kesalahan saat sinkronisasi ke GitHub.';

      const failedLog: GitHubSyncLog = {
        id: `GHLOG-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: options?.isAutoSync ? 'auto' : 'push',
        status: 'error',
        message: errMsg,
      };

      const existingLogs = config.syncLogs || [];
      const updatedLogs = [failedLog, ...existingLogs.slice(0, 49)];

      const failedConfig: GitHubSyncConfig = {
        ...config,
        lastSyncTime: new Date().toISOString(),
        lastSyncStatus: 'error',
        lastSyncMessage: errMsg,
        syncLogs: updatedLogs,
      };

      dataStorage.saveGitHubConfig(failedConfig);
      broadcastSyncStatus(failedConfig);

      return {
        success: false,
        message: `Gagal sinkron ke GitHub: ${errMsg}`,
      };
    } finally {
      isCurrentlySyncing = false;
    }
  },

  /**
   * Pull and restore database from GitHub repository
   */
  pullFromGitHub: async (
    config: GitHubSyncConfig
  ): Promise<{
    success: boolean;
    message: string;
    summary?: any;
  }> => {
    const owner = config.owner?.trim();
    const repo = config.repo?.trim();
    const token = config.personalAccessToken?.trim();
    const branch = config.branch?.trim() || 'main';
    const cleanPath = (config.filePath || 'data/simbars-database.json').replace(/^\/+/, '');

    if (!owner || !repo || !token) {
      return {
        success: false,
        message: 'Konfigurasi GitHub belum lengkap (Owner, Repo, atau Personal Access Token kosong).',
      };
    }

    try {
      const getUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${cleanPath}?ref=${encodeURIComponent(branch)}`;
      const res = await fetch(getUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/vnd.github.v3+json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        if (res.status === 404) {
          return {
            success: false,
            message: `File database "${cleanPath}" belum ada di repositori GitHub "${owner}/${repo}" pada branch "${branch}". Silakan lakukan Push terlebih dahulu.`,
          };
        }
        const errorText = await res.text();
        return {
          success: false,
          message: `Gagal mengambil data dari GitHub (${res.status}): ${errorText}`,
        };
      }

      const fileData = await res.json();
      if (!fileData.content) {
        return {
          success: false,
          message: 'Konten file database dari GitHub kosong.',
        };
      }

      // Decode base64 to UTF-8 JSON
      const jsonText = base64ToUtf8(fileData.content);
      const parsedJson = JSON.parse(jsonText);

      // Restore into dataStorage
      const restoreResult = dataStorage.importFullDatabaseJson(parsedJson);

      if (!restoreResult.success) {
        return {
          success: false,
          message: restoreResult.message || 'Gagal memulihkan format data dari GitHub.',
        };
      }

      // Log success
      const newLog: GitHubSyncLog = {
        id: `GHLOG-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'pull',
        status: 'success',
        message: `Berhasil memuat data dari GitHub (${fileData.sha?.substring(0, 7) || 'latest'})`,
        commitSha: fileData.sha?.substring(0, 7),
        itemsCount: restoreResult.summary?.totalRecords,
      };

      const existingLogs = config.syncLogs || [];
      const updatedLogs = [newLog, ...existingLogs.slice(0, 49)];

      const updatedConfig: GitHubSyncConfig = {
        ...config,
        lastSyncTime: new Date().toISOString(),
        lastSyncStatus: 'success',
        lastSyncMessage: `Data berhasil ditarik dari GitHub! Total ${restoreResult.summary?.totalRecords || 0} data dipulihkan.`,
        syncLogs: updatedLogs,
      };

      dataStorage.saveGitHubConfig(updatedConfig);
      broadcastSyncStatus(updatedConfig);

      return {
        success: true,
        message: `Berhasil menarik dan memulihkan ${restoreResult.summary?.totalRecords || 0} data dari GitHub!`,
        summary: restoreResult.summary,
      };
    } catch (err: any) {
      console.error('Error pulling from GitHub:', err);
      return {
        success: false,
        message: `Gagal memuat database dari GitHub: ${err.message || 'Format data JSON tidak valid.'}`,
      };
    }
  },

  /**
   * Debounced Auto-Push on Real-time Data Changes
   */
  triggerAutoPush: (config: GitHubSyncConfig, debounceMs = 3000, changedKey?: string) => {
    if (!config.autoSyncEnabled || !config.autoSyncOnChange) return;
    if (!config.owner || !config.repo || !config.personalAccessToken) return;

    if (autoPushTimer) {
      clearTimeout(autoPushTimer);
    }

    // Set preview indicator to syncing after short delay
    autoPushTimer = setTimeout(async () => {
      const currentCfg = dataStorage.getGitHubConfig();
      if (
        currentCfg.autoSyncEnabled &&
        currentCfg.autoSyncOnChange &&
        currentCfg.personalAccessToken &&
        currentCfg.owner &&
        currentCfg.repo
      ) {
        await githubSyncService.pushToGitHub(currentCfg, {
          isAutoSync: true,
          changedKey,
        });
      }
    }, debounceMs);
  },
};
