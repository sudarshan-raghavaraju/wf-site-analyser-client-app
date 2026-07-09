// Auto-update integration point — activate fully in Epic 02.
//
// To activate:
//   1. Set a publish provider in electron-builder.yml (GitHub, S3, etc.)
//   2. Import autoUpdater from 'electron-updater' and call checkForUpdatesAndNotify()
//   3. Wire update events to IPC channels so the renderer can surface update UI
//
// The electron-updater package is already declared in dependencies — no install needed.

export function initAutoUpdater(): void {
  // TODO(Epic 02): uncomment and implement once publish config is in place.
  // const { autoUpdater } = await import('electron-updater');
  // autoUpdater.checkForUpdatesAndNotify();
}
