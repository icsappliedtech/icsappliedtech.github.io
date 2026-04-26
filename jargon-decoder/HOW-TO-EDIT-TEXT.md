# How to Edit Text on the Jargon Decoder Site

A step-by-step guide for updating any text on the website without touching the HTML or JavaScript files.

---

## How it works

All editable text lives in one file: `content.json`. When you want to change any text on the site — a heading, a subtitle, a description, a button label — you change it in `content.json`, run one command, and upload two files. That is the entire process.

You never need to open `index.html` or `assets/app.js` for a text change.

---

## The workflow

### Step 1 — Open content.json in VS Code

Open the `jargon-decoder` folder in VS Code. Find `content.json` in the file list and open it.

The file looks like this:

```json
{
  "_instructions": "Edit the text values below...",

  "hero_title": "Every word has a formula.",
  "hero_subtitle": "Hundreds of organizational words decoded...",

  "decode_title": "Decode a jargon word",
  "decode_subtitle": "Type a word or pick one to see its formula...",

  ...
}
```

Each line has two parts separated by a colon:
- **Left side** — the key name. Do not change this. It tells the site where to put the text.
- **Right side** — the text value. This is what you change.

---

### Step 2 — Find the text you want to change

Use the key names as your guide. They are written in plain English and named after the tab or section they belong to. Here is the full reference:

| Key | Where it appears |
|---|---|
| `hero_title` | Decode tab — large headline "Every word has a formula." |
| `hero_subtitle` | Decode tab — description below the headline |
| `decode_title` | Decode tab — panel heading |
| `decode_subtitle` | Decode tab — panel description |
| `browse_title` | Browse tab — panel heading |
| `browse_subtitle` | Browse tab — panel description |
| `encode_title` | Encode tab — panel heading |
| `encode_subtitle` | Encode tab — panel description |
| `encode_scenarios_label` | Encode tab — "Start with a scenario" label |
| `encode_wordbank_title` | Encode tab — "Component word bank" heading |
| `encode_wordbank_instruction` | Encode tab — instruction line above the word bank |
| `health_title` | Health Check tab — panel heading |
| `health_subtitle` | Health Check tab — panel description |
| `frameworks_title` | Frameworks tab — panel heading |
| `frameworks_subtitle` | Frameworks tab — panel description |
| `book_label` | Book tab — eyebrow label "The Book" |
| `book_title` | Book tab — "The Words We Use" |
| `book_subtitle` | Book tab — "The Hidden Formulas Behind Organizational Jargon" |
| `book_byline` | Book tab — "By Jason Weimer" |
| `book_pitch` | Book tab — opening paragraph describing the book |
| `book_stories_header` | Book tab — personal stories section heading |
| `book_whats_inside_title` | Book tab — "A formula for every word..." heading |
| `book_author_bio_1` | Book tab — first author bio paragraph |
| `book_author_bio_2` | Book tab — second author bio paragraph |
| `book_pull_quote` | Book tab — pull quote text |
| `book_pull_quote_attr` | Book tab — pull quote attribution "— From the introduction" |
| `about_title` | About tab — panel heading |
| `about_intro_1` | About tab — first intro paragraph |
| `about_intro_2` | About tab — second intro paragraph |
| `about_clusters_heading` | About tab — "Where the five clusters come from" heading |
| `about_clusters_desc` | About tab — description below the clusters heading |
| `about_frameworks_heading` | About tab — "Frameworks & Standards categories" heading |
| `about_frameworks_desc` | About tab — description below the frameworks heading |
| `share_label` | Bottom of every tab — share eyebrow label |
| `share_title` | Bottom of every tab — share heading |
| `waitlist_eyebrow` | Bottom of every tab — "The book is coming." |
| `waitlist_title` | Bottom of every tab — waitlist heading |
| `waitlist_desc` | Bottom of every tab — waitlist description paragraph |
| `email_label` | Email form — "Stay in the loop" label (currently inactive) |
| `email_subtitle` | Email form — subtitle text (currently inactive) |

---

### Step 3 — Make your change

Change only the text inside the quotation marks on the right side of the colon. Leave everything else exactly as it is.

**Example — changing the hero title:**

Before:
```json
"hero_title": "Every word has a formula.",
```

After:
```json
"hero_title": "Every jargon word has a formula.",
```

**Rules to follow:**
- Keep the quotation marks at the start and end of the text
- Keep the comma at the end of each line
- Do not change the key name on the left
- Do not delete any lines
- If your text contains a quotation mark, write it as `\"` instead of `"`

**Example of a quotation mark inside text:**
```json
"book_pull_quote": "Once you have the formula, the word is no longer \"vague\".",
```

---

### Step 4 — Save content.json

Press **Command + S** (Mac) or **Ctrl + S** (Windows) to save the file.

VS Code will highlight any JSON errors in red at the bottom of the window. If you see a red dot or error message, check for a missing comma, quotation mark, or bracket before continuing.

---

### Step 5 — Run sync_data.py

Open Terminal. Navigate to your `jargon-decoder` folder:

```bash
cd path/to/jargon-decoder
```

Run the sync script:

```bash
python3 sync_data.py
```

You should see output like this:

```
Generating data files...

  jargon-data.js
    Entries: 983
    Size: 1,250,475 bytes (1221 KB)

  framework-standards-data.js
    Entries: 78
    Size: 73,838 bytes (72 KB)

  content.js
    Text blocks: 40
    Size: 5,413 bytes (5 KB)

Done. Open index.html in any browser.
```

If you see an error instead, the most common cause is a JSON formatting problem in `content.json`. Go back to Step 3 and check for missing commas or quotation marks.

---

### Step 6 — Test locally

Double-click `index.html` to open the site in your browser. Your text changes should appear immediately.

If the text has not changed, try a hard refresh: **Command + Shift + R** (Mac) or **Ctrl + Shift + R** (Windows).

---

### Step 7 — Upload to your server

Upload these two files to your Google Cloud Storage bucket in the `jargon-decoder/` folder:

| File | Notes |
|---|---|
| `content.json` | The source file you edited |
| `content.js` | Generated by sync_data.py — this is what the browser actually loads |

Both files must be uploaded together. The browser reads `content.js`, not `content.json` directly. If you upload only one and not the other they will be out of sync.

After uploading, reload the live site to confirm the changes appear.

---

## Common mistakes

**I changed the text but nothing updated.**
You probably forgot to run `sync_data.py`. The browser reads `content.js`, not `content.json` directly. The sync script generates `content.js` from your edited `content.json`.

**I see a JSON error in VS Code.**
Check the line you edited for a missing comma, a missing quotation mark, or an extra character. Every line except the last one in the file must end with a comma.

**My change appears locally but not on the live site.**
You uploaded `content.json` but forgot `content.js`, or vice versa. Upload both files.

**I accidentally changed a key name.**
Revert the key name to exactly what it was. If you are not sure what it should be, refer to the reference table above or download a fresh copy of `content.json` from this session.

**The text I want to edit is not in content.json.**
Some text — such as the word bank words, the starter scenarios in Encode, and the health check questions — lives in `assets/app.js` because it is part of the tool logic rather than the site copy. Changes to those require editing the JS file directly and are less frequent.

---

## Quick reference

```
1. Edit content.json in VS Code
2. Save the file
3. Run: python3 sync_data.py
4. Open index.html to preview
5. Upload: content.json + content.js to server
```
