
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Store, CalendarToday, Schedule, Person, ArrowForward } from '@mui/icons-material';

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
      icon: Person
    },
    {
      title: "Set Your Schedule",
      description: "Define your working hours and availability",
      completed: hasSchedule,
      link: "/provider/schedule", 
      icon: Schedule
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

      <Card className="shadow-sm border-0 overflow-hidden">
        <div className="px-6 py-4 text-white" style={{backgroundColor: '#025bae'}}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Setup Progress</h2>
            <Badge className={`${isSetupComplete ? 'bg-green-500/20 text-green-100 border-green-400/30' : 'bg-white/20 text-white border-white/30'}`}>
              {completedSteps}/{setupSteps.length} Complete
            </Badge>
          </div>
        </div>
        <CardContent>
          <div className="space-y-4 mt-4">
            {setupSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div 
                  key={index}
                  className={`flex items-center justify-between p-4 rounded-lg border-l-4 ${
                    step.completed ? 'bg-green-50 border-l-green-500 border-green-200' : 'bg-gray-50 border-l-gray-300 border-gray-200'
                  } hover:shadow-sm transition-shadow`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      step.completed ? 'bg-green-100 text-green-600' : 'text-white'
                    }`} style={!step.completed ? {backgroundColor: '#025bae'} : {}}>
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
                      <Button asChild size="sm" style={{backgroundColor: '#025bae'}} className="hover:bg-blue-700">
                        <Link to={step.link} className="flex items-center">
                          Setup
                          <ArrowForward className="w-4 h-4 ml-1" />
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
        <Card className="shadow-sm border-0 overflow-hidden">
          <div className="px-6 py-4 text-white" style={{backgroundColor: '#025bae'}}>
            <h2 className="text-lg font-semibold flex items-center">
              <CalendarToday className="w-5 h-5 mr-2" />
              Quick Actions
            </h2>
          </div>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button asChild variant="outline" className="h-auto p-4 border-2 hover:border-blue-600 hover:bg-blue-50">
                <Link to="/provider/bookings" className="flex flex-col items-center text-center">
                  <CalendarToday className="w-6 h-6 mb-2" style={{color: '#025bae'}} />
                  <span className="font-medium" style={{color: '#025bae'}}>View Appointments</span>
                  <span className="text-sm text-gray-600">Manage your bookings</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-4 border-2 hover:border-blue-600 hover:bg-blue-50">
                <Link to="/provider/services" className="flex flex-col items-center text-center">
                  <Store className="w-6 h-6 mb-2" style={{color: '#025bae'}} />
                  <span className="font-medium" style={{color: '#025bae'}}>Manage Services</span>
                  <span className="text-sm text-gray-600">Add or edit services</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-4 border-2 hover:border-blue-600 hover:bg-blue-50">
                <Link to="/provider/schedule" className="flex flex-col items-center text-center">
                  <Schedule className="w-6 h-6 mb-2" style={{color: '#025bae'}} />
                  <span className="font-medium" style={{color: '#025bae'}}>Update Schedule</span>
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
