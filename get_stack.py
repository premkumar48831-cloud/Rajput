import re

with open('src/App.tsx.clean', 'r', encoding='utf-8') as f:
    text = f.read()

lines = text.splitlines()
content = '\n'.join(lines[:10861])

# This regex matches JSX tags and tries to ignore self-closing ones
tag_pattern = re.compile(r'<(/?)([a-zA-Z][a-zA-Z0-9]*)(\s[^>]*)?>', re.MULTILINE)

stack = []
for match in tag_pattern.finditer(content):
    is_closing = match.group(1) == '/'
    tag_name = match.group(2)
    full_tag = match.group(0)
    
    if tag_name in ['T', 'any', 'string', 'number', 'boolean', 'Record', 'NodeJS', 'img', 'input', 'br', 'hr', 'AlertCircle', 'Search', 'video', 'ArrowLeft', 'User', 'Sparkles', 'Send', 'Loader2', 'Award', 'Zap', 'ChevronUp', 'ChevronDown', 'FolderDown', 'QrCode', 'ShieldCheck', 'Globe', 'Headset', 'PlusCircle', 'Save', 'CheckCircle', 'Hourglass', 'X', 'AlertTriangle', 'Mail']:
        continue
        
    if full_tag.endswith('/>'):
        continue
        
    if is_closing:
        if stack and stack[-1] == tag_name:
            stack.pop()
    else:
        stack.append(tag_name)

print(stack)
