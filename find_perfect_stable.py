import re

with open('src/App.tsx.clean', 'r', encoding='utf-8') as f:
    text = f.read()

lines = text.splitlines()
depth = 0
braces = 0
parens = 0

for i, line in enumerate(lines):
    # Very simple tag count
    depth += line.count('<div') + line.count('<main') + line.count('<form') + line.count('<ul') + line.count('<li')
    depth -= line.count('</div') + line.count('</main') + line.count('</form') + line.count('</ul') + line.count('</li')
    
    braces += line.count('{')
    braces -= line.count('}')
    
    parens += line.count('(')
    parens -= line.count(')')
    
    if depth == 2 and braces == 1 and parens == 1 and i > 5000:
        print(f"Line {i+1}: D{depth} B{braces} P{parens}")
