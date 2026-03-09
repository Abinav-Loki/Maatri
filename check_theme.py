f = r'c:\Users\abina\Desktop\maatrishield\src\pages\Dashboard.jsx'

with open(f, 'r', encoding='utf-8', errors='replace') as fp:
    content = fp.read()

checks = {
    'Lavender gradient (6A4C93)': content.count('6A4C93'),
    'Old dark navy (0F172A)': content.count('0F172A'),
    'bg-white occurrences': content.count('bg-white'),
    'Logo import': int("import logo from '../assets/maatri_shield_logo.png'" in content),
    'Logo in sidebar src={logo}': content.count('src={logo}'),
    'brand-300 nav highlight': content.count('brand-300'),
    'Remaining teal classes': content.count('teal'),
}
for k, v in checks.items():
    print(f'{k}: {v}')
