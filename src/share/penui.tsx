import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { observable, action } from 'mobx';
import { observer } from 'mobx-react';
import { ToggleBtn } from '@common/component/button';
import { App } from '../App';

export class PenUIStore {

	@observable private m_color = '#000000';
	@observable private m_thick: 5|10 = 5;
	private m_thick_erase = 25;
	@observable private m_erase = false;

	get color() {return this.m_color;}
	@action public setColor(v: string) {this.m_color = v;}

	get thick() {return this.m_thick;}
	public setThick(v: 5|10) {this.m_thick = v;}

	get thick_erase() {return this.m_thick_erase;}
	public setThickErase(v: number) {this.m_thick_erase = v;}

	get erase() {return this.m_erase;}
	@action public setErase(v: boolean) {this.m_erase = v;}

	@observable private m_undoLen = 0;
	get undoLen() {return this.m_undoLen;}
	@action public setUndoLen(v: number) {this.m_undoLen = v;}
}
interface IPenUI {
	store: PenUIStore;
	draw: IForDraw;
	view: boolean;
	disabled?: boolean;
}

@observer
export class PenUI extends React.Component<IPenUI> {
	public static defaultProps = {
		disabled: false,
	};	
	constructor(props: IPenUI) {
		super(props);
	}
	private _clickReset = (e: React.MouseEvent<HTMLElement>) => {
		if(this.props.draw) {
			this.props.draw.reset();
			this.props.store.setErase(false);
		}
		App.pub_playBtnTab();
	}
	private _clickUndo = (e: React.MouseEvent<HTMLElement>) => {
		if(this.props.draw) {
			this.props.draw.undo();
		}
		App.pub_playBtnTab();
	}
	private _clickColor = (e: React.MouseEvent<HTMLElement>) => {
		let color = e.currentTarget.className;
		if(color && color.length === 10) {
			color = color.substring(4);
			this.props.store.setColor('#' + color);
		}
		App.pub_playBtnTab();	
	}
	private _clickErase = (e: React.MouseEvent<HTMLElement>) => {
		this.props.store.setErase(!this.props.store.erase);
		App.pub_playBtnTab();
	}
	private _clickThick = (e: React.MouseEvent<HTMLElement>) => {
		this.props.store.setErase(false);
		this.props.store.setThick(5);
		App.pub_playBtnTab();
	}
	private _clickThickBold = (e: React.MouseEvent<HTMLElement>) => {
		this.props.store.setErase(false);
		this.props.store.setThick(10);	
		App.pub_playBtnTab();
	}

	public render() {
		const {store, disabled} = this.props;
		return (
			<div className={this.props.view ? 'penui on' : 'penui'}>
				<div className="pen_color">
					<ToggleBtn className="btn_000000" disabled={disabled || store.erase} on={!store.erase && store.color === '#000000'} onClick={this._clickColor}/>
					<ToggleBtn className="btn_1347e9" disabled={disabled || store.erase} on={!store.erase && store.color === '#1347e9'} onClick={this._clickColor}/>
					<ToggleBtn className="btn_ec1919" disabled={disabled || store.erase} on={!store.erase && store.color === '#ec1919'} onClick={this._clickColor}/>
					<ToggleBtn className="btn_30aa01" disabled={disabled || store.erase} on={!store.erase && store.color === '#30aa01'} onClick={this._clickColor}/>
					<ToggleBtn className="btn_fddc00" disabled={disabled || store.erase} on={!store.erase && store.color === '#fddc00'} onClick={this._clickColor}/>
				</div>
				<div className="pen_select">
					<ToggleBtn disabled={disabled} on={!disabled && !store.erase && store.thick === 5} className="pen_icon" onClick={this._clickThick}/>
					<ToggleBtn disabled={disabled} on={!disabled && !store.erase && store.thick === 10} className="pen_thick" onClick={this._clickThickBold}/>
				</div>
				<div className="pen_button">	
					<ToggleBtn className="btn_eraser" disabled={disabled || store.undoLen === 0} on={!disabled && store.erase} onClick={this._clickErase}/>
					<ToggleBtn className="btn_undo" disabled={disabled || store.undoLen === 0} onClick={this._clickUndo}/>
					<ToggleBtn className="btn_reset" disabled={disabled} onClick={this._clickReset}/>
				</div>
			</div>
		);
	}
}