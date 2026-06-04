<script lang="ts">
	export let width: string = '24';
	export let height: string = '24';
	export let strokeWidth: string = '2.5';
	let className: string = '';
	export { className as class };
</script>

<svg
	{width}
	{height}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width={strokeWidth}
	stroke-linecap="round"
	stroke-linejoin="round"
	class={className}
>
	<polyline points="20 6 9 17 4 12" />
</svg>
