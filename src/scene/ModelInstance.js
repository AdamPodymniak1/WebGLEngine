import { Entity } from "../scene/Entity.js";
import { Model } from "../loaders/ModelLoader.js";
import { GLBLoader } from "../loaders/GLBLoader.js";

export class ModelInstance extends Entity {
    constructor(gl, gltf, shader, textures) {
        super();
        this.gl = gl;
        this.gltf = gltf;
        this.textures = textures;

        this.uUVScale = [1, 1];
        this.uUVOffset = [0, 0];

        this.model = new Model(gl, gltf, shader, textures, this.uUVScale, this.uUVOffset);

        this.position = [0, 0, 0];
        this.rotation = [0, 0, 0];
        this.scale = [1, 1, 1];
    }

    setPosition(x, y, z) { this.position = [x, y, z]; }
    setRotation(x, y, z) { this.rotation = [x, y, z]; }
    setScale(x, y, z) { this.scale = [x, y, z]; }

    getWorldMatrix() {
        const mat = glMatrix.mat4.create();
        glMatrix.mat4.translate(mat, mat, this.position);
        glMatrix.mat4.rotateX(mat, mat, this.rotation[0]);
        glMatrix.mat4.rotateY(mat, mat, this.rotation[1]);
        glMatrix.mat4.rotateZ(mat, mat, this.rotation[2]);
        glMatrix.mat4.scale(mat, mat, this.scale);
        return mat;
    }

    draw(shader) {
        const gl = this.gl;

        gl.uniformMatrix4fv(shader.getUniform("mWorld"), false, this.getWorldMatrix());

        const uScaleLoc = shader.getUniform("uUVScale");
        const uOffsetLoc = shader.getUniform("uUVOffset");
        if (uScaleLoc !== -1) gl.uniform2fv(uScaleLoc, this.uUVScale);
        if (uOffsetLoc !== -1) gl.uniform2fv(uOffsetLoc, this.uUVOffset);

        this.model.draw(gl, shader);
    }

    static async addModel(gl, shader, glbUrl, options = {}) {
        const gltf = await GLBLoader.loadGLB(glbUrl);
        const textures = await ModelInstance.createWebGLTextures(gl, gltf);

        const instance = new ModelInstance(gl, gltf, shader, textures);

        if (options.position) instance.setPosition(...options.position);
        if (options.rotation) instance.setRotation(...options.rotation);
        if (options.scale) instance.setScale(...options.scale);

        if (options.uvScale) instance.uUVScale = options.uvScale;
        if (options.uvOffset) instance.uUVOffset = options.uvOffset;

        return instance;
    }

    static async createWebGLTextures(gl, gltf) {
        const textures = [];

        for (let i = 0; i < gltf.textures.length; i++) {
            const textureInfo = gltf.textures[i];

            if (!textureInfo || !textureInfo.image) {
                textures.push(null);
                continue;
            }

            const tex = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                textureInfo.image
            );
            gl.generateMipmap(gl.TEXTURE_2D);

            textures.push(tex);
        }

        return textures;
    }

    dispose() {
        if (this.textures) {
            this.textures.forEach(tex => {
                if (tex) this.gl.deleteTexture(tex);
            });
        }
        if (this.gltf) GLBLoader.disposeModel(this.gltf);
    }
}
