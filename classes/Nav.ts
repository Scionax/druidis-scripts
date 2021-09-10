import Account from "./Account.ts";
import Feed from "./Feed.ts";
import Forum from "./Forum.ts";
import PostPage from "./PostPage.ts";
import Webpage from "./Web.ts";

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
		if(Nav.innerLoad) { Webpage.clearMainSection(); }
		
		if(base === "") { Feed.initialize(); /* Home Page */ }
		else if(base === "forum" && Nav.urlSeg[1]) { Forum.initialize(); }
		else if(base === "feed") { Feed.initialize(); }
		
		// Load standard pages. Run any special functions, if applicable.
		else if(Nav.innerLoad) {
			Nav.loadInnerHtml().then(() => {
				if(Nav.pageLoad[Nav.urlPathname]) { Nav.pageLoad[Nav.urlPathname](); }
			});
		}
		
		else {
			if(Nav.pageLoad[Nav.urlPathname]) { Nav.pageLoad[Nav.urlPathname](); }
		}
	}
	
	static async loadInnerHtml() {
		
		// Check if we've met the cache limit.
		const lastInner = Number(localStorage.getItem(`lastCache:${Nav.urlPathname}`)) || 0;
		
		if(Nav.loadDate - lastInner > Nav.cacheStatic) {
			console.log(`Clearing stale data on ${Nav.urlPathname}`);
			localStorage.removeItem(`html:${Nav.urlPathname}`);
			localStorage.setItem(`lastCache:${Nav.urlPathname}`, Nav.loadDate.toString())
		}
		
		// Check if localStorage has the data to overwrite.
		else {
			const innerHtml = localStorage.getItem(`html:${Nav.urlPathname}`);
			
			if(innerHtml) {
				Webpage.setElement(document.getElementById("main-section") as HTMLElement, innerHtml);
				return;
			}
		}
		
		// Otherwise, retrieve inner web content:
		const response = await Webpage.getInnerHTML(Nav.urlPathname);
		const contents = await response.text();
		Webpage.setElement(document.getElementById("main-section") as HTMLElement, contents);
		Nav.saveLocalHtml();
	}
	
	static saveLocalHtml() {
		
		// if(Config.urlSegments[0] in ["about"]) {}
		
		// Check if the content is outdated (new version, etc).
		
		// If the content is outdated, delete it.
		
		// Make sure we haven't already saved the content.
		
		// Save the inner html locally.
		const contents = Webpage.extractMainSection();
		localStorage.setItem(`html:${Nav.urlPathname}`, contents);
	}
	
	// sta = Static Cache (Default is 3 days), dyn = Dynamic Cache (Default is 5 minutes)
	static setCache(sta = 3600 * 24 * 3, dyn = 60 * 5) {
		Nav.cacheStatic = sta;
		Nav.cacheDynamic = dyn;
	}
	
	static mainHeight() { return (document.getElementById("main-section") as HTMLElement).scrollHeight; }
	static scrollDist() { return Nav.mainHeight() - window.scrollY - window.innerHeight; }
}
