#version 300 es
precision highp float;

in vec2 vUV;
out vec4 fragColor;

uniform sampler2D tDiffuse;
uniform float uLevels;
uniform float uEdgeThreshold;
uniform vec3 uEdgeColor;
uniform vec2 uPixelSize;

void main() {
    vec3 color = texture(tDiffuse, vUV).rgb;
    color = floor(color * uLevels) / uLevels;

    vec3 center = color;
    float edge = 0.0;

    for(int x=-1; x<=1; x++){
        for(int y=-1; y<=1; y++){
            if(x==0 && y==0) continue;
            vec2 offset = vec2(float(x), float(y)) * uPixelSize;
            vec3 sampleColor = texture(tDiffuse, vUV + offset).rgb;
            edge += length(center - sampleColor);
        }
    }

    edge /= 8.0;

    if(edge > uEdgeThreshold){
        color = uEdgeColor;
    }

    fragColor = vec4(color, 1.0);
}
