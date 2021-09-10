
export default class API {
	
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