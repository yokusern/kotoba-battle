// Sprite sheet mapping — 5 sheets, each card maps to (sheet, col, row)
// Sheet filenames: /cards/sheet1.webp 〜 sheet5.webp
// Usage: place the 5 sprite sheets in /public/cards/
// Order per sheet matches the image batches sent

export interface SpritePos {
  sheet: number;   // 1-5
  col: number;     // 0-indexed
  row: number;     // 0-indexed
  cols: number;    // total cols in sheet
  rows: number;    // total rows in sheet
}

// Sheet 1: 自然・宇宙・災害 — 7 cols × 4 rows
// Row 0: 石 水 火 風 木 雷 氷
// Row 1: 砂 山 海 太陽 隕石 ブラックホール 月
// Row 2: 流れ星 火事 台風 地震 津波 噴火 竜巻
// Row 3: 吹雪 落雷 砂漠 森 火山 宇宙 光
const S1 = (col: number, row: number): SpritePos => ({ sheet: 1, col, row, cols: 7, rows: 4 });

// Sheet 2: 生物 — 5 cols × 3 rows
// Row 0: ゴキブリ 猫 犬 熊 サメ
// Row 1: 蚊 象 ハチ バクテリア ネズミ
// Row 2: 恐竜 クラゲ タコ
const S2 = (col: number, row: number): SpritePos => ({ sheet: 2, col, row, cols: 5, rows: 3 });

// Sheet 3: 道具・防具 — 6 cols × 3 rows
// Row 0: 包丁 ハサミ 盾 鎧 傘 ロープ
// Row 1: 消火器 懐中電灯 マッチ 鏡 磁石 避雷針
// Row 2: ヘルメット 地下シェルター 斧 チェーンソー 罠
const S3 = (col: number, row: number): SpritePos => ({ sheet: 3, col, row, cols: 6, rows: 3 });

// Sheet 4: 日常・現代・食べ物・回復 — 6 cols × 4 rows
// Row 0: スリッパ 新聞紙 おにぎり カレー 薬 温泉
// Row 1: エナジードリンク コーヒー 酒 母の手料理 SNS炎上 法律
// Row 2: WiFi スマホ 上司の怒り 転職届 有給 掃除機
// Row 3: 目覚まし時計 タバコ お守り 給料日 信号機 ゴミ箱
const S4 = (col: number, row: number): SpritePos => ({ sheet: 4, col, row, cols: 6, rows: 4 });

// Sheet 5: 兵器・テクノロジー・概念・素材 — 5 cols × 5 rows
// Row 0: 爆弾 銃 ミサイル 戦車 毒
// Row 1: 核兵器 ロボット AI インターネット ワクチン
// Row 2: 時間 愛 死 運 知恵
// Row 3: ダイヤモンド ゴム 鉄 紙 ガラス
// Row 4: (宇宙/重力) 進化 希望 ...
const S5 = (col: number, row: number): SpritePos => ({ sheet: 5, col, row, cols: 5, rows: 5 });

export const SPRITE_MAP: Record<string, SpritePos> = {
  // Sheet 1 — 自然・宇宙・災害
  c001: S1(0,0), // 石
  c002: S1(1,0), // 水
  c003: S1(2,0), // 火
  c004: S1(3,0), // 風
  c005: S1(4,0), // 木
  c006: S1(5,0), // 雷
  c007: S1(6,0), // 氷
  c008: S1(0,1), // 砂
  c009: S1(1,1), // 山
  c010: S1(2,1), // 海
  c056: S1(3,1), // 太陽
  c057: S1(4,1), // 隕石
  c058: S1(5,1), // ブラックホール
  c059: S1(6,1), // 月
  c060: S1(0,2), // 流れ星
  c036: S1(1,2), // 火事
  c037: S1(2,2), // 台風
  c038: S1(3,2), // 地震
  c039: S1(4,2), // 津波
  c040: S1(5,2), // 噴火
  c084: S1(6,2), // 竜巻
  c085: S1(0,3), // 吹雪
  c086: S1(1,3), // 落雷
  c093: S1(2,3), // 砂漠
  c094: S1(3,3), // 森
  c095: S1(4,3), // 火山
  c096: S1(5,3), // 宇宙
  c097: S1(6,3), // 光

  // Sheet 2 — 生物
  c021: S2(0,0), // ゴキブリ
  c022: S2(1,0), // 猫
  c023: S2(2,0), // 犬
  c024: S2(3,0), // 熊
  c025: S2(4,0), // サメ
  c026: S2(0,1), // 蚊
  c027: S2(1,1), // 象
  c028: S2(2,1), // ハチ
  c029: S2(3,1), // バクテリア
  c030: S2(4,1), // ネズミ
  c087: S2(0,2), // 恐竜
  c088: S2(1,2), // クラゲ
  c089: S2(2,2), // タコ

  // Sheet 3 — 道具・防具
  c011: S3(0,0), // 包丁
  c012: S3(1,0), // ハサミ
  c013: S3(2,0), // 盾
  c014: S3(3,0), // 鎧
  c015: S3(4,0), // 傘
  c016: S3(5,0), // ロープ
  c017: S3(0,1), // 消火器
  c018: S3(1,1), // 懐中電灯
  c053: S3(2,1), // マッチ
  c054: S3(3,1), // 鏡
  c055: S3(4,1), // 磁石
  c090: S3(5,1), // 避雷針
  c091: S3(0,2), // ヘルメット
  c092: S3(1,2), // 地下シェルター
  c081: S3(2,2), // 斧
  c082: S3(3,2), // チェーンソー
  c083: S3(4,2), // 罠

  // Sheet 4 — 日常・現代・食べ物
  c019: S4(0,0), // スリッパ
  c020: S4(1,0), // 新聞紙
  c041: S4(2,0), // おにぎり
  c042: S4(3,0), // カレー
  c043: S4(4,0), // 薬
  c044: S4(5,0), // 温泉
  c045: S4(0,1), // エナジードリンク
  c076: S4(1,1), // コーヒー
  c077: S4(2,1), // 酒
  c078: S4(3,1), // 母の手料理
  c046: S4(4,1), // SNS炎上
  c047: S4(5,1), // 法律
  c048: S4(0,2), // WiFi
  c049: S4(1,2), // スマホ
  c050: S4(2,2), // 上司の怒り
  c079: S4(3,2), // 転職届
  c080: S4(4,2), // 有給
  c051: S4(5,2), // 掃除機
  c052: S4(0,3), // 目覚まし時計
  c101: S4(1,3), // タバコ
  c102: S4(2,3), // お守り
  c103: S4(3,3), // 給料日
  c104: S4(4,3), // 信号機
  c105: S4(5,3), // ゴミ箱

  // Sheet 5 — 兵器・テクノロジー・概念・素材
  c031: S5(0,0), // 爆弾
  c032: S5(1,0), // 銃
  c033: S5(2,0), // ミサイル
  c034: S5(3,0), // 戦車
  c035: S5(4,0), // 毒
  c074: S5(0,1), // 核兵器
  c071: S5(1,1), // ロボット
  c072: S5(2,1), // AI
  c073: S5(3,1), // インターネット
  c075: S5(4,1), // ワクチン
  c061: S5(0,2), // 時間
  c062: S5(1,2), // 愛
  c063: S5(2,2), // 死
  c064: S5(3,2), // 運
  c065: S5(4,2), // 知恵
  c066: S5(0,3), // ダイヤモンド
  c067: S5(1,3), // ゴム
  c068: S5(2,3), // 鉄
  c069: S5(3,3), // 紙
  c070: S5(4,3), // ガラス
  c098: S5(0,4), // 重力
  c099: S5(1,4), // 進化
  c100: S5(2,4), // 希望
};

export function getSpriteStyle(id: string): React.CSSProperties | null {
  const pos = SPRITE_MAP[id];
  if (!pos) return null;
  const xPct = pos.cols === 1 ? 0 : (pos.col / (pos.cols - 1)) * 100;
  const yPct = pos.rows === 1 ? 0 : (pos.row / (pos.rows - 1)) * 100;
  return {
    backgroundImage: `url('/cards/sheet${pos.sheet}.webp')`,
    backgroundSize: `${pos.cols * 100}% ${pos.rows * 100}%`,
    backgroundPosition: `${xPct.toFixed(2)}% ${yPct.toFixed(2)}%`,
    backgroundRepeat: "no-repeat",
  };
}
