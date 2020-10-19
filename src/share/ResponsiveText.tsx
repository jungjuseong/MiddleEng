import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { observable, action } from 'mobx';
import { observer } from 'mobx-react';

import ReactResizeDetector from 'react-resize-detector';
import { number } from 'prop-types';

interface IResponsiveText {
    className: string;
    maxSize: number;
    minSize: number;
	lineHeight: number;
	length?: number;
}
@observer
class ResponsiveText extends React.Component<IResponsiveText> {
    @observable private _size = 0;
	@observable private _opacity: number|'unset' = 0;
	
	constructor(props: IResponsiveText) {
		super(props);
		this._size = props.maxSize;
	}

    private _onResizeHeight = (w: number, h: number) => {
		const {className, maxSize, minSize, lineHeight} = this.props;
		
		// console.log('_onResizeHeight', this._size,);
		if(this._size <= 0) {
					this._size = maxSize;
					return;
				}
		if(this._size === maxSize) {
			this._size = (h > 1.5 * maxSize * lineHeight / 100) ? minSize : maxSize;
			this._opacity = 'unset';
		}
	}

    public componentDidUpdate(prev: IResponsiveText) {
		if(this.props.length !== prev.length) {
			if(this._size !== this.props.maxSize) {
				this._size = this.props.maxSize;
				this._opacity = 0;
			}
		}
		if(this._size <= 0) this._size = this.props.maxSize;
    }
    public render() {
        const style: React.CSSProperties = {
            fontSize: this._size + 'px',
            lineHeight: this.props.lineHeight + '%',
            opacity: this._opacity,
        };
        return (
            <div className={this.props.className} style={style}>
                {this.props.children}
                <ReactResizeDetector handleWidth={false} handleHeight={true} onResize={this._onResizeHeight}/>
            </div>
        );
    }
}
export {ResponsiveText};