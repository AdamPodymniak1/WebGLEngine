export class Scene {
    constructor(gl, shader) {
        this.gl = gl;
        this.shader = shader;

        this.models = [];

        this.lights = {
            dir: [],
            point: [],
            spot: []
        };
    }

    addModel(model) {
        this.models.push(model);
        return model;
    }

    addLight(light) {
        if (light.type === 'dir') this.lights.dir.push(light);
        if (light.type === 'point') this.lights.point.push(light);
        if (light.type === 'spot') this.lights.spot.push(light);
        return light;
    }

    draw() {
        this.shader.use();
        for (const model of this.models) {
            if (model.active) model.draw(this.shader);
        }
    }
}
