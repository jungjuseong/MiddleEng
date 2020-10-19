const path = require('path')
const fs = require('fs');

const DEFINES = require('./build.config');


module.exports = {
    entry: [
        './serve.js'
    ],
    output: {
        filename: "./temp/main.js"
    },
    optimization: {
        minimize: true,
    },
    devServer: {
		contentBase: false,
		inline: false,
		hot: false,
		https: false,
		host: '0.0.0.0',
		port: 8082,
		contentBase: path.join(__dirname, DEFINES.paths.wwwroot)
    },
};
