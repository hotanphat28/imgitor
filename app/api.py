import io
import traceback
import secrets
from functools import wraps

from flask import Blueprint, current_app, jsonify, request, send_file
from PIL import Image

from app.utils import process_image_core

api_bp = Blueprint("api", __name__, url_prefix="/api/v1")


def require_api_key(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        # Allow default or from .env
        api_key = current_app.config.get("API_KEY", "imgitor-secret-key-123")
        provided_key = request.headers.get("Authorization")
        if not provided_key or not secrets.compare_digest(provided_key.replace("Bearer ", ""), api_key):
            return jsonify({"error": "Unauthorized. Provide valid Bearer token."}), 401
        return f(*args, **kwargs)

    return decorated


@api_bp.route("/process", methods=["POST"])
@require_api_key
def process_image():
    if "image" not in request.files:
        return jsonify({"error": "No image provided in 'image' field"}), 400

    file = request.files["image"]
    if not file or file.filename == "":
        return jsonify({"error": "Empty file provided"}), 400

    mode = request.form.get("mode")
    if not mode:
        return jsonify({"error": "No 'mode' provided"}), 400

    wm_image_stream = None
    if "wm_image" in request.files and request.files["wm_image"].filename != "":
        wm_image_stream = request.files["wm_image"].stream

    try:
        img = Image.open(file.stream)

        processed_img = process_image_core(img, mode, request.form, wm_image_stream)

        if not processed_img:
            return jsonify({"error": f"Invalid mode requested: {mode}"}), 400

        save_format = request.form.get("save_format", "PNG").upper()
        if save_format == "AUTO":
            save_format = "PNG" if img.mode in ("RGBA", "P") else "JPEG"

        buffer = io.BytesIO()
        if save_format == "JPEG" and processed_img.mode in ("RGBA", "LA", "P"):
            bg = Image.new("RGB", processed_img.size, (255, 255, 255))
            if processed_img.mode == "RGBA":
                bg.paste(processed_img, mask=processed_img.split()[3])
            else:
                bg.paste(processed_img)
            processed_img = bg
        elif save_format in ("PNG", "WEBP", "GIF") and processed_img.mode == "P":
            processed_img = processed_img.convert("RGBA")

        processed_img.save(buffer, format=save_format)
        buffer.seek(0)

        return send_file(
            buffer,
            mimetype=f"image/{save_format.lower()}",
            as_attachment=True,
            download_name=f"api_processed.{save_format.lower()}",
        )

    except Exception as e:
        current_app.logger.error(f"API Error: {traceback.format_exc()}")
        return jsonify({"error": str(e)}), 500
