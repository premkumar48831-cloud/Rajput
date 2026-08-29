import sys

with open('src/App.tsx.clean', 'r', encoding='utf-8') as f:
    lines = f.readlines()[:10849]
    content = "".join(lines)

suffix = """
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
    f.write(content + suffix)
