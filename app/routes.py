from flask import Blueprint, request, render_template, send_file, current_app
from app.utils import resize_by_resolution, apply_filter, remove_background, crop_image, rotate_image
from PIL import Image
import io
import os
from werkzeug.utils import secure_filename

main = Blueprint('main', __name__)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']

@main.route('/')
def index():
    """Serves the main tool page."""
    return render_template('index.html')

@main.route('/upload', methods=['POST'])
def upload_file():
    """Handles image uploads, processing, and delivery."""
    if 'image' not in request.files:
        current_app.logger.warning('No file part in the request.')
        return "Error: No file uploaded.", 400
    
    file = request.files['image']
    if not file or file.filename == '':
        current_app.logger.warning('Empty file uploaded.')
        return "Error: Empty file provided.", 400
        
    if not allowed_file(file.filename):
        current_app.logger.warning(f'Invalid file extension uploaded: {file.filename}')
        return "Error: Invalid file type.", 400

    filename = secure_filename(file.filename)
    mode = request.form.get('mode', '')
    
    try:
        img = Image.open(file.stream)
        base_filename, ext = os.path.splitext(filename)
        processed_img = None
        user_format = request.form.get('save_format', 'AUTO')
        save_format = "PNG" if img.mode in ('RGBA', 'P') else "JPEG"
        suffix = "_processed"

        # Handle modes
        if mode == 'resolution':
            width, height = int(request.form['width']), int(request.form['height'])
            processed_img = resize_by_resolution(img, width, height)
            suffix = "_resized"
            
        elif mode == 'crop':
            x, y = int(request.form.get('crop_x', 0)), int(request.form.get('crop_y', 0))
            w, h = int(request.form.get('crop_w', img.width)), int(request.form.get('crop_h', img.height))
            processed_img = crop_image(img, x, y, w, h)
            suffix = "_cropped"

        elif mode == 'rotate':
            deg = int(request.form.get('rotate_deg', 90))
            processed_img = rotate_image(img, deg)
            suffix = "_rotated"
        
        elif mode == 'filter':
            filter_type = request.form.get('filter_type', 'grayscale')
            processed_img = apply_filter(img, filter_type)
            suffix = f"_{filter_type}"
        
        elif mode == 'remove_bg':
            processed_img = remove_background(img)
            suffix = "_nobg"
            if user_format == 'AUTO':
                save_format = "PNG"

        if not processed_img:
            current_app.logger.warning(f'Invalid mode requested: {mode}')
            return "Error: Invalid mode.", 400

        if user_format != 'AUTO':
            save_format = user_format

        # Save processed image to buffer
        buffer = io.BytesIO()
        if save_format == 'JPEG' and processed_img.mode in ('RGBA', 'LA', 'P'):
            # Convert with white background for transparent images saved as JPEG
            bg = Image.new('RGB', processed_img.size, (255, 255, 255))
            if processed_img.mode == 'RGBA':
                bg.paste(processed_img, mask=processed_img.split()[3])
            else:
                bg.paste(processed_img)
            processed_img = bg
        elif save_format in ('PNG', 'WEBP', 'GIF') and processed_img.mode == 'P':
            processed_img = processed_img.convert('RGBA')

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
                "filename": f"{base_filename}{suffix}.{save_format.lower()}"
            }

        return send_file(buffer, mimetype=f"image/{save_format.lower()}", as_attachment=True, download_name=f"{base_filename}{suffix}.{save_format.lower()}")

    except ValueError as ve:
        current_app.logger.error(f'ValueError during processing: {ve}')
        return "Error: Invalid input parameters.", 400
    except Exception as e:
        current_app.logger.error(f'Error processing image: {e}')
        return f"An error occurred: {e}", 500
