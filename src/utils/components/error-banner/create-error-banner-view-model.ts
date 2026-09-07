import { texts } from "@/texts";

export function createErrorBannerViewModel(
  visible: boolean,
  open: boolean,
  copied: boolean,
  detailCount: number,
) {
  return {
    visible,
    open,
    copied,
    showCopy: detailCount > 0,
    toggleLabel: open ? texts.errors.details.hide : texts.errors.details.show,
    copyLabel: copied ? texts.errors.details.copied : texts.errors.details.copy,
  };
}
