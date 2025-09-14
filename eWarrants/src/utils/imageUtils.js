const defaultImage = require("../../assets/images/other.png");

export const getDefaultImageForCategory = (category) => {
  const categoryLower = category ? category.toLowerCase() : "other";

  switch (categoryLower) {
    case "electronics":
      return require("../../assets/images/electronics.png");

    case "home appliances": 
      return require("../../assets/images/home-appliances.png");

    case "accessories":
      return require("../../assets/images/accessories.png");

    case "fashion & clothing": 
      return require("../../assets/images/fashion.png");

    case "jewelry":
      return require("../../assets/images/jewelry.png");

    case "kids & toys": 
      return require("../../assets/images/toys.png");

    case "furniture":
      return require("../../assets/images/furniture.png");

    case "sports & fitness": 
      return require("../../assets/images/sports.png");

    case "automotive":
      return require("../../assets/images/automotive.png");

    case "health & personal care": 
      return require("../../assets/images/health.png");

    case "other":
      return require("../../assets/images/other.png");

    default:
      return defaultImage;
  }
};
