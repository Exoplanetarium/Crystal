import React, { FC } from 'react';
import { StyleSheet } from 'react-native';
import { View, Text, ScrollView, ListItem, YGroup, Accordion, Square, Button, Separator } from 'tamagui';
import { ChevronDown } from '@tamagui/lucide-icons';

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

interface RecentSearchesProps {
	onSelect: (report: Report, company: string) => void;
	recentSearches: Report[];
	recentCompanies: string[];
}

const RecentSearches: FC<RecentSearchesProps> = ({ onSelect, recentSearches, recentCompanies }) => {
	return (
		<>
			<View style={styles.container} paddingBlock={'$3'}>
				<Accordion type="single" defaultValue="recentSearches" collapsible>
					<Accordion.Item value="recentSearches" style={styles.contentContainer}>
						<Accordion.Trigger style={styles.accordionTrigger}>
						{({
							open,
						}: {
							open: boolean;
						}) => (
							<View style={styles.triggerWrapper}>
								<Text style={styles.title}>Recent Searches</Text>
								<Square animation="quick" rotate={open ? '180deg' : '0deg'}>
									<ChevronDown size="$1" color={'white'}/>
								</Square>
							</View>

						)}
						</Accordion.Trigger>
						<Accordion.HeightAnimator animation="medium">
							<Accordion.Content animation="medium" style={styles.accordionContent} exitStyle={styles.exitAnimation}>
								<ScrollView style={styles.scrollContainer}>
									<YGroup style={styles.searchContainer} paddingBlock="$3">
										{recentCompanies.map((company, index) => (
											<View key={index}>
												<Button onPress={() => onSelect(recentSearches[index], company)} style={styles.card}>
													<ListItem style={styles.cardContent}>
														<Text style={styles.cardText} fontSize={'$3'}>{company}</Text>
													</ListItem>
												</Button>
												<Separator style={styles.separator}/>
											</View>
										))}
									</YGroup>
								</ScrollView>
							</Accordion.Content>
						</Accordion.HeightAnimator>
					</Accordion.Item>
				</Accordion>
			</View>
		</>
	);
};

const styles = StyleSheet.create({
	container: {
		marginVertical: 10,
		alignItems: 'center',
		height: '86%',
	},
	scrollContainer: {
		width: '100%',
	},
	contentContainer: {
		backgroundColor: '#1b2130',
	},
	accordionTrigger: {
		backgroundColor: '#1b2130',
		borderWidth: 0,
		borderColor: 'transparent',
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	triggerWrapper: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		width: '100%',
	},
	accordionContent: {
		backgroundColor: '#1b2130',
	},
	title: {
		fontSize: 18,
		color: 'white',
		fontWeight: 'bold',
		textAlign: 'center',
	},
	separator: {
		width: '100%',
		alignSelf: 'center',
		borderColor: '#ffffff',
		opacity: 0.1,
	},
	searchContainer: {
		flexDirection: 'column',
	},
	card: {
		backgroundColor: '#1b2130',
		width: '100%',
		alignItems: 'center',
		marginVertical: 5,
	},
	cardText: {
		color: 'white',
		textAlign: 'center',
	},
	cardContent: {
		backgroundColor: '#1b2130',
		justifyContent: 'center',
		alignItems: 'center',
	},
	exitAnimation: {
		opacity: 0,
	},
});

export default RecentSearches;
