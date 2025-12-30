# Image Processing Web Tool (Imgitor)

A browser-based image processing tool created with Flask. It allows you to:
- Resize images by resolution (Height x Width).
- Resize images by checking the target file size (KB).
- Convert images to Black & White (Grayscale).
- Remove background from images.

## 🌟 Features

- **Web Interface**: Simple and responsive UI using HTML5 & CSS (Space Grotesk & Space Mono fonts).
- **Image Upload**: Supports common formats (JPG, PNG, WebP, etc.).
- **Processing Modes**:
    1. **By Resolution**: Resize using Lanczos resampling.
    2. **By File Size**: Compress JPEG images to meet a target size in KB.
    3. **Black & White**: Convert images to grayscale.
    4. **Remove Background**: AI-powered background removal.
- **Modular Design**: Refactored into a scalable Flask application structure.

## 🛠️ Prerequisites

- **Python 3.12+** (Recommended due to dependency compatibility)
- **Flask**
- **Pillow** (PIL Fork)
- **rembg**
- **onnxruntime**

## 🚀 Installation

1. Clone the repository and navigate to the project directory:
   ```bash
   git clone https://github.com/hotanphat28/imgitor.git
   cd imgitor
   ```

2. Create and activate a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## ▶️ Usage

1. Run the Flask application using the entry point:
   ```bash
   python run.py
   ```
2. Open your browser and go to `http://127.0.0.1:5000`.
3. Upload an image, select a mode, enter required parameters, and click **Process & Download**.

## 📂 Project Structure

```
imgitor/
├── run.py                 # Entry point
├── app/
│   ├── __init__.py        # App initialization
│   ├── routes.py          # Route definitions
│   ├── utils.py           # Image processing logic
│   ├── templates/         # HTML templates
│   │   └── index.html
│   └── static/            # Static assets
│       ├── css/
│       │   └── style.css
│       └── js/
│           └── main.js
└── README.md
```
