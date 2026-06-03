"""Generate individual card images for ことばバトル."""
from PIL import Image, ImageDraw, ImageFont
import os, math

OUT = "public/cards"
os.makedirs(OUT, exist_ok=True)
W, H = 256, 256

RARITY_ACCENT = {
    "common":    (100, 100, 120),
    "rare":      (74, 158, 255),
    "epic":      (168, 85, 247),
    "legendary": (245, 158, 11),
    "mythic":    (255, 0, 119),
}
CAT_BG = {
    "自然":       (18, 50, 25),
    "道具":       (25, 25, 42),
    "日常":       (42, 26, 10),
    "生物":       (13, 40, 13),
    "兵器":       (40, 13, 13),
    "食べ物":     (42, 26, 0),
    "現代":       (10, 26, 42),
    "回復":       (26, 13, 30),
    "災害":       (50, 13, 13),
    "宇宙":       (5, 5, 25),
    "概念":       (13, 13, 30),
    "防具":       (30, 30, 30),
    "素材":       (26, 20, 0),
    "テクノロジー": (0, 21, 26),
    "鉱物":       (10, 10, 30),
    "建物":       (26, 26, 0),
}
RARITY_ORDER = ["common", "rare", "epic", "legendary", "mythic"]

CARDS = [
    ("c001","石","自然","common"),("c002","水","自然","common"),
    ("c003","火","自然","common"),("c004","風","自然","common"),
    ("c005","木","自然","common"),("c006","雷","自然","rare"),
    ("c007","氷","自然","common"),("c008","砂","自然","common"),
    ("c009","山","自然","rare"),("c010","海","自然","rare"),
    ("c011","包丁","道具","common"),("c012","ハサミ","道具","common"),
    ("c013","盾","防具","common"),("c014","鎧","防具","rare"),
    ("c015","傘","道具","common"),("c016","ロープ","道具","common"),
    ("c017","消火器","道具","common"),("c018","懐中電灯","道具","common"),
    ("c019","スリッパ","日常","common"),("c020","新聞紙","日常","common"),
    ("c021","ゴキブリ","生物","common"),("c022","猫","生物","common"),
    ("c023","犬","生物","common"),("c024","熊","生物","rare"),
    ("c025","サメ","生物","rare"),("c026","蚊","生物","common"),
    ("c027","象","生物","rare"),("c028","ハチ","生物","common"),
    ("c029","バクテリア","生物","rare"),("c030","ネズミ","生物","common"),
    ("c031","爆弾","兵器","epic"),("c032","銃","兵器","epic"),
    ("c033","ミサイル","兵器","epic"),("c034","戦車","兵器","epic"),
    ("c035","毒","兵器","rare"),("c036","火事","災害","rare"),
    ("c037","台風","災害","rare"),("c038","地震","災害","epic"),
    ("c039","津波","災害","epic"),("c040","噴火","災害","epic"),
    ("c041","おにぎり","食べ物","common"),("c042","カレー","食べ物","common"),
    ("c043","薬","回復","rare"),("c044","温泉","回復","rare"),
    ("c045","エナジードリンク","回復","common"),("c046","SNS炎上","現代","rare"),
    ("c047","法律","現代","rare"),("c048","WiFi","現代","common"),
    ("c049","スマホ","現代","common"),("c050","上司の怒り","現代","rare"),
    ("c051","掃除機","日常","common"),("c052","目覚まし時計","日常","common"),
    ("c053","マッチ","道具","common"),("c054","鏡","道具","rare"),
    ("c055","磁石","道具","common"),("c056","太陽","宇宙","legendary"),
    ("c057","隕石","宇宙","legendary"),("c058","ブラックホール","宇宙","legendary"),
    ("c059","月","宇宙","rare"),("c060","流れ星","宇宙","rare"),
    ("c061","時間","概念","legendary"),("c062","愛","概念","mythic"),
    ("c063","死","概念","mythic"),("c064","運","概念","legendary"),
    ("c065","知恵","概念","legendary"),("c066","ダイヤモンド","鉱物","epic"),
    ("c067","ゴム","素材","common"),("c068","鉄","素材","common"),
    ("c069","紙","素材","common"),("c070","ガラス","素材","common"),
    ("c071","ロボット","テクノロジー","epic"),("c072","AI","テクノロジー","epic"),
    ("c073","インターネット","テクノロジー","rare"),("c074","核兵器","兵器","legendary"),
    ("c075","ワクチン","テクノロジー","rare"),("c076","コーヒー","食べ物","common"),
    ("c077","酒","食べ物","common"),("c078","母の手料理","食べ物","epic"),
    ("c079","転職届","現代","rare"),("c080","有給","現代","rare"),
    ("c081","斧","道具","common"),("c082","チェーンソー","道具","rare"),
    ("c083","罠","道具","rare"),("c084","竜巻","災害","epic"),
    ("c085","吹雪","災害","rare"),("c086","落雷","災害","epic"),
    ("c087","恐竜","生物","epic"),("c088","クラゲ","生物","common"),
    ("c089","タコ","生物","common"),("c090","避雷針","道具","common"),
    ("c091","ヘルメット","防具","common"),("c092","地下シェルター","建物","epic"),
    ("c093","砂漠","自然","rare"),("c094","森","自然","common"),
    ("c095","火山","自然","epic"),("c096","宇宙","宇宙","mythic"),
    ("c097","光","宇宙","legendary"),("c098","重力","概念","legendary"),
    ("c099","進化","概念","legendary"),("c100","希望","概念","mythic"),
    ("c101","タバコ","日常","common"),("c102","お守り","日常","rare"),
    ("c103","給料日","現代","rare"),("c104","信号機","日常","common"),
    ("c105","ゴミ箱","日常","common"),
]

# Find a Japanese-capable font
font_path = None
candidates = [
    "/System/Library/Fonts/ヒラギノ角ゴシック W6.ttc",
    "/System/Library/Fonts/Hiragino Sans GB.ttc",
    "/Library/Fonts/Arial Unicode.ttf",
    "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
    "/opt/homebrew/share/fonts/noto/NotoSansCJK-Regular.ttc",
]
for fp in candidates:
    if os.path.exists(fp):
        font_path = fp
        break

def get_font(size):
    if font_path:
        try:
            return ImageFont.truetype(font_path, size)
        except Exception:
            pass
    return ImageFont.load_default()

def draw_card(card_id, name, category, rarity):
    acc = RARITY_ACCENT.get(rarity, (100, 100, 120))
    bg  = CAT_BG.get(category, (20, 20, 30))

    img = Image.new("RGBA", (W, H), bg + (255,))
    draw = ImageDraw.Draw(img)

    # Subtle gradient overlay
    for y in range(H):
        a = int(15 * (1 - y / H))
        draw.line([(0, y), (W, y)], fill=(255, 255, 255, a))

    # Rarity border
    bw = 3
    draw.rectangle([bw, bw, W - bw, H - bw], outline=acc + (210,), width=bw)

    # Top accent bar
    draw.rectangle([0, 0, W, 18], fill=acc + (55,))

    # Rarity dots
    ri = RARITY_ORDER.index(rarity) if rarity in RARITY_ORDER else 0
    for i in range(5):
        dx = W // 2 - 40 + i * 20
        col = acc + (210,) if i <= ri else (50, 50, 60, 180)
        draw.ellipse([dx - 4, 9 - 4, dx + 4, 9 + 4], fill=col)

    # Center circle
    cx, cy = W // 2, H // 2 - 8
    r = 52
    for ring in range(r, 0, -4):
        t = ring / r
        rc = tuple(int(c * t * 0.6) for c in bg)
        draw.ellipse([cx - ring, cy - ring, cx + ring, cy + ring], fill=rc + (200,))
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=acc + (100,), width=2)

    # Glow for legendary/mythic
    if rarity in ("legendary", "mythic"):
        glow_r = r + 8
        for gr in range(glow_r, r, -1):
            alpha = int(60 * (1 - (gr - r) / 8))
            draw.ellipse([cx - gr, cy - gr, cx + gr, cy + gr], outline=acc + (alpha,), width=1)

    # Card name
    font_big = get_font(30)
    font_small = get_font(13)

    disp = name if len(name) <= 4 else name[:4]
    bb = draw.textbbox((0, 0), disp, font=font_big)
    tw = bb[2] - bb[0]
    draw.text((W // 2 - tw // 2, H - 54), disp, font=font_big, fill=(240, 230, 200, 255))

    # Category label
    bb2 = draw.textbbox((0, 0), category, font=font_small)
    tw2 = bb2[2] - bb2[0]
    draw.text((W // 2 - tw2 // 2, H - 22), category, font=font_small, fill=acc + (180,))

    img.convert("RGB").save(os.path.join(OUT, f"{card_id}.webp"), "WEBP", quality=88)

count = 0
for args in CARDS:
    draw_card(*args)
    count += 1

print(f"Generated {count} card images -> {OUT}/")
print(f"Files in public/cards: {len(os.listdir(OUT))}")
