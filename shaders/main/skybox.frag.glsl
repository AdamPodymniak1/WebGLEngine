#version 300 es
precision mediump float;

in vec3 vDir;
out vec4 outColor;

uniform samplerCube uSkybox;

void main() {
    outColor = texture(uSkybox, normalize(vDir));
}
