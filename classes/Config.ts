
export default class Config {
	
	static url_web: string;			// URL to the web server; e.g. localhost, druidis.org, etc.
	static url_api: string;			// URL to the API server; e.g. localhost/api, druidis.org/api, etc.
	
	// Settings
	static local: boolean;			// Indicates that we're on localhost (or dev system).
	static cacheStatic: number;		// [Required for Local] Duration for caching static content (like about pages).
	static cacheDynamic: number;	// [Required for Local] Duration for caching dynamic content (like feeds).
	
	static initialize() {
		
		// Local Settings
		Config.local = location.hostname.indexOf("local") > -1 ? true : false;
		
		// URLs
		Config.url_web = Config.local ? `http://localhost` : `https://druidis.org`;
		Config.url_api = `${Config.url_web}/api`;
		
		// Cache Settings
		Config.cacheStatic = Config.local ? 20 : 3600 * 24 * 3;
		Config.cacheDynamic = Config.local ? 20 : 60 * 5;
	}
}