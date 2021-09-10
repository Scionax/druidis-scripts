import Alerts from "./Alerts.ts";
import Dom from "./Dom.ts";
import Nav from "./Nav.ts";

export default class MainSection {
	
	static url: string;					// URL to the web server; e.g. localhost, druidis.org, etc.
	
	static async loadInnerHtml() {
		
		// Check if the cache has gone stale. If so, clear it.
		const lastInner = Number(localStorage.getItem(`lastCache:${Nav.urlPathname}`)) || 0;
		
		if(Nav.loadDate - lastInner > Nav.cacheStatic) {
			console.log(`Clearing stale data on ${Nav.urlPathname}`);
			localStorage.removeItem(`html:${Nav.urlPathname}`);
			localStorage.setItem(`lastCache:${Nav.urlPathname}`, Nav.loadDate.toString())
		}
		
		// If cache is still good (and present), use that.
		else {
			const innerHtml = localStorage.getItem(`html:${Nav.urlPathname}`);
			
			if(innerHtml) {
				Dom.setElement(document.getElementById("main-section") as HTMLElement, innerHtml);
				return;
			}
		}
		
		// Otherwise, fetch inner web content:
		const response = await MainSection.fetchInner(Nav.urlPathname);
		const contents = await response.text();
		Dom.setElement(document.getElementById("main-section") as HTMLElement, contents);
		MainSection.saveLocalHtml();
	}
	
	static saveLocalHtml() {
		
		// if(Config.urlSegments[0] in ["about"]) {}
		
		// Check if the content is outdated (new version, etc).
		
		// If the content is outdated, delete it.
		
		// Make sure we haven't already saved the content.
		
		// Save the inner html locally.
		const contents = MainSection.exportInnerHTML();
		localStorage.setItem(`html:${Nav.urlPathname}`, contents);
	}
	
	static clearAll() {
		Dom.clearElement(document.getElementById("main-section") as HTMLElement);
	}
	
	static append(el: HTMLElement) {
		const mainSection = document.getElementById("main-section") as HTMLElement;
		if(mainSection !== null) { mainSection.appendChild(el); }
	}
	
	static clearBlock(blockId: string) {
		const mainSection = document.getElementById("main-section") as HTMLElement;
		
		for(let i = mainSection.children.length - 1; i >= 0; i--) {
			const child = mainSection.children[i];
			if(child.classList.contains(blockId)) {
				mainSection.removeChild(child);
			}
		}
	}
	
	static exportInnerHTML(): string {
		const mainSection = document.getElementById("main-section") as HTMLElement;
		return mainSection.innerHTML;
	}
	
	// Calls ONLY the inner page content, not the full page.
	static async fetchInner(path: string): Promise<Response> {
		return await fetch(`${MainSection.url}/page${path}`, {
			headers: {
				'Content-Type': 'text/html',
				'Credentials': 'include', // Needed or Cookies will not be sent.
			},
		});
	}
	
	static initialize() {
		
		Alerts.purgeAlerts();
		
		// Set .url
		if(location.hostname.indexOf("local") > -1) { MainSection.url = `http://localhost`; }
		else { MainSection.url = `https://druidis.org`; }
	}
}