import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { observable, action, } from 'mobx';
import { observer } from 'mobx-react';
import * as _ from 'lodash';


import { App } from '../App';
export interface IMsg {
	msgtype: 'send1'|'result1'|'onboard1';
}


interface IPage1Data {

}
interface IPage2Data {

}
export interface IData {
	page1: IPage1Data;
	page2: IPage2Data;
}
