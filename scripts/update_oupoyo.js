const fs = require('fs'); 
const file = 'src/lib/ivory-coast-divisions.ts'; 
let content = fs.readFileSync(file, 'utf8'); 
const match = content.match(/export const divisions: Division = (\{[\s\S]*?\});\s*$/m); 
if(match) { 
    const divisions = eval('(' + match[1] + ')'); 
    divisions['Nawa']['Méagui']['Oupoyo'] = [
        "Dahili", 
        "Gblétia", 
        "Gnakoragui", 
        "Gnipi 2", 
        "Guéagui", 
        "Guiré", 
        "Ipouagui", 
        "Koréagui", 
        "Koréagui 2", 
        "N'driagui", 
        "Oupagui", 
        "Oupoyo (Chef-lieu de sous-préfecture)", 
        "Petit-Bondoukou", 
        "Robert-Porte", 
        "Sérigbangan"
    ]; 
    const newContent = 'export interface Division {\n  [region: string]: {\n    [department: string]: {\n      [subPrefecture: string]: string[];\n    };\n  };\n}\n\nexport const divisions: Division = ' + JSON.stringify(divisions, null, 2) + ';\n'; 
    fs.writeFileSync(file, newContent, 'utf8'); 
    console.log('Successfully updated Oupoyo'); 
} else { 
    console.log('Could not parse divisions'); 
}
