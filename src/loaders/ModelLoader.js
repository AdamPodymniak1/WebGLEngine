export class Model {
    constructor(gl, modelData, shader) {
        this.gl = gl;
        this.indexCount = modelData.meshes[0].faces.flat().length;

        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        this.createVBO(
            modelData.meshes[0].vertices,
            3,
            shader.getAttrib('vertPosition')
        );

        this.createVBO(
            modelData.meshes[0].texturecoords[0],
            2,
            shader.getAttrib('vertTexCoord')
        );

        this.createVBO(
            modelData.meshes[0].normals,
            3,
            shader.getAttrib('vertNormal'),
            true
        );

        const indices = modelData.meshes[0].faces.flat();
        const ibo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

        gl.bindVertexArray(null);
    }

    createVBO(data, size, location, normalize = false) {
        if (location < 0) return;

        const gl = this.gl;
        const buffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
        gl.vertexAttribPointer(location, size, gl.FLOAT, normalize, 0, 0);
        gl.enableVertexAttribArray(location);
    }

    draw() {
        this.gl.bindVertexArray(this.vao);
        this.gl.drawElements(this.gl.TRIANGLES, this.indexCount, this.gl.UNSIGNED_SHORT, 0);
        this.gl.bindVertexArray(null);
    }
}
