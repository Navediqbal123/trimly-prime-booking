import { ActionSheet, ActionSheetButtonStyle } from '@capacitor/action-sheet';
import { Camera, MediaTypeSelection } from '@capacitor/camera';

export interface PickedImage {
  file: File;
  previewUrl: string;
}

export interface PickImagesOptions {
  allowMultiple?: boolean;
  limit?: number;
}

async function toPickedImage(
  result: Awaited<ReturnType<typeof Camera.takePhoto>>,
  index: number,
): Promise<PickedImage> {
  if (!result.webPath) {
    throw new Error('The selected image could not be opened. Please try again.');
  }

  const response = await fetch(result.webPath);
  if (!response.ok) {
    throw new Error('The selected image could not be read. Please try again.');
  }

  const blob = await response.blob();
  const format = result.metadata?.format?.toLowerCase();
  const fallbackType = format === 'png' ? 'image/png' : 'image/jpeg';
  const type = blob.type.startsWith('image/') ? blob.type : fallbackType;
  const extension = type === 'image/png' ? 'png' : 'jpg';
  const file = new File(
    [blob],
    `trimly-photo-${Date.now()}-${index}.${extension}`,
    { type },
  );

  return { file, previewUrl: result.webPath };
}

function isPickerCancelled(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  return message.includes('cancel');
}

export async function pickNativeImages(
  { allowMultiple = false, limit = 1 }: PickImagesOptions = {},
): Promise<PickedImage[]> {
  try {
    const { index } = await ActionSheet.showActions({
      title: 'Add photo',
      options: [
        { title: 'Take Photo' },
        { title: 'Choose from Gallery' },
        { title: 'Cancel', style: ActionSheetButtonStyle.Cancel },
      ],
    });

    if (index === 0) {
      const result = await Camera.takePhoto({
        quality: 90,
        includeMetadata: true,
      });
      return [await toPickedImage(result, 0)];
    }

    if (index === 1) {
      const { results } = await Camera.chooseFromGallery({
        mediaType: MediaTypeSelection.Photo,
        allowMultipleSelection: allowMultiple,
        ...(allowMultiple ? { limit } : {}),
        quality: 90,
        includeMetadata: true,
      });

      return Promise.all(results.map(toPickedImage));
    }

    return [];
  } catch (error) {
    if (isPickerCancelled(error)) return [];
    throw error;
  }
}
