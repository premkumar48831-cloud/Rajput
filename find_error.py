import subprocess
import os

def test_lines(n):
    with open('src/App.tsx.clean', 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    with open('src/App.tsx', 'w', encoding='utf-8') as f:
        f.writelines(lines[:n])
        # Try to close it
        f.write("\n  return <div>Test</div>;\n}\n")
    
    result = subprocess.run(['npm', 'run', 'build'], capture_output=True, text=True)
    return "Unterminated regular expression" in result.stderr

# Binary search for the first line that causes the regex error
low = 0
high = 10860
last_bad = high

while low <= high:
    mid = (low + high) // 2
    print(f"Testing mid: {mid}")
    if test_lines(mid):
        last_bad = mid
        high = mid - 1
    else:
        low = mid + 1

print(f"First line with regex error: {last_bad}")
