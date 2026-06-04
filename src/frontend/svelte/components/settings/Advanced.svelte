<script lang="ts">
	import Button from '@/components/shared/ui/Button.svelte';
	import CopyableCode from '@/components/shared/ui/CopyableCode.svelte';
	import Icon from '@/components/shared/ui/Icon.svelte';
	import Input from '@/components/shared/ui/Input.svelte';
	import SettingItem from '@/components/shared/ui/SettingItem.svelte';
	import Toggle from '@/components/shared/ui/Toggle.svelte';
	import { saveSettings, settingsStore } from '@/scripts/settings/settings';

	async function handleRestart() {
		if (
			confirm(
				'Changing Wayland support requires a restart. Do you want to restart now?'
			)
		) {
			if ($settingsStore) {
				await saveSettings($settingsStore);
				window.electronAPI.restartUI();
			}
		}
	}
</script>

{#if $settingsStore}
	<SettingItem
		label="Use Native Wayland"
		id="nativeWayland"
		description="Run the GUI with native Wayland support (requires restart)."
	>
		<Toggle
			id="nativeWayland"
			bind:checked={$settingsStore.nativeWayland}
			onChange={handleRestart}
		/>
	</SettingItem>

	<SettingItem label="Enable Custom Arguments" id="customArgsEnabled">
		<Toggle
			id="customArgsEnabled"
			bind:checked={$settingsStore.customArgsEnabled}
		/>
	</SettingItem>

	{#if $settingsStore.customArgsEnabled}
		<SettingItem
			label="Custom Command Args"
			id="customArgs"
			vertical
			description="Pass raw arguments to the backend."
		>
			<Input
				type="text"
				id="customArgs"
				bind:value={$settingsStore.customArgs}
				placeholder="e.g. --window 0x0x1920x1080"
			/>
			<div class="doc-actions">
				<Button
					variant="ghost"
					on:click={() =>
						window.electronAPI.openExternal(
							'https://github.com/Almamu/linux-wallpaperengine?tab=readme-ov-file#-common-options'
						)}
				>
					<Icon name="open_in_new" size={14} />
					<span>Common Options Documentation</span>
				</Button>
			</div>
		</SettingItem>
	{/if}

	<!-- Hooks: add more hook items below as needed -->
	<SettingItem label="Hooks" id="hookEnabled" description="Enable hooks.">
		<Toggle id="hookEnabled" bind:checked={$settingsStore.hookEnabled} />
	</SettingItem>

	{#if $settingsStore.hookEnabled}
		<SettingItem
			label="On wallpaper change"
			id="wallpaperChangeCommand"
			vertical
			description="Shell command to execute when a wallpaper is applied."
		>
			<div class="table-container">
				<table class="variable-table">
					<thead>
						<tr>
							<th>Variable</th>
							<th>Description</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>
								<CopyableCode code="$PREVIEW_PATH" />
							</td>
							<td>Absolute path to the wallpaper's preview image.</td>
						</tr>
						<tr>
							<td>
								<CopyableCode code="$VIDEO_PATH" />
							</td>
							<td>Absolute path to the main media file (video/html).</td>
						</tr>
						<tr>
							<td>
								<CopyableCode code="$IS_VIDEO" />
							</td>
							<td>Boolean indicating if wallpaper is video.</td>
						</tr>
						<tr>
							<td>
								<CopyableCode code="$WALLPAPER_TITLE" />
							</td>
							<td>Display name or title of the wallpaper.</td>
						</tr>
						<tr>
							<td>
								<CopyableCode code="$WALLPAPER_TYPE" />
							</td>
							<td>Type of the wallpaper (video, web, scene).</td>
						</tr>
						<tr>
							<td>
								<CopyableCode code="$WALLPAPER_ID" />
							</td>
							<td>Unique Steam Workshop ID.</td>
						</tr>
						<tr>
							<td>
								<CopyableCode code="$SCREEN_NAME" />
							</td>
							<td>Monitor/screen name (e.g., DP-1).</td>
						</tr>
					</tbody>
				</table>
			</div>
			<Input
				id="wallpaperChangeCommand"
				bind:value={$settingsStore.wallpaperChangeCommand}
				placeholder="e.g. matugen image '$PREVIEW_PATH' -j"
			/>
		</SettingItem>
	{/if}
{/if}

<style lang="scss">
	.table-container {
		width: 100%;
		overflow-x: auto;
		margin-bottom: 12px;
		border-radius: var(--radius-md);
		border: 1px solid var(--border-color);
	}

	.variable-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.85em;

		th,
		td {
			padding: 10px 14px;
			text-align: left;
			border-bottom: 1px solid var(--border-color);
		}

		th {
			font-weight: 600;
			color: var(--text-color);
		}

		tr:last-child td {
			border-bottom: none;
		}
	}
</style>
