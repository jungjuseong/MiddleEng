declare type MYSVGElement = SVGSVGElement & {
	animationsPaused: () => boolean,
};
declare type MYAniTransEL = SVGElement & {
	beginElement: () => void,
	beginElementAt: (sec: number) => void,
	endElement: () => void,
	endElementAt: (sec: number) => void,
};

declare const cfg_debug: boolean;
declare const cfg_dist: boolean;

/* TEMPLATE */
declare const p_base_template_t: boolean;
declare const p_base_template_s: boolean;

declare const _digenglish_lib_:string;
declare const _project_:string;

declare const b_ls_voca_t: boolean;
declare const b_ls_voca_s: boolean;
declare const b_ls_comprehension_t: boolean;
declare const b_ls_comprehension_s: boolean;
declare const b_rw_comprehension_t: boolean;
declare const b_rw_comprehension_s: boolean;
declare const b_ls_writing_t: boolean;
declare const b_ls_writing_s: boolean;
declare const _build_timestamp_:string;
