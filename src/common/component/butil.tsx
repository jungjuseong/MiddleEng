import * as React from 'react';
import * as ReactDOM from 'react-dom';
export function parseBlock(txt: string, className: string, newStr?: string) {
	const arr: React.ReactNode[] = [];

	const pattern = new RegExp(/\{(.*?)\}/g);
	let result = pattern.exec(txt);
	let lastIdx = 0;
	let key = 0;
	let sTmp = '';
	let arrTmp: string[];

	while (result) {
		if(result.index > lastIdx) {
			sTmp = txt.substring(lastIdx, result.index);
			arr.push(sTmp);
		}
		sTmp = result[1];
		let str = newStr;
		if(!str) str = sTmp;
		arr.push((<span key={key++} className={className} data-correct={sTmp}>{str}</span>));

		lastIdx = pattern.lastIndex;
		result = pattern.exec(txt);
	}
	if(lastIdx < txt.length) {
		sTmp = txt.substring(lastIdx);
		arr.push(sTmp);
	}
	return arr;
}

export function parseUnscramble(text: string, className: string, srcs: string[]|null = null) {
	const splits = text.split(' ');
	let inBlock = false;
	const blocks: string[] = [];
	for(let i = 0; i < splits.length; i++) {
		const split = splits[i];
		const sidx = split.lastIndexOf('{');
		const eidx = split.lastIndexOf('}');
		if(inBlock) {
			blocks[blocks.length - 1] = blocks[blocks.length - 1] + ' ' + split;
			if(eidx > sidx) inBlock = false; 
		} else {
			blocks.push(split);
			if(sidx > eidx)  inBlock = true;
		}
	}
	
	
	let key = 0;
	const arrSplit: React.ReactNode[] = [];


	const tmps: string[]|null = (srcs) ? [] : null;

	for(let i = 0; i < blocks.length; i++) {
		// arrSplit.push((<span></span>));

		const txt = blocks[i]; 
		const pattern = new RegExp(/\{(.*?)\}/g);
		let result = pattern.exec(txt);
		let lastIdx = 0;
		let sTmp = '';
		const arr: React.ReactNode[] = [];

		while (result) {
			if(result.index > lastIdx) {
				sTmp = txt.substring(lastIdx, result.index);
				arr.push(sTmp);
			}
			sTmp = result[1];
			arr.push((<span key={key++} className={className}>{sTmp}</span>));

			if(tmps) tmps.push(sTmp);
			lastIdx = pattern.lastIndex;
			result = pattern.exec(txt);
		}
		if(lastIdx < txt.length) {
			sTmp = txt.substring(lastIdx);
			arr.push(sTmp);
		}
		if(i > 0) arrSplit.push(' ');
		arrSplit.push(<div key={key++}>{arr.map((node) => node)}</div>);
	}
	if(tmps && srcs) {
		let cnt = 0;	
		for(let len; (len = tmps.length) > 0; ) {
			const idx = Math.floor(Math.random() * len);
			if(cnt === 0 && idx === 0 && tmps.length > 1) continue;
			if(idx < len) {
				srcs.push(tmps[idx]);
				tmps.splice(idx, 1);
				cnt++;
			}
		}
	}
	return (
		<>{arrSplit.map((node) => node)}</>
	);
}


function _splitSpace(sentence: string, keyObj: {key: number}, splitClass?: string) {
	const arrS = sentence.split(/\s/g);
	const pattern = new RegExp(/[\.\!\?\s]/g);

	let ret: JSX.Element[] = [];
	for(let i = 0; i < arrS.length; i++ ) {
		const txt = arrS[i];
		if(txt === '') continue;

		let arr: React.ReactNode[] = [];

		let result = pattern.exec(txt);
		let lastIdx = 0;
		let sTmp = '';
		
		while (result) {
			if(result.index > lastIdx) {
				sTmp = txt.substring(lastIdx, result.index);
				arr.push(<span key={keyObj.key++}>{sTmp}</span>);
			}
			sTmp = result[0];

			arr.push(sTmp);
	
			lastIdx = pattern.lastIndex;
			result = pattern.exec(txt);
		}
		if(lastIdx < txt.length) {
			sTmp = txt.substring(lastIdx);
			arr.push(<span key={keyObj.key++}>{sTmp}</span>);
		}

		ret.push(<span key={keyObj.key++} className={splitClass}>{arr.map((node) => node)}</span>);
	}

	return ret;

}


export function sentence2jsx(
	sentence: string,
	blockClass: string|null = 'block',
	blockStr?: string,
	isBlockWorkWrap?: boolean,
	splitClass?: string,
	) {
		const pattern = new RegExp(/\{(.*?)\}/g);
		let keyObj = {key: 0};

		const ret: JSX.Element[] = [];
		const arrLine = sentence.replace(/\s\s+/ig, ' ').replace(/<\s*br\s*\/*\s*>/ig, '<br>').split('<br>');

		let jsx;
		arrLine.forEach((line, idx) => {
			if(blockClass) {
				let result = pattern.exec(line);
				let lastIdx = 0;
				let sTmp = '';
				let arr: React.ReactNode[] = [];

				while (result) {
					if(result.index > lastIdx) {
						sTmp = line.substring(lastIdx, result.index);
						arr.push(_splitSpace(sTmp, keyObj, splitClass));
					}
					sTmp = result[1];
					let str = blockStr;
					if(!str) str = sTmp;
					
					if(isBlockWorkWrap) jsx = _splitSpace(str, keyObj, splitClass);
					else jsx = str;

					arr.push((<span key={keyObj.key++} className={blockClass} data-correct={sTmp}>{jsx}</span>));
			
					lastIdx = pattern.lastIndex;
					result = pattern.exec(line);
				}
				if(lastIdx < line.length) {
					sTmp = line.substring(lastIdx);
					arr.push(_splitSpace(sTmp, keyObj, splitClass));
				}
				ret[idx] = <React.Fragment key={keyObj.key++}>{arr}</React.Fragment>;
			} else {
				ret[idx] = <React.Fragment key={keyObj.key++}>{_splitSpace(line, keyObj, splitClass)}</React.Fragment>;
			}
			
		});
		return ret;
}