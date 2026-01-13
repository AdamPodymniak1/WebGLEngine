export class LightingSystem {
    constructor(gl, shader, camera, lights) {
        this.gl = gl;
        this.shader = shader;
        this.camera = camera;
        this.lights = lights;
        this.ambient = [0.3, 0.3, 0.3];
    }

    upload() {
        const gl = this.gl;
        const shader = this.shader;
        const lights = this.lights;

        gl.uniform3fv(shader.getUniform('viewPos'), new Float32Array(this.camera.position));

        gl.uniform3fv(shader.getUniform('ambientLightIntensity'), new Float32Array(this.ambient));

        gl.uniform1i(shader.getUniform('numDirLights'), lights.dirLights.length);
        gl.uniform1i(shader.getUniform('numPointLights'), lights.pointLights.length);
        gl.uniform1i(shader.getUniform('numSpotLights'), lights.spotLights.length);

        lights.dirLights.forEach((l, i) => {
            gl.uniform3fv(shader.getUniform(`dirLights[${i}].direction`), new Float32Array(l.direction));
            gl.uniform3fv(shader.getUniform(`dirLights[${i}].color`), new Float32Array(l.color));
        });

        lights.pointLights.forEach((l, i) => {
            gl.uniform3fv(shader.getUniform(`pointLights[${i}].position`), new Float32Array(l.position));
            gl.uniform3fv(shader.getUniform(`pointLights[${i}].color`), new Float32Array(l.color));
            gl.uniform1f(shader.getUniform(`pointLights[${i}].constant`), l.constant);
            gl.uniform1f(shader.getUniform(`pointLights[${i}].linear`), l.linear);
            gl.uniform1f(shader.getUniform(`pointLights[${i}].quadratic`), l.quadratic);
        });

        lights.spotLights.forEach((l, i) => {
            gl.uniform3fv(shader.getUniform(`spotLights[${i}].position`), new Float32Array(l.position));
            gl.uniform3fv(shader.getUniform(`spotLights[${i}].direction`), new Float32Array(l.direction));
            gl.uniform3fv(shader.getUniform(`spotLights[${i}].color`), new Float32Array(l.color));
            gl.uniform1f(shader.getUniform(`spotLights[${i}].cutOff`), l.cutOff);
            gl.uniform1f(shader.getUniform(`spotLights[${i}].outerCutOff`), l.outerCutOff);
            gl.uniform1f(shader.getUniform(`spotLights[${i}].constant`), l.constant);
            gl.uniform1f(shader.getUniform(`spotLights[${i}].linear`), l.linear);
            gl.uniform1f(shader.getUniform(`spotLights[${i}].quadratic`), l.quadratic);
        });
    }
    
    uploadShadows(shadowRenderer) {
        const gl = this.gl;
        const shader = this.shader;
        
        if (shadowRenderer) {
            const shadowMapTex = shadowRenderer.getShadowMap().getTexture();
            gl.activeTexture(gl.TEXTURE5);
            gl.bindTexture(gl.TEXTURE_2D, shadowMapTex);
            gl.uniform1i(shader.getUniform("uShadowMap"), 5);
            
            gl.uniformMatrix4fv(
                shader.getUniform("mLightSpace"),
                false,
                shadowRenderer.getLightSpaceMatrix()
            );
            
            const settings = shadowRenderer.getSettings();
            gl.uniform1f(shader.getUniform("uShadowBias"), settings.bias);
            gl.uniform1i(shader.getUniform("uShadowSamples"), settings.samples);
            gl.uniform1f(shader.getUniform("uShadowSampleRadius"), settings.radius);
            gl.uniform1i(shader.getUniform("uShadowsEnabled"), 1);
        } else {
            gl.uniform1i(shader.getUniform("uShadowsEnabled"), 0);
        }
    }
}