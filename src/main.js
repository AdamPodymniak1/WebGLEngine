import { Scene } from './scene/Scene.js';
import { ModelInstance } from './scene/ModelInstance.js';
import { loadJSON, loadText, loadTexture } from './loaders/FileLoader.js';
import { Shader } from './core/Shader.js';
import { Camera } from './core/Camera.js';

async function main() {
    const canvas = document.getElementById('game');
    canvas.width = 800;
    canvas.height = 800;

    const gl = canvas.getContext('webgl2');
    if (!gl) {
        alert('WebGL2 not supported');
        return;
    }

    const vertexSrc = await loadText('./shaders/vertex.glsl');
    const fragmentSrc = await loadText('./shaders/fragment.glsl');

    const shader = new Shader(gl, vertexSrc, fragmentSrc);
    shader.use();

    const camera = new Camera();
    camera.updateViewMatrix();

    const projection = glMatrix.mat4.perspective(
        glMatrix.mat4.create(),
        glMatrix.glMatrix.toRadian(45),
        canvas.width / canvas.height,
        0.1,
        1000
    );

    gl.uniformMatrix4fv(shader.getUniform('mProj'), false, projection);
    gl.uniformMatrix4fv(shader.getUniform('mView'), false, camera.viewMatrix);

    gl.uniform3f(shader.getUniform('ambientLightIntensity'), 0.4, 0.4, 0.4);
    gl.uniform3f(shader.getUniform('sunDirection'), 3.0, 4.0, 2.0);
    gl.uniform3f(shader.getUniform('sunColor'), 0.9, 0.9, 0.9);

    gl.uniform1i(shader.getUniform('sampler'), 0);

    const scene = new Scene(gl, shader);

    async function addModel(modelUrl, textureUrl, options = {}) {
        const modelData = await loadJSON(modelUrl);
        const texture = await loadTexture(gl, textureUrl);

        const instance = new ModelInstance(gl, modelData, shader, texture);

        if (options.position) instance.setPosition(...options.position);
        if (options.rotation) instance.setRotation(...options.rotation);
        if (options.scale) instance.setScale(...options.scale);

        scene.addModel(instance);
        return instance;
    }

    await addModel('./models/penguin.json', './textures/Penguin.png', {
        position: [0, 0, 0],
        rotation: [1.5 * Math.PI, 0, 0],
        scale: [2, 2, 2]
    });

    await addModel('./models/Susan.json', './textures/SusanTexture.png', {
        position: [5, -4, -3],
        rotation: [1.5 * Math.PI, 0, 1.5 * Math.PI],
        scale: [1, 1, 1]
    });

    await addModel('./models/jes.json', './textures/jes.png', {
        position: [-2, -1, -1],
        rotation: [0, 0, 0],
        scale: [4, 4, 4]
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

    function loop() {
        camera.move({
            forward: keys['w'],
            backward: keys['s'],
            left: keys['a'],
            right: keys['d'],
            up: keys[' '],
            down: keys['shift']
        });

        camera.updateViewMatrix();
        gl.uniformMatrix4fv(shader.getUniform('mView'), false, camera.viewMatrix);

        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0.75, 0.85, 0.8, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);
        gl.frontFace(gl.CCW);

        scene.draw();

        requestAnimationFrame(loop);
    }

    loop();
}

main();
