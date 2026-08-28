with open("src/App.tsx", "r", encoding="utf-8", errors="ignore") as f:
    text = f.read()

import re

# Replace newPanelForm number inputs for price
for p in ['price1', 'price3', 'price7', 'price15', 'price30']:
    pattern = r'type="number"\s+value=\{newPanelForm\.' + p + r'\}\s+onChange=\{\(e\) => setNewPanelForm\(\{\.\.\.newPanelForm,\s+' + p + r': Number\(e\.target\.value\)\}\)\}'
    replacement = f'type="text" value={{newPanelForm.{p}}} onChange={{(e) => setNewPanelForm({{{...newPanelForm, {p}: e.target.value}}})}}'
    text, count = re.subn(pattern, replacement, text)
    print(f"newPanelForm {p}: replaced {count} occurrences")

# Replace editingPanel number inputs for price
for p in ['price1', 'price3', 'price7', 'price15', 'price30']:
    pattern = r'type="number"\s+value=\{editingPanel\.' + p + r'\}\s+onChange=\{\(e\) => setEditingPanel\(\{\.\.\.editingPanel,\s+' + p + r': Number\(e\.target\.value\)\}\)\}'
    replacement = f'type="text" value={{editingPanel.{p}}} onChange={{(e) => setEditingPanel({{{...editingPanel, {p}: e.target.value}}})}}'
    text, count = re.subn(pattern, replacement, text)
    print(f"editingPanel {p}: replaced {count} occurrences")

# Also update where pricing is mapped or displayed to handle text vs number
# For instance, when checkout or purchase is clicked, if plan.price is not a number (e.g. "Out of Stock"), alert user.
# Let us check handleOpenCheckout function in App.tsx

with open("src/App.tsx", "w", encoding="utf-8") as f:
    f.write(text)

print("Updated App.tsx successfully!")
