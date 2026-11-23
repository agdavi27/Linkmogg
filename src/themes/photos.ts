/**
 * Stock photos (Unsplash-licensed, served through picsum.photos and Next's image optimizer, so
 * visitors only ever load them from our own domain). Used as soft backdrops behind link icons
 * and as the snapshots on the Corkboard. Ids are stable, so a link always gets the same photo.
 */
export const PHOTO_IDS = [
  10, 11, 13, 14, 15, 16, 17, 18, 19, 20, 22, 24, 25, 27, 28, 29,
  33, 37, 39, 42, 43, 48, 49, 53, 54, 56, 57, 58, 59, 63, 64, 65,
];

export function photoUrl(id: number, size = 600) {
  return `https://picsum.photos/id/${id}/${size}/${size}`;
}
