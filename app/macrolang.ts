import * as ts from "typescript";
import { Saveable } from "./save";
import { Drawable, Graphic } from "./drawable";
import { Transform } from "./Transform";
import { Point } from "./vectors";

interface MacroLangNode extends Drawable {//, Drawable {
    run: () => void;
    next?: MacroLangNode;
    inputs: Array<MacroLangInput<object>>;
    outputs: Array<MacroLangOutput<object>>;
}


interface MacroLangIOGraphic extends Drawable {
    port: Point;
}


@Saveable.register
class MacroLangOutput<T> implements Drawable {
    _saveName: string;
    constructor(public graphic: MacroLangIOGraphic) {

    }
    draw(t: Transform<Point, Point> | null): Graphic {
        return this.graphic.draw(t);
    }
    drawOn(g: PIXI.Graphics, t: Transform<Point, Point> | null): PIXI.Graphics {
        return this.graphic.drawOn(g, t);
    }

}

@Saveable.register
class MacroLangInput<T> implements Drawable {
    _saveName: string;
    constructor(public graphic: MacroLangIOGraphic) {

    }
    draw(t: Transform<Point, Point> | null): Graphic {
        return this.graphic.draw(t);
    }
    drawOn(g: PIXI.Graphics, t: Transform<Point, Point> | null): PIXI.Graphics {
        return this.graphic.drawOn(g, t);
    }
}


interface MacroLangEdgeGraphic extends Drawable {

}



@Saveable.register
class MacroLangEdge<T> implements Drawable {
    _saveName: string;
    constructor(public start: MacroLangOutput<T>, public end: MacroLangInput<T>, public graphic: Drawable) {
    }
    draw(t: Transform<Point, Point> | null): Graphic {
        return this.graphic.draw(t);
    }
    drawOn(g: PIXI.Graphics, t: Transform<Point, Point> | null): PIXI.Graphics {
        return this.graphic.drawOn(g, t);
    }
}

//hooks?

/*
@Saveable.register
class Constant<T> implements MacroLangNode {

}


@Saveable.register
class TSFunction implements MacroLangNode {

    _saveIgnore = new Set<string>(["_code_transpiled"]);
    _saveName: string;

    private _code: string;
    private _code_transpiled: string;

    constructor() {
    }

    set code(c: string) {
        this._code = c;
        this._code_transpiled = ts.transpile(c);
    }
    get code(): string {
        return this._code;
    }
    run(): void {

    }

}

class Function implements MacroLangNode {


}
*/


export { }
