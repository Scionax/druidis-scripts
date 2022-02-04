import Account from "./Account.ts";
import Feed from "./Feed.ts";
import Forum from "./Forum.ts";
import MainSection from "./MainSection.ts";
import Script from "./Script.ts";

export default class Nav {
	
	// Navigation Values
	static url: string;
	static urlPathname: string;
	static urlSeg: string[];
	static innerLoad: boolean;		// Indicates that only the inner html needs to be loaded. Full page already loaded.
	static loadDate: number;		// The timestamp that the load occurred at.
	
	// Special functions to run when a specific page loads:
	static pageLoad: { [id: string]: any } = {
		"/user/logout": () => { Account.logOut() },
		"/post": () => { Script.load("PostPage"); }
		// "/post": () => { PostPage.initialize() }
	};
	
	static updateURL(innerLoad: boolean, newUrl = "", newTitle = "", movedBack = false) {
		if(newUrl && !movedBack) { history.pushState(null, newTitle, newUrl); }
		
		// Update Navigation & URL Details
		Nav.innerLoad = innerLoad;
		Nav.loadDate = Math.floor(Date.now() / 1000);
		Nav.url = location.href;
		Nav.urlPathname = location.pathname;
		Nav.urlSeg = location.pathname.split("/");
		if(Nav.urlSeg.length > 0) { Nav.urlSeg.shift(); }
	}
	
	// Run each page based on the navigation path.
	static runPageUpdate() {
		const base = Nav.urlSeg[0];
		
		// Clear the Main Section (if we're running an inner-load)
		if(Nav.innerLoad) { MainSection.clearAll(); }
		
		if(base === "") { Feed.initialize(); /* Home Page */ }
		else if(base === "forum" && Nav.urlSeg[1]) { Forum.initialize(); }
		else if(base === "feed") { Feed.initialize(); }
		else if(base === "admin") { Script.load("AdminPage"); }
		
		// Load standard pages. Run any special functions, if applicable.
		else if(Nav.innerLoad) {
			MainSection.loadInnerHtml().then(() => {
				if(Nav.pageLoad[Nav.urlPathname]) { Nav.pageLoad[Nav.urlPathname](); }
			});
		}
		
		else {
			if(Nav.pageLoad[Nav.urlPathname]) { Nav.pageLoad[Nav.urlPathname](); }
		}
	}
	
	static mainHeight() { return MainSection.get().scrollHeight; }
	static scrollDist() { return Nav.mainHeight() - window.scrollY - window.innerHeight; }
}
