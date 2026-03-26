import re

with open('app.py', 'r') as f:
    content = f.read()

# Remove old allowed_file function
old_allowed = """ALLOWED_EXTENSIONS = {'txt', 'html', 'json', 'pdf'}

def allowed_file(filename):
    \"\"\"Check if the uploaded file has a permitted extension.\"\"\"
    return '.' in filename and \\
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS"""

content = content.replace(old_allowed, "")

with open('app.py', 'w') as f:
    f.write(content)
