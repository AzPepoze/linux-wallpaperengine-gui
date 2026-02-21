<script lang="ts">
	import Input from '../ui/Input.svelte';
	import Select from '../ui/Select.svelte';
	import Button from '../ui/Button.svelte';
	import { settingsStore } from '../../scripts/settings';
	import type { Playlist } from '../../../shared/types';

	export let playlistOptions: { value: string; label: string }[] = [];
	export let activePlaylist: Playlist | null = null;
	export let tempInterval: number = 0;
	export let isCreating: boolean = false;
	export let isRenaming: boolean = false;
	export let newPlaylistName: string = '';

	export let onCreate: () => void;
	export let onRename: () => void;
	export let onDelete: () => void;
	export let onCancel: () => void;
	export let onChange: () => void;
	export let onIntervalInput: () => void;
	export let startCreating: () => void;
	export let startRenaming: () => void;
</script>

<div class="panel left-panel">
	<div class="header">Playlist Settings</div>

	{#if isCreating || isRenaming}
		<div class="form-group">
			<Input
				bind:value={newPlaylistName}
				placeholder="Playlist Name"
				autoFocus
			/>
			<div class="actions">
				<Button
					variant="primary"
					on:click={isCreating ? onCreate : onRename}
					>Save</Button
				>
				<Button on:click={onCancel}>Cancel</Button>
			</div>
		</div>
	{:else}
		<div class="dropdown-row">
			{#if $settingsStore}
				<Select
					id="playlist-select"
					bind:value={$settingsStore.playlist}
					options={playlistOptions}
					onChange={onChange}
				/>
			{/if}
		</div>
		<div class="controls-row">
			<Button variant="secondary" on:click={startCreating}>New</Button>
			{#if activePlaylist}
				<Button variant="secondary" on:click={startRenaming}
					>Rename</Button
				>
				<Button variant="danger" on:click={onDelete}>Delete</Button>
			{/if}
		</div>

		{#if activePlaylist}
			<div class="interval-row">
				<span class="label">Interval (min):</span>
				<Input
					type="number"
					step="any"
					min={0}
					bind:value={tempInterval}
					on:input={onIntervalInput}
					style="width: 80px;"
				/>
			</div>
		{/if}
	{/if}
</div>

<style lang="scss">
	.panel {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.header {
		font-weight: 600;
		color: var(--text-color);
		font-size: 1.1em;
		border-bottom: 1px solid var(--border-color);
		padding-bottom: 8px;
		margin-bottom: 4px;
	}

	.left-panel {
		flex: 0 0 300px;
		border-right: 1px solid var(--border-color);
		padding-right: 20px;

		.form-group {
			display: flex;
			flex-direction: column;
			gap: 10px;
			.actions {
				display: flex;
				gap: 10px;
			}
		}

		.controls-row {
			display: flex;
			gap: 8px;
		}

		.interval-row {
			display: flex;
			align-items: center;
			gap: 10px;
			margin-top: auto;
			.label {
				color: var(--text-muted);
			}
		}
	}
</style>
