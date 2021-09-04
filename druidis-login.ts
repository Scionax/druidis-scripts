
// Log In Submission
const elLogin = document.getElementById("loginSubmit") as HTMLInputElement;

if(elLogin) {
	elLogin.addEventListener("click", async () => {
		if(!API.url) { console.error("Unable to post. `API.url` is not set."); return; }
		
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
	});
}

// Sign Up Submission
const elSignUp = document.getElementById("signUpSubmit") as HTMLInputElement;

if(elSignUp) {
	elSignUp.addEventListener("click", async () => {
		if(!API.url) { console.error("Unable to post. `API.url` is not set."); return; }
		
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
	});
}