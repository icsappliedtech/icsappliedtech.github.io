#!/usr/bin/env python3
"""
sync_data.py

Syncs jargon_data.json into the EMBEDDED_DATA constant inside assets/app.js.

Use this after editing jargon_data.json to update the embedded copy that
lets the tool work from file:// URLs without needing a server.

Usage:
    python3 sync_data.py

Run from the jargon_tool folder.
"""

import json
import re
import os
import sys


def main():
    # Check files exist
    if not os.path.exists('jargon_data.json'):
        print("ERROR: jargon_data.json not found. Run this from the jargon_tool folder.")
        sys.exit(1)
    if not os.path.exists('assets/app.js'):
        print("ERROR: assets/app.js not found. Run this from the jargon_tool folder.")
        sys.exit(1)

    # Load JSON
    with open('jargon_data.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Load JS
    with open('assets/app.js', 'r', encoding='utf-8') as f:
        js = f.read()

    # Serialize new data block
    new_data_str = json.dumps(data, indent=2, ensure_ascii=False)
    # Indent by 2 spaces to match surrounding style
    new_data_str = '\n'.join('  ' + line if line else line for line in new_data_str.split('\n'))
    new_block = f'  // Embedded data (for file:// URL compatibility)\n  const EMBEDDED_DATA = {new_data_str.strip()};\n'

    # Find existing EMBEDDED_DATA block using regex
    pattern = re.compile(
        r'  // Embedded data \(for file:// URL compatibility\)\n'
        r'  const EMBEDDED_DATA = \{[\s\S]*?\n  \};\n',
        re.MULTILINE
    )

    if pattern.search(js):
        new_js = pattern.sub(new_block, js, count=1)
        action = "Updated"
    else:
        # Insert after 'use strict';
        marker = "'use strict';\n"
        idx = js.find(marker)
        if idx == -1:
            print("ERROR: Could not find 'use strict' in app.js to inject embedded data.")
            sys.exit(1)
        insert_at = idx + len(marker) + 1
        new_js = js[:insert_at] + '\n' + new_block + '\n' + js[insert_at:]
        action = "Inserted"

    # Write back
    with open('assets/app.js', 'w', encoding='utf-8') as f:
        f.write(new_js)

    entry_count = len(data['entries'])
    print(f"{action} embedded data in assets/app.js")
    print(f"  Entries embedded: {entry_count}")
    print(f"  File size now: {len(new_js):,} bytes")
    print()
    print("The tool is now ready to use. Open index.html in any browser.")


if __name__ == '__main__':
    main()
