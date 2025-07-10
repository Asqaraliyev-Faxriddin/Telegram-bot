import Jimp from 'jimp/es';
import * as path from 'path';

export async function addTextToImage(firstname: string, lastname: string): Promise<boolean> {
  try {
    const fullName = `${firstname} ${lastname}`;
    const imagePath = path.join(process.cwd(), 'certificates', 'aa.jpeg');
    const savePath = path.join(process.cwd(), 'templates', 'top.jpeg');

    const image = await Jimp.read(imagePath);
    const font = await Jimp.loadFont(Jimp.FONT_SANS_64_BLACK);
    const text = fullName || 'Nomalum foydalanuvchi';
    const textWidth = Jimp.measureText(font, text);
    
        const centerX = (image.bitmap.width - textWidth) / 2;
    const centerY = 370;

    image.print(font, centerX, centerY, text);
    await image.writeAsync(savePath);

    return true;
  } catch (error) {
    console.error('❌ Rasmga yozishda xatolik:', error);
    return false;
  }

  
}
