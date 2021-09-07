
abstract class Feed {
	
	static currentFeed: string;
	static schema: { [forum: string]: string[] } = {"Entertainment":["Shows","Movies","People","Sports","Gaming","Virtual Reality","Tabletop Games","Music","Books"],"News":["World News","Social Issues","Politics","Environment","Business","Economic","Legal"],"Informative":["Technology","Science","Education","History"],"Lifestyle":["Fashion","Food","Health","Fitness","Social Life","Relationships","Recipes","Travel"],"Fun":["Funny","Ask","Cute","Forum Games","Cosplay"],"Creative":["Crafts","Artwork","Design","Writing"],"Home":["Shows","Movies","People","Sports","Gaming","Virtual Reality","Tabletop Games","Music","Books","World News","Social Issues","Environment","Politics","Business","Economic","Legal","Technology","Science","Education","History","Fashion","Food","Health","Fitness","Social Life","Relationships","Recipes","Travel","Funny","Cute","Ask","Cosplay","Forum Games","Crafts","Artwork","Design","Writing"]};
	
	static async fetchFeedPosts(feed: string, tag = "", pos = 0): Promise<{ tag: string, start: string, end: string, post: PostData[]}> {
		const query = tag && pos ? `?tag=${tag}&p=${pos}` : '';
		const response = await Feed.fetchPosts(`/feed/${feed}${query}`);
		return await response.json();
	}
	
	static async fetchPosts(call: string): Promise<Response> {
		
		console.log("--- Fetching Results ---");
		console.log(`${API.url}/${call}`);
		
		return await fetch(`${API.url}/${call}`, { headers:{
			'Content-Type': 'application/json',
			'Credentials': 'include', // Needed or Cookies will not be sent.
			// 'Content-Type': 'application/x-www-form-urlencoded',
		}});
	}
	
	static getCachedPosts(feed: string): { [id: string]: PostData } {
		const cachedPosts = window.localStorage.getItem(`posts:${feed}`);
		
		if(cachedPosts) {
			try {
				return JSON.parse(cachedPosts);
			} catch {
				return {};
			}
		}
		
		return {};
	}
	
	static cachePosts(feed: string, postResponse: PostData[]): Record<string, PostData> {
		const cachedPosts = Feed.getCachedPosts(feed);
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
				window.localStorage.setItem(`posts:${feed}`, JSON.stringify(cachedPosts));
			}
		}
		
		return cachedPosts;
	}
	
	static async load() {
		const feed = Feed.currentFeed;
		if(!feed) { return; }
		
		// Feed Handling
		let willFetch = false;
		
		// Get Cached Data
		let cachedPosts = Feed.getCachedPosts(feed);
		const numPosts = Object.keys(cachedPosts).length || 0;
		if(numPosts === 0) { willFetch = true; }
		
		// Determine what type of request to run based on any feed metadata we have:
		const meta = (window.localStorage.getItem(`feedMeta:${feed}`) || ":").split(":");
		const tag = meta[0];
		const pos = Number(meta[1]) || 0;
		
		// If we've reached the end of the feed, do not make any additional requests.
		if(pos === -1) { willFetch = false; }
		
		// Fetch recent feed data.
		if(willFetch) {
			try {
				const resp = await Feed.fetchFeedPosts(feed, tag, pos + 1);
				
				// If the feed tag has changed, we can clear the old data.
				if(tag !== resp.tag) {
					window.localStorage.setItem(`posts:${feed}`, `{}`);
				}
				
				// Cache Results
				cachedPosts = Feed.cachePosts(feed, resp.post);
				window.localStorage.setItem(`feedMeta:${feed}`, `${resp.tag}:${resp.end}`);
				
			} catch {
				console.error(`Error with response in feed: ${feed}`)
			}
		}
		
		// Display Cached Data
		for (const [_key, post] of Object.entries(cachedPosts)) {
			if(!post.id) { return; }
			const postElement = buildPost(post);
			Webpage.appendToMain(postElement);
		}
		
		/*
			// Procedure on scrolling:
			- Check if the user scrolls near an unknown ID range / non-cached results.
			- Load the most recent 10 posts in the forum.
			- Update the ID range that the user has retrieved.
		*/
	}
	
	static initialize() {
		const base = Nav.urlSeg[0];
		
		if(base === "") {
			Feed.currentFeed = "Home";
		} else if(base === "feed") {
			Feed.currentFeed = Nav.urlSeg.length > 1 ? decodeURI(Nav.urlSeg[1]) : "Home";
		}
		
		if(!Feed.schema[Feed.currentFeed]) { Feed.currentFeed = ""; }
		
		Feed.load(); // Asynchronous Load
	}
}
