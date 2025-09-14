import React, { createContext, useContext } from "react";
import { lightColors } from "../theme/colors";

const ThemeContext = createContext({
  theme: "light", 
  colors: lightColors,
  setTheme: () => {}, 
});
export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;
