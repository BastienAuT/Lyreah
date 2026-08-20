import { SOCIAL_IMAGE_ALT } from "@/site/constants";
import { createSocialImage, socialImageSize } from "@/site/social-image";

export const alt = SOCIAL_IMAGE_ALT;
export const size = socialImageSize;
export const contentType = "image/png";

export default function OpenGraphImage() {
  return createSocialImage();
}
