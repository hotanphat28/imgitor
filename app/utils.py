from PIL import Image
import io

def resize_by_resolution(img, width, height):
    """Resizes the image to specific pixel dimensions."""
    return img.resize((width, height), Image.Resampling.LANCZOS)

def resize_by_filesize(img, target_kb):
    """
    Reduces file size by scaling down dimensions while keeping high JPEG quality.
    Returns a BytesIO buffer and the corresponding mime type.
    """
    target_bytes = target_kb * 1024
    quality = 90  # Maintain high visual quality
    
    # Convert transparent images to RGB for JPEG compatibility
    img_rgb = img.convert('RGB') if img.mode in ('RGBA', 'LA', 'P') else img

    # Iteratively scale down until the file size target is met
    for scale_percent in range(100, 10, -5):
        width = int(img_rgb.width * scale_percent / 100)
        height = int(img_rgb.height * scale_percent / 100)

        if width < 1 or height < 1:
            break

        resized_img = img_rgb.resize((width, height), Image.Resampling.LANCZOS)
        buffer = io.BytesIO()
        resized_img.save(buffer, format="JPEG", quality=quality)
        
        if buffer.tell() <= target_bytes:
            buffer.seek(0)
            return buffer, "image/jpeg"
    
    return None, None

def convert_to_bw(img):
    """Converts the image to grayscale (Black & White)."""
    return img.convert("L")
