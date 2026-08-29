with open('src/App.tsx.clean', 'r', encoding='utf-8') as f:
    lines = f.readlines()

stack = []
for i, line in enumerate(lines):
    # Very simple check, ignores strings/comments for now but might find the big one
    for char in line:
        if char == '{':
            stack.append(i + 1)
        elif char == '}':
            if stack:
                stack.pop()

if stack:
    print(f"Top 10 unclosed braces started at lines: {stack[:10]}")
else:
    print("All braces closed!")
