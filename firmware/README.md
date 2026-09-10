# USIF Edge Node Firmware Subsystem

The USIF firmware layer contains modular Arduino C++ source code designed for ESP32 and ESP8266 microcontrollers.

---

## File Overview

### Main Sketch (`firmware/USIF_Firmware/`)

- `USIF_Firmware.ino`: Main sketch entry point with `setup()` and continuous `loop()` routines.

---

### Modules & Drivers

- `config.h`: Network credentials, backend endpoint URL, and device identifier configuration.
- `wifi_manager.h` / `wifi_manager.cpp`: Wi-Fi connectivity lifecycle and reconnect logic.
- `sensor_manager.h` / `sensor_manager.cpp`: Analog and digital sensor reading abstractions.
- `packet_builder.h` / `packet_builder.cpp`: Serializes telemetry readings into JSON payloads.
- `http_sender.h` / `http_sender.cpp`: Dispatches telemetry payloads via HTTP POST requests.
- `lcd_manager.h` / `lcd_manager.cpp`: Driver for 16x2 I2C liquid crystal displays.
- `led_manager.h` / `led_manager.cpp`: Multi-color RGB LED status indicator logic.
- `buzzer_manager.h` / `buzzer_manager.cpp`: Piezo buzzer alert signaling routines.
- `utils.h` / `utils.cpp`: General utility and timing helper functions.
