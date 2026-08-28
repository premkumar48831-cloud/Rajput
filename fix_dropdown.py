import re

with open("src/App.tsx", "r", encoding="utf-8") as f:
    text = f.read()

old_select = """onChange={(e) => {
                            const price = Number(e.target.value);
                            setSelectedPlans(prev => ({...prev, [panel.id]: price}));
                          }}"""

new_select = """onChange={(e) => {
                            const price = e.target.value;
                            setSelectedPlans(prev => ({...prev, [panel.id]: price}));
                          }}"""

text = text.replace(old_select, new_select)


old_buy = """const price = selectedPlans[panel.id] || panel.pricing[0]?.price;
                          if (!price) {
                            alert('Please select a plan from the dropdown above.');
                            return;
                          }"""

new_buy = """const price = selectedPlans[panel.id] !== undefined ? selectedPlans[panel.id] : panel.pricing[0]?.price;
                          if (price === undefined || price === null || price === '') {
                            alert('Please select a plan from the dropdown above.');
                            return;
                          }"""

text = text.replace(old_buy, new_buy)

with open("src/App.tsx", "w", encoding="utf-8") as f:
    f.write(text)

print("Fixed dropdown logic")
