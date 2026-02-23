import { StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors } from '../theme/colors';

const buildMapHtml = (key) => `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
    <style>
      html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; }
    </style>
    <script src="https://webapi.amap.com/maps?v=2.0&key=${key}"></script>
  </head>
  <body>
    <div id="map"></div>
    <script>
      var map = new AMap.Map('map', {
        zoom: 12,
        center: [121.4737, 31.2304]
      });
    </script>
  </body>
</html>
`;

export const AmapPreview = () => {
  const amapKey = process.env.EXPO_PUBLIC_AMAP_KEY;

  if (!amapKey) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>未配置高德 Key</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html: buildMapHtml(amapKey) }}
        style={styles.webview}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  webview: {
    flex: 1,
  },
  placeholder: {
    height: 220,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  placeholderText: {
    color: colors.textSecondary,
  },
});
