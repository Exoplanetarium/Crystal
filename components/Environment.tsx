/* eslint-disable @typescript-eslint/no-unused-vars */

import React, { useState, useEffect, FC } from 'react';
import { StyleSheet, TouchableOpacity, View as RNView } from 'react-native';
import { View, Text, XStack, Separator, ListItem, YGroup, ScrollView } from 'tamagui';
import { Pie, PolarChart } from 'victory-native';

interface EnvProps {
	environment: string;
}

interface Environment {
	header: string;
	data: string;
	description: string;
}


const Environment: FC<EnvProps> = ({ environment }) => {
	const [envArray, setEnvArray] = useState<Environment[]>([]);
	const [selectedIndex, setSelectedIndex] = useState(0);

	useEffect(() => {
		if (environment) {
			const splitEnv = environment.split('\n').filter(env => env.trim().startsWith('-'));
			// console.log(splitEnv);
			const parsedEnv: Environment[] = splitEnv.map(env => {
				// remove uneeded characters
				env = env.replaceAll('{', '').replaceAll('}', '').trim();
				// Extract header
				const headerMatch = env.match(/-(.*?)\(/);
				const header = headerMatch ? headerMatch[1].trim() : '';

				if (header === 'Environment') {
					return { header: '', data: '', description: '' };
				}

				// Extract data
				const dataMatch = env.match(/\((.*?)%\)/);
				const fallbackMatch = env.match(/\((.*?)\)/);
				const data = dataMatch ? dataMatch[1].trim() : fallbackMatch ? fallbackMatch[1] : '';

				// Extract description
				const descriptionMatch = env.replace(/(.*?)\) /, '').replace('-','').trim();
				const description = descriptionMatch ? descriptionMatch : '';
				return { header, data, description };
			});

			const trimmedEnv = parsedEnv.filter(obj =>
				!Object.values(obj).every(val => val === '')
			);

			// console.log('Parsed Environment Array:', trimmedEnv);
			setEnvArray(trimmedEnv);
		}
	}, [environment]);

	// Cycle to next ring on press
	const handleChartPress = () => {
		setSelectedIndex((selectedIndex + 1) % 3);
	};

	// Define ring parameters for Scope 1, 2, and 3
	const rings = [
		{ innerRadius: 37.5, size: 150, label: 'Scope 1' },
		{ innerRadius: 75, size: 250, label: 'Scope 2' },
		{ innerRadius: 125, size: 350, label: 'Scope 3' },
	];

	// Create concentric donut charts by rendering three VictoryPie charts on top of each other.
	// Each ring is built from the corresponding envArray item.
	const donutCharts = envArray.map((env, index) => {
		const value = parseFloat(env.data) || 0;
		const isSelected = index === selectedIndex;

		const actualSlice = {
			value,
			color: isSelected ? (value > 66 ? '#96ff81' : value > 33 ? '#fbea53' : '#f06464')
						: (value > 66 ? '#96ff8150' : value > 33 ? '#fbea5350' : '#f0646450'),
			label: `${value}%`,
		};

		const remainderSlice = {
			value: 100 - value,
			color: isSelected ? (value > 66 ? '#96ff813d' : value > 33 ? '#fbea533d' : '#f064643d')
						: (value > 66 ? '#96ff8118' : value > 33 ? '#fbea5318' : '#f0646418'),
			label: '',
		};

		const chartData = [actualSlice, remainderSlice];

		return (
			<View 
				key={index}
				style={{
					height: rings[index].size,
					width: rings[index].size,
					position: 'absolute',
					justifyContent: 'center',
					alignItems: 'center',
				}}
			>
				<PolarChart
					data={chartData}
					labelKey="label"
					valueKey="value"
					colorKey="color"
				>
					<Pie.Chart 
						innerRadius={rings[index].innerRadius}
						size={rings[index].size}
					/>
				</PolarChart>
				{/* <PolarChart
					data={chartData}
					labelKey={'label'}
					valueKey={'value'}
					colorKey={'color'}
				>
					<Pie.Chart innerRadius={rings[index].innerRadius} size={200}>
						{({ slice }) => {
							return (
								<>
									<Pie.Slice
										animate={{ type: 'spring' }}
									/>
									{(actualSlice.value !== 100 && isSelected) ? <Pie.SliceAngularInset
										animate={{ type: 'spring' }}
										angularInset={{
											angularStrokeWidth: 1,
											angularStrokeColor: 'white',
										}}
									/> : null}
								</>
							);
						}}
					</Pie.Chart>
				</PolarChart> */}
			</View>
		);
	});

	return (
		<View style={styles.container}>
			<Text fontSize="$5" color="white" fontWeight={'bold'} marginStart={7}>Environment</Text>
			<TouchableOpacity activeOpacity={0.8} onPress={handleChartPress} style={styles.chartWrapper}>
				{donutCharts}
			</TouchableOpacity>
			{envArray[selectedIndex] && (
				<View style={styles.details} key={selectedIndex}>
					<Text style={styles.scopeLabel}>{rings[selectedIndex].label}</Text>
					<Text style={styles.data}>{envArray[selectedIndex].data}%</Text>
					<Text style={styles.description}>{envArray[selectedIndex].description}</Text>
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
		justifyContent: 'center',
		alignItems: 'center',
		position: 'relative',
		height: 400,
	},
	details: {
		marginTop: 20,
		alignItems: 'center',
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
	},
	description: {
		color: '#ffffffb8',
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
	chartContainer: {
		justifyContent: 'center',
		alignItems: 'center',
		borderColor: 'red',
		borderWidth: 1,
		position: 'absolute',
	},
	label: {
		position: 'absolute',
		alignSelf: 'center',
		fontStyle: 'italic',
		fontWeight: 'bold',
	},
});

export default Environment;
