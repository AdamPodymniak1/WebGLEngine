#version 300 es
precision highp float;

in vec2 vUV;
out vec4 fragColor;

uniform sampler2D uScene;
uniform sampler2D uDepth;

uniform float uNear;
uniform float uFar;
uniform float uFocusDistance;
uniform float uFocusRange;
uniform float uMaxBlur;
uniform vec2 uResolution;
uniform float uBokehRadius;

float linearizeDepth(float depth) {
    float z = depth * 2.0 - 1.0;
    return (2.0 * uNear * uFar) / (uFar + uNear - z * (uFar - uNear));
}

float computeCoC(float linearDepth) {
    float distanceFromFocus = abs(linearDepth - uFocusDistance);
    float coc = distanceFromFocus / uFocusRange;
    coc = clamp(coc, 0.0, 1.0);
    
    coc = coc * coc * (3.0 - 2.0 * coc);
    
    return coc;
}

vec2 circleSample(int i, int sampleCount) {
    float angle = float(i) * (3.14159265359 * 2.0) / float(sampleCount);
    return vec2(cos(angle), sin(angle));
}

vec2 hexSample(int i) {
    float angle = float(i) * (3.14159265359 * 2.0) / 6.0;
    return vec2(cos(angle), sin(angle)) * 0.5;
}

void main() {
    vec3 centerColor = texture(uScene, vUV).rgb;
    float depth = texture(uDepth, vUV).r;
    float linearDepth = linearizeDepth(depth);
    
    float coc = computeCoC(linearDepth);
    float blurRadius = coc * uMaxBlur;
    
    if (blurRadius < 0.01) {
        fragColor = vec4(centerColor, 1.0);
        return;
    }
    
    vec2 texel = 1.0 / uResolution;
    vec3 color = vec3(0.0);
    float totalWeight = 0.0;
    
    int samples = 16;
    int rings = 3;
    
    for (int ring = 1; ring <= rings; ring++) {
        for (int i = 0; i < samples; i++) {
            vec2 sampleOffset = circleSample(i, samples) * float(ring);
            
            float dist = length(sampleOffset);
            if (dist > uBokehRadius) {
                sampleOffset = normalize(sampleOffset) * uBokehRadius;
            }
            
            vec2 offset = sampleOffset * blurRadius * texel;
            
            float weight = exp(-dist * dist / (2.0 * float(ring)));
            
            color += texture(uScene, vUV + offset).rgb * weight;
            totalWeight += weight;
        }
    }
    
    color += centerColor * 2.0;
    totalWeight += 2.0;
    
    color /= totalWeight;
    
    float blendFactor = smoothstep(0.0, 0.3, coc);
    color = mix(centerColor, color, blendFactor);
    
    fragColor = vec4(color, 1.0);
}