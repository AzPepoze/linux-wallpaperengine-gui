<script lang="ts">
	export let title: string;
	export let description: string = '';
</script>

<section class="settings-section" {...$$restProps}>
	<div class="section-header">
		<h3>{title}</h3>
		{#if description}
			<p>{description}</p>
		{/if}
	</div>
	<div class="section-content">
		<slot />
	</div>
</section>

<style lang="scss">
	.settings-section {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 28px;
		animation: fade-in 0.4s cubic-bezier(0.4, 0, 0.2, 1);
		scroll-margin-top: 40px;
	}

	.section-header {
		text-align: left;
		padding-bottom: 8px;
		border-bottom: 1px solid var(--border-color);

		h3 {
			margin: 0;
			font-size: 1.6em;
			font-weight: 800;
			color: var(--text-color);
			letter-spacing: -0.02em;
			background: linear-gradient(135deg, var(--text-color) 0%, var(--text-muted) 100%);
			background-clip: text;
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
		}

		p {
			margin: 8px 0 0 0;
			font-size: 1em;
			color: var(--text-muted);
			line-height: 1.6;
		}
	}

	.section-content {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
