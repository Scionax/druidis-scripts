import Config from "./Config.ts";

export default class Script {
	
	static load(id: string, path: string, defer = true) {
		
		// Prevent scripts from being re-loaded if already present.
		const find = document.getElementById(`script-${id}`) as HTMLScriptElement;
		if(find) { console.log("Script already loaded."); return; }
		
		// Prepare Script
		const script = document.createElement('script');
		script.id = `script-${id}`;
		script.defer = defer;
		script.src = `${Config.url_web}${path}`;
		
		// Run the initialization process once the script has been loaded.
		script.addEventListener("load", () => {
			Script.initialize(id);
		});
		
		// Add to the document head.
		document.head.appendChild(script);
	}
	
	static initialize(id: string) {
		
	}
}