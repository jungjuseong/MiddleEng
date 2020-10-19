const path = require('path');
const cfg = require("./build.config");

const browsers = [
	"chrome >= 56", 
	"chromeandroid >= 56"
];

const _assets = cfg.paths.assets;


const loadPaths = [];

for(let i = 0; i<_assets.length; i++){
	loadPaths[i] = path.resolve(__dirname, cfg.paths.wwwroot + '/' + _assets[i]);
	
	// console.log(i, string(loadPaths[i]));
}
// console.log("********************************************************", loadPaths);
const basePath = path.resolve(__dirname, cfg.paths.wwwroot);
module.exports = (ctx) => {
    return {
        parser: false,
        map: ctx.env === 'development' ? true : false,
        plugins:{
            'postcss-import': {
                // root: importRoot,
			},
			'postcss-assets' : {
                basePath: basePath,
                relative: false,
                loadPaths: loadPaths,
			},

            'postcss-node-sass' : {

			},
	
            'autoprefixer': {
                add: true,
            //    browsers: browsers,
			},

        }
    };
};