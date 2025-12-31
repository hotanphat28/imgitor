from flask import request, render_template, send_file
from app import app
from app.utils import resize_by_resolution, resize_by_filesize, convert_to_bw, remove_background
from PIL import Image
import io
import os

@app.route('/')
def index():
    """Serves the main tool page."""
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    """Handles image uploads, processing, and delivery."""
    if 'image' not in request.files:
        return "Error: No file uploaded.", 400
    
    file = request.files['image']
    if not file or file.filename == '':
        return "Error: Empty file provided.", 400

    mode = request.form['mode']
    
    try:
        img = Image.open(file.stream)
        filename, ext = os.path.splitext(file.filename)
        processed_img = None
        save_format = "JPEG"
        suffix = "_processed"

        # INVERSION OVER NESTING: Handle filesize first as it returns a unique buffer
        if mode == 'filesize':
            target_kb = int(request.form['size'])
            buffer, mime = resize_by_filesize(img, target_kb)
            if not buffer:
                return "Error: Could not meet target size. Try a larger value.", 400
            
            return send_file(buffer, mimetype=mime, as_attachment=True, download_name=f"{filename}_scaled.jpg")

        # Handle other modes
        if mode == 'resolution':
            width, height = int(request.form['width']), int(request.form['height'])
            processed_img = resize_by_resolution(img, width, height)
            suffix = "_resized"
            save_format = "PNG" if img.mode == 'RGBA' else "JPEG"
        
        elif mode == 'bw_only':
            processed_img = convert_to_bw(img)
            suffix = "_bw"
            save_format = "PNG" if img.mode == 'RGBA' else "JPEG"
        
        elif mode == 'remove_bg':
            processed_img = remove_background(img)
            suffix = "_nobg"
            save_format = "PNG"

        if not processed_img:
            return "Error: Invalid mode.", 400

        # Save processed image to buffer
        buffer = io.BytesIO()
        if save_format == 'JPEG' and processed_img.mode in ('RGBA', 'LA', 'P'):
            processed_img = processed_img.convert('RGB')
        

        
        processed_img.save(buffer, format=save_format)
        buffer.seek(0)
        
        # Check if this is a preview request
        is_preview = request.form.get('preview') == 'true'
        
        if is_preview:
            import base64
            img_str = base64.b64encode(buffer.getvalue()).decode('utf-8')
            return {
                "success": True,
                "image": f"data:image/{save_format.lower()};base64,{img_str}",
                "filename": f"{filename}{suffix}.{save_format.lower()}"
            }

        return send_file(buffer, mimetype=f"image/{save_format.lower()}", as_attachment=True, download_name=f"{filename}{suffix}.{save_format.lower()}")

    except ValueError:
        return "Error: Invalid input numbers.", 400
    except Exception as e:
        return f"An error occurred: {e}", 500
