let cropper = null;
let originalImage = null;
let currentImage = null; // Image after crop but before retro effects
let isProcessing = false;

// UI Elements
const uploadZone = document.getElementById('upload-zone');
const previewZone = document.getElementById('preview-zone');
const imageUpload = document.getElementById('image-upload');
const sourceImage = document.getElementById('source-image');
const liveCanvas = document.getElementById('live-canvas');
const ctx = liveCanvas.getContext('2d', { willReadFrequently: true });
const controlModules = document.getElementById('control-modules');
const btnDownload = document.getElementById('btn-download');
const btnReset = document.getElementById('btn-reset');
const loaderOverlay = document.getElementById('loader-overlay');

// Crop Tools
const btnToolCrop = document.getElementById('btn-tool-crop');
const cropToolbar = document.getElementById('crop-toolbar');
const btnCropCancel = document.getElementById('btn-crop-cancel');
const btnCropApply = document.getElementById('btn-crop-apply');

// BG Tools
const btnToolBg = document.getElementById('btn-tool-bg');

// Retro Tools
const retroRadios = document.getElementsByName('retro_mode');
const halftoneControls = document.getElementById('halftone-controls');
const ditherControls = document.getElementById('dither-controls');
const htSize = document.getElementById('halftone_size');
const htAngle = document.getElementById('halftone_angle');
const htShapes = document.getElementsByName('halftone_shape');
const ditherMethods = document.getElementsByName('dither_method');

// Hidden Form
const hiddenImageInput = document.getElementById('hidden-image-input');
const downloadForm = document.getElementById('download-form');

// --- Initialization & Upload ---

uploadZone.addEventListener('click', () => imageUpload.click());
uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.classList.add('drag-active'); });
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-active'));
uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('drag-active');
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
});
imageUpload.addEventListener('change', (e) => {
    if (e.target.files.length) handleFile(e.target.files[0]);
});

function handleFile(file) {
    if (!file.type.startsWith('image/')) return;
    
    // Assign to hidden input for download later using DataTransfer
    const dt = new DataTransfer();
    dt.items.add(file);
    hiddenImageInput.files = dt.files;

    const reader = new FileReader();
    reader.onload = (e) => {
        originalImage = new Image();
        originalImage.onload = () => {
            currentImage = originalImage;
            uploadZone.style.display = 'none';
            previewZone.style.display = 'flex';
            controlModules.style.opacity = '1';
            controlModules.style.pointerEvents = 'auto';
            btnDownload.disabled = false;
            renderCanvas();
        };
        originalImage.src = e.target.result;
        sourceImage.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

btnReset.addEventListener('click', () => {
    if (cropper) cropper.destroy();
    cropper = null;
    currentImage = originalImage;
    sourceImage.src = originalImage.src;
    document.querySelector('input[name="retro_mode"][value="none"]').checked = true;
    updateRetroVisibility();
    renderCanvas();
    
    // Reset hidden form params
    document.getElementById('hidden-crop-w').value = '';
    document.getElementById('hidden-remove-bg').value = '';
});

// --- Crop Mode ---

btnToolCrop.addEventListener('click', () => {
    liveCanvas.style.display = 'none';
    sourceImage.style.display = 'block';
    cropToolbar.style.display = 'flex';
    controlModules.style.pointerEvents = 'none';
    controlModules.style.opacity = '0.5';
    btnDownload.disabled = true;

    cropper = new Cropper(sourceImage, {
        viewMode: 1,
        dragMode: 'crop',
        autoCropArea: 1,
        restore: false,
        guides: true,
        center: true,
        highlight: false,
        cropBoxMovable: true,
        cropBoxResizable: true,
        toggleDragModeOnDblclick: false,
    });
});

btnCropCancel.addEventListener('click', () => {
    if (cropper) { cropper.destroy(); cropper = null; }
    exitCropMode();
});

btnCropApply.addEventListener('click', () => {
    if (!cropper) return;
    const cropData = cropper.getData();
    
    // Save to hidden form for backend final render
    document.getElementById('hidden-crop-x').value = cropData.x;
    document.getElementById('hidden-crop-y').value = cropData.y;
    document.getElementById('hidden-crop-w').value = cropData.width;
    document.getElementById('hidden-crop-h').value = cropData.height;
    document.getElementById('hidden-crop-rotate').value = cropData.rotate;

    // Apply to currentImage for frontend preview
    const canvas = cropper.getCroppedCanvas();
    const newImg = new Image();
    newImg.onload = () => {
        currentImage = newImg;
        cropper.destroy();
        cropper = null;
        sourceImage.src = newImg.src; // Update base for future crops
        exitCropMode();
        renderCanvas();
    };
    newImg.src = canvas.toDataURL();
});

function exitCropMode() {
    liveCanvas.style.display = 'block';
    sourceImage.style.display = 'none';
    cropToolbar.style.display = 'none';
    controlModules.style.pointerEvents = 'auto';
    controlModules.style.opacity = '1';
    btnDownload.disabled = false;
}

// --- AI Background Removal (Backend Call) ---

btnToolBg.addEventListener('click', () => {
    // Note: To truly preview AI BG removal, we must call the backend.
    // For a throwaway prototype, we'll just set the flag for the final download, 
    // OR we can make an ajax call here. Let's make an ajax call to get the preview.
    loaderOverlay.style.display = 'flex';
    
    const formData = new FormData();
    formData.append('image', hiddenImageInput.files[0]);
    formData.append('mode', 'remove_bg');
    // If already cropped, we should ideally send crop params, but for simplicity we rely on the final download for perfect stack.
    // Here we'll just remove BG from the original.
    
    fetch('/api/v1/process', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer test' }, // Will fail if API requires key, we should fallback to regular form post if we had a dedicated preview endpoint.
    }).then(() => {
        // Since we removed session-based preview, we just mark it for download
        document.getElementById('hidden-remove-bg').value = 'true';
        btnToolBg.innerText = "BG REMOVAL PENDING FOR DOWNLOAD";
        btnToolBg.disabled = true;
        loaderOverlay.style.display = 'none';
    }).catch(e => {
        document.getElementById('hidden-remove-bg').value = 'true';
        btnToolBg.innerText = "BG REMOVAL PENDING ON DOWNLOAD";
        btnToolBg.style.background = 'var(--accent)';
        loaderOverlay.style.display = 'none';
    });
});

// --- Retro Controls & Canvas Rendering ---

function updateRetroVisibility() {
    const mode = document.querySelector('input[name="retro_mode"]:checked').value;
    halftoneControls.style.display = mode === 'halftone' ? 'flex' : 'none';
    ditherControls.style.display = mode === 'dither' ? 'flex' : 'none';
    renderCanvas();
}

retroRadios.forEach(r => r.addEventListener('change', updateRetroVisibility));
htSize.addEventListener('input', (e) => { document.getElementById('val-ht-size').innerText = e.target.value; renderCanvas(); });
htAngle.addEventListener('input', (e) => { document.getElementById('val-ht-angle').innerText = e.target.value + '°'; renderCanvas(); });
htShapes.forEach(s => s.addEventListener('change', renderCanvas));
ditherMethods.forEach(m => m.addEventListener('change', renderCanvas));

// The Core Canvas Renderer
function renderCanvas() {
    if (!currentImage) return;

    // Scale canvas for display performance (max 800px)
    const MAX_DIM = 800;
    let w = currentImage.width;
    let h = currentImage.height;
    if (w > MAX_DIM || h > MAX_DIM) {
        const ratio = Math.min(MAX_DIM / w, MAX_DIM / h);
        w = Math.floor(w * ratio);
        h = Math.floor(h * ratio);
    }
    liveCanvas.width = w;
    liveCanvas.height = h;

    // Draw base
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(currentImage, 0, 0, w, h);

    const mode = document.querySelector('input[name="retro_mode"]:checked').value;
    
    if (mode === 'none') {
        updateHiddenForm('none');
        return;
    }

    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    // Convert to Grayscale first
    for (let i = 0; i < data.length; i += 4) {
        const avg = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
        data[i] = data[i+1] = data[i+2] = avg;
    }

    if (mode === 'dither') {
        const method = document.querySelector('input[name="dither_method"]:checked').value;
        updateHiddenForm('dither', { method });
        applyDitherCanvas(imgData, w, h); // Simplified threshold for frontend preview
        ctx.putImageData(imgData, 0, 0);
    } 
    else if (mode === 'halftone') {
        const size = parseInt(htSize.value);
        const angle = parseInt(htAngle.value);
        const shape = document.querySelector('input[name="halftone_shape"]:checked').value;
        updateHiddenForm('halftone', { size, angle, shape });
        
        ctx.putImageData(imgData, 0, 0); // Put grayscale back
        applyHalftoneCanvas(w, h, size, shape);
    }
}

function applyDitherCanvas(imgData, w, h) {
    const data = imgData.data;
    // Floyd-Steinberg approximation for instant preview
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const idx = (y * w + x) * 4;
            const oldVal = data[idx];
            const newVal = oldVal < 128 ? 0 : 255;
            data[idx] = data[idx+1] = data[idx+2] = newVal;
            
            const err = oldVal - newVal;
            if (x + 1 < w) data[idx + 4] += err * 7/16;
            if (y + 1 < h) {
                if (x - 1 >= 0) data[idx + w*4 - 4] += err * 3/16;
                data[idx + w*4] += err * 5/16;
                if (x + 1 < w) data[idx + w*4 + 4] += err * 1/16;
            }
        }
    }
}

function applyHalftoneCanvas(w, h, size, shape) {
    const data = ctx.getImageData(0, 0, w, h).data;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'black';

    for (let y = 0; y < h; y += size) {
        for (let x = 0; x < w; x += size) {
            let sum = 0, count = 0;
            for (let dy = 0; dy < size && y+dy < h; dy++) {
                for (let dx = 0; dx < size && x+dx < w; dx++) {
                    sum += data[((y+dy)*w + (x+dx))*4];
                    count++;
                }
            }
            const avg = sum / count;
            const sizeFactor = (255 - avg) / 255.0;
            
            if (sizeFactor > 0) {
                const cx = x + size/2;
                const cy = y + size/2;
                if (shape === 'line') {
                    const t = sizeFactor * size;
                    ctx.fillRect(cx - t/2, y, t, size);
                } else if (shape === 'square') {
                    const r = sizeFactor * (size / 1.414);
                    ctx.fillRect(cx - r, cy - r, r*2, r*2);
                } else {
                    const r = sizeFactor * (size / 2);
                    ctx.beginPath();
                    ctx.arc(cx, cy, r, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    }
}

function updateHiddenForm(mode, params = {}) {
    document.getElementById('hidden-halftone-shape').value = 'none';
    document.getElementById('hidden-dither-method').value = 'none';

    if (mode === 'halftone') {
        document.getElementById('hidden-halftone-shape').value = params.shape;
        document.getElementById('hidden-halftone-size').value = params.size;
        document.getElementById('hidden-halftone-angle').value = params.angle;
    } else if (mode === 'dither') {
        document.getElementById('hidden-dither-method').value = params.method;
    }
}

btnDownload.addEventListener('click', () => {
    if (!originalImage) return;
    loaderOverlay.style.display = 'flex';
    document.getElementById('loader-text').innerText = 'RENDERING HIGH RES...';
    downloadForm.submit();
    
    // Hide overlay after a bit since form.submit() navigates
    setTimeout(() => { loaderOverlay.style.display = 'none'; }, 2000);
});
