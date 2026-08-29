import re
import sys

with open('src/App.tsx.clean', 'r', encoding='utf-8') as f:
    text = f.read()

lines = text.splitlines()
depth = 0
braces = 0
parens = 0

for i, line in enumerate(lines):
    for match in re.finditer(r'<(/?)([a-zA-Z][a-zA-Z0-9]*)', line):
        is_closing = match.group(1) == '/'
        tag_name = match.group(2)
        tag_end = line.find('>', match.start())
        if tag_end != -1 and line[tag_end-1] == '/':
            continue
        if is_closing:
            depth -= 1
        else:
            depth += 1
            
    for char in line:
        if char == '{': braces += 1
        elif char == '}': braces -= 1
        elif char == '(': parens += 1
        elif char == ')': parens -= 1
    
    # We want depth=3, braces=1, parens=1 (outside the App component's return but inside the component)
    # Wait, inside the return it's depth=3, braces=1, parens=1
    if depth == 3 and braces == 1 and parens == 1 and i > 3000:
        print(f"Line {i+1}: Depth {depth}, Braces {braces}, Parens {parens}")
