#version 300 es
precision mediump float;

in vec2 fragTexCoord;
in vec3 fragNormal;

uniform vec3 ambientLightIntensity;
uniform vec3 sunDirection;
uniform vec3 sunColor;
uniform sampler2D sampler;

out vec4 outColor;

void main() {
    vec3 N = normalize(fragNormal);
    vec3 L = normalize(sunDirection);

    vec4 texel = texture(sampler, fragTexCoord);

    float diffuse = max(dot(N, L), 0.0);
    vec3 lighting = ambientLightIntensity + sunColor * diffuse;

    outColor = vec4(texel.rgb * lighting, texel.a);
}
