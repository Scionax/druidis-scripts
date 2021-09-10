import Account from "./Account.ts";
import Feed from "./Feed.ts";
import Forum from "./Forum.ts";
import MainSection from "./MainSection.ts";
import PostPage from "./PostPage.ts";

export default class Nav {
	
	// Navigation Values
	static url: string;
	static urlPathname: string;
	static urlSeg: string[];
	static innerLoad: boolean;		// Indicates that only the inner html needs to be loaded. Full page already loaded.
	static loadDate: number;		// The timestamp that the load occurred at.
	
	// Settings
	static local: boolean;			// Indicates that we're on localhost (or dev system).
	static cacheStatic: number;		// [Required for Local] Duration for caching static content (like about pages).
	static cacheDynamic: number;	// [Required for Local] Duration for caching dynamic content (like feeds).
	
	// Special functions to run when a specific page loads:
	static pageLoad: { [id: string]: any } = {
		"/user/logout": () => { Account.logOut() },
		"/post": () => { PostPage.initialize() }
	};
	
	static initialize() {
		
		// Local Settings
		Nav.local = location.hostname.indexOf("local") > -1 ? true : false;
		if(Nav.local) { Nav.setCache(20, 20); } else { Nav.setCache(); }
		
		Nav.updateURL(false);
	}
	
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
	
	// sta = Static Cache (Default is 3 days), dyn = Dynamic Cache (Default is 5 minutes)
	static setCache(sta = 3600 * 24 * 3, dyn = 60 * 5) {
		Nav.cacheStatic = sta;
		Nav.cacheDynamic = dyn;
	}
	
	static mainHeight() { return (document.getElementById("main-section") as HTMLElement).scrollHeight; }
	static scrollDist() { return Nav.mainHeight() - window.scrollY - window.innerHeight; }
}
