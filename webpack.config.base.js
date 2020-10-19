const path = require('path');
const webpack = require('webpack');
const merge = require('webpack-merge');
const MiniCSSExtractPlugin = require('mini-css-extract-plugin');
const CircularDependencyPlugin = require('circular-dependency-plugin');


const DEFINES = require('./build.config');
const tsConfigJson = require('./tsconfig.json');

const resolveAlias = {};

const PATHS = DEFINES.paths;


if(tsConfigJson.compilerOptions){
  var paths = tsConfigJson.compilerOptions.paths;
  for(var key in paths){
    if(key.indexOf('@')===0){
	  var val = paths[key][0];

	  key = key.substring(0, key.length-2);
	  val = val.substring(0, val.length-2);

	  resolveAlias[key] = path.join(__dirname, val);
	  
	  // console.log(key, resolveAlias);
    }
  }
}

// console.log('---------------->' + DEFINES.ISNEW);
// DEFINES.__aa__ = JSON.stringify('DEFINES.__aa__ __aa__');

DEFINES['process.env'] = {
  NODE_ENV: JSON.stringify(process.env.NODE_ENV),
};

module.exports = {
  entry: [
	DEFINES.ISNEW ? './src/index.tsx' : './src/index.tsx',
  ],
  output: {
    path:  path.join(__dirname, PATHS.wwwroot),
    publicPath: "/",
	filename: PATHS.outDir + '/' + PATHS.jsPath,
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".json", ".css", ".scss"],
    alias: merge(resolveAlias,{
		react: path.resolve(path.join(__dirname, './node_modules/react')),
		'babel-core': path.resolve(
		  path.join(__dirname, './node_modules/@babel/core')
  		),
    }),
  },
  performance: {
    hints: false
  },
  externals: {
	'react': 'React', // Case matters here 
	'react-dom' : 'ReactDOM', // Case matters here 
	'lodash': '_',
	'mobx': 'mobx', // Case matters here 
	'mobx-react': 'mobxReact', // Case matters here 
	'babel-polyfill': 'babelPolyfill', 
	'react-id-swiper': 'ReactIdSwiper', 
	'react-draggable': 'ReactDraggable',
  },

  plugins: [
	new webpack.DefinePlugin(DEFINES),
    new MiniCSSExtractPlugin({
		filename: PATHS.outDir + '/css/styles.css',
		allChunks: true,
	  }), 
    new CircularDependencyPlugin({
		// exclude detection of files based on a RegExp
		exclude: /a\.js|node_modules/,
		// add errors to webpack instead of warnings
		failOnError: true,
		// set the current working directory for displaying module paths
		cwd: process.cwd(),
	  }),
  ],
};
