<script lang="ts">
	export let name: string;
	export let size: number | string = 24;
	export let color: string | undefined = undefined;
	export let className: string = '';

	$: style = [
		`font-size: ${typeof size === 'number' ? size + 'px' : size}`,
		color ? `color: ${color}` : '',
		'display: inline-flex',
		'align-items: center',
		'justify-content: center'
	].filter(Boolean).join('; ');
</script>

<span 
	class="material-icons {className}" 
	style={style}
	aria-hidden="true"
	{...$$restProps}
>
	{name}
</span>

<style>
	.material-icons {
		user-select: none;
		vertical-align: middle;
	}
</style>
