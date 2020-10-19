export interface IPoint {
	x: number;
	y: number;
}

export interface IRectangle {
	x: number;
	y: number;
	width: number;
	height: number;	
}
export interface IMatrix {
	a: number;
	b: number;
	c: number;
	d: number;
	tx: number;
	ty: number;
}

export interface ILength {
	isAuto: boolean;
	isPercent: boolean;
	value: number;
	real: number;
	content: number;
}

export function getCubicValue(t: number, sx: number, sy: number, cx1: number, cy1: number, cx2: number, cy2: number, ex: number, ey: number): IPoint {
	t = Math.max(Math.min(t, 1), 0);
	const tp = 1 - t;
	const t2 = t * t;
	const t3 = t2 * t;
	const tp2 = tp * tp;
	const tp3 = tp2 * tp;
	return {
		x: (tp3 * sx) + (3 * tp2 * t * cx1) + (3 * tp * t2 * cx2) + (t3 * ex),
		y: (tp3 * sy) + (3 * tp2 * t * cy1) + (3 * tp * t2 * cy2) + (t3 * ey)
	};
}
export function interpolate(tgt: IPoint, src: IPoint, f: number): IPoint {
	return {
		x: src.x + f * (tgt.x - src.x),
		y: src.y + f * (tgt.y - src.y)
	};
}
export function normalizePoint(pt: IPoint, thickness: number): void {
	if (pt.x === 0 && pt.y === 0) return;	
	else {
		const norm = thickness / Math.sqrt (pt.x * pt.x + pt.y * pt.y);
		pt.x *= norm;
		pt.y *= norm;
	}	
}



export function isPoint(obj: any): obj is IPoint {
    return ('x' in obj && 'y' in obj);
}
export function clonePoint(pt: IPoint): IPoint {
    return {x: pt.x, y: pt.y};
}
export function addPoint(a: IPoint, b: IPoint): IPoint {
    return {x: a.x + b.x, y: a.y + b.y};
}
export function subtractPoint(a: IPoint, b: IPoint): IPoint {
	return {x: a.x - b.x, y: a.y - b.y};
}

export function distance(a: IPoint, b: IPoint): number {	
	const dx = a.x - b.x;
	const dy = a.y - b.y;
	return Math.sqrt (dx * dx + dy * dy);
}

export function parseLenth(
	str: string|null|undefined, 
	def: ILength
): ILength {
	if (!str) return def;
	str = str.toLowerCase().trim();

	if (str === '' || str === 'auto') return def;
	else if ( str.endsWith('%') ) {
		const val = parseFloat(str);
		if (isNaN(val) || val < 0) return def;
		else {
			def.isAuto = false;
			def.isPercent = true;
			def.value = val;
			def.real = NaN;
			def.content = NaN;
		}
	} else {
		const val = parseFloat(str);
		if (isNaN(val) || val < 0 ) return def;
		else {
			def.isAuto = false;
			def.isPercent = false;
			def.value = val;
			def.real = val;
			def.content = NaN;
		}
	}
	return def;
}

/*
export class Point implements $IPoint {
    public x: number;
	public y: number;
    constructor(x: number = 0, y: number = 0) {
        this.x = x;
        this.y = y;
    }	
}
export class Rectangle implements $IRectangle {
    public x: number;
    public y: number;
    public width: number;
    public height: number;

    constructor(x: number = 0, y: number = 0, width: number = 0, height: number = 0) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
}


export class Matrix implements $IMatrix {
	public a: number;
	public b: number;
	public c: number;
	public d: number;
	public tx: number;
	public ty: number;
	constructor(
		a: number = 1, 
		b: number = 0, 
		c: number = 0, 
		d: number = 1, 
		tx: number = 0, 
		ty: number = 0
	) {
		this.a = a;
		this.b = b;
		this.c = c;
		this.d = d;
		this.tx = tx;
		this.ty = ty;
	}	

	clone(): Matrix {
		return new Matrix (this.a, this.b, this.c, this.d, this.tx, this.ty);
	}
	concat(m: $IMatrix) {
		var a1 = this.a * m.a + this.b * m.c;
		this.b = this.a * m.b + this.b * m.d;
		this.a = a1;
		
		var c1 = this.c * m.a + this.d * m.c;
		this.d = this.c * m.b + this.d * m.d;
		this.c = c1;
		
		var tx1 = this.tx * m.a + this.ty * m.c + m.tx;
		this.ty = this.tx * m.b + this.ty * m.d + m.ty;
		this.tx = tx1;		
	}
	copyFrom (src: $IMatrix) {
		this.a = src.a;
		this.b = src.b;
		this.c = src.c;
		this.d = src.d;
		this.tx = src.tx;
		this.ty = src.ty;
	}
	equals (matrix: $IMatrix) {
		return (
			matrix != null && 
			this.tx === matrix.tx && 
			this.ty === matrix.ty && 
			this.a === matrix.a && 
			this.b === matrix.b && 
			this.c === matrix.c && 
			this.d === matrix.d
		);
	}
	identity() {
		this.a = 1;
		this.b = 0;
		this.c = 0;
		this.d = 1;
		this.tx = 0;
		this.ty = 0;
	}
	invert() {
		var norm = this.a * this.d - this.b * this.c;
		if (norm === 0) {
			this.a = this.b = this.c = this.d = 0;
			this.tx = -this.tx;
			this.ty = -this.ty;			
		} else {
			norm = 1.0 / norm;
			var a1 = this.d * norm;
			this.d = this.a * norm;
			this.a = a1;
			this.b *= -norm;
			this.c *= -norm;
			
			var tx1 = - this.a * this.tx - this.c * this.ty;
			this.ty = - this.b * this.tx - this.d * this.ty;
			this.tx = tx1;
		}
		return this;		
	}


	
	setRotation (radian: number, scale: number = 1) {
		this.a = Math.cos (radian) * scale;
		this.c = Math.sin (radian) * scale;
		this.b = -this.c;
		this.d = this.a;		
	}

	transformPoint (pos: $IPoint): $IPoint {
		return {
			x : this.__transformX (pos.x, pos.y), 
			y : this.__transformY (pos.x, pos.y)
		};
	}
	private __transformX (px: number, py: number) {
		return px * this.a + py * this.c + this.tx;
	}
	private __transformY (px: number, py: number) {
		return px * this.b + py * this.d + this.ty;
	}


}
*/

export function newMatrix(
	a: number = 1, 
	b: number = 0, 
	c: number = 0, 
	d: number = 1, 
	tx: number = 0, 
	ty: number = 0,
): IMatrix {
	return 	{a, 
		b, 
		c, 
		d, 
		tx, 
		ty,
	};
}
export function matr_set(
	m: IMatrix,
	a: number, 
	b: number, 
	c: number, 
	d: number, 
	tx: number, 
	ty: number,
) {
	m.a = a;
	m.b = b;
	m.c = c;
	m.d = d;
	m.tx = tx;
	m.ty = ty;
}


export function matr_translate(m: IMatrix, dx: number, dy: number) {
	m.tx += dx;
	m.ty += dy;
}
export function matr_string(m: IMatrix) {
	return `matrix(${m.a}, ${m.b}, ${m.c}, ${m.d}, ${m.tx}, ${m.ty})`;
}
export function matr_identity(m: IMatrix) {
	m.a = 1;
	m.b = 0;
	m.c = 0;
	m.d = 1;
	m.tx = 0;
	m.ty = 0;
}
export function matr_invert(m: IMatrix) {
	let t, n = m.a * m.d - m.b * m.c;

	if (n === 0) {
		m.a = m.b = m.c = m.d = 0;
		m.tx = -m.tx;
		m.ty = -m.ty;
	} else {
		n = 1 / n;
		//
		t = m.d * n;
		m.d = m.a * n;
		m.a = t;
		//
		m.b *= -n;
		m.c *= -n;
		//
		t = -m.a * m.tx - m.c * m.ty;
		m.ty = -m.b * m.tx - m.d * m.ty;
		m.tx = t;
	}
}
export function matr_rotate(m: IMatrix, radian: number) {
	const cos = Math.cos (radian);
	const sin = Math.sin (radian);
	const a1 = m.a * cos - m.b * sin;
	m.b = m.a * sin + m.b * cos;
	m.a = a1;
	
	const c1 = m.c * cos - m.d * sin;
	m.d = m.c * sin + m.d * cos;
	m.c = c1;
	
	const tx1 = m.tx * cos - m.ty * sin;
	m.ty = m.tx * sin + m.ty * cos;
	m.tx = tx1;		
}
export function matr_scale(m: IMatrix, sx: number, sy: number) {
	m.a *= sx;
	m.b *= sy;
	m.c *= sx;
	m.d *= sy;
	m.tx *= sx;
	m.ty *= sy;
}
export function matr_concat(m1: IMatrix, m2: IMatrix) {
	const a1 = m1.a * m2.a + m1.b * m2.c;
	m1.b = m1.a * m2.b + m1.b * m2.d;
	m1.a = a1;
	
	const c1 = m1.c * m2.a + m1.d * m2.c;
	m1.d = m1.c * m2.b + m1.d * m2.d;
	m1.c = c1;
	
	const tx1 = m1.tx * m2.a + m1.ty * m2.c + m2.tx;
	m1.ty = m1.tx * m2.b + m1.ty * m2.d + m2.ty;
	m1.tx = tx1;		
}
export function matr_clone(m: IMatrix): IMatrix {
	return {a: m.a, b: m.b, c: m.c, d: m.d, tx: m.tx, ty: m.ty,};		
}


export function matr_transformPoint(m: IMatrix, pos: IPoint): IPoint {
	return {
		x : pos.x * m.a + pos.y * m.c + m.tx,
		y : pos.x * m.b + pos.y * m.d + m.ty
	};
}
export function matr_transformXY(m: IMatrix, x: number, y: number): IPoint {
	return {x: x * m.a + y * m.c + m.tx, y: x * m.b + y * m.d + m.ty};
}

export function getGlobalElementMatrix(el: HTMLElement): IMatrix {
	const matr = newMatrix();
	let p:  HTMLElement|null = el;
	while(p) {
		const m = getElementMatrix(p);
		if(m) {
			matr_concat(matr, m);
		}
		p = p.offsetParent as HTMLElement;
	}
	return matr;
}
export function getElementMatrix(el: HTMLElement): IMatrix|null {
	const str = el.style.transform;
	if(!str || str === '') return null;

	const ret = newMatrix();
	let tmp = str.split('(')[1];
	tmp = tmp.split(')')[0];
	const arr = tmp.split(',');

	ret.a = parseFloat(arr[0]);
	ret.b = parseFloat(arr[1]);
	ret.c = parseFloat(arr[2]);
	ret.d = parseFloat(arr[3]);
	ret.tx = parseFloat(arr[4]);
	ret.ty = parseFloat(arr[5]);
	return ret;
}
