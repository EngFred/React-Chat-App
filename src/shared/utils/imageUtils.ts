/**
 * Resizes an image file using a canvas element.
 * @param imageFile The original image File object.
 * @param maxWidth The maximum width for the resized image.
 * @param maxHeight The maximum height for the resized image.
 * @param quality The quality of the output image (0.0 to 1.0). Default is 0.8.
 * @returns A Promise that resolves with the resized image as a new File object.
 */
export const resizeImageFile = (
  imageFile: File,
  maxWidth: number,
  maxHeight: number,
  quality: number = 0.8
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(imageFile);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Could not get 2D context from canvas.'));
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert canvas content to a Blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Create a new File object from the Blob
              const resizedFile = new File([blob], imageFile.name, {
                type: imageFile.type,
                lastModified: Date.now(),
              });
              resolve(resizedFile);
            } else {
              reject(new Error('Canvas to Blob conversion failed.'));
            }
          },
          imageFile.type,
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};