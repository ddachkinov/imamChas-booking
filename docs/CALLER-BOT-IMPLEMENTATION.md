# Automated Caller Bot Implementation Guide

## Overview

This document provides comprehensive technical specifications for implementing an automated caller bot system that handles incoming phone calls in Bulgarian language, manages appointment bookings, checks calendar availability, and sends Viber appointment reminders.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Technology Stack](#technology-stack)
3. [Core Components](#core-components)
4. [Implementation Steps](#implementation-steps)
5. [Data Models](#data-models)
6. [API Specifications](#api-specifications)
7. [Voice Flow Design](#voice-flow-design)
8. [Calendar Integration](#calendar-integration)
9. [Viber Integration](#viber-integration)
10. [Deployment & Configuration](#deployment--configuration)
11. [Testing Strategy](#testing-strategy)
12. [Cost Estimation](#cost-estimation)
13. [Security & Compliance](#security--compliance)

---

## System Architecture

### High-Level Architecture

```
┌─────────────────┐
│  Phone Network  │
│   (PSTN/VoIP)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Twilio Voice   │ ◄──── Incoming Call Webhook
│   (SIP/WebRTC)  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│         Voice Bot Service (NestJS)          │
│  ┌─────────────────────────────────────┐   │
│  │  Call Handler                       │   │
│  │  - Receive call                     │   │
│  │  - TwiML generation                 │   │
│  │  - State management                 │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │  Speech Processing                  │   │
│  │  - STT (Bulgarian)                  │   │
│  │  - TTS (Bulgarian)                  │   │
│  │  - NLU (Intent Recognition)         │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │  Conversation Manager               │   │
│  │  - Dialog flow                      │   │
│  │  - Context tracking                 │   │
│  │  - Slot filling                     │   │
│  └─────────────────────────────────────┘   │
└─────────┬───────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────┐
│      Booking Platform API (Existing)        │
│  - Calendar availability check              │
│  - Appointment creation                     │
│  - Client management                        │
└─────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────┐
│       PostgreSQL Database                   │
│  - Appointments (with ai_caller flag)       │
│  - Call logs                                │
│  - Voice sessions                           │
└─────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────┐
│    Viber API Integration                    │
│  - Appointment reminders                    │
│  - Confirmation messages                    │
└─────────────────────────────────────────────┘
```

### Data Flow

1. **Incoming Call**: Customer calls business phone number
2. **Twilio Webhook**: Twilio sends POST request to voice bot endpoint
3. **Speech Recognition**: Convert Bulgarian speech to text (STT)
4. **Intent Recognition**: Understand customer intent (book, cancel, reschedule)
5. **Availability Check**: Query calendar API for available slots
6. **Slot Proposal**: Voice bot proposes available time slots
7. **Confirmation**: Collect customer name and phone number
8. **Appointment Creation**: Create appointment with `ai_caller_taken: true` flag
9. **Viber Reminder**: Schedule Viber message reminder before appointment

---

## Technology Stack

### Voice & Telephony

**Twilio Voice API**
- **Purpose**: Handle incoming/outgoing calls, SIP/WebRTC
- **Features**: Programmable Voice, TwiML for call flow
- **Pricing**: ~$0.013/min for incoming calls (Bulgaria)
- **Documentation**: https://www.twilio.com/docs/voice

**Alternative**: Vonage (Nexmo) Voice API
- Similar features to Twilio
- Competitive pricing in Europe

### Speech Processing

**Speech-to-Text (STT) - Bulgarian Support**

**Option 1: Google Cloud Speech-to-Text** (Recommended)
- **Language**: bg-BG (Bulgarian)
- **Features**: Streaming recognition, automatic punctuation, profanity filtering
- **Pricing**: $0.006/15 seconds
- **Accuracy**: ~95% for Bulgarian with proper acoustic model
- **Documentation**: https://cloud.google.com/speech-to-text

**Option 2: Microsoft Azure Speech Service**
- **Language**: bg-BG support
- **Features**: Custom models, neural voices
- **Pricing**: $1/hour of audio processed
- **Documentation**: https://azure.microsoft.com/en-us/services/cognitive-services/speech-to-text/

**Option 3: OpenAI Whisper** (Self-hosted or API)
- **Language**: Multilingual including Bulgarian
- **Features**: High accuracy, open-source
- **Deployment**: Can be self-hosted for cost savings
- **API**: Via OpenAI API or custom deployment

**Text-to-Speech (TTS) - Bulgarian Support**

**Option 1: Google Cloud Text-to-Speech** (Recommended)
- **Language**: bg-BG with neural voices
- **Voices**: Standard and WaveNet (more natural)
- **Pricing**: $4 per 1M characters (WaveNet), $16 per 1M characters (Neural2)
- **Quality**: High-quality, natural-sounding
- **Documentation**: https://cloud.google.com/text-to-speech

**Option 2: Microsoft Azure Text-to-Speech**
- **Language**: bg-BG with neural voices
- **Voices**: Multiple voice options (male/female)
- **Pricing**: $15 per 1M characters (neural)
- **Documentation**: https://azure.microsoft.com/en-us/services/cognitive-services/text-to-speech/

**Option 3: ElevenLabs**
- **Language**: Multilingual support including Bulgarian
- **Features**: Highly realistic AI voices, voice cloning
- **Pricing**: Starting at $5/month for 30k characters
- **Quality**: Excellent, very natural

### Natural Language Understanding (NLU)

**Option 1: Dialogflow CX** (Recommended for complex flows)
- **Provider**: Google Cloud
- **Features**: Intent recognition, entity extraction, context management, visual flow builder
- **Multilingual**: Supports Bulgarian
- **Pricing**: $0.007 per request
- **Use case**: Complex conversational flows with multiple intents
- **Documentation**: https://cloud.google.com/dialogflow

**Option 2: OpenAI GPT-4 API** (Recommended for flexibility)
- **Provider**: OpenAI
- **Features**: Advanced language understanding, contextual responses, few-shot learning
- **Multilingual**: Excellent Bulgarian support
- **Pricing**: $0.03 per 1K tokens (input), $0.06 per 1K tokens (output)
- **Use case**: Flexible, natural conversations with complex understanding
- **Documentation**: https://platform.openai.com/docs

**Option 3: Rasa** (Open-source, self-hosted)
- **Type**: Open-source conversational AI framework
- **Features**: Intent classification, entity extraction, dialogue management
- **Multilingual**: Requires training data in Bulgarian
- **Cost**: Free (hosting costs only)
- **Use case**: Full control, data privacy, cost optimization

### Messaging

**Viber Business API**
- **Purpose**: Send appointment reminders via Viber
- **Features**: Rich messages, delivery status, read receipts
- **Provider**: Rakuten Viber
- **Documentation**: https://developers.viber.com/docs/api/rest-bot-api/
- **Pricing**:
  - Viber Bot API: Free for outbound messages (no guarantee of delivery)
  - Viber for Business: ~$0.01-0.03 per message (varies by country)
  - Alternative: Twilio (Viber through Twilio) - easier integration

**Implementation Options**:
1. **Direct Viber Bot API**: Free but requires bot approval
2. **Twilio Messaging API** (Viber channel): Easier integration, paid
3. **Infobip/Vonage**: Enterprise messaging platforms with Viber support

### Backend Framework

**NestJS** (Already in use)
- Extend existing backend with Voice Bot module
- Create dedicated microservice or module for voice handling

---

## Core Components

### 1. Voice Bot Service Module

**Location**: `backend/src/modules/voice-bot/`

**Structure**:
```
voice-bot/
├── voice-bot.module.ts
├── voice-bot.controller.ts      # Twilio webhook endpoints
├── voice-bot.service.ts          # Core business logic
├── services/
│   ├── call-handler.service.ts   # Handle incoming calls
│   ├── speech.service.ts         # STT/TTS integration
│   ├── conversation.service.ts   # Dialog management
│   ├── nlu.service.ts            # Intent recognition
│   └── viber.service.ts          # Viber messaging
├── entities/
│   ├── voice-call.entity.ts      # Call records
│   └── voice-session.entity.ts   # Conversation sessions
├── dto/
│   ├── twilio-webhook.dto.ts     # Twilio request payload
│   └── conversation-state.dto.ts # Session state
└── constants/
    └── intents.constant.ts       # Intent definitions
```

### 2. Call Handler Service

**Responsibilities**:
- Receive Twilio webhook requests
- Generate TwiML responses
- Manage call state machine
- Handle call events (start, end, timeout)

**Key Methods**:
```typescript
class CallHandlerService {
  async handleIncomingCall(twilioRequest: TwilioWebhookDto): Promise<string>;
  async handleSpeechInput(callSid: string, speech: string): Promise<string>;
  async handleGatherComplete(callSid: string, digits: string): Promise<string>;
  async handleCallStatusUpdate(callSid: string, status: string): Promise<void>;
  generateGreetingTwiML(): string;
  generateGatherTwiML(prompt: string): string;
  generateHangupTwiML(message: string): string;
}
```

### 3. Speech Service

**Responsibilities**:
- Convert speech to text (STT) via Google Cloud Speech
- Convert text to speech (TTS) via Google Cloud TTS
- Cache generated audio files for common phrases

**Key Methods**:
```typescript
class SpeechService {
  async speechToText(audioUrl: string, language: string = 'bg-BG'): Promise<string>;
  async textToSpeech(text: string, language: string = 'bg-BG', voice: string = 'bg-BG-Standard-A'): Promise<string>;
  async getCachedAudio(text: string, language: string): Promise<string | null>;
  async cacheAudio(text: string, language: string, audioUrl: string): Promise<void>;
}
```

### 4. Conversation Manager Service

**Responsibilities**:
- Track conversation state (context)
- Extract entities (date, time, service type)
- Validate collected information
- Guide user through booking flow

**Conversation States**:
```typescript
enum ConversationState {
  GREETING = 'greeting',
  INTENT_RECOGNITION = 'intent_recognition',
  SERVICE_SELECTION = 'service_selection',
  DATE_COLLECTION = 'date_collection',
  TIME_SELECTION = 'time_selection',
  NAME_COLLECTION = 'name_collection',
  PHONE_COLLECTION = 'phone_collection',
  CONFIRMATION = 'confirmation',
  BOOKING_COMPLETE = 'booking_complete',
  ERROR = 'error',
  HANGUP = 'hangup'
}
```

**Session Context**:
```typescript
interface ConversationContext {
  sessionId: string;
  callSid: string;
  businessId: string;
  currentState: ConversationState;
  intent: string | null;
  slots: {
    service?: string;
    serviceId?: string;
    date?: string;
    time?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
  attemptCount: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### 5. NLU Service

**Responsibilities**:
- Recognize user intents
- Extract entities from speech
- Handle Bulgarian-specific linguistic features

**Intents**:
```typescript
enum Intent {
  BOOK_APPOINTMENT = 'book_appointment',
  CHECK_AVAILABILITY = 'check_availability',
  CANCEL_APPOINTMENT = 'cancel_appointment',
  RESCHEDULE_APPOINTMENT = 'reschedule_appointment',
  GET_BUSINESS_INFO = 'get_business_info',
  SPEAK_TO_HUMAN = 'speak_to_human',
  UNKNOWN = 'unknown'
}
```

**Entity Types**:
```typescript
enum EntityType {
  SERVICE = 'service',          // "подстригване", "боядисване"
  DATE = 'date',                // "утре", "в понеделник", "на 15-ти"
  TIME = 'time',                // "10 часа", "следобед", "сутринта"
  PERSON_NAME = 'person_name',  // "Иван Петров"
  PHONE = 'phone'               // "0888123456"
}
```

**Key Methods**:
```typescript
class NLUService {
  async recognizeIntent(text: string, context: ConversationContext): Promise<Intent>;
  async extractEntities(text: string, entityTypes: EntityType[]): Promise<Map<EntityType, string>>;
  async parseDate(text: string): Promise<Date | null>;
  async parseTime(text: string): Promise<string | null>;
  async parsePhoneNumber(text: string): Promise<string | null>;
}
```

### 6. Viber Messaging Service

**Responsibilities**:
- Send appointment confirmations via Viber
- Send appointment reminders (24h, 1h before)
- Track message delivery status

**Key Methods**:
```typescript
class ViberService {
  async sendAppointmentConfirmation(appointmentId: string): Promise<void>;
  async scheduleAppointmentReminder(appointmentId: string, reminderTime: Date): Promise<void>;
  async sendMessage(phone: string, message: string): Promise<MessageStatus>;
  async handleWebhook(viberRequest: ViberWebhookDto): Promise<void>;
}
```

---

## Implementation Steps

### Phase 1: Infrastructure Setup (Week 1)

**1.1 Twilio Account Setup**
```bash
# Sign up for Twilio account
# Purchase Bulgarian phone number (+359...)
# Configure webhook URLs
# Get Account SID and Auth Token
```

**Configuration**:
- **Phone Number**: Purchase Bulgarian number (+359 prefix)
- **Voice Webhook URL**: `https://yourdomain.com/api/voice-bot/incoming-call`
- **Status Callback URL**: `https://yourdomain.com/api/voice-bot/call-status`
- **Method**: POST

**1.2 Google Cloud Setup (for Speech)**
```bash
# Create Google Cloud project
# Enable Cloud Speech-to-Text API
# Enable Cloud Text-to-Speech API
# Create service account and download credentials JSON
# Set environment variable: GOOGLE_APPLICATION_CREDENTIALS
```

**1.3 Viber Setup**
```bash
# Option A: Direct Viber Bot API
# - Create Viber Bot account
# - Get Bot Auth Token
# - Set webhook URL

# Option B: Twilio Viber Channel (Easier)
# - Enable Viber Messaging in Twilio
# - Configure Viber sender
```

**1.4 Database Migrations**

Create new tables for voice bot functionality:

```sql
-- Voice call records
CREATE TABLE voice_calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  business_id UUID NOT NULL REFERENCES businesses(id),
  call_sid VARCHAR(34) UNIQUE NOT NULL,
  from_phone VARCHAR(20) NOT NULL,
  to_phone VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL, -- queued, ringing, in-progress, completed, failed
  direction VARCHAR(20) NOT NULL, -- inbound, outbound
  duration_seconds INTEGER,
  recording_url TEXT,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Voice conversation sessions
CREATE TABLE voice_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  call_id UUID NOT NULL REFERENCES voice_calls(id),
  session_id VARCHAR(100) UNIQUE NOT NULL,
  current_state VARCHAR(50) NOT NULL,
  intent VARCHAR(50),
  context JSONB NOT NULL DEFAULT '{}',
  slots JSONB NOT NULL DEFAULT '{}',
  appointment_id UUID REFERENCES appointments(id),
  attempt_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Voice session logs (conversation transcript)
CREATE TABLE voice_session_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES voice_sessions(id),
  sequence_number INTEGER NOT NULL,
  direction VARCHAR(10) NOT NULL, -- user, bot
  speech_text TEXT,
  intent VARCHAR(50),
  entities JSONB,
  response_text TEXT,
  audio_url TEXT,
  timestamp TIMESTAMP DEFAULT NOW(),

  UNIQUE(session_id, sequence_number)
);

-- Viber messages
CREATE TABLE viber_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  appointment_id UUID REFERENCES appointments(id),
  recipient_phone VARCHAR(20) NOT NULL,
  message_type VARCHAR(50) NOT NULL, -- confirmation, reminder_24h, reminder_1h
  message_text TEXT NOT NULL,
  viber_message_id VARCHAR(100),
  status VARCHAR(20) NOT NULL, -- pending, sent, delivered, failed
  scheduled_for TIMESTAMP,
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_voice_calls_tenant_business ON voice_calls(tenant_id, business_id);
CREATE INDEX idx_voice_calls_call_sid ON voice_calls(call_sid);
CREATE INDEX idx_voice_sessions_call_id ON voice_sessions(call_id);
CREATE INDEX idx_voice_sessions_session_id ON voice_sessions(session_id);
CREATE INDEX idx_voice_session_logs_session_id ON voice_session_logs(session_id);
CREATE INDEX idx_viber_messages_appointment ON viber_messages(appointment_id);
CREATE INDEX idx_viber_messages_status_scheduled ON viber_messages(status, scheduled_for);
```

**1.5 Update Appointment Entity**

Add field to track AI caller-taken appointments:

```typescript
// backend/src/database/entities/appointment.entity.ts

@Entity('appointments')
export class Appointment {
  // ... existing fields ...

  @Column({ type: 'boolean', default: false })
  ai_caller_taken: boolean;

  @Column({ type: 'uuid', nullable: true })
  voice_call_id?: string;

  @ManyToOne(() => VoiceCall, { nullable: true })
  @JoinColumn({ name: 'voice_call_id' })
  voiceCall?: VoiceCall;
}
```

---

### Phase 2: Core Voice Bot Implementation (Week 2-3)

**2.1 Create Voice Bot Module**

```typescript
// backend/src/modules/voice-bot/voice-bot.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VoiceBotController } from './voice-bot.controller';
import { VoiceBotService } from './voice-bot.service';
import { CallHandlerService } from './services/call-handler.service';
import { SpeechService } from './services/speech.service';
import { ConversationService } from './services/conversation.service';
import { NLUService } from './services/nlu.service';
import { VoiceCall } from './entities/voice-call.entity';
import { VoiceSession } from './entities/voice-session.entity';
import { VoiceSessionLog } from './entities/voice-session-log.entity';
import { AppointmentsModule } from '../appointments/appointments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VoiceCall,
      VoiceSession,
      VoiceSessionLog,
    ]),
    AppointmentsModule,
  ],
  controllers: [VoiceBotController],
  providers: [
    VoiceBotService,
    CallHandlerService,
    SpeechService,
    ConversationService,
    NLUService,
  ],
  exports: [VoiceBotService],
})
export class VoiceBotModule {}
```

**2.2 Implement Twilio Webhook Controller**

```typescript
// backend/src/modules/voice-bot/voice-bot.controller.ts

import { Controller, Post, Body, Query, Headers } from '@nestjs/common';
import { CallHandlerService } from './services/call-handler.service';
import { TwilioWebhookDto } from './dto/twilio-webhook.dto';

@Controller('voice-bot')
export class VoiceBotController {
  constructor(private readonly callHandler: CallHandlerService) {}

  @Post('incoming-call')
  async handleIncomingCall(
    @Body() twilioRequest: TwilioWebhookDto,
    @Headers('x-twilio-signature') signature: string,
  ): Promise<string> {
    // Verify Twilio signature for security
    this.verifyTwilioSignature(twilioRequest, signature);

    // Generate TwiML response
    const twiml = await this.callHandler.handleIncomingCall(twilioRequest);
    return twiml;
  }

  @Post('gather-speech')
  async handleSpeechGather(
    @Body() twilioRequest: TwilioWebhookDto,
  ): Promise<string> {
    const { CallSid, SpeechResult } = twilioRequest;
    const twiml = await this.callHandler.handleSpeechInput(
      CallSid,
      SpeechResult,
    );
    return twiml;
  }

  @Post('call-status')
  async handleCallStatus(
    @Body() twilioRequest: TwilioWebhookDto,
  ): Promise<void> {
    await this.callHandler.handleCallStatusUpdate(
      twilioRequest.CallSid,
      twilioRequest.CallStatus,
    );
  }

  private verifyTwilioSignature(
    request: TwilioWebhookDto,
    signature: string,
  ): void {
    // Implement Twilio signature verification
    // https://www.twilio.com/docs/usage/security#validating-requests
  }
}
```

**2.3 Implement Call Handler**

```typescript
// backend/src/modules/voice-bot/services/call-handler.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VoiceCall } from '../entities/voice-call.entity';
import { VoiceSession } from '../entities/voice-session.entity';
import { ConversationService } from './conversation.service';
import { SpeechService } from './speech.service';
import * as twilio from 'twilio';

@Injectable()
export class CallHandlerService {
  constructor(
    @InjectRepository(VoiceCall)
    private voiceCallRepo: Repository<VoiceCall>,
    @InjectRepository(VoiceSession)
    private sessionRepo: Repository<VoiceSession>,
    private conversationService: ConversationService,
    private speechService: SpeechService,
  ) {}

  async handleIncomingCall(request: any): Promise<string> {
    const { CallSid, From, To } = request;

    // Create voice call record
    const call = await this.voiceCallRepo.save({
      call_sid: CallSid,
      from_phone: From,
      to_phone: To,
      status: 'in-progress',
      direction: 'inbound',
      started_at: new Date(),
    });

    // Create conversation session
    const session = await this.conversationService.createSession(call.id);

    // Generate greeting TwiML
    const greeting = 'Добър ден! Обажда се автоматичният асистент на [Име на бизнеса]. Как мога да ви помогна?';
    const audioUrl = await this.speechService.textToSpeech(greeting, 'bg-BG');

    const twiml = new twilio.twiml.VoiceResponse();
    twiml.play(audioUrl);
    twiml.gather({
      input: ['speech'],
      language: 'bg-BG',
      timeout: 3,
      action: '/api/voice-bot/gather-speech',
      method: 'POST',
      speechTimeout: 'auto',
    });

    return twiml.toString();
  }

  async handleSpeechInput(callSid: string, speechResult: string): Promise<string> {
    // Get session
    const call = await this.voiceCallRepo.findOne({ where: { call_sid: callSid } });
    const session = await this.sessionRepo.findOne({ where: { call_id: call.id } });

    // Process speech input
    const response = await this.conversationService.processInput(
      session,
      speechResult,
    );

    // Generate TwiML response
    const twiml = new twilio.twiml.VoiceResponse();

    if (response.audioUrl) {
      twiml.play(response.audioUrl);
    } else {
      const audioUrl = await this.speechService.textToSpeech(response.text, 'bg-BG');
      twiml.play(audioUrl);
    }

    if (response.shouldHangup) {
      twiml.hangup();
    } else {
      twiml.gather({
        input: ['speech'],
        language: 'bg-BG',
        timeout: 3,
        action: '/api/voice-bot/gather-speech',
        method: 'POST',
        speechTimeout: 'auto',
      });
    }

    return twiml.toString();
  }

  async handleCallStatusUpdate(callSid: string, status: string): Promise<void> {
    const call = await this.voiceCallRepo.findOne({ where: { call_sid: callSid } });

    call.status = status;
    if (status === 'completed' || status === 'failed') {
      call.ended_at = new Date();
    }

    await this.voiceCallRepo.save(call);
  }
}
```

**2.4 Implement Speech Service (Google Cloud)**

```typescript
// backend/src/modules/voice-bot/services/speech.service.ts

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as textToSpeech from '@google-cloud/text-to-speech';
import * as speech from '@google-cloud/speech';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

@Injectable()
export class SpeechService {
  private ttsClient: textToSpeech.TextToSpeechClient;
  private sttClient: speech.SpeechClient;
  private audioCache: Map<string, string> = new Map();

  constructor(private config: ConfigService) {
    this.ttsClient = new textToSpeech.TextToSpeechClient({
      keyFilename: config.get('GOOGLE_APPLICATION_CREDENTIALS'),
    });
    this.sttClient = new speech.SpeechClient({
      keyFilename: config.get('GOOGLE_APPLICATION_CREDENTIALS'),
    });
  }

  async textToSpeech(
    text: string,
    languageCode: string = 'bg-BG',
    voiceName: string = 'bg-BG-Standard-A',
  ): Promise<string> {
    // Check cache
    const cacheKey = `${languageCode}:${voiceName}:${text}`;
    if (this.audioCache.has(cacheKey)) {
      return this.audioCache.get(cacheKey);
    }

    const request = {
      input: { text },
      voice: {
        languageCode,
        name: voiceName,
        ssmlGender: 'FEMALE',
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 1.0,
        pitch: 0.0,
      },
    };

    const [response] = await this.ttsClient.synthesizeSpeech(request);

    // Save audio file
    const audioFileName = `audio_${Date.now()}_${Math.random().toString(36).substring(7)}.mp3`;
    const audioPath = path.join(process.cwd(), 'public', 'audio', audioFileName);

    await promisify(fs.writeFile)(audioPath, response.audioContent, 'binary');

    const audioUrl = `${this.config.get('APP_URL')}/audio/${audioFileName}`;

    // Cache for common phrases
    this.audioCache.set(cacheKey, audioUrl);

    return audioUrl;
  }

  async speechToText(audioUrl: string, languageCode: string = 'bg-BG'): Promise<string> {
    // Download audio file from URL
    // Convert to proper format if needed
    // Send to Google Speech-to-Text API

    const audio = {
      uri: audioUrl, // GCS URI or base64 encoded
    };

    const config = {
      encoding: 'MP3',
      sampleRateHertz: 8000,
      languageCode,
      enableAutomaticPunctuation: true,
    };

    const request = {
      audio,
      config,
    };

    const [response] = await this.sttClient.recognize(request);
    const transcription = response.results
      .map(result => result.alternatives[0].transcript)
      .join('\n');

    return transcription;
  }
}
```

**2.5 Implement NLU Service (OpenAI GPT-4)**

```typescript
// backend/src/modules/voice-bot/services/nlu.service.ts

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class NLUService {
  private openai: OpenAI;

  constructor(private config: ConfigService) {
    this.openai = new OpenAI({
      apiKey: config.get('OPENAI_API_KEY'),
    });
  }

  async recognizeIntent(text: string, context: any): Promise<string> {
    const systemPrompt = `You are an NLU system for a Bulgarian appointment booking voice bot.
Recognize the user's intent from their speech.

Available intents:
- book_appointment: User wants to book an appointment
- check_availability: User wants to check available times
- cancel_appointment: User wants to cancel an appointment
- reschedule_appointment: User wants to reschedule
- get_business_info: User asks about business info (hours, location, services)
- speak_to_human: User wants to speak to a person
- unknown: Cannot determine intent

Current conversation context: ${JSON.stringify(context)}

Return ONLY the intent name, nothing else.`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `User said: "${text}"` },
      ],
      temperature: 0.3,
      max_tokens: 50,
    });

    return completion.choices[0].message.content.trim().toLowerCase();
  }

  async extractEntities(text: string, entityTypes: string[]): Promise<any> {
    const systemPrompt = `Extract the following entities from Bulgarian text:
${entityTypes.join(', ')}

Return a JSON object with entity types as keys and extracted values.
If an entity is not found, omit it from the response.

Examples:
- "Искам час за подстригване утре в 10 часа" → {"service": "подстригване", "date": "утре", "time": "10 часа"}
- "Моят телефон е 0888123456" → {"phone": "0888123456"}
- "Казвам се Иван Петров" → {"first_name": "Иван", "last_name": "Петров"}`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });

    return JSON.parse(completion.choices[0].message.content);
  }

  async parseDate(text: string): Promise<Date | null> {
    // Use GPT-4 to parse Bulgarian date expressions
    const systemPrompt = `Parse Bulgarian date expressions to ISO date format.
Examples:
- "утре" → tomorrow's date
- "в понеделник" → next Monday
- "на 15-ти" → 15th of current/next month
- "след 3 дни" → 3 days from now

Return ONLY the ISO date (YYYY-MM-DD) or "null" if cannot parse.
Today's date is ${new Date().toISOString().split('T')[0]}.`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ],
      temperature: 0.1,
      max_tokens: 20,
    });

    const dateStr = completion.choices[0].message.content.trim();
    return dateStr === 'null' ? null : new Date(dateStr);
  }

  async parsePhoneNumber(text: string): Promise<string | null> {
    // Extract Bulgarian phone number (0888123456 or +359888123456)
    const phoneRegex = /(?:\+359|0)[\s\-]?[0-9]{3}[\s\-]?[0-9]{3}[\s\-]?[0-9]{3}/g;
    const matches = text.match(phoneRegex);

    if (!matches) return null;

    // Clean up the phone number
    let phone = matches[0].replace(/[\s\-]/g, '');

    // Convert to international format
    if (phone.startsWith('0')) {
      phone = '+359' + phone.substring(1);
    }

    return phone;
  }
}
```

---

### Phase 3: Conversation Flow Implementation (Week 4)

**3.1 Conversation Manager**

```typescript
// backend/src/modules/voice-bot/services/conversation.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VoiceSession } from '../entities/voice-session.entity';
import { VoiceSessionLog } from '../entities/voice-session-log.entity';
import { NLUService } from './nlu.service';
import { SpeechService } from './speech.service';
import { AppointmentsService } from '../../appointments/appointments.service';
import { ConversationState } from '../enums/conversation-state.enum';

interface ConversationResponse {
  text: string;
  audioUrl?: string;
  shouldHangup: boolean;
}

@Injectable()
export class ConversationService {
  constructor(
    @InjectRepository(VoiceSession)
    private sessionRepo: Repository<VoiceSession>,
    @InjectRepository(VoiceSessionLog)
    private logRepo: Repository<VoiceSessionLog>,
    private nluService: NLUService,
    private speechService: SpeechService,
    private appointmentsService: AppointmentsService,
  ) {}

  async createSession(callId: string): Promise<VoiceSession> {
    const session = this.sessionRepo.create({
      call_id: callId,
      session_id: `session_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      current_state: ConversationState.GREETING,
      context: {},
      slots: {},
      attempt_count: 0,
    });

    return this.sessionRepo.save(session);
  }

  async processInput(
    session: VoiceSession,
    userInput: string,
  ): Promise<ConversationResponse> {
    // Log user input
    await this.logUserInput(session.id, userInput);

    // Process based on current state
    let response: ConversationResponse;

    switch (session.current_state) {
      case ConversationState.GREETING:
        response = await this.handleGreeting(session, userInput);
        break;

      case ConversationState.INTENT_RECOGNITION:
        response = await this.handleIntentRecognition(session, userInput);
        break;

      case ConversationState.SERVICE_SELECTION:
        response = await this.handleServiceSelection(session, userInput);
        break;

      case ConversationState.DATE_COLLECTION:
        response = await this.handleDateCollection(session, userInput);
        break;

      case ConversationState.TIME_SELECTION:
        response = await this.handleTimeSelection(session, userInput);
        break;

      case ConversationState.NAME_COLLECTION:
        response = await this.handleNameCollection(session, userInput);
        break;

      case ConversationState.PHONE_COLLECTION:
        response = await this.handlePhoneCollection(session, userInput);
        break;

      case ConversationState.CONFIRMATION:
        response = await this.handleConfirmation(session, userInput);
        break;

      default:
        response = {
          text: 'Извинете, нещо се обърка. Моля опитайте отново.',
          shouldHangup: true,
        };
    }

    // Log bot response
    await this.logBotResponse(session.id, response.text);

    return response;
  }

  private async handleIntentRecognition(
    session: VoiceSession,
    userInput: string,
  ): Promise<ConversationResponse> {
    const intent = await this.nluService.recognizeIntent(userInput, session.context);

    session.intent = intent;

    if (intent === 'book_appointment') {
      session.current_state = ConversationState.SERVICE_SELECTION;
      await this.sessionRepo.save(session);

      return {
        text: 'Разбирам, искате да запазите час. Каква услуга желаете?',
        shouldHangup: false,
      };
    } else if (intent === 'speak_to_human') {
      return {
        text: 'Един момент, ще ви свържа с наш служител.',
        shouldHangup: false,
        // Transfer call to human (Twilio Dial verb)
      };
    } else {
      return {
        text: 'Извинете, не разбрах. Можете ли да повторите?',
        shouldHangup: false,
      };
    }
  }

  private async handleServiceSelection(
    session: VoiceSession,
    userInput: string,
  ): Promise<ConversationResponse> {
    // Extract service entity
    const entities = await this.nluService.extractEntities(userInput, ['service']);

    if (!entities.service) {
      session.attempt_count++;
      await this.sessionRepo.save(session);

      if (session.attempt_count >= 3) {
        return {
          text: 'Извинете, имам трудности да разбера. Моля обадете се по-късно.',
          shouldHangup: true,
        };
      }

      return {
        text: 'Извинете, не разбрах каква услуга желаете. Можете да изберете от подстригване, боядисване, маникюр или педикюр.',
        shouldHangup: false,
      };
    }

    // Match service to available services
    const service = await this.matchService(session.business_id, entities.service);

    if (!service) {
      return {
        text: `Извинете, не предлагаме услуга "${entities.service}". Нашите услуги са: подстригване, боядисване, маникюр, педикюр. Коя от тях желаете?`,
        shouldHangup: false,
      };
    }

    session.slots['service'] = entities.service;
    session.slots['serviceId'] = service.id;
    session.current_state = ConversationState.DATE_COLLECTION;
    session.attempt_count = 0;
    await this.sessionRepo.save(session);

    return {
      text: `Чудесно! За кога желаете да запазите час за ${entities.service}?`,
      shouldHangup: false,
    };
  }

  private async handleDateCollection(
    session: VoiceSession,
    userInput: string,
  ): Promise<ConversationResponse> {
    const date = await this.nluService.parseDate(userInput);

    if (!date) {
      session.attempt_count++;
      await this.sessionRepo.save(session);

      return {
        text: 'Извинете, не разбрах датата. Можете да кажете например "утре", "в понеделник" или конкретна дата.',
        shouldHangup: false,
      };
    }

    session.slots['date'] = date.toISOString().split('T')[0];
    session.current_state = ConversationState.TIME_SELECTION;
    session.attempt_count = 0;
    await this.sessionRepo.save(session);

    // Check available time slots
    const availableSlots = await this.appointmentsService.getAvailableSlots(
      session.business_id,
      session.slots['serviceId'],
      date,
    );

    if (availableSlots.length === 0) {
      // No availability on that date
      const nextAvailable = await this.appointmentsService.getNextAvailableDate(
        session.business_id,
        session.slots['serviceId'],
      );

      return {
        text: `За съжаление на ${this.formatDate(date)} нямаме свободни часове. Следващият свободен ден е ${this.formatDate(nextAvailable.date)}. Желаете ли да запазите тогава?`,
        shouldHangup: false,
      };
    }

    // Offer available time slots
    const slotText = this.formatTimeSlots(availableSlots.slice(0, 3));

    return {
      text: `На ${this.formatDate(date)} имаме свободни часове: ${slotText}. Кой час ви подхожда?`,
      shouldHangup: false,
    };
  }

  private async handleTimeSelection(
    session: VoiceSession,
    userInput: string,
  ): Promise<ConversationResponse> {
    const entities = await this.nluService.extractEntities(userInput, ['time']);

    if (!entities.time) {
      session.attempt_count++;
      await this.sessionRepo.save(session);

      return {
        text: 'Извинете, не разбрах часа. Можете да кажете например "10 часа" или "2 следобед".',
        shouldHangup: false,
      };
    }

    // Validate time slot is available
    const isAvailable = await this.appointmentsService.isSlotAvailable(
      session.business_id,
      session.slots['serviceId'],
      new Date(session.slots['date']),
      entities.time,
    );

    if (!isAvailable) {
      return {
        text: `За съжаление ${entities.time} вече е зает. Моля изберете от другите свободни часове.`,
        shouldHangup: false,
      };
    }

    session.slots['time'] = entities.time;
    session.current_state = ConversationState.NAME_COLLECTION;
    session.attempt_count = 0;
    await this.sessionRepo.save(session);

    return {
      text: 'Отлично! Как се казвате?',
      shouldHangup: false,
    };
  }

  private async handleNameCollection(
    session: VoiceSession,
    userInput: string,
  ): Promise<ConversationResponse> {
    const entities = await this.nluService.extractEntities(userInput, ['first_name', 'last_name']);

    if (!entities.first_name) {
      session.attempt_count++;
      await this.sessionRepo.save(session);

      return {
        text: 'Извинете, не чух името ви. Моля кажете го отново.',
        shouldHangup: false,
      };
    }

    session.slots['firstName'] = entities.first_name;
    session.slots['lastName'] = entities.last_name || '';
    session.current_state = ConversationState.PHONE_COLLECTION;
    session.attempt_count = 0;
    await this.sessionRepo.save(session);

    return {
      text: `Благодаря, ${entities.first_name}. Какъв е вашият телефонен номер?`,
      shouldHangup: false,
    };
  }

  private async handlePhoneCollection(
    session: VoiceSession,
    userInput: string,
  ): Promise<ConversationResponse> {
    const phone = await this.nluService.parsePhoneNumber(userInput);

    if (!phone) {
      session.attempt_count++;
      await this.sessionRepo.save(session);

      return {
        text: 'Извинете, не чух телефонния номер. Моля кажете го цифра по цифра.',
        shouldHangup: false,
      };
    }

    session.slots['phone'] = phone;
    session.current_state = ConversationState.CONFIRMATION;
    session.attempt_count = 0;
    await this.sessionRepo.save(session);

    // Generate confirmation message
    const confirmationText = `Отлично! Обобщавам: ${session.slots['service']} на ${this.formatDate(new Date(session.slots['date']))} в ${session.slots['time']} часа за ${session.slots['firstName']} ${session.slots['lastName']}, телефон ${this.formatPhone(phone)}. Потвърждавате ли?`;

    return {
      text: confirmationText,
      shouldHangup: false,
    };
  }

  private async handleConfirmation(
    session: VoiceSession,
    userInput: string,
  ): Promise<ConversationResponse> {
    const normalized = userInput.toLowerCase();

    // Check for affirmative response
    const affirmative = ['да', 'потвърждавам', 'правилно', 'вярно', 'точно'];
    const negative = ['не', 'неправилно', 'грешка'];

    if (affirmative.some(word => normalized.includes(word))) {
      // Create appointment
      const appointment = await this.appointmentsService.create({
        business_id: session.business_id,
        service_id: session.slots['serviceId'],
        date: session.slots['date'],
        time: session.slots['time'],
        client_first_name: session.slots['firstName'],
        client_last_name: session.slots['lastName'],
        client_phone: session.slots['phone'],
        ai_caller_taken: true,
        voice_call_id: session.call_id,
        status: 'confirmed',
      });

      session.appointment_id = appointment.id;
      session.current_state = ConversationState.BOOKING_COMPLETE;
      await this.sessionRepo.save(session);

      return {
        text: `Перфектно! Вашият час е запазен. Ще получите потвърждение и напомняне по Viber на ${this.formatPhone(session.slots['phone'])}. Благодарим ви и довиждане!`,
        shouldHangup: true,
      };
    } else if (negative.some(word => normalized.includes(word))) {
      session.current_state = ConversationState.SERVICE_SELECTION;
      session.slots = {};
      await this.sessionRepo.save(session);

      return {
        text: 'Разбирам. Нека започнем отначало. Каква услуга желаете?',
        shouldHangup: false,
      };
    } else {
      return {
        text: 'Моля отговорете с "да" или "не". Потвърждавате ли часа?',
        shouldHangup: false,
      };
    }
  }

  // Helper methods
  private formatDate(date: Date): string {
    const days = ['неделя', 'понеделник', 'вторник', 'сряда', 'четвъртък', 'петък', 'събота'];
    const dayName = days[date.getDay()];
    const dayNum = date.getDate();
    const month = date.getMonth() + 1;
    return `${dayName}, ${dayNum}-ти ${month}-ти месец`;
  }

  private formatTimeSlots(slots: any[]): string {
    return slots.map(s => `${s.time} часа`).join(', ');
  }

  private formatPhone(phone: string): string {
    // Format +359888123456 as "0888 123 456"
    if (phone.startsWith('+359')) {
      const local = '0' + phone.substring(4);
      return `${local.substring(0, 4)} ${local.substring(4, 7)} ${local.substring(7)}`;
    }
    return phone;
  }

  private async logUserInput(sessionId: string, text: string): Promise<void> {
    const count = await this.logRepo.count({ where: { session_id: sessionId } });
    await this.logRepo.save({
      session_id: sessionId,
      sequence_number: count + 1,
      direction: 'user',
      speech_text: text,
      timestamp: new Date(),
    });
  }

  private async logBotResponse(sessionId: string, text: string): Promise<void> {
    const count = await this.logRepo.count({ where: { session_id: sessionId } });
    await this.logRepo.save({
      session_id: sessionId,
      sequence_number: count + 1,
      direction: 'bot',
      response_text: text,
      timestamp: new Date(),
    });
  }

  private async matchService(businessId: string, serviceName: string): Promise<any> {
    // Fuzzy match service name to available services
    // Use GPT-4 or simple string matching
    // Return service entity if found
    return null; // Placeholder
  }
}
```

---

### Phase 4: Viber Integration (Week 5)

**4.1 Create Viber Service**

```typescript
// backend/src/modules/voice-bot/services/viber.service.ts

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ViberMessage } from '../entities/viber-message.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';
import axios from 'axios';

@Injectable()
export class ViberService {
  private readonly viberApiUrl = 'https://chatapi.viber.com/pa/send_message';
  private readonly viberAuthToken: string;

  constructor(
    private config: ConfigService,
    @InjectRepository(ViberMessage)
    private viberMessageRepo: Repository<ViberMessage>,
  ) {
    this.viberAuthToken = config.get('VIBER_AUTH_TOKEN');
  }

  async sendAppointmentConfirmation(appointment: Appointment): Promise<void> {
    const message = this.generateConfirmationMessage(appointment);

    await this.sendMessage(
      appointment.client_phone,
      message,
      appointment.id,
      'confirmation',
    );
  }

  async scheduleAppointmentReminder(
    appointment: Appointment,
    reminderType: '24h' | '1h',
  ): Promise<void> {
    const message = this.generateReminderMessage(appointment, reminderType);

    let scheduledTime: Date;
    if (reminderType === '24h') {
      scheduledTime = new Date(appointment.start_time.getTime() - 24 * 60 * 60 * 1000);
    } else {
      scheduledTime = new Date(appointment.start_time.getTime() - 60 * 60 * 1000);
    }

    const viberMessage = this.viberMessageRepo.create({
      tenant_id: appointment.tenant_id,
      appointment_id: appointment.id,
      recipient_phone: appointment.client_phone,
      message_type: `reminder_${reminderType}`,
      message_text: message,
      status: 'pending',
      scheduled_for: scheduledTime,
    });

    await this.viberMessageRepo.save(viberMessage);
  }

  async sendMessage(
    phone: string,
    message: string,
    appointmentId?: string,
    messageType: string = 'general',
  ): Promise<any> {
    const payload = {
      receiver: phone,
      type: 'text',
      text: message,
      sender: {
        name: 'Booking Assistant',
        avatar: 'https://yourdomain.com/logo.png',
      },
    };

    try {
      const response = await axios.post(this.viberApiUrl, payload, {
        headers: {
          'X-Viber-Auth-Token': this.viberAuthToken,
          'Content-Type': 'application/json',
        },
      });

      // Log sent message
      const viberMessage = this.viberMessageRepo.create({
        appointment_id: appointmentId,
        recipient_phone: phone,
        message_type: messageType,
        message_text: message,
        viber_message_id: response.data.message_token,
        status: 'sent',
        sent_at: new Date(),
      });

      await this.viberMessageRepo.save(viberMessage);

      return response.data;
    } catch (error) {
      console.error('Viber send error:', error);

      // Log failed message
      const viberMessage = this.viberMessageRepo.create({
        appointment_id: appointmentId,
        recipient_phone: phone,
        message_type: messageType,
        message_text: message,
        status: 'failed',
        error_message: error.message,
      });

      await this.viberMessageRepo.save(viberMessage);

      throw error;
    }
  }

  private generateConfirmationMessage(appointment: Appointment): string {
    return `✅ Потвърждение за час

Здравейте ${appointment.client_first_name}!

Вашият час е запазен успешно:

📅 Дата: ${this.formatDate(appointment.start_time)}
⏰ Час: ${this.formatTime(appointment.start_time)}
✂️ Услуга: ${appointment.service.name}
📍 Адрес: ${appointment.location.address_line1}

За отмяна или промяна, моля обадете се на ${appointment.business.phone_number}.

Очакваме ви!`;
  }

  private generateReminderMessage(
    appointment: Appointment,
    reminderType: '24h' | '1h',
  ): string {
    const timeText = reminderType === '24h' ? 'утре' : 'след 1 час';

    return `🔔 Напомняне за час

Здравейте ${appointment.client_first_name}!

Напомняме ви, че имате час ${timeText}:

📅 Дата: ${this.formatDate(appointment.start_time)}
⏰ Час: ${this.formatTime(appointment.start_time)}
✂️ Услуга: ${appointment.service.name}
📍 Адрес: ${appointment.location.address_line1}

Очакваме ви!`;
  }

  private formatDate(date: Date): string {
    const days = ['неделя', 'понеделник', 'вторник', 'сряда', 'четвъртък', 'петък', 'събота'];
    const months = ['януари', 'февруари', 'март', 'април', 'май', 'юни', 'юли', 'август', 'септември', 'октомври', 'ноември', 'декември'];

    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
  }

  private formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
}
```

**4.2 Scheduled Reminder Job**

```typescript
// backend/src/modules/voice-bot/jobs/viber-reminder.job.ts

import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ViberMessage } from '../entities/viber-message.entity';
import { ViberService } from '../services/viber.service';

@Injectable()
export class ViberReminderJob {
  constructor(
    @InjectRepository(ViberMessage)
    private viberMessageRepo: Repository<ViberMessage>,
    private viberService: ViberService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async sendScheduledReminders(): Promise<void> {
    const now = new Date();

    // Find pending messages scheduled for now or earlier
    const pendingMessages = await this.viberMessageRepo.find({
      where: {
        status: 'pending',
        scheduled_for: LessThan(now),
      },
      relations: ['appointment'],
    });

    for (const message of pendingMessages) {
      try {
        await this.viberService.sendMessage(
          message.recipient_phone,
          message.message_text,
          message.appointment_id,
          message.message_type,
        );

        message.status = 'sent';
        message.sent_at = new Date();
      } catch (error) {
        message.status = 'failed';
        message.error_message = error.message;
      }

      await this.viberMessageRepo.save(message);
    }
  }
}
```

---

## Voice Flow Design

### Complete Conversation Flow

```
┌─────────────────────────────────────┐
│  1. GREETING                        │
│  Bot: "Добър ден! Обажда се        │
│       автоматичният асистент       │
│       на [Business]. Как мога       │
│       да ви помогна?"               │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  2. INTENT RECOGNITION              │
│  User: "Искам да запазя час"        │
│  Bot: Recognizes book_appointment   │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  3. SERVICE SELECTION               │
│  Bot: "Каква услуга желаете?"       │
│  User: "Подстригване"               │
│  Bot: Matches to service entity     │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  4. DATE COLLECTION                 │
│  Bot: "За кога желаете час?"        │
│  User: "Утре"                       │
│  Bot: Parses date = tomorrow        │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  5. AVAILABILITY CHECK              │
│  Bot: Queries calendar API          │
│  Bot: "Имаме свободни часове:       │
│       10:00, 14:00, 16:00"          │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  6. TIME SELECTION                  │
│  User: "10 часа"                    │
│  Bot: Validates slot available      │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  7. NAME COLLECTION                 │
│  Bot: "Как се казвате?"             │
│  User: "Иван Петров"                │
│  Bot: Extracts first + last name    │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  8. PHONE COLLECTION                │
│  Bot: "Какъв е вашият телефон?"     │
│  User: "0888123456"                 │
│  Bot: Validates phone format        │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  9. CONFIRMATION                    │
│  Bot: "Обобщавам: подстригване     │
│       утре в 10:00 за Иван Петров  │
│       тел. 0888 123 456.           │
│       Потвърждавате ли?"           │
│  User: "Да"                         │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  10. BOOKING CREATION               │
│  Bot: Creates appointment in DB     │
│       Sets ai_caller_taken = true   │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  11. CONFIRMATION MESSAGE           │
│  Bot: "Вашият час е запазен!       │
│       Ще получите потвърждение     │
│       по Viber. Благодарим!"       │
│  Bot: Hangs up                      │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  12. VIBER CONFIRMATION             │
│  System: Sends Viber confirmation   │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  13. VIBER REMINDERS                │
│  System: Sends 24h reminder         │
│  System: Sends 1h reminder          │
└─────────────────────────────────────┘
```

### Error Handling Flows

**No availability on requested date**:
```
User: "Искам час утре"
Bot: Checks calendar → No slots available
Bot: "За съжаление утре нямаме свободни часове.
     Следващият свободен ден е в петък.
     Желаете ли да запазите тогава?"
User: "Да"
Bot: Continues with time selection for Friday
```

**Misrecognized speech** (retry logic):
```
Bot: "Каква услуга желаете?"
User: [unclear speech]
Bot: STT returns low confidence result
Bot: "Извинете, не разбрах. Можете ли да повторите?"
User: "Подстригване"
Bot: Continues normally
```

**Max retries exceeded**:
```
Bot: "Как се казвате?"
User: [unclear] (attempt 1)
Bot: "Извинете, не чух името ви."
User: [unclear] (attempt 2)
Bot: "Моля кажете името отново."
User: [unclear] (attempt 3)
Bot: "Извинете, имам трудности да ви разбера.
     Моля обадете се по-късно или посетете
     нашия сайт за онлайн резервация. Довиждане."
Bot: Hangs up
```

**User wants to speak to human**:
```
User: "Искам да говоря с човек"
Bot: Recognizes speak_to_human intent
Bot: "Един момент, ще ви свържа с наш служител."
Bot: Transfers call using Twilio <Dial> verb
```

---

## Calendar Integration

### Availability Check API

The voice bot integrates with existing appointment system to check calendar availability:

```typescript
// Interface with existing AppointmentsService

class AppointmentsService {
  async getAvailableSlots(
    businessId: string,
    serviceId: string,
    date: Date,
  ): Promise<TimeSlot[]> {
    // Query staff availability
    // Check existing appointments
    // Account for service duration and buffers
    // Return available time slots
  }

  async getNextAvailableDate(
    businessId: string,
    serviceId: string,
  ): Promise<{ date: Date; slots: TimeSlot[] }> {
    // Find next date with available slots
    // Used when requested date has no availability
  }

  async isSlotAvailable(
    businessId: string,
    serviceId: string,
    date: Date,
    time: string,
  ): Promise<boolean> {
    // Validate specific time slot is still available
    // Prevents double-booking if user delays confirmation
  }
}
```

### Appointment Creation

```typescript
async createAppointmentFromVoiceCall(data: {
  business_id: string;
  service_id: string;
  date: string;
  time: string;
  client_first_name: string;
  client_last_name: string;
  client_phone: string;
  voice_call_id: string;
}): Promise<Appointment> {
  // Check if client exists by phone
  let client = await this.clientsService.findByPhone(data.client_phone);

  if (!client) {
    // Create new client profile
    client = await this.clientsService.create({
      first_name: data.client_first_name,
      last_name: data.client_last_name,
      phone: data.client_phone,
      source: 'voice_bot',
    });
  }

  // Parse date and time to timestamp
  const startTime = this.parseDateTime(data.date, data.time);

  // Get service to determine duration
  const service = await this.servicesService.findOne(data.service_id);
  const endTime = new Date(startTime.getTime() + service.duration_minutes * 60000);

  // Assign staff member (auto-assign or use availability)
  const staffMember = await this.findAvailableStaff(
    data.business_id,
    data.service_id,
    startTime,
  );

  // Create appointment
  const appointment = await this.appointmentsRepo.save({
    business_id: data.business_id,
    client_id: client.id,
    service_id: data.service_id,
    staff_member_id: staffMember.id,
    start_time: startTime,
    end_time: endTime,
    status: 'confirmed',
    ai_caller_taken: true, // Flag as AI-created
    voice_call_id: data.voice_call_id,
    source: 'voice_bot',
  });

  // Send Viber confirmation
  await this.viberService.sendAppointmentConfirmation(appointment);

  // Schedule Viber reminders
  await this.viberService.scheduleAppointmentReminder(appointment, '24h');
  await this.viberService.scheduleAppointmentReminder(appointment, '1h');

  return appointment;
}
```

---

## Deployment & Configuration

### Environment Variables

```bash
# .env

# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+359XXXXXXXXX
TWILIO_WEBHOOK_URL=https://yourdomain.com/api/voice-bot

# Google Cloud Speech
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
GOOGLE_CLOUD_PROJECT_ID=your-project-id

# OpenAI (for NLU)
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Viber
VIBER_AUTH_TOKEN=your_viber_bot_token
VIBER_SENDER_NAME=Booking Assistant

# Voice Bot Settings
VOICE_BOT_ENABLED=true
VOICE_BOT_LANGUAGE=bg-BG
VOICE_BOT_MAX_RETRIES=3
VOICE_BOT_SESSION_TIMEOUT=600
```

### Docker Deployment

Add voice bot service to docker-compose.yml:

```yaml
version: '3.8'

services:
  # ... existing services ...

  voice-bot:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - TWILIO_ACCOUNT_SID=${TWILIO_ACCOUNT_SID}
      - TWILIO_AUTH_TOKEN=${TWILIO_AUTH_TOKEN}
      - GOOGLE_APPLICATION_CREDENTIALS=/app/credentials/gcp-key.json
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - VIBER_AUTH_TOKEN=${VIBER_AUTH_TOKEN}
    volumes:
      - ./credentials:/app/credentials:ro
      - ./public/audio:/app/public/audio
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
```

### Ngrok for Development (Twilio Webhooks)

During development, use ngrok to expose local server to Twilio:

```bash
# Install ngrok
npm install -g ngrok

# Start ngrok tunnel
ngrok http 3000

# Copy HTTPS URL (e.g., https://abc123.ngrok.io)
# Set as Twilio webhook URL: https://abc123.ngrok.io/api/voice-bot/incoming-call
```

---

## Testing Strategy

### Unit Tests

```typescript
// voice-bot.service.spec.ts

describe('VoiceBotService', () => {
  let service: VoiceBotService;
  let nluService: NLUService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        VoiceBotService,
        { provide: NLUService, useValue: mockNLUService },
      ],
    }).compile();

    service = module.get<VoiceBotService>(VoiceBotService);
  });

  it('should recognize book_appointment intent', async () => {
    const result = await nluService.recognizeIntent(
      'Искам да запазя час за утре',
      {},
    );
    expect(result).toBe('book_appointment');
  });

  it('should extract service from Bulgarian text', async () => {
    const entities = await nluService.extractEntities(
      'Искам подстригване',
      ['service'],
    );
    expect(entities.service).toBe('подстригване');
  });

  it('should parse Bulgarian date expressions', async () => {
    const date = await nluService.parseDate('утре');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(date.toDateString()).toBe(tomorrow.toDateString());
  });
});
```

### Integration Tests

```typescript
describe('Voice Bot End-to-End', () => {
  it('should complete full booking flow', async () => {
    // Simulate incoming call
    const callResponse = await request(app)
      .post('/api/voice-bot/incoming-call')
      .send({
        CallSid: 'CA123',
        From: '+359888123456',
        To: '+359888999888',
      });

    expect(callResponse.text).toContain('<Say');

    // Simulate user saying "Искам час"
    const intentResponse = await request(app)
      .post('/api/voice-bot/gather-speech')
      .send({
        CallSid: 'CA123',
        SpeechResult: 'Искам да запазя час',
      });

    expect(intentResponse.text).toContain('Каква услуга');

    // Continue through full flow...
    // Verify appointment created with ai_caller_taken = true
  });
});
```

### Manual Testing

**Test Script**:
1. Call test Twilio number
2. Listen for greeting in Bulgarian
3. Say "Искам да запазя час" (I want to book an appointment)
4. Say "Подстригване" (Haircut)
5. Say "Утре" (Tomorrow)
6. Say "Десет часа" (10 o'clock)
7. Say "Иван Петров" (Name)
8. Say "0888123456" (Phone)
9. Say "Да" (Yes - confirmation)
10. Verify appointment created in database
11. Verify Viber message received

---

## Cost Estimation

### Monthly Cost Breakdown (100 calls/month)

**Twilio Voice**:
- Incoming calls: 100 calls × 3 min avg × $0.013/min = $3.90
- Phone number rental: $1/month
- **Subtotal**: ~$5/month

**Google Cloud Speech**:
- Speech-to-Text: 100 calls × 3 min × 4 STT requests/call × $0.006/15sec = $14.40
- Text-to-Speech: 100 calls × 10 responses × 50 chars avg × $4/1M chars (WaveNet) = $0.20
- **Subtotal**: ~$15/month

**OpenAI GPT-4** (for NLU):
- Intent recognition: 100 calls × 5 NLU calls × $0.03/1K tokens = $1.50
- Entity extraction: 100 calls × 10 extractions × $0.03/1K tokens = $3.00
- **Subtotal**: ~$5/month

**Viber Messaging**:
- Confirmation messages: 100 × $0.02 = $2.00
- 24h reminders: 100 × $0.02 = $2.00
- 1h reminders: 100 × $0.02 = $2.00
- **Subtotal**: ~$6/month

**Server Hosting** (if separate):
- VPS for voice bot: $20/month (can use existing backend)

**Total Estimated Cost**: ~$51/month for 100 calls
**Per-call cost**: ~$0.51

### Cost Optimization Strategies

1. **Use OpenAI Whisper (self-hosted)** instead of Google STT → Save $14/month
2. **Cache common TTS phrases** → Save 50% on TTS costs
3. **Use Rasa (self-hosted NLU)** instead of GPT-4 → Save $5/month
4. **Viber Bot API** (free) instead of paid messaging → Save $6/month

**Optimized cost**: ~$20/month for 100 calls

---

## Security & Compliance

### Data Privacy

**Personal Data Collected**:
- Name
- Phone number
- Appointment details
- Voice recordings (optional)

**GDPR Compliance**:
- Store voice recordings only if explicitly consented
- Allow users to request deletion of voice data
- Encrypt phone numbers in database
- Anonymize call logs after 90 days

### Security Measures

**Twilio Webhook Validation**:
```typescript
import * as crypto from 'crypto';

function validateTwilioRequest(
  url: string,
  params: any,
  signature: string,
  authToken: string,
): boolean {
  const data = Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], url);

  const expectedSignature = crypto
    .createHmac('sha1', authToken)
    .update(Buffer.from(data, 'utf-8'))
    .digest('base64');

  return expectedSignature === signature;
}
```

**API Keys**:
- Store API keys encrypted in database
- Use environment variables for secrets
- Rotate keys quarterly
- Never log API keys

**Voice Session Security**:
- Expire sessions after 10 minutes of inactivity
- Validate phone numbers before creating appointments
- Rate limit calls from same number (prevent spam)

---

## Summary

This comprehensive guide provides all technical details needed to implement an automated Bulgarian-language caller bot system that:

✅ Handles incoming calls via Twilio Voice
✅ Recognizes Bulgarian speech using Google Cloud Speech-to-Text
✅ Understands intent using OpenAI GPT-4
✅ Checks calendar availability
✅ Collects appointment details (service, date, time, name, phone)
✅ Creates appointments marked as AI-taken
✅ Sends Viber confirmations and reminders

**Key Features**:
- Natural Bulgarian conversation flow
- Robust error handling with retries
- Integration with existing booking system
- Automated Viber reminders (24h, 1h before)
- Complete audit trail in database
- Cost-effective at ~$0.51 per call

**Next Steps**:
1. Set up Twilio and Google Cloud accounts
2. Implement Phase 1 (Infrastructure Setup)
3. Build Core Voice Bot Service (Phase 2)
4. Implement Conversation Flow (Phase 3)
5. Integrate Viber Messaging (Phase 4)
6. Test with Bulgarian speakers
7. Deploy to production

The system is designed to integrate seamlessly with the existing imamChas-booking platform architecture while maintaining security, privacy, and cost-effectiveness.
