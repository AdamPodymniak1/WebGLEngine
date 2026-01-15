import { ShadowMap } from '../scene/ShadowMap.js';
import { Shader } from '../core/Shader.js';

export class ShadowRenderer {
    constructor(gl, scene, camera) {
        this.gl = gl;
        this.scene = scene;
        this.camera = camera;
        
        this.shadowMap = new ShadowMap(gl, 2048, 2048);
        this.shadowShader = null;
        
        this.lightProjMatrix = glMatrix.mat4.create();
        this.lightViewMatrix = glMatrix.mat4.create();
        this.lightSpaceMatrix = glMatrix.mat4.create();
        
        this.shadowBias = 0.0005;
        this.shadowSamples = 2;
        this.shadowSampleRadius = 2.0;
        this.uShadowStrength = 0.7;
    }
    
    async init() {
        const vertexSrc = await this.loadShaderText('./shaders/shadow.vert.glsl');
        const fragmentSrc = await this.loadShaderText('./shaders/shadow.frag.glsl');
        this.shadowShader = new Shader(this.gl, vertexSrc, fragmentSrc);
    }
    
    async loadShaderText(url) {
        const response = await fetch(url);
        return await response.text();
    }
    
    render(lightDirection) {
        const gl = this.gl;
        
        const lightDir = glMatrix.vec3.create();
        glMatrix.vec3.normalize(lightDir, lightDirection);

        const center = this.camera.position;

        const lightDistance = 40.0;
        const lightPos = [
            center[0] - lightDir[0] * lightDistance,
            center[1] - lightDir[1] * lightDistance,
            center[2] - lightDir[2] * lightDistance
        ];

        const up = Math.abs(lightDir[1]) > 0.99 ? [0, 0, 1] : [0, 1, 0];

        glMatrix.mat4.lookAt(
            this.lightViewMatrix,
            lightPos,
            center,
            up
        );
        
        const size = 30.0;
        const near = 0.1;
        const far = 80.0;

        glMatrix.mat4.ortho(
            this.lightProjMatrix,
            -size, size,
            -size, size,
            near,
            far
        );
        
        glMatrix.mat4.multiply(this.lightSpaceMatrix, this.lightProjMatrix, this.lightViewMatrix);
        
        this.shadowMap.bind();
        
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.depthMask(true);
        
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.FRONT);
        
        this.shadowShader.use();
        
        gl.uniformMatrix4fv(
            this.shadowShader.getUniform("mLightProj"),
            false,
            this.lightProjMatrix
        );
        gl.uniformMatrix4fv(
            this.shadowShader.getUniform("mLightView"),
            false,
            this.lightViewMatrix
        );
        
        this.scene.models.forEach(modelInstance => {
            gl.uniformMatrix4fv(
                this.shadowShader.getUniform("mWorld"),
                false,
                modelInstance.getWorldMatrix()
            );
            
            modelInstance.model.drawShadow(gl, this.shadowShader);
        });
        
        this.shadowMap.unbind();
    }
    
    getLightSpaceMatrix() {
        return this.lightSpaceMatrix;
    }
    
    getShadowMap() {
        return this.shadowMap;
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
        this.shadowMap.dispose();
    }
}