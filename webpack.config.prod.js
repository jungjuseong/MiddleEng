var path = require('path');
var webpack = require('webpack');
var merge = require('webpack-merge');
const MiniCSSExtractPlugin = require('mini-css-extract-plugin');
process.env.NODE_ENV = 'production';

const lintOption = require('./tslint-loader-option');

var baseConfig = require('./webpack.config.base');

var buildConfig = merge(baseConfig, {
	optimization: {
		minimize: true,
	},
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
						sourceMap: false, 
						cacheDirectory: false, 
						presets: ['@babel/preset-env'],
					}			
				},
				{
					loader: 'ts-loader',
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
					options: lintOption,
				}
			]
		},
*/
		{
			test: /\.[s]*css$/,	
			use: [
				MiniCSSExtractPlugin.loader,
				{
					loader: 'css-loader',
					options: { 
						importLoaders: 1,
						url: false,
						}
				},
				'postcss-loader',
			],
		},

		]
	},
});

// console.log("buildConfig", buildConfig.optimization.minimize);

module.exports = buildConfig;

