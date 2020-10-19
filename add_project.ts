import * as process from 'process';
import * as fs from 'fs';
import * as path from 'path';

import { ncp } from 'ncp';

const argv =  process.argv;

const nprefix = argv.indexOf('-prefix');
const nproject = argv.indexOf('-project');

const prefix = argv[nprefix + 1];
const project = argv[nproject + 1];

const PREFIX = prefix.toUpperCase();

const CONTENT = path.resolve(__dirname, './output/resources/app/public/content');
const FEL_LIB = path.resolve(CONTENT, './digenglish_lib');

function _check_folder() {
	let checkFdr = path.resolve(__dirname, `./src/${prefix}_${project}`);
	if(fs.existsSync(checkFdr)) throw `'${checkFdr}' 가 존재합니다.`;
	checkFdr = path.resolve(FEL_LIB, `./${PREFIX}/${project}`);
	if(fs.existsSync(checkFdr)) throw `'${checkFdr}' 가 존재합니다.`;
	checkFdr = path.resolve(CONTENT, `./${PREFIX}_${project}`);
	if(fs.existsSync(checkFdr)) throw `'${checkFdr}' 가 존재합니다.`;
}
function _modify_build_all_ts() {
	const fpath = path.resolve(__dirname, './build_all.ts');
	const src = fs.readFileSync(fpath, 'utf-8');
	const re = /const\s+PROJECTS\s+=\s+\[([^\]]*)\]\s*;?/;
	const arrRes = src.match(re);
	if(!arrRes) throw 'src.match return null';

	let outer = arrRes[0];
	let inner = arrRes[1];

	if(inner.indexOf(`${prefix}_${project}`) >= 0) throw '이미 포함되어 있습니다.';

	let nS = arrRes.index as number;
	let nE = nS + outer.length;
	const sPrev = src.substring(0, nS);
	const sNext = src.substring(nE);

	nS = outer.indexOf(inner);
	nE = nS + inner.length;

	const sPrev_o = outer.substring(0, nS);
	const sNext_o = outer.substring(nE);
	inner = inner + `\t'${prefix}_${project}_t',\n\t'${prefix}_${project}_s',\n`;
	outer = sPrev_o + inner + sNext_o;
	
	return {path: fpath, src: sPrev + sPrev_o + inner + sNext_o + sNext};
}


function _modify_build_config_js() {
	const fpath = path.resolve(__dirname, './build.config.js');
	const src = fs.readFileSync(fpath, 'utf-8');
	const re = /const\s+PROJECTS\s+=\s+\[([^\]]*)\]\s*;?/;
	const arrRes = src.match(re);
	if(!arrRes) throw 'src.match return null';

	let outer = arrRes[0];
	let inner = arrRes[1];

	if(inner.indexOf(`${prefix}_${project}`) >= 0) throw '이미 포함되어 있습니다.';

	let nS = arrRes.index as number;
	let nE = nS + outer.length;
	const sPrev = src.substring(0, nS);
	const sNext = src.substring(nE);

	nS = outer.indexOf(inner);
	nE = nS + inner.length;

	const sPrev_o = outer.substring(0, nS);
	const sNext_o = outer.substring(nE);

	inner = inner + `\t{value: "${prefix}_${project}", isNew: true},\n`;
	outer = sPrev_o + inner + sNext_o;
	
	return {path: fpath, src: sPrev + sPrev_o + inner + sNext_o + sNext};
}

interface IObject {
    [propName: string]: string;
}

function _add_scripts(scripts: IObject, base: string, add: string, isHot: boolean) {
	const p_add = (isHot ? 'hot_' : '') + add;
	const p_base = (isHot ? 'hot_' : '') + base;
	const val = scripts[p_add];
	if(val) throw `package.json script에 '${p_add}'가 이미 있음`;

	scripts[p_add] = scripts[p_base].replace(base, add);
}

function _modify_package_json() {
	const fpath = path.resolve(__dirname, './package.json');
	const src = fs.readFileSync(fpath, 'utf-8');

	const obj = JSON.parse(src);
	const scripts = obj.scripts as IObject;
	

	_add_scripts(scripts, 'p_base_template_t', `${prefix}_${project}_t`, false);
	_add_scripts(scripts, 'p_base_template_t', `${prefix}_${project}_t`, true);
	_add_scripts(scripts, 'p_base_template_s', `${prefix}_${project}_s`, false);
	_add_scripts(scripts, 'p_base_template_s', `${prefix}_${project}_s`, true);

	// console.log(scripts);
	return {path: fpath, src: JSON.stringify(obj, null, '\t')};
}


function _modify_src_shim_d_ts() {
	const fpath = path.resolve(__dirname, './src/shim.d.ts');
	let src = fs.readFileSync(fpath, 'utf-8');
	
	const teacher = `${prefix}_${project}_t`;
	const student = `${prefix}_${project}_s`;
	if(src.indexOf(teacher) >= 0) throw `_modify_src_shim_d_ts 이미 '${teacher}'가 있습니다.`;
	else if(src.indexOf(student) >= 0) throw `_modify_src_shim_d_ts 이미 '${student}'가 있습니다.`;
	

	src = src + 
		`\ndeclare const ${teacher}: boolean;` +
		`\ndeclare const ${student}: boolean;`;

	
	return {path: fpath, src};
}

function _modify_src_index_tsx() {
	const fpath = path.resolve(__dirname, './src/index.tsx');
	const src = fs.readFileSync(fpath, 'utf-8');
	
	const teacher = `${prefix}_${project}_t`;
	const student = `${prefix}_${project}_s`;

	if(src.indexOf(teacher) >= 0) throw `_modify_src_index_tsx 이미 '${teacher}'가 있습니다.`;
	else if(src.indexOf(student) >= 0) throw `_modify_src_index_tsx 이미 '${student}'가 있습니다.`;

	const re = /if\s*\(\s*p_base_template_t\s*\)\s*{[^}]*}\s*else\s+if\s*\(\s*p_base_template_s\s*\)\s*{[^}]*}/;

	const arrRes = src.match(re);
	if(!arrRes) throw '_modify_src_index_tsx src.match return null';

	let elseif = arrRes[0];

	
	const nS = arrRes.index as number + elseif.length;

	const sPrev = src.substring(0, nS);
	const sNext = src.substring(nS);
	elseif = elseif.replace(/p_base_template/g, `${prefix}_${project}`);

	console.log(sPrev + ' else ' + elseif + sNext);

	return {path: fpath, src: sPrev + ' else ' + elseif + sNext};
}

function _modify_student_import_html() {
	const basePath = path.resolve(FEL_LIB, './P/base_template/student/import.html');
	const tgtPath = path.resolve(FEL_LIB, `./${PREFIX}/${project}/student/import.html`);
	let src = fs.readFileSync(basePath, 'utf-8');
	src = src.replace(/P\/base_template/g, `${PREFIX}/${project}`);
	return {path: tgtPath, src};
}
function _modify_student_init_s_js() {
	const basePath = path.resolve(FEL_LIB, './P/base_template/student/js/init.s.js');
	const tgtPath = path.resolve(FEL_LIB, `./${PREFIX}/${project}/student/js/init.s.js`);
	let src = fs.readFileSync(basePath, 'utf-8');
	src = src.replace(/P\/base_template/g, `${PREFIX}/${project}`);
	return {path: tgtPath, src};
}
function _modify_teacher_import_html() {
	const basePath = path.resolve(FEL_LIB, './P/base_template/teacher/import.html');
	const tgtPath = path.resolve(FEL_LIB, `./${PREFIX}/${project}/teacher/import.html`);
	let src = fs.readFileSync(basePath, 'utf-8');
	src = src.replace(/P\/base_template/g, `${PREFIX}/${project}`);
	return {path: tgtPath, src};
}
function _modify_teacher_init_t_js() {
	const basePath = path.resolve(FEL_LIB, './P/base_template/teacher/js/init.t.js');
	const tgtPath = path.resolve(FEL_LIB, `./${PREFIX}/${project}/teacher/js/init.t.js`);
	let src = fs.readFileSync(basePath, 'utf-8');
	src = src.replace(/P\/base_template/g, `${PREFIX}/${project}`);
	return {path: tgtPath, src};
}

function _modify_student_index_html() {
	const basePath = path.resolve(CONTENT, './P_base_template/student/index.html');
	const tgtPath = path.resolve(CONTENT, `./${PREFIX}_${project}/student/index.html`);
	let src = fs.readFileSync(basePath, 'utf-8');
	src = src.replace(/P\/base_template/g, `${PREFIX}/${project}`);
	return {path: tgtPath, src};
}
function _modify_teacher_index_html() {
	const basePath = path.resolve(CONTENT, './P_base_template/teacher/index.html');
	const tgtPath = path.resolve(CONTENT, `./${PREFIX}_${project}/teacher/index.html`);
	let src = fs.readFileSync(basePath, 'utf-8');
	src = src.replace(/P\/base_template/g, `${PREFIX}/${project}`);
	return {path: tgtPath, src};
}

async function _copyFdr(srcFdr: string, tgtFdr: string) {
	return new Promise<void>((resolve, reject) => {
		ncp(srcFdr, tgtFdr, (err) => {
			if(err) {
				reject(err);
				return;
			}
			resolve();
		});

	});
}

async function _copy_src_project() {
	const srcFdr = path.resolve(__dirname, `./src/p_base_template`);
	const tgtFdr = path.resolve(__dirname, `./src/${prefix}_${project}`);
	await _copyFdr(srcFdr, tgtFdr);
}
async function _copy_template() {

	const srcFdr = path.resolve(FEL_LIB, `./P/base_template`);

	const chkDir = path.resolve(FEL_LIB, `./${PREFIX}`);
	if(!fs.existsSync(chkDir)) {
		fs.mkdirSync(chkDir);
	}

	const tgtFdr = path.resolve(FEL_LIB, `./${PREFIX}/${project}`);
	await _copyFdr(srcFdr, tgtFdr);
}
async function _copy_content() {

	const srcFdr = path.resolve(CONTENT, `./P_base_template`);
	const tgtFdr = path.resolve(CONTENT, `./${PREFIX}_${project}`);
	await _copyFdr(srcFdr, tgtFdr);
}

(async () => {
	const files: Array<{path: string, src: string}> = [];

	_check_folder();

	files.push(_modify_build_all_ts());
	files.push(_modify_build_config_js());
	
	files.push(_modify_package_json());
	files.push(_modify_src_shim_d_ts());
	files.push(_modify_src_index_tsx());
	
	files.push(_modify_student_import_html());
	files.push(_modify_student_init_s_js());
	
	files.push(_modify_teacher_import_html());
	
	files.push(_modify_teacher_init_t_js());
	
	files.push(_modify_student_index_html());
	files.push(_modify_teacher_index_html());
	
	// console.log(files[files.length - 1].path, files[files.length - 1].src);
	
	await _copy_src_project();
	await _copy_template();
	await _copy_content();

	files.forEach((file, idx) => {
		fs.writeFileSync(file.path, file.src, 'utf-8');
		// console.log('file', file);
	});

	

})();


