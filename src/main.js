import { Scene } from './scene/Scene.js';
import { ModelInstance } from './scene/ModelInstance.js';
import { addDirectionalLight, addPointLight, addSpotLight } from './core/Lighting.js';
import { loadText } from './loaders/FileLoader.js';
import { Shader } from './core/Shader.js';
import { Camera } from './core/Camera.js';
import { LightingSystem } from './scene/LightingSystem.js';
import { PostProcessor } from './core/PostProcessor.js';

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
    let exposure = 0.9;
    let gamma = 0.6;

    const vertexSrc = await loadText('./shaders/vertex.glsl');
    const fragmentSrc = await loadText('./shaders/fragment.glsl');
    const mainShader = new Shader(gl, vertexSrc, fragmentSrc);
    
    const postVertexSrc = await loadText('./shaders/post.vert.glsl');
    const tonemapFragmentSrc = await loadText('./shaders/tonemap.frag.glsl');
    const fxaaFragmentSrc = await loadText('./shaders/fxaa.frag.glsl');
    const tonemapShader = new Shader(gl, postVertexSrc, tonemapFragmentSrc);
    const fxaaShader = new Shader(gl, postVertexSrc, fxaaFragmentSrc);
    
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
        [3, -1, -2],
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

    // const hang = await ModelInstance.addModel(
    //     gl, mainShader,
    //     './models/hang.glb',
    //     {
    //         position: [0, 0, 0],
    //         rotation: [1.5 * Math.PI, 0, 0],
    //         scale: [0.02, 0.02, 0.02]
    //     },
    // );
    // scene.addModel(hang);

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

        gl.uniformMatrix4fv(mainShader.getUniform('mView'), false, camera.viewMatrix);

        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0.75, 0.85, 0.8, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);
        gl.frontFace(gl.CCW);

        gunRotate+=0.01;
        gun.rotation = [1.5 * Math.PI, 0, gunRotate],

        scene.draw();

        tonemapShader.use();
        gl.uniform1i(tonemapShader.getUniform("uTonemap"), tonemapMode);
        gl.uniform1f(tonemapShader.getUniform("uExposure"), exposure);
        gl.uniform1f(tonemapShader.getUniform("uGamma"), gamma);

        postProcessor.pass(tonemapShader);
        postProcessor.end(fxaaShader);

        requestAnimationFrame(loop);
    }

    loop();
}

main();