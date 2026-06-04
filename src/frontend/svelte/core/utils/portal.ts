export function portal(node: HTMLElement, target: HTMLElement | string = document.body) {
	let targetEl: HTMLElement | null;
	if (typeof target === 'string') {
		targetEl = document.querySelector(target);
		if (targetEl === null) {
			targetEl = document.body;
		}
	} else {
		targetEl = target;
	}

	targetEl.appendChild(node);
	
	return {
		destroy() {
			if (node.parentNode) {
				node.parentNode.removeChild(node);
			}
		}
	};
}
