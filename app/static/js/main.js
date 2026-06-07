function toggleInputs() {
	const mode = document.querySelector('input[name="mode"]:checked').value;
	document.getElementById('resolution-inputs').style.display = (mode === 'resolution') ? 'block' : 'none';
	document.getElementById('filter-inputs').style.display = (mode === 'filter') ? 'block' : 'none';
	document.getElementById('crop-inputs').style.display = (mode === 'crop') ? 'block' : 'none';
	document.getElementById('rotate-inputs').style.display = (mode === 'rotate') ? 'block' : 'none';
}

function handleFileUpload(input) {
	const file = input.files[0];
	if (file) {
		const reader = new FileReader();
		reader.onload = function (e) {
			document.getElementById('preview-before').src = e.target.result;
			document.getElementById('preview-after').src = e.target.result;
			// Switch steps
			document.getElementById('step-1-upload').style.display = 'none';
			document.getElementById('step-2-edit').style.display = 'block';
		}
		reader.readAsDataURL(file);
	}
}

function startOver() {
	// Reset form
	document.querySelector('form').reset();

	// Reset previews
	document.getElementById('preview-before').src = '';
	document.getElementById('preview-after').src = '';

	// Reset UI
	document.getElementById('step-2-edit').style.display = 'none';
	document.getElementById('step-1-upload').style.display = 'block';
	document.getElementById('download-btn').style.display = 'none';

	// Reset inputs visibility to default (resolution)
	toggleInputs();
}

function getPreview() {
	const form = document.querySelector('form');
	const formData = new FormData(form);
	formData.append('preview', 'true');

	const btn = document.getElementById('preview-btn');
	const originalText = btn.innerText;
	btn.innerText = 'Processing...';
	btn.disabled = true;

	const loaderOverlay = document.getElementById('loader-overlay');
	if (loaderOverlay) {
		loaderOverlay.style.display = 'flex';
	}

	fetch('/upload', {
		method: 'POST',
		body: formData
	})
		.then(response => response.json())
		.then(data => {
			if (data.success) {
				const afterImg = document.getElementById('preview-after');
				afterImg.src = data.image;

				const downloadBtn = document.getElementById('download-btn');
				downloadBtn.href = data.image; // Data URI for download
				downloadBtn.download = data.filename;
				downloadBtn.style.display = 'inline-block';
			} else {
				alert('Error generating preview');
			}
		})
		.catch(error => {
			console.error('Error:', error);
			alert('An error occurred');
		})
		.finally(() => {
			btn.innerText = originalText;
			btn.disabled = false;
			if (loaderOverlay) {
				loaderOverlay.style.display = 'none';
			}
		});
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
});
