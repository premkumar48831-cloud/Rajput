import re

with open('src/App.tsx.clean', 'r', encoding='utf-8') as f:
    lines = f.readlines()[:10850]
    content = "".join(lines)

# Find all open tags that need closing
tag_pattern = re.compile(r'<(/?)([a-zA-Z][a-zA-Z0-9]*)')
void_elements = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr', 'circle', 'path', 'svg', 'rect', 'line', 'polyline', 'polygon', 'defs', 'radialGradient', 'stop', 'g', 'X', 'AlertCircle', 'AlertTriangle', 'Sparkles', 'Send', 'Loader2', 'User', 'Wallet', 'LayoutDashboard', 'Hourglass', 'ArrowLeft', 'ShieldCheck'}

stack = []
for match in tag_pattern.finditer(content):
    is_closing = match.group(1) == '/'
    tag_name = match.group(2)
    
    # Simple check for self-closing in the tag itself
    tag_full = content[match.start():content.find('>', match.end())+1]
    is_self = tag_full.endswith('/>') or tag_name in void_elements
    
    if not is_self:
        if is_closing:
            if stack and stack[-1] == tag_name:
                stack.pop()
        else:
            stack.append(tag_name)

print(f"Stack to close: {stack}")

# Braces and Parens
open_b = content.count('{')
close_b = content.count('}')
open_p = content.count('(')
close_p = content.count(')')

needed_b = open_b - close_b
needed_p = open_p - close_p

print(f"Braces needed: {needed_b}, Parens needed: {needed_p}")

suffix = "\n"
for tag in reversed(stack):
    suffix += f"</{tag}>\n"

# Usually, we need to close the JSX expression blocks first
# Looking at the stack, we might have unclosed { } blocks
# Let's see the stack first.
