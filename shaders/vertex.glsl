#version 300 es
precision highp float;

in vec3 vertPosition;
in vec3 vertNormal;
in vec2 vertTexCoord;

out vec3 fragNormal;
out vec3 fragPosition;
out vec2 fragTexCoord;

uniform mat4 mWorld;
uniform mat4 mView;
uniform mat4 mProj;

uniform vec2 uUVOffset;
uniform vec2 uUVScale;

void main() {
    vec4 worldPos = mWorld * vec4(vertPosition, 1.0);
    fragPosition = worldPos.xyz;
    fragNormal = normalize(mat3(transpose(inverse(mWorld))) * vertNormal);

    fragTexCoord = vertTexCoord * uUVScale + uUVOffset;

    gl_Position = mProj * mView * worldPos;
}
