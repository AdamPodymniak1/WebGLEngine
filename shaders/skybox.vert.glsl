#version 300 es
precision mediump float;

in vec3 aPos;
out vec3 vDir;

uniform mat4 mView;
uniform mat4 mProj;

void main() {
    vDir = aPos;
    vec4 pos = mProj * mView * vec4(aPos, 1.0);
    gl_Position = pos.xyww;
}