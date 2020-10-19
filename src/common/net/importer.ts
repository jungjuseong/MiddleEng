export function importHTML(url: string): Promise<Element> {
	return new Promise<Element>( (resolve, reject) => {

		const xhr = new XMLHttpRequest();
		xhr.open('GET', url, true);

		xhr.responseType = 'document';
		xhr.onload = (e) => {
			if(!e) return;

			const doc = xhr.response as Document;
			if(doc && doc.body && doc.body.firstElementChild) { 
				resolve(doc.body.firstElementChild);
			} else if(doc && doc.documentElement) {
				resolve(doc.documentElement);
			} else reject('error');
		};
	 xhr.onerror = (e) => {
			reject(e);	
		};
	 xhr.send(null);
	});

}
export function importLink(url: string, parentEl: HTMLElement): Promise<HTMLDocument> {
	return new Promise<HTMLDocument>( (resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.open('GET', url, true);
		xhr.responseType = 'document';
		xhr.onload = (e) => {
			if(!e) return;
			const doc = xhr.response;
			resolve(doc);
		};
		xhr.onerror = (e) => {
			reject(e);	
		};
		xhr.send(null);
	});
	
}