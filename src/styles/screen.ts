export const breakpoints = {
  sm: "640px", // Large phones
  tablet: "768px", // Tablets
  laptop: "1024px", // Laptops
  desktop: "1280px", // Desktops
  wide: "1536px", // Large screens(TV)
};

export const screen = {
  sm: `@media (min-width: ${breakpoints.sm})`,
  tablet: `@media (min-width: ${breakpoints.tablet})`,
  laptop: `@media (min-width: ${breakpoints.laptop})`,
  desktop: `@media (min-width: ${breakpoints.desktop})`,
  wide: `@media (min-width: ${breakpoints.wide})`,
};