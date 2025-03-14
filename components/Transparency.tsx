import React, { FC, useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { View, Text, YGroup, Accordion, Square, SizableText } from 'tamagui';
import { ChevronDown } from '@tamagui/lucide-icons';

interface Transparency {
  governance: string;
  reporting: string;
  accountability: string;
  setbacks: string;
}

interface TransparencyProps {
  transparency: string;
}

// Clean text outputs using regex (removes redundancy)
const cleanText = (text: string): string => {
  return text
    .replace(/Description:\s*/gi, '') // Remove "Description:" prefix
    .replace(/\n+/g, ' ') // Remove excessive line breaks
    .trim(); // Trim extra spaces
};

// Parse transparency text into structured sections
const parseTransparency = (text: string): Transparency => {
  const governanceMatch = text.match(/Governance Practices:(.*?)(?:\n\s*\n|$)/s);
  const reportingMatch = text.match(/Reporting Frequency:(.*?)(?:\n\s*\n|$)/s);
  const accountabilityMatch = text.match(/Accountability Mechanisms:(.*?)(?:\n\s*\n|$)/s);
  const setbacksMatch = text.match(/Setbacks:(.*?)(?:\n\s*\n|$)/s);

  return {
    governance: cleanText(governanceMatch ? governanceMatch[1] : ''),
    reporting: cleanText(reportingMatch ? reportingMatch[1] : ''),
    accountability: cleanText(accountabilityMatch ? accountabilityMatch[1] : ''),
    setbacks: cleanText(setbacksMatch ? setbacksMatch[1] : ''),
  };
};

const Transparency: FC<TransparencyProps> = ({ transparency }) => {
  const [parsedData, setParsedData] = useState<Transparency | null>(null);

  useEffect(() => {
    if (transparency) {
      const data = parseTransparency(transparency);
      console.log(transparency);
      console.log(data);
      setParsedData(data);
    }
  }, [transparency]);

  if (!parsedData) {
    return <Text style={styles.title} fontSize="$5">Transparency</Text>;
  }

  // Transparency Sections
  const sections = [
    { title: 'Governance Practices', content: parsedData.governance },
    { title: 'Reporting Frequency', content: parsedData.reporting },
    { title: 'Accountability Mechanisms', content: parsedData.accountability },
    { title: 'Setbacks', content: parsedData.setbacks },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title} fontSize="$5">Transparency</Text>
      <YGroup>
        <Accordion type="multiple" style={styles.accordionContainer}>
          {sections.map((section, index) => (
            <Accordion.Item key={index} value={`section-${index}`} style={styles.listItem}>
              <Accordion.Trigger style={styles.listItem}>
                {({
                  open,
                }: {
                  open: boolean
                }) => (
                  <>
                    <View>
                      <Text style={styles.sectionTitle} fontSize={'$3'} numberOfLines={1}>{section.title}</Text>
                      <Square animation="quick" rotate={open ? '180deg' : '0deg'}>
                        <ChevronDown size="$1"/>
                      </Square>
                    </View>
                  </>
                )}
              </Accordion.Trigger>
              <Accordion.Content style={styles.listItem}>
                <Text style={styles.content}>{section.content}</Text>
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion>
      </YGroup>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 10,
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
    paddingVertical: 5,
  },
  content: {
    fontSize: 14,
    color: '#ffffffa2',
    padding: 10,
  },
  listItem: {
    color: 'white',
    backgroundColor: '#252e43',
  },
  accordionContainer: {
    borderWidth: 0,
    borderColor: 'transparent',
  },
});

export default Transparency;
