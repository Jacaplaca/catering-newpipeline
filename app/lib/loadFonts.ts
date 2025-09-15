import fs from 'fs/promises';
import path from 'path';

let robotoRegular: Buffer | null = null;
let robotoBold: Buffer | null = null;
let robotoItalic: Buffer | null = null;
let robotoBoldItalic: Buffer | null = null;

export async function loadFonts() {
    if (!robotoRegular || !robotoBold || !robotoItalic || !robotoBoldItalic) {
        const fontsPath = path.join(process.cwd(), 'public', 'fonts');

        robotoRegular = await fs.readFile(path.join(fontsPath, 'roboto-regular.ttf'));
        robotoBold = await fs.readFile(path.join(fontsPath, 'roboto-bold.ttf'));
        robotoItalic = await fs.readFile(path.join(fontsPath, 'roboto-italic.ttf'));
        robotoBoldItalic = await fs.readFile(path.join(fontsPath, 'roboto-bold-italic.ttf'));
    }

    return {
        regular: robotoRegular,
        bold: robotoBold,
        italic: robotoItalic,
        boldItalic: robotoBoldItalic
    };
}