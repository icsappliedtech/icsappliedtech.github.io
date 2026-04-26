# How to Run sync_data.py

A step-by-step guide for running the sync script after editing any JSON data file.

---

## What sync_data.py does

The sync script reads three JSON source files and generates a companion JavaScript file for each one. These `.js` files are what the browser actually loads when the site opens.

| JSON file (you edit this) | JS file (script generates this) | What it contains |
|---|---|---|
| `jargon-data.json` | `jargon-data.js` | All 983 jargon word entries |
| `framework-standards-data.json` | `framework-standards-data.js` | All 78 framework and standards entries |
| `content.json` | `content.js` | All editable site text and copy |

**Run this script any time you edit any of those three JSON files.** If you skip this step, your changes will not appear in the browser.

---

## When to run it

| You edited | Run the script? |
|---|---|
| `content.json` — site text | Yes |
| `jargon-data.json` — jargon word entries | Yes |
| `framework-standards-data.json` — framework entries | Yes |
| `assets/app.js` — tool logic | No — JS changes take effect immediately |
| `assets/style.css` — styles | No — CSS changes take effect immediately |
| `index.html` — page structure | No — HTML changes take effect immediately |

---

## Before you start

You need Python 3 installed on your computer. To check, open Terminal and run:

```bash
python3 --version
```

You should see something like `Python 3.11.0` or similar. If you see an error, download Python from python.org before continuing.

---

## Step-by-step instructions

### Step 1 — Open Terminal

**On Mac:** Press **Command + Space**, type `Terminal`, and press Enter.

**On Windows:** Press **Windows key**, type `cmd` or `PowerShell`, and press Enter.

---

### Step 2 — Navigate to the jargon-decoder folder

Type `cd` followed by a space, then the path to your `jargon-decoder` folder.

**Example on Mac:**
```bash
cd /Users/yourname/Documents/jargon-decoder
```

**Example on Windows:**
```
cd C:\Users\yourname\Documents\jargon-decoder
```

**Tip:** You can drag the `jargon-decoder` folder from Finder (Mac) or File Explorer (Windows) directly into the Terminal window after typing `cd ` — it will fill in the path automatically.

Press Enter.

---

### Step 3 — Run the script

```bash
python3 sync_data.py
```

On Windows you may need to use `python` instead of `python3`:
```
python sync_data.py
```

Press Enter.

---

### Step 4 — Read the output

If the script ran successfully you will see this:

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

Total jargon entries: 1061
Total data size: 1299 KB

Done. Open index.html in any browser.
```

The numbers may differ slightly depending on how many entries you have added.

---

### Step 5 — Test locally

Double-click `index.html` to open the site in your browser. Confirm your changes appear.

If the changes are not showing, do a hard refresh: **Command + Shift + R** (Mac) or **Ctrl + Shift + R** (Windows).

---

### Step 6 — Upload to your server

Upload the generated `.js` file that corresponds to whichever JSON file you edited.

| If you edited | Upload these files |
|---|---|
| `content.json` | `content.json` + `content.js` |
| `jargon-data.json` | `jargon-data.json` + `jargon-data.js` |
| `framework-standards-data.json` | `framework-standards-data.json` + `framework-standards-data.js` |

Always upload both the `.json` and its matching `.js` file together. If they are out of sync on the server, the browser will load different data than what your local copy shows.

---

## Troubleshooting

**Error: sync_data.py not found**
You are not in the right folder. Make sure you navigated to the `jargon-decoder` folder in Step 2. Run `ls` (Mac) or `dir` (Windows) to see what files are in the current folder. You should see `sync_data.py` in the list.

**Error: jargon-data.json not found**
Same problem — wrong folder. Navigate to the `jargon-decoder` folder and try again.

**Error: JSONDecodeError or similar**
One of your JSON files has a formatting error. The error message will tell you which file and which line number. Open that file in VS Code, find the line, and look for a missing comma, quotation mark, or bracket.

**The script ran but my changes are not showing in the browser**
Try a hard refresh: **Command + Shift + R** (Mac) or **Ctrl + Shift + R** (Windows). If still not showing, check that you saved the JSON file before running the script.

**Changes show locally but not on the live site**
You forgot to upload the files to your server, or only uploaded one of the two files. Upload both the `.json` and the `.js` file to Google Cloud Storage.

---

## Quick reference

```
1. Open Terminal
2. cd path/to/jargon-decoder
3. python3 sync_data.py
4. Open index.html to preview
5. Upload the edited .json + matching .js to server
```

---

## Files the script reads and writes

```
jargon-decoder/
├── content.json           ← you edit this
├── content.js             ← script writes this
├── jargon-data.json       ← you edit this
├── jargon-data.js         ← script writes this
├── framework-standards-data.json   ← you edit this
├── framework-standards-data.js     ← script writes this
└── sync_data.py           ← the script itself
```
