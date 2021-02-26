import "jasmine";
import { float_near } from "./float_difference";


describe("float_dif", () => {
    it("tests floating point 3i333i3ie differ", () => {
        expect(4).toEqual(4);
        expect(float_near(100, 100.0001, 0.00001)).toEqual(true);
        expect(float_near(100, 101.0001, 0.00001)).toEqual(false);
        expect(float_near(-100, 100, 0.00001)).toEqual(false);
        expect(float_near(0, 0, 0.00001)).toEqual(true);
        expect(float_near(127.99, 128.01, 0.00001)).toEqual(false);
        expect(float_near(127.99999, 128.00001, 0.00001)).toEqual(true);
    });
});
