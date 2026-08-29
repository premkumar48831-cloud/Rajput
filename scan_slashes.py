import re

with open('src/App.tsx.clean', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Pattern for single slash that might be start of regex
# It's hard to be perfect, but let's look for / that are not part of tags or comments
for i, line in enumerate(lines):
    # Skip comments
    if '//' in line or '/*' in line:
        continue
    # Look for / that is not </ and not /> and not in a common URL pattern
    # And specifically look for it in JSX blocks (after { but before })
    if '/' in line and '</' not in line and '/>' not in line and 'http' not in line:
        print(f"Line {i+1}: {line.strip()}")
