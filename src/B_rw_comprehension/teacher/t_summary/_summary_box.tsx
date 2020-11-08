import * as React from 'react';

import * as _ from 'lodash';

import { SENDPROG } from '../t_store';
import { App } from '../../../App';
import { ToggleBtn } from '@common/component/button';

import * as common from '../../common';
import { observable } from 'mobx';

import WrapTextNew from '@common/component/WrapTextNew';

interface ISummaryBox {
	seq: number;
	summary: common.ISummarizing;
	scripts: common.IScriptSummarizing[];
	curScritSeq: number;
	playOn: boolean;
	prog: SENDPROG;
	len: number;
	onZoom: (url: string) => void;
	onSound: (summary_seq: number) => void;
	onScriptSound: (script_seq: number) => void;
}

class SummaryBox extends React.Component<ISummaryBox> {
	private _jsx: JSX.Element;
    private _scripts: common.IScriptSummarizing[] = [];

    @observable private _curScritSeq = 0;

	constructor(props: ISummaryBox) {
		super(props);
		
		const nodes = this._getSentenceJsx();
		this._jsx = (<>{nodes.map((node, idx) => node)}</>);

		this._curScritSeq = props.curScritSeq;
	}
	
	private _parseBlock(arr: React.ReactNode[], idx: number, script_seq: number, txt: string, className: string, newStr?: string) {
        const pattern = new RegExp(/\{(.*?)\}/g);
        let result = pattern.exec(txt);
        let lastIdx = 0;
        let key = 0;
        let sTmp = '';
        let script_arr;
        let sarr: React.ReactNode[];

        while (result) {
            if(result.index > lastIdx) {
                sTmp = txt.substring(lastIdx, result.index);
                script_arr = sTmp.split('<br>');
                sarr = [];
                script_arr.forEach((line, lidx) => { 
                    if(lidx >= script_arr.length - 1) sarr.push(<span key={'l1_' + lidx}>{line}</span>);
                    else sarr.push(<span key={'l1_' + lidx}>{line}<br/></span>);
                });
                if(className === 'playing') {
                    arr.push((<span key={'sub_' + idx + (key++)} className={className} onClick={this.onScriptClick.bind(this, script_seq)}>{sarr.map((node) => node)}</span>));
                } else {
                    arr.push((<span key={'sub_' + idx + (key++)} onClick={this.onScriptClick.bind(this, script_seq)}>{sarr.map((node) => node)}</span>));
                }
            }
            sTmp = result[1];
            let str = newStr;
            if(!str) str = sTmp;
            
            script_arr = str.split('<br>');
            sarr = [];
            script_arr.forEach((line, lidx) => { 
                if(lidx >= script_arr.length - 1) sarr.push(<span key={lidx}>{line}</span>);
                else sarr.push(<span key={lidx}>{line}<br/></span>);
            });
            arr.push((<span key={'sub_' + idx + (key++)} className={className} data-correct={sTmp} onClick={this.onScriptClick.bind(this, script_seq)}>{sarr.map((node) => node)}</span>));

            lastIdx = pattern.lastIndex;
            result = pattern.exec(txt);
        }
        if(lastIdx < txt.length) {
            sTmp = txt.substring(lastIdx);
            script_arr = sTmp.split('<br>');
            sarr = [];
            script_arr.forEach((line, lidx) => { 
                if(lidx >= script_arr.length - 1) sarr.push(<span key={'l3_' + lidx}>{line}</span>);
                else sarr.push(<span key={'l3_' + lidx}>{line}<br/></span>);
            });
            if(className === 'playing') {
                arr.push((<span key={'sub_' + idx + (key++)} className={className} onClick={this.onScriptClick.bind(this, script_seq)}>{sarr.map((node) => node)}</span>));
            } else {
                arr.push((<span key={'sub_' + idx + (key++)} onClick={this.onScriptClick.bind(this, script_seq)}>{sarr.map((node) => node)}</span>));
            }
        }
	}
	private _getSentenceJsx() {
		let i = 0;
		let arr: React.ReactNode[] = [];
		let correct = '';
		if(this.props.summary.answer === 2) correct = this.props.summary.choice_2;
		else if(this.props.summary.answer === 3) correct = this.props.summary.choice_3;
		else correct = this.props.summary.choice_1;
		this.props.scripts.forEach((script, idx) => {
			if(script.summary_seq === this.props.seq ) {
				if(this._curScritSeq > 0 && this._curScritSeq === script.seq) {
                    this._parseBlock(arr, idx, script.seq, script.dms_eng, 'playing', correct);
                    arr.push(' ');	
                } else {
                    this._parseBlock(arr, idx, script.seq, script.dms_eng, 'block', correct);
                    arr.push(' ');
                }
			}
		});
		return arr;
	}
	private _clickZoom = () => {
        App.pub_playBtnTab();   // 소리가 없어서 추가
        this.props.onZoom(App.data_url + this.props.summary.image);
	}
	
	private onScriptClick = (seq: number) => {
		if(this.props.prog !== SENDPROG.COMPLETE) return;
		this.props.onScriptSound(seq);
	}
	private _onClick = () => {
		this.props.onSound(this.props.seq);
	}

	public render() {
		const {summary, prog, curScritSeq} = this.props;

		if(this._curScritSeq !== curScritSeq) {
			this._curScritSeq = curScritSeq;
			const nodes = this._getSentenceJsx();
			this._jsx = (<>{nodes.map((node, idx) => node)}</>);
		}

		return (
		<>
			<div className="quiz_box">
				<div className="img-box">
					<div>
						<img src={App.data_url + summary.image} />
						<ToggleBtn className="btn_zoom" onClick={this._clickZoom}/>
					</div>
				</div>
				<div className={prog >= SENDPROG.COMPLETE ? 'view-correct' : 'view-summary'}>
					<ToggleBtn className="btn_summary_audio" draggable={false} onClick={this._onClick}/>
					<WrapTextNew lineHeight={160} maxLineNum={4} minSize={26}  maxSize={26} className={'text'} view={true} textAlign="left" viewWhenInit={true}>
						{this._jsx}
					</WrapTextNew>
				</div>
			</div>
			<div className="btn_arrow_down" style={{display: this.props.len === summary.seq ? 'none' : ''}}/>
		</>
		);
	}
}

export default SummaryBox;