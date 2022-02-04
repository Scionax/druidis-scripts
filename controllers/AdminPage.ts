import API from "../classes/API.ts";
import Nav from "../classes/Nav.ts";
import Script from "../classes/Script.ts";

export default abstract class AdminPage {
	
	static async initialize() {
		
		const json = await API.callAPI(Nav.urlPathname);
		console.log(json);
	}
}

Script.register("AdminPage", AdminPage.initialize);
