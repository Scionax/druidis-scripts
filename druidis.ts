
const OneMinute = 60;
const OneDay = 3600 * 24;

class Nav {
	
	// Navigation Values
	static url: string;
	static urlPathname: string;
	static urlSeg: string[];
	static innerLoad: boolean;		// Indicates that only the inner html needs to be loaded. Full page already loaded.
	static loadDate: number;		// The timestamp that the load occurred at.
	
	// Settings
	static local: boolean;			// Indicates that we're on localhost (or dev system).
	static cacheStatic: number;		// Duration for caching static content (like about pages).
	static cacheDynamic: number;	// Duration for caching dynamic content (like feeds).
	
	// Special functions to run when a specific page loads:
	static pageLoad: { [id: string]: any } = {
		"/user/logout": Account.logOut
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
		
		if(base === "") { Forum.initialize(); }
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
				Webpage.setMainSection(innerHtml);
				return;
			}
		}
		
		// Otherwise, retrieve inner web content:
		const response = await Webpage.getInnerHTML(Nav.urlPathname);
		const contents = await response.text();
		Webpage.setMainSection(contents);
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
	static setCache(sta = OneDay * 3, dyn = OneMinute * 5) {
		Nav.cacheStatic = sta;
		Nav.cacheDynamic = dyn;
	}
}

class Webpage {
	
	static url: string;					// URL to the web server; e.g. localhost, druidis.org, etc.
	
	static clearMainSection() {
		const mainSection = document.getElementById("main-section") as HTMLElement;
		
		for(let i = mainSection.children.length - 1; i >= 0; i--) {
			const child = mainSection.children[i];
			mainSection.removeChild(child);
		}
	}
	
	static setMainSection(innerHtml: string) {
		Webpage.clearMainSection();
		const main = document.getElementById("main-section") as HTMLElement;
		main.innerHTML = innerHtml;
	}
	
	static addBlock(element: HTMLElement) {
		const mainSection = document.getElementById("main-section") as HTMLElement;
		if(mainSection !== null) { mainSection.appendChild(element); }
	}
	
	static clearBlock(blockId: string) {
		const mainSection = document.getElementById("main-section") as HTMLElement;
		
		for(let i = mainSection.children.length - 1; i >= 0; i--) {
			const child = mainSection.children[i];
			if(child.classList.contains(blockId)) {
				mainSection.removeChild(child);
			}
		}
	}
	
	static extractMainSection(): string {
		const mainSection = document.getElementById("main-section") as HTMLElement;
		return mainSection.innerHTML;
	}
	
	// Calls ONLY the inner page content, not the full page.
	static async getInnerHTML(path: string): Promise<Response> {
		return await fetch(`${Webpage.url}/page${path}`, {
			headers: {
				'Content-Type': 'text/html',
				'Credentials': 'include', // Needed or Cookies will not be sent.
			},
		});
	}
	
	static initialize() {
		
		Alerts.purgeAlerts();
		
		// Set .url
		if(location.hostname.indexOf("local") > -1) { Webpage.url = `http://localhost`; }
		else { Webpage.url = `https://druidis.org`; }
	}
}

class API {
	
	static url: string;					// URL to the API server; e.g. localhost/api, druidis.org/api, etc.
	
	static initialize() {
		
		// .url
		if(location.hostname.indexOf("local") > -1) { API.url = `http://localhost/api`; }
		else { API.url = `https://druidis.org/api`; }
	}
	
	static async callAPI(path: string, data: Record<string, unknown> | null = null) {
		const response: Response = data === null ? await API.callGetAPI(path) : await API.callPostAPI(path, data);
		return await response.json();
	}
	
	private static async callPostAPI(path: string, data: Record<string, unknown>): Promise<Response> {
		return await fetch(`${API.url}${path}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Credentials': 'include', // Needed or Cookies will not be sent.
				// 'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: JSON.stringify(data)
		});
	}
	
	private static async callGetAPI(path: string): Promise<Response> {
		return await fetch(`${API.url}${path}`, {
			headers: {
				'Content-Type': 'application/json',
				'Credentials': 'include', // Needed or Cookies will not be sent.
				// 'Content-Type': 'application/x-www-form-urlencoded',
			},
		});
	}
}

class Alerts {
	
	static info: string[];
	static errors: string[];
	
	static hasAlerts() { return (Alerts.errors.length > 0 || Alerts.info.length > 0) ? true : false; }
	static hasErrors() { return Alerts.errors.length === 0 ? false : true; }
	static purgeAlerts() { Alerts.errors = []; Alerts.info = []; }
	
	static error(assert: boolean, message: string, purge = false) {
		if(purge) { Alerts.purgeAlerts(); }
		if(assert) { Alerts.errors.push(message); }
	}
	
	static displayAlerts() {
		
		if(!Alerts.hasAlerts()) { return; }
		
		const info = document.getElementById("alertBox") as HTMLDivElement;
		
		const isAlertBox = info ? true : false;
		
		if(isAlertBox) {
			info.innerHTML = "";
		}
		
		// Display Info Alerts
		for(let i = 0; i < Alerts.info.length; i++) {
			
			// Post all alerts in the console.
			console.log(Alerts.info[i]);
			
			// Check if there is an alert box. If so, post alerts.
			if(isAlertBox) {
				const alert = createElement("div", {"class": "alert alert-info"});
				alert.innerHTML = Alerts.info[i];
				info.appendChild(alert);
			}
		}
		
		// Display Errors
		for(let i = 0; i < Alerts.errors.length; i++) {
			
			// Post all alerts in the console.
			console.log(Alerts.errors[i]);
			
			// Check if there is an alert box. If so, post alerts.
			if(isAlertBox) {
				const alert = createElement("div", {"class": "alert alert-fail"});
				alert.innerHTML = Alerts.errors[i];
				info.appendChild(alert);
			}
		}
	}
}

API.initialize();
Webpage.initialize();
Nav.initialize();
Nav.runPageUpdate();

interface AmpTagName extends HTMLElementTagNameMap {
    "amp-img": HTMLElement;
}

function createElement<K extends keyof AmpTagName>(element: K, attribute: Record<string, string> | false = false, inner: HTMLElement[] | null = null) {
	
	const el = document.createElement(element);
	
	if(typeof(attribute) === 'object') {
		for(const attKey in attribute) {
			el.setAttribute(attKey, attribute[attKey]);
		}
	}
	
	if(inner !== null) {
		for(let k = 0; k < inner.length; k++) {
			if(!inner[k]) { continue; }
			if(inner[k].tagName) { el.appendChild(inner[k]); }
			// else { el.appendChild(document.createTextNode(inner[k])); }
		}
	}
	
	return el;
}

interface PostData {
	id?: number,		// ID of the post.
	forum?: string,		// Forum that the post is applied to.
	url: string,		// URL that the post links to.
	title: string,		// Title of the post.
	content: string,	// Content or description included with the post.
	origImg?: string,	// URL of the original image (such as npr.com/images/someimage.png)
	img?: string,		// Image pathname for internal use (such as img-105-ojfs.webp)
	w?: number,			// Width of Image
	h?: number,			// Height of Image
}

// 	.origImg					// A fully qualified URL to an image.
// 	.forum, .id, .img			// A relative path to the image based on forum+id.
function buildPost(post: PostData, isFeed = false) {
	
	// --------------------- //
	// ----- Left Tray ----- //
	// --------------------- //
	
	// Feed Icon
	const feedIconImg = createElement("amp-img", {"width": "48", "height": "48", "src": `/public/images/logo/logo-48.png`});
	const feedIcon = createElement("div", {"class": "tray-icon"}, [feedIconImg]);
	
	// Feed Header
	const feedHeaderTitle = createElement("div", {"class": "h3"});
	feedHeaderTitle.innerHTML = "Author Name or Title";
	
	const feedHeaderSubNote = createElement("div", {"class": "note2"});
	
	try {
		const urlInfo = new URL(post.url);
		feedHeaderSubNote.innerHTML = `Source: ${urlInfo.hostname}`;
	} catch {
		// Do nothing
	}
	
	const feedHeader = createElement("div", {"class": "tray-mid"}, [feedHeaderTitle, feedHeaderSubNote]);
	
	// Feed Menu
	const feedMenuInner = createElement("div", {"class": "tray-menu-inner"});
	feedMenuInner.innerHTML = "&#8226;&#8226;&#8226;";
	
	const feedMenu = createElement("div", {"class": "tray-menu"}, [feedMenuInner]);
	
	// Feed Top (full top line; includes Icon, Header, Menu)
	const feedTop = createElement("div", {"class": "tray"}, [feedIcon, feedHeader, feedMenu]);
	
	// ----- Left Section ----- //
	
	const feedWrapChildren = [feedTop] as HTMLElement[];
	
	// Feed Image
	if(post.img || post.origImg) {
		let feedImageImg;
		
		if(post.origImg) {
			feedImageImg = createElement("amp-img", {
				"layout": "responsive", "max-width": `${post.w}`, "width": `${post.w}`, "height": `${post.h}`,
				"src": post.origImg
			});
		} else if(post.id) {
			const imgPage = Math.ceil(post.id/1000);
			const imgPath = `${post.forum}/${imgPage}/${post.img}`;
			
			feedImageImg = createElement("amp-img", {
				"layout": "responsive", "max-width": `${post.w}`, "width": `${post.w}`, "height": `${post.h}`,
				"src": `https://us-east-1.linodeobjects.com/druidis-cdn/${imgPath}`
			});
		}
		
		if(feedImageImg) {
			const feedImageInner = createElement("div", {"class": "feed-image-inner"}, [feedImageImg]);
			const feedImage = createElement("div", {"class": "feed-image"}, [feedImageInner]);
			
			// Feed Link (Applies to Media & Title + Content)
			const feedHov = createElement("a", {"class": "feed-hov", "href": post.url}, [feedImage]);
			feedWrapChildren.push(feedHov);
		}
	}
	
	// Create Feed Wrap (not including "Extra")
	const feedWrap = createElement("div", {"class": "half-wrap"}, feedWrapChildren);
	
	// ----- Right Section ----- //
	
	// "Extra" Body
	const extraTitle = createElement("h2");
	extraTitle.innerHTML = post.title;
	
	const extraContent = createElement("p");
	extraContent.innerHTML = post.content;
	
	const extraBody = createElement("div", {"class": "extra-body"}, [extraTitle, extraContent]);
	const extraWrapLink = createElement("a", {"class": "feed-hov", href: post.url}, [extraBody]);
	
	// Link List
	const linkList = createElement("div", {"class": "linkList"});
	
	// Link the feed in the breadcrumb.
	if(post.forum && !isFeed) {
		const feedName = Forum.schema[post.forum];
		const crumb = createElement("a", {"class": "link", "href": `/feed/${feedName}`});
		crumb.innerHTML = feedName;
		linkList.appendChild(crumb);
	} else if(post.forum && isFeed) {
		const crumb = createElement("a", {"class": "link", "href": `/forum/${post.forum}`});
		crumb.innerHTML = post.forum;
		linkList.appendChild(crumb);
	}
	
	const extraFoot = createElement("div", {"class": "extra-foot"}, [linkList]);
	
	// Create "Extra" Wrapper
	const extraWrap = createElement("div", {"class": "extra-wrap"}, [extraWrapLink, extraFoot]);
	
	// Fulfill Post Container
	const feedContainer = createElement("div", {"class": "main-contain"}, [feedWrap, extraWrap]);
	
	return feedContainer;
}
