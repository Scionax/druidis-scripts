
interface AmpTagName extends HTMLElementTagNameMap {
    "amp-img": HTMLElement;
}

export function createElement<K extends keyof AmpTagName>(element: K, attribute: Record<string, string> | false = false, inner: HTMLElement[] | null = null) {
	
	const el = document.createElement(element);
	
	if(typeof(attribute) === 'object') {
		for(const attKey in attribute) {
			el.setAttribute(attKey, attribute[attKey]);
		}
	}
	
	if(inner !== null) {
		for(let k = 0; k < inner.length; k++) {
			if(!inner[k]) { continue; }
			if(inner[k].tagName) { el.appendChild(inner[k]); }
			// else { el.appendChild(document.createTextNode(inner[k])); }
		}
	}
	
	return el;
}
