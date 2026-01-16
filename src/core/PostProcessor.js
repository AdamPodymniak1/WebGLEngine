export class PostProcessor {
    constructor(gl) {
        this.gl = gl;

        this.width = gl.canvas.width;
        this.height = gl.canvas.height;

        this.framebuffers = [];
        this.textures = [];
        this.depthTexture = null;
        this.depthBuffer = null;

        this.read = 0;
        this.write = 1;

        this.vao = null;
        this.vbo = null;

        this.initBuffers();
        this.initQuad();
    }

    initBuffers() {
        const gl = this.gl;

        this.framebuffers.length = 0;
        this.textures.length = 0;

        this.depthTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.depthTexture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.DEPTH_COMPONENT24,
            this.width,
            this.height,
            0,
            gl.DEPTH_COMPONENT,
            gl.UNSIGNED_INT,
            null
        );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        for (let i = 0; i < 2; i++) {
            const fbo = gl.createFramebuffer();
            const tex = gl.createTexture();

            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA16F,
                this.width,
                this.height,
                0,
                gl.RGBA,
                gl.FLOAT,
                null
            );

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

            gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
            gl.framebufferTexture2D(
                gl.FRAMEBUFFER,
                gl.COLOR_ATTACHMENT0,
                gl.TEXTURE_2D,
                tex,
                0
            );

            if (i === 0) {
                gl.framebufferTexture2D(
                    gl.FRAMEBUFFER,
                    gl.DEPTH_ATTACHMENT,
                    gl.TEXTURE_2D,
                    this.depthTexture,
                    0
                );
            }

            if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
                console.error("PostProcessor framebuffer incomplete");
            }

            this.framebuffers.push(fbo);
            this.textures.push(tex);
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    getColorTexture() {
        return this.textures[this.read];
    }

    getDepthTexture() {
        return this.depthTexture;
    }

    initQuad() {
        const gl = this.gl;

        const vertices = new Float32Array([
            -1, -1,  0, 0,
             1, -1,  1, 0,
            -1,  1,  0, 1,
             1,  1,  1, 1,
        ]);

        this.vao = gl.createVertexArray();
        this.vbo = gl.createBuffer();

        gl.bindVertexArray(this.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);

        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);

        gl.bindVertexArray(null);
    }

    begin() {
        const gl = this.gl;

        this.read = 0;
        this.write = 1;

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffers[this.read]);
        gl.viewport(0, 0, this.width, this.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }

    pass(shader, additionalTextures = {}) {
        const gl = this.gl;

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffers[this.write]);
        gl.viewport(0, 0, this.width, this.height);

        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);

        shader.use();

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.textures[this.read]);
        gl.uniform1i(shader.getUniform("uScene"), 0);

        for (const [name, texture] of Object.entries(additionalTextures)) {
            const unit = parseInt(name.replace(/\D/g, '')) || 1;
            gl.activeTexture(gl.TEXTURE0 + unit);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.uniform1i(shader.getUniform(name), unit);
        }

        const resLoc = shader.getUniform("uResolution");
        if (resLoc !== null) {
            gl.uniform2f(resLoc, this.width, this.height);
        }

        gl.bindVertexArray(this.vao);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.bindVertexArray(null);

        [this.read, this.write] = [this.write, this.read];
    }

    end(shader) {
        const gl = this.gl;

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, this.width, this.height);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);

        shader.use();

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.textures[this.read]);
        gl.uniform1i(shader.getUniform("uScene"), 0);

        const resLoc = shader.getUniform("uResolution");
        if (resLoc !== null) {
            gl.uniform2f(resLoc, this.width, this.height);
        }

        gl.bindVertexArray(this.vao);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.bindVertexArray(null);
    }

    resize() {
        this.width = this.gl.canvas.width;
        this.height = this.gl.canvas.height;
        this.initBuffers();
    }
}