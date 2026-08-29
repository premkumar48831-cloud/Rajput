import re

with open('src/App.tsx.clean', 'r', encoding='utf-8') as f:
    lines = f.readlines()[:10850]
    content = "".join(lines)

# Remove self-closing div-like components if any
# (None here really, mostly just <div>)

div_stack = 0
for match in re.finditer(r'<(/?div)', content):
    if match.group(1) == 'div':
        div_stack += 1
    else:
        div_stack -= 1

print(f"Open divs: {div_stack}")

form_stack = 0
for match in re.finditer(r'<(/?form)', content):
    if match.group(1) == 'form':
        form_stack += 1
    else:
        form_stack -= 1

print(f"Open forms: {form_stack}")
