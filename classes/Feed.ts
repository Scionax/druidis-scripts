import Config from "./Config.ts";
import MainSection from "./MainSection.ts";
import Nav from "./Nav.ts";
import { buildPost, PostData } from "./Post.ts";

export default abstract class Feed {
	
	private static lastAutoload = 0;
	static currentFeed: string;
	static schema: { [forum: string]: string[] } = {"Entertainment":["Shows","Movies","People","Sports","Gaming","Virtual Reality","Tabletop Games","Music","Books"],"News":["World News","Social Issues","Politics","Environment","Business","Economic","Legal"],"Informative":["Technology","Science","Education","History"],"Lifestyle":["Fashion","Food","Health","Fitness","Social Life","Relationships","Recipes","Travel"],"Fun":["Funny","Ask","Cute","Forum Games","Cosplay"],"Creative":["Crafts","Artwork","Design","Writing"],"Home":["Shows","Movies","People","Sports","Gaming","Virtual Reality","Tabletop Games","Music","Books","World News","Social Issues","Environment","Politics","Business","Economic","Legal","Technology","Science","Education","History","Fashion","Food","Health","Fitness","Social Life","Relationships","Recipes","Travel","Funny","Cute","Ask","Cosplay","Forum Games","Crafts","Artwork","Design","Writing"]};
	
	static async fetchFeedPosts(feed: string, tag = "", pos = 0): Promise<{ tag: string, start: string, end: string, posts: PostData[]}> {
		const query = tag && pos ? `?tag=${tag}&p=${pos}` : '';
		const response = await Feed.fetchPosts(`feed/${feed}${query}`);
		return await response.json();
	}
	
	static async fetchPosts(call: string): Promise<Response> {
		
		console.log("--- Fetching Results ---");
		console.log(`${Config.url_api}/${call}`);
		
		return await fetch(`${Config.url_api}/${call}`, { headers:{
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
		
		if(!Array.isArray(rawPosts)) { return cachedPosts; }
		
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
		if(!Feed.currentFeed) { return; }
		await Feed.loadMore();
		const cachedPosts = Feed.getCachedPosts(Feed.currentFeed);
		Feed.displayPosts(Object.entries(cachedPosts));
	}
	
	static async loadMore() {
		const feed = Feed.currentFeed;
		
		// Determine what type of request to run based on any feed metadata we have:
		const meta = (window.localStorage.getItem(`feedMeta:${feed}`) || ":").split(":");
		const tag = meta[0];
		const pos = Number(meta[1]) || 0;
		
		// If we've reached the end of the feed, do not make any additional requests.
		const willFetch = tag && pos === -1 ? false : true;
		
		// Fetch recent feed data.
		if(willFetch) {
			try {
				const resp = await Feed.fetchFeedPosts(feed, tag, pos + 1);
				
				// If the feed tag has changed, we can clear the old data.
				if(tag !== resp.tag) {
					MainSection.clearAll();
					window.localStorage.setItem(`posts:${feed}`, `{}`);
				}
				
				// Display Results
				Feed.displayPosts(Object.entries(resp.posts));
				
				// Cache Results
				Feed.cachePosts(feed, resp.posts);
				
				const p = Number(resp.start) > 0 && Number(resp.end) <= Number(resp.start) ? "-1" : resp.end as string;
				window.localStorage.setItem(`feedMeta:${feed}`, `${resp.tag}:${p}`);
				
			} catch {
				console.error(`Error with response in feed: ${feed}`)
			}
		}
	}
	
	static allowAutoLoad(): boolean {
		
		// Make sure we have scroll room, otherwise auto-load might confuse the "bottom" as whatever immediately loads.
		if(Nav.mainHeight() < 1500) { return false; }
		
		// Only continue if the user's scroll is nearing the bottom of page.
		if(Nav.scrollDist() > 500) { return false; }
		
		// Don't allow auto-loads more than every 2.5 seconds.
		if(Date.now() - Feed.lastAutoload < 2500) { return false; }
		
		// Cache this autoload to prevent repeats.
		Feed.lastAutoload = Date.now();
		
		return true;
	}
	
	static displayPosts(pData: [string, PostData][]) {
		for (const [_key, post] of pData) {
			if(!post.id) { continue; }
			const postElement = buildPost(post);
			MainSection.append(postElement);
		}
	}
	
	// Auto-Load more posts.
	static autoLoad() {
		if(!Feed.allowAutoLoad()) { return; }
		Feed.loadMore();
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
		
		// Register the Auto-Load mechanics:
		window.addEventListener("scroll", Feed.autoLoad);
	}
}
