import * as React from 'react';
import * as _ from 'lodash';

import { _allowStateChangesInsideComputed } from 'mobx';
import * as common from '../../common';
import { _getJSX, _getBlockJSX,_sentence2jsx } from '../../../get_jsx';

interface IScript {
	idx: number;
	on: boolean;
	studentturn: boolean;
	script: common.IScript;
	viewScript: boolean;
}

class Script extends React.Component<IScript> {
	private _jsx: JSX.Element[];
	constructor(props: IScript) {
        super(props);
        this._jsx = _sentence2jsx(props.script.dms_eng, 'closure', undefined, false, 'word');
	}
	public render() {
		const {on, viewScript, studentturn} = this.props;
		const classNames: string[] = [];
		const images: string[] = [];
		
		if(viewScript) classNames.push('view');
		if(on) classNames.push('on');

		const className = classNames.join(' ');

		if(viewScript) images.push('view');
		if(on && studentturn) images.push('on');

		const imgClassName = images.join(' ');

		return (
			<>
				<span>
					<img className={imgClassName} src={_project_ + 'teacher/images/arrow_script.png'} draggable={false}/>
				</span>
				<div className={className}>{this._jsx}</div>
			</>
		);
	}
}

export default Script;