export class Model {
    constructor(gl, gltf, shader, textures) {
        this.gl = gl;
        this.gltf = gltf;
        this.textures = textures;
        this.meshes = [];

        const { meshes } = gltf;

        meshes.forEach(mesh => {
            mesh.primitives.forEach(prim => {
                const vao = gl.createVertexArray();
                gl.bindVertexArray(vao);

                if (prim.attributes.POSITION) {
                    const buffer = gl.createBuffer();
                    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
                    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(prim.attributes.POSITION), gl.STATIC_DRAW);
                    const loc = shader.getAttrib("vertPosition");
                    if (loc >= 0) {
                        gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 0, 0);
                        gl.enableVertexAttribArray(loc);
                    }
                }

                if (prim.attributes.NORMAL) {
                    const buffer = gl.createBuffer();
                    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
                    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(prim.attributes.NORMAL), gl.STATIC_DRAW);
                    const loc = shader.getAttrib("vertNormal");
                    if (loc >= 0) {
                        gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 0, 0);
                        gl.enableVertexAttribArray(loc);
                    }
                }

                if (prim.attributes.TEXCOORD_0) {
                    const buffer = gl.createBuffer();
                    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
                    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(prim.attributes.TEXCOORD_0), gl.STATIC_DRAW);
                    const loc = shader.getAttrib("vertTexCoord");
                    if (loc >= 0) {
                        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
                        gl.enableVertexAttribArray(loc);
                    }
                }

                const ibo = gl.createBuffer();
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(prim.indices), gl.STATIC_DRAW);

                let webGLTexture = null;
                if (prim.material && prim.material.pbrMetallicRoughness) {
                    const baseColorTexture = prim.material.pbrMetallicRoughness.baseColorTexture;
                    if (baseColorTexture && baseColorTexture.index !== undefined) {
                        const texInfo = gltf.textures[baseColorTexture.index];
                        if (texInfo) webGLTexture = textures[baseColorTexture.index];
                    }
                }

                this.meshes.push({
                    vao,
                    indexCount: prim.indices.length,
                    texture: webGLTexture
                });

                gl.bindVertexArray(null);
            });
        });
    }

    draw(gl, shader) {
        const samplerLoc = shader.getUniform("sampler");

        this.meshes.forEach(mesh => {
            if (mesh.texture) {
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, mesh.texture);
                if (samplerLoc !== -1) gl.uniform1i(samplerLoc, 0);
            }

            gl.bindVertexArray(mesh.vao);
            gl.drawElements(gl.TRIANGLES, mesh.indexCount, gl.UNSIGNED_SHORT, 0);
            gl.bindVertexArray(null);
        });
    }
}