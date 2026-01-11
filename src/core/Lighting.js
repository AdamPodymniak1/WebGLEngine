export class DirectionalLight {
    constructor(dir, color) {
        this.direction = dir;
        this.color = color;
    }
}

export class PointLight {
    constructor(pos, color, constant = 1, linear = 0.09, quadratic = 0.032) {
        this.position = pos;
        this.color = color;
        this.constant = constant;
        this.linear = linear;
        this.quadratic = quadratic;
    }
}

export class SpotLight {
    constructor(pos, dir, color, cutOff = 0.91, outerCutOff = 0.82, constant = 1, linear = 0.09, quadratic = 0.032) {
        this.position = pos;
        this.direction = dir;
        this.color = color;
        this.cutOff = cutOff;
        this.outerCutOff = outerCutOff;
        this.constant = constant;
        this.linear = linear;
        this.quadratic = quadratic;
    }
}

export function addDirectionalLight(sceneLights, dir, color) {
    const light = new DirectionalLight(dir, color);
    sceneLights.dirLights.push(light);
    return light;
}

export function addPointLight(sceneLights, pos, color, constant, linear, quadratic) {
    const light = new PointLight(pos, color, constant, linear, quadratic);
    sceneLights.pointLights.push(light);
    return light;
}

export function addSpotLight(sceneLights, pos, dir, color, cutOff, outerCutOff, constant, linear, quadratic) {
    const light = new SpotLight(pos, dir, color, cutOff, outerCutOff, constant, linear, quadratic);
    sceneLights.spotLights.push(light);
    return light;
}
