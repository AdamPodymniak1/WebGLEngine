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
import { EditorManager } from './core/EditorManager.js';

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
    gun.id = 'gun';
    gun.name = 'Gun Model';
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
    hang.id = 'hang';
    hang.name = 'Hang Model';
    scene.addModel(hang);

    editor.init();

    editor.addObjectToUI(gun);
    editor.addObjectToUI(hang);

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
        
        if (skybox.updateProjection) {
            skybox.updateProjection(projection);
        }
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
        try {
            const newModel = await ModelInstance.addModel(
                gl, mainShader,
                data.properties.modelPath,
                {
                    position: data.properties.position,
                    rotation: data.properties.rotation,
                    scale: data.properties.scale
                }
            );
            
            if (!newModel) {
                console.error('ModelInstance.addModel returned null/undefined');
                return;
            }
            
            newModel.id = data.id;
            newModel.name = data.properties.fileName || `Object ${data.id}`;
            modelInstances[data.id] = newModel;
            
            if (scene.addModel) {
                scene.addModel(newModel);
            } else if (scene.models && Array.isArray(scene.models)) {
                scene.models.push(newModel);
            } else {
                console.error('Scene does not have addModel method or models array');
                return;
            }
            
            editor.addObjectToUI(newModel);
            editor.selectObject(newModel);
            
            console.log(`Added new object: ${data.id}`);
            
        } catch (error) {
            console.error('Failed to load model:', error);
            alert(`Failed to load model: ${error.message}`);
        }
    });

    editor.on('objectUpdated', (data) => {
        const model = modelInstances[data.id];
        if (model) {
            model.position = data.properties.position;
            model.rotation = data.properties.rotation;
            model.scale = data.properties.scale;
            
            if (data.properties.name !== undefined) {
                model.name = data.properties.name;
                editor.updateObjectName(data.id, data.properties.name);
            }
            
            if (model.updateMatrix) {
                model.updateMatrix();
            }
        }
    });

    editor.on('objectNameChanged', (data) => {
        const model = modelInstances[data.id];
        if (model) {
            model.name = data.name;
            editor.controls.objName.value = data.name;
        }
    });

    editor.on('objectDeleted', (id) => {
        const model = modelInstances[id];
        if (model) {
            if (scene.models && Array.isArray(scene.models)) {
                scene.models = scene.models.filter(m => m.id !== id);
            }
            delete modelInstances[id];
            editor.removeObjectFromUI(id);
        }
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
        el.style.zIndex = '1001';
        document.body.appendChild(el);
        return el;
    })();
    
    fpsElement.textContent = `FPS: ${fps.toFixed(1)}`;
});

window.addEventListener('resize', () => {
    const canvas = document.getElementById('game');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});