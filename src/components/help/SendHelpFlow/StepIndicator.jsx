import React from 'react';
import { motion } from 'framer-motion';
import { FiCheck } from 'react-icons/fi';

/**
 * StepIndicator - Horizontal stepper for Send Help flow
 * Shows all 4 steps with current step highlighted
 * Sticky on mobile for better UX
 */
const StepIndicator = ({ currentStep, totalSteps = 4 }) => {
    const steps = [
        { number: 1, label: 'Receiver', shortLabel: 'Details' },
        { number: 2, label: 'Payment', shortLabel: 'Method' },
        { number: 3, label: 'Proof', shortLabel: 'Upload' },
        { number: 4, label: 'Confirm', shortLabel: 'Status' }
    ];

    return (
        <div className="sticky top-0 z-10 bg-zinc-100 pb-4 pt-2">
            <div className="flex items-center justify-between gap-2 md:gap-4">
                {steps.map((step, index) => {
                    const isActive = step.number === currentStep;
                    const isCompleted = step.number < currentStep;
                    const isLast = index === steps.length - 1;

                    return (
                        <React.Fragment key={step.number}>
                            {/* Step Circle */}
                            <div className="flex flex-col items-center flex-1">
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: index * 0.1 }}
                                    className={`
                    w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center
                    font-bold text-sm md:text-base transition-all duration-300
                    ${isActive
                                            ? 'bg-slate-900 text-white shadow-lg scale-110'
                                            : isCompleted
                                                ? 'bg-green-600 text-white'
                                                : 'bg-white border-2 border-slate-300 text-slate-400'
                                        }
                  `}
                                >
                                    {isCompleted ? (
                                        <FiCheck className="w-5 h-5" />
                                    ) : (
                                        step.number
                                    )}
                                </motion.div>

                                {/* Step Label */}
                                <motion.div
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 + 0.1 }}
                                    className="mt-2 text-center"
                                >
                                    <p className={`
                    text-xs md:text-sm font-semibold transition-colors
                    ${isActive ? 'text-slate-900' : 'text-slate-600'}
                  `}>
                                        <span className="hidden sm:inline">{step.label}</span>
                                        <span className="sm:hidden">{step.shortLabel}</span>
                                    </p>
                                </motion.div>
                            </div>

                            {/* Connector Line */}
                            {!isLast && (
                                <div className="flex-1 h-0.5 bg-slate-200 -mt-8 md:-mt-10 max-w-[40px] md:max-w-[80px]">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: isCompleted ? '100%' : '0%' }}
                                        transition={{ duration: 0.5, delay: index * 0.1 }}
                                        className="h-full bg-green-600"
                                    />
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};

export default StepIndicator;
