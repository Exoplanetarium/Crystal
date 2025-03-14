
import React, { useState, useEffect, FC } from 'react';
import { StyleSheet } from 'react-native';
import { View, Text, Progress, YStack, ListItem, YGroup } from 'tamagui';

interface GoalsProps {
    goals: string;
}

interface Goal {
    header: string;
    status: string;
    description: string;
}

const Goals: FC<GoalsProps> = ({ goals }) => {
    const [goalsArray, setGoalsArray] = useState<Goal[]>([]);

    useEffect(() => {
        if (goals) {
            const splitGoals = goals.split('\n').filter(goal => goal.trim().startsWith('-'));
            //console.log(splitGoals);
            const parsedGoals: Goal[] = splitGoals.map(goal => {
                // remove uneeded characters
                goal = goal.replaceAll('{', '').replaceAll('}', '').trim();
                // Extract header
                const headerMatch = goal.match(/(.*?):/);
                const fallbackHeader = goal.match(/(.*?) \(/);
                const header = headerMatch ? headerMatch[1].replace('-', '').trim() : fallbackHeader ? fallbackHeader[1].replace('-', '').trim() : '';

                if (header === 'Goals' || header === 'Setbacks') {
                    return { header: '', status: '', description: '' };
                }

                // Extract status
                const statusMatch = goal.match(/completed|in progress|not started/i);
                const status = statusMatch ? statusMatch[0].trim() : '';

                // Extract description
                const descriptionMatch = goal.replace(/completed|in progress|not started/i, '^')
                                                .replace(/-(.*)\^/, '')
                                                .replace('^', '')
                                                .replace('-', '')
                                                .replace('(', '')
                                                .replace(')', '')
                                                .replace(/\d\d\d\d/, '')
                                                .trim();
                const description = descriptionMatch ? descriptionMatch : '';
                return { header, status, description };
            });

            //console.log(parsedGoals);
            setGoalsArray(parsedGoals);
        }
    }, [goals]);

    return (
        <View style={styles.container}>
            <Text fontSize="$5" color="white" fontWeight={'bold'}>Goals</Text>
            <YStack padding="$3" gap="$3">
                {goalsArray.slice(0, 4).map((goal, index) => (
                    <ListItem padded key={index} style={styles.card} elevation={2}>
                        <YGroup gap="$2" flex={1}>
                            <View>
                                <Text fontSize="$4" color="white" style={styles.header}>{goal.header}</Text>
                                {/* Status cases for progress bar */}
                                {goal.status.toLowerCase() === 'completed' && <Progress value={100} size="$5" style={styles.progressBar}>
                                        <Progress.Indicator style={styles.progressIndC} animation="bouncy"/>
                                    </Progress>}
                                {goal.status.toLowerCase() === 'in progress' && <Progress value={50} size="$5" style={styles.progressBar}>
                                        <Progress.Indicator style={styles.progressIndIP} animation="bouncy" />
                                    </Progress>}
                                {goal.status.toLowerCase() === 'not started' && <Progress value={10} size="$5" style={styles.progressBar}>
                                        <Progress.Indicator style={styles.progressIndNS} animation="bouncy" />
                                    </Progress>}
                                <Text fontSize="$3.2" color="white" style={styles.description}>{goal.description}</Text>
                            </View>
                        </YGroup>
                    </ListItem>
                ))}
            </YStack>
        </View>
    );
};

const styles = StyleSheet.create({
    progressIndC: {
        backgroundColor: '#96ff81',
    },
    progressIndIP: {
        backgroundColor: '#fbea53',
    },
    progressIndNS: {
        backgroundColor: '#f06464',
    },
    progressBar: {
        marginVertical: 10,
    },
    container: {
        marginHorizontal: 10,
        marginVertical: 15,
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
    },
});


export default Goals;
