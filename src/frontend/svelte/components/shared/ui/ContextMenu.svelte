<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { contextMenuStore, hideContextMenu } from '@/scripts/shared/contextMenuStore';
	import type { ContextMenuItem } from '@/scripts/shared/contextMenuStore';
	import Icon from './Icon.svelte';
	import { onMount } from 'svelte';

	let menuElement: HTMLDivElement | undefined = $state();
	let activeSubMenuIndex = $state<number | null>(null);

	let windowWidth = $state(1920);
	let windowHeight = $state(1080);

	function handleClickOutside(event: MouseEvent) {
		if (event.button === 2) return;
		
		if (menuElement && !menuElement.contains(event.target as Node)) {
			hideContextMenu();
		}
	}

	function handleItemClick(item: ContextMenuItem, event: MouseEvent) {
		if (item.disabled || item.divider) return;
		if (item.subMenu) return;
		
		event.stopPropagation();
		item.action?.();
		hideContextMenu();
	}

	onMount(() => {
		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	});

	let menuWidth = 220;
	let itemHeight = 36;
	
	let safeX = $derived(
		Math.min($contextMenuStore.x, Math.max(0, windowWidth - menuWidth - 10))
	);
	
	// approximate height
	let menuHeight = $derived($contextMenuStore.items.length * itemHeight + 16);
	let safeY = $derived(
		Math.min($contextMenuStore.y, Math.max(0, windowHeight - menuHeight - 10))
	);

	function handleMouseEnter(index: number, item: ContextMenuItem) {
		if (item.subMenu) {
			activeSubMenuIndex = index;
		} else {
			activeSubMenuIndex = null;
		}
	}
</script>

<svelte:window 
	bind:innerWidth={windowWidth} 
	bind:innerHeight={windowHeight} 
	oncontextmenu={(e) => {
		if ($contextMenuStore.visible) {
			e.preventDefault();
			hideContextMenu();
		}
	}} 
/>

{#if $contextMenuStore.visible}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div 
		class="context-menu" 
		bind:this={menuElement}
		style="left: {safeX}px; top: {safeY}px;"
		in:fly={{ y: 5, duration: 150 }}
		out:fade={{ duration: 100 }}
		oncontextmenu={(e) => e.preventDefault()}
	>
		{#each $contextMenuStore.items as item, index}
			{#if item.divider}
				<div class="divider"></div>
			{:else}
				<div 
					class="menu-item"
					class:danger={item.danger}
					class:disabled={item.disabled}
					class:has-submenu={!!item.subMenu}
					onclick={(e) => handleItemClick(item, e)}
					onmouseenter={() => handleMouseEnter(index, item)}
				>
					<div class="item-content">
						{#if item.icon}
							<Icon name={item.icon} size={16} />
						{:else}
							<div class="icon-placeholder"></div>
						{/if}
						<span class="label">{item.label}</span>
					</div>
					{#if item.subMenu}
						<Icon name="chevron_right" size={16} />
						{#if activeSubMenuIndex === index}
							<div class="sub-menu">
								{#each item.subMenu as subItem}
									{#if subItem.divider}
										<div class="divider"></div>
									{:else}
										<div 
											class="menu-item"
											class:danger={subItem.danger}
											class:disabled={subItem.disabled}
											onclick={(e) => handleItemClick(subItem, e)}
										>
											<div class="item-content">
												{#if subItem.icon}
													<Icon name={subItem.icon} size={16} />
												{:else}
													<div class="icon-placeholder"></div>
												{/if}
												<span class="label">{subItem.label}</span>
											</div>
										</div>
									{/if}
								{/each}
							</div>
						{/if}
					{/if}
				</div>
			{/if}
		{/each}
	</div>
{/if}

<style lang="scss">
	.context-menu, .sub-menu {
		position: fixed;
		z-index: 9999;
		background: color-mix(in srgb, var(--bg-modal), black 20%);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md, 8px);
		padding: 6px;
		width: 220px;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		display: flex;
		flex-direction: column;
		color: var(--text-color);
	}

	.sub-menu {
		position: absolute;
		left: 100%;
		top: -6px;
		margin-left: 2px;
	}

	.divider {
		height: 1px;
		background: rgba(255, 255, 255, 0.1);
		margin: 4px 0;
	}

	.menu-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 8px 10px;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.85rem;
		font-weight: 500;
		transition: background-color 0.1s ease, color 0.1s ease;
		position: relative;

		&:hover {
			background: var(--btn-primary-bg);
			color: var(--btn-primary-text, white);

			&.danger {
				background: var(--error-bg, #dc3545);
				color: white;
			}
		}

		&.disabled {
			opacity: 0.5;
			cursor: not-allowed;
			&:hover {
				background: transparent;
				color: var(--text-color);
			}
		}

		.item-content {
			display: flex;
			align-items: center;
			gap: 10px;
		}

		.icon-placeholder {
			width: 16px;
			height: 16px;
		}
	}
</style>
