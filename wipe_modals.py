import re

with open("src/App.tsx", "r", encoding="utf-8", errors="replace") as f:
    text = f.read()

# Fix the corruption first (if there's any non-ascii garbage in the JSX area)
# Let's just find the start and end indices of the corrupted modal area.
start_str = "{/* CHECKOUT MODAL / PAGE (BUY KEY FLOW) */}"
end_str = "{/* 3. IMPORTANT NOTICE Modal (Tall, Spacious & Centered with 7-Color Animated Rainbow Border) */}"

idx_start = text.find(start_str)
idx_end = text.find(end_str)

if idx_start != -1 and idx_end != -1:
    print("Found region to replace.")
    new_text = text[:idx_start] + "\n\n      " + start_str + "\n\n      " + end_str + text[idx_end + len(end_str):]
    with open("src/App.tsx", "w", encoding="utf-8") as f:
        f.write(new_text)
else:
    print("Could not find boundaries", idx_start, idx_end)

