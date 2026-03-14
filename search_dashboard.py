import sys
import re

def search():
    with open('src/pages/Dashboard.jsx', 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    keywords = [r'(?i)water', r'(?i)select patient', r'(?i)message', r'(?i)notification']
    
    with open('search_out2.txt', 'w', encoding='utf-8') as out:
        for i, line in enumerate(lines):
            line = line.strip()
            for kw in keywords:
                if re.search(kw, line) and len(line) < 200:
                    out.write(f"{i+1}: {line}\n")
                    break

if __name__ == '__main__':
    search()
