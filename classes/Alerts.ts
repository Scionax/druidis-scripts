import Dom from "./Dom.ts";

export default class Alerts {
	
	static info: string[];
	static errors: string[];
	
	static hasAlerts() { return (Alerts.errors.length > 0 || Alerts.info.length > 0) ? true : false; }
	static hasErrors() { return Alerts.errors.length === 0 ? false : true; }
	static purgeAlerts() { Alerts.errors = []; Alerts.info = []; }
	
	static error(assert: boolean, message: string, purge = false) {
		if(purge) { Alerts.purgeAlerts(); }
		if(assert) { Alerts.errors.push(message); }
	}
	
	static displayAlerts() {
		if(!Alerts.hasAlerts()) { return; }
		
		const box = document.getElementById("alertBox") as HTMLDivElement;
		const isAlertBox = box ? true : false;
		
		if(!isAlertBox) { return; }
		
		box.innerHTML = "";
		
		// Display Info Alerts
		for(let i = 0; i < Alerts.info.length; i++) {
			const alert = Dom.createElement("div", {"class": "alert alert-info"});
			alert.innerHTML = Alerts.info[i];
			box.appendChild(alert);
		}
		
		// Display Errors
		for(let i = 0; i < Alerts.errors.length; i++) {
			const alert = Dom.createElement("div", {"class": "alert alert-fail"});
			alert.innerHTML = Alerts.errors[i];
			box.appendChild(alert);
		}
	}
}