export class Scene {
    constructor(gl, shader) {
        this.gl = gl;
        this.shader = shader;
        this.models = [];
    }

    addModel(modelInstance) {
        this.models.push(modelInstance);
    }

    draw() {
        this.shader.use();
        for (const model of this.models) {
            model.draw(this.shader);
        }
    }
}
