# about this directory

this directory contains all schemas for untrusted input, make sure its validated well.

all files in this directory must follow this import structure:
 1. `export const action: string` - action name to check
 2. `export const schema: joi.ObjectSchema<Input>` - schema to check the action against
 3. `export const run: (data: Input) => any)` - what it runs when the action is executed
