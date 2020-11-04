import * as React from 'react';

interface INItem {
	className?: string;
	idx: number;
	on: boolean;
	onClick: (idx: number) => void;

}

class NItem extends React.Component<INItem> {
	private _click = () => {
		this.props.onClick(this.props.idx);
	}
	public render() {
		const { idx, on } = this.props;
		return <span className={(this.props.className ? this.props.className : '') + (on ? ' on' : '')} onClick={this._click}>{idx + 1}</span>;
	}
}

export default NItem;