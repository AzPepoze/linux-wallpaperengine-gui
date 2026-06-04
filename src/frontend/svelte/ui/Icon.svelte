<script lang="ts">
	export let name: string;
	export let size: number | string = 24;
	export let color: string | undefined = undefined;
	export let className: string = '';

	$: styleProps = [
		`font-size: ${typeof size === 'number' ? size + 'px' : size}`,
		color ? `color: ${color}` : '',
		'display: inline-flex',
		'align-items: center',
		'justify-content: center'
	].filter(Boolean).join('; ');

	$: restClass = $$restProps.class || '';
	$: restStyle = $$restProps.style || '';

	$: combinedClass = ['material-icons', className, restClass].filter(Boolean).join(' ');
	$: combinedStyle = [styleProps, restStyle].filter(Boolean).join('; ');

	$: restPropsWithoutClassStyle = (() => {
		const { class: _, style: __, ...rest } = $$restProps;
		return rest;
	})();
</script>

<span 
	class={combinedClass} 
	style={combinedStyle}
	aria-hidden="true"
	{...restPropsWithoutClassStyle}
>
	{name}
</span>

<style>
	.material-icons {
		user-select: none;
		vertical-align: middle;
	}
</style>
