import React, { useState, useEffect } from 'react';
import { StyleSheet, Dimensions, Keyboard } from 'react-native';
import { Button, View, Input, Text, Spinner, YGroup, XStack } from 'tamagui';
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
	const [lastSearchedCompany, setLastSearchedCompany] = useState('');
	const [recentCompanies, setRecentCompanies] = useState<string[]>([]);
	const [report, setReport] = useState<Report>({} as Report);
	const [loading, setLoading] = useState(false);
	const [lastRequestedCompany, setLastRequestedCompany] = useState<string | null>(null);
	const [recentSearches, setRecentSearches] = useState<Report[]>([]);
	const [hasSearched, setHasSearched] = useState(false);
	const [inaccessibleLink, setInaccessibleLink] = useState<string | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
				setLastSearchedCompany(parsed.lastHeader || '');
			} else {
				setRecentSearches([]);
				setRecentCompanies([]);
			}
		} catch (error) {
			console.error('Error loading recent searches:', error);
		} finally {
            setIsLoadingRecent(false);
        }
	};

	// Persist just the header (merges into existing RECENT_SEARCHES object)
	const saveHeaderToStorage = async (header: string) => {
		try {
			const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
			let parsed = { reports: recentSearches, companies: recentCompanies, lastHeader: header };
			if (stored) {
				try {
					parsed = JSON.parse(stored);
					parsed.lastHeader = header;
				} catch (e) {
					// fall back to current arrays
					parsed = { reports: recentSearches, companies: recentCompanies, lastHeader: header };
				}
			}
			await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(parsed));
		} catch (err) {
			console.error('Error saving header to storage:', err);
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
			await AsyncStorage.setItem(
				RECENT_SEARCHES_KEY,
				JSON.stringify({ reports: updatedReports, companies: updatedCompanies, lastHeader: lastSearchedCompany })
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
			console.log('History deleted');
		}
		catch (error) {
			console.error('Error deleting recent searches:', error);
		}
	};

	// standard search function
	const handleSearch = async () => {
		// clear any previous inaccessible state when starting a new search
		setInaccessibleLink(null);
		setErrorMessage(null);
		if (companyName.trim().length === 0) {
			setErrorMessage('Please enter a company name');
			return;
		}
		// prevent duplicate in-flight requests for the same query
		if (loading && lastRequestedCompany === companyName) {
			console.log('Search already in progress for this query, ignoring duplicate press');
			return;
		}
		// Dismiss the on-screen keyboard when pressing Search
		Keyboard.dismiss();
		setHasSearched(true);
		setLoading(true);
		setLastRequestedCompany(companyName);
		// update header/label to the company that was actually searched
		setLastSearchedCompany(companyName);
		// persist header immediately so it survives app restarts
		saveHeaderToStorage(companyName);
		setErrorMessage(null);
		let fetchedReport = null;
		try {
			fetchedReport = await reportScraper(companyName);
		} catch (err: any) {
			console.error('Search failed:', err);
			setReport({} as Report);
			setInaccessibleLink(null);
			setErrorMessage(err?.message || 'An unexpected error occurred while searching.');
			setLoading(false);
			return;
		}
		// If the scraper returned a structured error object (e.g., 403), show it
		if (fetchedReport && fetchedReport.error) {
			setReport({} as Report);
			setInaccessibleLink(null);
			setErrorMessage(fetchedReport.message || 'An error occurred while searching.');
			setLoading(false);
			return;
		}

		// If the scraper indicates the PDF exists but is inaccessible (blocked/auth), set state so UI can show a message
		if (fetchedReport && fetchedReport.inaccessible) {
			setReport({} as Report);
			setInaccessibleLink(fetchedReport.link || null);
			setLoading(false);
			setHasSearched(true);
			return;
		}
		// define a quick predicate for meaningful reports
		const isMeaningfulReport = (r: any) => {
			if (!r) {
				return false;
			}
			// If all main fields are empty or missing, treat as not meaningful
			const keys = ['goals', 'environment', 'certifications', 'transparency'];
			return keys.some(k => r[k] && String(r[k]).trim().length > 0);
		};

		if (!isMeaningfulReport(fetchedReport)) {
			setReport({} as Report);
			setLoading(false);
			setHasSearched(true);
			setInaccessibleLink(null);
			return;
		}

		setReport(fetchedReport);
		// Only save meaningful reports to recent searches
		addRecentSearch(fetchedReport, companyName);
		setLoading(false);
		setLastRequestedCompany(null);
	};

	// handler when a recent search is clicked.
	// immediately sets the report and companyName, so the UI renders splitReport.
	const handleRecentSearchSelect = (selectedReport: Report, company: string) => {
		setReport(selectedReport);
		setCompanyName(company);
		setHasSearched(true);
		setInaccessibleLink(null);
		// when selecting a recent search, also update and persist the header
		setLastSearchedCompany(company);
		saveHeaderToStorage(company);
	};

	// Reset back to search view
	const handleBack = () => {
		setHasSearched(false);
		setCompanyName('');
		setInaccessibleLink(null);
	};

	return (
		<View style={styles.container}>
			<YGroup>
				<YGroup.Item>
					<Input
						size="$4"
						onChangeText={(name) => setCompanyName(name)}
						placeholder="Enter company name"
						value={companyName}
						style={styles.input}
						returnKeyType="search"
						onSubmitEditing={handleSearch}
						multiline={false}
					/>
				</YGroup.Item>
				<YGroup.Item>
					<Button onPress={handleSearch} style={[styles.searchButton, loading ? styles.disabledButton : {}]} disabled={loading}>Search</Button>
				</YGroup.Item>
				<YGroup.Item>
					{(!hasSearched) ? (
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
					) : (
						<>
							<View>
								<XStack style={styles.headerContainer}>
									<Button onPress={handleBack} style={styles.backButton}>
										<ChevronLeft size={'$2'} color={'white'}/>
									</Button>
									<Text fontSize="$6" paddingBlock={'$3'} color="white" style={styles.header}>{lastSearchedCompany || companyName}</Text>
								</XStack>
							{errorMessage ? (
								<View style={styles.spinnerContainer}>
									<Text color="white">{errorMessage}</Text>
								</View>
							) : inaccessibleLink ? (
								<View style={styles.spinnerContainer}>
									<Text color="white">The report at {inaccessibleLink} is not visible to us. Feel free to check it out for yourself!</Text>
								</View>
							) : (
								(!loading) && <ReportAnalysis report={report} />
							)}
							</View>
						</>
					)}
				</YGroup.Item>
			</YGroup>
			{loading && (
				<View style={styles.spinnerContainer}>
					<Text style={styles.spinnerText}>Searching...</Text>
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
		borderWidth: 0,
		borderColor: 'transparent',
		backgroundColor: '#ffffff',
	},
	searchButton: {
		borderWidth: 5,
		borderRadius: 5,
		borderColor: '#2c3e50',
		backgroundColor: '#e8e8e8',
	},
	spinnerContainer: {
		justifyContent: 'center',
		alignItems: 'center',
		flex: 1,
	},
	spinnerText: {
		color: 'white',
		marginBottom: 20,
		fontSize: 16,
		fontWeight: 'bold',
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
	errorContainer: {
		paddingHorizontal: 12,
		paddingVertical: 6,
	},
	disabledButton: {
		opacity: 0.6,
	},
});

export default Search;

