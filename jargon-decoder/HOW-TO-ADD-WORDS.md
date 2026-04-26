# How to Add New Jargon Words

A step-by-step guide for adding new words to the Jargon Decoder using the admin page and `sync_data.py`.

---

## Overview

Adding a new word is a three-step process:

1. Use the admin page to generate a correctly formatted JSON entry
2. Paste it into `jargon-data.json`
3. Run `sync_data.py` to rebuild the data files, then re-upload

---

## Step 1 — Open the admin page

Open `admin/index.html` in your browser by double-clicking it from your `jargon-decoder` folder. You do not need a server running. It opens directly.

---

## Step 2 — Fill in the form

### Word
The exact word or phrase as it will appear in the decoder. Capitalise it the way you want it displayed. Example: `Psychological Safety`

### Status
Choose one of three options:

- **Core** — A primary entry with a full formula, components, and all fields. Use this for the main words in the book.
- **Extended** — Same structure as Core, but for words that sit outside the primary 60.
- **Alternative** — A word that redirects to a primary entry. When you select this, a **Primary Word** field appears. Type the exact name of the primary entry this word should point to.

### Cluster
The cluster this word belongs to:
- Direction — Where are you going?
- People — Who is going with you?
- Resources — What do you have to work with?
- Process — How will you get there?
- Results — How will you know?

### Formula type
The formula structure. Leave blank for redirect alternative entries.

| Type | Structure |
|---|---|
| Additive | x + y + z |
| Combination | x + y + (a + b) |
| Exponential | x + y² |
| Multiplied | (x + y) × z |
| Refinement | (x − y) + z |
| Ratio | x ÷ y |

### Formula expression
Write the formula with the word name on the left side. Example:

```
Psychological Safety = trust + (permission to fail + freedom to speak)
```

For redirect alternative entries, the form will auto-fill `See: Primary Word` if you leave this blank.

### Components
The individual parts the formula is built from. Add one per field. Click **+ Add component** to add more. These appear as the chips below the formula in the decoder.

### Official definition
The dictionary-style definition. What the word officially means. Keep it factual and concise.

### What it really means
The honest version. How the word is actually used in practice, what it signals, and what it costs when it is used without the components behind it. This is the voice of the book — direct, specific, no hedging.

### Why the formula is shaped this way
Explain the formula type choice and how the components relate to each other. Why is one component multiplied rather than added? Why does removing something produce the right result? This field does the analytical work.

### Plain-language alternatives
What you would say instead of the jargon word. These are the alternatives shown at the bottom of each entry. Add two to four. Wrap them in quotes mentally — they should read as things a person would actually say.

### Is this word a metaphor?
Check this box if the word borrows its meaning from another domain — sports, nature, military, medicine, navigation, biology, etc.

Examples of metaphors: `Bottleneck` (physical bottle neck), `Runway` (aircraft runway), `Sprint` (athletic sprint), `Viral Growth` (biological virus spread).

---

## Step 3 — Generate the JSON

Click **Generate JSON**. A formatted JSON entry appears at the bottom of the page.

Review it. If anything looks wrong, scroll back up, fix the field, and click Generate JSON again.

---

## Step 4 — Copy the JSON

Click **Copy to clipboard**.

---

## Step 5 — Paste into jargon-data.json

Open `jargon-data.json` in a text editor. A code editor like VS Code works best — it will highlight JSON errors immediately if something goes wrong.

Find the `"entries"` array. It starts like this:

```json
{
  "metadata": { ... },
  "entries": [
    { ... first entry ... },
    { ... second entry ... },
```

Scroll to the **very end** of the entries array, just before the closing `]`. You will see the last entry ending with `}`. Add a comma after that closing brace, then paste your new entry on the next line:

```json
    { ... last existing entry ... },
    {
      "word": "Your New Word",
      ...
    }
  ]
}
```

Save the file.

### Check your JSON is valid

If you are using VS Code, it will show a red underline on any JSON error. Fix any errors before continuing.

You can also paste the entire file contents into [jsonlint.com](https://jsonlint.com) to validate it.

---

## Step 6 — Run sync_data.py

Open Terminal (Mac) or Command Prompt (Windows). Navigate to your `jargon-decoder` folder.

**Mac / Linux:**
```bash
cd path/to/jargon-decoder
python3 sync_data.py
```

**Windows:**
```
cd path\to\jargon-decoder
python sync_data.py
```

You should see output like this:

```
Generating data files...

  jargon-data.js
    Entries: 984
    Size: 1,251,200 bytes (1222 KB)

  framework-standards-data.js
    Entries: 78
    Size: 73,838 bytes (72 KB)

Total entries: 1062
Total data size: 1295 KB

Done. Open index.html in any browser.
```

If you see an error instead, the most common cause is that `jargon-data.json` has a JSON formatting problem. Go back to Step 5 and check the file.

---

## Step 7 — Test locally

Double-click `index.html` to open the tool in your browser. Search for the new word in the Decode tab. Confirm it appears correctly — formula, components, definition, all fields.

---

## Step 8 — Upload to your site

Upload the following files to your server:

| File | What changed |
|---|---|
| `jargon-data.json` | The new entry was added |
| `jargon-data.js` | Regenerated by sync_data.py |

You do not need to re-upload any other files unless you also edited them.

---

## Entry types at a glance

### Core or Extended entry
All fields required. Has a full formula.

```json
{
  "word": "Psychological Safety",
  "cluster": "People",
  "status": "core",
  "formula_type": "Combination",
  "formula": "Psychological Safety = trust + (permission to fail + freedom to speak)",
  "components": ["trust", "permission to fail", "freedom to speak"],
  "definition": "The shared belief that a team is safe for interpersonal risk-taking.",
  "what_it_really_means": "The condition that allows people to say what they actually think without calculating the personal cost first.",
  "why": "Trust is the foundation. Without it, no one takes the risk. Permission to fail and freedom to speak are grouped as a combination because both must be present — you can have one without the other and still have a team that stays quiet.",
  "alternatives": ["Safe to speak up", "No penalty for honesty", "Disagreement is allowed here"],
  "is_metaphor": false
}
```

### Redirect alternative entry
Points to a primary word. Lighter structure.

```json
{
  "word": "Safe Space",
  "cluster": "People",
  "status": "alternative",
  "primary": "Psychological Safety",
  "formula_type": null,
  "formula": "See: Psychological Safety",
  "components": [],
  "definition": "An environment where individuals feel protected from judgment, criticism, or harm.",
  "what_it_really_means": "Often used interchangeably with psychological safety, though safe space tends to emphasise emotional protection while psychological safety emphasises the freedom to contribute ideas and take risks.",
  "why": "Points to Psychological Safety. Both describe conditions of interpersonal protection, but psychological safety is the organisational research concept with the formula behind it.",
  "alternatives": [],
  "is_metaphor": false
}
```

---

## Quick reference — field rules

| Field | Core | Extended | Redirect Alternative |
|---|---|---|---|
| word | Required | Required | Required |
| cluster | Required | Required | Required |
| status | `core` | `extended` | `alternative` |
| primary | — | — | Required |
| formula_type | Required | Required | `null` |
| formula | Required | Required | `See: Primary Word` |
| components | Required | Required | `[]` |
| definition | Required | Required | Required |
| what_it_really_means | Required | Required | Required |
| why | Required | Required | Required |
| alternatives | Required | Required | `[]` |
| is_metaphor | `true` or `false` | `true` or `false` | `true` or `false` |
