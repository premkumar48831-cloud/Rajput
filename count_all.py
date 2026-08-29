with open('src/App.tsx.clean', 'r', encoding='utf-8') as f:
    lines = f.readlines()[:10850]
    content = "".join(lines)

open_b = content.count('{')
close_b = content.count('}')
open_p = content.count('(')
close_p = content.count(')')

print(f"B: {open_b}-{close_b}={open_b-close_b}")
print(f"P: {open_p}-{close_p}={open_p-close_p}")
