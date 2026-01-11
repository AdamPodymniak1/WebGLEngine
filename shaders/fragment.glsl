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

vec3 CalcDirectionalLight(DirectionalLight light, vec3 normal, vec3 viewDir, float roughness) {
    vec3 lightDir = normalize(-light.direction);
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 reflectDir = reflect(-lightDir, normal);
    float specPower = mix(128.0, 8.0, roughness);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), specPower);
    return light.color * (diff + spec);
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
    vec3 result = ambientLightIntensity * baseColor.rgb;
    
    for (int i = 0; i < numDirLights; i++)
        result += CalcDirectionalLight(dirLights[i], normal, viewDir, roughness) * baseColor.rgb;
    
    for (int i = 0; i < numPointLights; i++)
        result += CalcPointLight(pointLights[i], normal, fragPosition, viewDir, roughness) * baseColor.rgb;
    
    for (int i = 0; i < numSpotLights; i++)
        result += CalcSpotLight(spotLights[i], normal, fragPosition, viewDir, roughness) * baseColor.rgb;
    
    result *= ao;
    outColor = vec4(result, baseColor.a);
}