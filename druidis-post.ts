
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
		
		for (const [feed, forums] of Object.entries(Feed.schema)) {
			
			const option = document.createElement("option") as HTMLOptionElement;
			option.value = feed;
			option.text = feed;
			option.setAttribute("style", "font-weight: bold; font-size: 1.2em;");
			sel.add(option);
			
			for(let i = 0; i < forums.length; i++) {
				const option = document.createElement("option") as HTMLOptionElement;
				option.value = forums[i];
				option.text = ` - ${forums[i]}`;
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
			if(!Forum.schema || !Forum.schema[forumElement.value]) { alert("Error: The forum selected is considered invalid."); return; }
			
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
