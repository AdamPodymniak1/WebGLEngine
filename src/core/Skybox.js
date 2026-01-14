import { loadText } from '../loaders/FileLoader.js';
import { Shader } from './Shader.js';

export async function createCubemap(gl, url) {
    const img = await loadImage(url);

    const faceSize = img.width / 4;
    if (img.height !== faceSize * 3) {
        throw new Error('Invalid cubemap cross layout');
    }

    const canvas = document.createElement('canvas');
    canvas.width = faceSize;
    canvas.height = faceSize;
    const ctx = canvas.getContext('2d');

    const faces = [
        { target: gl.TEXTURE_CUBE_MAP_POSITIVE_X, x: 2, y: 1 },
        { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X, x: 0, y: 1 },
        { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y, x: 1, y: 0 },
        { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, x: 1, y: 2 },
        { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z, x: 1, y: 1 },
        { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, x: 3, y: 1 }
    ];

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

    faces.forEach(face => {
        ctx.clearRect(0, 0, faceSize, faceSize);
        ctx.drawImage(
            img,
            face.x * faceSize,
            face.y * faceSize,
            faceSize,
            faceSize,
            0,
            0,
            faceSize,
            faceSize
        );

        gl.texImage2D(
            face.target,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            canvas
        );
    });

    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);

    return texture;
}

function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
}

export async function createSkybox(gl, url) {
    const cubemap = await createCubemap(gl, url);

    const vertexSrc = await loadText('../../shaders/skybox.vert.glsl');
    const fragmentSrc = await loadText('../../shaders/skybox.frag.glsl');
    const shader = new Shader(gl, vertexSrc, fragmentSrc);

    const vertices = new Float32Array([
        1, -1, -1,   1, -1,  1,   1,  1,  1,
        1, -1, -1,   1,  1,  1,   1,  1, -1,

        -1, -1,  1,  -1, -1, -1,  -1,  1, -1,
        -1, -1,  1,  -1,  1, -1,  -1,  1,  1,

        -1,  1, -1,   1,  1, -1,   1,  1,  1,
        -1,  1, -1,   1,  1,  1,  -1,  1,  1,

        -1, -1,  1,   1, -1,  1,   1, -1, -1,
        -1, -1,  1,   1, -1, -1,  -1, -1, -1,

        -1, -1,  1,  -1,  1,  1,   1,  1,  1,
        -1, -1,  1,   1,  1,  1,   1, -1,  1,

        1, -1, -1,   1,  1, -1,  -1,  1, -1,
        1, -1, -1,  -1,  1, -1,  -1, -1, -1
    ]);

    const vao = gl.createVertexArray();
    const vbo = gl.createBuffer();

    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const posLoc = shader.getAttrib('aPos');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);

    gl.bindVertexArray(null);

    return {
       draw(viewMatrix, projMatrix) {
            gl.depthMask(false);
            gl.depthFunc(gl.LEQUAL);

            gl.disable(gl.CULL_FACE);

            shader.use();

            const viewNoTranslate = viewMatrix.slice();
            viewNoTranslate[12] = 0;
            viewNoTranslate[13] = 0;
            viewNoTranslate[14] = 0;

            gl.uniformMatrix4fv(shader.getUniform('mView'), false, viewNoTranslate);
            gl.uniformMatrix4fv(shader.getUniform('mProj'), false, projMatrix);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubemap);
            gl.uniform1i(shader.getUniform('uSkybox'), 0);

            gl.bindVertexArray(vao);
            gl.drawArrays(gl.TRIANGLES, 0, 36);
            gl.bindVertexArray(null);

            gl.enable(gl.CULL_FACE);

            gl.depthMask(true);
            gl.depthFunc(gl.LESS);
        }
    };
}
