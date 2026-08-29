import re

with open('src/App.tsx.clean', 'r', encoding='utf-8') as f:
    lines = f.readlines()

depth = 0
for i in range(7953):
    line = lines[i]
    depth += line.count('<div') + line.count('<main') + line.count('<form')
    depth -= line.count('</div') + line.count('</main') + line.count('</form')

print(f"Depth at 7953: {depth}")
