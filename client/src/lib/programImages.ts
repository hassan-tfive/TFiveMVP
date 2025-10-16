import wellbeingImg from "@assets/generated_images/Wellbeing_program_abstract_background_8b262da7.png";
import recoveryImg from "@assets/generated_images/Recovery_program_abstract_background_ac13e09c.png";
import inclusionImg from "@assets/generated_images/Inclusion_program_abstract_background_17e057a0.png";
import focusImg from "@assets/generated_images/Focus_program_abstract_background_cffc6aef.png";

export const programImages = {
  wellbeing: wellbeingImg,
  recovery: recoveryImg,
  inclusion: inclusionImg,
  focus: focusImg,
};

export function getProgramImage(category: string): string {
  return programImages[category as keyof typeof programImages] || focusImg;
}
