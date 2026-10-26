import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

/** The website's avatar upload resizes to this square before saving, so a data URL stays small. */
export const AVATAR_SIZE = 128;

export type AvatarPick =
  | { status: "picked"; image: string }
  | { status: "cancelled" }
  | { status: "denied" }
  | { status: "failed" };

/**
 * Lets the person choose or take a square photo and returns it as a 128 px JPEG data URL, the form
 * the website's avatar upload also stores in the user's `image`.
 */
export async function pickAvatar(source: "library" | "camera"): Promise<AvatarPick> {
  try {
    if (source === "camera") {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) return { status: "denied" };
    }
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 1 };
    const result =
      source === "camera" ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    const asset = result.canceled ? null : result.assets[0];
    if (!asset) return { status: "cancelled" };

    const resized = await ImageManipulator.manipulateAsync(
      asset.uri,
      [{ resize: { width: AVATAR_SIZE, height: AVATAR_SIZE } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true },
    );
    return resized.base64 ? { status: "picked", image: `data:image/jpeg;base64,${resized.base64}` } : { status: "failed" };
  } catch {
    return { status: "failed" };
  }
}
