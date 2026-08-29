import subprocess
import os

def test_lines(n):
    with open('src/App.tsx.clean', 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # We use a very robust closing script
    content = "".join(lines[:n])
    
    # Try to find number of unclosed braces
    open_b = content.count('{')
    close_b = content.count('}')
    open_p = content.count('(')
    close_p = content.count(')')
    
    suffix = "\n"
    if open_p > close_p:
        suffix += ")" * (open_p - close_p)
    if open_b > close_b:
        suffix += "}" * (open_b - close_b)
    
    suffix += "\nexport default function App() { return <div>Stable at {n}</div>; }"
    
    with open('src/App.tsx', 'w', encoding='utf-8') as f:
        f.write(content + suffix)
    
    result = subprocess.run(['npm', 'run', 'build'], capture_output=True, text=True)
    return result.returncode == 0

# Test every 500 lines
for i in range(10500, 2000, -500):
    print(f"Testing line: {i}")
    if test_lines(i):
        print(f"FOUND STABLE POINT: {i}")
        break
