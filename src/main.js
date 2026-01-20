import { Scene } from './scene/Scene.js';
import { ModelInstance } from './scene/ModelInstance.js';
import { addDirectionalLight, addPointLight, addSpotLight } from './core/Lighting.js';
import { loadText } from './loaders/FileLoader.js';
import { Shader } from './core/Shader.js';
import { Camera } from './core/Camera.js';
import { LightingSystem } from './scene/LightingSystem.js';
import { PostProcessor } from './core/PostProcessor.js';
import { ShadowRenderer } from './loaders/ShadowRenderer.js';
import { startFPSCounter } from './core/FPS.js';
import { createSkybox } from './core/Skybox.js';

// Editor Manager
class EditorManager {
    constructor() {
        this.controls = {};
        this.callbacks = {};
        this.selectedObject = null;
        this.objects = [];
        this.nextObjectId = 1;
    }
    
    init() {
        // Set up event listeners for all controls
        this.setupControls();
        this.setupCallbacks();
    }
    
    setupControls() {
        // Camera controls
        this.controls.cameraSpeed = document.getElementById('cameraSpeed');
        this.controls.mouseSensitivity = document.getElementById('mouseSensitivity');
        this.controls.cameraFOV = document.getElementById('cameraFOV');
        
        // Post-processing controls
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
        
        // Lighting controls
        this.controls.sunDirX = document.getElementById('sunDirX');
        this.controls.sunDirY = document.getElementById('sunDirY');
        this.controls.sunDirZ = document.getElementById('sunDirZ');
        this.controls.sunColor = document.getElementById('sunColor');
        this.controls.roomLightX = document.getElementById('roomLightX');
        this.controls.roomLightY = document.getElementById('roomLightY');
        this.controls.roomLightZ = document.getElementById('roomLightZ');
        this.controls.roomLightColor = document.getElementById('roomLightColor');
        
        // Object controls
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
    }
    
    setupCallbacks() {
        // Camera callbacks
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
        
        // Post-processing callbacks
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
        
        // Lighting callbacks
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
        
        // Object callbacks
        document.getElementById('updateObject')?.addEventListener('click', () => {
            if (this.selectedObject) {
                const properties = {
                    modelType: this.controls.objectModelType.value,
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
                this.emit('objectUpdated', { id: this.selectedObject.id, properties });
            }
        });
        
        document.getElementById('deleteObject')?.addEventListener('click', () => {
            if (this.selectedObject) {
                this.emit('objectDeleted', this.selectedObject.id);
                this.selectedObject = null;
            }
        });
        
        document.getElementById('addObject')?.addEventListener('click', () => {
            const properties = {
                modelType: this.controls.objectModelType.value,
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
        });
        
        document.getElementById('addLight')?.addEventListener('click', () => {
            this.emit('addLight');
        });
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
    
    addObject(object) {
        this.objects.push(object);
    }
    
    selectObject(object) {
        this.selectedObject = object;
        this.updateObjectControls(object);
    }
    
    updateObjectControls(object) {
        if (object) {
            this.controls.objPosX.value = object.position[0];
            this.controls.objPosY.value = object.position[1];
            this.controls.objPosZ.value = object.position[2];
            this.controls.objRotX.value = object.rotation[0];
            this.controls.objRotY.value = object.rotation[1];
            this.controls.objRotZ.value = object.rotation[2];
            this.controls.objScaleX.value = object.scale[0];
            this.controls.objScaleY.value = object.scale[1];
            this.controls.objScaleZ.value = object.scale[2];
        }
    }
}

// Create global editor instance
const editor = new EditorManager();

async function main() {
    const canvas = document.getElementById('game');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const gl = canvas.getContext('webgl2');
    if (!gl) {
        alert('WebGL2 not supported');
        return;
    }
    const ext_sRGB = gl.getExtension("EXT_sRGB");
    if (ext_sRGB) {
        gl.enable(ext_sRGB.FRAMEBUFFER_SRGB);
    }
    const ext_CBF = gl.getExtension('EXT_color_buffer_float');
    if (!ext_CBF) {
        alert('HDR not supported on this device');
    }

    const TONEMAP = {
        ACES: 0,
        FILMIC: 1,
        REINHARD: 2,
        ROM_BIN_DA_HOUSE: 3,
        LOTTES: 4
    };

    let tonemapMode = TONEMAP.ACES;
    let exposure = 0.5;
    let gamma = 0.6;

    let focusDistance = 8.0;
    let focusRange = 4.0;
    let maxBlur = 8.0;
    let dofEnabled = false;
    let bokehRadius = 8;
    
    let celShadingEnabled = false;
    let celLevels = 12.0;
    let celEdgeThreshold = 0.3;
    let antiAliasingMode = 'fxaa';

    const vertexSrc = await loadText('./shaders/main/vertex.glsl');
    const fragmentSrc = await loadText('./shaders/main/fragment.glsl');
    const mainShader = new Shader(gl, vertexSrc, fragmentSrc);
    
    const postVertexSrc = await loadText('./shaders/postprocessing/post.vert.glsl');
    const tonemapFragmentSrc = await loadText('./shaders/postprocessing/tonemap.frag.glsl');
    const depthOfFieldFragmentSrc = await loadText('./shaders/postprocessing/depth_of_field.frag.glsl');
    const depthOfFieldShader = new Shader(gl, postVertexSrc, depthOfFieldFragmentSrc);
    const tonemapShader = new Shader(gl, postVertexSrc, tonemapFragmentSrc);

    const fxaaFragmentSrc = await loadText('./shaders/antialliasing/fxaa.frag.glsl');
    const smaaFragmentSrc = await loadText('./shaders/antialliasing/smaa.frag.glsl');
    const fxaaShader = new Shader(gl, postVertexSrc, fxaaFragmentSrc);
    const smaaShader = new Shader(gl, postVertexSrc, smaaFragmentSrc);

    const celFragmentSrc = await loadText('./shaders/postprocessing/cel_shading.frag.glsl');
    const celShader = new Shader(gl, postVertexSrc, celFragmentSrc);

    celShader.use();
    gl.uniform1f(celShader.getUniform("uLevels"), celLevels);
    gl.uniform1f(celShader.getUniform("uEdgeThreshold"), celEdgeThreshold);
    gl.uniform3fv(celShader.getUniform("uEdgeColor"), [0,0,0]);
    gl.uniform2fv(celShader.getUniform("uPixelSize"), [1 / canvas.width, 1 / canvas.height]);
    
    const postProcessor = new PostProcessor(gl);

    const camera = new Camera();
    camera.updateViewMatrix();

    let projection = glMatrix.mat4.perspective(
        glMatrix.mat4.create(),
        glMatrix.glMatrix.toRadian(45),
        canvas.width / canvas.height,
        0.1,
        1000
    );

    mainShader.use();
    gl.uniformMatrix4fv(mainShader.getUniform('mProj'), false, projection);
    gl.uniformMatrix4fv(mainShader.getUniform('mView'), false, camera.viewMatrix);

    const scene = new Scene(gl, mainShader);

    const sceneLights = {
        dirLights: [],
        pointLights: [],
        spotLights: []
    };

    const sun = addDirectionalLight(
        sceneLights,
        [3, -2, -3],
        [1.3, 1.3, 1.3]
    );

    const roomLight = addPointLight(
        sceneLights,
        [3, 1, -2],
        [0.5, 1.0, 0.5]
    );

    const spotLight = addSpotLight(
        sceneLights,
        [0, 0, 0],
        [0, 0, -1],
        [1.0, 1.0, 1.0]
    );

    const lighting = new LightingSystem(gl, mainShader, camera, sceneLights);
    
    const shadowRenderer = new ShadowRenderer(gl, scene, camera);
    await shadowRenderer.init();

    const skybox = await createSkybox(gl, '../textures/skybox.png');

    // Store references to models for editor
    const modelInstances = {};
    
    const gun = await ModelInstance.addModel(
        gl, mainShader,
        './models/gun.glb',
        {
            position: [0, 0, 0],
            rotation: [1.5 * Math.PI, 0, 0],
            scale: [1, 1, 1]
        },
    );
    modelInstances.gun = gun;
    gun.editorId = 'gun';
    scene.addModel(gun);

    const hang = await ModelInstance.addModel(
        gl, mainShader,
        './models/hang.glb',
        {
            position: [0, 0, 0],
            rotation: [1.5 * Math.PI, 0, 0],
            scale: [0.02, 0.02, 0.02]
        },
    );
    modelInstances.hang = hang;
    hang.editorId = 'hang';
    scene.addModel(hang);

    // Initialize editor
    editor.init();

    // Connect editor to WebGL application
    editor.on('cameraSpeedChanged', (speed) => {
        camera.speed = speed;
    });

    editor.on('mouseSensitivityChanged', (sensitivity) => {
        camera.sensitivity = sensitivity;
    });

    editor.on('cameraFOVChanged', (fov) => {
        glMatrix.mat4.perspective(
            projection,
            glMatrix.glMatrix.toRadian(fov),
            canvas.width / canvas.height,
            0.1,
            1000
        );
        mainShader.use();
        gl.uniformMatrix4fv(mainShader.getUniform('mProj'), false, projection);
        
        // Update skybox projection as well
        skybox.updateProjection(projection);
    });

    editor.on('tonemapChanged', (mode) => {
        tonemapMode = mode;
    });

    editor.on('exposureChanged', (value) => {
        exposure = value;
    });

    editor.on('gammaChanged', (value) => {
        gamma = value;
    });

    editor.on('antiAliasingChanged', (mode) => {
        antiAliasingMode = mode;
    });

    editor.on('dofEnabledChanged', (enabled) => {
        dofEnabled = enabled;
    });

    editor.on('focusDistanceChanged', (value) => {
        focusDistance = value;
    });

    editor.on('focusRangeChanged', (value) => {
        focusRange = value;
    });

    editor.on('maxBlurChanged', (value) => {
        maxBlur = value;
    });

    editor.on('bokehRadiusChanged', (value) => {
        bokehRadius = value;
    });

    editor.on('celShadingEnabledChanged', (enabled) => {
        celShadingEnabled = enabled;
    });

    editor.on('celLevelsChanged', (value) => {
        celLevels = value;
        celShader.use();
        gl.uniform1f(celShader.getUniform("uLevels"), celLevels);
    });

    editor.on('celEdgeThresholdChanged', (value) => {
        celEdgeThreshold = value;
        celShader.use();
        gl.uniform1f(celShader.getUniform("uEdgeThreshold"), celEdgeThreshold);
    });

    editor.on('sunChanged', (sunData) => {
        sun.direction = sunData.direction;
        sun.color = sunData.color;
    });

    editor.on('roomLightChanged', (lightData) => {
        roomLight.position = lightData.position;
        roomLight.color = lightData.color;
    });

    editor.on('objectAdded', async (data) => {
        let modelPath;
        let scale = [1, 1, 1];
        
        switch(data.properties.modelType) {
            case 'gun':
                modelPath = './models/gun.glb';
                scale = [1, 1, 1];
                break;
            case 'hang':
                modelPath = './models/hang.glb';
                scale = [0.02, 0.02, 0.02];
                break;
            case 'cube':
                modelPath = './models/cube.glb'; // You'll need to add this model
                break;
            case 'sphere':
                modelPath = './models/sphere.glb'; // You'll need to add this model
                break;
            default:
                modelPath = './models/gun.glb';
        }
        
        try {
            const newModel = await ModelInstance.addModel(
                gl, mainShader,
                modelPath,
                {
                    position: data.properties.position,
                    rotation: data.properties.rotation,
                    scale: scale
                }
            );
            
            newModel.editorId = data.id;
            modelInstances[data.id] = newModel;
            scene.addModel(newModel);
            
            // Add to editor list
            const objectList = document.getElementById('objectList');
            const item = document.createElement('div');
            item.className = 'object-item';
            item.dataset.id = data.id;
            item.textContent = `Object ${data.id}`;
            
            item.addEventListener('click', () => {
                document.querySelectorAll('.object-item').forEach(el => {
                    el.classList.remove('selected');
                });
                item.classList.add('selected');
                editor.selectObject(newModel);
            });
            
            objectList.appendChild(item);
            
        } catch (error) {
            console.error('Failed to load model:', error);
        }
    });

    editor.on('objectUpdated', (data) => {
        const model = modelInstances[data.id];
        if (model) {
            model.position = data.properties.position;
            model.rotation = data.properties.rotation;
            model.scale = data.properties.scale;
            model.updateMatrix();
        }
    });

    editor.on('objectDeleted', (id) => {
        const model = modelInstances[id];
        if (model) {
            scene.removeModel(model);
            delete modelInstances[id];
            
            // Remove from editor list
            const item = document.querySelector(`.object-item[data-id="${id}"]`);
            if (item) {
                item.remove();
            }
        }
    });

    editor.on('addLight', () => {
        // Add a new point light at camera position
        const newLight = addPointLight(
            sceneLights,
            [camera.position[0], camera.position[1], camera.position[2]],
            [1.0, 1.0, 1.0]
        );
        console.log('New light added:', newLight);
    });

    const keys = {};
    window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
    window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

    canvas.addEventListener('click', () => canvas.requestPointerLock());
    let pointerLocked = false;

    document.addEventListener('pointerlockchange', () => {
        pointerLocked = document.pointerLockElement === canvas;
    });

    document.addEventListener('mousemove', e => {
        if (!pointerLocked) return;
        camera.processMouse(e.movementX, e.movementY);
    });

    let gunRotate = 0;

    function loop() {
        shadowRenderer.render(sceneLights);
        
        postProcessor.begin();
        
        camera.move({
            forward: keys['w'],
            backward: keys['s'],
            left: keys['a'],
            right: keys['d'],
            up: keys[' '],
            down: keys['shift']
        });
        camera.updateViewMatrix();

        mainShader.use();
        lighting.upload();
        lighting.uploadShadows(shadowRenderer);

        gl.uniformMatrix4fv(mainShader.getUniform('mView'), false, camera.viewMatrix);

        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0.75, 0.85, 0.8, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);
        gl.frontFace(gl.CCW);

        skybox.draw(camera.viewMatrix, projection, sun.direction);

        gunRotate += 0.01;
        gun.rotation[2] = gunRotate;

        // const t = performance.now() * 0.0001;
        // sun.direction[0] = Math.sin(t);
        // sun.direction[2] = Math.cos(t);

        scene.draw();

        if (celShadingEnabled) {
            celShader.use();
            gl.uniform2fv(celShader.getUniform("uPixelSize"), [1 / canvas.width, 1 / canvas.height]);
            postProcessor.pass(celShader);
        }

        if (dofEnabled) {
            depthOfFieldShader.use();
            
            gl.uniform1f(depthOfFieldShader.getUniform("uNear"), 0.1);
            gl.uniform1f(depthOfFieldShader.getUniform("uFar"), 1000.0);
            gl.uniform1f(depthOfFieldShader.getUniform("uFocusDistance"), focusDistance);
            gl.uniform1f(depthOfFieldShader.getUniform("uFocusRange"), focusRange);
            gl.uniform1f(depthOfFieldShader.getUniform("uMaxBlur"), maxBlur);
            gl.uniform1f(depthOfFieldShader.getUniform("uBokehRadius"), bokehRadius);
            gl.uniform2f(depthOfFieldShader.getUniform("uResolution"), canvas.width, canvas.height);
            
            postProcessor.pass(depthOfFieldShader, {
                "uColor": postProcessor.getColorTexture(),
                "uDepth": postProcessor.getDepthTexture()
            });
        }

        tonemapShader.use();
        gl.uniform1i(tonemapShader.getUniform("uTonemap"), tonemapMode);
        gl.uniform1f(tonemapShader.getUniform("uExposure"), exposure);
        gl.uniform1f(tonemapShader.getUniform("uGamma"), gamma);

        postProcessor.pass(tonemapShader);
        
        // Apply anti-aliasing
        switch(antiAliasingMode) {
            case 'fxaa':
                postProcessor.end(fxaaShader);
                break;
            case 'smaa':
                postProcessor.end(smaaShader);
                break;
            case 'none':
            default:
                postProcessor.end();
                break;
        }

        requestAnimationFrame(loop);
    }

    loop();
}

main();

startFPSCounter(fps => {
    const fpsElement = document.getElementById('fps-counter') || (() => {
        const el = document.createElement('div');
        el.id = 'fps-counter';
        el.style.position = 'fixed';
        el.style.bottom = '10px';
        el.style.left = '10px';
        el.style.color = 'white';
        el.style.fontFamily = 'monospace';
        el.style.fontSize = '12px';
        el.style.padding = '5px 10px';
        el.style.background = 'rgba(0,0,0,0.5)';
        el.style.borderRadius = '3px';
        document.body.appendChild(el);
        return el;
    })();
    
    fpsElement.textContent = `FPS: ${fps.toFixed(1)}`;
});