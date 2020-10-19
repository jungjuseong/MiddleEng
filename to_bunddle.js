const fs = require('fs');
const path = require('path');
const sass = require('node-sass');

const TGTJS = path.join(__dirname, 'output/resources/app/public/content/digenglish_lib/bunddle.js');
const TGTCSS = path.join(__dirname, 'output/resources/app/public/content/digenglish_lib/bunddle.css');
const MODULES =  path.join(__dirname, 'node_modules');

let isProd = true;
process.argv.forEach(function (val, index, array) {
	console.log(index + ': ' + val);
	if(val === '--dvlp') isProd = false;
});
console.log('=========================>Bunddle start isProd=', isProd);
const ARRJS = [
	'babel-polyfill/dist/polyfill.min.js',
	'lodash/lodash.min.js',
	isProd ? 'react/umd/react.production.min.js' : 'react/umd/react.development.js',
	isProd ? 'react-dom/umd/react-dom.production.min.js' : 'react-dom/umd/react-dom.development.js',
	'mobx/lib/mobx.umd.min.js',
	'mobx-react/index.min.js',
	'react-id-swiper/lib/react-id-swiper.min.js',
	'react-draggable/dist/react-draggable.min.js',
];

const ARRSCSS = [
	'react-id-swiper/src/styles/scss/swiper.scss',
];

let srcArr = [];
for(let i=0; i<ARRJS.length; i++){
	const srcPath = path.join(MODULES, ARRJS[i]);
	const src = fs.readFileSync(srcPath, 'utf-8');

	srcArr.push('/* ' + ARRJS[i] + ' */');
	srcArr.push(src);
	
}
if(fs.existsSync(TGTJS)) fs.unlinkSync(TGTJS);
fs.writeFileSync(TGTJS, srcArr.join('\n'), 'utf-8'); 


/*
let cssArr = [];
for(let i=0; i<ARRSCSS.length; i++){
	const srcPath = path.join(MODULES, ARRSCSS[i]);

	// console.log(srcPath, fs.existsSync(TGTJS));
	var result = sass.renderSync({
		file: srcPath
	});
	cssArr.push('/* ' + ARRSCSS[i] + ' /');
	cssArr.push(result.css);
	// console.log(result.css);
}

if(fs.existsSync(TGTCSS)) fs.unlinkSync(TGTCSS);
fs.writeFileSync(TGTCSS, cssArr.join('\n'), 'utf-8'); 
*/