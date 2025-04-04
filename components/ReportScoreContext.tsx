import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ReportScoreContextType {
  goalsScore: number;
  environmentScore: number;
  certificationsScore: number;
  transparencyScore: number;
  setGoalsScore: (score: number) => void;
  setEnvironmentScore: (score: number) => void;
  setCertificationsScore: (score: number) => void;
  setTransparencyScore: (score: number) => void;
}

const ReportScoreContext = createContext<ReportScoreContextType | undefined>(undefined);

export const ReportScoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [goalsScore, setGoalsScore] = useState(0);
  const [environmentScore, setEnvironmentScore] = useState(0);
  const [certificationsScore, setCertificationsScore] = useState(0);
  const [transparencyScore, setTransparencyScore] = useState(0);

  return (
    <ReportScoreContext.Provider
      value={{
        goalsScore,
        environmentScore,
        certificationsScore,
        transparencyScore,
        setGoalsScore,
        setEnvironmentScore,
        setCertificationsScore,
        setTransparencyScore,
      }}
    >
      {children}
    </ReportScoreContext.Provider>
  );
};

export const useReportScoreContext = () => {
  const context = useContext(ReportScoreContext);
  if (!context) {
    throw new Error('useReportScoreContext must be used within a ReportScoreProvider');
  }
  return context;
};
