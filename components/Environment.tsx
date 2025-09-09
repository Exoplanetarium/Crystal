/* eslint-disable @typescript-eslint/no-unused-vars */

import React, { useState, useEffect, FC } from 'react';
import { StyleSheet, Pressable, View as RNView } from 'react-native';
import { View, Text } from 'tamagui';

interface EnvProps {
	environment: string;
}

interface Environment {
	scope: string;
	emissions: number;
	originalEmissions: string;
	unit: string;
	standardizedUnit: string;
	description: string;
	isNotAvailable: boolean;
}

const Environment: FC<EnvProps> = ({ environment }) => {
	const [envArray, setEnvArray] = useState<Environment[]>([]);
	const [selectedScope, setSelectedScope] = useState<Environment | null>(null);

	useEffect(() => {
		if (environment) {
			const splitEnv = environment.split('\n').filter(env => env.trim().startsWith('-'));
			console.log(splitEnv);
			const parsedEnv: Environment[] = splitEnv.map(env => {
				// Remove unneeded characters
				env = env.replaceAll('{', '').replaceAll('}', '').trim();

				// Extract scope (Scope 1, Scope 2, Scope 3)
				const scopeMatch = env.match(/-(.*?):/);
				const scope = scopeMatch ? scopeMatch[1].trim() : '';

				// Updated regex to handle the new format: - Scope: (emissions unit) description
				const emissionsMatch = env.match(/\(([^)]+)\)\s*(.*)$/);
				let emissions = 0;
				let originalEmissions = '';
				let unit = '';
				let isNotAvailable = false;

				if (emissionsMatch) {
					const fullEmissionsText = emissionsMatch[1].trim();
					originalEmissions = fullEmissionsText;

					// Check for invalid data (percentages, "not provided", etc.)
					const lowerEmissions = fullEmissionsText.toLowerCase();
					if (lowerEmissions.includes('%') ||
						lowerEmissions.includes('percent') ||
						lowerEmissions.includes('not provided') ||
						lowerEmissions.includes('not available') ||
						lowerEmissions.includes('n/a') ||
						lowerEmissions.includes('tbd') ||
						lowerEmissions.includes('to be determined')) {
						isNotAvailable = true;
					} else {
						// Extract just the number part and unit separately
						// Handle formats like "413,348 metric tons CO2e" or "35,730,000 metric tons CO2e"
						const numberAndUnitMatch = fullEmissionsText.match(/([0-9,]+(?:\.[0-9]+)?)\s*(.+)/);

						if (numberAndUnitMatch) {
							const numberPart = numberAndUnitMatch[1];
							unit = numberAndUnitMatch[2].trim();

							// Handle millions (if the number is very large, it's likely already in full form)
							if (fullEmissionsText.toLowerCase().includes('million')) {
								const numberMatch = fullEmissionsText.match(/([0-9,]+(?:\.[0-9]+)?)/);
								if (numberMatch) {
									emissions = parseFloat(numberMatch[1].replace(/,/g, '')) * 1000000;
								}
							} else {
								emissions = parseFloat(numberPart.replace(/,/g, '')) || 0;
							}
						} else {
							// No valid number found
							isNotAvailable = true;
						}
					}
				} else {
					// No emissions data found in parentheses
					isNotAvailable = true;
				}

				// Standardize units and convert to appropriate scale
				const { standardizedEmissions, standardizedUnit } = standardizeUnits(emissions, unit);

				// Extract description - everything after the parentheses
				const descriptionMatch = env.match(/\([^)]+\)\s*(.+)$/);
				const description = descriptionMatch ? descriptionMatch[1].trim() : '';

				return {
					scope,
					emissions: standardizedEmissions,
					originalEmissions,
					unit,
					standardizedUnit,
					description,
					isNotAvailable,
				};
			});

			const validEnv = parsedEnv.filter(obj => {
				// Only allow Scope 1, Scope 2, and Scope 3
				const lowerScope = obj.scope.toLowerCase();
				const isValidScope = lowerScope.includes('scope 1') ||
									lowerScope.includes('scope 2') ||
									lowerScope.includes('scope 3');

				return obj.scope && isValidScope; // Include both valid data and not available data
			});			console.log('Parsed Environment Data:', validEnv);

			// Create complete set with all three scopes, filling in missing ones
			const allScopes = ['Scope 1', 'Scope 2', 'Scope 3'];
			const completeEnvArray = allScopes.map(scopeName => {
				const existing = validEnv.find(item =>
					item.scope.toLowerCase().includes(scopeName.toLowerCase())
				);

				if (existing) {
					return existing;
				} else {
					// Create placeholder for missing scope
					return {
						scope: scopeName,
						emissions: 0,
						originalEmissions: 'Not specified',
						unit: '',
						standardizedUnit: 'tCO2e',
						description: 'Data not provided in sustainability report',
						isNotAvailable: true,
					};
				}
			});

			setEnvArray(completeEnvArray);
		}
	}, [environment]);

	// Function to standardize units and convert emissions
	const standardizeUnits = (emissions: number, originalUnit: string) => {
		// Convert everything to tonnes CO2e
		let tonnesCO2e = emissions;

		// Convert from various units to tonnes CO2e
		const lowerUnit = originalUnit.toLowerCase();
		if (lowerUnit.includes('kt') || lowerUnit.includes('kilo')) {
			tonnesCO2e = emissions * 1000;
		} else if (lowerUnit.includes('mt') && !lowerUnit.includes('metric')) {
			// MT usually means million tonnes
			tonnesCO2e = emissions * 1000000;
		} else if (lowerUnit.includes('metric ton') || lowerUnit.includes('metric tonne')) {
			tonnesCO2e = emissions; // Already in correct unit
		} else if (lowerUnit.includes('pound') || lowerUnit.includes('lb')) {
			tonnesCO2e = emissions * 0.000453592; // Pounds to tonnes
		}

		// Always return in tCO2e, format large numbers appropriately
		const roundedEmissions = Math.round(tonnesCO2e);
		return {
			standardizedEmissions: roundedEmissions,
			standardizedUnit: 'tCO2e',
		};
	};

	// Create a logarithmic bar chart showing emissions breakdown by scope
	const emissionsBarChart = () => {
		if (envArray.length === 0) {
			return null;
		}

		// Define colors for each scope
		const scopeColors = {
			'Scope 1': '#f06464', // Red
			'Scope 2': '#fbea53', // Yellow
			'Scope 3': '#96ff81', // Green
		};

		// Find the maximum emissions to calculate logarithmic scale
		const maxEmissions = Math.max(...envArray.map(item => item.emissions));
		const logScale = Math.pow(10, Math.ceil(Math.log10(maxEmissions)));

		// Create chart data with logarithmic values
		const chartData = envArray.map((item, index) => {
			let logValue, heightPercentage;

			if (item.isNotAvailable) {
				// For not available data, show a minimal bar (8% height)
				heightPercentage = 8;
			} else if (item.emissions === 0) {
				// For zero emissions, show a minimal bar (5% height)
				heightPercentage = 5;
			} else {
				logValue = Math.log10(item.emissions) - 1;
				const maxLogValue = Math.log10(logScale);
				heightPercentage = Math.max((logValue / maxLogValue) * 100, 5); // Minimum 5% height
			}

			return {
				scope: item.scope,
				emissions: item.emissions,
				heightPercentage,
				color: item.isNotAvailable ? '#9E9E9E' : // Gray for not available
					item.emissions === 0 ? '#4CAF50' : // Green for zero emissions
					(scopeColors[item.scope as keyof typeof scopeColors] || '#888888'),
				unit: item.standardizedUnit,
				description: item.description,
				isZero: item.emissions === 0 && !item.isNotAvailable,
				isNotAvailable: item.isNotAvailable,
			};
		});		const maxHeight = 250;

		return (
			<View style={styles.chartContainer}>
				<View style={styles.yAxisContainer}>
					{generateYAxisLabels(logScale).reverse().map((value, index) => (
						<Text key={index} style={styles.yAxisLabel}>
							{formatNumber(value)}
						</Text>
					))}
				</View>
				<View style={styles.barsContainer}>
					{chartData.map((item, index) => (
						<Pressable
							key={index}
							onPress={() => setSelectedScope(envArray[index])}
							style={styles.barWrapper}
						>
							<View style={styles.barContainer}>
								<View
									style={[
										styles.bar,
										{
											height: (item.heightPercentage / 100) * maxHeight,
											backgroundColor: item.color,
										},
										item.isZero && styles.zeroEmissionsBar,
										item.isNotAvailable && styles.notAvailableBar,
									]}
								/>
								{item.isZero && (
									<Text style={styles.zeroEmissionsLabel}>0</Text>
								)}
								{item.isNotAvailable && (
									<Text style={styles.notAvailableLabel}>N/A</Text>
								)}
							</View>
							<Text style={[
								styles.barLabel,
								item.isZero && styles.zeroEmissionsText,
								item.isNotAvailable && styles.notAvailableText,
							]}>
								{getShortLabel(item.scope)}
							</Text>
						</Pressable>
					))}
				</View>
			</View>
		);
	};

	// Generate appropriate Y-axis labels based on the scale
	const generateYAxisLabels = (maxValue: number) => {
		const labels = [];
		let current = 1;

		while (current <= maxValue) {
			labels.push(current);
			current *= 10;
		}

		// If there are more than 10 labels, only show every other one
		if (labels.length > 10) {
			return labels.filter((_, index) => index % 2 === 0);
		}

		return labels;
	};

	// Format numbers for display (e.g., 1000000 -> "1M", 1000 -> "1K")
	const formatNumber = (num: number) => {
		if (num >= 1000000000000) {
			return `${(num / 1000000000000).toFixed(num % 1000000000000 === 0 ? 0 : 1)}T`;
		} else if (num >= 1000000000) {
			return `${(num / 1000000000).toFixed(num % 1000000000 === 0 ? 0 : 1)}B`;
		} else if (num >= 1000000) {
			return `${(num / 1000000).toFixed(num % 1000000 === 0 ? 0 : 1)}M`;
		} else if (num >= 1000) {
			return `${(num / 1000).toFixed(num % 1000 === 0 ? 0 : 1)}K`;
		} else {
			return num.toString();
		}
	};

	// Get short label for bar chart (one word only)
	const getShortLabel = (scope: string) => {
		const lowerScope = scope.toLowerCase();

		if (lowerScope.includes('scope 1')) {
			return 'Scope 1';
		}
		if (lowerScope.includes('scope 2')) {
			return 'Scope 2';
		}
		if (lowerScope.includes('scope 3')) {
			return 'Scope 3';
		}
		if (lowerScope.includes('total')) {
			return 'Total';
		}

		// For any other case, take the first word
		return scope.split(' ')[0];
	};

	return (
		<View style={styles.container}>
			<Text fontSize="$5" color="white" fontWeight={'bold'} marginStart={7}>Environment</Text>
			{environment && envArray.length > 0 && (
				<View style={styles.chartWrapper}>
					{emissionsBarChart()}
				</View>
			)}
			{selectedScope && (
				<View style={styles.details}>
					<Text style={styles.scopeLabel}>{selectedScope.scope}</Text>
					<Text style={styles.data}>
						{formatNumber(selectedScope.emissions)} {selectedScope.standardizedUnit}
					</Text>
					{selectedScope.originalEmissions !== selectedScope.emissions.toString() && (
						<Text style={styles.originalData}>
							Original: {selectedScope.originalEmissions} {selectedScope.unit}
						</Text>
					)}
					<Text style={styles.description}>{selectedScope.description}</Text>
				</View>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		marginHorizontal: 3,
		marginVertical: 15,
		flex: 1,
	},
	header: {
		fontWeight: 'bold',
	},
	chartWrapper: {
		position: 'relative',
		height: 400,
		alignItems: 'center',
		justifyContent: 'center',
	},
	chartContainer: {
		flexDirection: 'row',
		height: 300,
		paddingHorizontal: 20,
		paddingVertical: 20,
	},
	yAxisContainer: {
		justifyContent: 'space-between',
		alignItems: 'flex-end',
		paddingRight: 10,
		height: 250,
	},
	yAxisLabel: {
		color: 'white',
		fontSize: 12,
	},
	barsContainer: {
		flexDirection: 'row',
		alignItems: 'flex-end',
		justifyContent: 'space-around',
		flex: 1,
		height: 250,
	},
	barWrapper: {
		alignItems: 'center',
		flex: 1,
	},
	barContainer: {
		height: 250,
		justifyContent: 'flex-end',
		alignItems: 'center',
	},
	bar: {
		width: 40,
		borderRadius: 4,
	},
	barLabel: {
		color: 'white',
		fontSize: 12,
		marginTop: 10,
		textAlign: 'center',
	},
	legend: {
		marginTop: 20,
		alignItems: 'center',
	},
	legendItem: {
		flexDirection: 'row',
		alignItems: 'center',
		marginVertical: 5,
	},
	legendColor: {
		width: 16,
		height: 16,
		borderRadius: 8,
		marginRight: 10,
	},
	legendText: {
		color: 'white',
		fontSize: 14,
	},
	ringContainer: {
		position: 'absolute',
		top: '50%',
		left: '50%',
	},
	details: {
		marginTop: 20,
		alignItems: 'center',
		backgroundColor: '#252e43',
		borderRadius: 10,
		padding: 20,
		marginHorizontal: 7,
	},
	scopeLabel: {
		fontSize: 18,
		color: 'white',
		fontWeight: 'bold',
		marginBottom: 5,
	},
	data: {
		fontSize: 16,
		color: 'white',
		marginBottom: 10,
	},
	originalData: {
		fontSize: 14,
		color: '#ffffffb8',
		marginBottom: 10,
		fontStyle: 'italic',
	},
	description: {
		color: '#ffffffb8',
		textAlign: 'center',
		lineHeight: 20,
	},
	separator: {
		marginVertical: 15,
		width: '90%',
		alignSelf: 'center',
		borderColor: '#1b2130',
	},
	card: {
		backgroundColor: '#252e43',
		borderRadius: 10,
		marginHorizontal: 7,
		maxWidth: 320,
		height: 420,
	},
	zeroEmissionsBar: {
		opacity: 0.7,
		borderWidth: 2,
		borderColor: '#4CAF50',
		borderStyle: 'dashed',
	},
	zeroEmissionsLabel: {
		position: 'absolute',
		color: '#4CAF50',
		fontSize: 12,
		fontWeight: 'bold',
		bottom: 5,
	},
	zeroEmissionsText: {
		color: '#4CAF50',
	},
	notAvailableBar: {
		opacity: 0.5,
		borderWidth: 2,
		borderColor: '#9E9E9E',
		borderStyle: 'dotted',
	},
	notAvailableLabel: {
		position: 'absolute',
		color: '#9E9E9E',
		fontSize: 10,
		fontWeight: 'bold',
		bottom: 5,
	},
	notAvailableText: {
		color: '#9E9E9E',
	},
});

export default React.memo(Environment);
