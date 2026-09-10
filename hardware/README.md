# USIF Hardware Subsystem & Wiring Guide

The USIF hardware layer contains electrical schematics, pinout tables, wiring guides, and sensor datasheets for assembling physical USIF sensor nodes.

---

## File Overview

- `circuit_diagram.pdf`: Complete electrical schematic illustrating ESP32 connections with sensors, I2C LCD, RGB LED, and piezo buzzer.
- `datasheets/`: Reference documentation for supported sensors (e.g. DHT22, BME280, MPU6050, LM35).
- `pcb/`: Printed Circuit Board layout and design files.
- `wiring/`: Breadboard and terminal connection diagrams.

---

## ESP32 Hardware Pinout Reference

| Component / Peripheral | ESP32 Pin | Function |
| :--- | :--- | :--- |
| **Analog Sensor Signal** | GPIO 34 (ADC1_CH6) | Telemetry analog input |
| **RGB LED (Red)** | GPIO 25 | Red alert status indicator |
| **RGB LED (Green)** | GPIO 26 | Green trusted status indicator |
| **RGB LED (Blue)** | GPIO 27 | Blue general status indicator |
| **Piezo Buzzer** | GPIO 14 | Audible alert tone output |
| **I2C LCD (SDA)** | GPIO 21 | Data line for 16x2 I2C LCD |
| **I2C LCD (SCL)** | GPIO 22 | Clock line for 16x2 I2C LCD |
| **Power (VCC)** | 3.3V / 5V | Regulated power rails |
| **Ground (GND)** | GND | Common ground reference |
