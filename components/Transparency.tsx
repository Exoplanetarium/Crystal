import React, { FC, useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { View, Text, YGroup, Accordion, Square } from 'tamagui';
import { ChevronDown } from '@tamagui/lucide-icons';

interface Transparency {
  infoDisclose: string;
  clarity: string;
  accuracy: string;
  infoDiscloseScore?: number;
  clarityScore?: number;
  accuracyScore?: number;
}

interface TransparencyProps {
  transparency: string;
}

// Clean text outputs using regex (removes redundancy)
const cleanText = (text: string): string => {
  return text
    .replace(/Description:\s*/gi, '') // Remove "Description:" prefix
    .replace(/Score\s*\(\d+\)\s*:?\s*/gi, '') // Remove legacy "Score (XX):" prefix
    .replace(/^\s*\(\d+\)\s*/gi, '') // Remove score numbers at start: "(75) text" -> "text"
    .replace(/\n+/g, ' ') // Replace line breaks with spaces
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[()]/g, '') // Remove remaining parentheses
    .replace(/\/100/g, '') // Remove "/100"
    .trim(); // Trim extra spaces
};

// Parse transparency text into structured sections with scores
const parseTransparency = (text: string): Transparency => {
  // Optimized regex patterns for the exact template format: "Category: (score) description"
    const infoDiscloseMatch = text.match(/Information\s+Disclosure:\s*\((\d+)\)\s*(.*?)(?=\n\s*(?:Clarity)|$)/is) ||
                           text.match(/Information\s+Disclosure[^(]*\((\d+)\)[^:]*:?\s*(.*?)(?=\n\s*(?:Clarity)|$)/is);

  const clarityMatch = text.match(/Clarity:\s*\((\d+)\)\s*(.*?)(?=\n\s*(?:Information|Accuracy)|$)/is) ||
                      text.match(/Clarity[^(]*\((\d+)\)[^:]*:?\s*(.*?)(?=\n\s*(?:Information|Accuracy)|$)/is);

  // Special handling for Accuracy since it's typically the last section
  const accuracyMatch = text.match(/Accuracy:\s*\((\d+)\)\s*(.*?)$/is) ||
                       text.match(/Accuracy[^(]*\((\d+)\)[^:]*:?\s*(.*?)$/is) ||
                       text.match(/Accuracy:\s*\((\d+)\)\s*(.*?)(?=\n\s*(?:Information|Clarity))/is) ||
                       text.match(/Accuracy[^(]*\((\d+)\)[^:]*:?\s*(.*?)(?=\n\s*(?:Information|Clarity))/is);

  return {
    infoDisclose: cleanText(infoDiscloseMatch ? infoDiscloseMatch[2] : ''),
    clarity: cleanText(clarityMatch ? clarityMatch[2] : ''),
    accuracy: cleanText(accuracyMatch ? accuracyMatch[2] : ''),
    infoDiscloseScore: infoDiscloseMatch ? parseInt(infoDiscloseMatch[1], 10) : undefined,
    clarityScore: clarityMatch ? parseInt(clarityMatch[1], 10) : undefined,
    accuracyScore: accuracyMatch ? parseInt(accuracyMatch[1], 10) : undefined,
  };
};

// Calculate transparency score based on AI scores or content quality
const calculateTransparencyScore = (data: Transparency): number => {
  // If AI scores are available, use their average
  const scores = [
    data.infoDiscloseScore,
    data.clarityScore,
    data.accuracyScore,
  ].filter(score => score !== undefined) as number[];

  if (scores.length > 0) {
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }

  // Fallback to content-based scoring
  let score = 0;
  const sections = [data.infoDisclose, data.clarity, data.accuracy];

  sections.forEach(section => {
    if (section && section.length > 50) {
      score += 25; // Full points for substantial content
    } else if (section && section.length > 20) {
      score += 15; // Partial points
    } else if (section && section.length > 0) {
      score += 5; // Minimal points
    }
  });

  return Math.min(score, 100);
};

// Get transparency level and color based on score
const getTransparencyLevel = (score: number): { level: string; color: string } => {
  if (score >= 80) {
    return { level: 'Excellent', color: '#96ff81' };
  }
  if (score >= 60) {
    return { level: 'Good', color: '#fbea53' };
  }
  if (score >= 40) {
    return { level: 'Fair', color: '#ff9500' };
  }
  return { level: 'Limited', color: '#f06464' };
};

const Transparency: FC<TransparencyProps> = ({ transparency }) => {
  const [parsedData, setParsedData] = useState<Transparency | null>(null);

  useEffect(() => {
    if (transparency) {
      const data = parseTransparency(transparency);
      // console.log(transparency);
      // console.log(data);
      setParsedData(data);
    }
  }, [transparency]);

  if (!parsedData) {
    return <Text style={styles.title} fontSize="$5">Transparency</Text>;
  }

  // Transparency Sections
  const sections = [
    { title: 'Information Disclosure', content: parsedData.infoDisclose },
    { title: 'Clarity', content: parsedData.clarity },
    { title: 'Accuracy', content: parsedData.accuracy },
  ];

  // Calculate transparency score and level
  const score = calculateTransparencyScore(parsedData);
  const { level, color } = getTransparencyLevel(score);
  return (
    <View style={styles.container}>
      <Text style={styles.title} fontSize="$6" color="white" fontWeight={'bold'} marginStart={7}>Transparency</Text>
      <View style={styles.card}>
        <Text style={[styles.score, { color }]}>{score}%</Text>
        <Text style={[styles.level, { color }]}>{level}</Text>
      </View>
      <Accordion overflow="hidden" type="multiple">
        <YGroup style={styles.accordionContainer}>
          {sections.map((section, index) => (
            <YGroup.Item key={index}>
              <Accordion.Item value={`section-${index}`}>
                <Accordion.Trigger style={styles.listItem}>
                  {({
                    open,
                  }: {
                    open: boolean
                  }) => (
                    <>
                      <Text style={styles.sectionTitle} fontSize={'$3'} numberOfLines={1}>
                        {section.title}
                      </Text>
                      <Square animation="quick" rotate={open ? '180deg' : '0deg'}>
                          <ChevronDown size="$1" color={'white'}/>
                      </Square>
                    </>
                  )}
                </Accordion.Trigger>
                <Accordion.HeightAnimator animation="medium">
                  <Accordion.Content animation="medium" style={styles.contentContainer}>
                    <Text style={styles.content}>{section.content}</Text>
                  </Accordion.Content>
                </Accordion.HeightAnimator>
              </Accordion.Item>
            </YGroup.Item>
          ))}
        </YGroup>
      </Accordion>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 3,
    marginVertical: 15,
    flex: 1,
  },
  title: {
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 20,
    marginLeft: 10,
  },
  sectionTitle: {
    color: 'white',
    fontWeight: 'bold',
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  content: {
    fontSize: 14,
    color: '#ffffffa2',
    padding: 15,
    lineHeight: 20,
  },
  contentContainer: {
    backgroundColor: '#252e43',
    borderRadius: 10,
  },
  listItem: {
    color: 'white',
    backgroundColor: '#252e43',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 10,
    marginBottom: 2,
  },
  accordionContainer: {
    borderWidth: 0,
    borderColor: 'transparent',
    borderRadius: 10,
    marginHorizontal: 7,
  },
  card: {
    backgroundColor: '#252e43',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    marginHorizontal: 7,
    alignItems: 'center',
  },
  score: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  level: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 5,
  },
});

export default Transparency;
