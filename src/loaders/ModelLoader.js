export class Model {
    constructor(gl, gltf, shader, textures) {
        this.gl = gl;
        this.gltf = gltf;
        this.textures = textures;
        this.meshes = [];

        const { meshes } = gltf;

        meshes.forEach(mesh => {
            mesh.primitives.forEach(prim => {
                const { positions, normals, uvs, indices } = this.expandPrimitive(prim);

                const vao = gl.createVertexArray();
                gl.bindVertexArray(vao);

                if (positions.length) this.createVBO(gl, positions, 3, shader.getAttrib("vertPosition"));
                if (normals.length) this.createVBO(gl, normals, 3, shader.getAttrib("vertNormal"));
                if (uvs.length) this.createVBO(gl, uvs, 2, shader.getAttrib("vertTexCoord"));

                const ibo = gl.createBuffer();
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

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
                    indexCount: indices.length,
                    texture: webGLTexture
                });

                gl.bindVertexArray(null);
            });
        });
    }

    expandPrimitive(prim) {
        const pos = prim.attributes.POSITION || [];
        const norm = prim.attributes.NORMAL || [];
        const uv = prim.attributes.TEXCOORD_0 || [];
        const indices = prim.indices || [];

        const outPositions = [];
        const outNormals = [];
        const outUVs = [];
        const outIndices = [];

        for (let i = 0; i < indices.length; i++) {
            const idx = indices[i];

            outPositions.push(pos[idx * 3 + 0] || 0);
            outPositions.push(pos[idx * 3 + 1] || 0);
            outPositions.push(pos[idx * 3 + 2] || 0);

            if (norm.length) {
                outNormals.push(norm[idx * 3 + 0] || 0);
                outNormals.push(norm[idx * 3 + 1] || 0);
                outNormals.push(norm[idx * 3 + 2] || 0);
            }

            if (uv.length) {
                outUVs.push(uv[idx * 2 + 0] || 0);
                outUVs.push(uv[idx * 2 + 1] || 0);
            }

            outIndices.push(i);
        }

        return { positions: outPositions, normals: outNormals, uvs: outUVs, indices: outIndices };
    }

    createVBO(gl, data, size, location) {
        if (location < 0 || !data || !data.length) return;
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
        gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(location);
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
