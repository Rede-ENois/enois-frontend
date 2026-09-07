export function createProfileMediaOverlay(
  isOwnProfile: boolean,
  hovering: boolean,
  uploading: boolean,
  uploadingLabel: string,
  openFilePicker: () => void,
) {
  return {
    visible: isOwnProfile && hovering,
    disabled: uploading,
    label: uploading ? uploadingLabel : null,
    openFilePicker,
  };
}
