/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as errors from "../../errors/index";
import * as Schematic from "../index";

export class InternalServerError extends errors.SchematicError {
    constructor(body: Schematic.ApiError) {
        super({
            message: "InternalServerError",
            statusCode: 500,
            body: body,
        });
        Object.setPrototypeOf(this, InternalServerError.prototype);
    }
}
