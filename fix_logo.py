f = r'c:\Users\abina\Desktop\maatrishield\src\pages\Dashboard.jsx'

with open(f, 'r', encoding='utf-8', errors='replace') as fp:
    content = fp.read()

# Add logo import after first line
logo_import = "import logo from '../assets/maatri_shield_logo.png';\n"
if logo_import.strip() not in content:
    # Find first import line end
    idx = content.find('\n', content.find('import '))
    content = content[:idx+1] + logo_import + content[idx+1:]
    print('Logo import added')
else:
    print('Logo import already exists')

# Fix the logo src attribute (change /maatri_shield_logo.png => {logo})
content = content.replace('src="/maatri_shield_logo.png"', 'src={logo}')
print('Logo src fixed: {logo}')

with open(f, 'w', encoding='utf-8') as fp:
    fp.write(content)
print('Done!')
