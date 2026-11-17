import {build} from 'esbuild';
import {writeFile} from 'node:fs/promises';
import {readFile,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
await build({entryPoints:['main.tsx'],bundle:true,minify:true,jsx:'automatic',outfile:'assets/app.js',define:{'process.env.NODE_ENV':'"production"'}});
const version=createHash('sha256').update(await readFile('assets/app.js')).update(await readFile('assets/app.css')).digest('hex').slice(0,12);
await writeFile('index.html','<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="Exchange administration workspace and comprehensive PowerShell cmdlet reference"><title>Exchange Operations Hub</title><link rel="stylesheet" href="./assets/app.css?v='+version+'"></head><body><div id="root"></div><script src="./assets/app.js?v='+version+'" defer></script></body></html>');
await copyFile('app/reference-stats.json','assets/reference/manifest.json');
await writeFile('.nojekyll','');
