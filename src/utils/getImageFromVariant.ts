export const getImageFromVariant = (images: any[], variant: string) => {
  const imagesArr = images || [];
  return imagesArr.find((item) => item.variant === variant);
};
