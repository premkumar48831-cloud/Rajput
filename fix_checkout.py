import re

with open("src/App.tsx", "r", encoding="utf-8") as f:
    text = f.read()

pattern = re.compile(r"  const handleOpenCheckout = \(price: any, panelTitle: string, explicitResellerPrice\?: number\) => \{.*?(?=    // Differential Pricing calculation)", re.DOTALL)

new_func = """  const handleOpenCheckout = (price: any, panelTitle: string, explicitResellerPrice?: number) => {
    const isResellerActive = resellerUser.isLoggedIn && resellerUser.isApproved;
    const panelObj = panels.find(p => p.title === panelTitle);
    const planObj = panelObj?.pricing.find(pr => pr.price == price || (explicitResellerPrice && (pr as any).resellerPrice === explicitResellerPrice));
    
    // Completely secure Out of Stock check
    const isOutOfStock = !planObj || isNaN(Number(planObj.price)) || Number(planObj.price) < 0 || (planObj.label && planObj.label.toLowerCase().includes('stock')) || (typeof planObj.price === 'string' && planObj.price.toLowerCase().includes('stock'));
    
    if (isOutOfStock) {
      alert(`Is panel ko abhi nahin khareed sakte hain (Out of Stock). Kripya dropdown se dusra plan select karein.`);
      return; // Do not open checkout modal
    }
    
    const numPrice = Number(planObj.price);
"""

if pattern.search(text):
    text = pattern.sub(new_func, text)
    with open("src/App.tsx", "w", encoding="utf-8") as f:
        f.write(text)
    print("Fixed handleOpenCheckout successfully")
else:
    print("Could not find handleOpenCheckout match")
