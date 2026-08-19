# LEVEL 18 — Savelii

Kurze, filmische Geburtstagsanimation (~30 Sek.) für iPhone per QR-Code.

**Live (nach GitHub Pages):** `https://mad-desigen.github.io/B-Day-App/`

---

## Ablauf für Savelii

1. QR-Code scannen → App öffnet im Browser  
2. **„FILM STARTEN“** tippen (startet den Ton)  
3. Die filmische Foto- und Videomontage läuft automatisch durch  
4. **18-Drop** + kurze persönliche Botschaft  

---

## Medien einbauen (zu Hause)

### 1. Fotos

Ersetze die Platzhalter in `assets/images/`:

| Datei | Inhalt |
|-------|--------|
| `origin/origin-01…04` | Kindheit / früher (4 Stück) |
| `present/present-01…04` | Heute / aktuell (4 Stück) |

Format: **JPG** oder **PNG**, Hochformat ideal, max. ~500 KB pro Bild.

Pfade in `data/story.json` anpassen (`.svg` → `.jpg`).

### 2. Videos (optional)

| Datei | Inhalt |
|-------|--------|
| `videos/clip-01.mp4` | Kurzclip 5–15 s |
| `videos/clip-02.mp4` | … |
| `videos/clip-03.mp4` | … |

Format: **MP4 (H.264)**, max. ~15 MB pro Clip.

### 3. Deep-Rap-Beat

Datei ablegen:

```
assets/audio/beat.mp3
```

Royalty-free Quellen: [Pixabay Music](https://pixabay.com/music/), [Uppbeat](https://uppbeat.io/), YouTube Audio Library.

> Ohne `beat.mp3` spielt die App einen generierten Fallback-Beat.

### 4. Texte anpassen

Alles in **`data/story.json`**:

- `meta.name` — Name  
- `meta.signature` — optional, z. B. `"Patrick"`  
- `scenes` → `letter` → `lines` — Finale-Brief  

Kein Code nötig — nur JSON bearbeiten.

---

## Lokal testen

```bash
cd B-Day-App
python3 -m http.server 8080
```

Dann: http://127.0.0.1:8080/  
(Nicht als `file://` öffnen — JSON/Fetch braucht Server.)

---

## GitHub Pages veröffentlichen

1. Repo: https://github.com/mad-desigen/B-Day-App  
2. Code pushen (`main`)  
3. **Settings → Pages → Source: GitHub Actions**  
4. Nach dem Workflow: URL ist live  
5. QR-Code auf `https://mad-desigen.github.io/B-Day-App/`  

---

## Projektstruktur

```
B-Day-App/
├── index.html
├── css/app.css
├── js/
│   ├── app.js       ← Szenen-Engine
│   └── audio.js     ← Beat + Fallback
├── data/story.json  ← Texte & Reihenfolge
└── assets/
    ├── audio/
    ├── images/
    └── videos/
```

---

## Interaktionen

Nur der Start braucht einen Tap, weil iPhones Ton erst nach einer bewussten
Berührung abspielen dürfen. Danach läuft die Animation ohne weitere Eingabe.

---

## QR-Karte (Druck)

Textvorschlag:

```
LEVEL 18 · Savelii
Scan · Sound an · Los
```

URL: GitHub-Pages-Link von oben.
