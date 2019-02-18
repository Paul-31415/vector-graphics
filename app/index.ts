import * as PIXI from "pixi.js";

const app: PIXI.Application = new PIXI.Application(
    {
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: 0x000000,
        resolution: window.devicePixelRatio || 1,
        autoResize: true
    }
);

window.onresize = function(_event: UIEvent): void {
    app.renderer.resize(window.innerWidth, window.innerHeight);
};



document.body.appendChild(app.view);

const message: PIXI.Text = new PIXI.Text(
    'Hello Pixi!',
    { fontFamily: 'Arial', fontSize: 32, fill: 'white' }
);

message.anchor.x = 0.5;
message.anchor.y = 0.5;
app.stage.addChild(message);





function gameLoop(delta: number): void {
    message.position.set(window.innerWidth / 2, window.innerHeight / 2);
    message.rotation += delta / 100;
    app.renderer.resize(window.innerWidth, window.innerHeight);
}

app.ticker.add(gameLoop);
