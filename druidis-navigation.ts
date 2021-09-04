
document.addEventListener("click", (e: Event) => {
	if(!e.target) { return; }
	if(!(e.target instanceof Element)) { return; }
	
	// Check if a button was clicked.
	const inputOrigin = e.target.closest("input");
	if(inputOrigin && inputOrigin.type === "submit") { return runButtonPress(inputOrigin); }
	
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
	const submit = document.getElementById("main-section")?.querySelector(`input[type="submit"]`);
	if(submit instanceof HTMLInputElement) { submit.click(); }
});

function runButtonPress(inputOrigin: HTMLInputElement) {
	if(Nav.local) { console.log(`Global click on ${inputOrigin.id}.`); }
	switch(inputOrigin.id) {
		case "loginSubmit": return Account.submitLogin(inputOrigin);
		case "signUpSubmit": return Account.submitSignIn(inputOrigin);
	}
}