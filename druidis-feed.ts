
abstract class Feed {
	
	static currentFeed: string;
	static schema: { [forum: string]: string[] } = {"Entertainment":["Shows","Movies","People","Sports","Gaming","Virtual Reality","Tabletop Games","Music","Books"],"News":["World News","Social Issues","Politics","Environment","Business","Economic","Legal"],"Informative":["Technology","Science","Education","History"],"Lifestyle":["Fashion","Food","Health","Fitness","Social Life","Relationships","Recipes","Travel"],"Fun":["Funny","Ask","Cute","Forum Games","Cosplay"],"Creative":["Crafts","Artwork","Design","Writing"],"Home":["Shows","Movies","People","Sports","Gaming","Virtual Reality","Tabletop Games","Music","Books","World News","Social Issues","Environment","Politics","Business","Economic","Legal","Technology","Science","Education","History","Fashion","Food","Health","Fitness","Social Life","Relationships","Recipes","Travel","Funny","Cute","Ask","Cosplay","Forum Games","Crafts","Artwork","Design","Writing"]};
	
	static async fetchPosts(feed: string, page = 0): Promise<PostData[]> {
		
		// Build Query String
		const query = page ? `?p=${page}` : '';
		
		console.log("--- Fetching Results ---");
		console.log(`${API.url}/feed/${feed}${query}`);
		
		const response = await fetch(`${API.url}/feed/${feed}${query}`, { headers:{
			'Content-Type': 'application/json',
			'Credentials': 'include', // Needed or Cookies will not be sent.
			// 'Content-Type': 'application/x-www-form-urlencoded',
		}});
		
		return await response.json();
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
		const cachedPosts = Forum.getCachedPosts(feed);
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
	
	// TODO: Feed doesn't work like this:
	// TODO: Feed doesn't work like this:
	// TODO: Feed doesn't work like this:
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
	
	// TODO: Need to update this function to work with feeds.
	// TODO: Need to update this function to work with feeds.
	// TODO: Need to update this function to work with feeds.
	static async load() {
		const feed = Feed.currentFeed;
		console.log("load feed", feed);
		if(!feed) { return; }
		
		// Feed Handling
		let willFetch = false;
		let page = 0;
		// let scanType = 0; // 0 = new, 1 = asc, -1 = desc
		
		// // Verify that `feed` is valid.
		// if(Feed.schema && !Feed.schema[feed]) {
		// 	console.error(`"${feed}" feed was not detected. Cannot load.`);
		// 	return;
		// }
		
		// Get Cached Data
		let cachedPosts = Feed.getCachedPosts(feed);
		
		// // Determine what type of Request to Run based on when the last "pull" was.
		// const lastPull = Number(window.localStorage.getItem(`lastPull:${feed}`)) || 0;
		
		// // If we haven't located cached IDs, then idHigh will be -1, and we must fore a fetch.
		// const {idHigh, idLow} = Feed.getIdRangeOfCachedPosts(cachedPosts);
		// if(idHigh === -1) { willFetch = true; }
		
		// // If we haven't pulled in at least five minutes, we'll make sure a new fetch happens.
		// if(willFetch === false && Nav.loadDate - lastPull > 300) {
		// 	willFetch = true;
		// 	scanType = 1;
			
		// 	// If we haven't pulled in 12 hours, run a "new" scan (instead of ascending) to force newest reset.
		// 	if(lastPull < Nav.loadDate - (60 * 60 * 24)) {
		// 		scanType = 0;
				
		// 		// Clear out stale data.
		// 		window.localStorage.removeItem(`posts:${feed}`);
		// 	}
		// }
		
		// TODO: REMOVE
		willFetch = true;
		
		// Fetch recent feed data.
		if(willFetch) {
			try {
				const postResponse = await Feed.fetchPosts(feed, page);
				
				// Cache Results
				cachedPosts = Feed.cachePosts(feed, postResponse);
				window.localStorage.setItem(`lastPull:${feed}`, `${Nav.loadDate}`);
			} catch {
				console.error(`Error with response in feed: ${feed}`)
			}
		}
		
		// Display Cached Data
		for (const [_key, post] of Object.entries(cachedPosts)) {
			if(!post.id) { return; }
			const postElement = buildPost(post);
			Webpage.addBlock(postElement);
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
