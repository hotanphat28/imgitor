import io
import os

from flask import Blueprint, current_app, jsonify, render_template, request, send_file
from PIL import Image
from werkzeug.utils import secure_filename

main = Blueprint("main", __name__)


def allowed_file(filename):
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower()
        in current_app.config["ALLOWED_EXTENSIONS"]
    )


@main.route("/")
def index():
    """Serves the main tool page."""
    return render_template("index.html")


@main.route("/download", methods=["POST"])
def download_image():
    """Stateless endpoint to process and download an image."""
    if "image" not in request.files:
        return jsonify({"error": "No file uploaded."}), 400
    file = request.files["image"]
    if not file or file.filename == "":
        return jsonify({"error": "Empty file provided."}), 400
    if not allowed_file(file.filename):
        return jsonify({"error": "Invalid file type."}), 400

    try:
        img = Image.open(file.stream)
        img.verify()
        file.stream.seek(0)
        img = Image.open(file.stream)
    except Exception:
        return jsonify({"error": "Invalid image file."}), 400

    orig_name = secure_filename(file.filename)

    try:
        from app.utils import process_image_pipeline

        img = process_image_pipeline(img, request.form)

        user_format = request.form.get("save_format", "AUTO").upper()
        save_format = "PNG" if img.mode in ("RGBA", "P") else "JPEG"

        if user_format != "AUTO":
            save_format = user_format

        buffer = io.BytesIO()
        if save_format == "JPEG" and img.mode in ("RGBA", "LA", "P"):
            bg = Image.new("RGB", img.size, (255, 255, 255))
            if img.mode == "RGBA":
                bg.paste(img, mask=img.split()[3])
            else:
                bg.paste(img)
            img = bg
        elif save_format in ("PNG", "WEBP", "GIF") and img.mode == "P":
            img = img.convert("RGBA")

        quality = int(request.form.get("quality", 100))
        save_params = {"format": save_format}
        if save_format in ("JPEG", "WEBP"):
            save_params["quality"] = quality

        img.save(buffer, **save_params)
        buffer.seek(0)

        base_filename, _ = os.path.splitext(orig_name)
        return send_file(
            buffer,
            mimetype=f"image/{save_format.lower()}",
            as_attachment=True,
            download_name=f"{base_filename}_retro.{save_format.lower()}",
        )

    except Exception as e:
        current_app.logger.error(f"Error downloading image: {e}")
        return jsonify({"error": f"An error occurred: {e}"}), 500
