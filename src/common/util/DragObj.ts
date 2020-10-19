import * as geom from './geom';
import { IMatrix } from './geom';

import * as _ from 'lodash';

export function setup(		
	el: HTMLElement, 
	returnRatio: boolean,
	chkStart: () => boolean,
	started: (x: number, y: number, matr: IMatrix|null) => void,
	move: (x: number, y: number) => boolean,
	end: (x: number, y: number) => boolean
) {
	const canPointer: boolean = (global as any).PointerEvent ? true : false;
	let pointerID = -1;
	const downPt = {x: 0, y: 0};
	let rect: ClientRect|null = null;

	const matr = geom.newMatrix();
	let norm = 0;

	const _throttle = _.throttle((evt: PointerEvent) => {
		if (pointerID !== evt.pointerId) return;

		if (returnRatio) {
			if (!rect) return;
			const x = evt.clientX - rect.left;
			const y = evt.clientY - rect.top;
			move(x / rect.width, y / rect.height);
		} else {
			const x = evt.pageX;
			const y = evt.pageY;
			let sX = x;
			let sY = y;
			if(norm === 0) {
				sX = -matr.tx;
				sY = -matr.ty;
			} else {
				sX = (1.0 / norm) * (matr.c * (matr.ty - y) + matr.d * (x - matr.tx));
				sY = (1.0 / norm) * (matr.a * (y - matr.ty) + matr.b * (matr.tx - x) );
			}
			move(sX, sY);
		}
	}, 10);

	el.addEventListener('pointerdown', (evt) => {
		if(el.parentElement === null) return;
		else if (pointerID >= 0 || !chkStart()) return;
		
		if (returnRatio) {
			rect = el.getBoundingClientRect();
			downPt.x = evt.clientX - rect.left;
			downPt.y = evt.clientY - rect.top;
			started(downPt.x / rect.width, downPt.y / rect.height, null);
		} else {
			const x = evt.pageX;
			const y = evt.pageY;
			let sX = x;
			let sY = y;

			geom.matr_identity(matr);
			let p = el as HTMLElement;
			while(p) {
				const m = geom.getElementMatrix(p);
				if(m) {
					geom.matr_concat(matr, m);
				}
				p = p.offsetParent as HTMLElement;
			}
			norm = matr.a * matr.d - matr.b * matr.c;
			if(norm === 0) {
				sX = -matr.tx;
				sY = -matr.ty;
			} else {
				sX = (1.0 / norm) * (matr.c * (matr.ty - y) + matr.d * (x - matr.tx));
				sY = (1.0 / norm) * (matr.a * (y - matr.ty) + matr.b * (matr.tx - x) );
			}
			downPt.x = sX;
			downPt.y = sY;
			started(sX, sY, matr);
		}
		pointerID = evt.pointerId;
		el.setPointerCapture(pointerID);
	});

	el.addEventListener('pointermove', (evt) => {
		_throttle(evt);
	});
	el.addEventListener('pointerup', (evt) => {
		if (pointerID !== evt.pointerId) return;
		// console.log('pointerup =' + evt.pointerId);

		if (returnRatio) {
			if (!rect) return;

			const x = evt.clientX - rect.left;
			const y = evt.clientY - rect.top;
			end(x / rect.width, y / rect.height);
		} else {
			const x = evt.pageX;
			const y = evt.pageY;
			let sX = x;
			let sY = y;
			if(norm === 0) {
				sX = -matr.tx;
				sY = -matr.ty;
			} else {
				sX = (1.0 / norm) * (matr.c * (matr.ty - y) + matr.d * (x - matr.tx));
				sY = (1.0 / norm) * (matr.a * (y - matr.ty) + matr.b * (matr.tx - x) );
			}

			end(sX, sY);
		}
		el.releasePointerCapture(pointerID);
		pointerID = -1;
	});

	el.addEventListener('pointercancel', (evt) => {
		if (pointerID !== evt.pointerId) return;
		end(NaN, NaN);
		el.releasePointerCapture(pointerID);
		pointerID = -1;				
	});
}


