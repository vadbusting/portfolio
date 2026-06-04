import random

with open('script.js', 'r') as f:
    lines = f.readlines()

new_images = [
    "        'image/sub_banner_A案.jpg',\n",
    "        'image/sub_banner_ban.jpg',\n",
    "        'image/sub_banner_banner.png',\n",
    "        'image/sub_banner_banner2.jpg',\n",
    "        'image/sub_banner_golf1.jpg',\n",
    "        'image/sub_banner_golf2.jpg',\n",
    "        'image/sub_banner_golf3.jpg',\n",
    "        'image/sub_banner_golf4.jpg',\n",
    "        'image/sub_banner_kogai.jpg',\n",
    "        'image/sub_banner_kogaisp.jpg',\n",
    "        'image/sub_banner_manual.png',\n",
    "        'image/sub_banner_test1.png',\n",
    "        'image/sub_banner_test2.png',\n"
]

start_idx = -1
end_idx = -1
for i, line in enumerate(lines):
    if 'const rawImages = [' in line:
        start_idx = i + 1
    elif start_idx != -1 and ');' in line or ']' in line and end_idx == -1:
        if '];' in line:
            end_idx = i
            break

if start_idx != -1 and end_idx != -1:
    images = lines[start_idx:end_idx]
    
    # insert new images randomly into the last 40 images
    # current length is around 158
    insert_start = max(0, len(images) - 40)
    
    for new_img in new_images:
        insert_pos = random.randint(insert_start, len(images))
        images.insert(insert_pos, new_img)
        
    new_lines = lines[:start_idx] + images + lines[end_idx:]
    
    with open('script.js', 'w') as f:
        f.writelines(new_lines)
    print("Successfully inserted 13 images.")
else:
    print("Could not find rawImages array.", start_idx, end_idx)
