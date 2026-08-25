class StateManager {
    constructor() {
        this.sessionId = '';
        this.currentStep = 0;
        this.currentMode = 'resolution';
        this.lastCommittedSrc = '';
        this.originalImageSrc = '';
        this.currentImageMeta = { width: 100, height: 100, size_bytes: 0, format: 'PNG' };
        this.cropModified = false;
        
        this.history = [];
        this.historyIndex = -1;
    }
}

class ThemeManager {
    constructor() {
        this.isDark = localStorage.getItem('darkMode') === 'true';
        this.init();
    }

    init() {
        const checkbox = document.getElementById('theme-checkbox');
        if (checkbox) checkbox.checked = this.isDark;
        if (this.isDark) document.body.classList.add('dark-mode');
    }

    toggle(isDark) {
        this.isDark = isDark;
        if (isDark) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('darkMode', 'true');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('darkMode', 'false');
        }
    }
}

class CropTool {
    constructor(stateManager) {
        this.state = stateManager;
        this.cropper = null;
    }

    init() {
        const liveImg = document.getElementById('preview-live');
        if (!this.cropper && liveImg.src) {
            this.cropper = new Cropper(liveImg, {
                viewMode: 1,
                aspectRatio: NaN,
                autoCropArea: 1,
                cropend: () => {
                    this.state.cropModified = true;
                }
            });
        }
    }

    destroy() {
        if (this.cropper) {
            this.cropper.destroy();
            this.cropper = null;
        }
    }

    setAspectRatio(ratio, label) {
        if (!this.cropper) return;
        if (ratio === 'original') {
            const data = this.cropper.getImageData();
            this.cropper.setAspectRatio(data.naturalWidth / data.naturalHeight);
        } else {
            this.cropper.setAspectRatio(parseFloat(ratio));
        }
        
        if (ratio === 'original' || isNaN(parseFloat(ratio))) {
            this.cropper.setCropBoxData({ left: 0, top: 0, width: 9999, height: 9999 });
        }
        
        this.state.cropModified = true;
        
        if (label) {
            document.getElementById('current-aspect').innerText = label;
            document.getElementById('aspect-dropdown').style.display = 'none';
        }
    }

    setAngle(value) {
        if (this.cropper) {
            this.cropper.rotateTo(Number(value));
            document.getElementById('angle-val').innerHTML = value + '&deg;';
            this.state.cropModified = true;
        }
    }

    rotate(degrees) {
        if (this.cropper) {
            this.cropper.rotate(degrees);
            const data = this.cropper.getData();
            document.getElementById('crop-angle').value = data.rotate;
            document.getElementById('angle-val').innerHTML = data.rotate + '&deg;';
            this.state.cropModified = true;
        }
    }

    flip(axis) {
        if (this.cropper) {
            const data = this.cropper.getData();
            if (axis === 'horizontal') {
                this.cropper.scaleX(data.scaleX === -1 ? 1 : -1);
            } else {
                this.cropper.scaleY(data.scaleY === -1 ? 1 : -1);
            }
            this.state.cropModified = true;
        }
    }

    getData() {
        return this.cropper ? this.cropper.getData(true) : null;
    }

    replace(src) {
        if (this.cropper) this.cropper.replace(src);
    }
}

class ResizeModal {
    constructor(stateManager) {
        this.state = stateManager;
        this.aspectLocked = true;
        this.originalAspectRatio = 1;
    }

    formatBytes(bytes) {
        if(bytes == null || isNaN(bytes)) return '0 B';
        if(bytes < 1024) return bytes + ' B';
        else if(bytes < 1048576) return (bytes / 1024).toFixed(0) + ' KB';
        else return (bytes / 1048576).toFixed(1) + ' MB';
    }

    open() {
        document.getElementById('resize-modal').style.display = 'flex';
        const meta = this.state.currentImageMeta;
        
        document.getElementById('resize_width').value = meta.width;
        document.getElementById('resize_height').value = meta.height;
        document.getElementById('resize_percentage').value = 100;
        this.originalAspectRatio = meta.width / meta.height;
        
        document.querySelector('input[name="resize_type"][value="pixels"]').checked = true;
        this.toggleType();
        
        document.getElementById('resize_quality').value = 100;
        this.handleQuality();
        document.getElementById('resize_save_format').value = 'AUTO';
        
        const currentStr = `${meta.width} x ${meta.height} pixels &nbsp;&nbsp;&nbsp; ${this.formatBytes(meta.size_bytes)} &nbsp;&nbsp;&nbsp; ${meta.format}`;
        document.getElementById('current-info-val').innerHTML = currentStr;
        document.getElementById('new-info-val').innerHTML = currentStr;
    }

    close() {
        document.getElementById('resize-modal').style.display = 'none';
    }

    toggleType() {
        const type = document.querySelector('input[name="resize_type"]:checked').value;
        document.getElementById('resize-pixels-inputs').style.display = (type === 'pixels') ? 'flex' : 'none';
        document.getElementById('resize-percentage-inputs').style.display = (type === 'percentage') ? 'flex' : 'none';
        window.triggerEstimation();
    }

    toggleLock() {
        this.aspectLocked = !this.aspectLocked;
        const btn = document.getElementById('aspect-lock-btn');
        if (this.aspectLocked) {
            btn.classList.add('locked');
            btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" id="lock-icon-svg"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>';
            const w = parseInt(document.getElementById('resize_width').value) || 1;
            document.getElementById('resize_height').value = Math.max(1, Math.round(w / this.originalAspectRatio));
            window.triggerEstimation();
        } else {
            btn.classList.remove('locked');
            btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 7h3a5 5 0 0 1 5 5 5 5 0 0 1-5 5h-3m-6 0H6a5 5 0 0 1-5-5 5 5 0 0 1 5-5h3"></path><line x1="8" y1="12" x2="16" y2="12"></line></svg>';
        }
    }

    handleInput(source) {
        if (source === 'width' && this.aspectLocked) {
            const w = parseInt(document.getElementById('resize_width').value) || 1;
            document.getElementById('resize_height').value = Math.max(1, Math.round(w / this.originalAspectRatio));
        } else if (source === 'height' && this.aspectLocked) {
            const h = parseInt(document.getElementById('resize_height').value) || 1;
            document.getElementById('resize_width').value = Math.max(1, Math.round(h * this.originalAspectRatio));
        }
        window.triggerEstimation();
    }

    handleQuality() {
        const q = document.getElementById('resize_quality').value;
        document.getElementById('resize-quality-val').innerText = q;
        let lbl = q >= 90 ? '(High)' : q >= 60 ? '(Medium)' : '(Low)';
        document.getElementById('resize-quality-lbl').innerText = lbl;
    }
}

class ImgitorApp {
    constructor() {
        this.state = new StateManager();
        this.theme = new ThemeManager();
        this.cropTool = new CropTool(this.state);
        this.resizeModal = new ResizeModal(this.state);
        
        this.bindEvents();
    }

    bindEvents() {
        document.addEventListener('DOMContentLoaded', () => this.initUI());
        
        // Mobile sidebar drawer close
        document.addEventListener('click', (e) => {
            if (e.target.id === 'mobile-overlay') {
                this.closeMobileDrawer();
            }
        });

        // Close aspect dropdown and history dropdown when clicking outside
        document.addEventListener('click', (event) => {
            const aspectSelector = document.querySelector('.aspect-ratio-selector');
            const aspectDropdown = document.getElementById('aspect-dropdown');
            if (aspectSelector && aspectDropdown && !aspectSelector.contains(event.target)) {
                aspectDropdown.style.display = 'none';
            }
        });
    }

    initUI() {
        const uploadArea = document.querySelector('.upload-area');
        const fileInput = document.getElementById('image');

        if (uploadArea && fileInput) {
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                uploadArea.addEventListener(eventName, (e) => { e.preventDefault(); e.stopPropagation(); }, false);
            });
            ['dragenter', 'dragover'].forEach(eventName => {
                uploadArea.addEventListener(eventName, () => uploadArea.classList.add('drag-active'), false);
            });
            ['dragleave', 'drop'].forEach(eventName => {
                uploadArea.addEventListener(eventName, () => uploadArea.classList.remove('drag-active'), false);
            });
            uploadArea.addEventListener('drop', (e) => {
                const files = e.dataTransfer.files;
                if (files && files.length > 0) {
                    fileInput.files = files;
                    this.handleFileUpload(fileInput);
                }
            }, false);
        }

        const liveImg = document.getElementById('preview-live');
        if (liveImg) {
            liveImg.addEventListener('mousedown', () => {
                if (this.state.originalImageSrc && liveImg.src !== this.state.originalImageSrc) {
                    liveImg.dataset.currentSrc = liveImg.src;
                    liveImg.src = this.state.originalImageSrc;
                }
            });
            const restoreImage = () => {
                if (liveImg.dataset.currentSrc && liveImg.src === this.state.originalImageSrc) {
                    liveImg.src = liveImg.dataset.currentSrc;
                }
            };
            liveImg.addEventListener('mouseup', restoreImage);
            liveImg.addEventListener('mouseleave', restoreImage);
        }
    }

    openMobileDrawer() {
        if (window.innerWidth <= 768) {
            document.getElementById('settings-sidebar').classList.add('active');
            document.getElementById('mobile-overlay').classList.add('active');
        }
    }

    closeMobileDrawer() {
        document.getElementById('settings-sidebar').classList.remove('active');
        document.getElementById('mobile-overlay').classList.remove('active');
    }

    toggleInputs() {
        const modeEl = document.querySelector('input[name="mode"]:checked');
        if (!modeEl) return;
        const newMode = modeEl.value;

        if (this.state.currentMode === 'crop' && newMode !== 'crop' && this.cropTool.cropper && this.state.cropModified) {
            this.commitCropThenSwitch(newMode);
        } else {
            this.executeModeSwitch(newMode);
        }
        
        // Open drawer on mobile when tool is selected, except for crop
        if (newMode === 'crop') {
            this.closeMobileDrawer();
        } else {
            this.openMobileDrawer();
        }
    }

    commitCropThenSwitch(newMode) {
        const cropData = this.cropTool.getData();
        const form = document.getElementById('main-form');
        const formData = new FormData(form);
        
        formData.set('action', 'edit');
        formData.set('mode', 'crop');
        formData.set('crop_x', cropData.x);
        formData.set('crop_y', cropData.y);
        formData.set('crop_w', cropData.width);
        formData.set('crop_h', cropData.height);
        formData.set('crop_rotate', cropData.rotate);
        formData.set('crop_scaleX', cropData.scaleX);
        formData.set('crop_scaleY', cropData.scaleY);
        
        this.showLoader();
        
        return fetch('/upload', { method: 'POST', body: formData })
        .then(res => res.json())
        .then(data => {
            this.hideLoader();
            if (data.success) {
                document.getElementById('current_step').value = data.current_step;
                document.getElementById('preview-live').src = data.image;
                this.state.currentStep = data.current_step;
                this.state.cropModified = false;
                this.executeModeSwitch(newMode);
                this.saveState('Crop Applied');
            }
        })
        .catch(err => { console.error(err); this.hideLoader(); });
    }

    executeModeSwitch(newMode) {
        if (newMode === 'crop') {
            if (this.state.lastCommittedSrc) {
                const previewLive = document.getElementById('preview-live');
                if (previewLive && previewLive.src !== this.state.lastCommittedSrc) {
                    previewLive.src = this.state.lastCommittedSrc;
                }
            }
        }

        this.state.currentMode = newMode;
        document.querySelector(`input[name="mode"][value="${newMode}"]`).checked = true;

        document.getElementById('filter-inputs').style.display = (newMode === 'filter') ? 'block' : 'none';
        document.getElementById('dither-inputs').style.display = (newMode === 'dither') ? 'block' : 'none';
        document.getElementById('halftone-inputs').style.display = (newMode === 'halftone') ? 'block' : 'none';
        document.getElementById('crop-inputs').style.display = (newMode === 'crop') ? 'block' : 'none';
        document.getElementById('crop-bottom-toolbar').style.display = (newMode === 'crop') ? 'flex' : 'none';
        document.getElementById('adjust-inputs').style.display = (newMode === 'adjust') ? 'block' : 'none';
        document.getElementById('watermark-inputs').style.display = (newMode === 'watermark') ? 'block' : 'none';

        if (newMode === 'crop') {
            this.cropTool.init();
        } else {
            this.cropTool.destroy();
        }

        if (newMode === 'filter' && document.getElementById('filter_type').value === 'none') {
            document.querySelectorAll('.filter-thumb:not(.dither-thumb)').forEach(btn => btn.classList.remove('active'));
            document.querySelector('.filter-thumb:not(.dither-thumb)[onclick*="none"]')?.classList.add('active');
        }

        if (newMode === 'dither' && document.getElementById('dither_method').value === 'none') {
            document.querySelectorAll('.dither-thumb').forEach(btn => btn.classList.remove('active'));
            document.querySelector('.dither-thumb[onclick*="none"]')?.classList.add('active');
        }
        
        if (newMode !== 'crop') {
            window.livePreview();
        }
    }

    selectFilter(filterName, btnElement) {
        document.getElementById('filter_type').value = filterName;
        document.querySelectorAll('.filter-thumb').forEach(btn => btn.classList.remove('active'));
        if (btnElement) btnElement.classList.add('active');
        
        let prettyName = filterName.charAt(0).toUpperCase() + filterName.slice(1).replace('_', ' ');
        if (filterName === 'none') prettyName = 'None';
        this.saveState('Applied Filter: ' + prettyName);
        
        window.livePreview();
    }

    selectDither(methodName, btnElement) {
        document.getElementById('dither_method').value = methodName;
        document.querySelectorAll('.dither-thumb').forEach(btn => btn.classList.remove('active'));
        if (btnElement) btnElement.classList.add('active');
        
        let prettyName = methodName.charAt(0).toUpperCase() + methodName.slice(1).replace('_', ' ');
        if (methodName === 'none') prettyName = 'None';
        this.saveState('Applied Dithering: ' + prettyName);
        
        window.livePreview();
    }

    selectHalftoneShape(shape, btnElement) {
        document.getElementById('halftone_shape').value = shape;
        document.querySelectorAll('#halftone-inputs .filter-thumb').forEach(btn => btn.classList.remove('active'));
        if (btnElement) btnElement.classList.add('active');
        
        let prettyName = shape.charAt(0).toUpperCase() + shape.slice(1);
        this.saveState('Changed Halftone Shape to ' + prettyName);
        
        window.livePreview();
    }

    handleFileUpload(input) {
        const file = input.files[0];
        if (file) {
            document.getElementById('form_action').value = 'init';
            this.submitForm();
        }
    }

    submitForm() {
        const form = document.getElementById('main-form');
        const formData = new FormData(form);
        const action = document.getElementById('form_action').value;
        const modeEl = document.querySelector('input[name="mode"]:checked');
        const mode = modeEl ? modeEl.value : 'resolution';

        if (action === 'edit' && mode === 'crop' && this.cropTool.cropper) {
            const data = this.cropTool.getData();
            formData.set('crop_x', data.x); formData.set('crop_y', data.y);
            formData.set('crop_w', data.width); formData.set('crop_h', data.height);
            formData.set('crop_rotate', data.rotate);
            formData.set('crop_scaleX', data.scaleX); formData.set('crop_scaleY', data.scaleY);
        }
        
        formData.set('preview', 'true');
        this.showLoader();

        fetch('/upload', { method: 'POST', body: formData })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                document.getElementById('session_id').value = data.session_id;
                document.getElementById('current_step').value = data.current_step;
                document.getElementById('preview-live').src = data.image;
                
                this.state.sessionId = data.session_id;
                this.state.currentStep = data.current_step;
                this.state.lastCommittedSrc = data.image;
                this.state.currentImageMeta = { width: data.width, height: data.height, size_bytes: data.size_bytes, format: data.format };
                
                document.getElementById('step-1-upload').style.display = 'none';
                document.getElementById('step-2-edit').style.display = 'flex';
                document.getElementById('settings-sidebar').style.display = 'flex';
                document.getElementById('toolbar-icons').style.display = 'flex';
                document.getElementById('download-btn').style.display = 'inline-flex';
                
                const navLinks = document.querySelector('.nav-links');
                if (navLinks) navLinks.style.display = 'none';

                this.updateUndoRedo();
                
                if (['init', 'undo', 'redo'].includes(action)) document.getElementById('form_action').value = 'edit';
                if (action === 'init') {
                    this.state.originalImageSrc = data.image;
                    this.state.history = [];
                    this.state.historyIndex = -1;
                    this.saveState('Original Image');
                    this.toggleInputs();
                } else if (action === 'edit') {
                    let actionName = 'Applied Edit';
                    const modeEl = document.querySelector('input[name="mode"]:checked');
                    if (modeEl && modeEl.value === 'crop') actionName = 'Crop Applied';
                    else if (document.getElementById('hidden-rembg-mode')) actionName = 'Background Removed';
                    else if (modeEl && modeEl.value === 'resolution') actionName = 'Resized Image';
                    this.saveState(actionName);
                }
                
                this.cropTool.replace(data.image);
            } else {
                alert('Error processing image: ' + (data.error || 'Unknown'));
            }
        })
        .catch(err => { console.error(err); alert('An error occurred'); })
        .finally(() => this.hideLoader());
    }

    getFormState() {
        return {
            current_step: this.state.currentStep,
            filter_type: document.getElementById('filter_type')?.value || 'none',
            dither_method: document.getElementById('dither_method')?.value || 'none',
            halftone_shape: document.getElementById('halftone_shape')?.value || 'round',
            halftone_size: document.querySelector('input[name="halftone_size"]')?.value || '10',
            halftone_angle: document.querySelector('input[name="halftone_angle"]')?.value || '0',
            brightness: document.querySelector('input[name="brightness"]')?.value || '1.0',
            contrast: document.querySelector('input[name="contrast"]')?.value || '1.0',
            saturation: document.querySelector('input[name="saturation"]')?.value || '1.0',
            sharpness: document.querySelector('input[name="sharpness"]')?.value || '1.0',
            wm_text: document.querySelector('input[name="wm_text"]')?.value || '',
            wm_color: document.querySelector('input[name="wm_color"]')?.value || '#ffffff',
            wm_opacity: document.querySelector('input[name="wm_opacity"]')?.value || '128'
        };
    }

    applyFormState(stateObj) {
        this.state.currentStep = stateObj.current_step;
        document.getElementById('current_step').value = stateObj.current_step;
        
        if (document.getElementById('filter_type')) document.getElementById('filter_type').value = stateObj.filter_type;
        document.querySelectorAll('.filter-thumb:not(.dither-thumb)').forEach(btn => btn.classList.remove('active'));
        const activeFilterBtn = document.querySelector(`.filter-thumb:not(.dither-thumb)[onclick*="'${stateObj.filter_type}'"]`);
        if (activeFilterBtn) activeFilterBtn.classList.add('active');

        if (document.getElementById('dither_method')) document.getElementById('dither_method').value = stateObj.dither_method;
        document.querySelectorAll('.dither-thumb').forEach(btn => btn.classList.remove('active'));
        const activeDitherBtn = document.querySelector(`.dither-thumb[onclick*="'${stateObj.dither_method}'"]`);
        if (activeDitherBtn) activeDitherBtn.classList.add('active');

        if (document.getElementById('halftone_shape')) document.getElementById('halftone_shape').value = stateObj.halftone_shape;
        document.querySelectorAll('#halftone-inputs .filter-thumb').forEach(btn => btn.classList.remove('active'));
        const activeShapeBtn = document.querySelector(`#halftone-inputs .filter-thumb[onclick*="'${stateObj.halftone_shape}'"]`);
        if (activeShapeBtn) activeShapeBtn.classList.add('active');

        const sliders = ['brightness', 'contrast', 'saturation', 'sharpness', 'wm_text', 'wm_color', 'wm_opacity', 'halftone_size', 'halftone_angle'];
        sliders.forEach(key => {
            const input = document.querySelector(`input[name="${key}"]`);
            if (input) {
                input.value = stateObj[key];
                const valBadge = document.getElementById(`val-${key.replace('wm_', 'wm-').replace('brightness', 'bright').replace('contrast', 'cont').replace('saturation', 'sat').replace('sharpness', 'sharp')}`);
                if (valBadge) valBadge.innerText = stateObj[key];
            }
        });
    }

    saveState(actionName = 'State Changed') {
        const state = this.getFormState();
        state.actionName = actionName;
        
        if (this.state.historyIndex < this.state.history.length - 1) {
            this.state.history = this.state.history.slice(0, this.state.historyIndex + 1);
        }
        
        if (this.state.history.length > 0) {
            const lastState = this.state.history[this.state.history.length - 1];
            // Compare without actionName
            const lastStateCmp = { ...lastState }; delete lastStateCmp.actionName;
            const stateCmp = { ...state }; delete stateCmp.actionName;
            if (JSON.stringify(lastStateCmp) === JSON.stringify(stateCmp)) return;
        }
        
        this.state.history.push(state);
        this.state.historyIndex = this.state.history.length - 1;
        this.updateUndoRedo();
        
        if (this.state.history.length > 1) { // Don't toast on initial load
            this.showToast(actionName);
        }
    }

    jumpToState(index) {
        if (index >= 0 && index < this.state.history.length) {
            this.state.historyIndex = index;
            this.applyFormState(this.state.history[this.state.historyIndex]);
            this.updateUndoRedo();
            window.livePreview();
        }
    }

    applyEdit() { document.getElementById('form_action').value = 'edit'; this.submitForm(); }
    
    undoStep() {
        if (this.state.historyIndex > 0) {
            this.state.historyIndex--;
            this.applyFormState(this.state.history[this.state.historyIndex]);
            this.updateUndoRedo();
            window.livePreview();
        }
    }

    redoStep() {
        if (this.state.historyIndex < this.state.history.length - 1) {
            this.state.historyIndex++;
            this.applyFormState(this.state.history[this.state.historyIndex]);
            this.updateUndoRedo();
            window.livePreview();
        }
    }

    resetAll() {
        if (this.state.history.length > 0) {
            this.state.historyIndex = 0;
            this.applyFormState(this.state.history[0]);
            this.updateUndoRedo();
            window.livePreview();
        }
    }

    updateUndoRedo() {
        document.getElementById('undo-btn').disabled = (this.state.historyIndex <= 0);
        document.getElementById('redo-btn').disabled = (this.state.historyIndex >= this.state.history.length - 1);
        this.renderHistoryList();
    }

    renderHistoryList() {
        const container = document.getElementById('history-drawer-list');
        if (!container) return;
        
        container.innerHTML = '';
        
        // Loop backwards to show newest first
        for (let i = this.state.history.length - 1; i >= 0; i--) {
            const state = this.state.history[i];
            const li = document.createElement('li');
            li.className = 'history-item';
            if (i === this.state.historyIndex) li.classList.add('active');
            if (i > this.state.historyIndex) li.classList.add('future');
            
            li.onclick = () => {
                this.jumpToState(i);
                // Optionally close drawer on click: window.toggleHistoryDrawer();
            };
            
            li.innerHTML = `
                <span class="history-step">Step ${i}</span>
                <span class="history-action">${state.actionName || 'State'}</span>
            `;
            container.appendChild(li);
        }
    }

    showToast(message) {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerText = message;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('hide');
            toast.addEventListener('animationend', () => {
                toast.remove();
            });
        }, 3000);
    }

    removeBackground() {
        if (this.state.currentMode === 'crop' && this.cropTool.cropper && this.state.cropModified) {
            this.commitCropThenSwitch(this.state.currentMode).then(() => {
                this._doRembgSubmit();
            });
        } else {
            this._doRembgSubmit();
        }
    }

    _doRembgSubmit() {
        const form = document.getElementById('main-form');
        form.querySelectorAll('input[name="mode"]').forEach(r => r.checked = false);
        
        let hiddenMode = document.getElementById('hidden-rembg-mode');
        if (!hiddenMode) {
            hiddenMode = document.createElement('input');
            hiddenMode.type = 'hidden';
            hiddenMode.name = 'mode';
            hiddenMode.id = 'hidden-rembg-mode';
            hiddenMode.value = 'remove_bg';
            form.appendChild(hiddenMode);
        }
        
        document.getElementById('form_action').value = 'edit';
        this.submitForm();
        
        setTimeout(() => {
            hiddenMode.remove();
            const currentRadio = document.querySelector(`input[name="mode"][value="${this.state.currentMode}"]`);
            if (currentRadio) currentRadio.checked = true;
        }, 100);
    }

    downloadImage() {
        if (this.state.currentMode === 'crop' && this.cropTool.cropper && this.state.cropModified) {
            this.commitCropThenSwitch(this.state.currentMode).then(() => {
                document.getElementById('form_action').value = 'download';
                document.getElementById('main-form').submit(); 
            });
            return;
        }
        document.getElementById('form_action').value = 'download';
        document.getElementById('main-form').submit(); 
    }

    startOver() {
        document.getElementById('main-form').reset();
        this.cropTool.destroy();
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
        this.state.currentStep = 0;
        this.closeMobileDrawer();
        this.toggleInputs();
    }

    showLoader() { document.getElementById('loader-overlay').style.display = 'flex'; }
    hideLoader() { document.getElementById('loader-overlay').style.display = 'none'; }
}

// Global initialization
const app = new ImgitorApp();

// Debounce helper
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Bind global functions to app methods so existing HTML handlers keep working
window.toggleInputs = () => app.toggleInputs();
window.selectFilter = (name, el) => app.selectFilter(name, el);
window.selectDither = (name, el) => app.selectDither(name, el);
window.selectHalftoneShape = (name, el) => app.selectHalftoneShape(name, el);
window.handleFileUpload = (el) => app.handleFileUpload(el);
window.applyEdit = () => app.applyEdit();
window.undoStep = () => app.undoStep();
window.redoStep = () => app.redoStep();
window.resetAll = () => app.resetAll();
window.downloadImage = () => app.downloadImage();
window.startOver = () => app.startOver();
window.removeBackground = () => app.removeBackground();
window.toggleTheme = (isDark) => app.theme.toggle(isDark);
window.openResizeModal = () => app.resizeModal.open();
window.closeResizeModal = () => app.resizeModal.close();
window.toggleResizeType = () => app.resizeModal.toggleType();
window.toggleAspectLock = () => app.resizeModal.toggleLock();
window.handleResizeInput = (src) => app.resizeModal.handleInput(src);
window.handleQualityInput = () => app.resizeModal.handleQuality();
window.setCropAngle = (v) => app.cropTool.setAngle(v);
window.rotateCrop = (d) => app.cropTool.rotate(d);
window.flipCrop = (a) => app.cropTool.flip(a);
window.setCropAspectRatio = (r, l) => app.cropTool.setAspectRatio(r, l);
window.toggleAspectDropdown = () => {
    const d = document.getElementById('aspect-dropdown');
    d.style.display = d.style.display === 'none' ? 'flex' : 'none';
};
window.closeMobileDrawer = () => app.closeMobileDrawer();
window.toggleHistoryDrawer = () => {
    document.getElementById('history-drawer').classList.toggle('active');
};

window.saveResize = () => {
    const form = document.getElementById('main-form');
    form.querySelectorAll('input[name="mode"]').forEach(r => r.checked = false);
    let modeInput = form.querySelector('input[name="mode"][value="resolution"]');
    if (modeInput) modeInput.checked = true;
    
    document.getElementById('save_format').value = document.getElementById('resize_save_format').value;
    app.applyEdit();
    app.resizeModal.close();
    
    setTimeout(() => {
        const cropRadio = document.getElementById('crop');
        if (cropRadio) {
            cropRadio.checked = true;
            app.executeModeSwitch('crop');
        }
    }, 100);
};

window.downloadFromResize = () => {
    const form = document.getElementById('main-form');
    form.querySelectorAll('input[name="mode"]').forEach(r => r.checked = false);
    let modeInput = form.querySelector('input[name="mode"][value="resolution"]');
    if (modeInput) modeInput.checked = true;
    
    document.getElementById('save_format').value = document.getElementById('resize_save_format').value;
    document.getElementById('form_action').value = 'edit';
    
    app.showLoader();
    fetch('/upload', { method: 'POST', body: new FormData(form) })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            document.getElementById('current_step').value = data.current_step;
            document.getElementById('preview-live').src = data.image;
            app.state.currentStep = data.current_step;
            app.saveState('Resized Image');
            app.resizeModal.close();
            setTimeout(() => { app.downloadImage(); app.hideLoader(); }, 100);
            setTimeout(() => {
                const cropRadio = document.getElementById('crop');
                if (cropRadio) { cropRadio.checked = true; app.executeModeSwitch('crop'); }
            }, 200);
        } else {
            alert('Error applying resize before download');
            app.hideLoader();
        }
    }).catch(err => { console.error(err); app.hideLoader(); });
};

window.livePreview = debounce(function() {
    const actionEl = document.getElementById('form_action');
    if (!actionEl) return;
    const actionVal = actionEl.value;
    if (actionVal === 'init' || actionVal === 'download') return;

    const modeEl = document.querySelector('input[name="mode"]:checked');
    if (!modeEl) return;
    const mode = modeEl.value;

    if (mode === 'crop') return;

    const form = document.getElementById('main-form');
    if(!form) return;

    const formData = new FormData(form);
    formData.set('action', 'preview_only');

    fetch('/upload', { method: 'POST', body: formData })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            const previewLive = document.getElementById('preview-live');
            if (previewLive) previewLive.src = data.image;
        }
    }).catch(err => console.error('Preview error:', err));
}, 50);

window.triggerEstimation = debounce(function() {
    const form = document.getElementById('main-form');
    if(!form) return;
    
    const formData = new FormData(form);
    formData.set('action', 'estimate_size');
    formData.set('mode', 'resolution');
    
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

    fetch('/upload', { method: 'POST', body: formData })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            const newStr = `${data.width} x ${data.height} px &nbsp; ${app.resizeModal.formatBytes(data.size_bytes)} &nbsp; ${data.format}`;
            document.getElementById('new-info-val').innerHTML = newStr;
        } else {
            document.getElementById('new-info-val').innerHTML = 'Error';
        }
    }).catch(err => document.getElementById('new-info-val').innerHTML = 'Error');
}, 300);
