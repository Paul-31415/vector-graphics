import * as UUID from "uuid/v4";


//https://mariusschulz.com/blog/typescript-2-2-mixin-classes
type Constructor<T = {}> = new (...args: any[]) => T;

function Saveable<TBase extends Constructor>(Base: TBase) {
    return class extends Base {
        toJSON(): string {

            return "foo";
        }

    };
}
