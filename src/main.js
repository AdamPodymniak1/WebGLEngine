import { Scene } from './scene/Scene.js';
import { ModelInstance } from './scene/ModelInstance.js';
import { addDirectionalLight, addPointLight, addSpotLight } from './core/Lighting.js';
import { loadJSON, loadText, loadTexture } from './loaders/FileLoader.js';
import { Shader } from './core/Shader.js';
import { Camera } from './core/Camera.js';
import { LightingSystem } from './scene/LightingSystem.js';

async function main() {
    const canvas = document.getElementById('game');
    canvas.width = 800;
    canvas.height = 800;

    const gl = canvas.getContext('webgl2');
    if (!gl) { alert('WebGL2 not supported'); return; }

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

    const scene = new Scene(gl, shader);

    const sceneLights = { dirLights: [], pointLights: [], spotLights: [] };
    addDirectionalLight(sceneLights, [3, 4, 2], [0.9, 0.9, 0.9]);
    addPointLight(sceneLights, [13, 5, 0], [1, 0.5, 0.5]);
    addPointLight(sceneLights, [0, -5, 0], [0.5, 1, 0.5]);
    addSpotLight(sceneLights, [2, 5, 2], [-1, -1, -1], [0.5, 0.5, 1]);

    const lighting = new LightingSystem(gl, shader, camera, sceneLights);

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
    
    await addModel(
        './models/penguin.json',
        './textures/Penguin.png',
        {
            position: [0, 0, 0], 
            rotation: [1.5 * Math.PI, 0, 0],
            scale: [2, 2, 2]
        }
    );
    await addModel(
        './models/gun.json',
        './textures/gun.jpg',
        {
            position: [2, -2, -1],
            rotation: [1.5 * Math.PI, 0, 1.5 * Math.PI],
            scale: [3, 3, 3]
        }
    );
    await addModel(
        './models/jes.json',
        './textures/jes.png',
        {
            position: [-6, -2, -1],
            rotation: [0, 0, 0],
            scale: [3, 3, 3]
        }
    );

    const keys = {};
    window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
    window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

    canvas.addEventListener('click', () => canvas.requestPointerLock());
    let pointerLocked = false;
    document.addEventListener('pointerlockchange', () => { pointerLocked = document.pointerLockElement === canvas; });
    document.addEventListener('mousemove', e => { if (!pointerLocked) return; camera.processMouse(e.movementX, e.movementY); });

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

        shader.use();
        lighting.upload();

        gl.uniformMatrix4fv(shader.getUniform('mView'), false, camera.viewMatrix);

        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0.75, 0.85, 0.8, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);
        gl.frontFace(gl.CCW);

        scene.models.forEach(model => {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, model.texture);
            gl.uniform1i(shader.getUniform('sampler'), 0);
        });

        scene.draw();
        requestAnimationFrame(loop);
    }

    loop();
}

main();