<script lang="ts">
	import Button from '@/ui/Button.svelte';
	import Icon from '@/ui/Icon.svelte';

	export let checked: boolean = false;
	export let icon: string = '';
	export let label: string = '';
	export let onChange: (checked: boolean) => void = () => {};

	function handleClick() {
		checked = !checked;
		onChange(checked);
	}
</script>

<Button
	variant={checked ? 'primary' : 'ghost'}
	on:click={handleClick}
	{...$$restProps}
>
	{#if icon}
		<Icon name={icon} size={18} />
	{/if}
	{#if label}
		<span>{label}</span>
	{/if}
</Button>
