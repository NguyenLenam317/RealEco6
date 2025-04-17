import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SessionStorageManager from '../../utils/sessionStorage';

interface SurveyProps {
  onComplete: () => void;
}

const SurveyManager: React.FC<SurveyProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [surveyData, setSurveyData] = useState<Record<string, any>>({});

  useEffect(() => {
    // Load existing survey data from sessionStorage
    const savedSurvey = SessionStorageManager.getSurvey();
    if (savedSurvey) {
      setCurrentStep(savedSurvey.lastStep || 0);
      setSurveyData(savedSurvey.data || {});
    }
  }, []);

  const updateSurveyData = (stepData: Record<string, any>) => {
    const newSurveyData = { ...surveyData, ...stepData };
    setSurveyData(newSurveyData);
    
    // Save to sessionStorage
    SessionStorageManager.saveSurvey({
      lastStep: currentStep + 1,
      data: newSurveyData
    });
  };

  const handleNextStep = async () => {
    // Move to next step
    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);

    // If final step, mark survey as complete
    if (nextStep === 3) {
      try {
        await axios.post('/api/user/survey/complete');
        
        // Clear survey data from sessionStorage
        SessionStorageManager.clearSurvey();
        
        // Trigger completion callback
        onComplete();
      } catch (error) {
        console.error('Error completing survey:', error);
      }
    }
  };

  const renderSurveyStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div>
            <h2>Health Profile</h2>
            {/* Health profile survey inputs */}
            <button onClick={() => {
              updateSurveyData({ healthProfile: {} });
              handleNextStep();
            }}>Next</button>
          </div>
        );
      case 1:
        return (
          <div>
            <h2>Lifestyle Habits</h2>
            {/* Lifestyle habits survey inputs */}
            <button onClick={() => {
              updateSurveyData({ lifestyleHabits: {} });
              handleNextStep();
            }}>Next</button>
          </div>
        );
      case 2:
        return (
          <div>
            <h2>Environmental Sensitivities</h2>
            {/* Environmental sensitivities survey inputs */}
            <button onClick={() => {
              updateSurveyData({ environmentalSensitivities: {} });
              handleNextStep();
            }}>Complete Survey</button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      {renderSurveyStep()}
    </div>
  );
};

export default SurveyManager;
