import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMutation } from '@tanstack/react-query';
import {
  SmartToy,
  Work,
  Schedule,
  AccessTime,
  Info,
  CheckCircle,
  AutoAwesome,
  Mic,
  VolumeUp,
  VolumeOff,
  PlayArrow,
  Stop
} from '@mui/icons-material';

interface DaySchedule {
  startTime: string;
  endTime: string;
}

interface GeneratedSchedule {
  [day: string]: DaySchedule[];
}

interface AIScheduleCreatorProps {
  onScheduleGenerated?: (schedule: GeneratedSchedule) => void;
}

// Type declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface ScheduleQuestions {
  workHours: string;
  workDays: string[];
  availabilityNotes: string;
}

const AIScheduleCreator = ({ onScheduleGenerated }: AIScheduleCreatorProps) => {
  const { t, language } = useLanguage();
  const [questions, setQuestions] = useState<ScheduleQuestions>({
    workHours: '',
    workDays: [],
    availabilityNotes: ''
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSchedule, setGeneratedSchedule] = useState<GeneratedSchedule | null>(null);
  const [showSchedule, setShowSchedule] = useState(false);
  
  // Audio states
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(false);
  
  // Refs for Web Speech API
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);

  const { toast } = useToast();

  const workDayOptions = useMemo(() => [
    { value: 'monday', label: t('days.monday') },
    { value: 'tuesday', label: t('days.tuesday') },
    { value: 'wednesday', label: t('days.wednesday') },
    { value: 'thursday', label: t('days.thursday') },
    { value: 'friday', label: t('days.friday') },
    { value: 'saturday', label: t('days.saturday') },
    { value: 'sunday', label: t('days.sunday') }
  ], [t]);
  
  // Questions array for audio navigation
  const questionsArray = useMemo(() => [
    {
      id: 'workHours',
      text: t('aiSchedule.workHours.label'),
      audioPrompt: t('aiSchedule.workHours.audioPrompt'),
      type: 'text'
    },
    {
      id: 'workDays',
      text: t('aiSchedule.workDays.label'),
      audioPrompt: t('aiSchedule.workDays.audioPrompt'),
      type: 'multiselect'
    },
    {
      id: 'availabilityNotes',
      text: t('aiSchedule.availabilityNotes.label'),
      audioPrompt: t('aiSchedule.availabilityNotes.audioPrompt'),
      type: 'text'
    }
  ], [t]);

  // Mutation for generating AI schedule
  const generateAISchedule = useMutation({
    mutationFn: async (scheduleData: ScheduleQuestions) => {
      const token = localStorage.getItem('authToken');
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

      const response = await fetch(`${baseUrl}/ai-booking/generate-schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          workHours: scheduleData.workHours,
          workDays: scheduleData.workDays,
          availabilityNotes: scheduleData.availabilityNotes
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate AI schedule');
      }

      return await response.json();
    }
  });

  // Initialize Web Speech API
  useEffect(() => {
    // Check for browser support
    if ('speechSynthesis' in window) {
      speechSynthesisRef.current = new SpeechSynthesisUtterance();
      speechSynthesisRef.current.rate = 1;
      speechSynthesisRef.current.pitch = 1;
      speechSynthesisRef.current.volume = 1;
    }
    
    // Initialize speech recognition
    const SpeechRecognition = (window as Window & { SpeechRecognition?: new () => SpeechRecognition; webkitSpeechRecognition?: new () => SpeechRecognition }).SpeechRecognition || 
      (window as Window & { SpeechRecognition?: new () => SpeechRecognition; webkitSpeechRecognition?: new () => SpeechRecognition }).webkitSpeechRecognition;
    if (SpeechRecognition) {
      speechRecognitionRef.current = new SpeechRecognition();
      speechRecognitionRef.current.continuous = false;
      speechRecognitionRef.current.interimResults = false;
      // Set language based on selected locale
      speechRecognitionRef.current.lang = language === 'fr' ? 'fr-FR' : 
                                          language === 'ar' ? 'ar-SA' : 
                                          'en-US';
      
      speechRecognitionRef.current.onend = () => setIsListening(false);
    }
    
    return () => {
      // Cleanup
      if (speechSynthesisRef.current) {
        window.speechSynthesis.cancel();
      }
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
    };
  }, [language]);
  
  // Speech result handler
  const handleSpeechResult = useCallback((event: SpeechRecognitionEvent) => {
    const transcript = event.results[0][0].transcript.toLowerCase();
    const currentQuestion = questionsArray[currentQuestionIndex];
    
    if (currentQuestion.id === 'workHours') {
      setQuestions(prev => ({ ...prev, workHours: transcript }));
      // Move to next question
      if (currentQuestionIndex < questionsArray.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      }
    } else if (currentQuestion.id === 'workDays') {
      // Parse days from speech
      const days = workDayOptions.filter(day => 
        transcript.includes(day.label.toLowerCase())
      ).map(day => day.value);
      
      if (days.length > 0) {
        setQuestions(prev => ({ ...prev, workDays: days }));
        // Move to next question
        if (currentQuestionIndex < questionsArray.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
        }
      }
    } else if (currentQuestion.id === 'availabilityNotes') {
      if (!transcript.includes('skip')) {
        setQuestions(prev => ({ ...prev, availabilityNotes: transcript }));
      }
      // This is the last question, so we can prompt to generate
      if (audioEnabled && speechSynthesisRef.current) {
        const finalText = language === 'fr' ? 'Parfait! J\'ai toutes les informations nécessaires. Voulez-vous que je génère votre horaire maintenant?' : 
                         language === 'ar' ? 'ممتاز! لدي كل المعلومات المطلوبة. هل تريد مني إنشاء جدولك الآن؟' :
                         'Great! I have all the information I need. Would you like me to generate your schedule now?';
        speechSynthesisRef.current.text = finalText;
        window.speechSynthesis.speak(speechSynthesisRef.current);
      }
    }
  }, [currentQuestionIndex, audioEnabled, questionsArray, workDayOptions, language]);
  
  // Set up speech recognition handlers
  useEffect(() => {
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.onresult = handleSpeechResult;
      speechRecognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        if (event.error === 'not-allowed') {
          toast({
            title: t('aiSchedule.microphoneError'),
            description: t('aiSchedule.microphoneErrorDesc'),
            variant: "destructive",
          });
        }
      };
    }
  }, [handleSpeechResult, toast, t]);
  
  // Text-to-Speech function
  const speakQuestion = useCallback((text: string) => {
    if (!speechSynthesisRef.current || !audioEnabled) return;
    
    window.speechSynthesis.cancel(); // Cancel any ongoing speech
    speechSynthesisRef.current.text = text;
    speechSynthesisRef.current.onstart = () => setIsSpeaking(true);
    speechSynthesisRef.current.onend = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(speechSynthesisRef.current);
  }, [audioEnabled]);
  
  // Auto-speak current question when audio is enabled
  useEffect(() => {
    if (audioEnabled && currentQuestionIndex < questionsArray.length && !showSchedule) {
      speakQuestion(questionsArray[currentQuestionIndex].audioPrompt);
    }
  }, [audioEnabled, currentQuestionIndex, showSchedule, speakQuestion, questionsArray]);
  
  // Speech-to-Text functions
  const startListening = () => {
    if (!speechRecognitionRef.current || !audioEnabled) return;
    
    setIsListening(true);
    speechRecognitionRef.current.start();
  };
  
  const stopListening = () => {
    if (!speechRecognitionRef.current) return;
    
    speechRecognitionRef.current.stop();
    setIsListening(false);
  };
  
  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled);
    if (!audioEnabled) {
      setCurrentQuestionIndex(0);
    } else {
      window.speechSynthesis.cancel();
      if (speechRecognitionRef.current && isListening) {
        speechRecognitionRef.current.stop();
      }
    }
  };

  // Remove the saveScheduleToProfile mutation - let parent handle saving

  const handleWorkDayToggle = (day: string) => {
    setQuestions(prev => ({
      ...prev,
      workDays: prev.workDays.includes(day)
        ? prev.workDays.filter(d => d !== day)
        : [...prev.workDays, day]
    }));
  };

  const handleGenerateSchedule = async () => {
    if (!questions.workHours || questions.workDays.length === 0) {
      toast({
        title: t('aiSchedule.missingInfo'),
        description: t('aiSchedule.missingInfoDesc'),
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      console.log('Calling AI Schedule API with:', questions);
      const result = await generateAISchedule.mutateAsync(questions);
      console.log('AI Schedule Generation Result:', result);
      
      if (result.schedule) {
        setGeneratedSchedule(result.schedule);
        setShowSchedule(true);

        handleSaveSchedule();
        toast({
          title: t('aiSchedule.generationSuccess'),
          description: t('aiSchedule.generationSuccessDesc'),
        });
      } else {
        throw new Error('No schedule returned from API');
      }

    } catch (error) {
      console.error('AI Schedule Generation Error:', error);
      toast({
        title: t('aiSchedule.generationError'),
        description: (error as Error).message || t('aiSchedule.generationError'),
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveSchedule = async () => {
    if (!generatedSchedule) return;

    console.log('Passing generated schedule to parent:', generatedSchedule);
    
    // Pass the generated schedule to parent component
    if (onScheduleGenerated) {
      onScheduleGenerated(generatedSchedule);
    }

    // Reset form
    setQuestions({
      workHours: '',
      workDays: [],
      availabilityNotes: ''
    });
    setShowSchedule(false);
    setGeneratedSchedule(null);
  };

  return (
    <Card className="border-2 border-purple-100 bg-gradient-to-br from-purple-50 to-indigo-50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <AutoAwesome className="w-5 h-5 text-purple-600" />
              {t('aiSchedule.title')}
            </CardTitle>
            <p className="text-sm text-purple-700 mt-1">
              {t('aiSchedule.description')}
            </p>
          </div>
          <Button
            onClick={toggleAudio}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            style={{ borderColor: audioEnabled ? '#9333ea' : '#e5e7eb' }}
          >
            {audioEnabled ? (
              <>
                <VolumeUp className="w-4 h-4" style={{ color: '#9333ea' }} />
                <span style={{ color: '#9333ea' }}>{t('aiSchedule.audioOn')}</span>
              </>
            ) : (
              <>
                <VolumeOff className="w-4 h-4" />
                <span>{t('aiSchedule.enableAudio')}</span>
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {!showSchedule ? (
          <>
            {/* Audio Controls Bar */}
            {audioEnabled && (
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isSpeaking && (
                      <div className="flex items-center gap-2 text-purple-700">
                        <VolumeUp className="w-4 h-4 animate-pulse" />
                        <span className="text-sm">{t('aiSchedule.aiSpeaking')}</span>
                      </div>
                    )}
                    {isListening && (
                      <div className="flex items-center gap-2 text-green-700">
                        <Mic className="w-4 h-4 animate-pulse" />
                        <span className="text-sm">{t('aiSchedule.listening')}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => speakQuestion(questionsArray[currentQuestionIndex].audioPrompt)}
                      size="sm"
                      variant="outline"
                      disabled={isSpeaking}
                      className="flex items-center gap-1"
                    >
                      <PlayArrow className="w-4 h-4" />
                      {t('aiSchedule.repeat')}
                    </Button>
                    <Button
                      onClick={isListening ? stopListening : startListening}
                      size="sm"
                      variant={isListening ? "destructive" : "default"}
                      className="flex items-center gap-1"
                      style={!isListening ? {backgroundColor: '#9333ea'} : {}}
                    >
                      {isListening ? (
                        <>
                          <Stop className="w-4 h-4" />
                          {t('aiSchedule.stop')}
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4" />
                          {t('aiSchedule.speak')}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Question 1: Work Hours */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900 flex items-center gap-2">
                <Work className="w-4 h-4 text-purple-600" />
                {t('aiSchedule.workHours.label')}
                {audioEnabled && currentQuestionIndex === 0 && (
                  <Badge variant="secondary" className="text-xs ml-2">
                    {t('aiSchedule.currentQuestion')}
                  </Badge>
                )}
              </Label>
              <Input
                placeholder={t('aiSchedule.workHours.placeholder')}
                value={questions.workHours}
                onChange={(e) => setQuestions(prev => ({ ...prev, workHours: e.target.value }))}
                className="w-full"
              />
              <p className="text-xs text-gray-600">{t('aiSchedule.workHours.help')}</p>
            </div>

            {/* Question 2: Work Days */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-900 flex items-center gap-2">
                <Schedule className="w-4 h-4 text-purple-600" />
                {t('aiSchedule.workDays.label')}
                {audioEnabled && currentQuestionIndex === 1 && (
                  <Badge variant="secondary" className="text-xs ml-2">
                    {t('aiSchedule.currentQuestion')}
                  </Badge>
                )}
              </Label>
              <div className="flex flex-wrap gap-2">
                {workDayOptions.map((day) => (
                  <Button
                    key={day.value}
                    type="button"
                    variant={questions.workDays.includes(day.value) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleWorkDayToggle(day.value)}
                    className="text-xs"
                    style={questions.workDays.includes(day.value) ?
                      {backgroundColor: '#9333ea', borderColor: '#9333ea'} :
                      {borderColor: '#9333ea', color: '#9333ea'}
                    }
                  >
                    {day.label}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-gray-600">{t('aiSchedule.workDays.help')}</p>
            </div>

            {/* Question 3: Additional Notes */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900 flex items-center gap-2">
                <Info className="w-4 h-4 text-purple-600" />
                {t('aiSchedule.availabilityNotes.label')}
                {audioEnabled && currentQuestionIndex === 2 && (
                  <Badge variant="secondary" className="text-xs ml-2">
                    {t('aiSchedule.currentQuestion')}
                  </Badge>
                )}
              </Label>
              <Textarea
                placeholder={t('aiSchedule.availabilityNotes.placeholder')}
                value={questions.availabilityNotes}
                onChange={(e) => setQuestions(prev => ({ ...prev, availabilityNotes: e.target.value }))}
                className="w-full min-h-[80px]"
              />
              <p className="text-xs text-gray-600">{t('aiSchedule.availabilityNotes.help')}</p>
            </div>

            {/* Generate Button */}
            <div className="pt-4">
              <Button
                type="button"
                onClick={handleGenerateSchedule}
                disabled={isGenerating || generateAISchedule.isPending}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                <SmartToy className="w-4 h-4 mr-2" />
                {isGenerating || generateAISchedule.isPending ? t('aiSchedule.generatingSchedule') : t('aiSchedule.generateSchedule')}
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Generated Schedule Display */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pt-2 border-t border-purple-200">
                <SmartToy className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-semibold text-purple-900">
                  {t('aiSchedule.generatedTitle')}
                </h3>
                <Badge variant="outline" className="text-xs text-purple-700 border-purple-200">
                  {t('aiSchedule.optimizedBadge')}
                </Badge>
              </div>

              {/* Schedule Preview */}
              {generatedSchedule && (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {Object.entries(generatedSchedule).map(([day, slots]) => (
                    <div key={day} className="p-4 rounded-lg border border-purple-100 bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 capitalize">{day}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {slots.length} {t('aiSchedule.slots')}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        {slots.map((slot, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                            <AccessTime className="w-3 h-3 text-purple-500" />
                            <span>{slot.startTime} - {slot.endTime}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-purple-200">
                <Button
                  type="button"
                  onClick={handleSaveSchedule}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {t('aiSchedule.applySchedule')}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setShowSchedule(false);
                    setGeneratedSchedule(null);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  {t('aiSchedule.regenerate')}
                </Button>
              </div>

              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-600 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-purple-900">{t('aiSchedule.smartComplete')}</p>
                    <p className="text-xs text-purple-700 mt-1">
                      {t('aiSchedule.smartCompleteDesc')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AIScheduleCreator;