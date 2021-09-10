import Alerts from "./Alerts.ts";
import API from "./API.ts";
import MainSection from "./MainSection.ts";
import Nav from "./Nav.ts";

export default abstract class Account {
	static id = 0;
	
	static initialize() {
		// const curLogin = Account.loginId;
		Account.updateLoginId();
		
		// If the cookie state changed (such as from Logged Out to Logged In):
		// if(Account.loginId !== curLogin) {
		// 	if(Account.loginId) { Account.logIn(); }
		// 	else { Account.logOut(); }
		// }
	}
	
	// Runs once a page is loaded.
	static runAccountPage() {
		const page = Nav.urlSeg[1];
		if(!page) { return; }
		if(page === "logout") { Account.logOut(); }
	}
	
	static updateLoginId(): boolean {
		Account.id = 0;
		const loginCookie = Account.getLoginCookie();
		if(!loginCookie) { return false; }
		const s = loginCookie.split(".");
		Account.id = Number(s[0]) || 0;
		return true;
	}
	
	static getLoginCookie() {
		const cookies = document.cookie.split(";");
		for(let i = 0; i < cookies.length; i++) {
			const c = cookies[i].trim().split('=');
			if(c[0] !== "login") { continue; }
			return c[1];
		}
	}
	
	static logIn() {
		if(Nav.local) { console.log(`Logged in with ID #${Account.id}.`); }
		Nav.updateURL(true, MainSection.url, "Druidis");
		Nav.runPageUpdate();
	}
	
	static logOut() {
		console.log("Logging Out...");
		document.cookie = `login=deleted; expires=Thu, 01 Jan 1970 00:00:01 GM; Secure; path=/; domain=${location.host};`;
	}
	
	static async submitLogin(elLogin: HTMLInputElement) {
		
		// Prevent re-submissions.
		if(elLogin.value !== "Log In") { return; }
		
		// Make sure there is content to submit:
		const data = {
			"user": (document.getElementById("user") as HTMLInputElement).value,
			"pass": (document.getElementById("pass") as HTMLInputElement).value,
		};
		
		Alerts.error(!data.user, "Please provide a username.", true);
		Alerts.error(!data.pass, "Please provide a password.");
		if(Alerts.hasErrors()) { Alerts.displayAlerts(); return; }
		
		elLogin.value = "Logging In...";
		
		// Call the API
		const json = await API.callAPI("/user/login", data);
		
		elLogin.value = "Log In";
		Alerts.error(!json, "Error: Server response was invalid. May need to contact the webmaster.", true);
		
		if(json.error) {
			Alerts.error(true, json.error);
			Alerts.displayAlerts();
			return;
		}
		
		// Check if the cookie is registered, to see if there's final success.
		if(Account.updateLoginId()) { Account.logIn(); }
	}
	
	static async submitSignIn(elSignUp: HTMLInputElement) {
		
		// Prevent re-submissions.
		if(elSignUp.value !== "Sign Up") { return; }
		
		// Make sure there is content to submit:
		const data = {
			"user": (document.getElementById("user") as HTMLInputElement).value,
			"email": (document.getElementById("email") as HTMLInputElement).value,
			"pass": (document.getElementById("pass") as HTMLInputElement).value,
			"tos": (document.getElementById("tos") as HTMLInputElement).checked ? true : false,
			"privacy": (document.getElementById("privacy") as HTMLInputElement).checked ? true : false,
		};
		
		Alerts.error(!data.user, "Please provide a username.", true);
		Alerts.error(data.user.length < 6, "Username must be between 6 and 16 characters.");
		Alerts.error(!data.email || !data.email.match(/^\S+@\S+\.\S+$/), "Must provide a valid email.");
		Alerts.error(!data.pass || data.pass.length < 8, "Password must be at least eight characters.");
		Alerts.error(!data.tos, "Must agree to the Terms of Service.");
		Alerts.error(!data.privacy, "Must agree to the Privacy Policy.");
		if(Alerts.hasErrors()) { Alerts.displayAlerts(); return; }
		
		elSignUp.value = "Submitting...";
		
		// Submit Content to API
		const json = await API.callAPI("/user/sign-up", data);
		
		Alerts.error(!json, "Error: Server response was invalid. May need to contact the webmaster.", true);
		
		// Verify the data, to see if there's final success.
		// TODO: VERIFY
		
		// Success
		
		// TODO: Redirect, Process, etc.
		
		console.log(json);
		if(Alerts.hasAlerts()) { Alerts.displayAlerts(); }
	}
}
