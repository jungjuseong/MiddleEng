import * as _ from 'lodash';
export async function wait(time: number) {
	return new Promise<void>((resolve) => {
		_.delay(resolve, time);
	});
}
export function getTimeStr(ms: number, max: number) {
	const maxSec = Math.round(max / 1000);

	let sec = Math.round(ms / 1000);
	let min = Math.floor(sec / 60);
	let hour = Math.floor(min / 60);
	let ret = '';
	sec = sec % 60;
	min = min % 60;
	if(hour > 0 || maxSec >= 3600) {
		ret = hour + ':';
		if( min >= 10) ret += min + ':';
		else ret += '0' + min + ':';
	} else if(maxSec >= 600) {
		if( min >= 10) ret += min + ':';
		else ret += '0' + min + ':';
	} else ret = min + ':';

	if( sec >= 10) ret += sec;
	else ret += '0' + sec;	

	return ret;
}

export function getBounds(el: HTMLElement|null) {
	const rect = { left: 0, top: 0, width: 0, height: 0 };
	if(!el) return rect;
	try {
		const drect = el.getBoundingClientRect();
		rect.left = drect.left;
		rect.top = drect.top;
		rect.width = drect.width;
		rect.height = drect.height;
	} catch (e) {}
	const doc = el.ownerDocument as Document;
	const body = doc.body;
	const html = doc.documentElement as HTMLElement;

	rect.left = rect.left - (html.clientLeft || body.clientLeft || 0),
	rect.top = rect.top - (html.clientTop || body.clientTop || 0);

	const view = doc.defaultView as Window;
	rect.left += view.pageXOffset || html.scrollLeft || body.scrollLeft;
	rect.top += view.pageYOffset || html.scrollTop || body.scrollTop;
	
	return rect;
}
