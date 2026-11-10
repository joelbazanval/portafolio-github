// Vigila las carpetas y ejecuta build.js en cada cambio. Uso: node watch.js
const { execFileSync } = require('child_process'), fs = require('fs'), path = require('path');
const build = path.join(__dirname, 'build.js');
let t; const run = () => { try { execFileSync(process.execPath, [build], { stdio: 'inherit' }); } catch (e) { console.error('Error en build.js'); } };
run();
fs.watch(__dirname, { recursive: true }, (_, f) => {
  if (!f || /content\.json|node_modules|\.git/.test(f)) return;
  clearTimeout(t); t = setTimeout(run, 300);
});
console.log('Vigilando cambios... (Ctrl+C para salir)');
