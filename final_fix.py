import sys

with open('src/App.tsx.clean', 'r', encoding='utf-8') as f:
    lines = f.readlines()[:10849]
    content = "".join(lines)

# We need 3 '}' and 3 ')' total
# 1 pair will be for return(); and function {}
# So we need 2 more pairs before that

suffix = """
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
"""

# Count again after adding this div structure
test_content = content + suffix
o_b = test_content.count('{')
c_b = test_content.count('}')
o_p = test_content.count('(')
c_p = test_content.count(')')

needed_p = o_p - c_p
needed_b = o_b - c_b

final_suffix = suffix
for _ in range(needed_p - 1):
    final_suffix += ")\n"
final_suffix += ");\n"
for _ in range(needed_b - 1):
    final_suffix += "}\n"
final_suffix += "}\n"

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content + final_suffix)
