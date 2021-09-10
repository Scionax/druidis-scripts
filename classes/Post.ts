import Dom from "./Dom.ts";
import Forum from "./Forum.ts";

export interface PostData {
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
export function buildPost(post: PostData, isFeed = false) {
	
	// --------------------- //
	// ----- Left Tray ----- //
	// --------------------- //
	
	// Feed Icon
	const feedIconImg = Dom.createElement("amp-img", {"width": "48", "height": "48", "src": `/public/images/logo/logo-48.png`});
	const feedIcon = Dom.createElement("div", {"class": "tray-icon"}, [feedIconImg]);
	
	// Feed Header
	const feedHeaderTitle = Dom.createElement("div", {"class": "h3"});
	feedHeaderTitle.innerHTML = "Author Name or Title";
	
	const feedHeaderSubNote = Dom.createElement("div", {"class": "note2"});
	
	try {
		const urlInfo = new URL(post.url);
		feedHeaderSubNote.innerHTML = `Source: ${urlInfo.hostname}`;
	} catch {
		// Do nothing
	}
	
	const feedHeader = Dom.createElement("div", {"class": "tray-mid"}, [feedHeaderTitle, feedHeaderSubNote]);
	
	// Feed Menu
	const feedMenuInner = Dom.createElement("div", {"class": "tray-menu-inner"});
	feedMenuInner.innerHTML = "&#8226;&#8226;&#8226;";
	
	const feedMenu = Dom.createElement("div", {"class": "tray-menu"}, [feedMenuInner]);
	
	// Feed Top (full top line; includes Icon, Header, Menu)
	const feedTop = Dom.createElement("div", {"class": "tray"}, [feedIcon, feedHeader, feedMenu]);
	
	// ----- Left Section ----- //
	
	const feedWrapChildren = [feedTop] as HTMLElement[];
	
	// Feed Image
	if(post.img || post.origImg) {
		let feedImageImg;
		
		if(post.origImg) {
			feedImageImg = Dom.createElement("amp-img", {
				"layout": "responsive", "max-width": `${post.w}`, "width": `${post.w}`, "height": `${post.h}`,
				"src": post.origImg
			});
		} else if(post.id) {
			const imgPage = Math.ceil(post.id/1000);
			const imgPath = `${post.forum}/${imgPage}/${post.img}`;
			
			feedImageImg = Dom.createElement("amp-img", {
				"layout": "responsive", "max-width": `${post.w}`, "width": `${post.w}`, "height": `${post.h}`,
				"src": `https://us-east-1.linodeobjects.com/druidis-cdn/${imgPath}`
			});
		}
		
		if(feedImageImg) {
			const feedImageInner = Dom.createElement("div", {"class": "feed-image-inner"}, [feedImageImg]);
			const feedImage = Dom.createElement("div", {"class": "feed-image"}, [feedImageInner]);
			
			// Feed Link (Applies to Media & Title + Content)
			const feedHov = Dom.createElement("a", {"class": "feed-hov", "href": post.url}, [feedImage]);
			feedWrapChildren.push(feedHov);
		}
	}
	
	// Create Feed Wrap (not including "Extra")
	const feedWrap = Dom.createElement("div", {"class": "half-wrap"}, feedWrapChildren);
	
	// ----- Right Section ----- //
	
	// "Extra" Body
	const extraTitle = Dom.createElement("h2");
	extraTitle.innerHTML = post.title;
	
	const extraContent = Dom.createElement("p");
	extraContent.innerHTML = post.content;
	
	const extraBody = Dom.createElement("div", {"class": "extra-body"}, [extraTitle, extraContent]);
	const extraWrapLink = Dom.createElement("a", {"class": "feed-hov", href: post.url}, [extraBody]);
	
	// Link List
	const linkList = Dom.createElement("div", {"class": "linkList"});
	
	// Link the feed in the breadcrumb.
	if(post.forum && !isFeed) {
		const feedName = Forum.schema[post.forum];
		const crumb = Dom.createElement("a", {"class": "link", "href": `/feed/${feedName}`});
		crumb.innerHTML = feedName;
		linkList.appendChild(crumb);
	} else if(post.forum && isFeed) {
		const crumb = Dom.createElement("a", {"class": "link", "href": `/forum/${post.forum}`});
		crumb.innerHTML = post.forum;
		linkList.appendChild(crumb);
	}
	
	const extraFoot = Dom.createElement("div", {"class": "extra-foot"}, [linkList]);
	
	// Create "Extra" Wrapper
	const extraWrap = Dom.createElement("div", {"class": "extra-wrap"}, [extraWrapLink, extraFoot]);
	
	// Fulfill Post Container
	const feedContainer = Dom.createElement("div", {"class": "main-contain"}, [feedWrap, extraWrap]);
	
	return feedContainer;
}
