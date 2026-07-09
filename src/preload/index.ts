// eslint-disable-next-line import/no-extraneous-dependencies
import { contextBridge, ipcRenderer } from 'electron';

import { IPC_CHANNELS, type ElectronAPI } from '../shared/types';

const electronAPI: ElectronAPI = {
  getAppVersion: () => ipcRenderer.invoke(IPC_CHANNELS.GET_APP_VERSION),
  checkForUpdates: () => ipcRenderer.invoke(IPC_CHANNELS.CHECK_FOR_UPDATES),
  installUpdate: () => ipcRenderer.invoke(IPC_CHANNELS.INSTALL_UPDATE),
  /**
   * Subscribe to update-status events pushed from the main process.
   * Returns a cleanup function; call it to remove the listener and prevent leaks.
   */
  onUpdateStatus: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, status: string) => callback(status);
    ipcRenderer.on(IPC_CHANNELS.UPDATE_STATUS, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.UPDATE_STATUS, handler);
  },
  onUpdateProgress: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, percent: number) => callback(percent);
    ipcRenderer.on(IPC_CHANNELS.UPDATE_PROGRESS, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.UPDATE_PROGRESS, handler);
  },
  getSessionId: () => ipcRenderer.invoke(IPC_CHANNELS.GET_SESSION_ID),
  storeSet: (key, value) => ipcRenderer.invoke(IPC_CHANNELS.STORE_SET, key, value),
  storeGet: (key) => ipcRenderer.invoke(IPC_CHANNELS.STORE_GET, key),
  storeDelete: (key) => ipcRenderer.invoke(IPC_CHANNELS.STORE_DELETE, key),
  'safeStorage:encrypt': (key, value) =>
    ipcRenderer.invoke(IPC_CHANNELS.SAFE_STORAGE_ENCRYPT, key, value),
  'safeStorage:decrypt': (key) => ipcRenderer.invoke(IPC_CHANNELS.SAFE_STORAGE_DECRYPT, key),
  'safeStorage:delete': (key) => ipcRenderer.invoke(IPC_CHANNELS.SAFE_STORAGE_DELETE, key),
  'auth:openOAuthWindow': () => ipcRenderer.invoke(IPC_CHANNELS.AUTH_OPEN_OAUTH),
  'auth:signOut': () => ipcRenderer.invoke(IPC_CHANNELS.AUTH_SIGN_OUT),
  'auth:switchAccount': () => ipcRenderer.invoke(IPC_CHANNELS.AUTH_SWITCH_ACCOUNT),
  'auth:getTokenClaims': () => ipcRenderer.invoke(IPC_CHANNELS.AUTH_GET_TOKEN_CLAIMS),
  'analysis:start': (config) => ipcRenderer.invoke(IPC_CHANNELS.ANALYSIS_START, config),
  'analysis:cancel': (id) => ipcRenderer.invoke(IPC_CHANNELS.ANALYSIS_CANCEL, id),
  'analysis:pause': (id) => ipcRenderer.invoke(IPC_CHANNELS.ANALYSIS_PAUSE, id),
  'analysis:resume': (id) => ipcRenderer.invoke(IPC_CHANNELS.ANALYSIS_RESUME, id),
  'analysis:getStatus': (id) => ipcRenderer.invoke(IPC_CHANNELS.ANALYSIS_GET_STATUS, id),
  'analysis:saveAutoSave': (payload) =>
    ipcRenderer.invoke(IPC_CHANNELS.ANALYSIS_SAVE_AUTO, payload),
  'analysis:loadAutoSave': () => ipcRenderer.invoke(IPC_CHANNELS.ANALYSIS_LOAD_AUTO_SAVE),
  'data:migrateGuestToAuth': (userId) => ipcRenderer.invoke(IPC_CHANNELS.DATA_MIGRATE, userId),
  'data:discardGuestData': () => ipcRenderer.invoke(IPC_CHANNELS.DATA_DISCARD_GUEST),
  'data:getStorageUsage': () => ipcRenderer.invoke(IPC_CHANNELS.DATA_GET_STORAGE),
  'data:clearOldData': () => ipcRenderer.invoke(IPC_CHANNELS.DATA_CLEAR_OLD),
  'fs:openDialog': (options) => ipcRenderer.invoke(IPC_CHANNELS.FS_OPEN_DIALOG, options),
  'fs:exportFile': (payload) => ipcRenderer.invoke(IPC_CHANNELS.FS_EXPORT_FILE, payload),
  'shell:openExternal': (url) => ipcRenderer.invoke(IPC_CHANNELS.SHELL_OPEN_EXTERNAL, url),
  'rag:buildKnowledgeBase': (analysisId) =>
    ipcRenderer.invoke(IPC_CHANNELS.RAG_BUILD_KB, analysisId),
  'rag:query': (question) => ipcRenderer.invoke(IPC_CHANNELS.RAG_QUERY, question),
  getEnv: () => ipcRenderer.invoke(IPC_CHANNELS.GET_ENV),
  ping: () => ipcRenderer.invoke(IPC_CHANNELS.PING),
};

contextBridge.exposeInMainWorld('api', electronAPI);
