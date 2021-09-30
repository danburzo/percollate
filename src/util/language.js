import { francAll } from 'franc';

// From: https://github.com/amitbend/iso-639-3-to-1/
const iso6393 = {
	aae: 'sq',
	aao: 'ar',
	aar: 'aa',
	aat: 'sq',
	abh: 'ar',
	abk: 'ab',
	abv: 'ar',
	acm: 'ar',
	acq: 'ar',
	acw: 'ar',
	acx: 'ar',
	acy: 'ar',
	adf: 'ar',
	aeb: 'ar',
	aec: 'ar',
	afb: 'ar',
	afr: 'af',
	ajp: 'ar',
	aka: 'ak',
	aln: 'sq',
	als: 'sq',
	amh: 'am',
	apc: 'ar',
	apd: 'ar',
	ara: 'ar',
	arb: 'ar',
	arg: 'an',
	arq: 'ar',
	ars: 'ar',
	ary: 'ar',
	arz: 'ar',
	asm: 'as',
	auz: 'ar',
	ava: 'av',
	ave: 'ae',
	avl: 'ar',
	ayc: 'ar',
	ayh: 'ar',
	ayl: 'ar',
	aym: 'ay',
	ayn: 'ar',
	ayp: 'ar',
	ayr: 'ay',
	azb: 'az',
	aze: 'az',
	azj: 'az',
	bak: 'ba',
	bam: 'bm',
	bbz: 'ar',
	bel: 'be',
	ben: 'bn',
	bhr: 'mg',
	bis: 'bi',
	bjn: 'ms',
	bmm: 'mg',
	bod: 'bo',
	bos: 'sh',
	bre: 'br',
	btj: 'ms',
	bul: 'bg',
	bve: 'ms',
	bvu: 'ms',
	bzc: 'mg',
	cat: 'ca',
	cdo: 'zh',
	ces: 'cs',
	cha: 'ch',
	che: 'ce',
	chu: 'cu',
	chv: 'cv',
	cjy: 'zh',
	ckb: 'ku',
	cmn: 'zh',
	coa: 'ms',
	cor: 'kw',
	cos: 'co',
	cpx: 'zh',
	cre: 'cr',
	crj: 'cr',
	crk: 'cr',
	crl: 'cr',
	crm: 'cr',
	csw: 'cr',
	cwd: 'cr',
	cym: 'cy',
	czh: 'zh',
	czo: 'zh',
	dan: 'da',
	deu: 'de',
	div: 'dv',
	dty: 'ne',
	dup: 'ms',
	dzo: 'dz',
	ekk: 'et',
	ell: 'el',
	eng: 'en',
	epo: 'eo',
	esi: 'ik',
	esk: 'ik',
	est: 'et',
	eus: 'eu',
	ewe: 'ee',
	fao: 'fo',
	fas: 'fa',
	fat: 'ak',
	ffm: 'ff',
	fij: 'fj',
	fin: 'fi',
	fra: 'fr',
	fry: 'fy',
	fub: 'ff',
	fuc: 'ff',
	fue: 'ff',
	fuf: 'ff',
	fuh: 'ff',
	fui: 'ff',
	ful: 'ff',
	fuq: 'ff',
	fuv: 'ff',
	gan: 'zh',
	gax: 'om',
	gaz: 'om',
	gla: 'gd',
	gle: 'ga',
	glg: 'gl',
	glv: 'gv',
	gnw: 'gn',
	grn: 'gn',
	gug: 'gn',
	gui: 'gn',
	guj: 'gu',
	gun: 'gn',
	hae: 'om',
	hak: 'zh',
	hat: 'ht',
	hau: 'ha',
	hbs: 'sh',
	heb: 'he',
	her: 'hz',
	hin: 'hi',
	hji: 'ms',
	hmo: 'ho',
	hrv: 'sh',
	hsn: 'zh',
	hun: 'hu',
	hye: 'hy',
	ibo: 'ig',
	ido: 'io',
	iii: 'ii',
	ike: 'iu',
	ikt: 'iu',
	iku: 'iu',
	ile: 'ie',
	ina: 'ia',
	ind: 'ms',
	ipk: 'ik',
	isl: 'is',
	ita: 'it',
	jak: 'ms',
	jav: 'jv',
	jax: 'ms',
	jpn: 'ja',
	kal: 'kl',
	kan: 'kn',
	kas: 'ks',
	kat: 'ka',
	kau: 'kr',
	kaz: 'kk',
	kby: 'kr',
	khk: 'mn',
	khm: 'km',
	kik: 'ki',
	kin: 'rw',
	kir: 'ky',
	kmr: 'ku',
	knc: 'kr',
	kng: 'kg',
	koi: 'kv',
	kom: 'kv',
	kon: 'kg',
	kor: 'ko',
	kpv: 'kv',
	krt: 'kr',
	kua: 'kj',
	kur: 'ku',
	kvb: 'ms',
	kvr: 'ms',
	kwy: 'kg',
	kxd: 'ms',
	lao: 'lo',
	lat: 'la',
	lav: 'lv',
	lce: 'ms',
	lcf: 'ms',
	ldi: 'kg',
	lim: 'li',
	lin: 'ln',
	lit: 'lt',
	liw: 'ms',
	ltg: 'lv',
	ltz: 'lb',
	lub: 'lu',
	lug: 'lg',
	lvs: 'lv',
	lzh: 'zh',
	mah: 'mh',
	mal: 'ml',
	mar: 'mr',
	max: 'ms',
	meo: 'ms',
	mfa: 'ms',
	mfb: 'ms',
	min: 'ms',
	mkd: 'mk',
	mlg: 'mg',
	mlt: 'mt',
	mnp: 'zh',
	mon: 'mn',
	mqg: 'ms',
	mri: 'mi',
	msa: 'ms',
	msh: 'mg',
	msi: 'ms',
	mui: 'ms',
	mvf: 'mn',
	mya: 'my',
	nan: 'zh',
	nau: 'na',
	nav: 'nv',
	nbl: 'nr',
	nde: 'nd',
	ndo: 'ng',
	nep: 'ne',
	nhd: 'gn',
	nld: 'nl',
	nno: 'no',
	nob: 'no',
	nor: 'no',
	npi: 'ne',
	nya: 'ny',
	oci: 'oc',
	ojb: 'oj',
	ojc: 'oj',
	ojg: 'oj',
	oji: 'oj',
	ojs: 'oj',
	ojw: 'oj',
	orc: 'om',
	ori: 'or',
	orm: 'om',
	orn: 'ms',
	ors: 'ms',
	ory: 'or',
	oss: 'os',
	otw: 'oj',
	pan: 'pa',
	pbt: 'ps',
	pbu: 'ps',
	pel: 'ms',
	pes: 'fa',
	pga: 'ar',
	pli: 'pi',
	plt: 'mg',
	pol: 'pl',
	por: 'pt',
	prs: 'fa',
	pse: 'ms',
	pst: 'ps',
	pus: 'ps',
	qub: 'qu',
	qud: 'qu',
	que: 'qu',
	quf: 'qu',
	qug: 'qu',
	quh: 'qu',
	quk: 'qu',
	qul: 'qu',
	qup: 'qu',
	qur: 'qu',
	qus: 'qu',
	quw: 'qu',
	qux: 'qu',
	quy: 'qu',
	quz: 'qu',
	qva: 'qu',
	qvc: 'qu',
	qve: 'qu',
	qvh: 'qu',
	qvi: 'qu',
	qvj: 'qu',
	qvl: 'qu',
	qvm: 'qu',
	qvn: 'qu',
	qvo: 'qu',
	qvp: 'qu',
	qvs: 'qu',
	qvw: 'qu',
	qvz: 'qu',
	qwa: 'qu',
	qwc: 'qu',
	qwh: 'qu',
	qws: 'qu',
	qxa: 'qu',
	qxc: 'qu',
	qxh: 'qu',
	qxl: 'qu',
	qxn: 'qu',
	qxo: 'qu',
	qxp: 'qu',
	qxr: 'qu',
	qxt: 'qu',
	qxu: 'qu',
	qxw: 'qu',
	roh: 'rm',
	ron: 'ro',
	run: 'rn',
	rus: 'ru',
	sag: 'sg',
	san: 'sa',
	sdc: 'sc',
	sdh: 'ku',
	sdn: 'sc',
	shu: 'ar',
	sin: 'si',
	skg: 'mg',
	slk: 'sk',
	slv: 'sl',
	sme: 'se',
	smo: 'sm',
	sna: 'sn',
	snd: 'sd',
	som: 'so',
	sot: 'st',
	spa: 'es',
	spv: 'or',
	sqi: 'sq',
	src: 'sc',
	srd: 'sc',
	sro: 'sc',
	srp: 'sh',
	ssh: 'ar',
	ssw: 'ss',
	sun: 'su',
	swa: 'sw',
	swc: 'sw',
	swe: 'sv',
	swh: 'sw',
	tah: 'ty',
	tam: 'ta',
	tat: 'tt',
	tdx: 'mg',
	tel: 'te',
	tgk: 'tg',
	tgl: 'tl',
	tha: 'th',
	tir: 'ti',
	tkg: 'mg',
	tmw: 'ms',
	ton: 'to',
	tsn: 'tn',
	tso: 'ts',
	tuk: 'tk',
	tur: 'tr',
	twi: 'ak',
	txy: 'mg',
	uig: 'ug',
	ukr: 'uk',
	urd: 'ur',
	urk: 'ms',
	uzb: 'uz',
	uzn: 'uz',
	uzs: 'uz',
	ven: 've',
	vie: 'vi',
	vkk: 'ms',
	vkt: 'ms',
	vol: 'vo',
	vro: 'et',
	wln: 'wa',
	wol: 'wo',
	wuu: 'zh',
	xho: 'xh',
	xmm: 'ms',
	xmv: 'mg',
	xmw: 'mg',
	ydd: 'yi',
	yid: 'yi',
	yih: 'yi',
	yor: 'yo',
	yue: 'zh',
	zch: 'za',
	zeh: 'za',
	zgb: 'za',
	zgm: 'za',
	zgn: 'za',
	zha: 'za',
	zhd: 'za',
	zhn: 'za',
	zho: 'zh',
	zlj: 'za',
	zlm: 'ms',
	zln: 'za',
	zlq: 'za',
	zmi: 'ms',
	zqe: 'za',
	zsm: 'ms',
	zul: 'zu',
	zyb: 'za',
	zyg: 'za',
	zyj: 'za',
	zyn: 'za',
	zzj: 'za'
};

function textToIso6393(text) {
	const res = francAll(text);
	return Array.isArray(res) ? res[0][0] : null;
}

function textToIso6391(text) {
	const franLanguage = textToIso6393(text);
	if (franLanguage && iso6393[franLanguage]) {
		return iso6393[franLanguage];
	}
	return null;
}

function getLanguageAttribute(doc) {
	return doc.documentElement.getAttribute('lang');
}

export { textToIso6391, getLanguageAttribute };
