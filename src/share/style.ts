import { transaction } from 'mobx';

const HIDE: React.CSSProperties = {
	opacity: 0,
	pointerEvents: 'none',
};
const HIDE_ANI: React.CSSProperties = {
	opacity: 0,
	pointerEvents: 'none',

	transitionProperty: 'opacity',
	transitionDuration: '0.6s',

};

const NONE: React.CSSProperties = {
	display: 'none',
};

export {HIDE, NONE, HIDE_ANI};