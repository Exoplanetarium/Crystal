import React, { FC } from 'react';
import { StyleSheet } from 'react-native';
import { ScrollView, YGroup, Separator } from 'tamagui';
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

const ReportAnalysis: FC<ReportProps> = ({ report }) => {
    const goals = report.goals;
    const environment = report.environment;
    const certifications = report.certifications;
    const transparency = report.transparency;
    // console.log(r);
    return (
        <>
            <ScrollView marginBlockEnd={150}>
                <YGroup>
                    <Goals goals={goals} />
                    <Separator style={styles.seperator}/>
                    <Environment environment={environment} />
                    <Separator style={styles.seperator}/>
                    <Certifications certifications={certifications} />
                    <Separator style={styles.seperator}/>
                    <Transparency transparency={transparency} />
                </YGroup>
            </ScrollView>
        </>
    );
};

const styles = StyleSheet.create({
    seperator: {
        marginVertical: 15,
        width: '90%',
        alignSelf: 'center',
        borderColor: '#ffffff35',
    },
});

export default ReportAnalysis;
