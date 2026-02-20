const fs = require('fs');

const servicesDir = 'src/services/';
const files = fs.readdirSync(servicesDir).filter(f => f.endsWith('.ts'));

files.forEach(file => {
    const filePath = servicesDir + file;
    let content = fs.readFileSync(filePath, 'utf8');

    // Replace all instances of .map(doc => with .map((doc: any) =>
    const newContent = content.replace(/\.map\(doc =>/g, '.map((doc: any) =>');

    if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log('Fixed', file);
    }
});
