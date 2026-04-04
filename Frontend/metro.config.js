const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const defaultConfig = getDefaultConfig(__dirname);
const assetExts = defaultConfig.resolver.assetExts.includes('avif')
	? defaultConfig.resolver.assetExts
	: [...defaultConfig.resolver.assetExts, 'avif'];

const config = {
	resolver: {
		assetExts,
	},
};

module.exports = mergeConfig(defaultConfig, config);
