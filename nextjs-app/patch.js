const fs = require('fs');
const path = require('path');

function check(d) {
    const files = fs.readdirSync(d);
    for (let f of files) {
        let p = path.join(d, f);
        if (fs.statSync(p).isDirectory()) {
            check(p);
        }
        else if (f === 'route.ts') {
            let c = fs.readFileSync(p, 'utf8');
            if (!c.includes('force-dynamic')) {
                fs.writeFileSync(p, `export const dynamic = 'force-dynamic';\n` + c, 'utf8');
                fs.appendFileSync('out.txt', 'Fixed: ' + p + '\n');
            }
        }
    }
}
try {
    fs.writeFileSync('out.txt', 'Started\n');
    check(path.join(__dirname, 'src', 'app', 'api'));
    fs.appendFileSync('out.txt', 'Done\n');
} catch (e) {
    fs.appendFileSync('out.txt', 'Error: ' + e.message + '\n');
}
