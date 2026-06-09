from flask import Blueprint, request, render_template, send_file, current_app, jsonify
from app.utils import resize_by_resolution, apply_filter, remove_background, crop_image, rotate_image, adjust_image, apply_watermark
from PIL import Image
import io
import os
import uuid
from pathlib import Path
from werkzeug.utils import secure_filename
import base64
import concurrent.futures
import zipfile

main = Blueprint('main', __name__)

executor = concurrent.futures.ThreadPoolExecutor(max_workers=4)
batch_jobs = {}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']

def get_preview_response(session_path, current_step, session_id, original_filename="image"):
    img_path = session_path / f"{current_step}.png"
    if not img_path.exists():
        return {"error": "Image state not found"}, 404
        
    with open(img_path, "rb") as image_file:
        file_bytes = image_file.read()
        img_str = base64.b64encode(file_bytes).decode('utf-8')
        
    img = Image.open(io.BytesIO(file_bytes))
        
    return {
        "success": True,
        "image": f"data:image/png;base64,{img_str}",
        "session_id": session_id,
        "current_step": current_step,
        "filename": original_filename,
        "width": img.width,
        "height": img.height,
        "size_bytes": len(file_bytes),
        "format": "PNG"
    }

@main.route('/')
def index():
    """Serves the main tool page."""
    return render_template('index.html')

@main.route('/upload', methods=['POST'])
def upload_file():
    """Handles image uploads, processing, state management, and delivery."""
    sessions_dir = Path(current_app.root_path) / '..' / 'temp_sessions'
    sessions_dir.mkdir(exist_ok=True)
    
    session_id = request.form.get('session_id')
    current_step = int(request.form.get('current_step', '0'))
    action = request.form.get('action', 'edit') # 'init', 'edit', 'undo', 'redo', 'download'
    
    # Initialize a new session
    if action == 'init' or not session_id:
        if 'image' not in request.files:
            return jsonify({"error": "No file uploaded."}), 400
        file = request.files['image']
        if not file or file.filename == '':
            return jsonify({"error": "Empty file provided."}), 400
        if not allowed_file(file.filename):
            return jsonify({"error": "Invalid file type."}), 400

        try:
            img = Image.open(file.stream)
            img.verify()
            file.stream.seek(0)
        except Exception:
            return jsonify({"error": "Invalid image file."}), 400

        session_id = str(uuid.uuid4())
        session_path = sessions_dir / session_id
        session_path.mkdir(exist_ok=True)
        
        img = Image.open(file.stream)
        # Convert RGBA to keep transparency, or RGB
        img.save(session_path / '0.png', format='PNG')
        
        orig_name = secure_filename(file.filename)
        with open(session_path / 'filename.txt', 'w') as f:
            f.write(orig_name)
            
        return get_preview_response(session_path, 0, session_id, orig_name)
        
    # Existing session handling
    try:
        uuid.UUID(str(session_id))
    except ValueError:
        return jsonify({"error": "Invalid session ID format."}), 400

    session_path = sessions_dir / session_id
    if not session_path.exists():
        return jsonify({"error": "Session expired or invalid."}), 400
        
    orig_name = "image"
    if (session_path / 'filename.txt').exists():
        with open(session_path / 'filename.txt', 'r') as f:
            orig_name = f.read().strip()
            
    if action == 'undo':
        if current_step > 0:
            current_step -= 1
        return get_preview_response(session_path, current_step, session_id, orig_name)
        
    elif action == 'redo':
        if (session_path / f"{current_step + 1}.png").exists():
            current_step += 1
        return get_preview_response(session_path, current_step, session_id, orig_name)

    elif action == 'reset':
        current_step = 0
        for p in session_path.glob("*.png"):
            if p.stem.isdigit() and int(p.stem) > 0:
                p.unlink()
        return get_preview_response(session_path, current_step, session_id, orig_name)

    elif action == 'preview_only':
        mode = request.form.get('mode', '')
        try:
            img_path = session_path / f"{current_step}.png"
            if not img_path.exists():
                return jsonify({"error": "Current state not found."}), 400
                
            img = Image.open(img_path)
            
            # FAST PREVIEW: Downscale image to max 800x800 to drastically speed up processing and network transfer
            if mode in ['adjust', 'filter', 'watermark']:
                if mode == 'watermark':
                    # For watermark, coordinate math might get tricky if we downscale before processing.
                    # We will downscale AFTER processing for watermark, but BEFORE for adjust/filter.
                    pass
                else:
                    img.thumbnail((800, 800), Image.Resampling.NEAREST)
            
            wm_image_stream = None
            if 'wm_image' in request.files and request.files['wm_image'].filename != '':
                wm_image_stream = request.files['wm_image'].stream
                
            from app.utils import process_image_core
            processed_img = process_image_core(img, mode, request.form, wm_image_stream)

            if not processed_img:
                processed_img = img
                
            # If watermark, we process at full resolution then downscale the result for fast network transfer
            if mode == 'watermark':
                processed_img.thumbnail((800, 800), Image.Resampling.NEAREST)

            buffer = io.BytesIO()
            processed_img.save(buffer, format='JPEG', quality=80) # Use JPEG for even faster network transfer during preview
            img_str = base64.b64encode(buffer.getvalue()).decode('utf-8')
            
            return {
                "success": True,
                "image": f"data:image/jpeg;base64,{img_str}",
                "session_id": session_id,
                "current_step": current_step,
                "filename": orig_name
            }
        except Exception as e:
            current_app.logger.error(f'Error processing image preview: {e}')
            return jsonify({"error": f"An error occurred: {e}"}), 500

    elif action == 'estimate_size':
        try:
            img_path = session_path / f"{current_step}.png"
            if not img_path.exists():
                return jsonify({"error": "Current state not found."}), 400
                
            img = Image.open(img_path)
            
            mode = request.form.get('mode', '')
            if mode == 'resolution':
                from app.utils import process_image_core
                img = process_image_core(img, mode, request.form) or img
            
            save_format = request.form.get('save_format', 'PNG')
            if save_format == 'AUTO':
                save_format = "PNG" if img.mode in ('RGBA', 'P') else "JPEG"
                
            quality = int(request.form.get('quality', 100))
            
            buffer = io.BytesIO()
            if save_format == 'JPEG' and img.mode in ('RGBA', 'LA', 'P'):
                bg = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'RGBA':
                    bg.paste(img, mask=img.split()[3])
                else:
                    bg.paste(img)
                img = bg
            elif save_format in ('PNG', 'WEBP', 'GIF') and img.mode == 'P':
                img = img.convert('RGBA')

            save_params = {'format': save_format}
            if save_format in ('JPEG', 'WEBP'):
                save_params['quality'] = quality
                
            img.save(buffer, **save_params)
            
            return {
                "success": True,
                "width": img.width,
                "height": img.height,
                "size_bytes": len(buffer.getvalue()),
                "format": save_format
            }
        except Exception as e:
            current_app.logger.error(f'Error estimating size: {e}')
            return jsonify({"error": f"An error occurred: {e}"}), 500

    elif action == 'edit':
        mode = request.form.get('mode', '')
        try:
            img_path = session_path / f"{current_step}.png"
            if not img_path.exists():
                return jsonify({"error": "Current state not found."}), 400
                
            img = Image.open(img_path)
            
            wm_image_stream = None
            if 'wm_image' in request.files and request.files['wm_image'].filename != '':
                wm_image_stream = request.files['wm_image'].stream
                
            from app.utils import process_image_core
            processed_img = process_image_core(img, mode, request.form, wm_image_stream)

            if not processed_img:
                current_app.logger.warning(f'Invalid mode requested: {mode}')
                return jsonify({"error": "Invalid mode."}), 400

            # Step forward
            current_step += 1
            
            # Delete any redo steps ahead
            for p in session_path.glob("*.png"):
                if p.stem.isdigit() and int(p.stem) > current_step:
                    p.unlink()

            processed_img.save(session_path / f"{current_step}.png", format='PNG')
            
            return get_preview_response(session_path, current_step, session_id, orig_name)

        except ValueError as ve:
            current_app.logger.error(f'ValueError during processing: {ve}')
            return jsonify({"error": "Invalid input parameters."}), 400
        except Exception as e:
            current_app.logger.error(f'Error processing image: {e}')
            return jsonify({"error": f"An error occurred: {e}"}), 500

    elif action == 'download':
        try:
            img_path = session_path / f"{current_step}.png"
            if not img_path.exists():
                return jsonify({"error": "Current state not found."}), 400
                
            img = Image.open(img_path)
            user_format = request.form.get('save_format', 'AUTO')
            save_format = "PNG" if img.mode in ('RGBA', 'P') else "JPEG"
            
            if user_format != 'AUTO':
                save_format = user_format

            buffer = io.BytesIO()
            if save_format == 'JPEG' and img.mode in ('RGBA', 'LA', 'P'):
                bg = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'RGBA':
                    bg.paste(img, mask=img.split()[3])
                else:
                    bg.paste(img)
                img = bg
            elif save_format in ('PNG', 'WEBP', 'GIF') and img.mode == 'P':
                img = img.convert('RGBA')

            quality = int(request.form.get('quality', 100))
            save_params = {'format': save_format}
            if save_format in ('JPEG', 'WEBP'):
                save_params['quality'] = quality

            img.save(buffer, **save_params)
            buffer.seek(0)
            
            base_filename, _ = os.path.splitext(orig_name)
            return send_file(buffer, mimetype=f"image/{save_format.lower()}", as_attachment=True, download_name=f"{base_filename}_edited.{save_format.lower()}")
            
        except Exception as e:
            current_app.logger.error(f'Error downloading image: {e}')
            return jsonify({"error": f"An error occurred: {e}"}), 500

def process_batch_background(job_id, session_path, mode, form_data, wm_image_path=None):
    try:
        out_zip = session_path / 'result.zip'
        image_files = [f for f in session_path.iterdir() if f.is_file() and f.name != 'wm_logo']
        
        with zipfile.ZipFile(out_zip, 'w') as zipf:
            for i, img_path in enumerate(image_files):
                img = Image.open(img_path)
                wm_stream = open(wm_image_path, 'rb') if wm_image_path else None
                from app.utils import process_image_core
                processed = process_image_core(img, mode, form_data, wm_stream)
                
                buffer = io.BytesIO()
                save_format = form_data.get('save_format', 'PNG')
                if save_format == 'AUTO': save_format = 'PNG'
                
                if processed:
                    processed.save(buffer, format=save_format)
                    zipf.writestr(f"processed_{img_path.name}", buffer.getvalue())
                
                if wm_stream: wm_stream.close()
                batch_jobs[job_id]['done'] = i + 1
                
        batch_jobs[job_id]['status'] = 'completed'
        batch_jobs[job_id]['zip_path'] = str(out_zip)
    except Exception as e:
        batch_jobs[job_id]['status'] = 'error'
        batch_jobs[job_id]['error'] = str(e)

@main.route('/batch')
def batch():
    return render_template('batch.html')

@main.route('/batch/start', methods=['POST'])
def batch_start():
    files = request.files.getlist('images')
    mode = request.form.get('mode')
    
    if not files or not mode:
        return jsonify({"error": "Missing files or mode"}), 400
        
    job_id = str(uuid.uuid4())
    session_path = Path(current_app.root_path) / '..' / 'temp_sessions' / job_id
    session_path.mkdir(exist_ok=True, parents=True)
    
    for f in files:
        if f.filename != '':
            f.save(session_path / secure_filename(f.filename))
            
    wm_image_path = None
    if 'wm_image' in request.files and request.files['wm_image'].filename != '':
        wm_image_path = session_path / 'wm_logo'
        request.files['wm_image'].save(wm_image_path)
        
    batch_jobs[job_id] = {"total": len(files), "done": 0, "status": "processing", "zip_path": None}
    
    form_data = dict(request.form)
    executor.submit(process_batch_background, job_id, session_path, mode, form_data, wm_image_path)
    
    return jsonify({"job_id": job_id})

@main.route('/batch/status/<job_id>')
def batch_status(job_id):
    if job_id not in batch_jobs:
        return jsonify({"error": "Invalid job id"}), 404
    return jsonify(batch_jobs[job_id])

@main.route('/batch/download/<job_id>')
def batch_download(job_id):
    if job_id not in batch_jobs or batch_jobs[job_id]['status'] != 'completed':
        return "Not ready", 400
    return send_file(batch_jobs[job_id]['zip_path'], as_attachment=True, download_name="batch_processed.zip")
