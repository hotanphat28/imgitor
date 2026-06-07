from PIL import Image, ImageEnhance, ImageDraw, ImageFont
import io

def adjust_image(img, brightness=1.0, contrast=1.0, saturation=1.0, sharpness=1.0):
    """Adjusts brightness, contrast, saturation, and sharpness using ImageEnhance."""
    if brightness != 1.0:
        enhancer = ImageEnhance.Brightness(img)
        img = enhancer.enhance(brightness)
    if contrast != 1.0:
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(contrast)
    if saturation != 1.0:
        enhancer = ImageEnhance.Color(img)
        img = enhancer.enhance(saturation)
    if sharpness != 1.0:
        enhancer = ImageEnhance.Sharpness(img)
        img = enhancer.enhance(sharpness)
    return img
from rembg import remove

def apply_watermark(img, text=None, color='#ffffff', opacity=128, wm_image=None):
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
        
    watermark_layer = Image.new('RGBA', img.size, (0, 0, 0, 0))
    wm_height_offset = 0
    
    if wm_image:
        wm = Image.open(wm_image).convert('RGBA')
        wm.thumbnail((img.width // 5, img.height // 5))
        if opacity < 255:
            alpha = wm.split()[3]
            alpha = alpha.point(lambda p: p * (opacity / 255.0))
            wm.putalpha(alpha)
            
        x = img.width - wm.width - 20
        y = img.height - wm.height - 20
        watermark_layer.paste(wm, (x, y), wm)
        wm_height_offset = wm.height + 10
        
    if text:
        color = color.lstrip('#')
        r, g, b = tuple(int(color[i:i+2], 16) for i in (0, 2, 4))
        fill_color = (r, g, b, opacity)
        
        font = ImageFont.load_default()
        draw = ImageDraw.Draw(watermark_layer)
        bbox = draw.textbbox((0, 0), text, font=font)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        
        txt_img = Image.new('RGBA', (tw + 10, th + 10), (0, 0, 0, 0))
        txt_draw = ImageDraw.Draw(txt_img)
        txt_draw.text((5, 5), text, font=font, fill=fill_color)
        
        scale = max(1, img.width // 400) * 2
        txt_img = txt_img.resize((txt_img.width * scale, txt_img.height * scale), Image.Resampling.LANCZOS)
        
        x = img.width - txt_img.width - 20
        y = img.height - txt_img.height - 20 - wm_height_offset
        watermark_layer.paste(txt_img, (x, y), txt_img)
        
    return Image.alpha_composite(img, watermark_layer)

def resize_by_file_size(img, target_kb):
    """Compresses the image to reach the target file size in KB."""
    quality = 95
    while quality > 10:
        buffer = io.BytesIO()
        img.save(buffer, format='JPEG', quality=quality)
        if len(buffer.getvalue()) <= target_kb * 1024:
            return Image.open(buffer)
        quality -= 5
    return Image.open(buffer)

def process_image_core(img, mode, params, wm_image_stream=None):
    """Core image processing router shared by web, batch, and api."""
    processed_img = None
    if mode == 'resolution':
        width, height = int(params.get('width', 100)), int(params.get('height', 100))
        processed_img = resize_by_resolution(img, width, height)
        
    elif mode == 'crop':
        x, y = int(float(params.get('crop_x', 0))), int(float(params.get('crop_y', 0)))
        w, h = int(float(params.get('crop_w', img.width))), int(float(params.get('crop_h', img.height)))
        processed_img = crop_image(img, x, y, w, h)

    elif mode == 'rotate':
        deg = int(params.get('rotate_deg', 90))
        processed_img = rotate_image(img, deg)
    
    elif mode == 'filter':
        filter_type = params.get('filter_type', 'grayscale')
        processed_img = apply_filter(img, filter_type)
        
    elif mode == 'adjust':
        brightness = float(params.get('brightness', 1.0))
        contrast = float(params.get('contrast', 1.0))
        saturation = float(params.get('saturation', 1.0))
        sharpness = float(params.get('sharpness', 1.0))
        processed_img = adjust_image(img, brightness, contrast, saturation, sharpness)
    
    elif mode == 'remove_bg':
        processed_img = remove_background(img)
        
    elif mode == 'watermark':
        text = params.get('wm_text')
        color = params.get('wm_color', '#ffffff')
        opacity = int(params.get('wm_opacity', 128))
        processed_img = apply_watermark(img, text, color, opacity, wm_image_stream)

    return processed_img

def resize_by_resolution(img, width, height):
    """Resizes the image to specific pixel dimensions."""
    return img.resize((width, height), Image.Resampling.LANCZOS)

def crop_image(img, x, y, w, h):
    """Crops the image based on coordinates and dimensions."""
    return img.crop((x, y, x + w, y + h))

def rotate_image(img, degrees):
    """Rotates the image by the specified degrees."""
    return img.rotate(-degrees, expand=True)

def apply_filter(img, filter_type):
    """Applies a specific color filter to the image."""
    img = img.convert("RGB")
    
    if filter_type == "grayscale":
        return img.convert("L")
    
    # Get pixel data
    pixels = img.load()
    width, height = img.size
    
    for y in range(height):
        for x in range(width):
            r, g, b = pixels[x, y]
            
            if filter_type == "sepia":
                tr = int(0.393 * r + 0.769 * g + 0.189 * b)
                tg = int(0.349 * r + 0.686 * g + 0.168 * b)
                tb = int(0.272 * r + 0.534 * g + 0.131 * b)
            
            elif filter_type == "blue":
                tr = r
                tg = g
                tb = min(255, int(b * 1.5)) # Boost blue
                
            elif filter_type == "warm":
                tr = min(255, int(r * 1.2)) # Boost red
                tg = min(255, int(g * 1.1)) # Slightly boost green
                tb = int(b * 0.9)           # Reduce blue
            
            else:
                tr, tg, tb = r, g, b

            pixels[x, y] = (min(tr, 255), min(tg, 255), min(tb, 255))
            
    return img

def remove_background(img):
    """Removes the background from the image."""
    return remove(img)
