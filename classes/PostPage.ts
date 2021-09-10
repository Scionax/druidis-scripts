import Alerts from "./Alerts.ts";
import API from "./API.ts";
import Feed from "./Feed.ts";
import Forum from "./Forum.ts";
import OpenGraph from "./OpenGraph.ts";
import Webpage from "./Web.ts";

export default abstract class PostPage {
	static clearForm() {
		
		// Reset Input Fields
		const submitElement: HTMLInputElement = document.getElementById("extSubmit") as HTMLInputElement;
		const urlElement: HTMLInputElement = document.getElementById("extUrl") as HTMLInputElement;
		const forumElement: HTMLInputElement = document.getElementById("extForum") as HTMLInputElement;
		
		urlElement.value = "";
		forumElement.value = "";
		submitElement.value = "Submit Post";
		
		Webpage.clearBlockFromMain("main-contain");
	}
	
	// Populate the Forum Selection Input
	static populateForumSelect(selectId: string) {
		const sel: HTMLSelectElement = document.getElementById(selectId) as HTMLSelectElement;
		
		for (const [feed, forums] of Object.entries(Feed.schema)) {
			if(feed === "Home") { continue; }
			
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
		PostPage.populateForumSelect("extForum");
		PostPage.populateForumSelect("intForum");
		
		const extUrl = document.getElementById("extUrl") as HTMLInputElement;
		const extSubmit = document.getElementById("extSubmit") as HTMLInputElement;
		const intSubmit = document.getElementById("intSubmit") as HTMLInputElement;
		
		extUrl.addEventListener("click", () => { extUrl.value = ""; });
		
		extUrl.addEventListener("paste", () => {
			
			// We need a timeout here, since we actually want to check AFTER the paste event.
			setTimeout(function() {
				const elUrl = document.getElementById("extUrl") as HTMLInputElement;
				const urlInfo = new URL(elUrl.value);
				try {
					if(urlInfo.pathname !== "/") {
						OpenGraph.fetchData(elUrl.value);
					}
				} catch {
					console.error("Unable to make a URL.", elUrl.value);
				}
			}, 10);
		});
		
		extSubmit.addEventListener("click", async () => {
			const submitElement = extSubmit as HTMLInputElement;
			
			// Prevent re-submissions.
			if(submitElement.value !== "Submit Post") { return; }
			
			// Make sure there is content to submit:
			const urlElement = document.getElementById("extUrl") as HTMLInputElement;
			const forumElement = document.getElementById("extForum") as HTMLSelectElement;
			
			Alerts.error(!urlElement.value, "Must provide a URL.", true);
			Alerts.error(!forumElement.value, "Must select a forum to post to.");
			
			// Make sure the OpenGraph post content is loaded:
			if(OpenGraph.postData) {
				Alerts.error(!OpenGraph.postData.title, "The URL provided did not return a valid title.");
				Alerts.error(!OpenGraph.postData.origImg, "The URL provided did not return a valid image.");
				if(OpenGraph.postData.origImg && (!OpenGraph.postData.w || !OpenGraph.postData.h)) {
					Alerts.error(true, "Error: The system failed to identify image width and height.");
				}
			} else {
				if(urlElement.value) { Alerts.error(true, "The URL provided has not returned valid OpenGraph data. You may need a Custom Post."); }
			}
			
			if(Alerts.hasAlerts()) { Alerts.displayAlerts(); return; }
			
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
		
		intSubmit.addEventListener("click", async () => {
			const submitElement = intSubmit as HTMLInputElement;
			
			// Prevent re-submissions.
			if(submitElement.value !== "Submit Post") { return; }
			
			// Make sure there is content to submit:
			const elTitle = document.getElementById("intTitle") as HTMLInputElement;
			const elContent = document.getElementById("intContent") as HTMLInputElement;
			const elForum = document.getElementById("intForum") as HTMLSelectElement;
			
			Alerts.error(!elTitle.value, "Must provide a title.", true);
			Alerts.error(elTitle.value.length > 120, "Title cannot exceed 120 characters.");
			Alerts.error(elContent.value.length > 250, "Summary cannot exceed 250 characters.");
			Alerts.error(!elForum.value, "Must select a forum to post to.");
			
			if(Alerts.hasAlerts()) { Alerts.displayAlerts(); return; }
			
			// Make sure the forum is valid.
			if(!Forum.schema || !Forum.schema[elForum.value]) { alert("Error: The forum selected is considered invalid."); return; }
			
			submitElement.value = "Submitting...";
			
			// Submit Content to API
			const json = await API.callAPI("/post", OpenGraph.postData as unknown as Record<string, unknown>);
			
			Alerts.error(!json, "Error: Post submission response was empty or invalid.", true);
			if(Alerts.hasAlerts()) { Alerts.displayAlerts(); return; }
			
			// Clear All Submission Contenet
			PostPage.clearForm();
			
			console.log(json);
		});
		
		// Drop & Drag Area
		let dropArea = document.getElementById('dropArea') as HTMLElement;
		
		dropArea.addEventListener('dragenter', (e) => PostPage.dragEnter(e), false)
		dropArea.addEventListener('dragleave', (e) => PostPage.dragLeave(e), false)
		dropArea.addEventListener('dragover', (e) => PostPage.dragOver(e), false)
		dropArea.addEventListener('drop', (e) => PostPage.drop(e), false)
	}
	
	static dragPrep(e: Event) {
		e.preventDefault();
		e.stopPropagation();
		return document.getElementById('dropArea') as HTMLElement;
	}
	
	static dragEnter(e: DragEvent) { PostPage.dragPrep(e).classList.add('highlight'); }
	static dragLeave(e: DragEvent) { PostPage.dragPrep(e).classList.remove('highlight'); }
	static dragOver(e: DragEvent) { PostPage.dragPrep(e).classList.add('highlight'); }
	
	static drop(e: DragEvent) {
		const area = PostPage.dragPrep(e);
		area.classList.remove('highlight');
		const dt = e.dataTransfer;
		if(!dt) { return; }
		const files = dt.files;
		PostPage.handleFiles(files)
	}
	
	static handleFiles(files: FileList) {
		for (const [_k, file] of Object.entries(files)) {
			PostPage.uploadFile(file);
			PostPage.previewFile(file);
		}
	}
	
	static uploadFile(file: File) {
		console.log("TRYING TO UPLOAD... MUST COMPLETE FUNCTION...");
		const url = 'YOUR URL HERE';
		const form = new FormData();
		
		form.set('file', file);
		
		// fetch(url, {
		// 	method: 'POST',
		// 	body: formData
		// })
		// .then(() => { /* Done. Inform the user */ })
		// .catch(() => { /* Error. Inform the user */ })
	}
	
	static previewFile(file: File) {
		const reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onloadend = function() {
			const img = document.createElement('img') as HTMLImageElement;
			img.src = reader.result as string;
			const gal = document.getElementById("gallery") as HTMLElement;
			Webpage.setElement(gal, img);
		}
	}
}
