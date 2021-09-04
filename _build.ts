
				
abstract class Feed {
	
	static forum: string;
	static schema: { [id: string]: { children?: string[], parent?: string } } = {"News":{"children":["Business","Economic","Environment","Legal","Politics","Social Issues","World News"]},"Business":{"parent":"News"},"Economic":{"parent":"News"},"Environment":{"parent":"News"},"Legal":{"parent":"News"},"Politics":{"parent":"News"},"Social Issues":{"parent":"News"},"World News":{"parent":"News"},"Informative":{"children":["Education","History","Science","Technology"]},"Education":{"parent":"Informative"},"History":{"parent":"Informative"},"Science":{"parent":"Informative"},"Technology":{"parent":"Informative"},"Entertainment":{"children":["Books","Gaming","Movies","Music","People","Shows","Sports","Tabletop Games","Virtual Reality"]},"Books":{"parent":"Entertainment"},"Gaming":{"parent":"Entertainment"},"Movies":{"parent":"Entertainment"},"Music":{"parent":"Entertainment"},"People":{"parent":"Entertainment"},"Shows":{"parent":"Entertainment"},"Sports":{"parent":"Entertainment"},"Tabletop Games":{"parent":"Entertainment"},"Virtual Reality":{"parent":"Entertainment"},"Lifestyle":{"children":["Fashion","Fitness","Food","Health","Recipes","Social Life","Relationships","Travel"]},"Fashion":{"parent":"Lifestyle"},"Fitness":{"parent":"Lifestyle"},"Food":{"parent":"Lifestyle"},"Health":{"parent":"Lifestyle"},"Recipes":{"parent":"Lifestyle"},"Relationships":{"parent":"Lifestyle"},"Social Life":{"parent":"Lifestyle"},"Travel":{"parent":"Lifestyle"},"Fun":{"children":["Ask","Cosplay","Cute","Forum Games","Funny"]},"Ask":{"parent":"Fun"},"Cosplay":{"parent":"Fun"},"Cute":{"parent":"Fun"},"Forum Games":{"parent":"Fun"},"Funny":{"parent":"Fun"},"Creative":{"children":["Artwork","Crafts","Design","Writing"]},"Artwork":{"parent":"Creative"},"Crafts":{"parent":"Creative"},"Design":{"parent":"Creative"},"Writing":{"parent":"Creative"}};
	
	// scanType
	//		0 = New Scan. Finds new content, starting from the very top.
	//		1 = Ascending Scan. Used to find recent updates when your cache is already well-updated. Uses High ID range.
	//		-1 = Descending Scan. Used for auto-loading, when user is scrolling down. Uses Low ID range.
	static async fetchForumPost(forum: string, idHigh = -1, idLow = -1, scanType = 1): Promise<PostData[]> {
		
		// Build Query String
		let query;
		
		if(scanType === 1) {
			query = `?s=asc`;
			if(idHigh > -1) { query += `&h=${idHigh}`; } 
		} else if(scanType === -1) {
			query = `?s=desc`;
			if(idLow > -1) { query += `&l=${idLow}`; }
		} else {
			query = (idHigh > -1) ? `?h=${idHigh}` : "";
		}
		
		console.log("--- Fetching Results ---");
		console.log(`${API.url}/forum/${forum}${query}`);
		
		const response = await fetch(`${API.url}/forum/${forum}${query}`, { headers:{
			'Content-Type': 'application/json',
			'Credentials': 'include', // Needed or Cookies will not be sent.
			// 'Content-Type': 'application/x-www-form-urlencoded',
		}});
		
		return await response.json();
	}

	static getCachedPosts(forum: string): { [id: string]: PostData } {
		const cachedPosts = window.localStorage.getItem(`posts:${forum}`);
		
		if(cachedPosts) {
			try {
				return JSON.parse(cachedPosts);
			} catch {
				return {};
			}
		}
		
		return {};
	}
	
	static cacheForumPosts(forum: string, postResponse: PostData[]): Record<string, PostData> {
		const cachedPosts = Feed.getCachedPosts(forum);
		const rawPosts = postResponse ? postResponse : [];
		
		if(!Array.isArray(rawPosts)) { return {}; }
		
		// Loop through all entries in the post data, and append to cached posts.
		for(let i = 0; i < rawPosts.length; i++) {
			const rawPost = rawPosts[i];
			
			// Make sure there's a valid ID
			const id = Number(rawPost.id || 0);
			if(!id) { continue; }
			
			// Check if Cached Posts already contains this entry. Add if it doesn't.
			if(!cachedPosts[id]) {
				cachedPosts[id] = rawPost;
				window.localStorage.setItem(`posts:${forum}`, JSON.stringify(cachedPosts));
			}
		}
		
		return cachedPosts;
	}

	static getIdRangeOfCachedPosts(cachedPosts: Record<string, PostData>) {
		let high = -1;
		let low = Infinity;
		
		for (const [key, post] of Object.entries(cachedPosts)) {
			if(!post.id) { continue; }
			const num = Number(key);
			if(num > high) { high = num; }
			if(num < low) { low = num; }
		}
		
		return {idHigh: high, idLow: low};
	}
	
	static async load() {
		if(!Feed.forum) { return; }
		
		// Forum Handling
		const forum = Feed.forum;
		
		let willFetch = false;
		let scanType = 0; // 0 = new, 1 = asc, -1 = desc
		
		// Verify that `forum` is valid.
		if(Feed.schema && !Feed.schema[forum]) {
			console.error(`"${forum}" forum was not detected. Cannot load feed.`);
			return;
		}
		
		// Get Cached Data
		let cachedPosts = Feed.getCachedPosts(forum);
		
		// Determine what type of Request to Run based on when the last "pull" was.
		const lastPull = Number(window.localStorage.getItem(`lastPull:${forum}`)) || 0;
		
		// If we haven't located cached IDs, then idHigh will be -1, and we must fore a fetch.
		const {idHigh, idLow} = Feed.getIdRangeOfCachedPosts(cachedPosts);
		if(idHigh === -1) { willFetch = true; }
		
		// If we haven't pulled in at least five minutes, we'll make sure a new fetch happens.
		if(willFetch === false && Nav.loadDate - lastPull > 300) {
			willFetch = true;
			scanType = 1;
			
			// If we haven't pulled in 12 hours, run a "new" scan (instead of ascending) to force newest reset.
			if(lastPull < Nav.loadDate - (60 * 60 * 24)) {
				scanType = 0;
				
				// Clear out stale data.
				window.localStorage.removeItem(`posts:${forum}`);
			}
		}
		
		// Fetch recent forum feed data.
		if(willFetch) {
			try {
				const postResponse = await Feed.fetchForumPost(forum, idHigh, idLow, scanType);
				
				// Cache Results
				cachedPosts = Feed.cacheForumPosts(forum, postResponse);
				window.localStorage.setItem(`lastPull:${forum}`, `${Nav.loadDate}`);
			} catch {
				console.error(`Error with response in forum: ${forum}`)
			}
		}
		
		// Display Cached Data
		for (const [_key, post] of Object.entries(cachedPosts)) {
			if(!post.id) { return; }
			const feedElement = buildPost(post);
			Webpage.addBlock(feedElement);
		}
		
		/*
			// Procedure on scrolling:
			- Check if the user scrolls near an unknown ID range / non-cached results.
			- Load the most recent 10 posts in the forum.
			- Update the ID range that the user has retrieved.
		*/
	}
	
	static initialize() {
		
		// .forum
		if(Nav.urlSeg[0] === "forum" && Nav.urlSeg.length > 1) { Feed.forum = decodeURI(Nav.urlSeg[1]); } else { Feed.forum = ""; }
		if(!Feed.schema[Feed.forum]) { Feed.forum = ""; }
		
		// Asynchronous Load
		Feed.load();
	}
}

				
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
				
// Data Structure for an OpenGraph Page
class OpenGraphMetaData {
	
	// Core Values
	url: string;
	title: string;
	image: OpenGraphMetaVisual;
	video: OpenGraphMetaVisual;
	// audio: OpenGraphMetaAudio;
	content: string;
	comment: string;
	
	// Miscellaneous
	determiner: string;
	locale: string
	site_name: string;
	type: string;
	mediaClass: string;
	
	constructor() {
		this.url = "";
		this.title = "";
		this.image = new OpenGraphMetaVisual();
		this.video = new OpenGraphMetaVisual();
		// this.audio = new OpenGraphMetaAudio();
		this.content = "";
		this.comment = "";
		
		// Miscellaneous
		this.determiner = "";			// Word that appears before object's title in a sentence. Enum of (a, an, the, "", auto).
		this.locale = "";
		this.site_name = "";
		this.type = "";					// video, article, book, profile, website (default)
		this.mediaClass = "";			// Contains data related to the 'type' property.
	}
	
	async getImageSize(url: string) {
		const img = new Image();
		img.src = url;
		await img.decode();
		this.image.width = img.width;
		this.image.height = img.height;
	}
}

// OpenGraphMetaVisual: Data Structure for Images and Videos
class OpenGraphMetaVisual {
	
	url: string;
	mimeType: string;
	width: number;
	height: number;
	alt: string;
	locked: boolean
	
	constructor() {
		this.url = "";
		this.mimeType = "";
		this.width = 0;
		this.height = 0;
		this.alt = "";
		this.locked = false;
	}
	
	setUrl(url: string) { this.url = url; }
	setMimeType(mimeType: string) { this.mimeType = mimeType; }
	setWidth(width: number) { this.width = width; }
	setHeight(height: number) { this.height = height; }
	setAlt(alt: string) { this.alt = alt; }
	
	lock() { this.locked = true; }
	
	isSmall() {
		if(this.width && this.width < 300) { return true; }
		if(this.height && this.height < 200) { return true; }
		return false;
	}
}

abstract class OpenGraph {
	
	static postData: PostData;
	
	static async fetchData(url: string) {
		
		// Fetch the HTML from a given URL
		const response = fetch(`${API.url}/data/html?url=${encodeURIComponent(url)}`, { headers:{
			'Content-Type': 'application/json',
			'Credentials': 'include', // Needed or Cookies will not be sent.
			// 'Content-Type': 'application/x-www-form-urlencoded',
		}});
		const data = await (await response).json();
		
		// Parse the HTML into a valid DOM
		let pass = false;
		const metaData = new OpenGraphMetaData();
		
		try {
			const dom = new DOMParser().parseFromString(data, "text/html");
			await OpenGraph.parseDocument(dom, metaData); // Parse the DOM for it's OpenGraph Metadata. Updates `metaData`
			pass = true;
			
		} catch (error) {
			pass = false;
			console.error(error.message);
		}
		
		// If the HTML was parsed successfully:
		if(pass) {
			
			// Build the Post Variable
			OpenGraph.postData = {
				url: metaData.url,
				title: metaData.title,
				content: metaData.content,
				origImg: metaData.image.url,
				w: metaData.image.width,
				h: metaData.image.height,
			};
			
			const feedElement = buildPost(OpenGraph.postData);
			
			// Attach Created Elements to Feed Section
			Webpage.clearBlock("main-contain");
			Webpage.addBlock(feedElement);
		}
	}
	
	static async parseDocument(doc: Document, metaData: OpenGraphMetaData) {
		
		// Trackers
		let scanForType = "";	// As we loop through meta tags, some are based on the last ones located (such as 'image' and 'video'), so track the 'current' set.
		const metaElements = doc.getElementsByTagName("meta");
		
		// Loop through every meta value.
		for(let i = 0; i < metaElements.length; i++) {
			
			// Get the MetaTag Data
			const metaVals = metaElements[i];
			const metaName = metaVals.getAttribute("property") ? metaVals.getAttribute("property") : metaVals.name;
			if(!metaName || !metaVals.content) { continue; }
			const metaContent = metaVals.content;
			
			// Split to detect sets:
			const s = metaName.split(":");		// Splits into 2 or 3 parts. Ex: "og:image:width" -> ['og', 'image', 'width']
			const name = s[1];
			const nameProp = s[2];
			
			// Apply Detected Content to Values
			if(name == "url") { metaData.url = metaContent; scanForType = ""; }
			if(name == "title") { metaData.title = metaContent; scanForType = ""; }
			if(name == "description") { metaData.content = metaContent.substring(0, 256); scanForType = ""; }
			if(name == "determiner") { metaData.determiner = metaContent; scanForType = ""; }
			if(name == "locale") { metaData.locale = metaContent; scanForType = ""; }
			if(name == "site_name") { metaData.site_name = metaContent; scanForType = ""; }
			
			// Special Image & Video Behaviors
			// If the visual (image or video) is locked, it cannot be changed. This happens because we've cycled to the NEXT image or video.
			if((name == "image" || name == "video") && !metaData[name].locked) {
				
				// If there is a property attached to the name (such as image.width), then we need to consider the previous meta tag.
				if(nameProp) {
					if(nameProp == "url") { metaData[name].setUrl(metaContent); }
					else if(nameProp == "secure_url" && !metaData[name].url) { metaData[name].setUrl(metaContent); }
					else if(nameProp == "type") { metaData[name].setMimeType(metaContent); }
					else if(nameProp == "width") { metaData[name].setWidth(Number(metaContent)); }
					else if(nameProp == "height") { metaData[name].setHeight(Number(metaContent)); }
					else if(nameProp == "alt") { metaData[name].setAlt(metaContent); }
				} else {
					
					// Make sure we didn't switch to a new visual (image or video). If we did, lock this one so it can't change now.
					if(scanForType == name) { metaData[name].lock(); }
					
					// Otherwise, assign the URL.
					else { metaData[name].setUrl(metaContent); }
				}
				
				scanForType = name;	// The next tags might be properties of the same metatag type (image or video), so we have to track this.
			}
		}
		
		// Set Image Size Correctly
		if(metaData.image && metaData.image.url) {
			await metaData.getImageSize(metaData.image.url);
		}
	}
}

abstract class PostPage {
	static clearForm() {
		
		// Reset Input Fields
		const submitElement: HTMLInputElement = document.getElementById("postSubmit") as HTMLInputElement;
		const urlElement: HTMLInputElement = document.getElementById("postUrl") as HTMLInputElement;
		const forumElement: HTMLInputElement = document.getElementById("postForum") as HTMLInputElement;
		
		urlElement.value = "";
		forumElement.value = "";
		submitElement.value = "Submit Post";
		
		Webpage.clearBlock("main-contain");
	}
	
	// Populate the Forum Selection Input
	static populateForumSelect() {
		const sel: HTMLSelectElement = document.getElementById("postForum") as HTMLSelectElement;
		
		for (const [key, fData] of Object.entries(Feed.schema)) {
			
			// Only Find the Parent Forums
			if(typeof fData.parent !== "undefined") { continue; }
			
			const option = document.createElement("option") as HTMLOptionElement;
			option.value = key;
			option.text = key;
			option.setAttribute("style", "font-weight: bold; font-size: 1.2em;");
			sel.add(option);
			
			if(typeof fData.children === "undefined") { continue; }
			
			for(let i = 0; i < fData.children.length; i++) {
				const option = document.createElement("option") as HTMLOptionElement;
				option.value = fData.children[i];
				option.text = ` - ${fData.children[i]}`;
				sel.add(option);
			}
		}
	}
	
	static initialize() {
		PostPage.populateForumSelect();
		
		const postUrl = document.getElementById("postUrl") as HTMLInputElement;
		const postSubmit = document.getElementById("postSubmit") as HTMLInputElement;
		
		postUrl.addEventListener("click", () => { postUrl.value = ""; });
		
		postUrl.addEventListener("paste", () => {
			
			// We need a timeout here, since we actually want to check AFTER the paste event.
			setTimeout(function() {
				const urlInput = document.getElementById("postUrl") as HTMLInputElement;
				const urlInfo = new URL(urlInput.value);
				try {
					if(urlInfo.pathname !== "/") {
						OpenGraph.fetchData(urlInput.value);
					}
				} catch {
					console.error("Unable to make a URL.", urlInput.value);
				}
			}, 10);
		});
		
		postSubmit.addEventListener("click", async () => {
			if(!API.url) { console.error("Unable to post. `API.url` is not set."); return; }
			
			const submitElement = postSubmit as HTMLInputElement;
			
			// Prevent re-submissions.
			if(submitElement.value !== "Submit Post") { return; }
			
			// Make sure there is content to submit:
			const urlElement = document.getElementById("postUrl") as HTMLInputElement;
			const forumElement = document.getElementById("postForum") as HTMLSelectElement;
			
			if(!urlElement.value) { alert("Must provide a URL."); return; }
			if(!forumElement.value) { alert("Must select a forum to post to."); return; }
			
			// Make sure the post content is loaded:
			if(!OpenGraph.postData) { alert("Submission must contain a valid post."); return; }
			if(!OpenGraph.postData.title) { alert("Requires a title."); return; }
			if(!OpenGraph.postData.origImg) { alert("Requires a valid image."); return; }
			if(!OpenGraph.postData.w || !OpenGraph.postData.h) { alert("Error: The system failed to identify image width and height."); return; }
			
			// Make sure the forum is valid.
			if(!Feed.schema || !Feed.schema[forumElement.value]) { alert("Error: The forum selected is considered invalid."); return; }
			
			// Assign the forum to our post content:
			OpenGraph.postData.forum = forumElement.value;
			
			submitElement.value = "Submitting...";
			
			// Submit Content to API
			const json = await API.callAPI("/post", OpenGraph.postData as unknown as Record<string, unknown>);
			
			Alerts.error(!json, "Error: Post submission response was empty or invalid.", true);
			if(Alerts.hasAlerts()) { Alerts.displayAlerts(); return; }
			
			// Clear All Submission Contenet
			PostPage.clearForm();
			
			console.log(json);
		});
	}
}

				
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
		
		if(base === "") { Feed.initialize(); }
		else if(base === "forum" && Nav.urlSeg[1]) { Feed.initialize(); }
		else if(Nav.innerLoad) { Nav.loadInnerHtml(); }
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
function buildPost(post: PostData) {
	
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
	
	// Check for forum parent. If present, link the parent in the breadcrumb.
	const sch = post.forum ? Feed.schema[post.forum] : null;
	
	if(sch && sch.parent && sch.parent !== Feed.forum) {
		const crumb = createElement("a", {"class": "link", "href": `/forum/${sch.parent}`});
		crumb.innerHTML = sch.parent;
		linkList.appendChild(crumb);
	}
	
	if(post.forum && post.forum !== Feed.forum) {
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
