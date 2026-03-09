f = r'c:\Users\abina\Desktop\maatrishield\src\pages\Dashboard.jsx'

with open(f, encoding='utf-8', errors='replace') as fp:
    content = fp.read()

original = content

# Replace UI/brand teal classes with brand purple equivalents
# These are UI elements - navigation, sidebar, cards, borders, icons

# Report card hover borders
content = content.replace('hover:border-teal-500', 'hover:border-brand-500')
content = content.replace('hover:border-teal-200', 'hover:border-brand-200')
content = content.replace('hover:border-teal-100', 'hover:border-brand-100')

# Report card icon colors
content = content.replace('bg-teal-50', 'bg-[#F8F7FF]')
content = content.replace('text-teal-600', 'text-brand-600')
content = content.replace('group-hover:bg-teal-500', 'group-hover:bg-brand-600')

# Report history time stamp
content = content.replace('text-teal-500\n', 'text-brand-600\n')
content = content.replace('text-teal-500"', 'text-brand-600"')
content = content.replace("text-teal-500'", "text-brand-600'")

# Pulse indicator (the Live pulse dot in the monitoring banner)
# Only the nav/UI ones - keep the clinical 'animate-pulse' that's on bg-teal-500 (this is a status indicator)
# But the sidebar nav: bg-teal-500/20 text-teal-400 border-teal-400 already handled
content = content.replace('border-teal-400', 'border-brand-400')
content = content.replace('text-teal-400', 'text-brand-300')
content = content.replace('bg-teal-500/20', 'bg-brand-500/20')
content = content.replace('bg-teal-500/10', 'bg-brand-500/10')
content = content.replace('shadow-teal', 'shadow-brand')
content = content.replace('ring-teal', 'ring-brand')
content = content.replace('divide-teal', 'divide-brand')

# The system footer pill in sidebar
content = content.replace('text-teal-500\n', 'text-brand-300\n')

# Monitoring active banner
content = content.replace('from-teal-50 to-emerald-50 border-teal-200', 'from-[#F8F7FF] to-purple-50 border-brand-100')
content = content.replace("'bg-teal-200/50 text-teal-600'", "'bg-brand-200/50 text-brand-600'")
content = content.replace('"bg-teal-900"', '"text-brand-900"')
content = content.replace('font-black text-teal-900', 'font-black text-brand-900')
content = content.replace('bg-teal-500 animate-ping', 'bg-brand-500 animate-ping')

# Keep the calendar indicator 'color: isToday ? "teal"' as it's a functional color string
# Keep 'border-teal-500 shadow-xl shadow-teal-100' on the "Stable" stats card - this is intentional status color

print(f"Content changed: {original != content}")
print(f"Remaining teal: {content.count('teal')}")

with open(f, 'w', encoding='utf-8') as fp:
    fp.write(content)
print("Done!")
