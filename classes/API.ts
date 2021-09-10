import Config from "./Config.ts";

export default class API {
	
	static async callAPI(path: string, data: Record<string, unknown> | null = null) {
		const response: Response = data === null ? await API.callGetAPI(path) : await API.callPostAPI(path, data);
		return await response.json();
	}
	
	private static async callPostAPI(path: string, data: Record<string, unknown>): Promise<Response> {
		return await fetch(`${Config.url_api}${path}`, {
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
		return await fetch(`${Config.url_api}${path}`, {
			headers: {
				'Content-Type': 'application/json',
				'Credentials': 'include', // Needed or Cookies will not be sent.
				// 'Content-Type': 'application/x-www-form-urlencoded',
			},
		});
	}
}