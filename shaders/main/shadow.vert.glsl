#version 300 es
precision highp float;

in vec3 vertPosition;

uniform mat4 mLightView;
uniform mat4 mLightProj;
uniform mat4 mWorld;

void main() {
    vec4 worldPos = mWorld * vec4(vertPosition, 1.0);
    gl_Position = mLightProj * mLightView * worldPos;
}