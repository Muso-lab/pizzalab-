import os
from PIL import Image, ImageDraw, ImageFont

os.makedirs('playstore_assets/screenshots', exist_ok=True)

width = 1080
height = 1920

slides = [
    {
        "filename": "screenshot_1_diretto.png",
        "tag": "MOTORE REOLOGICO SCIENTIFICO",
        "title": "Impasto Diretto al Grammo",
        "desc": "Idratazione, Farina W, Temperature e Lievito con pesi interi",
        "accent": "#e63946",
        "icon": "🍕",
        "cards": [
            ("DIMENSIONI DELL'IMPASTO", "6 Panetti da 260g (1560g Totali)"),
            ("IDRATAZIONE & FARINA", "Idratazione: 65% • Farina W 280 (Caputo Pizzeria)"),
            ("FERMENTAZIONE MISTA", "2h T.A. + 24h Frigo (4°C) + 6h Appretto"),
            ("PESI ESATTI (BILANCIA)", "Farina: 928g • Acqua: 603g • Sale: 26g • Lievito: 2g")
        ]
    },
    {
        "filename": "screenshot_2_reverse.png",
        "tag": "PIANIFICAZIONE ALL'INDIETRO",
        "title": "Modalità Reverse Wizard",
        "desc": "Imposta l'orario di cena: calcola tutte le fasi per il tuo forno",
        "accent": "#f4a261",
        "icon": "🧙",
        "cards": [
            ("ORARIO INFORNATA CENA", "Target: Sabato ore 20:30 (Tempo tot: 8 ore)"),
            ("ADATTAMENTO FORNO CASA 250°C", "+2.5% Olio EVO, +1% Malto per doratura perfetta"),
            ("STIMA PRUDENZIALE ATTIVA", "Margine -10% lievito per prevenire sovralievitazioni"),
            ("CRONOPROGRAMMA INTELLIGENTE", "12:30 Impasto • 14:30 Staglio • 20:30 Infornata")
        ]
    },
    {
        "filename": "screenshot_3_biga.png",
        "tag": "PREFERMENTI PROFESSIONALI",
        "title": "Biga Classica & Biga Fredda",
        "desc": "Biga al 100% da frigo (4°C) o T.A. (18°C) con rinfresco calcolato",
        "accent": "#2a9d8f",
        "icon": "🥖",
        "cards": [
            ("PREFERMENTO (BIGA 100%)", "Farina: 1000g (W320) • Acqua: 450g (45%) • LBF: 10g"),
            ("FERMENTAZIONE PREFERMENTO", "Biga Fredda: 24h a 4°C in Frigorifero"),
            ("FASE DI RINFRESCO", "Acqua residua: 350g (Idro tot 80%) • Sale: 25g • Olio: 25g"),
            ("ALVEOLATURA ESPLOSIVA", "Massima digeribilità, profumo acetico/lattico bilanciato")
        ]
    },
    {
        "filename": "screenshot_4_termodinamica.png",
        "tag": "TERMODINAMICA TFI & MACCHINE",
        "title": "Temperatura Acqua & Ghiaccio",
        "desc": "Attrito spirale, planetaria e a mano con formula entalpica",
        "accent": "#38bdf8",
        "icon": "🌡️",
        "cards": [
            ("ATTRITO MECCANICO", "Spirale 2ª velocità (attrito +12°C)"),
            ("TEMPERATURA TARGET CHIUSURA", "T_finale = 23°C (ideale per la maglia glutinica)"),
            ("TEMPERATURA ACQUA RICHIESTA", "T_acqua = 3°C (Acqua gelata indispensabile)"),
            ("FABBISOGNO GHIACCIO TRITATO", "In estate: sostituisci 64g di acqua con ghiaccio tritato")
        ]
    }
]

# Fonts setup
font_tag = None
font_title = None
font_desc = None
font_card_head = None
font_card_body = None

def get_font(size, bold=False):
    files = ["C:/Windows/Fonts/segoeuib.ttf", "C:/Windows/Fonts/arialbd.ttf"] if bold else ["C:/Windows/Fonts/segoeui.ttf", "C:/Windows/Fonts/arial.ttf"]
    for f in files:
        if os.path.exists(f):
            try:
                return ImageFont.truetype(f, size)
            except Exception:
                pass
    return ImageFont.load_default()

font_tag = get_font(26, bold=True)
font_title = get_font(52, bold=True)
font_desc = get_font(30, bold=False)
font_card_head = get_font(22, bold=True)
font_card_body = get_font(30, bold=True)
font_phone_title = get_font(28, bold=True)

logo_icon = None
if os.path.exists('icons/icon-192.png'):
    logo_icon = Image.open('icons/icon-192.png').convert('RGBA').resize((80, 80), Image.Resampling.LANCZOS)

for slide in slides:
    img = Image.new('RGB', (width, height), color='#0b0f17')
    draw = ImageDraw.Draw(img)

    # Ambient glow
    acc = slide["accent"]
    draw.ellipse([width // 2 - 400, 100, width // 2 + 400, 700], fill='#131d2e')

    # Top Tag
    tag_bbox = draw.textbbox((0, 0), slide["tag"], font=font_tag)
    tag_w = tag_bbox[2] - tag_bbox[0]
    tag_x = (width - tag_w) // 2
    draw.rounded_rectangle([tag_x - 20, 90, tag_x + tag_w + 20, 138], radius=24, fill='#1e293b', outline=acc, width=2)
    draw.text((tag_x, 99), slide["tag"], fill=acc, font=font_tag)

    # Title
    t_bbox = draw.textbbox((0, 0), slide["title"], font=font_title)
    t_x = (width - (t_bbox[2] - t_bbox[0])) // 2
    draw.text((t_x, 160), slide["title"], fill='#ffffff', font=font_title)

    # Subtitle
    d_bbox = draw.textbbox((0, 0), slide["desc"], font=font_desc)
    d_x = (width - (d_bbox[2] - d_bbox[0])) // 2
    draw.text((d_x, 235), slide["desc"], fill='#94a3b8', font=font_desc)

    # Smartphone Mockup Container
    phone_x = 90
    phone_y = 320
    phone_w = width - 180
    phone_h = height - phone_y - 80

    # Phone Outer Bezel
    draw.rounded_rectangle([phone_x, phone_y, phone_x + phone_w, phone_y + phone_h], radius=44, fill='#101726', outline='#334155', width=6)

    # Phone Speaker bar
    draw.rounded_rectangle([width // 2 - 60, phone_y + 16, width // 2 + 60, phone_y + 22], radius=3, fill='#334155')

    # App Header inside Phone
    app_h_y = phone_y + 44
    draw.rectangle([phone_x + 6, app_h_y, phone_x + phone_w - 6, app_h_y + 90], fill='#172133')
    draw.line([(phone_x + 6, app_h_y + 90), (phone_x + phone_w - 6, app_h_y + 90)], fill='#334155', width=1)

    if logo_icon:
        img.paste(logo_icon, (phone_x + 30, app_h_y + 5), logo_icon)

    draw.text((phone_x + 125, app_h_y + 18), "PizzaLab Scientifico", fill='#ffffff', font=font_phone_title)
    draw.text((phone_x + 125, app_h_y + 52), "Scientific Dough Engine Pro", fill='#38bdf8', font=get_font(20))

    # Mock Cards inside Smartphone
    card_y = app_h_y + 120
    card_w = phone_w - 60
    for head, body in slide["cards"]:
        cx = phone_x + 30
        draw.rounded_rectangle([cx, card_y, cx + card_w, card_y + 180], radius=18, fill='#172235', outline='#24334a', width=2)
        # Left Accent Stripe
        draw.rounded_rectangle([cx + 4, card_y + 8, cx + 12, card_y + 172], radius=4, fill=acc)
        # Header text
        draw.text((cx + 26, card_y + 20), head, fill=acc, font=font_card_head)
        # Body text
        draw.text((cx + 26, card_y + 60), body, fill='#f8fafc', font=font_card_body)
        card_y += 210

    # Bottom Phone Navigation Mockup
    bnav_y = phone_y + phone_h - 100
    draw.rectangle([phone_x + 6, bnav_y, phone_x + phone_w - 6, phone_y + phone_h - 6], fill='#121b2b')
    draw.line([(phone_x + 6, bnav_y), (phone_x + phone_w - 6, bnav_y)], fill='#334155', width=1)

    # Nav items
    navs = ["🍕 Diretto", "🧙 Reverse", "🥖 Biga", "📐 Teglia", "⏱️ Time"]
    nx = phone_x + 30
    step = card_w // len(navs)
    for n_item in navs:
        draw.text((nx + 15, bnav_y + 35), n_item, fill='#94a3b8', font=get_font(20, bold=True))
        nx += step

    out_file = os.path.join('playstore_assets/screenshots', slide["filename"])
    img.save(out_file, 'PNG')
    print(f"Screenshot generato: {out_file} (1080x1920)")
