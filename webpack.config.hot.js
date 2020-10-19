const path = require('path');
const webpack = require('webpack');
const merge = require('webpack-merge');
const MiniCSSExtractPlugin = require('mini-css-extract-plugin');

process.env.NODE_ENV = 'development';

const DEFINES = require('./build.config');

const baseConfig = require('./webpack.config.base');

const lintOption = require('./tslint-loader-option');

const port = 8082;
const https = false;


const buildConfig = merge(baseConfig, {
	output: {
		hotUpdateChunkFilename: 'hot/hot-update.js',
		hotUpdateMainFilename: 'hot/hot-update.json',
	},
	optimization: {
		minimize: false,
	},
	devtool: 'inline-source-map',
	module: {
		rules: [
		  {
			test: /\.ts(x?)$/,
			exclude: /node_modules/,
			use: [
				{
					loader: 'babel-loader',
					options: {
						babelrc: false,
						sourceMap: true, 
						cacheDirectory: true, 
						plugins: [
							'react-hot-loader/babel'
						],
						presets: ['@babel/preset-env'],
					}			
				},
				{
					loader: 'ts-loader',
					options: {logLevel: 'info', silent: false, logInfoToStdOut: true}, 
				}
			]
		  },
/*
			{
				test: /\.ts$/,
				enforce: 'pre',
				use: [
					{
						loader: 'tslint-loader',
						options: lintOption
					}
				]
			},
*/
		  {
			test: /\.[s]*css$/,	
			use: [
				'css-hot-loader',
				MiniCSSExtractPlugin.loader,
				{
					loader: 'css-loader',
					options: { 
						importLoaders: 1,
						url: false,
						}
				},
				'postcss-loader'
			],
		  },
		]
	},
	devServer: {
		host: 'localhost',
		port: port,
		contentBase: path.join(__dirname, DEFINES.paths.wwwroot),
		disableHostCheck: true, // host 0.0.0.0 일 경우 보안상 문제로 추가
		compress: false,
		noInfo: true,
		stats: 'errors-only',
		inline: true,
		lazy: false,
		hot: true,
		overlay: false,
		https: https,		
		headers: {
		  'Access-Control-Allow-Origin': '*',
		},
		watchOptions: {
			aggregateTimeout: 300,
			poll: 100
		  },
		  historyApiFallback: {
			verbose: true,
			disableDotRule: false,
		  }
	},
	plugins: [

	]
});

module.exports = buildConfig;

