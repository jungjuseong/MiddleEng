const path = require('path');
const rimraf = require('rimraf');

function _deleteDir(dir) {

	return new Promise((resolve) => {
		const DIR = path.join(__dirname, dir);
		rimraf(DIR, function () { 
			console.log('done', dir, DIR); 
			resolve();
		});
	});

}

async function _clear() {
	await _deleteDir('./temp');
	await _deleteDir('./output/resources/app/public/temp');
	console.log('==> Clear ./temp');
	await _deleteDir('./tempOutDir');
	await _deleteDir('./output/resources/app/public/tempOutDir');

	console.log('==> Clear ./tempOutDir');
	console.log('====================================> Clear complete');
}
_clear();