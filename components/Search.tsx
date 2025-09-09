import React, { useState, useEffect } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import { Button, View, Input, Text, Spinner, YGroup, Separator, XStack } from 'tamagui';
import { reportScraper } from './reportScraper';
import RecentSearches from './RecentSearches';
import ReportAnalysis from './ReportAnalysis';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChevronLeft } from '@tamagui/lucide-icons';

const RECENT_SEARCHES_KEY = 'RECENT_SEARCHES';
const { height, width } = Dimensions.get('window');

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

const Search = () => {
	const [companyName, setCompanyName] = useState('');
	const [recentCompanies, setRecentCompanies] = useState<string[]>([]);
	const [report, setReport] = useState<Report>({} as Report);
	const [loading, setLoading] = useState(false);
	const [recentSearches, setRecentSearches] = useState<Report[]>([]);
	const [hasSearched, setHasSearched] = useState(false);
	const [isEmpty, setIsEmpty] = useState(false);
	const [_isLoadingRecent, setIsLoadingRecent] = useState(true);

	useEffect(() => {
        loadRecentSearches();
    }, []);

	const loadRecentSearches = async () => {
		try {
			setIsLoadingRecent(true);
			const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
			if (stored) {
				const parsed = JSON.parse(stored);
				setRecentSearches(parsed.reports || []);
				setRecentCompanies(parsed.companies || []);
				setIsEmpty(false);
			} else {
                setIsEmpty(true);
            }
		} catch (error) {
			console.error('Error loading recent searches:', error);
		} finally {
            setIsLoadingRecent(false);
        }
	};

	// adds a new search to recentSearches and recentCompanies
	const addRecentSearch = async (companyReport: Report, company: string) => {
		try {
			// Remove duplicates from both arrays
			let updatedReports = [companyReport, ...recentSearches.filter(r => r !== companyReport)];
			let updatedCompanies = [company, ...recentCompanies.filter(c => c !== company)];
			// Limit to 5 items
			if (updatedReports.length > 5) {
				updatedReports = updatedReports.slice(0, 5);
				updatedCompanies = updatedCompanies.slice(0, 5);
			}
			setRecentSearches(updatedReports);
			setRecentCompanies(updatedCompanies);
			setIsEmpty(false);
			await AsyncStorage.setItem(
				RECENT_SEARCHES_KEY,
				JSON.stringify({ reports: updatedReports, companies: updatedCompanies })
			);
		} catch (error) {
			console.error('Error saving recent search:', error);
		}
	};

	// self explanatory
	const deleteHistory = async () => {
		try {
			await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
			setRecentSearches([]);
			setRecentCompanies([]);
			setIsEmpty(true);
			console.log('History deleted');
		}
		catch (error) {
			console.error('Error deleting recent searches:', error);
		}
	};

	// standard search function
	const handleSearch = async () => {
		setHasSearched(true);
		setLoading(true);
		const fetchedReport = await reportScraper(companyName);
		if (!fetchedReport) {
			return (
				<View style={styles.spinnerContainer}>
					<Text color="white">No report found for {companyName}</Text>
				</View>
			);
		}
		setReport(fetchedReport);
		addRecentSearch(fetchedReport, companyName);
		setLoading(false);
	};

	// handler when a recent search is clicked.
	// immediately sets the report and companyName, so the UI renders splitReport.
	const handleRecentSearchSelect = (selectedReport: Report, company: string) => {
		setReport(selectedReport);
		setCompanyName(company);
		setHasSearched(true);
	};

	// Reset back to search view
	const handleBack = () => {
		setHasSearched(false);
		setCompanyName('');
	};

	return (
		<View style={styles.container}>
			<YGroup>
				<Input
					size="$4"
					onChangeText={(name) => setCompanyName(name)}
					placeholder="Enter company name"
					value={companyName}
					style={styles.input}
				/>
				<Button onPress={handleSearch}>Search</Button>
				{(!hasSearched) ? (
					(!isEmpty) && (
						<>
							<RecentSearches
								onSelect={handleRecentSearchSelect}
								recentSearches={recentSearches}
								recentCompanies={recentCompanies}
							/>
							<Button onPress={deleteHistory} style={styles.deleteButton}>
								<Text color="white">Delete History</Text>
							</Button>
						</>
					)
				) : (
					<>
						<View>
							<XStack style={styles.headerContainer}>
								<Button onPress={handleBack} style={styles.backButton}>
									<ChevronLeft size={'$2'} color={'white'}/>
								</Button>
								<Text fontSize="$5" paddingBlock={'$3'} color="white" style={styles.header}>{companyName}</Text>
							</XStack>
							<Separator style={styles.headerSeparator} />
						</View>
						{(!loading) && <ReportAnalysis report={report} />}
					</>
				)}
			</YGroup>
			{loading && (
				<View style={styles.spinnerContainer}>
					<Spinner size="large" color="lightblue" gap="$2" />
				</View>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		backgroundColor: '#1b2130',
		flex: 1,
		position: 'relative',
		height: height,
		width: width,
	},
	input: {
		borderTopRightRadius: 0,
		borderTopLeftRadius: 0,
	},
	spinnerContainer: {
		justifyContent: 'center',
		alignItems: 'center',
		flex: 1,
	},
	header: {
		fontWeight: 'bold',
		textAlign: 'center',
	},
	headerContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
	},
	headerSeparator: {
		width: '100%',
		alignSelf: 'center',
		borderColor: '#ffffff',
		opacity: 0.1,
	},
	seperator: {
		marginVertical: 15,
		width: '90%',
		alignSelf: 'center',
		borderColor: '#ffffff35',
	},
	backButton: {
		backgroundColor: 'transparent',
		paddingHorizontal: 10,
		position: 'absolute',
		alignSelf: 'center',
		left: 5,
	},
	deleteButton: {
		backgroundColor: '#2c3e50',
		marginTop: 10,
		bottom: 10,
		position: 'absolute',
		alignSelf: 'center',
	},
});

export default Search;

