
interface AmpTagName extends HTMLElementTagNameMap {
    "amp-img": HTMLElement;
}

export default class Dom {
	
	static createElement<K extends keyof AmpTagName>(element: K, attribute: Record<string, string> | false = false, inner: HTMLElement[] | null = null) {
		
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
	
	static clearElement(el: HTMLElement) {
		for(let i = el.children.length - 1; i >= 0; i--) {
			const child = el.children[i];
			el.removeChild(child);
		}
	}
	
	static setElement(el: HTMLElement, childEl: string | HTMLElement) {
		Dom.clearElement(el);
		if(typeof childEl === "string") { el.innerHTML = childEl;} else { el.appendChild(childEl); }
	}
	
}
