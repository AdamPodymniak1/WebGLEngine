#version 300 es
precision highp float;

in vec2 vUV;
out vec4 fragColor;

uniform sampler2D uScene;
uniform int uTonemap;
uniform float uExposure;
uniform float uGamma;

vec3 tonemapACES(vec3 x) {
    const float A = 2.51;
    const float B = 0.03;
    const float C = 2.43;
    const float D = 0.59;
    const float E = 0.14;
    return clamp((x * (A * x + B)) / (x * (C * x + D) + E), 0.0, 1.0);
}

vec3 tonemapFilmic(vec3 x) {
    x = max(vec3(0.0), x - 0.004);
    return (x * (6.2 * x + 0.5)) / (x * (6.2 * x + 1.7) + 0.06);
}

vec3 tonemapReinhard(vec3 x) {
    return x / (1.0 + x);
}

vec3 tonemapRomBinDaHouse(vec3 x) {
    return exp(-1.0 / (2.72 * x + 0.15));
}

vec3 tonemapLottes(vec3 x) {
    const vec3 a = vec3(1.6);
    const vec3 d = vec3(0.977);
    const vec3 hdrMax = vec3(8.0);
    const vec3 midIn = vec3(0.18);
    const vec3 midOut = vec3(0.267);

    vec3 b = (-pow(midIn, a) + pow(hdrMax, a) * midOut) /
             ((pow(hdrMax, a * d) - pow(midIn, a * d)) * midOut);
    vec3 c = (pow(hdrMax, a * d) * pow(midIn, a) -
             pow(hdrMax, a) * pow(midIn, a * d) * midOut) /
             ((pow(hdrMax, a * d) - pow(midIn, a * d)) * midOut);

    x = pow(x, a);
    return x / (pow(x, d) * b + c);
}

vec3 applyGamma(vec3 color) {
    return pow(color, vec3(1.0 / uGamma));
}

void main() {
    vec3 color = texture(uScene, vUV).rgb;

    color *= uExposure;

    if (uTonemap == 0) color = tonemapACES(color);
    else if (uTonemap == 1) color = tonemapFilmic(color);
    else if (uTonemap == 2) color = tonemapReinhard(color);
    else if (uTonemap == 3) color = tonemapRomBinDaHouse(color);
    else if (uTonemap == 4) color = tonemapLottes(color);

    color = applyGamma(color);

    fragColor = vec4(color, 1.0);
}
