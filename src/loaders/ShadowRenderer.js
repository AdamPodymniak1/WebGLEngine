import { ShadowMap } from '../scene/ShadowMap.js';
import { Shader } from '../core/Shader.js';

export class ShadowRenderer {
    constructor(gl, scene, camera) {
        this.gl = gl;
        this.scene = scene;
        this.camera = camera;
        
        this.shadowMaps = [];
        this.lightSpaces = [];
        this.lightViewMatrices = [];
        this.lightProjMatrices = [];
        
        this.shadowShader = null;
        this.maxShadowLights = 2;
        
        this.shadowBias = 0.0005;
        this.shadowSamples = 2;
        this.shadowSampleRadius = 2.0;
        this.uShadowStrength = 0.7;
    }
    
    async init() {
        const vertexSrc = await this.loadShaderText('./shaders/main/shadow.vert.glsl');
        const fragmentSrc = await this.loadShaderText('./shaders/main/shadow.frag.glsl');
        this.shadowShader = new Shader(this.gl, vertexSrc, fragmentSrc);
        
        for (let i = 0; i < this.maxShadowLights; i++) {
            this.shadowMaps.push(new ShadowMap(this.gl, 2048, 2048));
            this.lightSpaces.push(glMatrix.mat4.create());
            this.lightViewMatrices.push(glMatrix.mat4.create());
            this.lightProjMatrices.push(glMatrix.mat4.create());
        }
    }
    
    async loadShaderText(url) {
        const response = await fetch(url);
        return await response.text();
    }
    
    render(lights) {
        const gl = this.gl;
        
        const dirLights = lights.dirLights || [];
        const pointLights = lights.pointLights || [];
        const spotLights = lights.spotLights || [];
        
        const allLights = [...dirLights.slice(0, this.maxShadowLights)];
        
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.depthMask(true);
        gl.enable(gl.CULL_FACE);
        
        for (let i = 0; i < Math.min(allLights.length, this.maxShadowLights); i++) {
            const light = allLights[i];
            
            this.shadowMaps[i].bind();
            gl.cullFace(gl.FRONT);
            
            const center = this.camera.position;
            const lightDir = light.direction ? 
                glMatrix.vec3.normalize(glMatrix.vec3.create(), light.direction) :
                glMatrix.vec3.normalize(glMatrix.vec3.create(), [0, -1, 0]);
            
            const lightDistance = 40.0;
            const lightPos = [
                center[0] - lightDir[0] * lightDistance,
                center[1] - lightDir[1] * lightDistance,
                center[2] - lightDir[2] * lightDistance
            ];
            
            const up = Math.abs(lightDir[1]) > 0.99 ? [0, 0, 1] : [0, 1, 0];
            
            glMatrix.mat4.lookAt(
                this.lightViewMatrices[i],
                lightPos,
                center,
                up
            );
            
            const size = 30.0;
            const near = 0.1;
            const far = 80.0;
            
            glMatrix.mat4.ortho(
                this.lightProjMatrices[i],
                -size, size,
                -size, size,
                near,
                far
            );
            
            glMatrix.mat4.multiply(this.lightSpaces[i], this.lightProjMatrices[i], this.lightViewMatrices[i]);
            
            this.shadowShader.use();
            
            gl.uniformMatrix4fv(
                this.shadowShader.getUniform("mLightProj"),
                false,
                this.lightProjMatrices[i]
            );
            gl.uniformMatrix4fv(
                this.shadowShader.getUniform("mLightView"),
                false,
                this.lightViewMatrices[i]
            );
            
            this.scene.models.forEach(modelInstance => {
                gl.uniformMatrix4fv(
                    this.shadowShader.getUniform("mWorld"),
                    false,
                    modelInstance.getWorldMatrix()
                );
                
                modelInstance.model.drawShadow(gl, this.shadowShader);
            });
            
            this.shadowMaps[i].unbind();
        }
    }
    
    getLightSpaceMatrix(index) {
        return index < this.lightSpaces.length ? this.lightSpaces[index] : glMatrix.mat4.create();
    }
    
    getShadowMap(index) {
        return index < this.shadowMaps.length ? this.shadowMaps[index] : null;
    }
    
    getShadowMapCount() {
        return Math.min(this.shadowMaps.length, this.maxShadowLights);
    }
    
    getSettings() {
        return {
            bias: this.shadowBias,
            samples: this.shadowSamples,
            radius: this.shadowSampleRadius,
            strength: this.uShadowStrength
        };
    }
    
    dispose() {
        if (this.shadowShader) {
            this.shadowShader.dispose();
        }
        this.shadowMaps.forEach(map => map.dispose());
    }
}