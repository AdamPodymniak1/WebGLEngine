#version 300 es

in vec3 vertPosition;
in vec3 vertNormal;
in vec2 vertTexCoord;

out vec3 fragNormal;
out vec3 fragPosition;
out vec2 fragTexCoord;

uniform mat4 mWorld;
uniform mat4 mView;
uniform mat4 mProj;

void main() {
    fragPosition = (mWorld * vec4(vertPosition, 1.0)).xyz;
    fragNormal = mat3(transpose(inverse(mWorld))) * vertNormal;
    fragTexCoord = vertTexCoord;
    gl_Position = mProj * mView * mWorld * vec4(vertPosition, 1.0);
}
