import React, { useState, useEffect, FC } from 'react';
import { StyleSheet } from 'react-native';
import { ScrollView, YGroup, Separator, View, Text } from 'tamagui';
import Goals from './Goals';
import Environment from './Environment';
import Certifications from './Certifications';
import Transparency from './Transparency';

interface Report {
    goals: string;
    environment: string;
    certifications: string;
    transparency: string;
    processing_time_seconds: number;
    processed_chunks: number;
    total_chunks: number;
    download_time_seconds: number,
    upload_time_seconds: number,
    extraction_time_seconds: number,
}

interface ReportProps {
    report: Report;
}

// Component for empty sections
const EmptySection: FC<{ sectionName: string }> = ({ sectionName }) => (
    <>
        <View style={styles.emptySectionContainer}>
            <Text style={styles.emptySectionText}>
                This company did not include {sectionName} in this year's report.
            </Text>
        </View>
    </>
);


const ReportAnalysis: FC<ReportProps> = ({ report }) => {
    const currentYear = new Date().getFullYear();
    const [loadedSections, setLoadedSections] = useState<Set<string>>(new Set());

    useEffect(() => {
        // Load sections progressively
        setTimeout(() => setLoadedSections(new Set(['goals'])), 100);
        setTimeout(() => setLoadedSections(new Set(['goals', 'environment'])), 300);
        setTimeout(() => setLoadedSections(new Set(['goals', 'environment', 'certifications'])), 500);
        setTimeout(() => setLoadedSections(new Set(['goals', 'environment', 'certifications', 'transparency'])), 700);
    }, [report]);

    const goals = report.goals;
    const environment = report.environment;
    const certifications = report.certifications;
    const transparency = report.transparency;

    // Helper function to check if section is empty
    const isSectionEmpty = (section: string) => {
        return !section || section.trim() === '' || section.toLowerCase().includes('does not list') || section.toLowerCase().includes('not available') || section.toLowerCase().includes('no data');
    };

    if (!goals && !environment && !certifications && !transparency) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.header} fontSize="$4">Sorry, this company has not yet reported for the {currentYear} fiscal year.</Text>
                <Text style={styles.header} fontSize="$4">Please check back later!</Text>
            </View>
        );
    }

    return (
        <ScrollView marginBlockEnd={150}>
            <YGroup>
                {loadedSections.has('goals') ? (
                    isSectionEmpty(goals) ? (
                        <EmptySection sectionName="goals" />
                    ) : (
                        <Goals goals={goals} />
                    )
                ) : (
                    <Text>Loading Goals...</Text>
                )}
                <Separator style={styles.seperator}/>

                {loadedSections.has('environment') ? (
                    isSectionEmpty(environment) ? (
                        <EmptySection sectionName="environment data" />
                    ) : (
                        <Environment environment={environment} />
                    )
                ) : (
                    <Text>Loading Environment...</Text>
                )}
                <Separator style={styles.seperator}/>

                {loadedSections.has('certifications') ? (
                    isSectionEmpty(certifications) ? (
                        <EmptySection sectionName="certifications" />
                    ) : (
                        <Certifications certifications={certifications} />
                    )
                ) : (
                    <Text>Loading Certifications...</Text>
                )}
                <Separator style={styles.seperator}/>

                {loadedSections.has('transparency') ? (
                    isSectionEmpty(transparency) ? (
                        <EmptySection sectionName="transparency metrics" />
                    ) : (
                        <Transparency transparency={transparency} />
                    )
                ) : (
                    <Text>Loading Transparency...</Text>
                )}
            </YGroup>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    seperator: {
        marginVertical: 15,
        width: '90%',
        alignSelf: 'center',
        borderColor: '#ffffff35',
    },
    errorContainer: {
        marginTop: 50,
		alignItems: 'center',
        height: '100%',
	},
	header: {
		textAlign: 'center',
        color: 'white',
        marginHorizontal: 45,
	},
    emptySectionContainer: {
        marginHorizontal: 10,
        marginVertical: 20,
        alignItems: 'center',
        backgroundColor: '#252e43',
        borderRadius: 10,
        padding: 20,
    },
    emptySectionText: {
        color: '#ffffffb8',
        fontSize: 16,
        textAlign: 'center',
        fontStyle: 'italic',
    },
});

export default ReportAnalysis;
