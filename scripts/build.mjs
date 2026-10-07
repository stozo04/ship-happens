import {mkdir, copyFile, cp, rm} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});
await mkdir('dist',{recursive:true});
for (const file of ['index.html','favicon.svg','styles.css','clean.css','app.mjs','llms.txt']) await copyFile(file,`dist/${file}`);
await cp('lib','dist/lib',{recursive:true});
await cp('data','dist/data',{recursive:true});
