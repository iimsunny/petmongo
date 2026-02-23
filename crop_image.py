from PIL import Image
import os

img_path = r"apps/mobile/src/assets/ui/paw.png"

try:
    img = Image.open(img_path)
    # 获取非透明区域的边界框
    bbox = img.getbbox()
    
    if bbox:
        # 裁剪图片
        cropped_img = img.crop(bbox)
        # 保存覆盖原文件
        cropped_img.save(img_path)
        print(f"Successfully cropped {img_path}. New size: {cropped_img.size}")
    else:
        print("Image is completely transparent or empty.")
        
except Exception as e:
    print(f"Error: {e}")
