export class Entity {
    constructor() {
        this.position = [0, 0, 0];
        this.rotation = [0, 0, 0];
        this.scale = [1, 1, 1];
        this.active = true;
    }

    setPosition(x, y, z) {
        this.position = [x, y, z];
    }

    setRotation(x, y, z) {
        this.rotation = [x, y, z];
    }

    setScale(x, y, z) {
        this.scale = [x, y, z];
    }

    update(dt) {}
}