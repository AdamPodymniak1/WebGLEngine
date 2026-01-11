import { Scene } from './scene/Scene.js';
import { ModelInstance } from './scene/ModelInstance.js';
import { addDirectionalLight, addPointLight, addSpotLight } from './core/Lighting.js';
import { loadJSON, loadText, loadTexture } from './loaders/FileLoader.js';
import { Shader } from './core/Shader.js';
import { Camera } from './core/Camera.js';

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

    function uploadLights() {
        gl.uniform3fv(shader.getUniform('viewPos'), new Float32Array(camera.position));

        gl.uniform1i(shader.getUniform('numDirLights'), sceneLights.dirLights.length);
        gl.uniform1i(shader.getUniform('numPointLights'), sceneLights.pointLights.length);
        gl.uniform1i(shader.getUniform('numSpotLights'), sceneLights.spotLights.length);

        sceneLights.dirLights.forEach((l, i) => {
            gl.uniform3fv(shader.getUniform(`dirLights[${i}].direction`), new Float32Array(l.direction));
            gl.uniform3fv(shader.getUniform(`dirLights[${i}].color`), new Float32Array(l.color));
        });

        sceneLights.pointLights.forEach((l, i) => {
            gl.uniform3fv(shader.getUniform(`pointLights[${i}].position`), new Float32Array(l.position));
            gl.uniform3fv(shader.getUniform(`pointLights[${i}].color`), new Float32Array(l.color));
            gl.uniform1f(shader.getUniform(`pointLights[${i}].constant`), l.constant);
            gl.uniform1f(shader.getUniform(`pointLights[${i}].linear`), l.linear);
            gl.uniform1f(shader.getUniform(`pointLights[${i}].quadratic`), l.quadratic);
        });

        sceneLights.spotLights.forEach((l, i) => {
            gl.uniform3fv(shader.getUniform(`spotLights[${i}].position`), new Float32Array(l.position));
            gl.uniform3fv(shader.getUniform(`spotLights[${i}].direction`), new Float32Array(l.direction));
            gl.uniform3fv(shader.getUniform(`spotLights[${i}].color`), new Float32Array(l.color));
            gl.uniform1f(shader.getUniform(`spotLights[${i}].cutOff`), l.cutOff);
            gl.uniform1f(shader.getUniform(`spotLights[${i}].outerCutOff`), l.outerCutOff);
            gl.uniform1f(shader.getUniform(`spotLights[${i}].constant`), l.constant);
            gl.uniform1f(shader.getUniform(`spotLights[${i}].linear`), l.linear);
            gl.uniform1f(shader.getUniform(`spotLights[${i}].quadratic`), l.quadratic);
        });

        gl.uniform3fv(shader.getUniform('ambientLightIntensity'), new Float32Array([0.3, 0.3, 0.3]));
    }

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
        uploadLights();
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