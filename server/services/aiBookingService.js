import OpenAI from 'openai';
import User from '../models/User.js';
import ClientSchedule from '../models/ClientSchedule.js';
import Service from '../models/Service.js';
import ServiceProvider from '../models/ServiceProvider.js';
import ProviderSchedule from '../models/ProviderSchedule.js';
import Booking from '../models/Booking.js';

// OpenAI instance will be initialized lazily when needed
let openai = null;

// Function to get OpenAI instance (lazy initialization)
function getOpenAI() {
  if (openai === null) {
    if (process.env.OPENAI_API_KEY) {
      openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
      console.log('✅ OpenAI configured successfully - AI features will use ChatGPT');
    } else {
      console.log('⚠️  OpenAI not configured - AI booking features will use fallback algorithms');
      console.log('   To enable OpenAI: Set OPENAI_API_KEY in your .env file');
      openai = false; // Mark as attempted but failed
    }
  }
  return openai === false ? null : openai;
}

class AIBookingService {
  /**
   * Generate optimal booking suggestions using AI
   */
  async generateBookingSuggestions(clientId, serviceId, frequencyPerMonth) {
    try {
      // Get client availability
      const client = await User.findById(clientId);
      const clientSchedule = await ClientSchedule.findOne({ clientId });

      // Get service and provider information
      const service = await Service.findById(serviceId).populate('category');
      const provider = await ServiceProvider.findById(service.providerId);
      const providerSchedules = await ProviderSchedule.find({ providerId: service.providerId });

      // Get existing bookings for the client
      const existingBookings = await Booking.find({
        clientId,
        serviceId,
        status: { $in: ['pending', 'confirmed'] },
        appointmentDate: { $gte: new Date() }
      });

      // Prepare data for AI
      const clientSlots = this.parseClientAvailability(clientSchedule?.slots || []);
      const providerSlots = this.parseProviderAvailability(providerSchedules, service.slots || []);
      const existingBookingTimes = existingBookings.map(booking => ({
        date: booking.appointmentDate,
        time: booking.startTime
      }));

      // Debug logging
      console.log('AI Booking Debug Info:', {
        clientId: clientId.toString(),
        serviceId: serviceId.toString(),
        serviceName: service.name,
        clientScheduleSlots: clientSchedule?.slots || [],
        parsedClientSlots: clientSlots,
        providerSchedules: providerSchedules.map(ps => ({
          dayOfWeek: ps.dayOfWeek,
          isAvailable: ps.isAvailable,
          startTime: ps.startTime,
          endTime: ps.endTime
        })),
        parsedProviderSlots: providerSlots,
        serviceSlots: service.slots || [],
        frequencyPerMonth
      });

      // Create AI prompt
      const prompt = this.createAIPrompt(
        clientSlots,
        providerSlots,
        service,
        frequencyPerMonth,
        existingBookingTimes
      );

      // Get AI suggestions
      let suggestions;

      const openaiInstance = getOpenAI();
      if (openaiInstance) {
        const aiResponse = await openaiInstance.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are an expert appointment scheduling assistant. Analyze the provided schedules and suggest optimal booking times."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 800,
          temperature: 0.3,
          response_format: { type: "json_object" }
        });

        suggestions = JSON.parse(aiResponse.choices[0].message.content);
      } else {
        // Fallback: Generate basic suggestions without OpenAI
        suggestions = this.generateFallbackSuggestions(
          clientSlots,
          providerSlots,
          frequencyPerMonth,
          service
        );
      }

      // Process and validate suggestions
      const processedSuggestions = await this.processSuggestions(
        suggestions,
        clientId,
        serviceId,
        service.duration
      );

      return {
        success: true,
        suggestions: processedSuggestions,
        reasoning: suggestions.reasoning || "AI-generated optimal time suggestions based on your availability and preferences."
      };

    } catch (error) {
      console.error('AI Booking Service Error:', error);
      return {
        success: false,
        error: error.message,
        suggestions: []
      };
    }
  }

  /**
   * Parse client availability slots
   */
  parseClientAvailability(slots) {
    const availability = {};

    slots.forEach(slotString => {
      try {
        const slot = JSON.parse(slotString);
        if (!availability[slot.dayOfWeek]) {
          availability[slot.dayOfWeek] = [];
        }
        availability[slot.dayOfWeek].push({
          start: slot.startTime,
          end: slot.endTime
        });
      } catch (e) {
        console.warn('Failed to parse client slot:', slotString);
      }
    });

    return availability;
  }

  /**
   * Parse provider availability schedules and service slots
   */
  parseProviderAvailability(schedules, serviceSlots = []) {
    const availability = {};

    // First, get provider's general availability
    schedules.forEach(schedule => {
      if (schedule.isAvailable) {
        availability[schedule.dayOfWeek] = {
          start: schedule.startTime,
          end: schedule.endTime
        };
      }
    });

    // Then, apply service-specific slot restrictions if they exist
    if (serviceSlots.length > 0) {
      const serviceAvailability = {};

      serviceSlots.forEach(slotString => {
        try {
          const slot = JSON.parse(slotString);
          if (!serviceAvailability[slot.dayOfWeek]) {
            serviceAvailability[slot.dayOfWeek] = [];
          }
          serviceAvailability[slot.dayOfWeek].push({
            start: slot.startTime,
            end: slot.endTime
          });
        } catch (e) {
          console.warn('Failed to parse service slot:', slotString);
        }
      });

      // Intersect provider availability with service slots
      Object.keys(serviceAvailability).forEach(dayOfWeek => {
        const day = parseInt(dayOfWeek);
        if (availability[day]) {
          // For now, use the first service slot that overlaps with provider availability
          const providerSlot = availability[day];
          const serviceSlots = serviceAvailability[day];

          const overlappingSlot = serviceSlots.find(serviceSlot => {
            // Convert time strings to minutes for comparison
            const serviceStart = this.timeToMinutes(serviceSlot.start);
            const serviceEnd = this.timeToMinutes(serviceSlot.end);
            const providerStart = this.timeToMinutes(providerSlot.start);
            const providerEnd = this.timeToMinutes(providerSlot.end);

            return serviceStart < providerEnd && serviceEnd > providerStart;
          });

          if (overlappingSlot) {
            // Use the intersection of provider and service availability
            const serviceStart = this.timeToMinutes(overlappingSlot.start);
            const serviceEnd = this.timeToMinutes(overlappingSlot.end);
            const providerStart = this.timeToMinutes(providerSlot.start);
            const providerEnd = this.timeToMinutes(providerSlot.end);

            availability[day] = {
              start: this.minutesToTime(Math.max(providerStart, serviceStart)),
              end: this.minutesToTime(Math.min(providerEnd, serviceEnd))
            };
          } else {
            // No overlap, remove this day
            delete availability[day];
          }
        }
      });
    }

    return availability;
  }

  /**
   * Create AI prompt for booking suggestions
   */
  createAIPrompt(clientSlots, providerSlots, service, frequencyPerMonth, existingBookings) {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return `
Please analyze the following scheduling data and suggest optimal appointment times:

CLIENT AVAILABILITY:
${Object.entries(clientSlots).map(([day, slots]) =>
  `${daysOfWeek[day]}: ${slots.map(slot => `${slot.start}-${slot.end}`).join(', ')}`
).join('\n')}

PROVIDER AVAILABILITY:
${Object.entries(providerSlots).map(([day, slot]) =>
  `${daysOfWeek[day]}: ${slot.start}-${slot.end}`
).join('\n')}

SERVICE DETAILS:
- Name: ${service.name}
- Duration: ${service.duration} minutes
- Category: ${service.category?.name || 'General'}

BOOKING PREFERENCES:
- Frequency: ${frequencyPerMonth} appointments per month
- Existing bookings: ${existingBookings.length > 0 ? existingBookings.map(b => `${b.date} at ${b.time}`).join(', ') : 'None'}

REQUIREMENTS:
1. Find overlapping time slots between client and provider availability
2. Suggest ${frequencyPerMonth} optimal appointments for the next month
3. Ensure appointments are evenly distributed throughout the month
4. Avoid conflicts with existing bookings
5. Consider service duration when suggesting times
6. Prefer consistent days/times if possible for regular appointments

Please respond in JSON format:
{
  "suggestions": [
    {
      "date": "YYYY-MM-DD",
      "time": "HH:MM",
      "dayOfWeek": "Monday",
      "reasoning": "Why this time is optimal"
    }
  ],
  "reasoning": "Overall explanation of the scheduling strategy",
  "confidence": "High/Medium/Low based on availability overlap"
}
`;
  }

  /**
   * Process and validate AI suggestions
   */
  async processSuggestions(suggestions, clientId, serviceId, serviceDuration) {
    const processedSuggestions = [];

    for (const suggestion of suggestions.suggestions || []) {
      try {
        // Validate date format
        const appointmentDate = new Date(suggestion.date + 'T' + suggestion.time);

        if (appointmentDate < new Date()) {
          continue; // Skip past dates
        }

        // Check for existing conflicts
        const conflictingBooking = await Booking.findOne({
          $or: [
            { clientId, appointmentDate: { $lte: appointmentDate }, endTime: { $gt: suggestion.time } },
            { serviceId, appointmentDate: { $lte: appointmentDate }, endTime: { $gt: suggestion.time } }
          ],
          status: { $in: ['pending', 'confirmed'] }
        });

        if (!conflictingBooking) {
          processedSuggestions.push({
            date: suggestion.date,
            time: suggestion.time,
            dayOfWeek: suggestion.dayOfWeek,
            reasoning: suggestion.reasoning,
            duration: serviceDuration,
            confidence: suggestions.confidence || 'Medium'
          });
        }
      } catch (error) {
        console.warn('Invalid suggestion format:', suggestion);
      }
    }

    return processedSuggestions;
  }

  /**
   * Generate fallback suggestions when OpenAI is not available
   */
  generateFallbackSuggestions(clientSlots, providerSlots, frequencyPerMonth, service) {
    const suggestions = [];
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());

    // Find overlapping time slots
    const overlappingSlots = [];

    Object.keys(clientSlots).forEach(dayOfWeek => {
      const day = parseInt(dayOfWeek);
      if (providerSlots[day]) {
        const clientDaySlots = clientSlots[day];
        const providerDaySlot = providerSlots[day];

        clientDaySlots.forEach(clientSlot => {
          // Check for overlap using time comparison
          const clientStart = this.timeToMinutes(clientSlot.start);
          const clientEnd = this.timeToMinutes(clientSlot.end);
          const providerStart = this.timeToMinutes(providerDaySlot.start);
          const providerEnd = this.timeToMinutes(providerDaySlot.end);

          if (clientStart < providerEnd && clientEnd > providerStart) {
            const overlapStart = Math.max(clientStart, providerStart);
            const overlapEnd = Math.min(clientEnd, providerEnd);

            overlappingSlots.push({
              dayOfWeek: day,
              start: this.minutesToTime(overlapStart),
              end: this.minutesToTime(overlapEnd)
            });
          }
        });
      }
    });

    // Generate suggestions based on overlapping slots
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let suggestionsCount = 0;

    for (let week = 0; week < 4 && suggestionsCount < frequencyPerMonth; week++) {
      overlappingSlots.forEach(slot => {
        if (suggestionsCount >= frequencyPerMonth) return;

        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + (week * 7) + (slot.dayOfWeek - today.getDay() + 7) % 7);

        if (targetDate >= today && targetDate <= nextMonth) {
          const time = slot.start;
          suggestions.push({
            date: targetDate.toISOString().split('T')[0],
            time: time,
            dayOfWeek: daysOfWeek[slot.dayOfWeek],
            reasoning: `Optimal time based on overlapping availability on ${daysOfWeek[slot.dayOfWeek]}s`
          });
          suggestionsCount++;
        }
      });
    }

    return {
      suggestions,
      reasoning: "Basic scheduling algorithm used (OpenAI not configured)",
      confidence: "Medium"
    };
  }

  /**
   * Convert time string (HH:MM) to minutes since midnight
   */
  timeToMinutes(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Convert minutes since midnight to time string (HH:MM)
   */
  minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * Auto-book appointments based on AI suggestions
   */
  async autoBookAppointments(clientId, serviceId, suggestions, autoBook = false) {
    const bookingResults = [];

    if (!autoBook) {
      return { suggestions, autoBooked: false };
    }

    for (const suggestion of suggestions) {
      try {
        const service = await Service.findById(serviceId);
        const appointmentDate = new Date(suggestion.date + 'T' + suggestion.time);

        // Calculate end time
        const endTime = new Date(appointmentDate.getTime() + service.duration * 60000);
        const endTimeString = endTime.toTimeString().slice(0, 5);

        const booking = new Booking({
          clientId,
          serviceId,
          providerId: service.providerId,
          appointmentDate,
          startTime: suggestion.time,
          endTime: endTimeString,
          status: 'pending',
          totalAmount: service.price,
          notes: `AI-scheduled appointment - ${suggestion.reasoning}`,
          paymentStatus: 'pending'
        });

        await booking.save();

        bookingResults.push({
          booking: booking._id,
          date: suggestion.date,
          time: suggestion.time,
          status: 'booked'
        });

      } catch (error) {
        bookingResults.push({
          date: suggestion.date,
          time: suggestion.time,
          status: 'failed',
          error: error.message
        });
      }
    }

    return {
      suggestions,
      autoBooked: true,
      bookingResults
    };
  }

  /**
   * Generate client availability schedule using AI
   */
  async generateClientSchedule(workHours, workDays, availabilityNotes = '') {
    try {
      const openaiInstance = getOpenAI();
      if (!openaiInstance) {
        // Fallback: Generate a basic schedule based on preferences
        return this.generateBasicSchedule(workHours, workDays, availabilityNotes);
      }

      const prompt = `You are an AI assistant that helps clients create optimal availability schedules for booking appointments.

Given the following information about a client:
- Work Hours: ${workHours}
- Work Days: ${workDays.join(', ')}
- Additional Notes: ${availabilityNotes || 'None'}

IMPORTANT CONTEXT: The client works during ${workHours} on ${workDays.join(', ')}. They want to schedule appointments OUTSIDE of these work hours.

Please generate an optimal weekly availability schedule following these rules:
1. ONLY include days from the work days list: ${workDays.join(', ')}
2. For these work days: Only include time slots BEFORE or AFTER work hours
3. All other days should have EMPTY arrays (no availability)
4. Respect any lunch breaks or unavailability mentioned in notes
5. Use 24-hour format (e.g., "15:00" for 3 PM, NOT "03:00")
6. If work hours are "8 to 3", interpret as 8:00 AM to 3:00 PM (15:00)

Return the response as a JSON object with this exact structure:
{
  "schedule": {
    "monday": [{"startTime": "HH:MM", "endTime": "HH:MM"}],
    "tuesday": [{"startTime": "HH:MM", "endTime": "HH:MM"}],
    "wednesday": [{"startTime": "HH:MM", "endTime": "HH:MM"}],
    "thursday": [{"startTime": "HH:MM", "endTime": "HH:MM"}],
    "friday": [{"startTime": "HH:MM", "endTime": "HH:MM"}],
    "saturday": [{"startTime": "HH:MM", "endTime": "HH:MM"}],
    "sunday": [{"startTime": "HH:MM", "endTime": "HH:MM"}]
  },
  "reasoning": "Brief explanation of the schedule logic"
}

CRITICAL: Use 24-hour format correctly:
- 8 AM = "08:00"
- 3 PM = "15:00" (NOT "03:00")
- 1:30 PM = "13:30" (NOT "01:30")

Create time slots only when the client is available for appointments. Empty arrays for days with no availability.`;

      const completion = await openaiInstance.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful AI assistant that creates personalized availability schedules. Always respond with valid JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      });

      const content = completion.choices[0].message.content.trim();
      console.log('AI Schedule Response:', content);

      // Try to parse the AI response
      let aiResponse;
      try {
        // Extract JSON from response if it's wrapped in markdown
        const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
        aiResponse = JSON.parse(jsonString);
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        // Fallback to basic schedule
        return this.generateBasicSchedule(workHours, workDays, availabilityNotes);
      }

      // Validate and format the response
      if (aiResponse.schedule && typeof aiResponse.schedule === 'object') {
        return {
          success: true,
          schedule: aiResponse.schedule,
          reasoning: aiResponse.reasoning || 'AI-generated schedule based on your preferences'
        };
      } else {
        throw new Error('Invalid AI response format');
      }

    } catch (error) {
      console.error('AI Schedule Generation Error:', error);
      // Fallback to basic schedule generation
      return this.generateBasicSchedule(workHours, workDays, availabilityNotes);
    }
  }

  /**
   * Generate a basic schedule as fallback
   */
  generateBasicSchedule(workHours, workDays, availabilityNotes = '') {
    const schedule = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: []
    };

    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const workDayNames = workDays.map(day => day.toLowerCase());

    // Parse work hours - handle various formats
    let workStart = '09:00';
    let workEnd = '16:00';

    // Match patterns like "9:00 to 4:00", "9 to 5", "9:00-17:00", etc.
    const timePattern = /(\d{1,2}):?(\d{0,2})\s*(?:to|-)?\s*(\d{1,2}):?(\d{0,2})/i;
    const match = workHours.match(timePattern);

    if (match) {
      let startHour = parseInt(match[1]);
      const startMin = match[2] ? parseInt(match[2]) : 0;
      let endHour = parseInt(match[3]);
      const endMin = match[4] ? parseInt(match[4]) : 0;

      // If end hour is less than start hour, assume PM (e.g., "8 to 3" means 8 AM to 3 PM)
      if (endHour <= 12 && endHour < startHour) {
        endHour += 12;
      }

      workStart = `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`;
      workEnd = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
    }

    // Parse availability notes for lunch breaks and specific restrictions
    const mondayLunchMatch = availabilityNotes.match(/monday.*?from\s+(\d{1,2}):?(\d{0,2})?\s*(?:to|-)?\s*(\d{1,2}):?(\d{0,2})?/i);
    const generalLunchMatch = availabilityNotes.match(/(?:working days|lunch).*?from\s+(\d{1,2}):?(\d{0,2})?\s*(?:to|-)?\s*(\d{1,2}):?(\d{0,2})?/i);

    let mondayLunchStart = null, mondayLunchEnd = null;
    let generalLunchStart = null, generalLunchEnd = null;

    if (mondayLunchMatch) {
      let startHour = parseInt(mondayLunchMatch[1]);
      const startMin = mondayLunchMatch[2] ? parseInt(mondayLunchMatch[2]) : 0;
      let endHour = parseInt(mondayLunchMatch[3]);
      const endMin = mondayLunchMatch[4] ? parseInt(mondayLunchMatch[4]) : 30; // Default to 30 if only hour specified

      // Check for PM indicator and adjust hours if they seem like PM times without 24hr format
      if (availabilityNotes.toLowerCase().includes('pm') && startHour <= 12 && startHour >= 1) {
        if (startHour !== 12) startHour += 12;
        if (endHour <= startHour && endHour !== 12) endHour += 12;
      }

      mondayLunchStart = `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`;
      mondayLunchEnd = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
    }

    if (generalLunchMatch) {
      let startHour = parseInt(generalLunchMatch[1]);
      const startMin = generalLunchMatch[2] ? parseInt(generalLunchMatch[2]) : 30; // Default to 30 if only hour specified
      let endHour = parseInt(generalLunchMatch[3]);
      const endMin = generalLunchMatch[4] ? parseInt(generalLunchMatch[4]) : 30;

      // Check for PM indicator and adjust hours if they seem like PM times without 24hr format
      if (availabilityNotes.toLowerCase().includes('pm') && startHour <= 12 && startHour >= 1) {
        if (startHour !== 12) startHour += 12;
        if (endHour <= startHour && endHour !== 12) endHour += 12;
      }

      generalLunchStart = `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`;
      generalLunchEnd = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
    }

    // Generate slots for each day
    days.forEach(day => {
      if (workDayNames.includes(day)) {
        // Work days - create availability OUTSIDE work hours
        const slots = [];
        
        // Convert work times to minutes for comparison
        const workStartMin = this.timeToMinutes(workStart);
        const workEndMin = this.timeToMinutes(workEnd);
        
        // Add morning slot if work starts after 8 AM
        if (workStartMin > 8 * 60) {
          slots.push({ startTime: '07:00', endTime: workStart });
        }
        
        // Add evening slot if work ends before 8 PM
        if (workEndMin < 20 * 60) {
          slots.push({ startTime: workEnd, endTime: '20:00' });
        }
        
        schedule[day] = slots;
      } else {
        // Non-work days - no availability (empty array)
        schedule[day] = [];
      }
    });

    return {
      success: true,
      schedule,
      reasoning: 'Schedule generated based on your work hours. Created appointment slots outside your work hours for the days you work. Non-work days have no availability.'
    };
  }

  /**
   * Generate provider availability schedule using AI
   */
  async generateProviderSchedule(businessHours, businessDays, servicesNotes = '') {
    try {
      const openaiInstance = getOpenAI();
      if (!openaiInstance) {
        console.log('OpenAI not configured, using fallback for provider schedule');
        // Fallback: Generate a basic schedule based on business preferences
        return this.generateBasicProviderSchedule(businessHours, businessDays, servicesNotes);
      }

      console.log('Using OpenAI for provider schedule generation');

      const prompt = `You are an AI assistant that helps service providers create optimal availability schedules for their business.

Given the following information about a service provider:
- Business Hours: ${businessHours}
- Business Days: ${businessDays.join(', ')}
- Services Notes: ${servicesNotes || 'None'}

IMPORTANT CONTEXT: The provider operates their business during ${businessHours} on ${businessDays.join(', ')}. They want to set their availability FOR providing services during these business hours.

Please generate an optimal weekly availability schedule following these rules:
1. ONLY include days from the business days list: ${businessDays.join(', ')}
2. For these business days: Include time slots WITHIN business hours for service provision
3. All other days should have EMPTY arrays (not available for business)
4. Respect any service constraints or special notes mentioned - pay special attention to different break times for different days
5. Use 24-hour format (e.g., "15:00" for 3 PM, NOT "03:00")
6. If business hours are "9 to 4", interpret as 9:00 AM to 4:00 PM (16:00)
7. Parse lunch breaks carefully - if different days have different break times, respect those differences
8. For phrases like "Mondays from 12 to 2:30", interpret as Monday: 12:00-14:30 break
9. For phrases like "other working days from 12:30 to 1:30", interpret as non-Monday business days: 12:30-13:30 break

Return the response as a JSON object with this exact structure:
{
  "schedule": {
    "monday": [{"startTime": "HH:MM", "endTime": "HH:MM"}],
    "tuesday": [{"startTime": "HH:MM", "endTime": "HH:MM"}],
    "wednesday": [{"startTime": "HH:MM", "endTime": "HH:MM"}],
    "thursday": [{"startTime": "HH:MM", "endTime": "HH:MM"}],
    "friday": [{"startTime": "HH:MM", "endTime": "HH:MM"}],
    "saturday": [{"startTime": "HH:MM", "endTime": "HH:MM"}],
    "sunday": [{"startTime": "HH:MM", "endTime": "HH:MM"}]
  },
  "reasoning": "Brief explanation of the schedule logic"
}

CRITICAL: Use 24-hour format correctly:
- 9 AM = "09:00"
- 5 PM = "17:00" (NOT "05:00")
- 1:30 PM = "13:30" (NOT "01:30")

Create time slots for when the provider is available to offer services. Empty arrays for days when not operating.`;

      const completion = await openaiInstance.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful AI assistant that creates personalized business availability schedules. Always respond with valid JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      });

      const content = completion.choices[0].message.content.trim();
      console.log('AI Provider Schedule Response:', content);

      // Try to parse the AI response
      let aiResponse;
      try {
        // Extract JSON from response if it's wrapped in markdown
        const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
        aiResponse = JSON.parse(jsonString);
      } catch (parseError) {
        console.error('Failed to parse AI provider response:', parseError);
        // Fallback to basic schedule
        return this.generateBasicProviderSchedule(businessHours, businessDays, servicesNotes);
      }

      // Validate and format the response
      if (aiResponse.schedule && typeof aiResponse.schedule === 'object') {
        return {
          success: true,
          schedule: aiResponse.schedule,
          reasoning: aiResponse.reasoning || 'AI-generated provider schedule based on your business hours and preferences'
        };
      } else {
        throw new Error('Invalid AI response format');
      }

    } catch (error) {
      console.error('AI Provider Schedule Generation Error:', error);
      // Fallback to basic schedule generation
      return this.generateBasicProviderSchedule(businessHours, businessDays, servicesNotes);
    }
  }

  /**
   * Generate a basic provider schedule as fallback
   */
  generateBasicProviderSchedule(businessHours, businessDays, servicesNotes = '') {
    const schedule = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: []
    };

    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const businessDayNames = businessDays.map(day => day.toLowerCase());

    // Parse business hours - handle various formats
    let businessStart = '09:00';
    let businessEnd = '17:00';

    // Match patterns like "9:00 to 5:00", "9 to 5", "9:00-17:00", etc.
    const timePattern = /(\d{1,2}):?(\d{0,2})\s*(?:to|-)?\s*(\d{1,2}):?(\d{0,2})/i;
    const match = businessHours.match(timePattern);

    if (match) {
      let startHour = parseInt(match[1]);
      const startMin = match[2] ? parseInt(match[2]) : 0;
      let endHour = parseInt(match[3]);
      const endMin = match[4] ? parseInt(match[4]) : 0;

      // If end hour is less than start hour, assume PM (e.g., "9 to 5" means 9 AM to 5 PM)
      if (endHour <= 12 && endHour < startHour) {
        endHour += 12;
      }

      businessStart = `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`;
      businessEnd = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
    }

    // Parse services notes for lunch breaks and special constraints
    console.log('Parsing services notes:', servicesNotes);
    
    // Look for Monday-specific breaks
    const mondayBreakMatch = servicesNotes.match(/mondays?\s+from\s+(\d{1,2}):?(\d{0,2})?\s*(?:to|-)?\s*(\d{1,2}):?(\d{0,2})?/i);
    // Look for other days breaks
    const otherDaysBreakMatch = servicesNotes.match(/(?:all\s+)?other\s+(?:working\s+)?days?\s+from\s+(\d{1,2}):?(\d{0,2})?\s*(?:to|-)?\s*(\d{1,2}):?(\d{0,2})?/i);
    // General lunch break pattern as fallback
    const generalLunchMatch = servicesNotes.match(/(?:lunch|break).*?from\s+(\d{1,2}):?(\d{0,2})?\s*(?:to|-)?\s*(\d{1,2}):?(\d{0,2})?/i);
    
    console.log('Monday break match:', mondayBreakMatch);
    console.log('Other days break match:', otherDaysBreakMatch);
    
    let mondayLunchStart = null, mondayLunchEnd = null;
    let otherDaysLunchStart = null, otherDaysLunchEnd = null;
    let generalLunchStart = null, generalLunchEnd = null;

    // Parse Monday-specific break
    if (mondayBreakMatch) {
      let startHour = parseInt(mondayBreakMatch[1]);
      const startMin = mondayBreakMatch[2] ? parseInt(mondayBreakMatch[2]) : 0;
      let endHour = parseInt(mondayBreakMatch[3]);
      const endMin = mondayBreakMatch[4] ? parseInt(mondayBreakMatch[4]) : 30; // Default minutes

      // Handle hour format for afternoon times (2:30 means 14:30)
      if (endHour < 12 && endHour <= 6 && startHour >= 12) {
        endHour += 12;
      }

      mondayLunchStart = `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`;
      mondayLunchEnd = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
    }

    // Parse other days break
    if (otherDaysBreakMatch) {
      let startHour = parseInt(otherDaysBreakMatch[1]);
      const startMin = otherDaysBreakMatch[2] ? parseInt(otherDaysBreakMatch[2]) : 30; // Default 30 for 12:30
      let endHour = parseInt(otherDaysBreakMatch[3]);
      const endMin = otherDaysBreakMatch[4] ? parseInt(otherDaysBreakMatch[4]) : 30;

      // Handle hour format for afternoon times
      if (endHour < 12 && endHour <= 6 && startHour >= 12) {
        endHour += 12;
      }

      otherDaysLunchStart = `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`;
      otherDaysLunchEnd = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
    }

    // Parse general lunch break as fallback
    if (generalLunchMatch && !mondayBreakMatch && !otherDaysBreakMatch) {
      let startHour = parseInt(generalLunchMatch[1]);
      const startMin = generalLunchMatch[2] ? parseInt(generalLunchMatch[2]) : 0;
      let endHour = parseInt(generalLunchMatch[3]);
      const endMin = generalLunchMatch[4] ? parseInt(generalLunchMatch[4]) : 0;

      if (endHour <= 12 && endHour < startHour) {
        endHour += 12;
      }

      generalLunchStart = `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`;
      generalLunchEnd = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
    }

    // Generate slots for each day
    days.forEach(day => {
      if (businessDayNames.includes(day)) {
        // Business days - create availability during business hours
        const slots = [];
        
        let dayLunchStart = null, dayLunchEnd = null;
        
        // Determine which lunch break to use for this day
        if (day === 'monday' && mondayLunchStart && mondayLunchEnd) {
          dayLunchStart = mondayLunchStart;
          dayLunchEnd = mondayLunchEnd;
        } else if (day !== 'monday' && otherDaysLunchStart && otherDaysLunchEnd) {
          dayLunchStart = otherDaysLunchStart;
          dayLunchEnd = otherDaysLunchEnd;
        } else if (generalLunchStart && generalLunchEnd) {
          dayLunchStart = generalLunchStart;
          dayLunchEnd = generalLunchEnd;
        }
        
        if (dayLunchStart && dayLunchEnd) {
          // Split around lunch break
          slots.push({ startTime: businessStart, endTime: dayLunchStart });
          slots.push({ startTime: dayLunchEnd, endTime: businessEnd });
        } else {
          // Default lunch break from 12:00 to 13:00
          const defaultLunchStart = '12:00';
          const defaultLunchEnd = '13:00';
          
          // Check if business hours span lunch time
          if (this.timeToMinutes(businessStart) < this.timeToMinutes(defaultLunchStart) && 
              this.timeToMinutes(businessEnd) > this.timeToMinutes(defaultLunchEnd)) {
            slots.push({ startTime: businessStart, endTime: defaultLunchStart });
            slots.push({ startTime: defaultLunchEnd, endTime: businessEnd });
          } else {
            // No lunch break needed or business hours don't span lunch
            slots.push({ startTime: businessStart, endTime: businessEnd });
          }
        }
        
        schedule[day] = slots;
      } else {
        // Non-business days - no availability (empty array)
        schedule[day] = [];
      }
    });

    return {
      success: true,
      schedule,
      reasoning: 'Schedule generated based on your business hours. Created service slots during your operating hours with appropriate breaks.'
    };
  }

  /**
   * Parse time string to ISO format
   */
  parseTimeToISO(timeStr) {
    const time = timeStr.toLowerCase().replace(/\s/g, '');
    let hours = 0;
    let minutes = 0;

    if (time.includes('pm') || time.includes('am')) {
      const isPM = time.includes('pm');
      const timeOnly = time.replace(/[ap]m/, '');
      const parts = timeOnly.split(':');
      hours = parseInt(parts[0]);
      minutes = parts[1] ? parseInt(parts[1]) : 0;

      if (isPM && hours !== 12) hours += 12;
      if (!isPM && hours === 12) hours = 0;
    } else {
      const parts = time.split(':');
      hours = parseInt(parts[0]);
      minutes = parts[1] ? parseInt(parts[1]) : 0;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  /**
   * Generate provider service using AI
   */
  async generateProviderService(serviceDetails, servicePricing, categories, providerSchedule) {
    try {
      const openaiInstance = getOpenAI();
      if (!openaiInstance) {
        console.log('OpenAI not configured, using fallback for service generation');
        // Fallback: Generate a basic service based on inputs
        return this.generateBasicProviderService(serviceDetails, servicePricing, categories, providerSchedule);
      }

      console.log('Using OpenAI for provider service generation');

      // Format categories for prompt
      const categoryList = categories.map(cat => `${cat.name} (ID: ${cat.id})`).join(', ');
      
      // Generate slots based on provider schedule
      const slots = this.generateServiceSlots(providerSchedule);

      const prompt = `You are an AI assistant that helps service providers create optimal service offerings for their business.

Given the following information:
- Service Details: ${serviceDetails}
- Pricing and Duration Info: ${servicePricing}
- Available Categories: ${categoryList}

Create a professional service listing with:
1. A compelling service name (2-5 words, clear and professional)
2. A detailed description (100-150 words) that expands on the service details, highlighting benefits, experience, and what makes it special
3. Extract the price as a number (if range given, use the average)
4. Extract the duration in minutes (if range given, use the average)
5. Select the most appropriate categoryId from the available categories
6. Set reasonable maxBookingsPerDay (typically 3-10 based on duration)
7. Add relevant requirements if mentioned or implied
8. Generate search tags for discoverability

Return a JSON object with exactly this structure:
{
  "name": "Service Name",
  "description": "Detailed service description that expands on what was provided...",
  "price": 99.99,
  "duration": 60,
  "maxBookingsPerDay": 5,
  "requirements": ["Requirement 1", "Requirement 2"],
  "tags": ["tag1", "tag2", "tag3"],
  "categoryId": "actual_category_id_from_list"
}`;

      const completion = await openaiInstance.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful AI assistant that creates professional service listings. Always respond with valid JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 800,
        response_format: { type: "json_object" }
      });

      const service = JSON.parse(completion.choices[0].message.content);
      
      // Add slots to the service
      service.slots = slots;
      
      console.log('AI generated service:', service);

      return {
        success: true,
        service,
        reasoning: 'Generated using AI based on service details and pricing information'
      };

    } catch (error) {
      console.error('Provider service generation error:', error);
      
      // Fallback to basic generation
      return this.generateBasicProviderService(serviceDetails, servicePricing, categories, providerSchedule);
    }
  }

  /**
   * Generate service slots based on provider schedule
   */
  generateServiceSlots(providerSchedule) {
    const slots = [];
    
    if (providerSchedule && providerSchedule.length > 0) {
      providerSchedule.forEach(schedule => {
        if (schedule.isAvailable) {
          // If provider has multiple time slots, include ALL slots for the service
          if (schedule.timeSlots && schedule.timeSlots.length > 0) {
            schedule.timeSlots.forEach(slot => {
              slots.push(JSON.stringify({
                dayOfWeek: schedule.dayOfWeek,
                startTime: slot.startTime,
                endTime: slot.endTime
              }));
            });
          } else if (schedule.startTime && schedule.endTime) {
            // Legacy single slot format
            slots.push(JSON.stringify({
              dayOfWeek: schedule.dayOfWeek,
              startTime: schedule.startTime,
              endTime: schedule.endTime
            }));
          }
        }
      });
    }
    
    return slots;
  }

  /**
   * Generate basic provider service without AI
   */
  generateBasicProviderService(serviceDetails, servicePricing, categories, providerSchedule) {
    console.log('Generating basic provider service (fallback)');

    // Extract service name from details (first meaningful phrase)
    const detailWords = serviceDetails.toLowerCase().split(/[.,!]/)[0].trim().split(/\s+/);
    const name = detailWords.slice(0, 4)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    // Use the full service details as description
    const description = serviceDetails.trim();

    // Extract price from pricing info
    let price = 75; // Default
    const priceMatch = servicePricing.match(/\$?(\d+)(?:\s*-\s*\$?(\d+))?/);
    if (priceMatch) {
      if (priceMatch[2]) {
        // Range given, use average
        price = (parseInt(priceMatch[1]) + parseInt(priceMatch[2])) / 2;
      } else {
        price = parseInt(priceMatch[1]);
      }
    }

    // Extract duration
    let duration = 60; // Default 1 hour
    const durationMatch = servicePricing.match(/(\d+)\s*(?:-\s*(\d+))?\s*(?:hours?|hrs?|minutes?|mins?)/i);
    if (durationMatch) {
      let extractedDuration = parseInt(durationMatch[1]);
      if (durationMatch[2]) {
        // Range given, use average
        extractedDuration = (parseInt(durationMatch[1]) + parseInt(durationMatch[2])) / 2;
      }
      // Convert hours to minutes if needed
      if (servicePricing.match(/hours?|hrs?/i)) {
        duration = extractedDuration * 60;
      } else {
        duration = extractedDuration;
      }
    }

    // Select category (use first one if no match)
    let categoryId = categories.length > 0 ? categories[0].id : '';
    const detailsLower = serviceDetails.toLowerCase();
    const matchedCategory = categories.find(cat => 
      detailsLower.includes(cat.name.toLowerCase())
    );
    if (matchedCategory) {
      categoryId = matchedCategory.id;
    }

    // Generate requirements from service details
    const requirements = [];
    if (detailsLower.match(/consultation|appointment|booking/i)) {
      requirements.push('Advance booking required');
    }
    if (detailsLower.match(/id|identification|document/i)) {
      requirements.push('Valid ID required');
    }

    // Generate tags from details
    const tags = [];
    const allWords = (serviceDetails + ' ' + servicePricing).toLowerCase().split(/\s+/);
    allWords.forEach(word => {
      if (word.length > 4 && !['with', 'from', 'this', 'that', 'your', 'includes', 'takes'].includes(word)) {
        if (!tags.includes(word) && tags.length < 5) {
          tags.push(word);
        }
      }
    });

    // Calculate max bookings based on duration
    const maxBookingsPerDay = Math.floor(480 / duration); // 8 hours / duration

    // Generate slots
    const slots = this.generateServiceSlots(providerSchedule);

    return {
      success: true,
      service: {
        name: name.slice(0, 50),
        description: description.slice(0, 200),
        price,
        duration,
        maxBookingsPerDay: Math.min(maxBookingsPerDay, 10),
        requirements,
        tags: tags.slice(0, 5),
        categoryId,
        slots
      },
      reasoning: 'Generated using pattern matching based on service details'
    };
  }
}

export default new AIBookingService();