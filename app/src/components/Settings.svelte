<script lang="ts">
	import { onMount } from "svelte";
	import { clearAllWallpapers, getConfig, openConfigInEditor, saveConfig } from "../core/wallpaperManager";

	let fps: number = 60;
	let silence: boolean = false;
	let message: string | null = null;
	let messageType: "success" | "error" | null = null;

	onMount(async () => {
		try {
			const config = await getConfig();
			if (config.success) {
				fps = config.FPS || 60;
				silence = config.SILENCE || false;
			} else {
				message = `Error loading config: ${config.error}`;
				messageType = "error";
			}
		} catch (e) {
			message = `Error loading config: ${e instanceof Error ? e.message : String(e)}`;
			messageType = "error";
		}
	});

	const saveSettings = async () => {
		try {
			const result = await saveConfig({
				FPS: fps,
				SILENCE: silence,
			});
			if (result.success) {
				message = "Settings saved successfully!";
				messageType = "success";
			} else {
				message = `Error saving settings: ${result.error}`;
				messageType = "error";
			}
		} catch (e) {
			message = `Error saving settings: ${e instanceof Error ? e.message : String(e)}`;
			messageType = "error";
		}
	};

	const openConfig = async () => {
		try {
			const result = await openConfigInEditor();
			if (result.success) {
				message = "Config file opened!";
				messageType = "success";
			} else {
				message = `Failed to open config file: ${result.error}`;
				messageType = "error";
			}
		} catch (e) {
			message = `Failed to open config file: ${e instanceof Error ? e.message : String(e)}`;
			messageType = "error";
		}
	};
</script>

<div class="settings-container">
	<h2>Settings</h2>

	<div class="form-group">
		<label for="fps">FPS</label>
		<input type="number" id="fps" bind:value={fps} min="1" />
	</div>

	<div class="form-group form-group-toggle">
		<label for="silence">Silence Wallpaper</label>
		<label class="toggle-switch">
			<input type="checkbox" id="silence" bind:checked={silence} />
			<span class="slider"></span>
		</label>
	</div>

	<div class="button-group">
		<button class="btn btn-primary" on:click={saveSettings}>Save Settings</button>
		<button class="btn btn-secondary" on:click={openConfig}>Open Config File</button>
		<button class="btn btn-secondary" on:click={clearAllWallpapers}>Clear All Wallpapers</button>
	</div>

	{#if message}
		<div class="message" class:success={messageType === "success"} class:error={messageType === "error"}>
			{message}
		</div>
	{/if}
</div>

<style>
	:root {
		--input-bg-color: #3a3a3a;
		--input-border-color: #444;
		--input-text-color: #fff;
		--btn-primary-bg: #007bff;
		--btn-primary-hover-bg: #0056b3;
		--btn-secondary-bg: #6c757d;
		--btn-secondary-hover-bg: #5a6268;
		--text-color: #fff;
		--success-bg: #28a745;
		--error-bg: #dc3545;
	}

	.settings-container {
		color: var(--text-color);
	}

	h2 {
		text-align: center;
		margin-bottom: 25px;
	}

	.form-group {
		margin-bottom: 20px;
	}

	.form-group label {
		display: block;
		margin-bottom: 8px;
		font-weight: bold;
		font-size: 0.95em;
	}

	.form-group input[type="text"],
	.form-group input[type="number"] {
		width: 100%;
		padding: 12px;
		border: 1px solid var(--input-border-color);
		border-radius: 8px;
		background-color: var(--input-bg-color);
		color: var(--input-text-color);
		box-sizing: border-box;
		transition: border-color 0.2s;
	}

	.form-group input[type="text"]:focus,
	.form-group input[type="number"]:focus {
		outline: none;
		border-color: var(--btn-primary-bg);
	}

	.form-group-toggle {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.toggle-switch {
		position: relative;
		display: inline-block;
		width: 50px;
		height: 28px;
	}

	.toggle-switch input {
		opacity: 0;
		width: 0;
		height: 0;
	}

	.slider {
		position: absolute;
		cursor: pointer;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: #ccc;
		transition: 0.4s;
		border-radius: 28px;
	}

	.slider:before {
		position: absolute;
		content: "";
		height: 20px;
		width: 20px;
		left: 4px;
		bottom: 4px;
		background-color: white;
		transition: 0.4s;
		border-radius: 50%;
	}

	input:checked + .slider {
		background-color: var(--btn-primary-bg);
	}

	input:focus + .slider {
		box-shadow: 0 0 1px var(--btn-primary-bg);
	}

	input:checked + .slider:before {
		transform: translateX(22px);
	}

	.button-group {
		margin-top: 30px;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.btn {
		color: white;
		padding: 12px 20px;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font-size: 1em;
		font-weight: bold;
		transition: background-color 0.2s ease-in-out;
		width: 100%;
	}

	.btn-primary {
		background-color: var(--btn-primary-bg);
	}

	.btn-primary:hover {
		background-color: var(--btn-primary-hover-bg);
	}

	.btn-secondary {
		background-color: var(--btn-secondary-bg);
	}

	.btn-secondary:hover {
		background-color: var(--btn-secondary-hover-bg);
	}

	.message {
		margin-top: 20px;
		padding: 12px;
		border-radius: 8px;
		text-align: center;
		font-weight: bold;
	}

	.message.success {
		background-color: var(--success-bg);
		color: white;
	}

	.message.error {
		background-color: var(--error-bg);
		color: white;
	}
</style>
