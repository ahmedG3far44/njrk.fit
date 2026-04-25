import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { userService } from '../../services/user'
import Step1Basics from './Step1Basics'
import Step2Personalization from './Step2Personalization'
import Step3MedicalFitness from './Step3MedicalFitness'
import Step4MedicalVault from './Step4MedicalVault'
import Step5Dream from './Step5Dream'
import type { OnboardingProgress } from '../../services/mockData'

const TOTAL_STEPS = 5

interface StepConfig {
  id: number
  label: string
  icon: React.ReactNode
}

const stepConfigs: StepConfig[] = [
  { id: 1, label: 'Basics', icon: <UserIcon /> },
  { id: 2, label: 'Personalize', icon: <SettingsIcon /> },
  { id: 3, label: 'Health', icon: <HeartIcon /> },
  { id: 4, label: 'Medical', icon: <ShieldIcon /> },
  { id: 5, label: 'Dream', icon: <SparkleIcon /> },
]

function UserIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-1.5 0 6.75 6.75 0 00-13.498 0 .75.75 0 01-1.5 0z" clipRule="evenodd" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.347a.256.256 0 00.256.105h.002a.256.256 0 00.178-.135c.062-.073.121-.15.178-.237a1.75 1.75 0 012.332.326l.415.415A12 12 0 002.025 12c0 6.627 5.373 12 12 12s12-5.373 12-12a12.008 12.008 0 00-.306-.832l.415-.415a1.752 1.752 0 012.331-.326c.09.093.16.194.233.323a1.75 1.75 0 01-.84 3.062l.002.002c-.084.083-.168.167-.25.251-.082.086-.172.16-.262.227-.087.065-.182.12-.268.176a.256.256 0 00.069.286l.002.002c.083.083.178.16.278.226.106.07.2.152.278.25.08.092.148.188.205.293.061.114.093.235.093.358v.003a1.75 1.75 0 01-1.622 1.875l-.415-.415c-.073-.074-.15-.145-.233-.218a6.748 6.748 0 01-.251-.251c-.082-.086-.172-.16-.262-.227-.087-.065-.182-.12-.268-.176a.256.256 0 00-.069-.286l-.002-.002c-.083-.083-.178-.16-.278-.226-.106-.07-.2-.152-.278-.25a1.726 1.726 0 01-.205-.293 1.726 1.726 0 01-.293-.205 1.75 1.75 0 01-.218-.233 6.75 6.75 0 01-.251-.251 1.726 1.726 0 01-.227-.262 1.726 1.726 0 01-.176-.268.256.256 0 00-.286-.069l-.002.002a.256.256 0 00-.135.178c-.063.08-.132.162-.196.24a1.75 1.75 0 01-2.332-.327l-.415-.415a1.75 1.75 0 01-.326-2.332c.073-.087.152-.173.24-.195.088-.023.172-.059.256-.105a.256.256 0 00.105-.256v-.002a1.75 1.75 0 011.875-1.622l.415.415c.074.073.145.15.218.233.08.084.16.168.251.251.086.082.16.172.227.262.065.087.12.182.176.268a.256.256 0 00.286.069h.002c.083 0 .178.033.256.105.063.058.132.13.196.24.065.086.123.173.178.258.06.092.118.188.16.29.046.102.077.208.093.318.018.118.02.238.008.358a1.75 1.75 0 01-1.622 1.875h-.002l-.415-.415a1.752 1.752 0 01-2.332.326c-.09-.093-.16-.194-.233-.323a1.75 1.75 0 01.84-3.062l.002.002c.084-.083.168-.167.25-.251.082-.086.172-.16.262-.227a.256.256 0 00.069-.286l-.002-.002a.256.256 0 00-.178-.135c-.062-.073-.121-.15-.178-.237a1.75 1.75 0 00-2.332.326l-.415.415z" clipRule="evenodd" />
      <path fillRule="evenodd" d="M12 10a2 2 0 100 4 2 2 0 000-4z" clipRule="evenodd" />
    </svg>
  )
}

function HeartIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M11.645 20.91a1.001 1.001 0 01-.647-.647L9.75 12.6l-2.19-3.71a1 1 0 111.76-1.18l2.36 4.006 4.44-7.515a1 1 0 111.72 1.18l-2.91 4.94a1 1 0 01-.638.383h-.003z" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M12 1.5a.75.75 0 01.75.75v4.5a.75.75 0 01-.75.75h-4.5a.75.75 0 010-1.5h3a.75.75 0 01.75.75v3a.75.75 0 01-.75.75h-3a.75.75 0 01-.75-.75v-3A.75.75 0 016 6v4.5a.75.75 0 01-1.5 0V6A2.25 2.25 0 016.75 3.75h4.5A2.25 2.25 0 0113.5 6v4.5a2.25 2.25 0 01-2.25 2.25h-4.5A2.25 2.25 0 014.5 13.5v-4.5A2.25 2.25 0 016.75 6.75h3a.75.75 0 010 1.5h-3A.75.75 0 005.25 9v3a.75.75 0 001.5 0V9a.75.75 0 01.75-.75h4.5a.75.75 0 01.75.75v3a.75.75 0 01-.75.75h-4.5a.75.75 0 010-1.5h3a.75.75 0 01.75-.75V6a.75.75 0 01.75-.75h4.5a.75.75 0 01.75.75v4.5a.75.75 0 01-.75.75h-4.5a.75.75 0 01-.75-.75v-3a.75.75 0 01.75-.75h3a.75.75 0 010 1.5h-3a.75.75 0 01-.75-.75V6z" clipRule="evenodd" />
    </svg>
  )
}

function SparkleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M10.5 1.5a1.5 1.5 0 012.39 2.025l6.375 14.625a1.5 1.5 0 01-2.265 1.823l-4.823-5.39-5.39 4.823a1.5 1.5 0 01-1.823-2.265l14.625-6.375a1.5 1.5 0 011.025-2.39V1.5a1.5 1.5 0 011.5-1.5h2.25a1.5 1.5 0 011.5 1.5v2.25a1.5 1.5 0 002.39 1.025l6.375 14.625a1.5 1.5 0 01-2.265 1.823l-4.823-5.39-5.39 4.823a1.5 1.5 0 01-1.823-2.265l14.625-6.375a1.5 1.5 0 011.025-2.39V1.5a1.5 1.5 0 011.5-1.5h2.25a1.5 1.5 0 011.5 1.5v2.25a1.5 1.5 0 002.39 1.025l6.375 14.625a1.5 1.5 0 01-2.265 1.823l-14.625-6.375a1.5 1.5 0 01-1.025-2.39V12a1.5 1.5 0 00-1.5-1.5H11.5a1.5 1.5 0 00-1.5 1.5v2.25a1.5 1.5 0 01-2.39 1.025l-6.375-14.625a1.5 1.5 0 012.265-1.823l14.625 6.375a1.5 1.5 0 011.025 2.39v2.25a1.5 1.5 0 001.5 1.5h2.25a1.5 1.5 0 001.5-1.5V11.5a1.5 1.5 0 00-1.5-1.5h-2.25a1.5 1.5 0 01-1.5-1.5v-.25z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.06-1.06l-4.5 4.5a.75.75 0 001.06 1.06l4.5-4.5a.75.75 0 000-1.06z" clipRule="evenodd" />
    </svg>
  )
}

interface OnboardingData {
  step1: {
    age?: number
    gender?: string
    height?: number
    weight?: number
  }
  step2: {
    religion?: string
    dietPreference?: string
  }
  step3: {
    allergies?: string[]
    otherAllergy?: string
    activityLevel?: string
  }
  step4: {
    medicalFiles?: string[]
  }
  step5: {
    dreamGoal?: string
  }
}

const initialData: OnboardingData = {
  step1: {},
  step2: {},
  step3: {},
  step4: {},
  step5: {},
}

const OnboardingWizard = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [currentStep, setCurrentStep] = useState(1)
  const [onboardingData, setOnboardingData] = useState<OnboardingData>(initialData)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateStepData = (step: keyof OnboardingData, data: Partial<OnboardingData[keyof OnboardingData]>) => {
    setOnboardingData(prev => ({
      ...prev,
      [step]: { ...prev[step], ...data }
    }))
  }

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleBuildMyPlan = async () => {
    setIsSubmitting(true)
    try {
      const progress: OnboardingProgress = {
        step1: onboardingData.step1,
        step2: onboardingData.step2,
        step3: onboardingData.step3,
        step4: onboardingData.step4,
        step5: onboardingData.step5,
      }

      const updates = {
        isOnboarded: true,
        onboardingProgress: progress,
        age: onboardingData.step1.age,
        gender: onboardingData.step1.gender as 'male' | 'female' | undefined,
        height: onboardingData.step1.height,
        weight: onboardingData.step1.weight,
        activityLevel: onboardingData.step3.activityLevel,
        allergies: onboardingData.step3.allergies,
        dietaryRestrictions: onboardingData.step2.dietPreference ? [onboardingData.step2.dietPreference] : [],
      }

      await userService.updateProfile(updates)

      localStorage.setItem('mockUserOnboarded', 'true')

      await queryClient.invalidateQueries({ queryKey: ['user'] })

      navigate('/dashboard/insights')
    } catch (error) {
      console.error('Failed to complete onboarding:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1Basics
            data={onboardingData.step1}
            onUpdate={(data) => updateStepData('step1', data)}
          />
        )
      case 2:
        return (
          <Step2Personalization
            data={onboardingData.step2}
            onUpdate={(data) => updateStepData('step2', data)}
          />
        )
      case 3:
        return (
          <Step3MedicalFitness
            data={onboardingData.step3}
            onUpdate={(data) => updateStepData('step3', data)}
          />
        )
      case 4:
        return (
          <Step4MedicalVault
            data={onboardingData.step4}
            onUpdate={(data) => updateStepData('step4', data)}
            onNext={handleNext}
          />
        )
      case 5:
        return (
          <Step5Dream
            data={onboardingData.step5}
            onUpdate={(data) => updateStepData('step5', data)}
          />
        )
      default:
        return null
    }
  }

  const getStepStatus = (stepNum: number) => {
    if (stepNum < currentStep) return 'completed'
    if (stepNum === currentStep) return 'active'
    return 'pending'
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            {stepConfigs.map((step, index) => {
              const status = getStepStatus(step.id)
              const isLast = index === stepConfigs.length - 1
              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                        status === 'completed'
                          ? 'bg-green-500 text-white'
                          : status === 'active'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {status === 'completed' ? (
                        <CheckIcon />
                      ) : (
                        step.icon
                      )}
                    </div>
                    <span
                      className={`text-xs mt-1.5 font-medium ${
                        status === 'completed'
                          ? 'text-gray-500'
                          : status === 'active'
                          ? 'text-purple-600'
                          : 'text-gray-400'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {!isLast && (
                    <div
                      className={`flex-1 h-0.5 mx-2 ${
                        index < currentStep - 1 ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                      style={{ minWidth: '40px', maxWidth: '80px' }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="mb-8">
              {renderStep()}
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={handleBack}
                className={`text-gray-600 hover:text-gray-800 font-medium px-4 py-2 rounded-lg transition-colors ${
                  currentStep === 1 ? 'opacity-0 pointer-events-none' : ''
                }`}
              >
                Back
              </button>

              {currentStep === TOTAL_STEPS ? (
                <button
                  type="button"
                  onClick={handleBuildMyPlan}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Building...
                    </>
                  ) : (
                    <>
                      <SparkleIcon />
                      Build My Plan
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Next
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OnboardingWizard