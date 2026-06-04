<script lang="ts">
	export let width = '24';
	export let height = '24';
</script>

<svg
	{width}
	{height}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
	{...$$restProps}
>
	<path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
	<polyline points="13 2 13 9 20 9" />
	<circle cx="9" cy="13" r="2" />
	<path d="M8 18h8" />
</svg>

<style>
	svg {
		display: inline-block;
	}
</style>
