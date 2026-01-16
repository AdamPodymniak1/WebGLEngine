#version 300 es
precision highp float;

in vec2 vUV;
out vec4 fragColor;

uniform sampler2D uScene;
uniform vec2 uResolution;

void main() {
    vec2 texel = 1.0 / uResolution;

    vec3 rgbNW = texture(uScene, vUV + texel * vec2(-1.0, -1.0)).rgb;
    vec3 rgbNE = texture(uScene, vUV + texel * vec2( 1.0, -1.0)).rgb;
    vec3 rgbSW = texture(uScene, vUV + texel * vec2(-1.0,  1.0)).rgb;
    vec3 rgbSE = texture(uScene, vUV + texel * vec2( 1.0,  1.0)).rgb;
    vec3 rgbM  = texture(uScene, vUV).rgb;

    vec3 luma = vec3(0.299, 0.587, 0.114);
    float lumaNW = dot(rgbNW, luma);
    float lumaNE = dot(rgbNE, luma);
    float lumaSW = dot(rgbSW, luma);
    float lumaSE = dot(rgbSE, luma);
    float lumaM  = dot(rgbM,  luma);

    float lumaMin = min(lumaM, min(min(lumaNW, lumaNE), min(lumaSW, lumaSE)));
    float lumaMax = max(lumaM, max(max(lumaNW, lumaNE), max(lumaSW, lumaSE)));

    vec2 dir;
    dir.x = -((lumaNW + lumaNE) - (lumaSW + lumaSE));
    dir.y =  ((lumaNW + lumaSW) - (lumaNE + lumaSE));

    float dirReduce = max(
        (lumaNW + lumaNE + lumaSW + lumaSE) * 0.25 * 0.03125,
        0.0078125
    );

    float rcpDirMin = 1.0 / (min(abs(dir.x), abs(dir.y)) + dirReduce);
    dir = clamp(dir * rcpDirMin, vec2(-8.0), vec2(8.0)) * texel;

    vec3 rgbA = 0.5 * (
        texture(uScene, vUV + dir * (1.0 / 3.0 - 0.5)).rgb +
        texture(uScene, vUV + dir * (2.0 / 3.0 - 0.5)).rgb
    );

    vec3 rgbB = rgbA * 0.5 + 0.25 * (
        texture(uScene, vUV + dir * -0.5).rgb +
        texture(uScene, vUV + dir *  0.5).rgb
    );

    float lumaB = dot(rgbB, luma);

    fragColor = vec4(
        (lumaB < lumaMin || lumaB > lumaMax) ? rgbA : rgbB,
        1.0
    );
}
