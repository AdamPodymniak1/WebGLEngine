#version 300 es
precision highp float;

uniform sampler2D uScene;
uniform sampler2D uBlend;
uniform vec2 uResolution;

in vec2 vUV;
out vec4 fragColor;

void main() {
    vec2 texel = 1.0 / uResolution;

    vec4 color = texture(uScene, vUV);
    vec4 blend = texture(uBlend, vUV);

    if (blend.r > 0.0) {
        vec4 right = texture(uScene, vUV + vec2(texel.x, 0.0));
        color = mix(color, right, 0.5);
    }

    if (blend.g > 0.0) {
        vec4 down = texture(uScene, vUV + vec2(0.0, texel.y));
        color = mix(color, down, 0.5);
    }

    fragColor = color;
}
