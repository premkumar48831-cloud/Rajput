import re

with open("src/App.tsx", "r", encoding="utf-8") as f:
    text = f.read()

# Let us find where Important Notice Modal starts and ends, Checkout modal starts and ends, and Buy Successful modal starts and ends.
# Instead of fragile string replaces, let us use exact substring checks.

# 1. Important Notice Modal:
notice_start_old = '{showImportantNoticeModal && ('
# Let us search for {showImportantNoticeModal && and inspect what follows.
idx = text.find("{showImportantNoticeModal && (")
if idx != -1:
    print("Found showImportantNoticeModal at index", idx)

# Let us write a clean script that replaces the three modal blocks with clean, properly nested JSX.
