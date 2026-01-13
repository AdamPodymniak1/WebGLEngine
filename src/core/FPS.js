export function startFPSCounter(updateCallback) {
    let lastTime = performance.now();
    let frameCount = 0;

    function tick() {
        frameCount++;
        const now = performance.now();
        const delta = now - lastTime;

        if (delta >= 1000) {
            const fps = frameCount / (delta / 1000);
            if (updateCallback) updateCallback(fps);
            frameCount = 0;
            lastTime = now;
        }

        requestAnimationFrame(tick);
    }

    tick();

    return {
        stop: () => { frameCount = 0; lastTime = performance.now(); }
    };
}
