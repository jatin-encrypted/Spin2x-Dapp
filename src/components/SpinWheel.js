import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Text } from 'react-native';
import Svg, { G, Path, Circle, Text as SvgText } from 'react-native-svg';

/**
 * SpinWheel Component
 * 
 * Renders a spinning wheel with 6 segments and animates based on final segment
 * 
 * Props:
 * - segment: Final segment to land on (0-5)
 * - isSpinning: Whether wheel is currently spinning
 * - onSpinComplete: Callback when spin animation completes
 * 
 * Segments (clockwise from top) — MUST match contract segment indices:
 * 0: 0x (loss)
 * 1: 0x (loss)
 * 2: 1.0x (break even)
 * 3: 1.2x
 * 4: 1.5x
 * 5: 2.0x (jackpot)
 */
const SpinWheel = ({ segment, isSpinning, onSpinComplete }) => {
    const rotation = useRef(new Animated.Value(0)).current;

    // Segment colors
    const segmentColors = [
        '#DC2626', // 0x - Red (loss)
        '#DC2626', // 0x - Red (loss)
        '#10B981', // 1.0x - Green
        '#3B82F6', // 1.2x - Blue
        '#8B5CF6', // 1.5x - Purple
        '#F59E0B', // 2.0x - Gold (jackpot)
    ];

    // Segment labels (multipliers)
    const segmentLabels = ['0×', '0×', '1.0×', '1.2×', '1.5×', '2.0×'];

    // Degrees per segment (360 / 6 = 60)
    const degreesPerSegment = 60;

    /**
     * Calculate rotation needed to land on specific segment
     * Wheel spins at least 3 full rotations (1080 degrees) before landing
     */
    const calculateFinalRotation = (targetSegment) => {
        // Minimum rotations before landing (3 full spins)
        const minRotations = 3;
        const minDegrees = minRotations * 360;

        // Calculate target angle (segments are ordered clockwise starting from top)
        // We need to account for the pointer being at top (12 o'clock)
        const targetAngle = targetSegment * degreesPerSegment;

        // Add extra rotation to reach target from current position
        // Pointer is at top, so we rotate wheel to bring target segment to top
        const finalRotation = minDegrees + (360 - targetAngle);

        return finalRotation;
    };

    /**
     * Trigger spin animation when segment changes and isSpinning is true
     */
    useEffect(() => {
        if (isSpinning && segment !== null && segment !== undefined) {
            // Reset rotation
            rotation.setValue(0);

            // Calculate final rotation
            const finalRotation = calculateFinalRotation(segment);

            // Animate with easing
            Animated.timing(rotation, {
                toValue: finalRotation,
                duration: 4000, // 4 seconds
                useNativeDriver: true,
                easing: (t) => {
                    // Custom easing: fast start, slow end
                    return t < 0.7 ? t : 1 - Math.pow(1 - t, 3);
                },
            }).start(() => {
                // Callback when animation completes
                if (onSpinComplete) {
                    onSpinComplete();
                }
            });
        }
    }, [segment, isSpinning]);

    /**
     * Create SVG path for a wheel segment
     */
    const createSegmentPath = (index) => {
        const radius = 140;
        const startAngle = index * degreesPerSegment - 90; // -90 to start from top
        const endAngle = startAngle + degreesPerSegment;

        const startRad = (startAngle * Math.PI) / 180;
        const endRad = (endAngle * Math.PI) / 180;

        const x1 = 150 + radius * Math.cos(startRad);
        const y1 = 150 + radius * Math.sin(startRad);
        const x2 = 150 + radius * Math.cos(endRad);
        const y2 = 150 + radius * Math.sin(endRad);

        // Create arc path
        const largeArcFlag = degreesPerSegment > 180 ? 1 : 0;

        const path = `
      M 150 150
      L ${x1} ${y1}
      A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}
      Z
    `;

        return path;
    };

    /**
     * Calculate position for segment label
     */
    const getLabelPosition = (index) => {
        const radius = 100;
        const angle = index * degreesPerSegment + degreesPerSegment / 2 - 90;
        const rad = (angle * Math.PI) / 180;

        return {
            x: 150 + radius * Math.cos(rad),
            y: 150 + radius * Math.sin(rad),
        };
    };

    // Interpolate rotation value
    const rotationDegrees = rotation.interpolate({
        inputRange: [0, 360],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={styles.container}>
            {/* Wheel */}
            <Animated.View
                style={[
                    styles.wheelContainer,
                    { transform: [{ rotate: rotationDegrees }] },
                ]}
            >
                <Svg height="300" width="300" viewBox="0 0 300 300">
                    {/* Draw segments */}
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                        <G key={i}>
                            <Path
                                d={createSegmentPath(i)}
                                fill={segmentColors[i]}
                                stroke="#ffffff"
                                strokeWidth="3"
                            />
                            <SvgText
                                x={getLabelPosition(i).x}
                                y={getLabelPosition(i).y}
                                fontSize="24"
                                fontWeight="bold"
                                fill="#ffffff"
                                textAnchor="middle"
                                alignmentBaseline="middle"
                            >
                                {segmentLabels[i]}
                            </SvgText>
                        </G>
                    ))}

                    {/* Center circle */}
                    <Circle cx="150" cy="150" r="20" fill="#1F2937" />
                </Svg>
            </Animated.View>

            {/* Pointer (triangle at top) */}
            <View style={styles.pointer}>
                <View style={styles.triangle} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    wheelContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    pointer: {
        position: 'absolute',
        top: 0,
        alignItems: 'center',
        zIndex: 10,
    },
    triangle: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 15,
        borderRightWidth: 15,
        borderTopWidth: 30,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: '#F59E0B',
        marginTop: -5,
    },
});

export default SpinWheel;
