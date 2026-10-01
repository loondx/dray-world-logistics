import { optionalText } from "./fields";

export const COUNTRY_OPTIONS = ["USA", "Canada", "Mexico"] as const;

// Shared by clients and carriers. Every part is optional to keep data entry fast.
export const addressFields = {
  addressLine1: optionalText(200),
  city: optionalText(100),
  stateProvince: optionalText(50),
  postalCode: optionalText(20),
  country: optionalText(60),
};
