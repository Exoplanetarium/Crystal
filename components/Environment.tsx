/* eslint-disable @typescript-eslint/no-unused-vars */

import React, { useState, useEffect, FC } from 'react';
import { StyleSheet } from 'react-native';
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

            // console.log(trimmedEnv);
            setEnvArray(trimmedEnv);
        }
    }, [environment]);

    return (
        <View style={styles.container}>
            <Text fontSize="$5" color="white" fontWeight={'bold'} marginLeft={7}>Environment</Text>
            <ScrollView horizontal>
                <XStack padding="$3" gap="$3" marginRight={50}>
                    {envArray.slice(0, 4).map((env, index) => {
                        const value = +env.data; // convert string to number
                        const actualSlice = {
                            value,
                            color: value > 66 ? '#96ff81' : value > 33 ? '#fbea53' : '#f06464',
                            label: `${value}%`,
                        };
                        const remainderSlice = {
                            value: 100 - value,
                            color: value > 66 ? '#96ff813d' : value > 33 ? '#fbea533d' : '#f064643d',
                            label: '',
                        };
                        const chartData = [actualSlice, remainderSlice];

                        return (
                            <ListItem padded key={index} style={styles.card} elevation={2}>
                                <YGroup gap="$2">
                                    <View>
                                        <Text fontSize="$4" color="white" style={styles.header}>{env.header}</Text>
                                        <Separator marginTop={15} width={'90%'} alignSelf="center" borderColor={'#1b2130'}/>
                                        <View height={'60%'} style={styles.chartContainer}>
                                            <Text fontSize="$4" color="white" style={styles.label}>{env.data}%</Text>
                                            <PolarChart
                                                data={chartData}
                                                labelKey={'label'}
                                                valueKey={'value'}
                                                colorKey={'color'}
                                            >
                                                <Pie.Chart innerRadius={'50%'}>
                                                    {({ slice }) => {
                                                        return (
                                                            <>
                                                                <Pie.Slice animate={{ type: 'spring' }} />
                                                                {actualSlice.value !== 100 ? <Pie.SliceAngularInset
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
                                            </PolarChart>
                                        </View>
                                        <Separator marginBottom={15} width={'90%'} alignSelf="center" borderColor={'#1b2130'}/>
                                        <Text fontSize="$3.2" color="white" style={styles.description}>{env.description}</Text>
                                    </View>
                                </YGroup>
                            </ListItem>
                        );
                    })}
                </XStack>
            </ScrollView>
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
    description: {
        color: '#ffffffb8',
    },
    card: {
        backgroundColor: '#252e43',
        borderRadius: 10,
        marginHorizontal: 7,
        maxWidth: 320,
        height: 420,
    },
    chartContainer: {
        height: 200,
        borderColor: '#ffffffa2',
        marginVertical: 15,
        padding: 10,
        justifyContent: 'center',
    },
    label: {
        position: 'absolute',
        alignSelf: 'center',
        fontStyle: 'italic',
        fontWeight: 'bold',
    },
});

export default Environment;
