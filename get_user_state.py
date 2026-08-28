import re

with open("src/App.tsx", "r", encoding="utf-8") as f:
    text = f.read()

# Just check what imports we have for icons.
icons = re.findall(r'import {([^}]+)} from ["\']lucide-react["\']', text)
if icons:
    print(icons[0].strip())

