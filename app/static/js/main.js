function toggleInputs() {
	const mode = document.querySelector('input[name="mode"]:checked').value;
	document.getElementById('resolution-inputs').style.display = (mode === 'resolution') ? 'block' : 'none';
	document.getElementById('filesize-inputs').style.display = (mode === 'filesize') ? 'block' : 'none';
}
