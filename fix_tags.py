import re

def fix_jsx(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Simple regex to find tags, ignoring those in comments or strings is hard, 
    # but let's try to find valid JSX tags
    tag_pattern = re.compile(r'<(/?)([a-zA-Z][a-zA-Z0-9]*)(\s+[^>]*?)?(/?)(?=>|\s)')
    
    stack = []
    # Void elements in HTML
    void_elements = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'}
    
    # Components that are often self-closing in this specific app
    # (Lucide icons and common components)
    common_self_closing = {'Menu', 'Wallet', 'Filter', 'Search', 'Play', 'Zap', 'ChevronDown', 'ChevronUp', 'Download', 'Youtube', 'Send', 'X', 'LayoutDashboard', 'PlusCircle', 'Key', 'Dices', 'Gift', 'User', 'Headset', 'LogIn', 'Copy', 'RefreshCw', 'ArrowRight', 'ArrowLeft', 'Receipt', 'CreditCard', 'Hourglass', 'Loader2', 'Trash2', 'AlertCircle', 'AlertTriangle', 'CheckCircle', 'Info', 'ShieldCheck', 'Users', 'Percent', 'Award', 'Tag', 'Globe', 'MessageCircle', 'Edit', 'Camera', 'EyeOff', 'Eye', 'Save', 'Clock', 'UserPlus', 'Sparkles', 'Palette', 'Home', 'QrCode', 'FolderDown', 'LogOut', 'Bell'}

    pos = 0
    while True:
        match = tag_pattern.search(content, pos)
        if not match:
            break
        
        full_tag = match.group(0)
        is_closing = match.group(1) == '/'
        tag_name = match.group(2)
        is_self_closing = match.group(4) == '/' or tag_name in common_self_closing or tag_name in void_elements
        
        if not is_self_closing:
            if is_closing:
                if stack and stack[-1] == tag_name:
                    stack.pop()
                else:
                    # Mismatch found, but in corrupted files we might just ignore it or pop until we find it
                    # For now, let's just pop if it's in the stack somewhere
                    if tag_name in stack:
                        while stack and stack[-1] != tag_name:
                            stack.pop()
                        if stack:
                            stack.pop()
            else:
                stack.append(tag_name)
        
        pos = match.end()
    
    print(f"Final Stack: {stack}")
    
    suffix = ""
    for tag in reversed(stack):
        suffix += f"\n</{tag}>"
    
    suffix += "\n);\n}\nexport default App;"
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content + suffix)

fix_jsx('src/App.tsx')
