export const avatarStyles = ['blue','green','purple','peach'];
export function validProfileName(value) { return typeof value === 'string' && value.trim().length >= 1 && value.trim().length <= 60; }
export function ownedAvatar(path, userId) { return typeof path === 'string' && path.startsWith(`${userId}/`) && /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$/.test(path); }
export function validateNewPassword(current, next, confirm) {
  if (!current) return 'Isi password saat ini.';
  if (next.length < 8 || next.length > 128) return 'Password baru harus 8 sampai 128 karakter.';
  if (current === next) return 'Password baru harus berbeda dari password saat ini.';
  if (next !== confirm) return 'Konfirmasi password baru belum sama.';
  return '';
}

export async function prepareAvatar(file) {
  if (!file || !['image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error('Pilih foto JPG, PNG, atau WebP.');
  if (file.size > 8 * 1024 * 1024) throw new Error('Ukuran foto maksimal 8 MB.');
  let image, objectUrl;
  try {
    if ('createImageBitmap' in window) image = await createImageBitmap(file);
    else {
      objectUrl = URL.createObjectURL(file);
      image = new Image(); image.src = objectUrl; await image.decode();
    }
    const width = image.width, height = image.height;
    if (!width || !height || width * height > 50_000_000) throw new Error('Dimensi foto terlalu besar atau tidak valid. Pilih foto yang lebih kecil.');
    const side = Math.min(width,height);
    const canvas = document.createElement('canvas'); canvas.width=512; canvas.height=512;
    const ctx=canvas.getContext('2d');
    if (!ctx) throw new Error('Foto belum bisa diproses pada browser ini.');
    ctx.fillStyle='#ffffff'; ctx.fillRect(0,0,512,512);
    ctx.drawImage(image,(width-side)/2,(height-side)/2,side,side,0,0,512,512);
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.9));
    if (!blob || blob.size>2*1024*1024) throw new Error('Foto belum bisa diproses. Coba foto lain.');
    return blob;
  } finally { image?.close?.(); if(objectUrl) URL.revokeObjectURL(objectUrl); }
}
