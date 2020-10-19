import * as util from 'util';

if (!Date.now) {
	Date.now = function now() {
		return new Date().getTime();
	};
}

let m_unicnum: number = 0;

export function getUnic(): string {
    return getUnicNum().toString(36);
}
export function getUnicNum(): number {
    const time = Date.now();

    if (time > m_unicnum) { m_unicnum = time; } else { m_unicnum = m_unicnum + 1; }
    return m_unicnum;
}
export function getUnicUrl(url: string): string {
    if (!url) { return ''; }
    url = url.trim();
    let ret: string = url;
    if (ret.indexOf('http://') === 0 || ret.indexOf('https://') === 0) {
        if (ret.indexOf('?') > 0) {
            ret = ret + '&t=' + getUnic();
        } else {
            ret = ret + '?t=' + getUnic();
        }
    }
    return ret;
}

export function nteUInt(val: any, def: number ): number {
    if (util.isNullOrUndefined(val)) {
        return def;
    } else if (util.isNumber(val)) {
        if (isNaN(val) || val < 0) {
            return def;
        } else {
            return Math.round(val);
        }
    } else {
        const ret: number = parseInt( String(val), 10 );
        return (isNaN(ret) || ret < 0) ? def : ret;
    }
}
export function nteInt(val: any, def: number ): number {
    if (util.isNullOrUndefined(val)) {
        return def;
    } else if (util.isNumber(val)) {
        return Math.round(val);
    } else {
        const ret: number = parseInt( String(val), 10 );
        return (isNaN(ret)) ? def : ret;
    }
}
export function nteFloat(val: any, def: number ): number {
    if (util.isNullOrUndefined(val)) {
        return def;
    } else if (util.isNumber(val)) {
        return val;
    } else {
        const ret: number = parseFloat( String(val) );
        return (isNaN(ret)) ? def : ret;
    }
}

export function nteString(val: any, def: string ): string {
    if (util.isNullOrUndefined(val)) {
        return def;
    } else {
        return String(val);
    }
}
export function nteBool(val: any, def: boolean): boolean {
    if (util.isNullOrUndefined(val)) { return def; } else if (util.isBoolean(val)) { return val; }
    
    const str = String(val);
    if (str === 'true') { return true; } else if (str === 'false') { return false; } else { return def; }
}

export function intToHTMLcolor(num: number) {
    // converts to a integer
    let intnumber = num - 0;
 
    // isolate the colors - really not necessary
    let red, green, blue;
 
    // needed since toString does not zero fill on left
    const template = '#000000';
 
    // in the MS Windows world RGB colors
    // are 0xBBGGRR because of the way Intel chips store bytes
    red = (intnumber & 0x0000ff) << 16;      // tslint:disable-line
    green = intnumber & 0x00ff00;             // tslint:disable-line
    blue = (intnumber & 0xff0000) >>> 16;       // tslint:disable-line
 
    // mask out each color and reverse the order
    intnumber = red | green | blue;            // tslint:disable-line
 
    // toString converts a number to a hexstring
    let HTMLcolor = intnumber.toString(16);
 
    // template adds # for standard HTML #RRGGBB
    HTMLcolor = template.substring(0,7 - HTMLcolor.length) + HTMLcolor;
    return HTMLcolor;
} 

export function nteArray<T>(val: any): T[] {
	if(val) {
		if(Array.isArray(val)) return val;
		else if(typeof(val) === 'string') {
			const str: string = val as string;
			if(str.indexOf('[') >= 0 && str.indexOf(']') > 0) {
				try {
					return JSON.parse(str);
				} catch(e) {}
			}		
		}
		const ret = [];
		ret.push(val);
		return ret;
	}
	return [];	
}

export function getDateStr(sep: string = '.') {
	const d = new Date();
	const ny = d.getFullYear();
	const nm = d.getMonth() + 1;
	const nd = d.getDate();
	const mm = (nm < 10) ? '0' + nm : '' + nm;
	const dd = (nd < 10) ? '0' + nd : '' + nd;
	return ny + sep + mm + sep + dd; 
}

export function _toStringTimestamp(dateObj: Date) {
	let retVal;
  
	const yyyy = dateObj.getFullYear();
	let mm = (dateObj.getMonth() + 1) + '';
	if(parseInt(mm, 10) < 10) {
	  mm = '0' + mm;
	}
	let dd = dateObj.getDate() + '';
	if(parseInt(dd, 10) < 10) {
	  dd = '0' + dd;
	}
  
	retVal = yyyy + '-' +  mm  + '-' + dd + ' ' + dateObj.toTimeString().substr(0, 8);
	// console.log('retVal: ', retVal);
	return retVal;
  }
