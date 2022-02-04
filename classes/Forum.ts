/*
	Forum class uses certain shared methods from "Feed"
	
	// Forum Posts are cached locally to avoid extra retrieval calls:
	localStorage.getItem(`posts:${forum}`)
		- {{id}: Forum Post, {id}: Forum Post, {id}: Forum Post, ...}
	
	localStorage.getItem(`lastPull:${forum}`);
		- Timestamp of the last time this forum was retrieved.
		- If the timestamp exceeds the limit, it pulls a new set.
		- It will only search for IDs that are not already cached.
*/

import Config from "./Config.ts";
import Feed from "./Feed.ts";
import Nav from "./Nav.ts";
import { PostData } from "./Post.ts";

export default abstract class Forum {
	
	static schema: { [forum: string]: string } = {"Business":"News","Economic":"News","Environment":"News","Legal":"News","Politics":"News","Social Issues":"News","World News":"News","Education":"Informative","History":"Informative","Science":"Informative","Technology":"Informative","Books":"Entertainment","Gaming":"Entertainment","Movies":"Entertainment","Music":"Entertainment","People":"Entertainment","Shows":"Entertainment","Sports":"Entertainment","Tabletop Games":"Entertainment","Virtual Reality":"Entertainment","Fashion":"Lifestyle","Fitness":"Lifestyle","Food":"Lifestyle","Health":"Lifestyle","Recipes":"Lifestyle","Relationships":"Lifestyle","Social Life":"Lifestyle","Travel":"Lifestyle","Ask":"Fun","Cosplay":"Fun","Cute":"Fun","Forum Games":"Fun","Funny":"Fun","Artwork":"Creative","Crafts":"Creative","Design":"Creative","Writing":"Creative"};
	
	// scanType
	//		0 = New Scan. Finds new content, starting from the very top.
	//		1 = Ascending Scan. Used to find recent updates when your cache is already well-updated. Uses High ID range.
	//		-1 = Descending Scan. Used for auto-loading, when user is scrolling down. Uses Low ID range.
	static async fetchForumPosts(forum: string, idHigh = -1, idLow = -1, scanType = 1): Promise<PostData[]> {
		
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
		
		const response = await Feed.fetchPosts(`forum/${forum}${query}`);
		return await response.json();
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
		const forum = Feed.currentFeed;
		if(!forum) { return; }
		
		let willFetch = false;
		let scanType = 0; // 0 = new, 1 = asc, -1 = desc
		const cachedPosts = Feed.getCachedPosts(forum);
		
		// Determine what type of request to run based on when the last "pull" was.
		const lastPull = Number(window.localStorage.getItem(`lastPull:${forum}`)) || 0;
		
		// If we haven't located cached IDs, then idHigh will be -1, and we must force a fetch.
		const {idHigh, idLow} = Forum.getIdRangeOfCachedPosts(cachedPosts);
		if(idHigh === -1) { willFetch = true; }
		
		// If we haven't pulled in at least ten minutes, we'll make sure a new fetch happens.
		if(willFetch === false && Nav.loadDate - lastPull > Config.cacheDynamic) {
			willFetch = true;
			scanType = 1;
			console.log(`Haven't pulled in at least ten minutes. Forcing fetch.`);
			
			// If we haven't pulled in 60x that duration (5 mins > 5 hours), run a "new" scan (instead of ascending) to force newest reset.
			if(lastPull < Nav.loadDate - (60 * Config.cacheDynamic)) {
				scanType = 0;
				
				// Clear out stale data.
				console.log(`Clearing out stale forum data from ${forum}.`);
				window.localStorage.removeItem(`posts:${forum}`);
			}
		}
		
		// Fetch recent forum data.
		if(willFetch) {
			try {
				const postResponse = await Forum.fetchForumPosts(forum, idHigh, idLow, scanType);
				
				// Cache Results
				Feed.cachePosts(cachedPosts, forum, postResponse);
				window.localStorage.setItem(`lastPull:${forum}`, `${Nav.loadDate}`);
			} catch {
				console.error(`Error with response in forum: ${forum}`)
			}
		}
		
		// Display Cached Data
		Feed.displayPosts(Object.entries(cachedPosts).reverse());
	}
	
	// Auto-Load more posts.
	static async autoLoad() {
		if(!Feed.allowAutoLoad()) { return; }
		
		// Get Relevant Status Information
		const forum = Feed.currentFeed;
		const cachedPosts = Feed.getCachedPosts(forum);
		const {idHigh, idLow} = Forum.getIdRangeOfCachedPosts(cachedPosts);
		
		// Don't auto-load if we've reached the lower limit:
		if(idLow <= 1) { return; }
		
		// Run the Auto-Loader
		const postResponse = await Forum.fetchForumPosts(forum, idHigh, idLow, -1);
		
		// Cache Results
		Feed.cachePosts(cachedPosts, forum, postResponse);
		window.localStorage.setItem(`lastPull:${forum}`, `${Nav.loadDate}`);
		
		// Display Posts
		Feed.displayPosts(Object.entries(postResponse));
	}
	
	static initialize() {
		
		// .forum
		if(Nav.urlSeg[0] === "forum" && Nav.urlSeg.length > 1) { Feed.currentFeed = decodeURI(Nav.urlSeg[1]); } else { Feed.currentFeed = ""; }
		if(!Forum.schema[Feed.currentFeed]) { Feed.currentFeed = ""; }
		
		// Asynchronous Load
		Forum.load();
		
		// Register the Auto-Load mechanics:
		window.addEventListener("scroll", Forum.autoLoad);
	}
}
