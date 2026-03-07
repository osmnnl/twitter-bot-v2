import type { Campaign } from "../../domain/product.js";

export const campaign: Campaign = {
  productId: "starbucks",
  bonus: "1 Adet İkram İçecek",
  packageDetail: "Starbucks referans koduyla üyelikte ikram içecek fırsatı sunulur.",
  priceHighlight: "1 İkram İçecek",
  textStrategy: "Kısa, sıcak ve paylaşılabilir ton tercih et.",
  hashtags: [
    "#Starbucks",
    "#Ikram"
  ],
  imagePath: "assets/images/starbucks.png",
  altText: "Starbucks kampanya görseli",
  mediaRequired: true
};
