import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import {
  SmartToy,
  Psychology,
  AttachMoney,
  Schedule,
  CheckCircle,
  AutoAwesome,
  LocalOffer
} from '@mui/icons-material';

interface GeneratedService {
  name: string;
  description: string;
  price: number;
  duration: number;
  categoryId: string;
  maxBookingsPerDay: number;
  requirements: string[];
  tags: string[];
  slots?: string[];
}

interface AIServiceCreatorProps {
  onServiceGenerated?: (service: GeneratedService) => void;
  categories: Array<{ _id: string; name: string }>;
  providerSchedule?: Array<{
    dayOfWeek: number;
    isAvailable: boolean;
    startTime: string;
    endTime: string;
    timeSlots?: Array<{ startTime: string; endTime: string }>;
  }>;
}

interface ServiceQuestions {
  serviceDetails: string;
  servicePricing: string;
}

const AIServiceCreator = ({ onServiceGenerated, categories, providerSchedule = [] }: AIServiceCreatorProps) => {
  const [questions, setQuestions] = useState<ServiceQuestions>({
    serviceDetails: '',
    servicePricing: ''
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedService, setGeneratedService] = useState<GeneratedService | null>(null);
  const [showService, setShowService] = useState(false);

  const { toast } = useToast();

  // Mutation for generating AI service
  const generateAIService = useMutation({
    mutationFn: async (serviceData: ServiceQuestions) => {
      const token = localStorage.getItem('authToken');
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

      const response = await fetch(`${baseUrl}/ai-booking/generate-service`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          serviceDetails: serviceData.serviceDetails,
          servicePricing: serviceData.servicePricing,
          categories: categories.map(cat => ({ id: cat._id, name: cat.name })),
          providerSchedule: providerSchedule
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate AI service');
      }

      return await response.json();
    }
  });

  const handleGenerateService = async () => {
    if (!questions.serviceDetails || !questions.servicePricing) {
      toast({
        title: "Missing Information",
        description: "Please answer both questions to generate your service.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      console.log('Calling AI Service Generation API with:', questions);
      const result = await generateAIService.mutateAsync(questions);
      console.log('AI Service Generation Result:', result);
      
      if (result.service) {
        setGeneratedService(result.service);
        setShowService(true);

        toast({
          title: "Service Generated!",
          description: "Your AI-powered service has been created successfully.",
        });
      } else {
        throw new Error('No service returned from API');
      }

    } catch (error: any) {
      console.error('AI Service Generation Error:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate AI service",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyService = () => {
    if (!generatedService) return;

    console.log('Applying generated service:', generatedService);
    
    // Pass the generated service to parent component
    if (onServiceGenerated) {
      onServiceGenerated(generatedService);
    }

    // Reset form
    setQuestions({
      serviceDetails: '',
      servicePricing: ''
    });
    setShowService(false);
    setGeneratedService(null);
  };

  return (
    <Card className="border-2 border-green-100 bg-gradient-to-br from-green-50 to-emerald-50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-green-900">
          <AutoAwesome className="w-5 h-5 text-green-600" />
          AI Service Creator
        </CardTitle>
        <p className="text-sm text-green-700">
          Answer 2 quick questions and let AI create your complete service listing
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {!showService ? (
          <>
            {/* Question 1: Service Details */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900 flex items-center gap-2">
                <LocalOffer className="w-4 h-4 text-green-600" />
                Describe your service in detail
              </Label>
              <Textarea
                placeholder="e.g., Premium hair coloring and styling for busy professionals, includes consultation, color application, cut and style. I use only organic products and have 10+ years experience specializing in natural-looking colors..."
                value={questions.serviceDetails}
                onChange={(e) => setQuestions(prev => ({ ...prev, serviceDetails: e.target.value }))}
                className="w-full min-h-[100px]"
              />
              <p className="text-xs text-gray-600">Include what you offer, who it's for, and what makes it special</p>
            </div>

            {/* Question 2: Pricing and Duration */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900 flex items-center gap-2">
                <AttachMoney className="w-4 h-4 text-green-600" />
                How much do you charge and how long does it take?
              </Label>
              <Textarea
                placeholder="e.g., $75-$150 depending on hair length and complexity, typically takes 2-3 hours. I offer a 15-minute free consultation..."
                value={questions.servicePricing}
                onChange={(e) => setQuestions(prev => ({ ...prev, servicePricing: e.target.value }))}
                className="w-full min-h-[80px]"
              />
              <p className="text-xs text-gray-600">Mention your pricing range and typical service duration</p>
            </div>

            {/* Generate Button */}
            <div className="pt-4">
              <Button
                type="button"
                onClick={handleGenerateService}
                disabled={isGenerating || generateAIService.isPending}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <SmartToy className="w-4 h-4 mr-2" />
                {isGenerating || generateAIService.isPending ? 'Creating Your Service...' : 'Generate AI Service'}
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Generated Service Display */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pt-2 border-t border-green-200">
                <SmartToy className="w-4 h-4 text-green-600" />
                <h3 className="text-sm font-semibold text-green-900">
                  AI-Generated Service
                </h3>
                <Badge variant="outline" className="text-xs text-green-700 border-green-200">
                  Optimized for Success
                </Badge>
              </div>

              {/* Service Preview */}
              {generatedService && (
                <div className="space-y-4 p-4 bg-white rounded-lg border border-green-100">
                  <div>
                    <h4 className="font-semibold text-lg text-gray-900">{generatedService.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{generatedService.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-1 text-gray-500 mb-1">
                        <AttachMoney className="w-4 h-4" />
                        <span className="text-xs">Price</span>
                      </div>
                      <p className="font-semibold text-lg">${generatedService.price}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-gray-500 mb-1">
                        <Schedule className="w-4 h-4" />
                        <span className="text-xs">Duration</span>
                      </div>
                      <p className="font-semibold text-lg">{generatedService.duration} min</p>
                    </div>
                  </div>

                  {generatedService.requirements && generatedService.requirements.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-1">Requirements:</p>
                      <div className="flex flex-wrap gap-1">
                        {generatedService.requirements.map((req, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {req}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {generatedService.tags && generatedService.tags.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-1">Tags:</p>
                      <div className="flex flex-wrap gap-1">
                        {generatedService.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-gray-500">
                    Max bookings per day: {generatedService.maxBookingsPerDay}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-green-200">
                <Button
                  type="button"
                  onClick={handleApplyService}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Create This Service
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setShowService(false);
                    setGeneratedService(null);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Try Again
                </Button>
              </div>

              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-green-900">AI-Optimized Service Ready</p>
                    <p className="text-xs text-green-700 mt-1">
                      This service has been crafted based on your inputs and industry best practices. 
                      Click "Create This Service" to add it to your offerings.
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

export default AIServiceCreator;