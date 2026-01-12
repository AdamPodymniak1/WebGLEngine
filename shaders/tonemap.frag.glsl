#version 300 es
precision highp float;

in vec2 vUV;
out vec4 fragColor;

uniform sampler2D uScene;

vec3 tonemapACES(vec3 color) {
    const float A = 2.51;
    const float B = 0.03;
    const float C = 2.43;
    const float D = 0.59;
    const float E = 0.14;
    
    color = clamp(color, 0.0, 100.0);
    color = (color * (A * color + B)) / (color * (C * color + D) + E);
    return clamp(color, 0.0, 1.0);
}

vec3 tonemapFilmic(vec3 color) {
    color = max(vec3(0.0), color - 0.004);
    color = (color * (6.2 * color + 0.5)) / (color * (6.2 * color + 1.7) + 0.06);
    return color;
}

vec3 tonemapReinhard(vec3 color) {
    return color / (1.0 + color);
}

vec3 tonemapRomBinDaHouse(vec3 color)
{
    color = exp( -1.0 / ( 2.72*color + 0.15 ) );
	color = pow(color, vec3(1.0));
	return color;
}

vec3 tonemapLottes(vec3 color) {
    const vec3 a = vec3(1.6);
    const vec3 d = vec3(0.977);
    const vec3 hdrMax = vec3(8.0);
    const vec3 midIn = vec3(0.18);
    const vec3 midOut = vec3(0.267);

    const vec3 b = (-pow(midIn, a) + pow(hdrMax, a) * midOut) /
                   ((pow(hdrMax, a * d) - pow(midIn, a * d)) * midOut);
    const vec3 c = (pow(hdrMax, a * d) * pow(midIn, a) -
                   pow(hdrMax, a) * pow(midIn, a * d) * midOut) /
                   ((pow(hdrMax, a * d) - pow(midIn, a * d)) * midOut);

    color = pow(color, a);
    color = color / (pow(color, d) * b + c);
    return color;
}

vec3 applyGamma(vec3 color, float gamma) {
    return pow(color, vec3(1.0 / gamma));
}

void main() {
    vec3 color = texture(uScene, vUV).rgb;

    color = tonemapRomBinDaHouse(color * 1.2);
    color = applyGamma(color, 0.6);

    fragColor = vec4(color, 1.0);
}
