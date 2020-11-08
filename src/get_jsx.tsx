import * as React from 'react';

export function _sentence2jsx(sentence: string,	blockClass: string|null = 'block',blockStr?: string,isBlockWorkWrap?: boolean,	splitClass?: string) {
		const pattern = new RegExp(/\{(.*?)\}/g);
		let keyObj = {key: 0};

		const ret: JSX.Element[] = [];
		const lines = sentence.replace(/\s\s+/ig, ' ').replace(/<\s*br\s*\/*\s*>/ig, '<br>').split('<br>');

		let jsx;
		lines.forEach((line, idx) => {
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

					arr.push((<span key={keyObj.key++} className={blockClass} data-correct={sTmp}>aaaaaaaaaa</span>));
			
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

export function _splitSpace(sentence: string, keyObj: {key: number}, splitClass?: string) {
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

export function _getJSX(text: string) {
	const els = _sentence2jsx(text, 'block', undefined, true, 'word');
	return (
		<>{els.map((el, idx) => {
			if(idx === els.length - 1) return el;
			else return <React.Fragment key={idx}>{el}<br/></React.Fragment>;
		})}</>
	);
}

export function _getBlockJSX(text: string) {
	const els = _sentence2jsx(text, 'block', undefined, true, 'word');
	return (
		<>{els.map((el, idx) => {
			if(idx === els.length - 1) return el;
			else return <React.Fragment key={idx}>{el}<br/></React.Fragment>;
		})}</>
	);
}