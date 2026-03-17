import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Video from 'react-native-video';
import { Colors } from '../../theme/colors';
import { FontWeight } from '../../theme/tokens';

type CountdownOverlayProps = {
  count: number;
  active?: boolean;
};

export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({ count, active = true }) => {
  const source = count === 3
    ? require('../../assets/audio/3.wav')
    : count === 2
      ? require('../../assets/audio/2.wav')
      : require('../../assets/audio/1.wav');

  return (
    <View style={styles.overlay}>
      <Video
        key={`count-audio-${count}-${active ? 'active' : 'paused'}`}
        source={source}
        paused={!active}
        repeat={false}
        muted={false}
        controls={false}
        playInBackground={false}
        playWhenInactive={false}
        ignoreSilentSwitch="ignore"
        style={styles.hiddenAudio}
      />
      <Text style={styles.number}>{count}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.blackA72,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  hiddenAudio: {
    width: 0,
    height: 0,
    position: 'absolute',
  },
  number: {
    color: Colors.textPrimary,
    fontSize: 96,
    fontWeight: FontWeight.heavy,
  },
});


