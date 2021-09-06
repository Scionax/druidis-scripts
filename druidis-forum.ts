/*
	// Forum Posts are cached locally to avoid extra retrieval calls:
	localStorage.getItem(`posts:${forum}`)
		- {{id}: Forum Post, {id}: Forum Post, {id}: Forum Post, ...}
	
	localStorage.getItem(`lastPull:${forum}`);
		- Timestamp of the last time this forum was retrieved.
		- If the timestamp exceeds the limit, it pulls a new set.
		- It will only search for IDs that are not already cached.
*/

abstract class Forum {
	
	static currentForum: string;
	static schema: { [forum: string]: string } = {"Business":"News","Economic":"News","Environment":"News","Legal":"News","Politics":"News","Social Issues":"News","World News":"News","Education":"Informative","History":"Informative","Science":"Informative","Technology":"Informative","Books":"Entertainment","Gaming":"Entertainment","Movies":"Entertainment","Music":"Entertainment","People":"Entertainment","Shows":"Entertainment","Sports":"Entertainment","Tabletop Games":"Entertainment","Virtual Reality":"Entertainment","Fashion":"Lifestyle","Fitness":"Lifestyle","Food":"Lifestyle","Health":"Lifestyle","Recipes":"Lifestyle","Relationships":"Lifestyle","Social Life":"Lifestyle","Travel":"Lifestyle","Ask":"Fun","Cosplay":"Fun","Cute":"Fun","Forum Games":"Fun","Funny":"Fun","Artwork":"Creative","Crafts":"Creative","Design":"Creative","Writing":"Creative"};
	
	// scanType
	//		0 = New Scan. Finds new content, starting from the very top.
	//		1 = Ascending Scan. Used to find recent updates when your cache is already well-updated. Uses High ID range.
	//		-1 = Descending Scan. Used for auto-loading, when user is scrolling down. Uses Low ID range.
	static async fetchPosts(forum: string, idHigh = -1, idLow = -1, scanType = 1): Promise<PostData[]> {
		
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
	
	static cachePosts(forum: string, postResponse: PostData[]): Record<string, PostData> {
		const cachedPosts = Forum.getCachedPosts(forum);
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
		if(!Forum.currentForum) { return; }
		
		// Forum Handling
		const forum = Forum.currentForum;
		
		let willFetch = false;
		let scanType = 0; // 0 = new, 1 = asc, -1 = desc
		
		// Verify that `forum` is valid.
		if(Forum.schema && !Forum.schema[forum]) {
			console.error(`"${forum}" forum was not detected. Cannot load.`);
			return;
		}
		
		// Get Cached Data
		let cachedPosts = Forum.getCachedPosts(forum);
		
		// Determine what type of Request to Run based on when the last "pull" was.
		const lastPull = Number(window.localStorage.getItem(`lastPull:${forum}`)) || 0;
		
		// If we haven't located cached IDs, then idHigh will be -1, and we must fore a fetch.
		const {idHigh, idLow} = Forum.getIdRangeOfCachedPosts(cachedPosts);
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
		
		// Fetch recent forum data.
		if(willFetch) {
			try {
				const postResponse = await Forum.fetchPosts(forum, idHigh, idLow, scanType);
				
				// Cache Results
				cachedPosts = Forum.cachePosts(forum, postResponse);
				window.localStorage.setItem(`lastPull:${forum}`, `${Nav.loadDate}`);
			} catch {
				console.error(`Error with response in forum: ${forum}`)
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
		
		// .forum
		if(Nav.urlSeg[0] === "forum" && Nav.urlSeg.length > 1) { Forum.currentForum = decodeURI(Nav.urlSeg[1]); } else { Forum.currentForum = ""; }
		if(!Forum.schema[Forum.currentForum]) { Forum.currentForum = ""; }
		
		// Asynchronous Load
		Forum.load();
	}
}
