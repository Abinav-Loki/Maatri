f = r'c:\Users\abina\Desktop\maatrishield\src\pages\Dashboard.jsx'

with open(f, encoding='utf-8', errors='replace') as fp:
    lines = fp.readlines()

for i, line in enumerate(lines):
    if 'teal' in line:
        print(f'{i+1}: {line.strip()[:120]}')
