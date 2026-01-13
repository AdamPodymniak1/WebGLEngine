#version 300 es
precision mediump float;

struct DirectionalLight {
    vec3 direction;
    vec3 color;
};

struct PointLight {
    vec3 position;
    vec3 color;
    float constant;
    float linear;
    float quadratic;
};

struct SpotLight {
    vec3 position;
    vec3 direction;
    vec3 color;
    float cutOff;
    float outerCutOff;
    float constant;
    float linear;
    float quadratic;
};

#define MAX_DIR_LIGHTS 2
#define MAX_POINT_LIGHTS 4
#define MAX_SPOT_LIGHTS 2

in vec2 fragTexCoord;
in vec3 fragPosition;
in vec3 fragNormal;
in mat3 TBN;

uniform vec3 viewPos;
uniform vec3 ambientLightIntensity;

uniform DirectionalLight dirLights[MAX_DIR_LIGHTS];
uniform int numDirLights;

uniform PointLight pointLights[MAX_POINT_LIGHTS];
uniform int numPointLights;

uniform SpotLight spotLights[MAX_SPOT_LIGHTS];
uniform int numSpotLights;

uniform sampler2D sampler;
uniform sampler2D uNormalMap;
uniform sampler2D uMetalRoughness;
uniform sampler2D uAOMap;
uniform vec4 uBaseColorFactor;

uniform bool uUseNormalMap;
uniform bool uUseMetalRoughness;
uniform bool uUseAOMap;

uniform mediump sampler2DShadow uShadowMap;
uniform mat4 mLightSpace;
uniform float uShadowBias;
uniform int uShadowSamples;
uniform float uShadowSampleRadius;
uniform int uShadowsEnabled;

out vec4 outColor;

vec3 getNormal() {
    if (!uUseNormalMap) return normalize(fragNormal);
    vec3 n = texture(uNormalMap, fragTexCoord).xyz * 2.0 - 1.0;
    return normalize(TBN * n);
}

float getRoughness() {
    if (!uUseMetalRoughness) return 0.5;
    return texture(uMetalRoughness, fragTexCoord).g;
}

float getAO() {
    if (!uUseAOMap) return 1.0;
    return texture(uAOMap, fragTexCoord).r;
}

float calculateShadow(vec3 fragPos, vec3 normal) {
    if (uShadowsEnabled == 0) return 1.0;

    vec4 lightSpacePos = mLightSpace * vec4(fragPos, 1.0);

    vec3 projCoords = lightSpacePos.xyz / lightSpacePos.w;
    projCoords = projCoords * 0.5 + 0.5;

    if (projCoords.z < 0.0 || projCoords.z > 1.0 ||
        projCoords.x < 0.0 || projCoords.x > 1.0 ||
        projCoords.y < 0.0 || projCoords.y > 1.0)
        return 1.0;

    vec3 lightDir = normalize(-dirLights[0].direction);

    float ndotl = max(dot(normal, lightDir), 0.0);
    float bias = max(uShadowBias * (1.0 - ndotl), uShadowBias * 0.25);

    float shadow = 0.0;
    vec2 texelSize = 1.0 / vec2(textureSize(uShadowMap, 0));

    if (uShadowSamples > 1) {
        for (int x = -1; x <= 1; ++x) {
            for (int y = -1; y <= 1; ++y) {

                vec2 offset = vec2(x, y) * texelSize;
                vec2 uv = clamp(projCoords.xy + offset, 0.0, 1.0);

                shadow += texture(
                    uShadowMap,
                    vec3(uv, projCoords.z - bias)
                );
            }
        }
        shadow /= 9.0;
    } else {
        shadow = texture(
            uShadowMap,
            vec3(projCoords.xy, projCoords.z - bias)
        );
    }

    return shadow;
}

vec3 CalcDirectionalLight(DirectionalLight light, vec3 normal, vec3 viewDir, float roughness, float shadow) {
    vec3 lightDir = normalize(-light.direction);
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 reflectDir = reflect(-lightDir, normal);
    float specPower = mix(128.0, 8.0, roughness);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), specPower);
    return light.color * (diff + spec) * shadow;
}

vec3 CalcPointLight(PointLight light, vec3 normal, vec3 fragPos, vec3 viewDir, float roughness) {
    vec3 lightDir = normalize(light.position - fragPos);
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 reflectDir = reflect(-lightDir, normal);
    float specPower = mix(128.0, 8.0, roughness);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), specPower);
    float dist = length(light.position - fragPos);
    float attenuation = 1.0 / (light.constant + light.linear * dist + light.quadratic * dist * dist);
    return (diff + spec) * light.color * attenuation;
}

vec3 CalcSpotLight(SpotLight light, vec3 normal, vec3 fragPos, vec3 viewDir, float roughness) {
    vec3 lightDir = normalize(light.position - fragPos);
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 reflectDir = reflect(-lightDir, normal);
    float specPower = mix(128.0, 8.0, roughness);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), specPower);
    float theta = dot(lightDir, normalize(-light.direction));
    float epsilon = light.cutOff - light.outerCutOff;
    float intensity = clamp((theta - light.outerCutOff) / epsilon, 0.0, 1.0);
    float dist = length(light.position - fragPos);
    float attenuation = 1.0 / (light.constant + light.linear * dist + light.quadratic * dist * dist);
    return (diff + spec) * light.color * attenuation * intensity;
}

void main() {
    vec3 normal = getNormal();
    vec3 viewDir = normalize(viewPos - fragPosition);
    vec4 baseColor = texture(sampler, fragTexCoord) * uBaseColorFactor;

    if (baseColor.a < 0.1) discard;

    float roughness = getRoughness();
    float ao = getAO();

    float shadow = 1.0;
    if (numDirLights > 0 && uShadowsEnabled == 1) {
        shadow = calculateShadow(fragPosition, normal);
    }

    vec3 result = ambientLightIntensity * baseColor.rgb;

    for (int i = 0; i < numDirLights; i++) {
        float lightShadow = (i == 0) ? shadow : 1.0;
        result += CalcDirectionalLight(dirLights[i], normal, viewDir, roughness, lightShadow) * baseColor.rgb;
    }

    for (int i = 0; i < numPointLights; i++)
        result += CalcPointLight(pointLights[i], normal, fragPosition, viewDir, roughness) * baseColor.rgb;

    for (int i = 0; i < numSpotLights; i++)
        result += CalcSpotLight(spotLights[i], normal, fragPosition, viewDir, roughness) * baseColor.rgb;

    result *= ao;
    outColor = vec4(result, baseColor.a);
}
