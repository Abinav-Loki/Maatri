import re

f = r'c:\Users\abina\Desktop\maatrishield\src\pages\Dashboard.jsx'

with open(f, 'r', encoding='utf-8', errors='replace') as fp:
    content = fp.read()

original = content

# --- 1. Replace sidebar LayoutDashboard icon with Maatri Shield logo ---
# Find the sidebar header block and replace the generic icon with the logo
old_sidebar_logo = '''<div className="bg-brand-600 p-2 rounded-xl text-white shadow-lg shadow-brand-500/20">
                        <LayoutDashboard size={24} />
                    </div>
                    <span className="hidden md:block font-extrabold text-xl tracking-tight text-white">Maatri Shield</span>'''

new_sidebar_logo = '''<img src="/maatri_shield_logo.png" alt="Maatri Shield" className="w-10 h-10 object-contain mix-blend-screen shrink-0" />
                    <span className="hidden md:block font-black text-sm uppercase tracking-[0.3em] text-white/90">Maatri Shield</span>'''

if old_sidebar_logo in content:
    content = content.replace(old_sidebar_logo, new_sidebar_logo)
    print("Sidebar logo replaced (exact match)")
else:
    # Try a looser regex approach
    pattern = r'(<div className="bg-brand-600 p-2 rounded-xl text-white[^"]*">\s*<LayoutDashboard size=\{24\} />\s*</div>\s*<span className="hidden md:block font-extrabold text-xl tracking-tight text-white">Maatri Shield</span>)'
    match = re.search(pattern, content, re.DOTALL)
    if match:
        content = content[:match.start()] + new_sidebar_logo + content[match.end():]
        print("Sidebar logo replaced (regex match)")
    else:
        print("WARNING: Sidebar logo pattern not found. Trying simpler approach...")
        # Just replace the icon div alone
        content = content.replace(
            '<div className="bg-brand-600 p-2 rounded-xl text-white shadow-lg shadow-brand-500/20">\n                        <LayoutDashboard size={24} />\n                    </div>',
            '<img src="/maatri_shield_logo.png" alt="" className="w-10 h-10 object-contain mix-blend-screen shrink-0" />'
        )
        content = content.replace(
            'className="hidden md:block font-extrabold text-xl tracking-tight text-white">Maatri Shield</span>',
            'className="hidden md:block font-black text-sm uppercase tracking-[0.3em] text-white/90">Maatri Shield</span>'
        )
        print("Sidebar logo replaced (simple approach)")

# --- 2. Fix sidebar footer system box to use white/transparent styling ---
content = content.replace(
    'bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50',
    'bg-white/10 p-4 rounded-2xl border border-white/20'
)
content = content.replace(
    'text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-3',
    'text-[10px] text-white/50 font-bold uppercase tracking-widest mb-3'
)
content = content.replace(
    'text-xs font-bold text-slate-300',
    'text-xs font-bold text-white/80'
)

# --- 3. Report cards: add glass class, remove plain white ---
content = content.replace(
    '"bg-white p-4 rounded-2xl border-2 border-slate-50 hover:border-brand',
    '"glass p-4 rounded-2xl border-2 border-white/60 hover:border-brand'
)

# --- 4. Remove remaining teal classes in report icon areas ---
content = content.replace('bg-teal-50 rounded-xl text-teal-600', 'bg-[#F8F7FF] rounded-xl text-brand-600')
content = content.replace('group-hover:bg-teal-500 group-hover:text-white', 'group-hover:bg-brand-600 group-hover:text-white')
content = content.replace('text-teal-600\n', 'text-brand-600\n')
content = content.replace('border-teal-100 group-hover:text-teal-500', 'border-brand-100 group-hover:text-brand-600')

# --- 5. Report generate area: teal => brand ---
content = content.replace(
    'group-hover:border-teal-200',
    'group-hover:border-brand-200'
)
content = content.replace(
    'w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600',
    'w-12 h-12 bg-[#F8F7FF] rounded-2xl flex items-center justify-center text-brand-600'
)

print(f"\nContent changed: {original != content}")
print(f"Remaining 'teal' occurrences: {content.count('teal')}")
print(f"Remaining '0F172A' occurrences: {content.count('0F172A')}")
print(f"'6A4C93' occurrences: {content.count('6A4C93')}")

with open(f, 'w', encoding='utf-8') as fp:
    fp.write(content)

print("Done!")
