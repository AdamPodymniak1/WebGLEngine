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
    let exposure = 0.6;
    let gamma = 0.6;

    const vertexSrc = await loadText('./shaders/main/vertex.glsl');
    const fragmentSrc = await loadText('./shaders/main/fragment.glsl');
    const mainShader = new Shader(gl, vertexSrc, fragmentSrc);
    
    const postVertexSrc = await loadText('./shaders/postprocessing/post.vert.glsl');
    const tonemapFragmentSrc = await loadText('./shaders/postprocessing/tonemap.frag.glsl');
    const fxaaFragmentSrc = await loadText('./shaders/antialliasing/fxaa.frag.glsl');
    const smaaFragmentSrc = await loadText('./shaders/antialliasing/smaa.frag.glsl');
    const tonemapShader = new Shader(gl, postVertexSrc, tonemapFragmentSrc);
    const fxaaShader = new Shader(gl, postVertexSrc, fxaaFragmentSrc);
    const smaaShader = new Shader(gl, postVertexSrc, smaaFragmentSrc);

    const celFragmentSrc = await loadText('./shaders/postprocessing/cel_shading.frag.glsl');
    const celShader = new Shader(gl, postVertexSrc, celFragmentSrc);

    celShader.use();
    gl.uniform1f(celShader.getUniform("uLevels"), 12.0);
    gl.uniform1f(celShader.getUniform("uEdgeThreshold"), 0.3);
    gl.uniform3fv(celShader.getUniform("uEdgeColor"), [0,0,0]);
    gl.uniform2fv(celShader.getUniform("uPixelSize"), [1 / canvas.width, 1 / canvas.height]);
    
    const postProcessor = new PostProcessor(gl);

    const camera = new Camera();
    camera.updateViewMatrix();

    const projection = glMatrix.mat4.perspective(
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

    // const roomLight = addPointLight(
    //     sceneLights,
    //     [3, 1, -2],
    //     [0.5, 1.0, 0.5]
    // );

    // const spotLight = addSpotLight(
    //     sceneLights,
    //     [0, 0, 0],
    //     [0, 0, -1],
    //     [1.0, 1.0, 1.0]
    // );

    const lighting = new LightingSystem(gl, mainShader, camera, sceneLights);
    
    const shadowRenderer = new ShadowRenderer(gl, scene, camera);
    await shadowRenderer.init();

    const skybox = await createSkybox(gl, '../textures/skybox.png');

    const gun = await ModelInstance.addModel(
        gl, mainShader,
        './models/gun.glb',
        {
            position: [0, 0, 0],
            rotation: [1.5 * Math.PI, 0, 0],
            scale: [1, 1, 1]
        },
    );
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
    scene.addModel(hang);

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

        gunRotate+=0.01;
        gun.rotation[2] = gunRotate;

        // const t = performance.now() * 0.0001;
        // sun.direction[0] = Math.sin(t);
        // sun.direction[2] = Math.cos(t);

        scene.draw();

        tonemapShader.use();
        gl.uniform1i(tonemapShader.getUniform("uTonemap"), tonemapMode);
        gl.uniform1f(tonemapShader.getUniform("uExposure"), exposure);
        gl.uniform1f(tonemapShader.getUniform("uGamma"), gamma);

        //postProcessor.pass(celShader);
        postProcessor.pass(tonemapShader);
        //postProcessor.end(fxaaShader);
        postProcessor.end(smaaShader);

        requestAnimationFrame(loop);
    }

    loop();
}

main();

startFPSCounter(fps => console.log(`FPS: ${fps.toFixed(1)}`));