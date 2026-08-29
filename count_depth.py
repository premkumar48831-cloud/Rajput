import re
import sys

with open('src/App.tsx.clean', 'r', encoding='utf-8') as f:
    text = f.read()

# Start at 7954
lines = text.splitlines()
staff_content = '\n'.join(lines[7953:10850])

depth = 0
for match in re.finditer(r'<(/?)([a-zA-Z][a-zA-Z0-9]*)', staff_content):
    is_closing = match.group(1) == '/'
    tag_name = match.group(2)
    
    # Check self-closing
    tag_end = staff_content.find('>', match.start())
    if tag_end != -1 and staff_content[tag_end-1] == '/':
        continue
    
    # Skip non-JSX
    if tag_name in ['T', 'any', 'string', 'number', 'boolean']: continue
    
    if is_closing:
        depth -= 1
    else:
        depth += 1

# Also check for { and (
braces = 0
for char in staff_content:
    if char == '{': braces += 1
    elif char == '}': braces -= 1

print(f"Depth: {depth}, Braces: {braces}")
