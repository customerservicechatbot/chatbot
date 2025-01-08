class TravelChatbot {
    constructor() {
        this.currentStep = 'greeting';
        this.language = 'en';
        this.isListening = false;
        this.bookingData = {
            serviceType: '',
            destination: '',
            travelers: '',
            dates: '',
            preferences: '',
            hotelDetails: {
                roomType: '',
                nights: '',
                hotelAmenities: '' // New field for hotel amenities
            },
            carRentalDetails: {
                carType: '',
                rentalDays: '',
                pickupLocation: '', // New field for car pickup location
                dropOffLocation: '' // New field for car drop-off location
            }
        };

        // Initialize speech recognition
        this.recognition = 'webkitSpeechRecognition' in window ? 
            new webkitSpeechRecognition() : null;
        this.setupSpeechRecognition();

        // DOM elements
        this.elements = {
            chatMessages: document.getElementById('chatMessages'),
            userInput: document.getElementById('userInput'),
            sendButton: document.getElementById('sendButton'),
            micButton: document.getElementById('micButton'),
            languageToggle: document.getElementById('languageToggle'),
            serviceSelector: document.getElementById('serviceSelector'),
            speakButton: document.getElementById('speakButton'),
            currentLang: document.getElementById('currentLang')
        };

        // Bind events
        this.bindEvents();

        // Start the chat
        this.initialize();
    }

    // Translations object
    translations = {
        en: {
            greeting: "Hello! Welcome to our travel booking assistant. How can I help you today?",
            servicePrompt: "What type of service are you looking for?",
            destinationPrompt: "Where would you like to go?",
            travelersPrompt: "How many people are traveling?",
            datesPrompt: "When would you like to travel?",
            hotelRoomPrompt: "What type of room would you like (e.g., single, double, suite)?",
            hotelNightsPrompt: "How many nights will you stay?",
            hotelAmenitiesPrompt: "Do you have any specific preferences for hotel amenities?",
            carTypePrompt: "What type of car would you like to rent (e.g., sedan, SUV)?",
            carDaysPrompt: "How many days will you need the car rental?",
            carPickupPrompt: "Where would you like to pick up the car?",
            carDropOffPrompt: "Where would you like to drop off the car?",
            confirmationPrompt: "Would you like to confirm your booking?",
            thankYou: "Thank you for your booking! Here's your summary:",
            flight: "Flight",
            hotel: "Hotel",
            car: "Car Rental",
            speakNow: "Listening... Speak now",
            bookingConfirmed: "Booking confirmed! Reference number:",
            inputPlaceholder: "Type your message...",
            errorSpeechNotSupported: "Speech recognition is not supported in your browser.",
            errorInvalidInput: "Please provide a valid input.",
            sending: "Sending...",
            processing: "Processing your request..."
        },
        es: {
            greeting: "¡Hola! Bienvenido a nuestro asistente de reservas de viajes. ¿Cómo puedo ayudarte hoy?",
            servicePrompt: "¿Qué tipo de servicio estás buscando?",
            destinationPrompt: "¿A dónde te gustaría ir?",
            travelersPrompt: "¿Cuántas personas viajan?",
            datesPrompt: "¿Cuándo te gustaría viajar?",
            hotelRoomPrompt: "¿Qué tipo de habitación prefieres (e.g., individual, doble, suite)?",
            hotelNightsPrompt: "¿Cuántas noches te quedarás?",
            hotelAmenitiesPrompt: "¿Tienes alguna preferencia específica para las comodidades del hotel?",
            carTypePrompt: "¿Qué tipo de coche te gustaría alquilar (e.g., sedán, SUV)?",
            carDaysPrompt: "¿Cuántos días necesitas el alquiler del coche?",
            carPickupPrompt: "¿Dónde te gustaría recoger el coche?",
            carDropOffPrompt: "¿Dónde te gustaría devolver el coche?",
            confirmationPrompt: "¿Te gustaría confirmar tu reserva?",
            thankYou: "¡Gracias por tu reserva! Aquí está tu resumen:",
            flight: "Vuelo",
            hotel: "Hotel",
            car: "Alquiler de coche",
            speakNow: "Escuchando... Habla ahora",
            bookingConfirmed: "¡Reserva confirmada! Número de referencia:",
            inputPlaceholder: "Escribe tu mensaje...",
            errorSpeechNotSupported: "El reconocimiento de voz no está soportado en tu navegador.",
            errorInvalidInput: "Por favor, proporciona una entrada válida.",
            sending: "Enviando...",
            processing: "Procesando tu solicitud..."
        }
    };

    // Initialize speech recognition
    setupSpeechRecognition() {
        if (this.recognition) {
            this.recognition.continuous = false;
            this.recognition.interimResults = false;

            this.recognition.onstart = () => {
                this.isListening = true;
                this.updateMicButton();
            };

            this.recognition.onend = () => {
                this.isListening = false;
                this.updateMicButton();
            };

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.elements.userInput.value = transcript;
                this.handleInput(transcript);
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.isListening = false;
                this.updateMicButton();
            };
        }
    }

    // Bind all event listeners
    bindEvents() {
        // Send button click
        this.elements.sendButton.addEventListener('click', () => {
            this.handleInput(this.elements.userInput.value);
        });

        // Enter key press in input
        this.elements.userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleInput(this.elements.userInput.value);
            }
        });

        // Microphone button
        this.elements.micButton.addEventListener('click', () => {
            this.toggleListening();
        });

        // Language toggle
        this.elements.languageToggle.addEventListener('click', () => {
            this.toggleLanguage();
        });

        // Speak button
        this.elements.speakButton.addEventListener('click', () => {
            const lastMessage = this.elements.chatMessages.lastElementChild;
            if (lastMessage) {
                this.speak(lastMessage.textContent);
            }
        });

        // Service selection buttons
        const serviceButtons = document.querySelectorAll('.service-btn');
        serviceButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.handleServiceSelection(button.dataset.service);
            });
        });

        // Handle window resize for mobile responsiveness
        window.addEventListener('resize', () => {
            this.adjustLayoutForMobile();
        });
    }

    // Initialize the chatbot
    initialize() {
        this.addMessage(this.translations[this.language].greeting, true);
        this.addMessage(this.translations[this.language].servicePrompt, true);
        this.adjustLayoutForMobile();
    }

    // Add a message to the chat
    addMessage(text, isBot = true) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isBot ? 'bot' : 'user'}`;

        // Create message content
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = text;

        messageDiv.appendChild(contentDiv);

        this.elements.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();

        if (isBot) {
            this.speak(text);
        }
    }

    // Text-to-speech function
    speak(text) {
        if ('speechSynthesis' in window) {
            // Cancel any ongoing speech
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = this.language === 'en' ? 'en-US' : 'es-ES';
            utterance.rate = 1;
            utterance.pitch = 1;
            window.speechSynthesis.speak(utterance);
        }
    }

    //

    // Toggle speech recognition
    toggleListening() {
        if (!this.recognition) {
            alert(this.translations[this.language].errorSpeechNotSupported);
            return;
        }

        if (this.isListening) {
            this.recognition.stop();
        } else {
            this.recognition.lang = this.language === 'en' ? 'en-US' : 'es-ES';
            this.recognition.start();
            this.addMessage(this.translations[this.language].speakNow, true);
        }
    }

    // Update microphone button appearance
    updateMicButton() {
        this.elements.micButton.style.backgroundColor = 
            this.isListening ? '#dc2626' : '#2563eb';
        this.elements.micButton.innerHTML = 
            this.isListening ? '🔴 Stop' : '🎤 Speak';
    }

    // Toggle between languages
    toggleLanguage() {
        this.language = this.language === 'en' ? 'es' : 'en';
        this.elements.currentLang.textContent = this.language.toUpperCase();
        this.updateUILanguage();
    }

    // Update UI elements for selected language
    updateUILanguage() {
        this.elements.userInput.placeholder = 
            this.translations[this.language].inputPlaceholder;
        
        // Update service buttons
        const serviceButtons = document.querySelectorAll('.service-btn');
        serviceButtons.forEach(button => {
            const service = button.dataset.service;
            button.textContent = this.translations[this.language][service];
        });
    }

    // Handle service selection
    handleServiceSelection(service) {
        this.bookingData.serviceType = service;
        this.addMessage(this.translations[this.language].destinationPrompt, true);
        this.currentStep = 'destination';
        this.elements.serviceSelector.style.display = 'none';
    }

    // Handle user input
    handleInput(value) {
        if (!value.trim()) {
            alert(this.translations[this.language].errorInvalidInput);
            return;
        }

        this.addMessage(value, false);
        this.elements.userInput.value = '';

        // Show processing message
        this.addMessage(this.translations[this.language].processing, true);

        // Process input based on current step
        setTimeout(() => {
            switch (this.currentStep) {
                case 'destination':
                    this.bookingData.destination = value;
                    this.addMessage(this.translations[this.language].travelersPrompt, true);
                    this.currentStep = 'travelers';
                    break;

                case 'travelers':
                    this.bookingData.travelers = value;
                    this.addMessage(this.translations[this.language].datesPrompt, true);
                    this.currentStep = 'dates';
                    break;

                case 'dates':
                    this.bookingData.dates = value;
                    this.showBookingSummary();
                    this.currentStep = 'confirmation';
                    break;

                case 'confirmation':
                    if (value.toLowerCase().includes('yes')) {
                        this.confirmBooking();
                    } else {
                        this.addMessage("Booking cancelled. How else can I help you?", true);
                        this.resetBooking();
                    }
                    break;
            }
        }, 1000); // Simulate processing delay
    }

    // Show booking summary
    showBookingSummary() {
        const summary = `
            ${this.translations[this.language].thankYou}
            
            Service: ${this.bookingData.serviceType}
            Destination: ${this.bookingData.destination}
            Travelers: ${this.bookingData.travelers}
            Dates: ${this.bookingData.dates}
            
            ${this.translations[this.language].confirmationPrompt}
        `;
        this.addMessage(summary, true);
    }

    // Confirm booking and generate reference number
    confirmBooking() {
        const reference = this.generateBookingReference();
        const confirmationMessage = 
            `${this.translations[this.language].bookingConfirmed} ${reference}`;
        this.addMessage(confirmationMessage, true);
        this.currentStep = 'complete';
        this.resetBooking();
    }

    // Generate random booking reference
    generateBookingReference() {
        return Math.random().toString(36).substring(2, 10).toUpperCase();
    }

    // Reset booking data
    resetBooking() {
        this.bookingData = {
            serviceType: '',
            destination: '',
            travelers: '',
            dates: '',
            preferences: ''
        };
        this.currentStep = 'greeting';
        this.elements.serviceSelector.style.display = 'flex';
    }

    // Scroll chat to bottom
    scrollToBottom() {
        this.elements.chatMessages.scrollTop = 
            this.elements.chatMessages.scrollHeight;
    }

    // Adjust layout for mobile devices
    adjustLayoutForMobile() {
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
            this.elements.chatMessages.style.height = 
                `${window.innerHeight - 200}px`;
        } else {
            this.elements.chatMessages.style.height = '400px';
        }
    }
}

// Initialize the chatbot when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const chatbot = new TravelChatbot();
});