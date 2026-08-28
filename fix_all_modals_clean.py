import re

with open("src/App.tsx", "r", encoding="utf-8") as f:
    text = f.read()

# 1. Clean checkoutData modal block
# Let us find where checkoutData modal is
old_checkout_block = re.search(r'\{checkoutData && \([\s\S]*?^      \)\}', text, re.MULTILINE)
# Or let us locate {checkoutData && ( ... )}
# Since regex might be tricky, let us find exact indices or replace cleanly.

# Let us check if we can restore App.tsx to the state before task-120 or simply replace the modals with clean ones.
# Wait, we know the exact content of checkout modal, buy success modal, and important notice modal.
