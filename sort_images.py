import os
import re
from PIL import Image

def get_colorfulness(image_path):
    try:
        with Image.open(image_path) as img:
            img = img.convert('RGB')
            img.thumbnail((100, 100)) # Resize for speed
            
            pixels = list(img.getdata())
            total_diff = 0
            for r, g, b in pixels:
                max_val = max(r, g, b)
                min_val = min(r, g, b)
                total_diff += max_val - min_val
                
            avg_diff = total_diff / len(pixels)
            return avg_diff
    except Exception as e:
        print(f"Error processing {image_path}: {e}")
        return 9999 # Put errors at the end

# Extract current list from script.js
with open('script.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the rawImages array
match = re.search(r'const rawImages = \[\s*([\s\S]*?)\s*\];', content)
if not match:
    print("Could not find rawImages array in script.js")
    exit(1)

array_content = match.group(1)
# Parse individual paths (ignoring quotes and commas)
paths = re.findall(r"'([^']+)'", array_content)

# Calculate colorfulness for each
print(f"Calculating colorfulness for {len(paths)} images...")
scored_paths = []
for p in paths:
    full_path = os.path.join('.', p) # Assuming paths are relative to current dir
    score = get_colorfulness(full_path)
    scored_paths.append((p, score))

# Sort by colorfulness (low to high)
scored_paths.sort(key=lambda x: x[1])

print("Top 5 least colorful:")
for p, s in scored_paths[:5]:
    print(f"{s:.2f}: {p}")

print("\nTop 5 most colorful:")
for p, s in scored_paths[-5:]:
    print(f"{s:.2f}: {p}")

# Generate new array JS
new_array_content = ',\n'.join([f"        '{p}'" for p, s in scored_paths])
new_raw_images = f"const rawImages = [\n{new_array_content}\n    ];"

# Replace in script.js
new_content = content[:match.start()] + new_raw_images + content[match.end():]
with open('script.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("\nscript.js updated successfully!")
