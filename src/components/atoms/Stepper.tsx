import React from 'react';
import lisaLogoSvg from '../../assets/images/lisa_-_final_-_logo_-_black (2).svg';

interface Step {
  label: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number; // 0-based
  onStepClick?: (stepIndex: number) => void;
  allowNavigation?: boolean;
}

const Stepper: React.FC<StepperProps> = ({ steps, currentStep, onStepClick, allowNavigation = false }) => {
  return (
    <nav className="w-full flex items-center justify-between py-6 bg-transparent px-6">
      {/* Lisa Logo on the left */}
      <div className="flex items-center">
        <img 
          src={lisaLogoSvg} 
          alt="Lisa Logo" 
          className="h-12 w-auto object-contain"
        />
      </div>

      {/* Stepper in the center */}
      <div className="flex-1 flex justify-center">
        <ol className="flex space-x-8">
          {steps.map((step, idx) => {
            const isActive = idx === currentStep;
            const isCompleted = idx < currentStep;
            return (
              <li key={step.label} className="flex items-center">
                <button
                  type="button"
                  className={`flex items-center justify-center w-9 h-9 rounded-full border-2 transition-all duration-150 font-bold text-lg
                    ${isActive ? 'bg-gamma-blue border-gamma-blue text-white shadow-lg' :
                      isCompleted ? 'bg-white border-gamma-blue text-gamma-blue' :
                      'bg-white border-gray-300 text-gray-400'}
                    ${allowNavigation && !isActive ? 'hover:border-gamma-blue hover:text-gamma-blue' : ''}
                  `}
                  disabled={!allowNavigation || isActive}
                  onClick={() => allowNavigation && onStepClick && onStepClick(idx)}
                  aria-current={isActive ? 'step' : undefined}
                >
                  {idx + 1}
                </button>
                <span className={`ml-3 text-base font-medium ${isActive ? 'text-gamma-blue' : 'text-gray-500'}`}>{step.label}</span>
                {idx < steps.length - 1 && (
                  <span className="mx-4 w-8 h-1 bg-gray-200 rounded-full" />
                )}
              </li>
            );
          })}
        </ol>
      </div>

      {/* Empty div on the right for balance */}
      <div className="w-32"></div>
    </nav>
  );
};

export default Stepper; 