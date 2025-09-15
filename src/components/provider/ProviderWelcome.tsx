
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Store, Calendar, Clock, User, ArrowRight } from 'lucide-react';

interface ProviderWelcomeProps {
  providerName?: string;
  hasServices?: boolean;
  hasSchedule?: boolean;
  hasProfile?: boolean;
}

const ProviderWelcome = ({ 
  providerName = "Provider", 
  hasServices = false, 
  hasSchedule = false, 
  hasProfile = false 
}: ProviderWelcomeProps) => {
  const setupSteps = [
    {
      title: "Complete Business Profile",
      description: "Add your business information, contact details, and description",
      completed: hasProfile,
      link: "/provider/profile",
      icon: User
    },
    {
      title: "Set Your Schedule",
      description: "Define your working hours and availability",
      completed: hasSchedule,
      link: "/provider/schedule", 
      icon: Clock
    },
    {
      title: "Add Your Services",
      description: "Create service offerings with pricing and duration",
      completed: hasServices,
      link: "/provider/services",
      icon: Store
    }
  ];

  const completedSteps = setupSteps.filter(step => step.completed).length;
  const isSetupComplete = completedSteps === setupSteps.length;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome to Mawaad, {providerName}!
        </h2>
        <p className="text-gray-600">
          {isSetupComplete 
            ? "Your provider account is fully set up. Start managing your business!"
            : "Let's get your provider account set up so clients can start booking with you."
          }
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Setup Progress</span>
            <Badge variant={isSetupComplete ? "default" : "secondary"}>
              {completedSteps}/{setupSteps.length} Complete
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {setupSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div 
                  key={index}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    step.completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      step.completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{step.title}</h3>
                      <p className="text-sm text-gray-600">{step.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {step.completed ? (
                      <Badge variant="default" className="bg-green-600">
                        Complete
                      </Badge>
                    ) : (
                      <Button asChild size="sm">
                        <Link to={step.link} className="flex items-center">
                          Setup
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {isSetupComplete && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button asChild variant="outline" className="h-auto p-4">
                <Link to="/provider/bookings" className="flex flex-col items-center text-center">
                  <Calendar className="w-6 h-6 mb-2" />
                  <span className="font-medium">View Appointments</span>
                  <span className="text-sm text-gray-600">Manage your bookings</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-4">
                <Link to="/provider/services" className="flex flex-col items-center text-center">
                  <Store className="w-6 h-6 mb-2" />
                  <span className="font-medium">Manage Services</span>
                  <span className="text-sm text-gray-600">Add or edit services</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-4">
                <Link to="/provider/schedule" className="flex flex-col items-center text-center">
                  <Clock className="w-6 h-6 mb-2" />
                  <span className="font-medium">Update Schedule</span>
                  <span className="text-sm text-gray-600">Modify availability</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProviderWelcome;
