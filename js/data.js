'use strict';

/* ─── Hiragana ─────────────────────────────────────────────────────────────── */
const HIRAGANA_BASIC = [
  {char:'あ',romaji:'a',alts:[]},{char:'い',romaji:'i',alts:[]},{char:'う',romaji:'u',alts:[]},{char:'え',romaji:'e',alts:[]},{char:'お',romaji:'o',alts:[]},
  {char:'か',romaji:'ka',alts:[]},{char:'き',romaji:'ki',alts:[]},{char:'く',romaji:'ku',alts:[]},{char:'け',romaji:'ke',alts:[]},{char:'こ',romaji:'ko',alts:[]},
  {char:'さ',romaji:'sa',alts:[]},{char:'し',romaji:'shi',alts:['si']},{char:'す',romaji:'su',alts:[]},{char:'せ',romaji:'se',alts:[]},{char:'そ',romaji:'so',alts:[]},
  {char:'た',romaji:'ta',alts:[]},{char:'ち',romaji:'chi',alts:['ti']},{char:'つ',romaji:'tsu',alts:['tu']},{char:'て',romaji:'te',alts:[]},{char:'と',romaji:'to',alts:[]},
  {char:'な',romaji:'na',alts:[]},{char:'に',romaji:'ni',alts:[]},{char:'ぬ',romaji:'nu',alts:[]},{char:'ね',romaji:'ne',alts:[]},{char:'の',romaji:'no',alts:[]},
  {char:'は',romaji:'ha',alts:[]},{char:'ひ',romaji:'hi',alts:[]},{char:'ふ',romaji:'fu',alts:['hu']},{char:'へ',romaji:'he',alts:[]},{char:'ほ',romaji:'ho',alts:[]},
  {char:'ま',romaji:'ma',alts:[]},{char:'み',romaji:'mi',alts:[]},{char:'む',romaji:'mu',alts:[]},{char:'め',romaji:'me',alts:[]},{char:'も',romaji:'mo',alts:[]},
  {char:'や',romaji:'ya',alts:[]},{char:'ゆ',romaji:'yu',alts:[]},{char:'よ',romaji:'yo',alts:[]},
  {char:'ら',romaji:'ra',alts:[]},{char:'り',romaji:'ri',alts:[]},{char:'る',romaji:'ru',alts:[]},{char:'れ',romaji:'re',alts:[]},{char:'ろ',romaji:'ro',alts:[]},
  {char:'わ',romaji:'wa',alts:[]},{char:'を',romaji:'wo',alts:['o']},{char:'ん',romaji:'n',alts:['nn']},
];

const HIRAGANA_DAKUTEN = [
  {char:'が',romaji:'ga',alts:[]},{char:'ぎ',romaji:'gi',alts:[]},{char:'ぐ',romaji:'gu',alts:[]},{char:'げ',romaji:'ge',alts:[]},{char:'ご',romaji:'go',alts:[]},
  {char:'ざ',romaji:'za',alts:[]},{char:'じ',romaji:'ji',alts:['zi']},{char:'ず',romaji:'zu',alts:[]},{char:'ぜ',romaji:'ze',alts:[]},{char:'ぞ',romaji:'zo',alts:[]},
  {char:'だ',romaji:'da',alts:[]},{char:'ぢ',romaji:'ji',alts:['di']},{char:'づ',romaji:'zu',alts:['du']},{char:'で',romaji:'de',alts:[]},{char:'ど',romaji:'do',alts:[]},
  {char:'ば',romaji:'ba',alts:[]},{char:'び',romaji:'bi',alts:[]},{char:'ぶ',romaji:'bu',alts:[]},{char:'べ',romaji:'be',alts:[]},{char:'ぼ',romaji:'bo',alts:[]},
  {char:'ぱ',romaji:'pa',alts:[]},{char:'ぴ',romaji:'pi',alts:[]},{char:'ぷ',romaji:'pu',alts:[]},{char:'ぺ',romaji:'pe',alts:[]},{char:'ぽ',romaji:'po',alts:[]},
];

const HIRAGANA_COMBOS = [
  {char:'きゃ',romaji:'kya',alts:[]},{char:'きゅ',romaji:'kyu',alts:[]},{char:'きょ',romaji:'kyo',alts:[]},
  {char:'しゃ',romaji:'sha',alts:['sya']},{char:'しゅ',romaji:'shu',alts:['syu']},{char:'しょ',romaji:'sho',alts:['syo']},
  {char:'ちゃ',romaji:'cha',alts:['tya']},{char:'ちゅ',romaji:'chu',alts:['tyu']},{char:'ちょ',romaji:'cho',alts:['tyo']},
  {char:'にゃ',romaji:'nya',alts:[]},{char:'にゅ',romaji:'nyu',alts:[]},{char:'にょ',romaji:'nyo',alts:[]},
  {char:'ひゃ',romaji:'hya',alts:[]},{char:'ひゅ',romaji:'hyu',alts:[]},{char:'ひょ',romaji:'hyo',alts:[]},
  {char:'みゃ',romaji:'mya',alts:[]},{char:'みゅ',romaji:'myu',alts:[]},{char:'みょ',romaji:'myo',alts:[]},
  {char:'りゃ',romaji:'rya',alts:[]},{char:'りゅ',romaji:'ryu',alts:[]},{char:'りょ',romaji:'ryo',alts:[]},
  {char:'ぎゃ',romaji:'gya',alts:[]},{char:'ぎゅ',romaji:'gyu',alts:[]},{char:'ぎょ',romaji:'gyo',alts:[]},
  {char:'じゃ',romaji:'ja',alts:['jya']},{char:'じゅ',romaji:'ju',alts:['jyu']},{char:'じょ',romaji:'jo',alts:['jyo']},
  {char:'びゃ',romaji:'bya',alts:[]},{char:'びゅ',romaji:'byu',alts:[]},{char:'びょ',romaji:'byo',alts:[]},
  {char:'ぴゃ',romaji:'pya',alts:[]},{char:'ぴゅ',romaji:'pyu',alts:[]},{char:'ぴょ',romaji:'pyo',alts:[]},
];

/* Convert hiragana to katakana (U+3041..U+3096 → +0x60) */
const toKatakana = (str) =>
  str.replace(/[ぁ-ゖ]/g, ch => String.fromCharCode(ch.charCodeAt(0) + 0x60));

const mkKata = (arr) => arr.map(k => ({ ...k, char: toKatakana(k.char), type: 'katakana' }));

const KATAKANA_BASIC   = mkKata(HIRAGANA_BASIC);
const KATAKANA_DAKUTEN = mkKata(HIRAGANA_DAKUTEN);
const KATAKANA_COMBOS  = mkKata(HIRAGANA_COMBOS);

const tag = (arr, type, diff) => arr.map(k => ({ ...k, type, diff }));

const KANA = {
  hiragana: {
    easy: tag(HIRAGANA_BASIC, 'hiragana', 'easy'),
    hard: tag([...HIRAGANA_BASIC, ...HIRAGANA_DAKUTEN, ...HIRAGANA_COMBOS], 'hiragana', 'hard'),
  },
  katakana: {
    easy: tag(KATAKANA_BASIC, 'katakana', 'easy'),
    hard: tag([...KATAKANA_BASIC, ...KATAKANA_DAKUTEN, ...KATAKANA_COMBOS], 'katakana', 'hard'),
  },
  mixed: {
    easy: tag([...HIRAGANA_BASIC, ...KATAKANA_BASIC], 'mixed', 'easy'),
    hard: tag([
      ...HIRAGANA_BASIC, ...HIRAGANA_DAKUTEN, ...HIRAGANA_COMBOS,
      ...KATAKANA_BASIC, ...KATAKANA_DAKUTEN, ...KATAKANA_COMBOS,
    ], 'mixed', 'hard'),
  },
};

/* ─── Kana Reference Table Data ────────────────────────────────────────────── */
/*
 * Each row: { row: 'label', cells: [[char, romaji] | null, ...] }
 * null = empty cell (y-row gaps, w-row gaps, etc.)
 */
const KANA_TABLE_ROWS = {
  basic: [
    { row: '',  cells: [['あ','a'],  ['い','i'],   ['う','u'],   ['え','e'],  ['お','o']  ] },
    { row: 'k', cells: [['か','ka'], ['き','ki'],  ['く','ku'],  ['け','ke'], ['こ','ko'] ] },
    { row: 's', cells: [['さ','sa'], ['し','shi'], ['す','su'],  ['せ','se'], ['そ','so'] ] },
    { row: 't', cells: [['た','ta'], ['ち','chi'], ['つ','tsu'], ['て','te'], ['と','to'] ] },
    { row: 'n', cells: [['な','na'], ['に','ni'],  ['ぬ','nu'],  ['ね','ne'], ['の','no'] ] },
    { row: 'h', cells: [['は','ha'], ['ひ','hi'],  ['ふ','fu'],  ['へ','he'], ['ほ','ho'] ] },
    { row: 'm', cells: [['ま','ma'], ['み','mi'],  ['む','mu'],  ['め','me'], ['も','mo'] ] },
    { row: 'y', cells: [['や','ya'], null,         ['ゆ','yu'],  null,        ['よ','yo'] ] },
    { row: 'r', cells: [['ら','ra'], ['り','ri'],  ['る','ru'],  ['れ','re'], ['ろ','ro'] ] },
    { row: 'w', cells: [['わ','wa'], null,         null,         null,        ['を','wo'] ] },
    { row: 'n', cells: [['ん','n'],  null,         null,         null,        null        ] },
  ],
  voiced: [
    { row: 'g', cells: [['が','ga'], ['ぎ','gi'], ['ぐ','gu'], ['げ','ge'], ['ご','go'] ] },
    { row: 'z', cells: [['ざ','za'], ['じ','ji'], ['ず','zu'], ['ぜ','ze'], ['ぞ','zo'] ] },
    { row: 'd', cells: [['だ','da'], ['ぢ','ji'], ['づ','zu'], ['で','de'], ['ど','do'] ] },
    { row: 'b', cells: [['ば','ba'], ['び','bi'], ['ぶ','bu'], ['べ','be'], ['ぼ','bo'] ] },
    { row: 'p', cells: [['ぱ','pa'], ['ぴ','pi'], ['ぷ','pu'], ['ぺ','pe'], ['ぽ','po'] ] },
  ],
  combos: [
    { row: 'き', cells: [['きゃ','kya'], ['きゅ','kyu'], ['きょ','kyo']] },
    { row: 'し', cells: [['しゃ','sha'], ['しゅ','shu'], ['しょ','sho']] },
    { row: 'ち', cells: [['ちゃ','cha'], ['ちゅ','chu'], ['ちょ','cho']] },
    { row: 'に', cells: [['にゃ','nya'], ['にゅ','nyu'], ['にょ','nyo']] },
    { row: 'ひ', cells: [['ひゃ','hya'], ['ひゅ','hyu'], ['ひょ','hyo']] },
    { row: 'み', cells: [['みゃ','mya'], ['みゅ','myu'], ['みょ','myo']] },
    { row: 'り', cells: [['りゃ','rya'], ['りゅ','ryu'], ['りょ','ryo']] },
    { row: 'ぎ', cells: [['ぎゃ','gya'], ['ぎゅ','gyu'], ['ぎょ','gyo']] },
    { row: 'じ', cells: [['じゃ','ja'],  ['じゅ','ju'],  ['じょ','jo'] ] },
    { row: 'び', cells: [['びゃ','bya'], ['びゅ','byu'], ['びょ','byo']] },
    { row: 'ぴ', cells: [['ぴゃ','pya'], ['ぴゅ','pyu'], ['ぴょ','pyo']] },
  ],
};

/* Returns table data for the given script type, converting hiragana → katakana if needed */
function getKanaTableData(type) {
  if (type === 'hiragana') return KANA_TABLE_ROWS;
  const result = {};
  for (const [section, rows] of Object.entries(KANA_TABLE_ROWS)) {
    result[section] = rows.map(r => ({
      row: /[ぁ-ゖ]/.test(r.row) ? toKatakana(r.row) : r.row,
      cells: r.cells.map(c => c ? [toKatakana(c[0]), c[1]] : null),
    }));
  }
  return result;
}

/* ─── Vocabulary ───────────────────────────────────────────────────────────── */
const VOCAB = [
  { id:'v001', category:'animals',   japanese:'ねこ',       romaji:'neko',       english:'cat',           emoji:'🐱' },
  { id:'v002', category:'animals',   japanese:'いぬ',       romaji:'inu',        english:'dog',           emoji:'🐶' },
  { id:'v003', category:'animals',   japanese:'さかな',     romaji:'sakana',     english:'fish',          emoji:'🐟' },
  { id:'v004', category:'animals',   japanese:'とり',       romaji:'tori',       english:'bird',          emoji:'🐦' },
  { id:'v005', category:'animals',   japanese:'うさぎ',     romaji:'usagi',      english:'rabbit',        emoji:'🐰' },
  { id:'v006', category:'animals',   japanese:'くま',       romaji:'kuma',       english:'bear',          emoji:'🐻' },
  { id:'v007', category:'animals',   japanese:'ぞう',       romaji:'zou',        english:'elephant',      emoji:'🐘' },
  { id:'v008', category:'animals',   japanese:'キリン',     romaji:'kirin',      english:'giraffe',       emoji:'🦒' },
  { id:'v009', category:'animals',   japanese:'ライオン',   romaji:'raion',      english:'lion',          emoji:'🦁' },
  { id:'v010', category:'animals',   japanese:'ペンギン',   romaji:'pengin',     english:'penguin',       emoji:'🐧' },
  { id:'v011', category:'animals',   japanese:'うま',       romaji:'uma',        english:'horse',         emoji:'🐴' },
  { id:'v012', category:'animals',   japanese:'ぶた',       romaji:'buta',       english:'pig',           emoji:'🐷' },
  { id:'v013', category:'food',      japanese:'ごはん',     romaji:'gohan',      english:'rice / meal',   emoji:'🍚' },
  { id:'v014', category:'food',      japanese:'パン',       romaji:'pan',        english:'bread',         emoji:'🍞' },
  { id:'v015', category:'food',      japanese:'みず',       romaji:'mizu',       english:'water',         emoji:'💧' },
  { id:'v016', category:'food',      japanese:'おちゃ',     romaji:'ocha',       english:'tea',           emoji:'🍵' },
  { id:'v017', category:'food',      japanese:'りんご',     romaji:'ringo',      english:'apple',         emoji:'🍎' },
  { id:'v018', category:'food',      japanese:'バナナ',     romaji:'banana',     english:'banana',        emoji:'🍌' },
  { id:'v019', category:'food',      japanese:'ラーメン',   romaji:'raamen',     english:'ramen',         emoji:'🍜' },
  { id:'v020', category:'food',      japanese:'すし',       romaji:'sushi',      english:'sushi',         emoji:'🍣' },
  { id:'v021', category:'food',      japanese:'たまご',     romaji:'tamago',     english:'egg',           emoji:'🥚' },
  { id:'v022', category:'food',      japanese:'にく',       romaji:'niku',       english:'meat',          emoji:'🥩' },
  { id:'v023', category:'food',      japanese:'やさい',     romaji:'yasai',      english:'vegetable',     emoji:'🥦' },
  { id:'v024', category:'food',      japanese:'くだもの',   romaji:'kudamono',   english:'fruit',         emoji:'🍊' },
  { id:'v025', category:'household', japanese:'いす',       romaji:'isu',        english:'chair',         emoji:'🪑' },
  { id:'v026', category:'household', japanese:'つくえ',     romaji:'tsukue',     english:'desk',          emoji:'🪵' },
  { id:'v027', category:'household', japanese:'ほん',       romaji:'hon',        english:'book',          emoji:'📖' },
  { id:'v028', category:'household', japanese:'とけい',     romaji:'tokei',      english:'clock / watch', emoji:'⏰' },
  { id:'v029', category:'household', japanese:'かばん',     romaji:'kaban',      english:'bag',           emoji:'👜' },
  { id:'v030', category:'household', japanese:'まど',       romaji:'mado',       english:'window',        emoji:'🪟' },
  { id:'v031', category:'household', japanese:'ドア',       romaji:'doa',        english:'door',          emoji:'🚪' },
  { id:'v032', category:'household', japanese:'テレビ',     romaji:'terebi',     english:'television',    emoji:'📺' },
  { id:'v033', category:'household', japanese:'でんわ',     romaji:'denwa',      english:'telephone',     emoji:'📞' },
  { id:'v034', category:'household', japanese:'ベッド',     romaji:'beddo',      english:'bed',           emoji:'🛏' },
  { id:'v035', category:'household', japanese:'れいぞうこ', romaji:'reizouko',   english:'refrigerator',  emoji:'🧊' },
  { id:'v036', category:'household', japanese:'かがみ',     romaji:'kagami',     english:'mirror',        emoji:'🪞' },
  { id:'v037', category:'school',    japanese:'えんぴつ',   romaji:'enpitsu',    english:'pencil',        emoji:'✏️' },
  { id:'v038', category:'school',    japanese:'ノート',     romaji:'nooto',      english:'notebook',      emoji:'📓' },
  { id:'v039', category:'school',    japanese:'せんせい',   romaji:'sensei',     english:'teacher',       emoji:'👩‍🏫' },
  { id:'v040', category:'school',    japanese:'がっこう',   romaji:'gakkou',     english:'school',        emoji:'🏫' },
  { id:'v041', category:'school',    japanese:'きょうしつ', romaji:'kyoushitsu', english:'classroom',     emoji:'🏛' },
  { id:'v042', category:'school',    japanese:'こくばん',   romaji:'kokuban',    english:'blackboard',    emoji:'🖊' },
  { id:'v043', category:'school',    japanese:'けしごむ',   romaji:'keshigomu',  english:'eraser',        emoji:'📐' },
  { id:'v044', category:'school',    japanese:'じしょ',     romaji:'jisho',      english:'dictionary',    emoji:'📚' },
  { id:'v045', category:'school',    japanese:'せいと',     romaji:'seito',      english:'student',       emoji:'🧑‍🎓' },
  { id:'v046', category:'nature',    japanese:'はな',       romaji:'hana',       english:'flower',        emoji:'🌸' },
  { id:'v047', category:'nature',    japanese:'き',         romaji:'ki',         english:'tree',          emoji:'🌳' },
  { id:'v048', category:'nature',    japanese:'やま',       romaji:'yama',       english:'mountain',      emoji:'⛰' },
  { id:'v049', category:'nature',    japanese:'かわ',       romaji:'kawa',       english:'river',         emoji:'🏞' },
  { id:'v050', category:'nature',    japanese:'うみ',       romaji:'umi',        english:'sea / ocean',   emoji:'🌊' },
  { id:'v051', category:'nature',    japanese:'つき',       romaji:'tsuki',      english:'moon',          emoji:'🌙' },
  { id:'v052', category:'nature',    japanese:'たいよう',   romaji:'taiyou',     english:'sun',           emoji:'☀' },
  { id:'v053', category:'nature',    japanese:'ほし',       romaji:'hoshi',      english:'star',          emoji:'⭐' },
  { id:'v054', category:'nature',    japanese:'くも',       romaji:'kumo',       english:'cloud',         emoji:'☁' },
  { id:'v055', category:'nature',    japanese:'あめ',       romaji:'ame',        english:'rain',          emoji:'🌧' },
  { id:'v056', category:'nature',    japanese:'ゆき',       romaji:'yuki',       english:'snow',          emoji:'❄' },
  { id:'v057', category:'nature',    japanese:'かぜ',       romaji:'kaze',       english:'wind',          emoji:'🌬' },
  { id:'v058', category:'transport', japanese:'くるま',     romaji:'kuruma',     english:'car',           emoji:'🚗' },
  { id:'v059', category:'transport', japanese:'バス',       romaji:'basu',       english:'bus',           emoji:'🚌' },
  { id:'v060', category:'transport', japanese:'でんしゃ',   romaji:'densha',     english:'train',         emoji:'🚃' },
  { id:'v061', category:'transport', japanese:'ひこうき',   romaji:'hikouki',    english:'airplane',      emoji:'✈' },
  { id:'v062', category:'transport', japanese:'じてんしゃ', romaji:'jitensha',   english:'bicycle',       emoji:'🚲' },
  { id:'v063', category:'transport', japanese:'ふね',       romaji:'fune',       english:'ship / boat',   emoji:'🚢' },
  { id:'v064', category:'transport', japanese:'タクシー',   romaji:'takushii',   english:'taxi',          emoji:'🚕' },
  { id:'v065', category:'transport', japanese:'バイク',     romaji:'baiku',      english:'motorcycle',    emoji:'🏍' },
  { id:'v066', category:'transport', japanese:'ちかてつ',   romaji:'chikatetsu', english:'subway',        emoji:'🚇' },
  { id:'v067', category:'family',    japanese:'おかあさん', romaji:'okaasan',    english:'mother',        emoji:'👩' },
  { id:'v068', category:'family',    japanese:'おとうさん', romaji:'otousan',    english:'father',        emoji:'👨' },
  { id:'v069', category:'family',    japanese:'おにいさん', romaji:'oniisan',    english:'older brother', emoji:'🧒' },
  { id:'v070', category:'family',    japanese:'おねえさん', romaji:'oneesan',    english:'older sister',  emoji:'👧' },
  { id:'v071', category:'family',    japanese:'いもうと',   romaji:'imouto',     english:'younger sister',emoji:'👶' },
  { id:'v072', category:'family',    japanese:'おとうと',   romaji:'otouto',     english:'younger brother',emoji:'👦'},
  { id:'v073', category:'family',    japanese:'おじいさん', romaji:'ojiisan',    english:'grandfather',   emoji:'👴' },
  { id:'v074', category:'family',    japanese:'おばあさん', romaji:'obaasan',    english:'grandmother',   emoji:'👵' },
  { id:'v075', category:'family',    japanese:'かぞく',     romaji:'kazoku',     english:'family',        emoji:'👨‍👩‍👧' },
  { id:'v076', category:'family',    japanese:'こども',     romaji:'kodomo',     english:'child',         emoji:'🧒' },
];

const VOCAB_CATEGORIES = [
  { id:'all',       label:'All Words',      emoji:'📦', color:'#6366f1' },
  { id:'animals',   label:'Animals',        emoji:'🐾', color:'#22c55e' },
  { id:'food',      label:'Food',           emoji:'🍜', color:'#f97316' },
  { id:'household', label:'Household',      emoji:'🏠', color:'#3b82f6' },
  { id:'school',    label:'School',         emoji:'📚', color:'#8b5cf6' },
  { id:'nature',    label:'Nature',         emoji:'🌿', color:'#10b981' },
  { id:'transport', label:'Transportation', emoji:'🚃', color:'#f59e0b' },
  { id:'family',    label:'Family',         emoji:'👨‍👩‍👧', color:'#ec4899' },
];

const ACHIEVEMENTS = [
  { id:'first_game',      label:'First Steps',        desc:'Complete your first kana game',           icon:'🎮', xp:10  },
  { id:'kana_10',         label:'Kana Rookie',         desc:'Correctly answer 10 different kana',      icon:'🔤', xp:20  },
  { id:'hiragana_all',    label:'Hiragana Hero',       desc:'Master all 46 basic hiragana',            icon:'✨', xp:100 },
  { id:'katakana_all',    label:'Katakana Conqueror',  desc:'Master all 46 basic katakana',            icon:'⚡', xp:100 },
  { id:'kana_master',     label:'Kana Master',         desc:'Master all basic kana',                   icon:'🏆', xp:250 },
  { id:'speed_50',        label:'Speed Demon',         desc:'Score 50+ in a 30-second game',           icon:'💨', xp:50  },
  { id:'combo_10',        label:'Combo King',          desc:'Get a 10x combo',                         icon:'🔥', xp:30  },
  { id:'combo_20',        label:'Combo Legend',        desc:'Get a 20x combo',                         icon:'🌟', xp:80  },
  { id:'perfect_accuracy',label:'Sharpshooter',        desc:'100% accuracy in a game (10+ chars)',     icon:'🎯', xp:50  },
  { id:'first_write',     label:'First Stroke',        desc:'Complete your first writing exercise',    icon:'✏️', xp:10  },
  { id:'write_10',        label:'Calligrapher',        desc:'Write 10 characters with good accuracy',  icon:'🖌️', xp:40  },
  { id:'vocab_10',        label:'Word Collector',      desc:'Learn 10 vocabulary words',               icon:'📖', xp:20  },
  { id:'vocab_50',        label:'Vocabulary Builder',  desc:'Learn 50 vocabulary words',               icon:'📚', xp:75  },
  { id:'vocab_all',       label:'Linguist',            desc:'Study all vocabulary categories',         icon:'🗣️', xp:100 },
  { id:'streak_3',        label:'Daily Learner',       desc:'Maintain a 3-day streak',                 icon:'📅', xp:30  },
  { id:'streak_7',        label:'Week Warrior',        desc:'Maintain a 7-day streak',                 icon:'🗓️', xp:75  },
  { id:'streak_30',       label:'Monthly Master',      desc:'Maintain a 30-day streak',                icon:'🏅', xp:300 },
  { id:'xp_100',          label:'Getting Started',     desc:'Earn 100 XP total',                       icon:'⚡', xp:10  },
  { id:'xp_500',          label:'Growing',             desc:'Earn 500 XP total',                       icon:'💪', xp:20  },
  { id:'xp_1000',         label:'Dedicated',           desc:'Earn 1000 XP total',                      icon:'🌠', xp:50  },
  { id:'xp_5000',         label:'Scholar',             desc:'Earn 5000 XP total',                      icon:'🎓', xp:150 },
];

/*
 * Level thresholds — intentionally steep so progression feels earned.
 * Formula: each level roughly doubles the XP gap of the previous.
 *
 *   Level  Name          Min XP   Gap to next   ~Games needed*
 *   1      Beginner         0        300           —
 *   2      Novice         300        450          ~4
 *   3      Apprentice     750        750          ~9
 *   4      Student       1500       1500         ~18
 *   5      Intermediate  3000       3000         ~36
 *   6      Proficient    6000       4000         ~73
 *   7      Advanced     10000       8000        ~122
 *   8      Expert       18000      12000        ~220
 *   9      Master       30000      20000        ~366
 *   10     Grandmaster  50000        —          ~610
 *
 * (* Assumes ~82 XP per solid 60-second game: 40 correct × 2 + 10 combo bonus)
 */
const LEVELS = [
  { level:1,  name:'Beginner',     minXp:0,     color:'#94a3b8', badge:'🌱' },
  { level:2,  name:'Novice',       minXp:300,   color:'#22c55e', badge:'🌿' },
  { level:3,  name:'Apprentice',   minXp:750,   color:'#3b82f6', badge:'💧' },
  { level:4,  name:'Student',      minXp:1500,  color:'#8b5cf6', badge:'📖' },
  { level:5,  name:'Intermediate', minXp:3000,  color:'#f59e0b', badge:'⭐' },
  { level:6,  name:'Proficient',   minXp:6000,  color:'#f97316', badge:'🔥' },
  { level:7,  name:'Advanced',     minXp:10000, color:'#ef4444', badge:'💎' },
  { level:8,  name:'Expert',       minXp:18000, color:'#ec4899', badge:'🌸' },
  { level:9,  name:'Master',       minXp:30000, color:'#a855f7', badge:'👑' },
  { level:10, name:'Grandmaster',  minXp:50000, color:'#eab308', badge:'🏆' },
];

function getLevelInfo(xp) {
  let current = LEVELS[0];
  let next    = LEVELS[1];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXp) {
      current = LEVELS[i];
      next    = LEVELS[i + 1] || null;
      break;
    }
  }
  const progress = next
    ? ((xp - current.minXp) / (next.minXp - current.minXp)) * 100
    : 100;
  return { current, next, progress };
}

function getVocabByCategory(cat) {
  return cat === 'all' ? VOCAB : VOCAB.filter(v => v.category === cat);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getKanaSet(mode, difficulty) {
  return shuffle(KANA[mode][difficulty]);
}
