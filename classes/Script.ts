import Config from "./Config.ts";

/*
	To create a Dynamic Script, add the following line at the end of the script:
		Script.register(scriptName, ThisScript.initialize);
		
		// Then update Nav.ts, so that the appropriate script will load on the designated page.
*/

export default class Script {
	
	// { ID: Script Class }
	static registry: Record<string, () => void> = {};
	
	static load(scriptName: string, defer = true) {
		
		// If the script is already loaded, we just need to re-initialize it.
		const scriptFound = document.getElementById(`script-${scriptName}`) as HTMLScriptElement;
		
		if(scriptFound) {
			Script.registry[scriptName]();
			return;
		}
		
		// Prepare Script
		const script = document.createElement('script');
		script.id = `script-${scriptName}`;
		script.defer = defer;
		script.src = `${Config.url_web}/public/scripts/${scriptName}.js`;
		
		// Run the initialization process once the script has been loaded.
		script.addEventListener("load", () => {
			Script.registry[scriptName]();
		});
		
		// Add to the document head.
		document.head.appendChild(script);
	}
	
	static register(scriptName: string, initMethod: () => void) {
		Script.registry[scriptName] = initMethod;
	}
}