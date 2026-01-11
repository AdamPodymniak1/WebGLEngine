export class Model {
    constructor(gl, gltf, shader, textures) {
        this.gl = gl;
        this.gltf = gltf;
        this.textures = textures;
        this.meshes = [];

        gltf.meshes.forEach(mesh => {
            mesh.primitives.forEach(prim => {
                const vao = gl.createVertexArray();
                gl.bindVertexArray(vao);

                this._createVBO(gl, prim.attributes.POSITION, 3, shader.getAttrib("vertPosition"));
                this._createVBO(gl, prim.attributes.NORMAL, 3, shader.getAttrib("vertNormal"));
                this._createVBO(gl, prim.attributes.TEXCOORD_0, 2, shader.getAttrib("vertTexCoord"));
                this._createVBO(gl, prim.attributes.TANGENT, 4, shader.getAttrib("vertTangent"));

                const ibo = gl.createBuffer();
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(prim.indices), gl.STATIC_DRAW);

                let baseColor = null;
                let normalMap = null;
                let metalRough = null;
                let aoMap = null;
                let baseColorFactor = [1, 1, 1, 1];

                const mat = prim.material;
                if (mat && mat.pbrMetallicRoughness) {
                    const pbr = mat.pbrMetallicRoughness;
                    baseColorFactor = pbr.baseColorFactor || baseColorFactor;
                    if (pbr.baseColorTexture) baseColor = textures[pbr.baseColorTexture.index];
                    if (mat.normalTexture) normalMap = textures[mat.normalTexture.index];
                    if (pbr.metallicRoughnessTexture) metalRough = textures[pbr.metallicRoughnessTexture.index];
                    if (mat.occlusionTexture) aoMap = textures[mat.occlusionTexture.index];
                }

                this.meshes.push({
                    vao,
                    indexCount: prim.indices.length,
                    baseColor,
                    normalMap,
                    metalRough,
                    aoMap,
                    baseColorFactor
                });

                gl.bindVertexArray(null);
            });
        });
    }

    _createVBO(gl, data, size, loc) {
        if (!data || loc < 0) return;
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
        gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(loc);
    }

    draw(gl, shader) {
        const uSampler = shader.getUniform("sampler");
        const uNormal = shader.getUniform("uNormalMap");
        const uMR = shader.getUniform("uMetalRoughness");
        const uAO = shader.getUniform("uAOMap");
        const uBaseFactor = shader.getUniform("uBaseColorFactor");
        const uUseNormal = shader.getUniform("uUseNormalMap");
        const uUseMR = shader.getUniform("uUseMetalRoughness");
        const uUseAO = shader.getUniform("uUseAOMap");

        this.meshes.forEach(mesh => {
            let unit = 0;

            gl.uniform4fv(uBaseFactor, mesh.baseColorFactor);

            if (mesh.baseColor) {
                gl.activeTexture(gl.TEXTURE0 + unit);
                gl.bindTexture(gl.TEXTURE_2D, mesh.baseColor);
                gl.uniform1i(uSampler, unit);
                unit++;
            }

            if (mesh.normalMap) {
                gl.activeTexture(gl.TEXTURE0 + unit);
                gl.bindTexture(gl.TEXTURE_2D, mesh.normalMap);
                gl.uniform1i(uNormal, unit);
                gl.uniform1i(uUseNormal, 1);
                unit++;
            } else {
                gl.uniform1i(uUseNormal, 0);
            }

            if (mesh.metalRough) {
                gl.activeTexture(gl.TEXTURE0 + unit);
                gl.bindTexture(gl.TEXTURE_2D, mesh.metalRough);
                gl.uniform1i(uMR, unit);
                gl.uniform1i(uUseMR, 1);
                unit++;
            } else {
                gl.uniform1i(uUseMR, 0);
            }

            if (mesh.aoMap) {
                gl.activeTexture(gl.TEXTURE0 + unit);
                gl.bindTexture(gl.TEXTURE_2D, mesh.aoMap);
                gl.uniform1i(uAO, unit);
                gl.uniform1i(uUseAO, 1);
                unit++;
            } else {
                gl.uniform1i(uUseAO, 0);
            }

            gl.bindVertexArray(mesh.vao);
            gl.drawElements(gl.TRIANGLES, mesh.indexCount, gl.UNSIGNED_SHORT, 0);
            gl.bindVertexArray(null);
        });
    }
}