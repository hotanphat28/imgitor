import io

from PIL import Image, ImageDraw, ImageEnhance, ImageFont


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


import threading

from rembg import remove

rembg_lock = threading.Lock()


def apply_watermark(img, text=None, color="#ffffff", opacity=128, wm_image=None):
    if img.mode != "RGBA":
        img = img.convert("RGBA")

    watermark_layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    wm_height_offset = 0

    if wm_image:
        wm = Image.open(wm_image).convert("RGBA")
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
        color = color.lstrip("#")
        r, g, b = tuple(int(color[i : i + 2], 16) for i in (0, 2, 4))
        fill_color = (r, g, b, opacity)

        font = ImageFont.load_default()
        draw = ImageDraw.Draw(watermark_layer)
        bbox = draw.textbbox((0, 0), text, font=font)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]

        txt_img = Image.new("RGBA", (tw + 10, th + 10), (0, 0, 0, 0))
        txt_draw = ImageDraw.Draw(txt_img)
        txt_draw.text((5, 5), text, font=font, fill=fill_color)

        scale = max(1, img.width // 400) * 2
        txt_img = txt_img.resize(
            (txt_img.width * scale, txt_img.height * scale), Image.Resampling.LANCZOS
        )

        x = img.width - txt_img.width - 20
        y = img.height - txt_img.height - 20 - wm_height_offset
        watermark_layer.paste(txt_img, (x, y), txt_img)

    return Image.alpha_composite(img, watermark_layer)


def resize_by_file_size(img, target_kb):
    """Compresses the image to reach the target file size in KB."""
    quality = 95
    while quality > 10:
        buffer = io.BytesIO()
        img.save(buffer, format="JPEG", quality=quality)
        if len(buffer.getvalue()) <= target_kb * 1024:
            return Image.open(buffer)
        quality -= 5
    return Image.open(buffer)


def process_image_core(img, mode, params, wm_image_stream=None):
    """Core image processing router shared by web, batch, and api."""
    processed_img = None
    if mode == "resolution":
        if params.get("resize_type") == "percentage":
            pct_str = params.get("percentage")
            pct = float(pct_str) if pct_str else 100.0
            width = max(1, int(img.width * (pct / 100.0)))
            height = max(1, int(img.height * (pct / 100.0)))
        else:
            w_str = params.get("width")
            h_str = params.get("height")
            width = int(float(w_str)) if w_str else img.width
            height = int(float(h_str)) if h_str else img.height
        processed_img = resize_by_resolution(img, width, height)

    elif mode == "crop":
        x, y = int(float(params.get("crop_x", 0))), int(float(params.get("crop_y", 0)))
        w, h = (
            int(float(params.get("crop_w", img.width))),
            int(float(params.get("crop_h", img.height))),
        )

        rotate = float(params.get("crop_rotate", 0))
        scaleX = float(params.get("crop_scaleX", 1))
        scaleY = float(params.get("crop_scaleY", 1))

        from PIL import ImageOps

        if scaleX == -1:
            img = ImageOps.mirror(img)
        if scaleY == -1:
            img = ImageOps.flip(img)

        if rotate != 0:
            img = img.rotate(-rotate, expand=True, resample=Image.Resampling.BICUBIC)

        processed_img = crop_image(img, x, y, w, h)

    elif mode == "rotate":
        deg = int(params.get("rotate_deg", 90))
        processed_img = rotate_image(img, deg)

    elif mode == "filter":
        filter_type = params.get("filter_type", "grayscale")
        processed_img = apply_filter(img, filter_type)

    elif mode == "adjust":
        brightness = float(params.get("brightness", 1.0))
        contrast = float(params.get("contrast", 1.0))
        saturation = float(params.get("saturation", 1.0))
        sharpness = float(params.get("sharpness", 1.0))
        processed_img = adjust_image(img, brightness, contrast, saturation, sharpness)

    elif mode == "dither":
        dither_method = params.get("dither_method", "none")
        processed_img = apply_dithering(img, dither_method)

    elif mode == "halftone":
        shape = params.get("halftone_shape", "none")
        if shape != "none":
            sample = int(float(params.get("halftone_size", 10)))
            angle = int(float(params.get("halftone_angle", 0)))
            processed_img = apply_halftone(img, sample, angle, shape)
        else:
            processed_img = img

    elif mode == "remove_bg":
        processed_img = remove_background(img)

    elif mode == "watermark":
        text = params.get("wm_text")
        color = params.get("wm_color", "#ffffff")
        opacity = int(params.get("wm_opacity", 128))
        processed_img = apply_watermark(img, text, color, opacity, wm_image_stream)

    return processed_img


def process_image_pipeline(img, params, wm_image_stream=None):
    """Pipeline processor that applies all non-destructive effects sequentially.
    Used for live previews and final downloads."""
    processed_img = img.copy()

    # 1. Crop
    if (
        params.get("crop_w")
        and params.get("crop_w") != "NaN"
        and params.get("crop_w") != ""
    ):
        try:
            x, y = (
                int(float(params.get("crop_x", 0))),
                int(float(params.get("crop_y", 0))),
            )
            w, h = (
                int(float(params.get("crop_w", img.width))),
                int(float(params.get("crop_h", img.height))),
            )

            rotate = float(params.get("crop_rotate", 0))
            scaleX = float(params.get("crop_scaleX", 1))
            scaleY = float(params.get("crop_scaleY", 1))

            from PIL import ImageOps

            if scaleX == -1:
                processed_img = ImageOps.mirror(processed_img)
            if scaleY == -1:
                processed_img = ImageOps.flip(processed_img)

            if rotate != 0:
                processed_img = processed_img.rotate(
                    -rotate, expand=True, resample=Image.Resampling.BICUBIC
                )

            processed_img = crop_image(processed_img, x, y, w, h)
        except (ValueError, TypeError):
            pass  # Invalid crop parameters, skip cropping

    # 2. Filter
    filter_type = params.get("filter_type", "none")
    if filter_type and filter_type != "none":
        processed_img = apply_filter(processed_img, filter_type)

    # 3. Adjustments
    try:
        brightness = float(params.get("brightness", 1.0))
        contrast = float(params.get("contrast", 1.0))
        saturation = float(params.get("saturation", 1.0))
        sharpness = float(params.get("sharpness", 1.0))
        if (
            brightness != 1.0
            or contrast != 1.0
            or saturation != 1.0
            or sharpness != 1.0
        ):
            processed_img = adjust_image(
                processed_img, brightness, contrast, saturation, sharpness
            )
    except (ValueError, TypeError):
        pass  # Invalid adjust parameters, skip

    # 4. Dithering
    dither_method = params.get("dither_method", "none")
    if dither_method and dither_method != "none":
        processed_img = apply_dithering(processed_img, dither_method)

    # 4.5 Halftone
    try:
        shape = params.get("halftone_shape", "none")
        if shape != "none":
            halftone_size = params.get("halftone_size")
            if halftone_size:
                sample = int(float(halftone_size))
                angle = int(float(params.get("halftone_angle", 0)))
                processed_img = apply_halftone(processed_img, sample, angle, shape)
    except (ValueError, TypeError):
        pass

    # 5. Watermark
    wm_text = params.get("wm_text")
    if wm_text or wm_image_stream:
        color = params.get("wm_color", "#ffffff")
        opacity = int(params.get("wm_opacity", 128))
        processed_img = apply_watermark(
            processed_img, wm_text, color, opacity, wm_image_stream
        )

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
    if filter_type == "none":
        return img

    img = img.convert("RGB")

    if filter_type == "grayscale":
        return img.convert("L")
    elif filter_type == "invert":
        from PIL import ImageOps

        return ImageOps.invert(img)
    elif filter_type == "high_contrast":
        from PIL import ImageEnhance

        return ImageEnhance.Contrast(img).enhance(1.5)
    elif filter_type == "vintage":
        from PIL import ImageEnhance

        img = ImageEnhance.Color(img).enhance(0.5)
        return ImageEnhance.Brightness(img).enhance(1.1)
    elif filter_type == "posterize":
        from PIL import ImageOps

        return ImageOps.posterize(img, 3)

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
                tb = min(255, int(b * 1.5))  # Boost blue

            elif filter_type == "warm":
                tr = min(255, int(r * 1.2))  # Boost red
                tg = min(255, int(g * 1.1))  # Slightly boost green
                tb = int(b * 0.9)  # Reduce blue

            else:
                tr, tg, tb = r, g, b

            pixels[x, y] = (min(tr, 255), min(tg, 255), min(tb, 255))

    return img


def apply_halftone(img, sample=10, angle=0, shape="round"):
    """Applies a trendy halftone effect to the image."""
    img_gray = img.convert("L")
    
    if angle != 0:
        img_gray = img_gray.rotate(angle, expand=True, resample=Image.Resampling.BICUBIC)
    
    w, h = img_gray.size
    small_w = (w + sample - 1) // sample
    small_h = (h + sample - 1) // sample
    
    # Downscale the image to average the blocks
    img_small = img_gray.resize((small_w, small_h), Image.Resampling.BILINEAR)
    pixels = img_small.load()
    
    # Create the output image (white background)
    output_img = Image.new("L", (w, h), color=255)
    from PIL import ImageDraw
    draw = ImageDraw.Draw(output_img)
    
    # Draw shapes
    for x in range(small_w):
        for y in range(small_h):
            brightness = pixels[x, y]
            size_factor = (255 - brightness) / 255.0
            
            if size_factor > 0:
                center_x = x * sample + sample / 2.0
                center_y = y * sample + sample / 2.0
                
                if shape == "line":
                    thickness = size_factor * sample
                    left = center_x - thickness / 2.0
                    right = center_x + thickness / 2.0
                    top = y * sample
                    bottom = (y + 1) * sample
                    draw.rectangle([left, top, right, bottom], fill=0)
                else:
                    radius = size_factor * (sample / 2.0)
                    if shape == "square":
                        radius = size_factor * (sample / 1.414)  # Make square visually cover same area
                    
                    left = center_x - radius
                    top = center_y - radius
                    right = center_x + radius
                    bottom = center_y + radius
                    
                    if shape == "square":
                        draw.rectangle([left, top, right, bottom], fill=0)
                    else:
                        draw.ellipse([left, top, right, bottom], fill=0)
                        
    if angle != 0:
        output_img = output_img.rotate(-angle, expand=False, resample=Image.Resampling.BICUBIC)
        orig_w, orig_h = img.size
        out_w, out_h = output_img.size
        left = (out_w - orig_w) // 2
        top = (out_h - orig_h) // 2
        output_img = output_img.crop((left, top, left + orig_w, top + orig_h))
    
    return output_img.convert("RGB")


def apply_dithering(img, method):
    """Applies dithering effect to the image using a 1-bit B&W palette."""
    if not method or method == "none":
        return img

    import dithering
    
    img = img.convert("RGB")
    bw_palette = [(0, 0, 0), (255, 255, 255)]
    
    try:
        return dithering.dither(img, method, palette=bw_palette)
    except Exception as e:
        print(f"Error applying dithering: {e}")
        return img


def remove_background(img):
    """Removes the background from the image."""
    with rembg_lock:
        return remove(img)
