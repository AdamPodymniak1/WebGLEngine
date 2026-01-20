export class EditorManager {
    constructor() {
        this.controls = {};
        this.callbacks = {};
        this.selectedObject = null;
        this.objects = [];
        this.nextObjectId = 1;
        this.uiItems = {};
    }
    
    init() {
        this.setupControls();
        this.setupCallbacks();
        this.setupUIListeners();
        this.setupFilePicker();
    }
    
    setupControls() {
        this.controls.cameraSpeed = document.getElementById('cameraSpeed');
        this.controls.mouseSensitivity = document.getElementById('mouseSensitivity');
        this.controls.cameraFOV = document.getElementById('cameraFOV');
        
        this.controls.tonemapMode = document.getElementById('tonemapMode');
        this.controls.exposure = document.getElementById('exposure');
        this.controls.gamma = document.getElementById('gamma');
        this.controls.antiAliasing = document.getElementById('antiAliasing');
        this.controls.dofEnabled = document.getElementById('dofEnabled');
        this.controls.focusDistance = document.getElementById('focusDistance');
        this.controls.focusRange = document.getElementById('focusRange');
        this.controls.maxBlur = document.getElementById('maxBlur');
        this.controls.bokehRadius = document.getElementById('bokehRadius');
        this.controls.celShadingEnabled = document.getElementById('celShadingEnabled');
        this.controls.celLevels = document.getElementById('celLevels');
        this.controls.celEdgeThreshold = document.getElementById('celEdgeThreshold');
        
        this.controls.sunDirX = document.getElementById('sunDirX');
        this.controls.sunDirY = document.getElementById('sunDirY');
        this.controls.sunDirZ = document.getElementById('sunDirZ');
        this.controls.sunColor = document.getElementById('sunColor');
        this.controls.roomLightX = document.getElementById('roomLightX');
        this.controls.roomLightY = document.getElementById('roomLightY');
        this.controls.roomLightZ = document.getElementById('roomLightZ');
        this.controls.roomLightColor = document.getElementById('roomLightColor');
        
        this.controls.objectModelType = document.getElementById('objectModelType');
        this.controls.objPosX = document.getElementById('objPosX');
        this.controls.objPosY = document.getElementById('objPosY');
        this.controls.objPosZ = document.getElementById('objPosZ');
        this.controls.objRotX = document.getElementById('objRotX');
        this.controls.objRotY = document.getElementById('objRotY');
        this.controls.objRotZ = document.getElementById('objRotZ');
        this.controls.objScaleX = document.getElementById('objScaleX');
        this.controls.objScaleY = document.getElementById('objScaleY');
        this.controls.objScaleZ = document.getElementById('objScaleZ');
        this.controls.objName = document.getElementById('objName');
    }
    
    setupCallbacks() {
        if (this.controls.cameraSpeed) {
            this.controls.cameraSpeed.addEventListener('input', () => {
                this.emit('cameraSpeedChanged', parseFloat(this.controls.cameraSpeed.value));
            });
        }
        
        if (this.controls.mouseSensitivity) {
            this.controls.mouseSensitivity.addEventListener('input', () => {
                this.emit('mouseSensitivityChanged', parseFloat(this.controls.mouseSensitivity.value));
            });
        }
        
        if (this.controls.cameraFOV) {
            this.controls.cameraFOV.addEventListener('input', () => {
                this.emit('cameraFOVChanged', parseFloat(this.controls.cameraFOV.value));
            });
        }
        
        if (this.controls.tonemapMode) {
            this.controls.tonemapMode.addEventListener('change', () => {
                this.emit('tonemapChanged', parseInt(this.controls.tonemapMode.value));
            });
        }
        
        if (this.controls.exposure) {
            this.controls.exposure.addEventListener('input', () => {
                this.emit('exposureChanged', parseFloat(this.controls.exposure.value));
            });
        }
        
        if (this.controls.gamma) {
            this.controls.gamma.addEventListener('input', () => {
                this.emit('gammaChanged', parseFloat(this.controls.gamma.value));
            });
        }
        
        if (this.controls.antiAliasing) {
            this.controls.antiAliasing.addEventListener('change', () => {
                this.emit('antiAliasingChanged', this.controls.antiAliasing.value);
            });
        }
        
        if (this.controls.dofEnabled) {
            this.controls.dofEnabled.addEventListener('change', () => {
                this.emit('dofEnabledChanged', this.controls.dofEnabled.checked);
            });
        }
        
        if (this.controls.focusDistance) {
            this.controls.focusDistance.addEventListener('input', () => {
                this.emit('focusDistanceChanged', parseFloat(this.controls.focusDistance.value));
            });
        }
        
        if (this.controls.focusRange) {
            this.controls.focusRange.addEventListener('input', () => {
                this.emit('focusRangeChanged', parseFloat(this.controls.focusRange.value));
            });
        }
        
        if (this.controls.maxBlur) {
            this.controls.maxBlur.addEventListener('input', () => {
                this.emit('maxBlurChanged', parseFloat(this.controls.maxBlur.value));
            });
        }
        
        if (this.controls.bokehRadius) {
            this.controls.bokehRadius.addEventListener('input', () => {
                this.emit('bokehRadiusChanged', parseFloat(this.controls.bokehRadius.value));
            });
        }
        
        if (this.controls.celShadingEnabled) {
            this.controls.celShadingEnabled.addEventListener('change', () => {
                this.emit('celShadingEnabledChanged', this.controls.celShadingEnabled.checked);
            });
        }
        
        if (this.controls.celLevels) {
            this.controls.celLevels.addEventListener('input', () => {
                this.emit('celLevelsChanged', parseFloat(this.controls.celLevels.value));
            });
        }
        
        if (this.controls.celEdgeThreshold) {
            this.controls.celEdgeThreshold.addEventListener('input', () => {
                this.emit('celEdgeThresholdChanged', parseFloat(this.controls.celEdgeThreshold.value));
            });
        }
        
        const sunCallbacks = () => {
            this.emit('sunChanged', {
                direction: [
                    parseFloat(this.controls.sunDirX.value),
                    parseFloat(this.controls.sunDirY.value),
                    parseFloat(this.controls.sunDirZ.value)
                ],
                color: this.hexToRgb(this.controls.sunColor.value)
            });
        };
        
        ['sunDirX', 'sunDirY', 'sunDirZ', 'sunColor'].forEach(control => {
            if (this.controls[control]) {
                this.controls[control].addEventListener('input', sunCallbacks);
            }
        });
        
        const roomLightCallbacks = () => {
            this.emit('roomLightChanged', {
                position: [
                    parseFloat(this.controls.roomLightX.value),
                    parseFloat(this.controls.roomLightY.value),
                    parseFloat(this.controls.roomLightZ.value)
                ],
                color: this.hexToRgb(this.controls.roomLightColor.value)
            });
        };
        
        ['roomLightX', 'roomLightY', 'roomLightZ', 'roomLightColor'].forEach(control => {
            if (this.controls[control]) {
                this.controls[control].addEventListener('input', roomLightCallbacks);
            }
        });
        
        document.getElementById('updateObject')?.addEventListener('click', () => {
            if (this.selectedObject) {
                const properties = {
                    position: [
                        parseFloat(this.controls.objPosX.value),
                        parseFloat(this.controls.objPosY.value),
                        parseFloat(this.controls.objPosZ.value)
                    ],
                    rotation: [
                        parseFloat(this.controls.objRotX.value),
                        parseFloat(this.controls.objRotY.value),
                        parseFloat(this.controls.objRotZ.value)
                    ],
                    scale: [
                        parseFloat(this.controls.objScaleX.value),
                        parseFloat(this.controls.objScaleY.value),
                        parseFloat(this.controls.objScaleZ.value)
                    ],
                    name: this.controls.objName.value
                };
                this.emit('objectUpdated', { id: this.selectedObject.id, properties });
            }
        });
        
        document.getElementById('deleteObject')?.addEventListener('click', () => {
            if (this.selectedObject) {
                this.emit('objectDeleted', this.selectedObject.id);
            }
        });
        
        document.getElementById('addObject')?.addEventListener('click', () => {
            this.showFilePicker();
        });
    }
    
    setupUIListeners() {
        const toggleEditorBtn = document.getElementById('toggleEditor');
        if (toggleEditorBtn) {
            toggleEditorBtn.addEventListener('click', () => {
                const editor = document.getElementById('editor');
                editor.classList.toggle('open');
            });
        }
        
        const syncSliders = [
            ['cameraSpeed', 'cameraSpeedValue'],
            ['mouseSensitivity', 'mouseSensitivityValue'],
            ['cameraFOV', 'cameraFOVValue'],
            ['exposure', 'exposureValue'],
            ['gamma', 'gammaValue'],
            ['focusDistance', 'focusDistanceValue'],
            ['focusRange', 'focusRangeValue'],
            ['maxBlur', 'maxBlurValue'],
            ['bokehRadius', 'bokehRadiusValue'],
            ['celLevels', 'celLevelsValue'],
            ['celEdgeThreshold', 'celEdgeThresholdValue']
        ];
        
        syncSliders.forEach(([sliderId, numberId]) => {
            const slider = document.getElementById(sliderId);
            const number = document.getElementById(numberId);
            
            if (slider && number) {
                slider.addEventListener('input', () => {
                    number.value = slider.value;
                });
                
                number.addEventListener('input', () => {
                    slider.value = number.value;
                });
            }
        });
        
        const colorPickers = [
            ['sunColor', 'sunColorHex'],
            ['roomLightColor', 'roomLightColorHex']
        ];
        
        colorPickers.forEach(([colorId, hexId]) => {
            const colorInput = document.getElementById(colorId);
            const hexInput = document.getElementById(hexId);
            
            if (colorInput && hexInput) {
                colorInput.addEventListener('input', () => {
                    hexInput.value = colorInput.value;
                });
                
                hexInput.addEventListener('input', () => {
                    if (hexInput.value.match(/^#[0-9A-F]{6}$/i)) {
                        colorInput.value = hexInput.value;
                    }
                });
            }
        });
        
        const dofEnabled = document.getElementById('dofEnabled');
        const dofControls = document.getElementById('dofControls');
        const celShadingEnabled = document.getElementById('celShadingEnabled');
        const celShadingControls = document.getElementById('celShadingControls');
        
        if (dofEnabled && dofControls) {
            dofEnabled.addEventListener('change', () => {
                dofControls.style.display = dofEnabled.checked ? 'block' : 'none';
            });
            
            dofControls.style.display = dofEnabled.checked ? 'block' : 'none';
        }
        
        if (celShadingEnabled && celShadingControls) {
            celShadingEnabled.addEventListener('change', () => {
                celShadingControls.style.display = celShadingEnabled.checked ? 'block' : 'none';
            });
            
            celShadingControls.style.display = celShadingEnabled.checked ? 'block' : 'none';
        }
    }
    
    setupFilePicker() {
        this.fileInput = document.createElement('input');
        this.fileInput.type = 'file';
        this.fileInput.accept = '.glb,.gltf';
        this.fileInput.style.display = 'none';
        document.body.appendChild(this.fileInput);
        
        this.fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const properties = {
                    modelPath: URL.createObjectURL(file),
                    fileName: file.name.replace(/\.[^/.]+$/, ""),
                    position: [
                        parseFloat(this.controls.objPosX.value),
                        parseFloat(this.controls.objPosY.value),
                        parseFloat(this.controls.objPosZ.value)
                    ],
                    rotation: [
                        parseFloat(this.controls.objRotX.value),
                        parseFloat(this.controls.objRotY.value),
                        parseFloat(this.controls.objRotZ.value)
                    ],
                    scale: [
                        parseFloat(this.controls.objScaleX.value),
                        parseFloat(this.controls.objScaleY.value),
                        parseFloat(this.controls.objScaleZ.value)
                    ]
                };
                this.emit('objectAdded', { id: 'obj_' + this.nextObjectId++, properties });
            }
            this.fileInput.value = '';
        });
    }
    
    showFilePicker() {
        this.fileInput.click();
    }
    
    on(event, callback) {
        if (!this.callbacks[event]) {
            this.callbacks[event] = [];
        }
        this.callbacks[event].push(callback);
    }
    
    emit(event, data) {
        if (this.callbacks[event]) {
            this.callbacks[event].forEach(callback => callback(data));
        }
    }
    
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16) / 255,
            parseInt(result[2], 16) / 255,
            parseInt(result[3], 16) / 255
        ] : [1, 1, 1];
    }
    
    rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (Math.round(r * 255) << 16) + (Math.round(g * 255) << 8) + Math.round(b * 255)).toString(16).slice(1);
    }
    
    addObjectToUI(object) {
        const objectList = document.getElementById('objectList');
        if (!objectList) return null;
        
        const item = document.createElement('div');
        item.className = 'object-item';
        item.dataset.id = object.id;
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'object-name';
        nameSpan.textContent = object.name || `Object ${object.id}`;
        nameSpan.contentEditable = true;
        nameSpan.addEventListener('blur', () => {
            object.name = nameSpan.textContent;
            this.emit('objectNameChanged', { id: object.id, name: nameSpan.textContent });
        });
        nameSpan.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                nameSpan.blur();
            }
        });
        
        item.appendChild(nameSpan);
        
        item.addEventListener('click', (e) => {
            if (e.target === nameSpan) return;
            
            document.querySelectorAll('.object-item').forEach(el => {
                el.classList.remove('selected');
            });
            
            item.classList.add('selected');
            this.selectedObject = object;
            
            this.updateObjectControls(object);
        });
        
        objectList.appendChild(item);
        this.uiItems[object.id] = { item, nameSpan };
        return item;
    }
    
    updateObjectControls(object) {
        if (object) {
            this.controls.objPosX.value = object.position ? object.position[0] : 0;
            this.controls.objPosY.value = object.position ? object.position[1] : 0;
            this.controls.objPosZ.value = object.position ? object.position[2] : 0;
            
            this.controls.objRotX.value = object.rotation ? object.rotation[0] : 0;
            this.controls.objRotY.value = object.rotation ? object.rotation[1] : 0;
            this.controls.objRotZ.value = object.rotation ? object.rotation[2] : 0;
            
            this.controls.objScaleX.value = object.scale ? object.scale[0] : 1;
            this.controls.objScaleY.value = object.scale ? object.scale[1] : 1;
            this.controls.objScaleZ.value = object.scale ? object.scale[2] : 1;
            
            this.controls.objName.value = object.name || '';
        }
    }
    
    removeObjectFromUI(objectId) {
        const uiItem = this.uiItems[objectId];
        if (uiItem && uiItem.item.parentNode) {
            uiItem.item.parentNode.removeChild(uiItem.item);
            delete this.uiItems[objectId];
        }
        
        if (this.selectedObject && this.selectedObject.id === objectId) {
            this.selectedObject = null;
            this.updateObjectControls({});
        }
    }
    
    updateObjectName(objectId, name) {
        const uiItem = this.uiItems[objectId];
        if (uiItem && uiItem.nameSpan) {
            uiItem.nameSpan.textContent = name;
        }
    }
    
    selectObject(object) {
        this.selectedObject = object;
        this.updateObjectControls(object);
        const uiItem = this.uiItems[object.id];
        if (uiItem) {
            document.querySelectorAll('.object-item').forEach(el => {
                el.classList.remove('selected');
            });
            uiItem.item.classList.add('selected');
        }
    }
}