import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import colors from "@/constants/colors";

type OrbState = "idle" | "wake" | "listening" | "thinking" | "speaking";

interface NovaOrbProps {
  state: OrbState;
  size?: number;
}

export default function NovaOrb({ state, size = 140 }: NovaOrbProps) {
  const pulse1 = useRef(new Animated.Value(1)).current;
  const pulse2 = useRef(new Animated.Value(1)).current;
  const glow   = useRef(new Animated.Value(0.3)).current;
  const spin   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    pulse1.stopAnimation();
    pulse2.stopAnimation();
    glow.stopAnimation();
    spin.stopAnimation();

    if (state === "idle" || state === "wake") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse1, { toValue: 1.08, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulse1, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(glow, { toValue: 0.5, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(glow, { toValue: 0.2, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    } else if (state === "listening") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse1, { toValue: 1.15, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulse1, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse2, { toValue: 1.25, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulse2, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(glow, { toValue: 0.9, duration: 500, useNativeDriver: true }),
          Animated.timing(glow, { toValue: 0.5, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else if (state === "thinking") {
      Animated.loop(
        Animated.timing(spin, { toValue: 1, duration: 1200, easing: Easing.linear, useNativeDriver: true })
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(glow, { toValue: 0.7, duration: 700, useNativeDriver: true }),
          Animated.timing(glow, { toValue: 0.3, duration: 700, useNativeDriver: true }),
        ])
      ).start();
    } else if (state === "speaking") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse1, { toValue: 1.12, duration: 400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulse1, { toValue: 0.98, duration: 400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse2, { toValue: 1.2, duration: 600, useNativeDriver: true }),
          Animated.timing(pulse2, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(glow, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.timing(glow, { toValue: 0.5, duration: 350, useNativeDriver: true }),
        ])
      ).start();
    }

    return () => {
      pulse1.stopAnimation();
      pulse2.stopAnimation();
      glow.stopAnimation();
      spin.stopAnimation();
    };
  }, [state]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  const orbColor =
    state === "listening" ? colors.dark.nova
    : state === "speaking" ? colors.dark.novaPurple
    : state === "thinking" ? colors.dark.primary
    : colors.dark.novaIndigo;

  const innerSize = size;
  const ring1Size = size * 1.35;
  const ring2Size = size * 1.65;

  return (
    <View style={[styles.container, { width: ring2Size, height: ring2Size }]}>
      {/* Outer ring */}
      <Animated.View style={[
        styles.ring,
        {
          width: ring2Size, height: ring2Size, borderRadius: ring2Size / 2,
          borderColor: orbColor,
          opacity: glow,
          transform: [{ scale: pulse2 }],
        }
      ]} />
      {/* Inner ring */}
      <Animated.View style={[
        styles.ring,
        {
          width: ring1Size, height: ring1Size, borderRadius: ring1Size / 2,
          borderColor: orbColor,
          opacity: Animated.multiply(glow, new Animated.Value(0.6)),
          transform: state === "thinking" ? [{ rotate }] : [{ scale: pulse1 }],
        }
      ]} />
      {/* Core orb */}
      <Animated.View style={[
        styles.core,
        {
          width: innerSize, height: innerSize, borderRadius: innerSize / 2,
          backgroundColor: orbColor,
          transform: [{ scale: pulse1 }],
          shadowColor: orbColor,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 20,
          elevation: 12,
        }
      ]}>
        {/* N lettermark */}
        <View style={styles.letterContainer}>
          <Animated.Text style={[styles.letter, { opacity: Animated.add(glow, new Animated.Value(0.3)) }]}>N</Animated.Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    borderWidth: 1.5,
    borderStyle: "solid",
  },
  core: {
    alignItems: "center",
    justifyContent: "center",
  },
  letterContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  letter: {
    fontSize: 48,
    fontWeight: "900" as const,
    color: "#ffffff",
    letterSpacing: -1,
  },
});
