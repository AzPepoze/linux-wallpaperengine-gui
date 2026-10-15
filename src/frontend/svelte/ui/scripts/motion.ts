import { get } from 'svelte/store';
import { settingsStore } from '@/features/settings/scripts/settings';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

// Returns 0 when motion is off (performance mode or reduced motion), otherwise ms.
export function motionMs(ms: number): number {
	const performanceMode = !!get(settingsStore)?.performanceMode;
	const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY).matches;
	return performanceMode || reducedMotion ? 0 : ms;
}
