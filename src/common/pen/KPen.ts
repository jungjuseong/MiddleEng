export interface IPenHistory {
	idx: number;
	erase: boolean;
	color: string;
	thick: number;
	path: Path2D;
}
export class KPen {
	private _el: HTMLCanvasElement;
	private _ctx: CanvasRenderingContext2D;
	private _pid = -1;
	private _undos: IPenHistory[] = [];
	private _redos: IPenHistory[] = [];
	private _ratio: number = 1;
	public get undoLen() {return this._undos.length;}
	public get redoLen() {return this._redos.length;}

	constructor(
		el: HTMLCanvasElement, 
		onDown: (e: MouseEvent, history: IPenHistory ) => boolean,
		onMove: (e: MouseEvent, history: IPenHistory ) => void,
		onUp: (e: MouseEvent, history: IPenHistory ) => boolean,

	) {
		this._el = el;
		el.setAttribute('touch-action', 'none');

		const ctx = el.getContext('2d') as CanvasRenderingContext2D;
		const hidpi = el.getAttribute('hidpi');
		let ratio = 1;
		if (hidpi && !/^off|false$/.test(hidpi)) {
			const deviceRatio = window.devicePixelRatio || 1;
			const backingStoreRatio = ctx['webkitBackingStorePixelRatio'] || ctx['backingStorePixelRatio'] || 1; // tslint:disable-line
			ratio = devicePixelRatio / backingStoreRatio;

			ctx.scale(ratio, ratio);
		}
		this._ctx = ctx;
		this._ratio = ratio;

		let lastx = 0;
		let lasty = 0;
		let isDrawed = false;
		let last: IPenHistory|null = null;

		const f_down = (e: PointerEvent) => {
			if(this._pid >= 0) return;
				
			lastx = e.offsetX;
			lasty = e.offsetY;

			const path = new Path2D();
			last = {
				idx: -1,
				erase: false,
				color: '',
				thick: 1,
				path,
			};
			if(!onDown(e, last)) {
				last = null;
				return;
			}

			isDrawed = false;
			this._pid = e.pointerId;
			try {el.setPointerCapture(this._pid);} catch(e) {}

			path.moveTo(lastx, lasty);

			ctx.beginPath();
			ctx.lineCap = 'round';
			ctx.lineJoin = 'round';
			ctx.strokeStyle = last.color;
			if(last.erase) ctx.globalCompositeOperation = 'destination-out';
			else ctx.globalCompositeOperation = 'source-over';
			ctx.lineWidth = last.thick;
			ctx.moveTo(lastx, lasty);
		};
		const f_move = (e: PointerEvent) => {
			if(this._pid !== e.pointerId || !last) return;

			const mx = e.offsetX;
			const my = e.offsetY;
			if(mx === lastx && my === lasty) return;

			const path = last.path;
			path.lineTo(mx, my);
			ctx.lineTo(mx, my);
			ctx.stroke();
			lastx = mx;
			lasty = my;
			isDrawed = true;
			onMove(e, last);
		};

		const f_up = (e: PointerEvent) => {
			if(this._pid < 0 || this._pid !== e.pointerId) return;

			try {el.releasePointerCapture(this._pid);} catch(e) {}
			this._pid = -1;
			if(!last) return;

			const mx = e.offsetX;
			const my = e.offsetY;
			const path = last.path;
			if(mx !== lastx || my !== lasty) {
				path.lineTo(mx, my);
				ctx.lineTo(mx, my);
				ctx.stroke();
				isDrawed = true;
			}
			// ctx.closePath();
			if(isDrawed) {
				this._undos.push(last);
			}

			onUp(e, last);
			last = null;
			isDrawed = false;
		};


		el.addEventListener('pointerdown', f_down);
		el.addEventListener('pointermove', f_move);
		el.addEventListener('pointerup', f_up);
		el.addEventListener('pointercancel', f_up);		
	}

	public clear() {
		if(this._pid >= 0) {
			try {this._el.releasePointerCapture(this._pid);} catch(e) {}
			this._pid = -1;
		}
		const el = this._el;
		const ctx = this._ctx;
		const undos = this._undos;
		const redos = this._redos;
		ctx.clearRect(0, 0, el.width, el.height);

		while(undos.length > 0) undos.pop();
		while(redos.length > 0) redos.pop();
	}
	public reset() {
		const el = this._el;
		const ctx = this._ctx;
		const undos = this._undos;
		const redos = this._redos;
		ctx.clearRect(0, 0, el.width, el.height);

		while(undos.length > 0) undos.pop();
		while(redos.length > 0) redos.pop();
	}
	public undo() {
		if(this._undos.length === 0) return null;
		const last = this._undos.pop() as IPenHistory;
		this._redraw();
		this._redos.push(last);

		return last;
	}
	public redo() {
		if(this._redos.length === 0) return null;
		const last = this._redos.pop() as IPenHistory;
		this._undos.push(last);
		this._redraw();
		return last;
	}
	public canUndo() {return this._undos.length > 0;}
	public canRedo() {return this._redos.length > 0;}

	public toDataURL(bg?: string) {
		if(bg) {
			const el = this._el;

			const tgt = document.createElement('canvas');
			tgt.width = el.width;
			tgt.height = el.height;
			
			const ctx = tgt.getContext('2d') as CanvasRenderingContext2D;

			ctx.fillStyle = bg;
			ctx.fillRect(0,0,el.width,el.height);
			ctx.drawImage(el, 0, 0);
			return tgt.toDataURL();
		} else return this._el.toDataURL();
	}
	private _redraw() {
		const el = this._el;
		const ctx = this._ctx;
		const undos = this._undos;
		
		ctx.clearRect(0, 0, el.width, el.height);
		if(undos.length === 0) return;
		for(let i = 0, len = undos.length; i < len; i++) {
			const hist = undos[i];
			ctx.strokeStyle = hist.color;
			if(hist.erase) {
				ctx.globalCompositeOperation = 'destination-out';
			} else {
				ctx.globalCompositeOperation = 'source-over';
			}
			ctx.lineWidth = hist.thick;
			ctx.lineCap = 'round';
			ctx.lineJoin = 'round';
			ctx.stroke(hist.path);
		}
	}

}