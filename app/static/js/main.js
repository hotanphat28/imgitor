let cropper = null;

let currentMode = 'resolution';
let cropModified = false;

function toggleInputs() {
    const modeEl = document.querySelector('input[name="mode"]:checked');
    if (!modeEl) return;
    const newMode = modeEl.value;

    if (currentMode === 'crop' && newMode !== 'crop' && cropper && cropModified) {
        commitCropThenSwitch(newMode);
    } else {
        executeModeSwitch(newMode);
    }
}

function commitCropThenSwitch(newMode) {
    const cropData = cropper.getData(true);
    const form = document.getElementById('main-form');
    const formData = new FormData(form);
    
    formData.set('action', 'edit');
    formData.set('mode', 'crop');
    formData.set('crop_x', cropData.x);
    formData.set('crop_y', cropData.y);
    formData.set('crop_w', cropData.width);
    formData.set('crop_h', cropData.height);
    
    document.getElementById('loader-overlay').style.display = 'flex';
    
    return fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('loader-overlay').style.display = 'none';
        if (data.success) {
            document.getElementById('current_step').value = data.current_step;
            document.getElementById('preview-live').src = data.image;
            updateUndoRedoButtons();
            
            cropModified = false;
            executeModeSwitch(newMode);
        }
    })
    .catch(error => {
        console.error(error);
        document.getElementById('loader-overlay').style.display = 'none';
    });
}

function executeModeSwitch(newMode) {
    currentMode = newMode;
    document.querySelector(`input[name="mode"][value="${newMode}"]`).checked = true;

	document.getElementById('filter-inputs').style.display = (newMode === 'filter') ? 'block' : 'none';
	document.getElementById('crop-inputs').style.display = (newMode === 'crop') ? 'block' : 'none';
	document.getElementById('rotate-inputs').style.display = (newMode === 'rotate') ? 'block' : 'none';
	document.getElementById('adjust-inputs').style.display = (newMode === 'adjust') ? 'block' : 'none';
	document.getElementById('watermark-inputs').style.display = (newMode === 'watermark') ? 'block' : 'none';

    if (newMode === 'remove_bg') {
        applyEdit();
    }

    if (newMode === 'crop') {
        initCropper();
    } else {
        destroyCropper();
    }

    if (['filter', 'remove_bg'].includes(newMode)) {
        livePreview(); // Trigger live preview immediately for these tools
    }
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

const livePreview = debounce(function() {
    const actionEl = document.getElementById('form_action');
    if (!actionEl) return;
    const actionVal = actionEl.value;
    if (actionVal === 'init' || actionVal === 'download') return;

    const modeEl = document.querySelector('input[name="mode"]:checked');
    if (!modeEl) return;
    const mode = modeEl.value;

    if (mode === 'crop') return; // CropperJS handles its own visual preview

    const form = document.getElementById('main-form');
    if(!form) return;

    const formData = new FormData(form);
    formData.set('action', 'preview_only');

    // Show a mini loader or just let it update smoothly
    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const previewLive = document.getElementById('preview-live');
            if (previewLive) {
                previewLive.src = data.image;
            }
        }
    })
    .catch(error => console.error('Preview error:', error));
}, 50);

function initCropper() {
    const liveImg = document.getElementById('preview-live');
    if (!cropper && liveImg.src) {
        cropper = new Cropper(liveImg, {
            viewMode: 1,
            aspectRatio: NaN,
            autoCropArea: 0.8,
            cropend: function() {
                cropModified = true;
            }
        });
    }
}

function destroyCropper() {
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
}

function setCropAspectRatio(ratio) {
    if (cropper) {
        cropper.setAspectRatio(parseFloat(ratio));
        cropModified = true;
    }
}

function handleFileUpload(input) {
	const file = input.files[0];
	if (file) {
        document.getElementById('form_action').value = 'init';
        submitForm();
	}
}

function submitForm() {
    const form = document.getElementById('main-form');
    const formData = new FormData(form);
    const action = document.getElementById('form_action').value;
    const mode = document.querySelector('input[name="mode"]:checked').value;

    if (action === 'edit' && mode === 'crop' && cropper) {
        const data = cropper.getData(true);
        formData.set('crop_x', data.x);
        formData.set('crop_y', data.y);
        formData.set('crop_w', data.width);
        formData.set('crop_h', data.height);
    }
    
    formData.set('preview', 'true');

    const loaderOverlay = document.getElementById('loader-overlay');
	if (loaderOverlay) loaderOverlay.style.display = 'flex';

    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('session_id').value = data.session_id;
            document.getElementById('current_step').value = data.current_step;
            
            document.getElementById('preview-live').src = data.image;

            window.currentImageMeta = {
                width: data.width,
                height: data.height,
                size_bytes: data.size_bytes,
                format: data.format
            };
            
            // Switch steps if just uploaded
            document.getElementById('step-1-upload').style.display = 'none';
            document.getElementById('step-2-edit').style.display = 'flex';
            document.getElementById('settings-sidebar').style.display = 'flex';
            document.getElementById('toolbar-icons').style.display = 'flex';
            document.getElementById('download-btn').style.display = 'inline-flex';
            
            const navLinks = document.querySelector('.nav-links');
            if (navLinks) navLinks.style.display = 'none'; // Hide Single/Batch options

            updateUndoRedoButtons();
            
            if (action === 'init' || action === 'undo' || action === 'redo') {
                document.getElementById('form_action').value = 'edit';
            }

            if (action === 'init') {
                window.originalImageSrc = data.image;
                // Initialize the default tool (e.g., crop) now that the image is visible
                toggleInputs();
            }
            
            if (cropper) {
                cropper.replace(data.image);
            }
        } else {
            alert('Error processing image');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred');
    })
    .finally(() => {
        if (loaderOverlay) loaderOverlay.style.display = 'none';
    });
}

function applyEdit() {
    document.getElementById('form_action').value = 'edit';
    submitForm();
}

function undoStep() {
    document.getElementById('form_action').value = 'undo';
    submitForm();
}

function redoStep() {
    document.getElementById('form_action').value = 'redo';
    submitForm();
}

function updateUndoRedoButtons() {
    const step = parseInt(document.getElementById('current_step').value);
    document.getElementById('undo-btn').disabled = (step <= 0);
    document.getElementById('redo-btn').disabled = false; 
}

function resetAll() {
    document.getElementById('form_action').value = 'reset';
    submitForm();
}

function downloadImage() {
    if (currentMode === 'crop' && cropper && cropModified) {
        commitCropThenSwitch(currentMode).then(() => {
            document.getElementById('form_action').value = 'download';
            document.getElementById('main-form').submit(); 
        });
        return;
    }
    
    document.getElementById('form_action').value = 'download';
    document.getElementById('main-form').submit(); 
}

function startOver() {
	document.getElementById('main-form').reset();
    destroyCropper();

	document.getElementById('preview-live').src = '';

	document.getElementById('step-2-edit').style.display = 'none';
	document.getElementById('step-1-upload').style.display = 'flex';
	document.getElementById('download-btn').style.display = 'none';
    document.getElementById('settings-sidebar').style.display = 'none';
    document.getElementById('toolbar-icons').style.display = 'none';
    
    const navLinks = document.querySelector('.nav-links');
    if (navLinks) navLinks.style.display = 'flex';
    
    document.getElementById('session_id').value = '';
    document.getElementById('current_step').value = '0';

	toggleInputs();
}

document.addEventListener('DOMContentLoaded', () => {
	const uploadArea = document.querySelector('.upload-area');
	const fileInput = document.getElementById('image');

	if (uploadArea && fileInput) {
		['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
			uploadArea.addEventListener(eventName, preventDefaults, false);
		});

		function preventDefaults(e) {
			e.preventDefault();
			e.stopPropagation();
		}

		['dragenter', 'dragover'].forEach(eventName => {
			uploadArea.addEventListener(eventName, () => uploadArea.classList.add('drag-active'), false);
		});

		['dragleave', 'drop'].forEach(eventName => {
			uploadArea.addEventListener(eventName, () => uploadArea.classList.remove('drag-active'), false);
		});

		uploadArea.addEventListener('drop', handleDrop, false);

		function handleDrop(e) {
			const dt = e.dataTransfer;
			const files = dt.files;
			
			if (files && files.length > 0) {
				fileInput.files = files;
				handleFileUpload(fileInput);
			}
		}
	}

    // Initialize dark mode from localStorage
    const isDark = localStorage.getItem('darkMode') === 'true';
    document.getElementById('theme-checkbox').checked = isDark;
    if (isDark) document.body.classList.add('dark-mode');

    // Click and Hold original image preview
    const liveImg = document.getElementById('preview-live');
    if (liveImg) {
        liveImg.addEventListener('mousedown', () => {
            if (window.originalImageSrc && liveImg.src !== window.originalImageSrc) {
                liveImg.dataset.currentSrc = liveImg.src;
                liveImg.src = window.originalImageSrc;
            }
        });
        
        const restoreImage = () => {
            if (liveImg.dataset.currentSrc && liveImg.src === window.originalImageSrc) {
                liveImg.src = liveImg.dataset.currentSrc;
            }
        };
        
        liveImg.addEventListener('mouseup', restoreImage);
        liveImg.addEventListener('mouseleave', restoreImage);
    }
});

function toggleTheme(isDark) {
    if (isDark) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'true');
    } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('darkMode', 'false');
    }
}

// ==========================================
// Resize Modal Logic
// ==========================================
let aspectLocked = true;
let originalAspectRatio = 1;

function formatBytes(bytes) {
    if(bytes == null || isNaN(bytes)) return '0 B';
    if(bytes < 1024) return bytes + ' B';
    else if(bytes < 1048576) return (bytes / 1024).toFixed(0) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
}

function openResizeModal() {
    document.getElementById('resize-modal').style.display = 'flex';
    
    // Initialize with current meta
    const meta = window.currentImageMeta || { width: 100, height: 100, size_bytes: 0, format: 'PNG' };
    
    document.getElementById('resize_width').value = meta.width;
    document.getElementById('resize_height').value = meta.height;
    document.getElementById('resize_percentage').value = 100;
    
    originalAspectRatio = meta.width / meta.height;
    
    // Reset toggle to pixels
    document.querySelector('input[name="resize_type"][value="pixels"]').checked = true;
    toggleResizeType();
    
    // Reset quality/format
    document.getElementById('resize_quality').value = 100;
    handleQualityInput();
    document.getElementById('resize_save_format').value = 'AUTO';
    
    // Populate current info
    const currentStr = `${meta.width} x ${meta.height} pixels &nbsp;&nbsp;&nbsp; ${formatBytes(meta.size_bytes)} &nbsp;&nbsp;&nbsp; ${meta.format}`;
    document.getElementById('current-info-val').innerHTML = currentStr;
    document.getElementById('new-info-val').innerHTML = currentStr; // Init new same as current
}

function closeResizeModal() {
    document.getElementById('resize-modal').style.display = 'none';
}

function toggleResizeType() {
    const type = document.querySelector('input[name="resize_type"]:checked').value;
    document.getElementById('resize-pixels-inputs').style.display = (type === 'pixels') ? 'flex' : 'none';
    document.getElementById('resize-percentage-inputs').style.display = (type === 'percentage') ? 'flex' : 'none';
    triggerEstimation();
}

function toggleAspectLock() {
    aspectLocked = !aspectLocked;
    const btn = document.getElementById('aspect-lock-btn');
    if (aspectLocked) {
        btn.classList.add('locked');
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" id="lock-icon-svg"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>';
        
        // immediately correct height to match width
        const w = parseInt(document.getElementById('resize_width').value) || 1;
        document.getElementById('resize_height').value = Math.max(1, Math.round(w / originalAspectRatio));
        triggerEstimation();
    } else {
        btn.classList.remove('locked');
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 7h3a5 5 0 0 1 5 5 5 5 0 0 1-5 5h-3m-6 0H6a5 5 0 0 1-5-5 5 5 0 0 1 5-5h3"></path><line x1="8" y1="12" x2="16" y2="12"></line></svg>'; // Unlocked link icon
    }
}

function handleResizeInput(source) {
    if (source === 'width' && aspectLocked) {
        const w = parseInt(document.getElementById('resize_width').value) || 1;
        document.getElementById('resize_height').value = Math.max(1, Math.round(w / originalAspectRatio));
    } else if (source === 'height' && aspectLocked) {
        const h = parseInt(document.getElementById('resize_height').value) || 1;
        document.getElementById('resize_width').value = Math.max(1, Math.round(h * originalAspectRatio));
    }
    triggerEstimation();
}

function handleQualityInput() {
    const q = document.getElementById('resize_quality').value;
    document.getElementById('resize-quality-val').innerText = q;
    let lbl = '';
    if(q >= 90) lbl = '(High)';
    else if(q >= 60) lbl = '(Medium)';
    else lbl = '(Low)';
    document.getElementById('resize-quality-lbl').innerText = lbl;
}

const triggerEstimation = debounce(function() {
    const form = document.getElementById('main-form');
    if(!form) return;
    
    // We send a lightweight fetch to get new dimensions and size
    const formData = new FormData(form);
    formData.set('action', 'estimate_size');
    formData.set('mode', 'resolution');
    
    // Pass modal values directly since they might not be fully synced with form if we changed names
    const type = document.querySelector('input[name="resize_type"]:checked').value;
    formData.set('resize_type', type);
    if(type === 'percentage') {
        formData.set('percentage', document.getElementById('resize_percentage').value);
    } else {
        formData.set('width', document.getElementById('resize_width').value);
        formData.set('height', document.getElementById('resize_height').value);
    }
    
    formData.set('quality', document.getElementById('resize_quality').value);
    formData.set('save_format', document.getElementById('resize_save_format').value);
    
    document.getElementById('new-info-val').innerHTML = 'Calculating...';

    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            const newStr = `${data.width} x ${data.height} pixels &nbsp;&nbsp;&nbsp; ${formatBytes(data.size_bytes)} &nbsp;&nbsp;&nbsp; ${data.format}`;
            document.getElementById('new-info-val').innerHTML = newStr;
        } else {
            document.getElementById('new-info-val').innerHTML = 'Error';
        }
    })
    .catch(err => {
        document.getElementById('new-info-val').innerHTML = 'Error';
    });
}, 300);

function saveResize() {
    // Before saving, ensure the form has the right values
    const form = document.getElementById('main-form');
    
    // We need a hidden input for mode=resolution so that submitForm applies it
    form.querySelectorAll('input[name="mode"]').forEach(r => r.checked = false);
    let modeInput = form.querySelector('input[name="mode"][value="resolution"]');
    if (modeInput) modeInput.checked = true; // Make sure resolution is the active mode when submitting
    
    // Also, sync the modal format to the main sidebar save format so when they download it uses it
    document.getElementById('save_format').value = document.getElementById('resize_save_format').value;
    
    applyEdit();
    closeResizeModal();
    
    // Restore the crop tool selection after a delay
    setTimeout(() => {
        const cropRadio = document.getElementById('crop');
        if (cropRadio) {
            cropRadio.checked = true;
            executeModeSwitch('crop');
        }
    }, 100);
}

function downloadFromResize() {
    const form = document.getElementById('main-form');
    
    form.querySelectorAll('input[name="mode"]').forEach(r => r.checked = false);
    let modeInput = form.querySelector('input[name="mode"][value="resolution"]');
    if (modeInput) modeInput.checked = true; 
    
    document.getElementById('save_format').value = document.getElementById('resize_save_format').value;
    
    // Set action to edit to commit the resize first
    document.getElementById('form_action').value = 'edit';
    const formData = new FormData(form);
    
    const loaderOverlay = document.getElementById('loader-overlay');
    if (loaderOverlay) loaderOverlay.style.display = 'flex';
    
    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            document.getElementById('current_step').value = data.current_step;
            document.getElementById('preview-live').src = data.image;
            closeResizeModal();
            
            // Now that the resize is applied, trigger the download
            setTimeout(() => {
                downloadImage();
                if (loaderOverlay) loaderOverlay.style.display = 'none';
            }, 100);
            
            // Restore crop mode
            setTimeout(() => {
                const cropRadio = document.getElementById('crop');
                if (cropRadio) {
                    cropRadio.checked = true;
                    executeModeSwitch('crop');
                }
            }, 200);
        } else {
            alert('Error applying resize before download');
            if (loaderOverlay) loaderOverlay.style.display = 'none';
        }
    })
    .catch(err => {
        console.error(err);
        if (loaderOverlay) loaderOverlay.style.display = 'none';
    });
}
