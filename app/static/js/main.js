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

	document.getElementById('resolution-inputs').style.display = (newMode === 'resolution') ? 'block' : 'none';
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
