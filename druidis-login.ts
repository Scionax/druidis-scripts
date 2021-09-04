
abstract class Account {
	static loginId = 0;
	
	static initialize() {
		const curLogin = Account.loginId;
		
		const loginCookie = Account.getLoginCookie();
		if(loginCookie) {
			const s = loginCookie.split(".");
			Account.loginId = Number(s[0]) || 0;
		} else {
			Account.loginId = 0;
		}
		
		if(Account.loginId !== curLogin) {
			
			// If the cookie state changed from Logged Out to Logged In:
			if(Account.loginId) {
				// Run Log In
			}
			
			// If the cookie state changed from Logged In to Logged Out:
			else {
				// Run Log Out
			}
		}
		console.log("login cookie", loginCookie);
	}
	
	static getLoginCookie() {
		const cookies = document.cookie.split(";");
		for(let i = 0; i < cookies.length; i++) {
			const c = cookies[i].trim().split('=');
			if(c[0] === "login") {
				return c[1];
			}
		}
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
		
		Alerts.error(!json, "Error: Server response was invalid. May need to contact the webmaster.", true);
		if(Alerts.hasAlerts()) { Alerts.displayAlerts(); return; }
		
		// Verify the data, to see if there's final success.
		// TODO: VERIFY
		
		// Success
		
		// TODO: Redirect, Process, etc.
		console.log("Success. Redirect from here.");
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
		if(Alerts.hasAlerts()) { Alerts.displayAlerts(); return; }
		
		// Verify the data, to see if there's final success.
		// TODO: VERIFY
		
		// Success
		
		// TODO: Redirect, Process, etc.
		
		console.log(json);
	}
}

Account.initialize();