# About this directory

All .js files in this directory are combined by simple concatination.
On top of that, the files are also injected into every file globally.

that means:
 - **DO NOT** run scheduled jobs or anything with sideffects. as they would run every file.
 - **DO NOT** put secrets or tokens into the code, they would be exposed to everyone.
 - **DO NOT** use any global js functions like: setTimeout, require, import. they DO NOT work
