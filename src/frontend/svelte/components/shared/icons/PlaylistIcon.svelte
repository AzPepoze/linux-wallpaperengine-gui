<script lang="ts">
	export let width = '24';
	export let height = '24';
	export let className = '';
</script>

<svg
	{width}
	{height}
	class={className}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
>
	<path d="M8 6h13"></path>
	<path d="M8 12h13"></path>
	<path d="M8 18h13"></path>
	<circle cx="4" cy="6" r="1"></circle>
	<circle cx="4" cy="12" r="1"></circle>
	<circle cx="4" cy="18" r="1"></circle>
</svg>
