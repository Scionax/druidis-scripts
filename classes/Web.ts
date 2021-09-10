import Alerts from "./Alerts.ts";

export default class Webpage {
	
	static url: string;					// URL to the web server; e.g. localhost, druidis.org, etc.
	
	static clearMainSection() {
		Webpage.clearElement(document.getElementById("main-section") as HTMLElement);
	}
	
	static clearElement(el: HTMLElement) {
		for(let i = el.children.length - 1; i >= 0; i--) {
			const child = el.children[i];
			el.removeChild(child);
		}
	}
	
	static setElement(el: HTMLElement, childEl: string | HTMLElement) {
		Webpage.clearElement(el);
		if(typeof childEl === "string") { el.innerHTML = childEl;} else { el.appendChild(childEl); }
	}
	
	static appendToMain(el: HTMLElement) {
		const mainSection = document.getElementById("main-section") as HTMLElement;
		if(mainSection !== null) { mainSection.appendChild(el); }
	}
	
	static clearBlockFromMain(blockId: string) {
		const mainSection = document.getElementById("main-section") as HTMLElement;
		
		for(let i = mainSection.children.length - 1; i >= 0; i--) {
			const child = mainSection.children[i];
			if(child.classList.contains(blockId)) {
				mainSection.removeChild(child);
			}
		}
	}
	
	static extractMainSection(): string {
		const mainSection = document.getElementById("main-section") as HTMLElement;
		return mainSection.innerHTML;
	}
	
	// Calls ONLY the inner page content, not the full page.
	static async getInnerHTML(path: string): Promise<Response> {
		return await fetch(`${Webpage.url}/page${path}`, {
			headers: {
				'Content-Type': 'text/html',
				'Credentials': 'include', // Needed or Cookies will not be sent.
			},
		});
	}
	
	static initialize() {
		
		Alerts.purgeAlerts();
		
		// Set .url
		if(location.hostname.indexOf("local") > -1) { Webpage.url = `http://localhost`; }
		else { Webpage.url = `https://druidis.org`; }
	}
}