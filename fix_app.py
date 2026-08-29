import sys

with open('src/App.tsx.clean', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 1. Add refundPanel to the staff tab list
# Look for the pendingKeys tab entry and add refundPanel after it
new_lines = []
for line in lines:
    new_lines.append(line)
    if 'id: "pendingKeys",' in line:
        # We need to find the end of this object to insert after it
        pass
    if 'color: "from-amber-600 to-yellow-600",' in line and 'id: "pendingKeys"' in "".join(new_lines[-5:]):
        new_lines.append('                    },\n')
        new_lines.append('                    {\n')
        new_lines.append('                      id: "refundPanel",\n')
        new_lines.append('                      label: "💸 REFUND PANEL",\n')
        new_lines.append('                      color: "from-red-600 to-rose-700",\n')
        # We need to be careful not to duplicate the '},' if it's already there
        # Let's just find the exact spot.
        
# Actually, it's safer to just replace the whole array if I can find it uniquely.
content = "".join(lines)
old_list = """                    {
                      id: "pendingKeys",
                      label: `⏳ PENDING KEYS (${ensureArray(keyRequests).filter((r) => r.status === "PENDING").length})`,
                      color: "from-amber-600 to-yellow-600",
                    },"""
new_list = old_list + """
                    {
                      id: "refundPanel",
                      label: "💸 REFUND PANEL",
                      color: "from-red-600 to-rose-700",
                    },"""

if old_list in content:
    content = content.replace(old_list, new_list)
else:
    # Try with slightly different spacing if needed, but let's assume it matches
    print("Warning: old_list not found for tab injection")

# 2. Fix the corrupted end
# We take content up to where it makes sense (before the corruption)
# The corruption starts around line 10860
# Let's find the last stable div or ul
stable_end = content.find('EmailJS Dashboard &gt;{" "}')
if stable_end != -1:
    content = content[:stable_end]
    # Add the missing guide text and close everything
    content += """EmailJS Dashboard &gt;{" "}
                            <strong>Email Templates</strong> &gt; Select{" "}
                            <strong className="text-white">your template</strong>.
                          </li>
                          <li>
                            Ensure your template variables match:{" "}
                            <code className="bg-black/40 px-1 rounded text-blue-300">
                              user_email
                            </code>
                            ,{" "}
                            <code className="bg-black/40 px-1 rounded text-blue-300">
                              delivered_key
                            </code>
                            , and{" "}
                            <code className="bg-black/40 px-1 rounded text-blue-300">
                              admin_message
                            </code>
                            .
                          </li>
                          <li>
                            Check for 422 Error: Make sure your Public Key is
                            correct and Account is active.
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    );
}
"""

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Restoration complete.")
