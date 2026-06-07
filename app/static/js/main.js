let cropper = null;

function toggleInputs() {
	const mode = document.querySelector('input[name="mode"]:checked').value;
	document.getElementById('resolution-inputs').style.display = (mode === 'resolution') ? 'block' : 'none';
	document.getElementById('filter-inputs').style.display = (mode === 'filter') ? 'block' : 'none';
	document.getElementById('crop-inputs').style.display = (mode === 'crop') ? 'block' : 'none';
	document.getElementById('rotate-inputs').style.display = (mode === 'rotate') ? 'block' : 'none';
	document.getElementById('adjust-inputs').style.display = (mode === 'adjust') ? 'block' : 'none';
	document.getElementById('watermark-inputs').style.display = (mode === 'watermark') ? 'block' : 'none';

    if (mode === 'crop') {
        initCropper();
    } else {
        destroyCropper();
    }
}

function initCropper() {
    const liveImg = document.getElementById('preview-live');
    if (!cropper && liveImg.src) {
        cropper = new Cropper(liveImg, {
            viewMode: 1,
            aspectRatio: NaN,
            autoCropArea: 0.8
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
            document.getElementById('step-2-edit').style.display = 'block';
            document.getElementById('download-btn').style.display = 'inline-flex';
            
            updateUndoRedoButtons();
            
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

function downloadImage() {
    document.getElementById('form_action').value = 'download';
    document.getElementById('main-form').submit(); 
}

function startOver() {
	document.getElementById('main-form').reset();
    destroyCropper();

	document.getElementById('preview-live').src = '';

	document.getElementById('step-2-edit').style.display = 'none';
	document.getElementById('step-1-upload').style.display = 'block';
	document.getElementById('download-btn').style.display = 'none';
    
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
