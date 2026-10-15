import { showToast } from '@/core/toastStore';
import { logger } from '@/core/logger';

// openPath resolves with an error message, or an empty string on success.
export async function openFolderPath(folderPath: string) {
	const error = await window.electronAPI.openPath(folderPath);
	if (error) {
		logger.error('Failed to open folder:', error);
		showToast(`Failed to open folder: ${error}`, 'error');
	}
}
