import sys

f = r'c:\Users\abina\Desktop\maatrishield\src\pages\Dashboard.jsx'

with open(f, 'r', encoding='utf-8', errors='replace') as fp:
    content = fp.read()

original = content

# 1. Sidebar: dark navy => lavender gradient
content = content.replace(
    'bg-[#0F172A]',
    'bg-[linear-gradient(to_bottom,#6A4C93,#7C5BB3,#8E6BBF)]'
)

# 2. Main background: slate gradient => white
content = content.replace(
    'bg-gradient-to-br from-slate-100 via-indigo-50 to-slate-200',
    'bg-white'
)

# 3. Nav active state: teal => brand purple (lavender)
content = content.replace(
    "bg-teal-500/20 text-teal-400 border-l-4 border-teal-400",
    "bg-brand-500/20 text-brand-300 border-l-4 border-brand-400"
)
# Also fix hover state that might reference teal
content = content.replace(
    'hover:bg-slate-800 border-l-4 border-transparent',
    'hover:bg-white/10 hover:text-white border-l-4 border-transparent'
)

# 4. Sidebar logo icon background: teal => brand
content = content.replace(
    'bg-teal-500 p-2 rounded-xl text-white shadow-lg shadow-teal-500/20',
    'bg-brand-600 p-2 rounded-xl text-white shadow-lg shadow-brand-500/20'
)

# 5. Footer system pill: teal => brand
content = content.replace(
    'bg-teal-500/20 flex items-center justify-center text-teal-500',
    'bg-brand-500/20 flex items-center justify-center text-brand-300'
)
content = content.replace(
    'bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50',
    'bg-white/10 p-4 rounded-2xl border border-white/20'
)

# 6. Make sure main content area doesn't get forced slate bg on analytics tab
content = content.replace(
    "activeTab === 'analytics' ? 'bg-slate-50' : ''",
    "activeTab === 'analytics' ? 'bg-white' : ''"
)

changes = sum(1 for a, b in zip(original, content) if a != b)
print(f"Changes made: {len(original) - len(content)} length diff, content changed: {original != content}")

with open(f, 'w', encoding='utf-8') as fp:
    fp.write(content)

print("Done! Lavender theme applied.")
