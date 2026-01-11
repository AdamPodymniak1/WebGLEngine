#version 300 es
precision highp float;

in vec3 vertPosition;
in vec3 vertNormal;
in vec2 vertTexCoord;
in vec4 vertTangent;

out vec2 fragTexCoord;
out vec3 fragPosition;
out vec3 fragNormal;
out mat3 TBN;

uniform mat4 mWorld;
uniform mat4 mView;
uniform mat4 mProj;

uniform vec2 uUVScale;
uniform vec2 uUVOffset;

void main() {
    vec4 worldPos = mWorld * vec4(vertPosition, 1.0);
    fragPosition = worldPos.xyz;
    fragNormal = normalize(mat3(mWorld) * vertNormal);
    fragTexCoord = vertTexCoord * uUVScale + uUVOffset;
    
    vec3 T = normalize(mat3(mWorld) * vertTangent.xyz);
    vec3 N = fragNormal;
    T = normalize(T - dot(T, N) * N);
    vec3 B = cross(N, T) * vertTangent.w;
    TBN = mat3(T, B, N);
    
    gl_Position = mProj * mView * worldPos;
}