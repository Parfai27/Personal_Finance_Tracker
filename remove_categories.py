import re

# Read the file
with open(r'd:\KLab Projects\personal-finance-tracker\Personal_Finance_Tracker\app.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove Categories nav item
categories_nav_pattern = r'<a href="#categories"[^>]*>.*?</a>\s*'
content = re.sub(categories_nav_pattern, '', content, flags=re.DOTALL)

# Remove Categories view section
categories_view_pattern = r'<!-- Categories View -->.*?<!-- Analytics View -->'
content = re.sub(categories_view_pattern, '<!-- Analytics View -->', content, flags=re.DOTALL)

# Write back
with open(r'd:\KLab Projects\personal-finance-tracker\Personal_Finance_Tracker\app.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully removed Categories section from app.html")
