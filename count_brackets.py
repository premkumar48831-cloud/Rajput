with open('src/App.tsx.clean', 'r', encoding='utf-8') as f:
    lines = f.readlines()[:10849]
    content = "".join(lines)

open_braces = content.count('{')
close_braces = content.count('}')
open_parens = content.count('(')
close_parens = content.count(')')

print(f"Braces: {{: {open_braces}, }}: {close_braces}, diff: {open_braces - close_braces}")
print(f"Parens: (: {open_parens}, ): {close_parens}, diff: {open_parens - close_parens}")
