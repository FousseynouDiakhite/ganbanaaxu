const { withAppBuildGradle } = require('@expo/config-plugins');

module.exports = function withForceAdMobVersion(config) {
  return withAppBuildGradle(config, (config) => {
    const gradleScript = `
// Force play-services-ads to 23.6.0 to remain compatible with Kotlin 2.1.x
configurations.all {
    resolutionStrategy {
        force 'com.google.android.gms:play-services-ads:23.6.0'
        force 'com.google.android.gms:play-services-ads-lite:23.6.0'
        force 'com.google.android.gms:play-services-ads-base:23.6.0'
    }
}
`;
    if (!config.modResults.contents.includes('play-services-ads:23.6.0')) {
      config.modResults.contents += gradleScript;
    }
    return config;
  });
};