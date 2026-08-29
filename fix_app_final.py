import sys

with open('src/App.tsx.clean', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Staff Tab Bar with ALL tabs
# Find the end of the pendingKeys object and inject the missing ones
# Or just replace the whole array content

staff_tabs_start = content.find('{[')
if staff_tabs_start != -1:
    # Find the closing ].map
    staff_tabs_end = content.find('].map((tab) =>', staff_tabs_start)
    if staff_tabs_end != -1:
        new_tabs = """[
                    {
                      id: "overview",
                      label: "📊 OVERVIEW",
                      color: "from-fuchsia-600 to-purple-600",
                    },
                    {
                      id: "emailKey",
                      label: "📧 EMAIL KEY (EMAILJS)",
                      color: "from-blue-600 to-indigo-600",
                    },
                    {
                      id: "colorTheme",
                      label: "🎨 COLOR THEME",
                      color: "from-cyan-600 to-blue-600",
                    },
                    {
                      id: "refundPanel",
                      label: "💸 REFUND PANEL",
                      color: "from-red-600 to-rose-700",
                    },
                    {
                      id: "resellers",
                      label: `🛡️ RESELLERS (${ensureArray(approvedResellers).length})`,
                      color: "from-amber-500 to-yellow-600",
                    },
                    {
                      id: "addPanel",
                      label: "➕ ADD PANEL",
                      color: "from-pink-500 to-fuchsia-600",
                    },
                    {
                      id: "house",
                      label: "🏠 HOUSE PANEL (24GHANTA)",
                      color: "from-amber-500 to-orange-600",
                    },
                    {
                      id: "managePanels",
                      label: "🗑️ MANAGE PANELS",
                      color: "from-red-500 to-rose-600",
                    },
                    {
                      id: "supportLinks",
                      label: "💬 SUPPORT LINKS",
                      color: "from-sky-500 to-blue-600",
                    },
                    {
                      id: "users",
                      label: `👥 USERS (${ensureArray(registeredUsers).length})`,
                      color: "from-purple-500 to-indigo-600",
                    },
                    {
                      id: "payments",
                      label: `💰 PAYMENTS (${ensureArray(paymentHistory).length})`,
                      color: "from-emerald-500 to-teal-600",
                    },
                    {
                      id: "pendingKeys",
                      label: `⏳ PENDING KEYS (${ensureArray(keyRequests).filter((r) => r.status === "PENDING").length})`,
                      color: "from-amber-600 to-yellow-600",
                    },
                  ]"""
        # We need to find the specific staff tabs array.
        # It's after '{/* Staff DSLR Tab Bar */}'
        target_section = content.find('{/* Staff DSLR Tab Bar */}')
        if target_section != -1:
            array_start = content.find('[', target_section)
            array_end = content.find('].map', array_start) + 1
            content = content[:array_start] + new_tabs + content[array_end:]

# 2. Fix the corrupted end
stable_end = content.find('EmailJS Dashboard &gt;{" "}')
if stable_end != -1:
    content = content[:stable_end]
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
                    </form>
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

print("Final restoration complete.")
