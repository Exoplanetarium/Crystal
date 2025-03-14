import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Button, View, Input, Text, ScrollView, Spinner, YGroup, Separator } from 'tamagui';
import { reportScraper } from './reportScraper';
import Goals from './Goals';
import Environment from './Environment';
import Certifications from './Certifications';
import Transparency from './Transparency';

const Search = () => {
    const [companyName, setCompanyName] = useState('');
    const [report, setReport] = useState<Report>({} as Report);
    const [loading, setLoading] = useState(false);

    const handleSearch = async () => {
        setLoading(true);
        setReport(await reportScraper(companyName));
        setLoading(false);
    };

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

    const splitReport = (r: Report) => {
        const goals = r.goals;
        const environment = r.environment;
        const certifications = r.certifications;
        const transparency = r.transparency;
        return (
            <>
                <Text fontSize="$5" padding="$3" color="white" style={styles.header}>{companyName}</Text>
                <ScrollView>
                    <YGroup>
                        <Goals goals={goals} />
                        <Separator marginVertical={15} width={'90%'} alignSelf="center" borderColor={'#ffffff35'}/>
                        <Environment environment={environment} />
                        <Separator marginVertical={15} width={'90%'} alignSelf="center" borderColor={'#ffffff35'}/>
                        <Certifications certifications={certifications} />
                        <Separator marginVertical={15} width={'90%'} alignSelf="center" borderColor={'#ffffff35'}/>
                        <Transparency transparency={transparency} />
                    </YGroup>
                </ScrollView>
            </>
        );
    };

    return (
        <View style={styles.container}>
            <YGroup>
                <Input size="$4"
                    onChangeText={(name) => setCompanyName(name)}
                    placeholder="Enter company name" />
                <Button onPress={handleSearch}>Search</Button>
            </YGroup>
            {loading ? <Spinner size="large" color="lightblue" gap="$2"/> : splitReport(report)}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#1b2130',
        flex: 1,
        height: '100%',
    },
    header: {
        fontWeight: 'bold',
        marginBottom: 5,
        textAlign: 'center',
    },
});

export default Search;

