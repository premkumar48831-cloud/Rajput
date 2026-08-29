import re

with open('src/App.tsx.clean', 'r', encoding='utf-8') as f:
    lines = f.readlines()[:10850]
    content = "".join(lines)

# Remove comments and strings to avoid false positives
content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
content = re.sub(r'//.*', '', content)

tag_pattern = re.compile(r'<(/?)([a-zA-Z][a-zA-Z0-9]*)')
void_elements = {'img', 'input', 'br', 'hr', 'link', 'meta'}

stack = []
for match in tag_pattern.finditer(content):
    is_closing = match.group(1) == '/'
    tag_name = match.group(2)
    
    # Check for self-closing <Tag />
    # We look for the next '>' and see if there is a '/' before it
    end_tag = content.find('>', match.end())
    if end_tag != -1 and content[end_tag-1] == '/':
        continue
    
    if tag_name in void_elements:
        continue
        
    if is_closing:
        if stack and stack[-1] == tag_name:
            stack.pop()
    else:
        stack.append(tag_name)

print(f"Tags to close: {stack}")
