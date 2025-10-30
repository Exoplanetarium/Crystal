import React, { useState, useEffect, FC } from 'react';
import { StyleSheet } from 'react-native';
import { View, Text, XStack, XGroup, Separator, ListItem, YGroup, ScrollView } from 'tamagui';

interface CertProps {
	certifications: string;
}

interface Certification {
	header: string;
	issuingBody: string;
	status: string;
	description: string;
}

const Certifications: FC<CertProps> = ({ certifications }) => {
	const [certArray, setCertArray] = useState<Certification[]>([]);

	useEffect(() => {
		if (certifications) {
			const splitCerts = certifications.split('\n\n').filter(cert => cert.trim().startsWith('-'));
			const parsedCerts: Certification[] = splitCerts.map(cert => {
				// remove uneeded characters
				cert = cert.replaceAll('{', '').replaceAll('}', '').replaceAll('- -', '-').trim();
				// Extract header
				const headerMatch = cert.match(/Certification Name:(.*)\n/i);
				const fallBackHeader = cert.match(/-(.*)\n/i);
				const header = headerMatch ? headerMatch[1].trim()
					: fallBackHeader ? fallBackHeader[1].trim() : '';

				if (header === 'Certifications') {
					return {
						header: '',
						issuingBody: '',
						dateObtained: '',
						dataExpiration: '',
						status: '',
						description: '',
					};
				}

				// Extract issuing body
				const issuingBodyMatch = cert.match(/Issuing Body:(.*)\n/i);
				const fallbackIssuingBody = cert.match(/\*(.*)\n/i);
				const issuingBody = issuingBodyMatch ? issuingBodyMatch[1].trim()
					: fallbackIssuingBody ? fallbackIssuingBody[1].trim() : '';
				cert = cert.replace(/\*(.*)\n/i, '');
				// // Extract date obtained
				// const dateObtainedMatch = cert.match(/Date Obtained:(.*?)\n/i);
				// const dateObtained = dateObtainedMatch ? dateObtainedMatch[1].trim() : '';

				// // Extract data expiration
				// const dataExpirationMatch = cert.match(/Expiration Date:(.*?)\n/i);
				// const dataExpiration = dataExpirationMatch ? dataExpirationMatch[1].trim() : '';

				// Extract status
				const statusMatch = cert.match(/Status:(.*)\n/i);
				const fallBackStatus = cert.match(/\*(.*)\n/i);
				const status = statusMatch ? statusMatch[1].trim()
					: fallBackStatus ? fallBackStatus[1].trim() : '';
				cert = cert.replace(/\*(.*)\n/i, '');

				// Extract description
				const descriptionMatch = cert.match(/Description:(.*)/i);
				const fallbackDescription = cert.match(/\*(.*)/i);
				const description = descriptionMatch ? descriptionMatch[1].trim()
					: fallbackDescription ? fallbackDescription[1].trim() : '';

				return { header, issuingBody, status, description };
			});

			const trimmedCerts = parsedCerts.filter(obj =>
				!Object.values(obj).every(val => val === '')
			);

			console.log(certifications);
			console.log(trimmedCerts);
			setCertArray(trimmedCerts);
		}
	}, [certifications]);

	return (
		<View style={styles.container}>
			<Text fontSize="$6" color="white" style={styles.certHeader}>Certifications</Text>
			<ScrollView horizontal>
				<View style={styles.contentContainer}>
					<XStack paddingBlock={'$3'} gap="$3">
						{certArray.map((cert, index) => (
							<ListItem padded key={index} style={styles.card} elevation={2}>
								<YGroup gap="$2" flex={1}>
									<View>
										<Text fontSize="$4" color="white" style={styles.header}>{cert.header}</Text>
										<Text fontSize="$3" color="white" style={styles.listItem}>Issuing Body: {cert.issuingBody}</Text>
											<XGroup gap="$2">
												<Separator vertical borderWidth={1} borderColor={cert.status.toLowerCase() === 'active'
													? '#96ff81' : cert.status.toLowerCase() === 'pending'
													? '#fbea53' : cert.status.toLowerCase() === 'expired'
													? '#f06464' : 'white'}/>
												<Text fontSize="$3" color="white" style={styles.listItem}>{cert.status}</Text>
											</XGroup>
										<Text fontSize="$3" color="white" style={styles.listItem}>{cert.description}</Text>
									</View>
								</YGroup>
							</ListItem>
						))}
						</XStack>
					</View>
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
		contentContainer: {
			flexDirection: 'row',
			alignSelf: 'flex-start',
		},
		header: {
			fontWeight: 'bold',
		},
		certHeader: {
			fontWeight: 'bold',
			marginLeft: 7,
		},
		card: {
			backgroundColor: '#252e43',
			borderRadius: 10,
			marginHorizontal: 7,
			maxWidth: 320,
		},
		listItem: {
			color: 'white',
			backgroundColor: '#252e43',
			borderRadius: 10,
		},
	});

	export default Certifications;

