import * as React from 'react';
import * as ReactDOM from 'react-dom';

interface IKProgBar {
	bgColor: string;
	barColor: string;
	percent: number;
	width?: string;
	height: string;
}
export default function KProgBar(props: IKProgBar) {
	const style: React.CSSProperties = {
		backgroundColor: props.bgColor,
		width: props.width,
		height: props.height,
	};

	return (
		<div><span/></div>
	);
}