import * as React from 'react';
import * as ReactDOM from 'react-dom';

import * as ss from './style';
import * as s from './PreInBox.scss';
import { isUndefined } from 'util';

interface IPreInBox {
	view: boolean;
	inClass: number;
	preClass: number;
	position?: 'absolute'|'relative'; 
	left?: number;
	right?: number;
	top?: number;
	bottom?: number;
}
export default function PreInBox(props: IPreInBox) {
	const {view, preClass, inClass, position, left, right, top, bottom} = props;
	const style: React.CSSProperties = {
		display: view && !(preClass < 0 && inClass < 0) ? undefined : 'none'
	};
	// 2020_07_31 1View 사전학습 데이터 연동으로 인해서 preClass 는 항상 보이게 수정 
	if(!isUndefined(position)) style.position = position;
	else style.position = 'absolute';

	if(!isUndefined(right)) style.right = right;
	if(!isUndefined(left)) style.left = left;

	if(!isUndefined(top)) style.top = top;
	if(!isUndefined(bottom)) style.bottom = bottom;

	return (
		<div className={s.className} style={style}>
			<div style={inClass >= 0 ? undefined : ss.NONE}>
				<div>In-class</div>
				<div><span style={{width: inClass + '%'}}/></div>
				<div>{inClass}%</div>
			</div>
			<div style={preClass < 0 ? ss.NONE : undefined}>
				<div>Pre-class</div>
				<div><span style={{width: preClass + '%'}}/></div>
				<div>{preClass >= 0 ? preClass + '%' : ''}</div>
			</div>
		</div>
	);
}
