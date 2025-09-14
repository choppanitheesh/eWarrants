// babel.config.js

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // 1. Add this line. It MUST be the first plugin.
      ["@babel/plugin-proposal-decorators", { legacy: true }],

      // 2. This must be the last plugin.
      "react-native-reanimated/plugin",
    ],
  };
};
