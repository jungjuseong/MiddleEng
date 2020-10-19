import * as React from 'react';
import * as ReactDOM from 'react-dom';
class StandBar extends React.Component<{percent: number}> {
	public render() {
		const {percent} = this.props;
		return (
			<div className="stand_bar" style={{display: percent < 0 ? 'none' : ''}}>
				<div className="prog_bnd"><div className="prog_bar" style={{width: percent < 0 ? '0%' : percent + '%'}} /></div>
				<div className="data_percent">{percent < 0 ? '' : percent + '%'}</div>
			</div>
		);
	}
}
export { StandBar };


interface ICorrectBar {
	className: string;
	preview: number;
	result: number;
}
class CorrectBar extends React.Component<ICorrectBar> {
	public render() {
		const {className, preview, result} = this.props;
		return (
			<div className={className}>
				<span className="title" style={{display: preview < 0 ? 'none' : ''}}>Pre-class</span>
				<div className="progress_bar" style={{display: preview < 0 ? 'none' : ''}}>
					<span className="colorA" style={{width: preview + '%'}} />
					<span className="data_percent">{preview}%</span>
				</div>
				<span className="title"  style={{display: result < 0 ? 'none' : ''}}>In-class</span>
				<div className="progress_bar" style={{display: result < 0 ? 'none' : ''}}>
					<span className="colorB" style={{width: result + '%'}} />
					<span className="data_percent">{result}%</span>
				</div>
			</div>
		);
	}
}
export { CorrectBar };

class Progress extends React.Component<{}> {
	public render() {
		return (
			<>
			<div className="progress_box">
				<span className="title on">SOUND</span>
				<div className="progress_bar">
					<span className="data on" style={{width: 30 + '%'}} />
					<span className="data_percent on">30%</span>
				</div>
				<span className="title">MEANING</span>
				<div className="progress_bar">
					<span className="data" style={{width: 60 + '%'}} />
					<span className="data_percent">60%</span>
				</div>
				<span className="title">SPELLING</span>
				<div className="progress_bar" >
					<span className="data" style={{width: 50 + '%'}} />
					<span className="data_percent">50%</span>
				</div>
				<span className="title">SENTENCE</span>
				<div className="progress_bar">
					<span className="data" style={{width: 90 + '%'}} />
					<span className="data_percent">90%</span>
				</div>
			</div>
			</>
		);
	}
}

export { Progress };