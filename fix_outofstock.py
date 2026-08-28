import re

with open("src/App.tsx", "r", encoding="utf-8") as f:
    text = f.read()

old_stock = "const isOutOfStock = plan.price < 0 || (plan.label && plan.label.toLowerCase().includes('stock'));"
new_stock = "const isOutOfStock = isNaN(Number(plan.price)) || Number(plan.price) < 0 || (plan.label && plan.label.toLowerCase().includes('stock')) || (typeof plan.price === 'string' && plan.price.toLowerCase().includes('stock'));"

text = text.replace(old_stock, new_stock)

with open("src/App.tsx", "w", encoding="utf-8") as f:
    f.write(text)

print("Fixed out of stock check")
