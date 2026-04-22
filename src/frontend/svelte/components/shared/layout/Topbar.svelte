<script lang="ts">
	import Icon from '@/components/shared/ui/Icon.svelte';
	import { activeView } from '@/scripts/shared/ui';
	import { onMount, tick } from 'svelte';
	import steamIcon from '@/components/shared/icons/steam.png';

	// ── Types ────────────────────────────────────────────────────────────────
	type View = 'wallpapers' | 'workshop' | 'logs' | 'settings';

	const VIEWS: View[] = ['wallpapers', 'workshop', 'logs', 'settings'];

	const NAV_ITEMS: { view: View; icon: string; label: string }[] = [
		{ view: 'wallpapers', icon: 'home', label: 'Home' },
		{ view: 'workshop', icon: 'storefront', label: 'Workshop' },
		{ view: 'logs', icon: 'history', label: 'Logs' },
		{ view: 'settings', icon: 'settings', label: 'Settings' }
	];

	// ── Steam status ─────────────────────────────────────────────────────────
	let steamRunning = false;

	onMount(() => {
		async function checkSteam() {
			steamRunning = await window.electronAPI.isSteamRunning();
		}
		checkSteam();
		const id = setInterval(checkSteam, 5000);
		return () => clearInterval(id);
	});

	let buttonEls: (HTMLElement | null)[] = VIEWS.map(() => null);
	let indicatorLeft = 6;
	let indicatorWidth = 44;

	async function setView(view: View) {
		activeView.set(view);
		await tick();
		syncIndicator();
	}

	function syncIndicator() {
		const idx = VIEWS.indexOf($activeView as View);
		const btn = buttonEls[idx];
		const container = btn?.closest(
			'.capsule-container'
		) as HTMLElement | null;
		if (!btn || !container) return;

		const cRect = container.getBoundingClientRect();
		const bRect = btn.getBoundingClientRect();

		indicatorLeft = bRect.left - cRect.left;
		indicatorWidth = 44;
	}

	onMount(() => {
		syncIndicator();
	});

	$: $activeView,
		(async () => {
			await tick();
			syncIndicator();
		})();
</script>

<div class="topbar">
	<div class="steam-status" class:connected={steamRunning}>
		<img src={steamIcon} alt="Steam" class="steam-icon" />
		<span>{steamRunning ? 'Connected' : 'Disconnected'}</span>
	</div>

	<nav
		class="capsule-container"
		style="--ind-left: {indicatorLeft}px; --ind-width: {indicatorWidth}px;"
	>
		{#each NAV_ITEMS as { view, icon, label }, i}
			<button
				class="capsule-button"
				class:active={$activeView === view}
				title={label}
				bind:this={buttonEls[i]}
				on:click={() => setView(view)}
			>
				<Icon name={icon} size={20} />
			</button>
		{/each}
	</nav>
</div>

<style lang="scss">
	.topbar {
		position: relative;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 8px 20px;
		width: 100%;
		box-sizing: border-box;
		flex-shrink: 0;
		min-height: 60px;
		border-radius: 0 0 var(--radius-lg) var(--radius-lg);
	}

	.steam-status {
		position: absolute;
		left: 20px;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 6px 12px;
		border-radius: var(--radius-md);
		font-size: 0.85em;
		color: var(--text-color);

		.steam-icon {
			width: 18px;
			height: 18px;
			filter: invert(1) drop-shadow(0 0 4px var(--error-bg));
			transition: filter 0.3s ease;
		}

		&.connected .steam-icon {
			filter: invert(1) drop-shadow(0 0 4px var(--success-bg));
		}
	}

	.capsule-container {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0;
		padding: 6px;
		border-radius: var(--radius-lg);

		&::before {
			content: '';
			position: absolute;
			top: 6px;
			left: var(--ind-left, 6px);
			width: var(--ind-width, 44px);
			height: calc(100% - 12px);
			border-radius: var(--radius-md);
			background-color: var(--btn-primary-bg);
			transition:
				left 0.32s cubic-bezier(0.34, 1.56, 0.64, 1),
				width 0.32s cubic-bezier(0.34, 1.56, 0.64, 1);
			pointer-events: none;
			z-index: 0;
			outline: color-mix(in srgb, var(--btn-primary-bg), white 50%)
				solid 1px;
		}
	}

	.capsule-button {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 8px 12px;
		border: none;
		border-radius: var(--radius-md);
		background: transparent;
		cursor: pointer;
		font-size: 0.9em;
		white-space: nowrap;
		transition: all 0.2s ease;
		min-width: 40px;
		height: 36px;
		opacity: 0.8;

		&:hover,
		&.active {
			opacity: 1;
		}
	}

	@keyframes label-in {
		from {
			opacity: 0;
			transform: translateX(-4px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}
</style>
