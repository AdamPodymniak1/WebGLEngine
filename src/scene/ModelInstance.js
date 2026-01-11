import { Model } from '../loaders/ModelLoader.js';

export class ModelInstance {
    constructor(gl, modelData, shader, texture) {
        this.gl = gl;
        this.model = new Model(gl, modelData, shader);
        this.texture = texture;

        this.position = [0, 0, 0];
        this.rotation = [0, 0, 0];
        this.scale = [1, 1, 1];
    }

    setPosition(x, y, z) {
        this.position = [x, y, z];
    }

    setRotation(x, y, z) {
        this.rotation = [x, y, z];
    }

    setScale(x, y, z) {
        this.scale = [x, y, z];
    }

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
        const uWorld = shader.getUniform('mWorld');
        this.gl.uniformMatrix4fv(uWorld, false, this.getWorldMatrix());

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        const uSampler = shader.getUniform('uSampler');
        this.gl.uniform1i(uSampler, 0);

        this.model.draw();
    }
}
