
document.addEventListener("click", (e: Event) => {
	if(!e.target) { return; }
	if(!(e.target instanceof Element)) { return; }
	
	// Check if a link was clicked, and if it provides a valid URL. If not, return.
	const origin = e.target.closest("a");
	if(!origin || !origin.href) { return; }
	
	e.preventDefault(); // Prevent the standard link behavior (traversing to page, full reload).
	Nav.updateURL(true, origin.href, document.title);
	Nav.runPageUpdate();
});

window.addEventListener("popstate", (event: PopStateEvent) => {
	event.preventDefault();
	Nav.updateURL(true, document.location.href, document.title, true);
	Nav.runPageUpdate();
});