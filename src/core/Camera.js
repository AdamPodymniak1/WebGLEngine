export class Camera {
    constructor() {
        this.position = glMatrix.vec3.fromValues(0, 0, 8);
        this.front = glMatrix.vec3.fromValues(0, 0, -1);
        this.up = glMatrix.vec3.fromValues(0, 1, 0);
        this.right = glMatrix.vec3.create();

        this.yaw = -90;
        this.pitch = 0;
        this.speed = 0.1;
        this.sensitivity = 0.2;

        this.viewMatrix = glMatrix.mat4.create();
        this.updateCameraVectors();
    }

    updateCameraVectors() {
        const front = [
            Math.cos(glMatrix.glMatrix.toRadian(this.yaw)) * Math.cos(glMatrix.glMatrix.toRadian(this.pitch)),
            Math.sin(glMatrix.glMatrix.toRadian(this.pitch)),
            Math.sin(glMatrix.glMatrix.toRadian(this.yaw)) * Math.cos(glMatrix.glMatrix.toRadian(this.pitch))
        ];
        glMatrix.vec3.normalize(this.front, front);

        glMatrix.vec3.cross(this.right, this.front, [0, 1, 0]);
        glMatrix.vec3.normalize(this.right, this.right);

        glMatrix.vec3.cross(this.up, this.right, this.front);
    }

    processMouse(dx, dy) {
        this.yaw += dx * this.sensitivity;
        this.pitch -= dy * this.sensitivity;
        this.pitch = Math.max(-89, Math.min(89, this.pitch));
        this.updateCameraVectors();
    }

    move(direction) {
        if (direction.forward)
            glMatrix.vec3.scaleAndAdd(this.position, this.position, this.front, this.speed);
        if (direction.backward)
            glMatrix.vec3.scaleAndAdd(this.position, this.position, this.front, -this.speed);
        if (direction.left)
            glMatrix.vec3.scaleAndAdd(this.position, this.position, this.right, -this.speed);
        if (direction.right)
            glMatrix.vec3.scaleAndAdd(this.position, this.position, this.right, this.speed);
        if (direction.up)
            glMatrix.vec3.scaleAndAdd(this.position, this.position, [0,1,0], this.speed);
        if (direction.down)
            glMatrix.vec3.scaleAndAdd(this.position, this.position, [0,1,0], -this.speed);
    }

    updateViewMatrix() {
        const target = glMatrix.vec3.create();
        glMatrix.vec3.add(target, this.position, this.front);
        glMatrix.mat4.lookAt(this.viewMatrix, this.position, target, this.up);
    }
}
