import Account from "./classes/Account.ts";
import Alerts from "./classes/Alerts.ts";
import Config from "./classes/Config.ts";
import MainSection from "./classes/MainSection.ts";
import Nav from "./classes/Nav.ts";

document.addEventListener("click", (e: Event) => {
	if(!e.target) { return; }
	if(!(e.target instanceof Element)) { return; }
	
	// Check if a button was clicked.
	const inputOrigin = e.target.closest("input");
	if(inputOrigin && inputOrigin.type === "submit") { return runSubmitPress(inputOrigin); }

	// Check if a link was clicked, and if it provides a valid URL. If not, return.
	const origin = e.target.closest("a");
	if(!origin || !origin.href) { return; }
	
	e.preventDefault(); // Prevent the standard link behavior (traversing to page, full reload).
	Nav.updateURL(true, origin.href, document.title);
	Nav.runPageUpdate();
});

window.addEventListener("popstate", (e: PopStateEvent) => {
	e.preventDefault();
	Nav.updateURL(true, document.location.href, document.title, true);
	Nav.runPageUpdate();
});

// When a form submits (such as pressting enter), instead "click" the submission, which will fire the correct javascript.
window.addEventListener("submit", (e: Event) => {
	e.preventDefault();
	const submit = MainSection.get()?.querySelector(`input[type="submit"]`);
	if(submit instanceof HTMLInputElement) { submit.click(); }
});

function runSubmitPress(inputOrigin: HTMLInputElement) {
	if(Config.local) { console.log(`Global click on ${inputOrigin.id}.`); }
	switch(inputOrigin.id) {
		case "loginSubmit": return Account.submitLogin(inputOrigin);
		case "signUpSubmit": return Account.submitSignIn(inputOrigin);
	}
}

Config.initialize();
Alerts.purgeAlerts();
Nav.updateURL(false);
Nav.runPageUpdate();
Account.initialize();
