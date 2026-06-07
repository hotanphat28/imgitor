from PIL import Image
import io
from rembg import remove

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
